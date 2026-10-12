import { PrismaClient } from "@prisma/client";

export interface InvalidationOptions {
  targetDb: string;
  dbUrl?: string;
  confirm: boolean;
  allowDev?: boolean;
}

export interface InvalidationResult {
  success: boolean;
  targetDb: string;
  sessionCountBefore: number;
  sessionCountAfter: number;
  invalidatedSessions: number;
  businessModelsIntact: boolean;
  beforeCounts: Record<string, number>;
  afterCounts: Record<string, number>;
  error?: string;
}

export function extractDatabaseName(urlStr: string): string | null {
  try {
    const url = new URL(urlStr);
    const dbName = url.pathname.replace(/^\//, "").split("?")[0];
    return dbName || null;
  } catch {
    const match = urlStr.match(/\/([^/?]+)(\?|$)/);
    return match ? match[1] : null;
  }
}

export async function runPostRestoreSessionInvalidation(
  options: InvalidationOptions,
): Promise<InvalidationResult> {
  const dbUrl = options.dbUrl || process.env.DATABASE_URL;

  if (!dbUrl) {
    throw new Error("GÜVENLİK HATASI: DATABASE_URL tanımlanmamış!");
  }

  if (!options.targetDb || options.targetDb.trim() === "") {
    throw new Error(
      "GÜVENLİK HATASI: Hedef veritabanı adı (--target-db veya RESTORE_TARGET_DB) belirtilmelidir!",
    );
  }

  const normalizedTargetDb = options.targetDb.trim().toLowerCase();
  const actualDbName = extractDatabaseName(dbUrl)?.toLowerCase();

  // 1. GÜVENLİK KONTROLÜ: Hedef Veritabanı ile URL Eşleşmesi
  if (!actualDbName || actualDbName !== normalizedTargetDb) {
    throw new Error(
      `GÜVENLİK HATASI: Belirtilen hedef veritabanı ('${normalizedTargetDb}') ile DATABASE_URL içindeki veritabanı ('${actualDbName || "belirsiz"}') eşleşmiyor! Yanlış veritabanında işlem yapılması engellendi.`,
    );
  }

  // 2. GÜVENLİK KONTROLÜ: Açık Onay Bayrağı
  if (!options.confirm) {
    throw new Error(
      "GÜVENLİK HATASI: Kurtarma sonrası oturum iptali için açık onay bayrağı (--confirm-invalidation veya CONFIRM_POST_RESTORE_INVALIDATION=YES) gereklidir. İşlem iptal edildi.",
    );
  }

  // 3. GÜVENLİK KONTROLÜ: Geliştirme Ortamı Kazara Silme Koruması
  if (normalizedTargetDb === "isemrial_dev" && !options.allowDev) {
    throw new Error(
      "GÜVENLİK KORUMASI: Geliştirme veritabanındaki ('isemrial_dev') geliştirici oturumlarının yanlışlıkla silinmesini engellemek için '--allow-dev-invalidation' bayrağı gereklidir.",
    );
  }

  const prisma = new PrismaClient({
    datasources: { db: { url: dbUrl } },
  });

  try {
    // 4. BAŞLANGIÇ SAYIMLARI (Snapshot)
    const beforeCounts = {
      users: await prisma.user.count(),
      organizations: await prisma.organization.count(),
      memberships: await prisma.membership.count(),
      customers: await prisma.customer.count(),
      workOrders: await prisma.workOrder.count(),
      workOrderNotes: await prisma.workOrderNote.count(),
      timelineEvents: await prisma.timelineEvent.count(),
    };

    const sessionCountBefore = await prisma.session.count();

    // 5. ATOMİK OTURUM İPTALİ (Transaction)
    const deletedCount = await prisma.$transaction(async (tx) => {
      const res = await tx.session.deleteMany({});
      return res.count;
    });

    // 6. BİTİŞ SAYIMLARI VE DOĞRULAMA
    const sessionCountAfter = await prisma.session.count();
    if (sessionCountAfter !== 0) {
      throw new Error(
        `KRİTİK HATA: Oturum iptali tamamlanamadı! Kalan oturum sayısı: ${sessionCountAfter}`,
      );
    }

    const afterCounts = {
      users: await prisma.user.count(),
      organizations: await prisma.organization.count(),
      memberships: await prisma.membership.count(),
      customers: await prisma.customer.count(),
      workOrders: await prisma.workOrder.count(),
      workOrderNotes: await prisma.workOrderNote.count(),
      timelineEvents: await prisma.timelineEvent.count(),
    };

    // 7. İŞ MODELLERİ KORUNUM KONTROLÜ (Zero Data Loss Check)
    let businessModelsIntact = true;
    for (const key of Object.keys(beforeCounts) as Array<keyof typeof beforeCounts>) {
      if (beforeCounts[key] !== afterCounts[key]) {
        businessModelsIntact = false;
        throw new Error(
          `KRİTİK HATA: İş modeli tablosunda (${key}) veri değişimi tespit edildi! Öncesi: ${beforeCounts[key]}, Sonrası: ${afterCounts[key]}`,
        );
      }
    }

    return {
      success: true,
      targetDb: normalizedTargetDb,
      sessionCountBefore,
      sessionCountAfter,
      invalidatedSessions: deletedCount,
      businessModelsIntact,
      beforeCounts,
      afterCounts,
    };
  } finally {
    await prisma.$disconnect();
  }
}

// CLI Execution Handler
if (require.main === module) {
  const args = process.argv.slice(2);
  const targetDbArg = args.find((a) => a.startsWith("--target-db="))?.split("=")[1];
  const confirmArg = args.includes("--confirm-invalidation");
  const allowDevArg = args.includes("--allow-dev-invalidation");
  const dbUrlArg = args.find((a) => a.startsWith("--db-url="))?.split("=")[1];

  const targetDb = targetDbArg || process.env.RESTORE_TARGET_DB || "";
  const confirm =
    confirmArg || process.env.CONFIRM_POST_RESTORE_INVALIDATION === "YES" || process.env.CONFIRM_POST_RESTORE_INVALIDATION === "true";
  const allowDev = allowDevArg || process.env.ALLOW_DEV_INVALIDATION === "true";

  console.log("\n=======================================================");
  console.log("🔒  İŞEMRİAL — YEDEKTEN GERİ YÜKLEME SONRASI OTURUM İPTALİ");
  console.log("=======================================================");
  console.log(`📌 Hedef Veritabanı: ${targetDb || "(belirtilmedi)"}`);
  console.log(`📌 Onay Bayrağı:     ${confirm ? "ONAYLANDI" : "EKSİK"}`);
  console.log("-------------------------------------------------------\n");

  runPostRestoreSessionInvalidation({
    targetDb,
    dbUrl: dbUrlArg,
    confirm,
    allowDev,
  })
    .then((result) => {
      console.log(`✅ BAŞARILI: '${result.targetDb}' veritabanında oturum iptali tamamlandı.`);
      console.log(`   - İptal Edilen Oturum Sayısı: ${result.invalidatedSessions}`);
      console.log(`   - Kalan Aktif Oturum Sayısı:   ${result.sessionCountAfter}`);
      console.log(`   - İş Modelleri Korunumu:       %100 SAĞLAM (7 modelde sıfır veri kaybı)`);
      console.log("\n📊 Model Kayıt Sayıları (Öncesi / Sonrası):");
      for (const [k, v] of Object.entries(result.afterCounts)) {
        console.log(`   * ${k.padEnd(16)}: ${v} / ${v} (KORUNDU)`);
      }
      console.log("\n=======================================================");
      console.log("🛡️  Kurtarılan veritabanı güvenli. Uygulama trafiğe açılabilir.");
      console.log("=======================================================\n");
      process.exit(0);
    })
    .catch((err: any) => {
      console.error("\n❌ İŞLEM DURDURULDU:", err.message);
      console.error("⚠️  GÜVENLİK PROTOKOLÜ: Veritabanı trafiğe AÇILMAMALIDIR!\n");
      process.exit(1);
    });
}
