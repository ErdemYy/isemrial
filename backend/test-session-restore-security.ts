import { PrismaClient } from "@prisma/client";
import { AuthGuard } from "./src/common/guards/auth.guard";
import { AuthService } from "./src/auth/auth.service";
import { ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { execSync } from "child_process";
import {
  runPostRestoreSessionInvalidation,
  extractDatabaseName,
} from "./scripts/post-restore-session-invalidation";

const DEV_DB_URL = "postgresql://postgres:postgres@localhost:5433/isemrial_dev?schema=public";
const STAGING_DB_URL = "postgresql://postgres:postgres@localhost:5433/isemrial_staging?schema=public";
const TEST_EVAL_DB_URL = "postgresql://postgres:postgres@localhost:5433/isemrial_session_eval?schema=public";

function createMockContext(req: any): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => req,
      getResponse: () => ({}),
      getNext: () => ({}),
    }),
  } as unknown as ExecutionContext;
}

interface TestReportItem {
  id: string;
  name: string;
  expected: string;
  actual: string;
  passed: boolean;
}

const testResults: TestReportItem[] = [];

function recordTest(id: string, name: string, expected: string, actual: string, passed: boolean) {
  testResults.push({ id, name, expected, actual, passed });
  const icon = passed ? "✅ PASS" : "❌ FAIL";
  console.log(`${icon} [${id}] ${name}`);
  console.log(`   Beklenen: ${expected}`);
  console.log(`   Gerçek:   ${actual}\n`);
}

