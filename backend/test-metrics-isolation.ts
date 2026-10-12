import axios from "axios";
import { PrismaClient, WorkOrderStatus } from "@prisma/client";

const PROXY_API = "http://localhost:3000/api";
const STAGING_DB_URL = "postgresql://postgres:postgres@localhost:5433/isemrial_staging?schema=public";

const prisma = new PrismaClient({
  datasources: { db: { url: STAGING_DB_URL } },
});

interface MetricTestResult {
  step: number;
  name: string;
  status: "PASS" | "FAIL";
  details: string;
}

const results: MetricTestResult[] = [];

function record(step: number, name: string, status: "PASS" | "FAIL", details: string) {
  results.push({ step, name, status, details });
  const icon = status === "PASS" ? "✅" : "❌";
  console.log(`${icon} [Adım ${step}] ${name}: ${status}`);
  console.log(`   ${details}\n`);
}

async function runMetricsIsolationTest() {
  console.log("\n=======================================================");
  console.log("📊  İŞEMRİAL — FAZ 5.2.1: DASHBOARD METRİKLERİ VE TENANT İZOLASYONU DENETİMİ");
  console.log("   Hedef API Proxy: http://localhost:3000/api");
  console.log("   Veritabanı: isemrial_staging (PostgreSQL :5433)");
  console.log("=======================================================\n");

  try {
    // -------------------------------------------------------------------------
    // 1. BAŞLANGIÇ GERÇEK VERİTABANI ANALİZİ (BASELINE)
    // -------------------------------------------------------------------------
    console.log("--- BÖLÜM 1: Veritabanı Başlangıç Durum Analizi ---");

    const orgs = await prisma.organization.findMany({
      include: {
        customers: true,
        workOrders: true,
      },
      orderBy: { name: "asc" },
    });

    const orgA = orgs.find((o) => o.slug === "usta-teknik-servis") || orgs[0];
    const orgB = orgs.find((o) => o.slug === "kadikoy-bilisim") || orgs[1];

    if (!orgA || !orgB) {
      throw new Error("Org A veya Org B veritabanında bulunamadı!");
    }

    // Baseline counts calculated directly from DB
    const baselineA = {
      id: orgA.id,
      name: orgA.name,
      totalOrders: orgA.workOrders.length,
      totalCustomers: orgA.customers.length,
      inProgressCount: orgA.workOrders.filter((w) => w.status === WorkOrderStatus.ISLEMDE).length,
    };

    const baselineB = {
      id: orgB.id,
      name: orgB.name,
      totalOrders: orgB.workOrders.length,
      totalCustomers: orgB.customers.length,
      inProgressCount: orgB.workOrders.filter((w) => w.status === WorkOrderStatus.ISLEMDE).length,
    };

    console.log(`📌 İşletme A (${baselineA.name}) Başlangıç: ${baselineA.totalOrders} İş Emri, ${baselineA.totalCustomers} Müşteri, ${baselineA.inProgressCount} İşlemde`);
    console.log(`📌 İşletme B (${baselineB.name}) Başlangıç: ${baselineB.totalOrders} İş Emri, ${baselineB.totalCustomers} Müşteri, ${baselineB.inProgressCount} İşlemde\n`);

    // -------------------------------------------------------------------------
    // 2. YENİ İŞLETME C KAYDI (TEMİZ BASELINE: 0)
    // -------------------------------------------------------------------------
    console.log("--- BÖLÜM 2: 3. İşletme Kaydı (Org C) ---");
    const orgCEmail = `anadolu-${Date.now()}@anadoluelektronik.local`;
    const regCRes = await axios.post(
      `${PROXY_API}/auth/register`,
      {
        organizationName: "Anadolu Elektronik Staging",
        fullName: "Kemal Demir",
        email: orgCEmail,
        password: "Parola123!",
        phone: "0 (535) 444 33 22",
      },
      { headers: { Origin: "http://localhost:3000" } },
    );

    const cookieC = regCRes.headers["set-cookie"]![0].split(";")[0];
    const orgCId = regCRes.data.data.organization.id;
    const orgCName = regCRes.data.data.organization.name;
    console.log(`📌 İşletme C (${orgCName}) Başarıyla Kaydedildi (ID: ${orgCId})\n`);

    // -------------------------------------------------------------------------
    // ADIM 1: İşletme A ile Giriş ve Başlangıç Metriklerinin Doğrulanması
    // -------------------------------------------------------------------------
    const loginARes = await axios.post(
      `${PROXY_API}/auth/login`,
      { email: "murat@ustateknik.com", password: "Parola123!" },
      { headers: { Origin: "http://localhost:3000" } },
    );
    const cookieA = loginARes.headers["set-cookie"]![0].split(";")[0];

    const metricsARes1 = await axios.get(`${PROXY_API}/work-orders/metrics`, {
      headers: { Cookie: cookieA },
    });
    const mA1 = metricsARes1.data.data;

    if (mA1.totalOrders === baselineA.totalOrders && mA1.totalCustomers === baselineA.totalCustomers) {
      record(
        1,
        "İşletme A Başlangıç Metrikleri",
        "PASS",
        `İşletme A metrikleri veritabanı gerçek sayılarıyla birebir eşleşti: ${mA1.totalOrders} iş emri, ${mA1.totalCustomers} müşteri. Diğer işletmeler sayılmadı.`,
      );
    } else {
      record(
        1,
        "İşletme A Başlangıç Metrikleri",
        "FAIL",
        `Uyuşmazlık! Beklenen: ${baselineA.totalOrders} sipariş / ${baselineA.totalCustomers} müşteri. Gelen: ${mA1.totalOrders} sipariş / ${mA1.totalCustomers} müşteri.`,
      );
    }

    // -------------------------------------------------------------------------
    // ADIM 2: İşletme B Başlangıç Metrikleri
    // -------------------------------------------------------------------------
    const loginBRes = await axios.post(
      `${PROXY_API}/auth/login`,
      { email: "ahmet@kadikoybilisim.com", password: "Parola123!" },
      { headers: { Origin: "http://localhost:3000" } },
    );
    const cookieB = loginBRes.headers["set-cookie"]![0].split(";")[0];

    const metricsBRes1 = await axios.get(`${PROXY_API}/work-orders/metrics`, {
      headers: { Cookie: cookieB },
    });
    const mB1 = metricsBRes1.data.data;

    if (mB1.totalOrders === baselineB.totalOrders && mB1.totalCustomers === baselineB.totalCustomers) {
      record(
        2,
        "İşletme B Başlangıç Metrikleri",
        "PASS",
        `İşletme B metrikleri izole: ${mB1.totalOrders} iş emri, ${mB1.totalCustomers} müşteri. İşletme A (${mA1.totalOrders} iş emri) karışmadı.`,
      );
    } else {
      record(
        2,
        "İşletme B Başlangıç Metrikleri",
        "FAIL",
        `Uyuşmazlık! Beklenen: ${baselineB.totalOrders} sipariş. Gelen: ${mB1.totalOrders} sipariş.`,
      );
    }

    // -------------------------------------------------------------------------
    // ADIM 3: Temiz İşletme C Başlangıç Metrikleri (Sıfır İzolasyonu)
    // -------------------------------------------------------------------------
    const metricsCRes1 = await axios.get(`${PROXY_API}/work-orders/metrics`, {
      headers: { Cookie: cookieC },
    });
    const mC1 = metricsCRes1.data.data;

    if (mC1.totalOrders === 0 && mC1.totalCustomers === 0 && mC1.inProgressCount === 0) {
      record(
        3,
        "Yeni İşletme C Sıfır Metrik İzolasyonu",
        "PASS",
        `Temiz işletme metrikleri sıfır (0 iş emri, 0 müşteri). Sistem genelindeki mevcut ${baselineA.totalOrders + baselineB.totalOrders} iş emrinden hiçbir veri sızmadı.`,
      );
    } else {
      record(
        3,
        "Yeni İşletme C Sıfır Metrik İzolasyonu",
        "FAIL",
        `Sızıntı! Yeni işletmede görülen sipariş: ${mC1.totalOrders}, müşteri: ${mC1.totalCustomers}.`,
      );
    }

    // -------------------------------------------------------------------------
    // ADIM 4: İşletme A'da Müşteri ve İş Emri Oluşturma ve Metrik Değişimi
    // -------------------------------------------------------------------------
    const newCustA = await axios.post(
      `${PROXY_API}/customers`,
      {
        name: "Denetim Müşterisi A (Faz 5.2.1)",
        phone: "0 (531) 111 22 33",
        email: "denetimA@test.local",
      },
      { headers: { Cookie: cookieA, Origin: "http://localhost:3000" } },
    );

    const newOrderA = await axios.post(
      `${PROXY_API}/work-orders`,
      {
        customerId: newCustA.data.data.id,
        customerName: "Denetim Müşterisi A (Faz 5.2.1)",
        customerPhone: "0 (531) 111 22 33",
        deviceType: "BILGISAYAR",
        deviceModel: "Lenovo ThinkPad T14 Gen 3",
        issueSummary: "Metrik izolasyonu doğrulama cihazı",
        priority: "NORMAL",
        technicianName: "Murat Usta",
        estimatedPrice: 1800,
        paidAmount: 0,
      },
      { headers: { Cookie: cookieA, Origin: "http://localhost:3000" } },
    );

    const orderAId = newOrderA.data.data.id;

    const metricsARes2 = await axios.get(`${PROXY_API}/work-orders/metrics`, {
      headers: { Cookie: cookieA },
    });
    const mA2 = metricsARes2.data.data;

    if (
      mA2.totalOrders === baselineA.totalOrders + 1 &&
      mA2.totalCustomers === baselineA.totalCustomers + 1
    ) {
      record(
        4,
        "İşletme A Yeni Kayıt Metrik Artışı",
        "PASS",
        `İşletme A sayaçları tam olarak +1 arttı: ${mA1.totalOrders} -> ${mA2.totalOrders} iş emri, ${mA1.totalCustomers} -> ${mA2.totalCustomers} müşteri.`,
      );
    } else {
      record(
        4,
        "İşletme A Yeni Kayıt Metrik Artışı",
        "FAIL",
        `Sayaç artışı hatalı: Beklenen ${baselineA.totalOrders + 1}, Gelen ${mA2.totalOrders}`,
      );
    }

    // -------------------------------------------------------------------------
    // ADIM 5: İşletme A'daki Kaydın İşletme B'yi ETKİLEMEDİĞİNİN Doğrulanması
    // -------------------------------------------------------------------------
    const metricsBRes2 = await axios.get(`${PROXY_API}/work-orders/metrics`, {
      headers: { Cookie: cookieB },
    });
    const mB2 = metricsBRes2.data.data;

    if (
      mB2.totalOrders === baselineB.totalOrders &&
      mB2.totalCustomers === baselineB.totalCustomers
    ) {
      record(
        5,
        "İşletme B Sayaç Sabitliği (A'daki Değişiklikten Etkilenmeme)",
        "PASS",
        `İşletme B sayaçları tamamen sabit kaldı: ${mB2.totalOrders} iş emri, ${mB2.totalCustomers} müşteri. İşletme A'da eklenen kayıt B'ye sızmadı.`,
      );
    } else {
      record(
        5,
        "İşletme B Sayaç Sabitliği (A'daki Değişiklikten Etkilenmeme)",
        "FAIL",
        `Sızıntı! İşletme B sayaçları değişti: ${baselineB.totalOrders} -> ${mB2.totalOrders}`,
      );
    }

    // -------------------------------------------------------------------------
    // ADIM 6: İşletme A'daki Kaydın İşletme C'yi ETKİLEMEDİĞİNİN Doğrulanması
    // -------------------------------------------------------------------------
    const metricsCRes2 = await axios.get(`${PROXY_API}/work-orders/metrics`, {
      headers: { Cookie: cookieC },
    });
    const mC2 = metricsCRes2.data.data;

    if (mC2.totalOrders === 0 && mC2.totalCustomers === 0) {
      record(
        6,
        "İşletme C Sayaç Sabitliği (Sıfırın Korunması)",
        "PASS",
        `İşletme C sayaçları 0 olarak kaldı (0 iş emri, 0 müşteri). Cross-tenant kirliliği sıfır.`,
      );
    } else {
      record(
        6,
        "İşletme C Sayaç Sabitliği (Sıfırın Korunması)",
        "FAIL",
        `Sızıntı! İşletme C sayaçları 0 değil: ${mC2.totalOrders}`,
      );
    }

    // -------------------------------------------------------------------------
    // ADIM 7: Durum Değişikliği ve Yalnızca İlgili İşletmenin Durum Sayacı Değişimi
    // -------------------------------------------------------------------------
    await axios.patch(
      `${PROXY_API}/work-orders/${orderAId}/status`,
      { status: "islemde", note: "Faz 5.2.1 durum sayacı izolasyon denetimi" },
      { headers: { Cookie: cookieA, Origin: "http://localhost:3000" } },
    );

    const metricsARes3 = await axios.get(`${PROXY_API}/work-orders/metrics`, {
      headers: { Cookie: cookieA },
    });
    const metricsBRes3 = await axios.get(`${PROXY_API}/work-orders/metrics`, {
      headers: { Cookie: cookieB },
    });
    const metricsCRes3 = await axios.get(`${PROXY_API}/work-orders/metrics`, {
      headers: { Cookie: cookieC },
    });

    const mA3 = metricsARes3.data.data;
    const mB3 = metricsBRes3.data.data;
    const mC3 = metricsCRes3.data.data;

    const inProgressDiffA = mA3.inProgressCount - mA1.inProgressCount;
    const inProgressDiffB = mB3.inProgressCount - mB1.inProgressCount;
    const inProgressDiffC = mC3.inProgressCount - mC1.inProgressCount;

    if (inProgressDiffA === 1 && inProgressDiffB === 0 && inProgressDiffC === 0) {
      record(
        7,
        "Durum Sayacı İzolasyonu (İşlemde Sayacı)",
        "PASS",
        `İşletme A'nın işlemde sayacı +1 arttı (${mA1.inProgressCount} -> ${mA3.inProgressCount}); İşletme B (${mB3.inProgressCount}) ve İşletme C (${mC3.inProgressCount}) sayaçları hiç değişmedi.`,
      );
    } else {
      record(
        7,
        "Durum Sayacı İzolasyonu (İşlemde Sayacı)",
        "FAIL",
        `Durum sayacı hatası: A farkı=${inProgressDiffA}, B farkı=${inProgressDiffB}, C farkı=${inProgressDiffC}`,
      );
    }

    // -------------------------------------------------------------------------
    // ADIM 8: İşletme C'de Bağımsız Kayıt Açılması ve A/B'nin Etkilenmemesi
    // -------------------------------------------------------------------------
    const newCustC = await axios.post(
      `${PROXY_API}/customers`,
      {
        name: "Anadolu Müşterisi C",
        phone: "0 (536) 777 88 99",
      },
      { headers: { Cookie: cookieC, Origin: "http://localhost:3000" } },
    );

    await axios.post(
      `${PROXY_API}/work-orders`,
      {
        customerId: newCustC.data.data.id,
        customerName: "Anadolu Müşterisi C",
        customerPhone: "0 (536) 777 88 99",
        deviceType: "TABLET",
        deviceModel: "iPad Air 5. Nesil",
        issueSummary: "Ekran kırık, batarya şişmiş",
        priority: "ACIL",
        technicianName: "Kemal Usta",
        estimatedPrice: 3500,
        paidAmount: 1000,
      },
      { headers: { Cookie: cookieC, Origin: "http://localhost:3000" } },
    );

    const mAFinal = (await axios.get(`${PROXY_API}/work-orders/metrics`, { headers: { Cookie: cookieA } })).data.data;
    const mBFinal = (await axios.get(`${PROXY_API}/work-orders/metrics`, { headers: { Cookie: cookieB } })).data.data;
    const mCFinal = (await axios.get(`${PROXY_API}/work-orders/metrics`, { headers: { Cookie: cookieC } })).data.data;

    if (
      mCFinal.totalOrders === 1 &&
      mCFinal.totalCustomers === 1 &&
      mAFinal.totalOrders === mA3.totalOrders &&
      mBFinal.totalOrders === mB3.totalOrders
    ) {
      record(
        8,
        "Ters Yönlü İzolasyon (C'deki Kaydın A ve B'ye Etkisi)",
        "PASS",
        `İşletme C bağımsız olarak 1 iş emri ve 1 müşteri oldu. İşletme A (${mAFinal.totalOrders}) ve İşletme B (${mBFinal.totalOrders}) sayaçları kesinlikle değişmedi.`,
      );
    } else {
      record(
        8,
        "Ters Yönlü İzolasyon (C'deki Kaydın A ve B'ye Etkisi)",
        "FAIL",
        `Sayaç izolasyonu bozuldu! C=${mCFinal.totalOrders}, A=${mAFinal.totalOrders}, B=${mBFinal.totalOrders}`,
      );
    }

    // -------------------------------------------------------------------------
    // ADIM 9: Request Body ile organizationId Manipülasyon Engeli
    // -------------------------------------------------------------------------
    try {
      await axios.post(
        `${PROXY_API}/work-orders`,
        {
          customerId: newCustA.data.data.id,
          customerName: "Sahte Tenant Enjeksiyonu",
          customerPhone: "05320000000",
          deviceType: "TELEFON",
          deviceModel: "Test Phone",
          issueSummary: "Tenant body injection denemesi",
          priority: "NORMAL",
          organizationId: orgB.id, // Trying to force order into Org B while logged in as Org A
        },
        { headers: { Cookie: cookieA, Origin: "http://localhost:3000" } },
      );
      record(
        9,
        "Body ile organizationId Manipülasyon Engeli",
        "FAIL",
        "Body içindeki sahte organizationId kabul edildi!",
      );
    } catch (bodyErr: any) {
      if (bodyErr.response?.status === 400) {
        record(
          9,
          "Body ile organizationId Manipülasyon Engeli",
          "PASS",
          "Request body içine enjekte edilen sahte organizationId, ValidationPipe tarafından 400 Bad Request ile doğrudan reddedildi.",
        );
      } else {
        record(
          9,
          "Body ile organizationId Manipülasyon Engeli",
          "FAIL",
          `Beklenmeyen yanıt: ${bodyErr.response?.status}`,
        );
      }
    }

    // -------------------------------------------------------------------------
    // ADIM 10: Çapraz Kiracı Kayıt Okuma Engeli (IDOR)
    // -------------------------------------------------------------------------
    try {
      await axios.get(`${PROXY_API}/work-orders/${orderAId}`, {
        headers: { Cookie: cookieB }, // Org B tries to read Org A's newly created order
      });
      record(
        10,
        "Çapraz Kiracı Kayıt Okuma Engeli (IDOR)",
        "FAIL",
        "İşletme B kullanıcısı, İşletme A'nın yeni iş emrini okuyabildi!",
      );
    } catch (idorErr: any) {
      if (idorErr.response?.status === 404) {
        record(
          10,
          "Çapraz Kiracı Kayıt Okuma Engeli (IDOR)",
          "PASS",
          "İşletme B kullanıcısı İşletme A'nın iş emrini ID ile doğrudan sorguladığında 404 Not Found döndü (Varlık bilgisi gizlendi, Sıfır IDOR).",
        );
      } else {
        record(
          10,
          "Çapraz Kiracı Kayıt Okuma Engeli (IDOR)",
          "FAIL",
          `Beklenmeyen yanıt: ${idorErr.response?.status}`,
        );
      }
    }

  } catch (globalErr: any) {
    console.error("Test yürütme hatası:", globalErr);
  } finally {
    await prisma.$disconnect();
  }

  console.log("\n=======================================================");
  const passCount = results.filter((r) => r.status === "PASS").length;
  const failCount = results.filter((r) => r.status === "FAIL").length;
  console.log(`🎯 METRİK İZOLASYONU TEST SONUCU: ${passCount} PASSED, ${failCount} FAILED (Toplam: ${results.length})`);
  console.log("=======================================================\n");
}

runMetricsIsolationTest();
