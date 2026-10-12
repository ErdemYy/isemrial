import axios from "axios";
import { execSync } from "child_process";
import { PrismaClient } from "@prisma/client";

const WEB_BASE_URL = "http://localhost:3000";
const DEV_DB_URL = "postgresql://postgres:postgres@localhost:5433/isemrial_dev?schema=public";
const STAGING_DB_URL = "postgresql://postgres:postgres@localhost:5433/isemrial_staging?schema=public";

interface StepResult {
  step: string;
  name: string;
  expected: string;
  actual: string;
  passed: boolean;
}

const results: StepResult[] = [];

function record(step: string, name: string, expected: string, actual: string, passed: boolean) {
  results.push({ step, name, expected, actual, passed });
  const icon = passed ? "✅ PASS" : "❌ FAIL";
  console.log(`${icon} [${step}] ${name}`);
  console.log(`   Beklenen: ${expected}`);
  console.log(`   Gerçek:   ${actual}\n`);
}

async function runContainerRehearsal() {
  console.log("\n=======================================================");
  console.log("🐳  İŞEMRİAL — FAZ 5.3: CONTAINER DAĞITIM VE AĞ PROVASI");
  console.log("   Hedef Web:  http://localhost:3000 (Next.js Container)");
  console.log("   Hedef API:  http://api:4000 (Docker Internal Network)");
  console.log("   Hedef DB:   db:5432 / isemrial_container_test");
  console.log("=======================================================\n");

  const prismaDev = new PrismaClient({ datasources: { db: { url: DEV_DB_URL } } });
  const prismaStaging = new PrismaClient({ datasources: { db: { url: STAGING_DB_URL } } });

  const devBaseline = { users: await prismaDev.user.count(), orders: await prismaDev.workOrder.count() };
  const stagingBaseline = { users: await prismaStaging.user.count(), orders: await prismaStaging.workOrder.count() };

  try {
    // -------------------------------------------------------------------------
    // 1. HEALTHCHECK KONTROLLERİ
    // -------------------------------------------------------------------------
    console.log("--- BÖLÜM 1: Servis Sağlık Durumu (Healthcheck) ---");
    const healthRes = await axios.get(`${WEB_BASE_URL}/api/health`, { timeout: 5000 });
    const healthData = healthRes.data;

    record(
      "DOCKER-01",
      "Frontend Proxy ve Docker Dahili Ağ Erişimi",
      "Web proxy API'ye ulaşmalı ve status: ok dönmeli",
      `HTTP ${healthRes.status}, status: ${healthData.status}, database: ${healthData.services?.database}`,
      healthRes.status === 200 && healthData.status === "ok" && healthData.services?.database === "healthy",
    );

    // -------------------------------------------------------------------------
    // 2. KULLANICI KAYDI VE OTURUM AÇMA
    // -------------------------------------------------------------------------
    console.log("--- BÖLÜM 2: Kimlik Doğrulama ve Oturum Yönetimi ---");
    const testEmail = `docker.user.${Date.now()}@atolye.local`;
    const regPayload = {
      fullName: "Docker Denetim Ustası",
      email: testEmail,
      password: "TestPassword123!",
      organizationName: "Konteyner Teknik Servis Ltd.",
      phone: "05559876543",
    };

    const regRes = await axios.post(`${WEB_BASE_URL}/api/auth/register`, regPayload, {
      headers: { "Content-Type": "application/json", Origin: "http://localhost:3000" },
    });

    const regCookies = regRes.headers["set-cookie"] || [];
    const sessionCookieHeader = regCookies.find((c) => c.startsWith("isemrial_session="));
    const sessionCookie = sessionCookieHeader ? sessionCookieHeader.split(";")[0] : "";

    record(
      "DOCKER-02",
      "Docker Ağı Üzerinden Kullanıcı Kaydı",
      "Yeni kullanıcı ve işletme başarıyla kaydedilmeli, çerez dönmeli",
      `HTTP ${regRes.status}, Email: ${regPayload.email}, Çerez var: ${Boolean(sessionCookie)}`,
      regRes.status === 201 && Boolean(sessionCookie),
    );

    // Profile doğrulama (GET /api/auth/me)
    const meRes = await axios.get(`${WEB_BASE_URL}/api/auth/me`, {
      headers: { Cookie: sessionCookie },
    });

    record(
      "DOCKER-03",
      "Doğrulanmış Oturumla Profil Sorgulama",
      "Aktif üyelik ve işletme bilgisi dönmeli",
      `HTTP ${meRes.status}, User: ${meRes.data?.data?.user?.fullName}, Org: ${meRes.data?.data?.organization?.name}`,
      meRes.status === 200 && meRes.data?.data?.organization?.name === "Konteyner Teknik Servis Ltd.",
    );

    // Logout
    const logoutRes = await axios.post(`${WEB_BASE_URL}/api/auth/logout`, {}, {
      headers: { Cookie: sessionCookie, Origin: "http://localhost:3000" },
    });

    let meAfterLogoutError = 0;
    try {
      await axios.get(`${WEB_BASE_URL}/api/auth/me`, { headers: { Cookie: sessionCookie } });
    } catch (err: any) {
      meAfterLogoutError = err.response?.status || 500;
    }

    record(
      "DOCKER-04",
      "Çıkış (Logout) ve Oturum Sonlandırma",
      "Logout sonrası eski çerez 401 Unauthorized dönmeli",
      `Logout HTTP: ${logoutRes.status}, Sonrası HTTP: ${meAfterLogoutError}`,
      logoutRes.status === 200 && meAfterLogoutError === 401,
    );

    // Tekrar giriş yapma (Login)
    const loginRes = await axios.post(
      `${WEB_BASE_URL}/api/auth/login`,
      { email: testEmail, password: "TestPassword123!" },
      { headers: { "Content-Type": "application/json", Origin: "http://localhost:3000" } },
    );

    const loginCookies = loginRes.headers["set-cookie"] || [];
    const activeCookieHeader = loginCookies.find((c) => c.startsWith("isemrial_session="));
    const activeCookie = activeCookieHeader ? activeCookieHeader.split(";")[0] : "";

    record(
      "DOCKER-05",
      "Yeniden Giriş (Login) ve Aktif Çerez Edinimi",
      "Başarılı giriş yapmalı ve yeni çerez dönmeli",
      `HTTP ${loginRes.status}, Çerez alındı: ${Boolean(activeCookie)}`,
      loginRes.status === 200 && Boolean(activeCookie),
    );

    // -------------------------------------------------------------------------
    // 3. MÜŞTERİ VE İŞ EMRİ OLUŞTURMA
    // -------------------------------------------------------------------------
    console.log("--- BÖLÜM 3: Müşteri ve İş Emri Yaşam Döngüsü ---");
    const custRes = await axios.post(
      `${WEB_BASE_URL}/api/customers`,
      { name: "Mustafa Demir", phone: "05443332211", email: "mustafa@demir.com" },
      { headers: { Cookie: activeCookie, Origin: "http://localhost:3000" } },
    );
    const customerId = custRes.data?.data?.id;

    record(
      "DOCKER-06",
      "Müşteri Kaydı Oluşturma",
      "HTTP 201 ve müşteri kaydı dönmeli",
      `HTTP ${custRes.status}, Müşteri ID: ${customerId}`,
      custRes.status === 201 && Boolean(customerId),
    );

    const orderRes = await axios.post(
      `${WEB_BASE_URL}/api/work-orders`,
      {
        customerId,
        customerName: "Mustafa Demir",
        customerPhone: "05443332211",
        deviceType: "Telefon",
        deviceModel: "iPhone 15 Pro Max",
        technicianName: "Docker Denetim Ustası",
        issueSummary: "Ekran çatlak, şarj soketi temassız",
        priority: "acil",
      },
      { headers: { Cookie: activeCookie, Origin: "http://localhost:3000" } },
    );
    const orderId = orderRes.data?.data?.id;
    const orderNumber = orderRes.data?.data?.orderNumber;

    record(
      "DOCKER-07",
      "İş Emri Kaydı Oluşturma",
      "HTTP 201 ve benzersiz iş emri no üretilmeli",
      `HTTP ${orderRes.status}, No: ${orderNumber}, ID: ${orderId}`,
      orderRes.status === 201 && Boolean(orderId) && Boolean(orderNumber),
    );

    // -------------------------------------------------------------------------
    // 4. DURUM GÜNCELLEME VE ZAMAN ÇİZELGESİ (TIMELINE)
    // -------------------------------------------------------------------------
    console.log("--- BÖLÜM 4: Durum Değişikliği ve Servis Notu ---");
    const statusRes = await axios.patch(
      `${WEB_BASE_URL}/api/work-orders/${orderId}/status`,
      { status: "ISLEMDE", note: "Cihaz söküldü, ekran değişimi başlatıldı." },
      { headers: { Cookie: activeCookie, Origin: "http://localhost:3000" } },
    );

    const noteRes = await axios.post(
      `${WEB_BASE_URL}/api/work-orders/${orderId}/notes`,
      { content: "Orijinal ekran testi başarıyla tamamlandı, yapıştırma aşamasında." },
      { headers: { Cookie: activeCookie, Origin: "http://localhost:3000" } },
    );

    const detailRes = await axios.get(`${WEB_BASE_URL}/api/work-orders/${orderId}`, {
      headers: { Cookie: activeCookie },
    });

    const orderDetail = detailRes.data?.data;
    const timelineCount = orderDetail?.timeline?.length || 0;
    const notesCount = orderDetail?.notes?.length || 0;

    record(
      "DOCKER-08",
      "Durum Değişikliği, Servis Notu ve Zaman Çizelgesi",
      "Durum islemde olmalı, en az 2 timeline olayı ve 1 servis notu bulunmalı",
      `Durum: ${orderDetail?.status}, Timeline Sayısı: ${timelineCount}, Not Sayısı: ${notesCount}`,
      orderDetail?.status?.toLowerCase() === "islemde" && timelineCount >= 2 && notesCount >= 1,
    );

    // -------------------------------------------------------------------------
    // 5. KONTEYNER YENİDEN BAŞLATMA VE VERİ KALICILIĞI (PERSISTENCE)
    // -------------------------------------------------------------------------
    console.log("--- BÖLÜM 5: Konteyner Yeniden Başlatma ve Veri Kalıcılığı ---");
    console.log("🔄 Konteynerler yeniden başlatılıyor: 'docker compose restart api web'...");
    execSync("docker compose restart api web", { stdio: "inherit" });

    // Konteynerlerin sağlıklı duruma gelmesi için kısa bekleme
    console.log("⏳ Servislerin healthy duruma gelmesi bekleniyor...");
    let restartedHealthy = false;
    for (let i = 0; i < 20; i++) {
      await new Promise((r) => setTimeout(r, 1000));
      try {
        const check = await axios.get(`${WEB_BASE_URL}/api/health`, { timeout: 2000 });
        if (check.status === 200 && check.data?.status === "ok") {
          restartedHealthy = true;
          break;
        }
      } catch {}
    }

    record(
      "DOCKER-09",
      "Konteyner Yeniden Başlatma Sonrası Sağlık Durumu",
      "Yeniden başlatılan api ve web servisleri sağlıklı dönmeli",
      `Sağlık durumu: ${restartedHealthy ? "HEALTHY" : "UNHEALTHY"}`,
      restartedHealthy,
    );

    // Yeniden başlatma sonrasında verilerin ve oturumun korunduğunu doğrula
    const postRestartDetail = await axios.get(`${WEB_BASE_URL}/api/work-orders/${orderId}`, {
      headers: { Cookie: activeCookie },
    });

    const preservedOrder = postRestartDetail.data?.data;
    const isDataPreserved =
      preservedOrder?.id === orderId &&
      preservedOrder?.orderNumber === orderNumber &&
      preservedOrder?.status?.toLowerCase() === "islemde" &&
      preservedOrder?.customerName === "Mustafa Demir";

    record(
      "DOCKER-10",
      "Yeniden Başlatma Sonrası Veri Kalıcılığı (Named Volume)",
      "İş emri ve müşteri kayıtları ile aktif oturum eksiksiz korunmalı",
      `No: ${preservedOrder?.orderNumber}, Müşteri: ${preservedOrder?.customerName}, Durum: ${preservedOrder?.status}`,
      isDataPreserved,
    );

    // -------------------------------------------------------------------------
    // 6. GELİŞTİRME VE STAGING VERİTABANLARININ DEĞİŞMEZLİĞİ
    // -------------------------------------------------------------------------
    console.log("--- BÖLÜM 6: Kaynak Geliştirme ve Staging Veritabanı Dokunulmazlığı ---");
    const devCurrent = { users: await prismaDev.user.count(), orders: await prismaDev.workOrder.count() };
    const stagingCurrent = { users: await prismaStaging.user.count(), orders: await prismaStaging.workOrder.count() };

    const devUntouched = devCurrent.users === devBaseline.users && devCurrent.orders === devBaseline.orders;
    const stagingUntouched = stagingCurrent.users === stagingBaseline.users && stagingCurrent.orders === stagingBaseline.orders;

    record(
      "ISO-01",
      "Geliştirme Veritabanı Dokunulmazlığı",
      "isemrial_dev kayıtları değişmemeli",
      `Users: ${devCurrent.users}/${devBaseline.users}, Orders: ${devCurrent.orders}/${devBaseline.orders}`,
      devUntouched,
    );

    record(
      "ISO-02",
      "Staging Veritabanı Dokunulmazlığı",
      "isemrial_staging kayıtları değişmemeli",
      `Users: ${stagingCurrent.users}/${stagingBaseline.users}, Orders: ${stagingCurrent.orders}/${stagingBaseline.orders}`,
      stagingUntouched,
    );

    console.log("\n=======================================================");
    const allPassed = results.every((r) => r.passed);
    console.log(`📊 TOPLAM SENARYO: ${results.length}`);
    console.log(`🎯 BAŞARILI: ${results.filter((r) => r.passed).length}`);
    console.log(`❌ BAŞARISIZ: ${results.filter((r) => !r.passed).length}`);
    if (allPassed) {
      console.log("🏆 FAZ 5.3 CONTAINER DAĞITIM PROVASI: %100 PASS");
    } else {
      console.log("❌ BAZI SENARYOLAR BAŞARISIZ OLDU!");
    }
    console.log("=======================================================\n");

    return allPassed;
  } catch (err: any) {
    console.error("Beklenmeyen provası hatası:", err.message, err.response?.data);
    return false;
  } finally {
    await prismaDev.$disconnect();
    await prismaStaging.$disconnect();
  }
}

runContainerRehearsal().then((ok) => {
  if (!ok) process.exit(1);
});