async function runSessionRestoreSecuritySuite() {
  console.log("\n=======================================================");
  console.log("🔒  İŞEMRİAL — FAZ 5.2.2: YEDEKTEN GERİ YÜKLEME SONRASI OTURUM GÜVENLİĞİ");
  console.log("   İzole Test DB: isemrial_session_eval (Port: 5433)");
  console.log("   Geliştirme DB: isemrial_dev (KORUNUYOR)");
  console.log("   Staging DB:    isemrial_staging (KORUNUYOR)");
  console.log("=======================================================\n");

  const prismaDev = new PrismaClient({ datasources: { db: { url: DEV_DB_URL } } });
  const prismaStaging = new PrismaClient({ datasources: { db: { url: STAGING_DB_URL } } });
  const prismaEval = new PrismaClient({ datasources: { db: { url: TEST_EVAL_DB_URL } } });

  // Record baseline counts in dev and staging to ensure they are untouched
  const devBaseline = {
    users: await prismaDev.user.count(),
    workOrders: await prismaDev.workOrder.count(),
  };
  const stagingBaseline = {
    users: await prismaStaging.user.count(),
    workOrders: await prismaStaging.workOrder.count(),
  };

  const authService = new AuthService(prismaEval as any);
  const authGuard = new AuthGuard(prismaEval as any);

  try {
    // -------------------------------------------------------------------------
    // ADIM 1: TEST KULLANICISI VE OTURUMU OLUŞTURMA
    // -------------------------------------------------------------------------
    console.log("--- BÖLÜM 1: Başlangıç Test Kullanıcısı ve Oturumu Oluşturma ---");
    const testEmail = `kemal.restore.${Date.now()}@test.com`;
    const regResult = await authService.register({
      fullName: "Kemal Usta Test",
      email: testEmail,
      password: "TestPassword123!",
      organizationName: "Kemal Elektronik Test Atolyesi",
      phone: "05551234567",
    });

    const activeTokenA = regResult.token;
    console.log(`📌 Test Kullanıcısı Oluşturuldu: ${regResult.user.email}`);
    console.log(`📌 Atölye ID: ${regResult.organization.id}`);

    // Test müşterisi ve iş emri oluştur
    const testCustomer = await prismaEval.customer.create({
      data: {
        organizationId: regResult.organization.id,
        name: "Ahmet Yılmaz Müşteri",
        phone: "05321112233",
      },
    });

    const testOrder = await prismaEval.workOrder.create({
      data: {
        organizationId: regResult.organization.id,
        orderNumber: `WO-TEST-${Date.now().toString().slice(-4)}`,
        customerId: testCustomer.id,
        deviceType: "TELEFON",
        deviceModel: "iPhone 13 Pro",
        technicianName: "Kemal Usta Test",
        issueSummary: "Ekran kırık, dokunmatik çalışmıyor",
        status: "YENI",
        priority: "NORMAL",
      },
    });

    // Oturum A'nın geçerli olduğunu AuthGuard ile doğrula
    const reqA = { cookies: { isemrial_session: activeTokenA }, headers: {} };
    let guardResultA = false;
    try {
      guardResultA = await authGuard.canActivate(createMockContext(reqA));
    } catch {
      guardResultA = false;
    }

    recordTest(
      "AUTH-01",
      "Kullanıcı Girişi ve Oturum Doğrulama",
      "AuthGuard aktif çerezi kabul etmeli (true)",
      `Guard sonucu: ${guardResultA}`,
      guardResultA === true,
    );

    // -------------------------------------------------------------------------
    // ADIM 2: NORMAL LOGOUT SONRASI OTURUM GEÇERSİZ KILMA
    // -------------------------------------------------------------------------
    console.log("--- BÖLÜM 2: Normal Çıkış (Logout) Davranışı ---");
    await authService.logout(activeTokenA);

    let logoutGuardError = "";
    try {
      await authGuard.canActivate(createMockContext(reqA));
    } catch (err: any) {
      logoutGuardError = err.message;
    }

    recordTest(
      "AUTH-02",
      "Normal Logout Sonrası Oturum Geçersizliği",
      "AuthGuard 'Oturum geçersiz' hatası ile 401 fırlatmalı",
      `Alınan hata: '${logoutGuardError}'`,
      logoutGuardError.includes("Oturum geçersiz"),
    );

    // -------------------------------------------------------------------------
    // ADIM 3: RİSKİN KANITLANMASI — YEDEKTEN DÖNEN OTURUMUN YENİDEN CANLANMASI (SESSION RESUSCITATION)
    // -------------------------------------------------------------------------
    console.log("--- BÖLÜM 3: Oturum Yeniden Canlanma (Resuscitation) Riskinin Gösterilmesi ---");
    // Kullanıcı tekrar giriş yapar ve yeni aktif token alır (Token B)
    const loginResultB = await authService.login({
      email: testEmail,
      password: "TestPassword123!",
    });
    const activeTokenB = loginResultB.token;

    // Veritabanı yedeği alınıyor (Bu yedek Token B'yi içeriyor!)
    execSync("docker exec isemrial_postgres pg_dump -U postgres --clean --if-exists -d isemrial_session_eval -f /tmp/backup_resuscitation_test.sql", {
      stdio: "ignore",
    });
    console.log("💾 'backup_resuscitation_test.sql' anlık yedeği alındı (Aktif Token B kaydedildi).");

    // Kullanıcı güvenli biçimde çıkış yapar (Token B DB'den silinir)
    await authService.logout(activeTokenB);

    const reqB = { cookies: { isemrial_session: activeTokenB }, headers: {} };
    let guardAfterLogoutB = "";
    try {
      await authGuard.canActivate(createMockContext(reqB));
    } catch (err: any) {
      guardAfterLogoutB = err.message;
    }

    console.log(`🔒 Logout sonrası durum: Token B başarıyla geçersiz kılındı ('${guardAfterLogoutB}')`);

    // Şimdi afet senaryosu: Önceki yedeği geri yüklüyoruz!
    console.log("⚠️  AFET/ROLLBACK SİMÜLASYONU: Önceki yedek geri yükleniyor...");
    execSync("docker exec isemrial_postgres psql -U postgres -d isemrial_session_eval -f /tmp/backup_resuscitation_test.sql", {
      stdio: "ignore",
    });

    // Bakalım veritabanında Token B geri geldi mi?
    let resurrectedGuardResult = false;
    try {
      resurrectedGuardResult = await authGuard.canActivate(createMockContext(reqB));
    } catch (err: any) {
      resurrectedGuardResult = false;
    }

    recordTest(
      "RISK-01",
      "Yedekten Geri Yükleme Sonrası Oturum Dirilme Riski (Session Resuscitation)",
      "Müdahale edilmezse eski çerez DB'den geri dönerek yetkisiz kabul edilir (true)",
      `Guard sonucu: ${resurrectedGuardResult}`,
      resurrectedGuardResult === true,
    );

    // -------------------------------------------------------------------------
    // ADIM 4: GÜVENLİK PROSEDÜRÜNÜN UYGULANMASI (POST-RESTORE INVALIDATION)
    // -------------------------------------------------------------------------
    console.log("--- BÖLÜM 4: Kurtarma Sonrası Oturum İptal Prosedürünün Çalıştırılması ---");
    const cleanupResult = await runPostRestoreSessionInvalidation({
      targetDb: "isemrial_session_eval",
      dbUrl: TEST_EVAL_DB_URL,
      confirm: true,
    });

    recordTest(
      "PROC-01",
      "Kurtarma Prosedürü Başarılı Yürütme",
      "Prosedür başarıyla tamamlanmalı (success: true)",
      `Sonuç: ${cleanupResult.success}, İptal Edilen: ${cleanupResult.invalidatedSessions}`,
      cleanupResult.success === true && cleanupResult.invalidatedSessions > 0,
    );

    recordTest(
      "PROC-02",
      "Kalan Oturum Sayısı Doğrulaması",
      "Veritabanında kalan oturum sayısı kesinlikle 0 olmalı",
      `Kalan oturum sayısı: ${cleanupResult.sessionCountAfter}`,
      cleanupResult.sessionCountAfter === 0,
    );

    // -------------------------------------------------------------------------
    // ADIM 5: PROSEDÜR SONRASI ESKİ ÇEREZİN REDDEDİLMESİ
    // -------------------------------------------------------------------------
    console.log("--- BÖLÜM 5: Prosedür Sonrası Eski Oturumun Engellenmesi ---");
    let guardAfterProcedure = "";
    try {
      await authGuard.canActivate(createMockContext(reqB));
    } catch (err: any) {
      guardAfterProcedure = err.message;
    }

    recordTest(
      "SEC-01",
      "Prosedür Sonrası Eski Oturumun Reddedilmesi",
      "Eski çerez AuthGuard tarafından 401 Unauthorized ile reddedilmeli",
      `Guard yanıtı: '${guardAfterProcedure}'`,
      guardAfterProcedure.includes("Oturum geçersiz"),
    );

    // -------------------------------------------------------------------------
    // ADIM 6: MEŞRU KULLANICININ YENİDEN GİRİŞ YAPABİLMESİ
    // -------------------------------------------------------------------------
    console.log("--- BÖLÜM 6: Kurtarılan Sistemde Yeniden Giriş Yapabilme ---");
    const loginResultC = await authService.login({
      email: testEmail,
      password: "TestPassword123!",
    });
    const activeTokenC = loginResultC.token;

    const reqC = { cookies: { isemrial_session: activeTokenC }, headers: {} };
    let guardResultC = false;
    try {
      guardResultC = await authGuard.canActivate(createMockContext(reqC));
    } catch {
      guardResultC = false;
    }

    recordTest(
      "AUTH-03",
      "Kurtarma Sonrası Yeni Oturum Oluşturabilme",
      "Kullanıcı şifresiyle yeni oturum açabilmeli ve AuthGuard kabul etmeli (true)",
      `Guard sonucu: ${guardResultC}`,
      guardResultC === true,
    );

    // -------------------------------------------------------------------------
    // ADIM 7: İŞ MODELLERİNİN %100 KORUNDUĞUNUN DOĞRULANMASI (SIFIR VERİ KAYBI)
    // -------------------------------------------------------------------------
    console.log("--- BÖLÜM 7: İş Modelleri Korunumu ve Veri Bütünlüğü ---");
    const preservedCustomer = await prismaEval.customer.findUnique({
      where: { id: testCustomer.id },
    });
    const preservedOrder = await prismaEval.workOrder.findUnique({
      where: { id: testOrder.id },
    });

    const isDataIntact =
      preservedCustomer !== null &&
      preservedCustomer.name === "Ahmet Yılmaz Müşteri" &&
      preservedOrder !== null &&
      preservedOrder.orderNumber === testOrder.orderNumber;

    recordTest(
      "DATA-01",
      "Müşteri ve İş Emri Kayıtlarının Korunumu",
      "Kurtarma işlemi sırasında müşteri ve iş emri verileri eksiksiz korunmalı",
      `Müşteri: ${preservedCustomer?.name}, İş Emri: ${preservedOrder?.orderNumber}`,
      isDataIntact,
    );

    // -------------------------------------------------------------------------
    // ADIM 8: PROSEDÜR GÜVENLİK KORUMALARI (SAFETY GUARDS)
    // -------------------------------------------------------------------------
    console.log("--- BÖLÜM 8: Prosedür Güvenlik Korumaları (Safety Guards) ---");

    // 8.1: Onay bayrağı eksik olduğunda abort
    let missingConfirmError = "";
    try {
      await runPostRestoreSessionInvalidation({
        targetDb: "isemrial_session_eval",
        dbUrl: TEST_EVAL_DB_URL,
        confirm: false,
      });
    } catch (err: any) {
      missingConfirmError = err.message;
    }

    recordTest(
      "SAFE-01",
      "Açık Onay Eksikliğinde İşlemi Durdurma",
      "Onay verilmediğinde işlem başlamadan hata fırlatmalı",
      `Hata: '${missingConfirmError}'`,
      missingConfirmError.includes("açık onay bayrağı"),
    );

    // 8.2: Hedef veritabanı ile URL uyuşmazlığında abort
    let mismatchError = "";
    try {
      await runPostRestoreSessionInvalidation({
        targetDb: "wrong_database_target",
        dbUrl: TEST_EVAL_DB_URL,
        confirm: true,
      });
    } catch (err: any) {
      mismatchError = err.message;
    }

    recordTest(
      "SAFE-02",
      "Hedef Veritabanı ve URL Uyuşmazlığında İşlemi Durdurma",
      "URL içindeki DB ile hedef parametresi uyuşmadığında işlem engellenmeli",
      `Hata: '${mismatchError}'`,
      mismatchError.includes("eşleşmiyor"),
    );

    // 8.3: Geliştirme veritabanı kalkanı (allowDev bayrağı yoksa abort)
    let devGuardError = "";
    try {
      await runPostRestoreSessionInvalidation({
        targetDb: "isemrial_dev",
        dbUrl: DEV_DB_URL,
        confirm: true,
        allowDev: false,
      });
    } catch (err: any) {
      devGuardError = err.message;
    }

    recordTest(
      "SAFE-03",
      "Geliştirme Veritabanı Kazara Silme Koruması",
      "isemrial_dev hedefinde allowDev=false ise oturumlar silinmemeli",
      `Hata: '${devGuardError}'`,
      devGuardError.includes("geliştirici oturumlarının yanlışlıkla silinmesini engellemek için"),
    );

    // -------------------------------------------------------------------------
    // ADIM 9: GELİŞTİRME VE STAGING VERİTABANLARININ DEĞİŞMEDİĞİNİN KANITI
    // -------------------------------------------------------------------------
    console.log("--- BÖLÜM 9: Kaynak Veritabanlarının Değişmezliği ---");
    const devCurrent = {
      users: await prismaDev.user.count(),
      workOrders: await prismaDev.workOrder.count(),
    };
    const stagingCurrent = {
      users: await prismaStaging.user.count(),
      workOrders: await prismaStaging.workOrder.count(),
    };

    const devUntouched =
      devCurrent.users === devBaseline.users && devCurrent.workOrders === devBaseline.workOrders;
    const stagingUntouched =
      stagingCurrent.users === stagingBaseline.users &&
      stagingCurrent.workOrders === stagingBaseline.workOrders;

    recordTest(
      "ISO-01",
      "Geliştirme Veritabanı Dokunulmazlığı",
      "isemrial_dev veritabanı kayıt sayıları değişmemeli",
      `Users: ${devCurrent.users}/${devBaseline.users}, Orders: ${devCurrent.workOrders}/${devBaseline.workOrders}`,
      devUntouched,
    );

    recordTest(
      "ISO-02",
      "Staging Veritabanı Dokunulmazlığı",
      "isemrial_staging veritabanı kayıt sayıları değişmemeli",
      `Users: ${stagingCurrent.users}/${stagingBaseline.users}, Orders: ${stagingCurrent.workOrders}/${stagingBaseline.workOrders}`,
      stagingUntouched,
    );

    // Temizlik: geçici yedek dosyasını sil
    try {
      execSync("docker exec isemrial_postgres rm -f /tmp/backup_resuscitation_test.sql", {
        stdio: "ignore",
      });
    } catch {}

    console.log("\n=======================================================");
    const allPassed = testResults.every((t) => t.passed);
    console.log(`📊 TOPLAM SENARYO: ${testResults.length}`);
    console.log(`🎯 BAŞARILI: ${testResults.filter((t) => t.passed).length}`);
    console.log(`❌ BAŞARISIZ: ${testResults.filter((t) => !t.passed).length}`);
    if (allPassed) {
      console.log("🏆 FAZ 5.2.2 YEDEKTEN GERİ YÜKLEME OTURUM GÜVENLİĞİ: %100 PASS");
    } else {
      console.log("❌ BAZI TESTLER BAŞARISIZ OLDU!");
    }
    console.log("=======================================================\n");

    return allPassed;
  } catch (err: any) {
    console.error("Test suiti çalışırken beklenmeyen hata:", err);
    return false;
  } finally {
    await prismaDev.$disconnect();
    await prismaStaging.$disconnect();
    await prismaEval.$disconnect();
  }
}

runSessionRestoreSecuritySuite().then((ok) => {
  if (!ok) process.exit(1);
});
