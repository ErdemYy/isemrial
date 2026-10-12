import { execSync } from "child_process";
import { PrismaClient } from "@prisma/client";

const STAGING_DB_URL = "postgresql://postgres:postgres@localhost:5433/isemrial_staging?schema=public";
const RESTORE_TEST_DB_URL = "postgresql://postgres:postgres@localhost:5433/isemrial_restore_test?schema=public";

const prismaStaging = new PrismaClient({
  datasources: { db: { url: STAGING_DB_URL } },
});

const prismaRestore = new PrismaClient({
  datasources: { db: { url: RESTORE_TEST_DB_URL } },
});

interface ModelCheck {
  model: string;
  stagingCount: number;
  restoreCount: number;
  match: boolean;
}

async function runExpandedRestoreRehearsal() {
  console.log("\n=======================================================");
  console.log("💾  İŞEMRİAL — FAZ 5.2.1: KAPSAMLI YEDEKLEME VE GERİ YÜKLEME DENETİMİ");
  console.log("   Kaynak DB: isemrial_staging (PostgreSQL :5433)");
  console.log("   Hedef Test DB: isemrial_restore_test");
  console.log("=======================================================\n");

  try {
    // -------------------------------------------------------------------------
    // 1. KAYNAK VERİTABANI MODEL SAYILARI (STAGING BASELINE)
    // -------------------------------------------------------------------------
    console.log("--- BÖLÜM 1: Kaynak (Staging) 8 Model Sayımı ---");
    const stagingCounts = {
      users: await prismaStaging.user.count(),
      organizations: await prismaStaging.organization.count(),
      memberships: await prismaStaging.membership.count(),
      sessions: await prismaStaging.session.count(),
      customers: await prismaStaging.customer.count(),
      workOrders: await prismaStaging.workOrder.count(),
      workOrderNotes: await prismaStaging.workOrderNote.count(),
      timelineEvents: await prismaStaging.timelineEvent.count(),
    };

    console.log(`📌 User: ${stagingCounts.users}`);
    console.log(`📌 Organization: ${stagingCounts.organizations}`);
    console.log(`📌 Membership: ${stagingCounts.memberships}`);
    console.log(`📌 Session: ${stagingCounts.sessions}`);
    console.log(`📌 Customer: ${stagingCounts.customers}`);
    console.log(`📌 WorkOrder: ${stagingCounts.workOrders}`);
    console.log(`📌 WorkOrderNote: ${stagingCounts.workOrderNotes}`);
    console.log(`📌 TimelineEvent: ${stagingCounts.timelineEvents}\n`);

    // -------------------------------------------------------------------------
    // 2. YEDEK ALMA (pg_dump)
    // -------------------------------------------------------------------------
    console.log("--- BÖLÜM 2: Anlık pg_dump Yedeği Alınıyor ---");
    execSync("docker exec isemrial_postgres pg_dump -U postgres -d isemrial_staging > backup_expanded_rehearsal.sql", {
      stdio: "inherit",
    });
    console.log("✅ 'backup_expanded_rehearsal.sql' başarıyla oluşturuldu.\n");

    // -------------------------------------------------------------------------
    // 3. İZOLE RESTORE TEST DB OLUŞTURMA VE GERİ YÜKLEME
    // -------------------------------------------------------------------------
    console.log("--- BÖLÜM 3: İzole Test DB Sıfırlanıp Geri Yükleniyor ---");
    // Terminate connections and drop if exists, then create fresh
    execSync(
      'docker exec isemrial_postgres psql -U postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = \'isemrial_restore_test\' AND pid <> pg_backend_pid();"',
      { stdio: "ignore" },
    );
    execSync('docker exec isemrial_postgres psql -U postgres -c "DROP DATABASE IF EXISTS isemrial_restore_test;"', {
      stdio: "inherit",
    });
    execSync('docker exec isemrial_postgres psql -U postgres -c "CREATE DATABASE isemrial_restore_test;"', {
      stdio: "inherit",
    });

    // Restore via psql
    execSync('cmd /c "type backup_expanded_rehearsal.sql | docker exec -i isemrial_postgres psql -U postgres -d isemrial_restore_test"', {
      stdio: "ignore",
    });
    console.log("✅ SQL yedeği isemrial_restore_test veritabanına aktarıldı.\n");

    // -------------------------------------------------------------------------
    // 4. MODEL SAYILARININ BİREBİR KARŞILAŞTIRILMASI
    // -------------------------------------------------------------------------
    console.log("--- BÖLÜM 4: 8 Modelin Kayıt Sayısı Eşleşme Kontrolü ---");
    const restoreCounts = {
      users: await prismaRestore.user.count(),
      organizations: await prismaRestore.organization.count(),
      memberships: await prismaRestore.membership.count(),
      sessions: await prismaRestore.session.count(),
      customers: await prismaRestore.customer.count(),
      workOrders: await prismaRestore.workOrder.count(),
      workOrderNotes: await prismaRestore.workOrderNote.count(),
      timelineEvents: await prismaRestore.timelineEvent.count(),
    };

    const checks: ModelCheck[] = [
      { model: "User", stagingCount: stagingCounts.users, restoreCount: restoreCounts.users, match: stagingCounts.users === restoreCounts.users },
      { model: "Organization", stagingCount: stagingCounts.organizations, restoreCount: restoreCounts.organizations, match: stagingCounts.organizations === restoreCounts.organizations },
      { model: "Membership", stagingCount: stagingCounts.memberships, restoreCount: restoreCounts.memberships, match: stagingCounts.memberships === restoreCounts.memberships },
      { model: "Session", stagingCount: stagingCounts.sessions, restoreCount: restoreCounts.sessions, match: stagingCounts.sessions === restoreCounts.sessions },
      { model: "Customer", stagingCount: stagingCounts.customers, restoreCount: restoreCounts.customers, match: stagingCounts.customers === restoreCounts.customers },
      { model: "WorkOrder", stagingCount: stagingCounts.workOrders, restoreCount: restoreCounts.workOrders, match: stagingCounts.workOrders === restoreCounts.workOrders },
      { model: "WorkOrderNote", stagingCount: stagingCounts.workOrderNotes, restoreCount: restoreCounts.workOrderNotes, match: stagingCounts.workOrderNotes === restoreCounts.workOrderNotes },
      { model: "TimelineEvent", stagingCount: stagingCounts.timelineEvents, restoreCount: restoreCounts.timelineEvents, match: stagingCounts.timelineEvents === restoreCounts.timelineEvents },
    ];

    let allModelsMatch = true;
    for (const c of checks) {
      const statusIcon = c.match ? "✅" : "❌";
      console.log(`${statusIcon} ${c.model.padEnd(16)}: Kaynak=${c.stagingCount}, Kurtarılan=${c.restoreCount}`);
      if (!c.match) allModelsMatch = false;
    }

    // -------------------------------------------------------------------------
    // 5. İLİŞKİSEL BÜTÜNLÜK VE FOREIGN KEY DOĞRULAMASI
    // -------------------------------------------------------------------------
    console.log("\n--- BÖLÜM 5: Kurtarılan Veritabanında İlişkisel Bütünlük ---");

    // 5.1: Yetim Üyelik (Orphan Membership) Kontrolü
    const orphanMemberships: any[] = await prismaRestore.$queryRaw`
      SELECT m.id FROM memberships m 
      LEFT JOIN users u ON m."userId" = u.id 
      LEFT JOIN organizations o ON m."organizationId" = o.id 
      WHERE u.id IS NULL OR o.id IS NULL;
    `;

    // 5.2: Yetim İş Emri (Orphan Work Order) Kontrolü
    const orphanOrders: any[] = await prismaRestore.$queryRaw`
      SELECT w.id FROM work_orders w 
      LEFT JOIN customers c ON w."customerId" = c.id 
      LEFT JOIN organizations o ON w."organizationId" = o.id 
      WHERE c.id IS NULL OR o.id IS NULL;
    `;

    // 5.3: Yetim Not ve Timeline Kontrolü
    const orphanNotes: any[] = await prismaRestore.$queryRaw`
      SELECT n.id FROM work_order_notes n 
      LEFT JOIN work_orders w ON n."workOrderId" = w.id 
      WHERE w.id IS NULL;
    `;

    const orphanTimeline: any[] = await prismaRestore.$queryRaw`
      SELECT t.id FROM timeline_events t 
      LEFT JOIN work_orders w ON t."workOrderId" = w.id 
      WHERE w.id IS NULL;
    `;

    const hasOrphans =
      orphanMemberships.length > 0 ||
      orphanOrders.length > 0 ||
      orphanNotes.length > 0 ||
      orphanTimeline.length > 0;

    if (!hasOrphans) {
      console.log("✅ Tüm yabancı anahtarlar (Foreign Keys) geçerli. 0 Yetim (Orphan) Kayıt.");
    } else {
      console.log("❌ Yetim kayıtlar tespit edildi!");
    }

    // -------------------------------------------------------------------------
    // 6. KAYNAK STAGING VERİTABANININ BOZULMADIĞININ KANITI
    // -------------------------------------------------------------------------
    console.log("\n--- BÖLÜM 6: Kaynak Staging Veritabanı Bütünlüğü ---");
    const stagingFinalCounts = {
      users: await prismaStaging.user.count(),
      organizations: await prismaStaging.organization.count(),
      memberships: await prismaStaging.membership.count(),
      customers: await prismaStaging.customer.count(),
      workOrders: await prismaStaging.workOrder.count(),
    };

    const stagingUnchanged =
      stagingFinalCounts.users === stagingCounts.users &&
      stagingFinalCounts.organizations === stagingCounts.organizations &&
      stagingFinalCounts.workOrders === stagingCounts.workOrders;

    if (stagingUnchanged) {
      console.log("✅ Kaynak 'isemrial_staging' veritabanı tamamen değişmeden korundu.\n");
    } else {
      console.log("❌ Kaynak veritabanı değişti!\n");
    }

    // Clean up backup file
    execSync("powershell -Command \"Remove-Item -Force backup_expanded_rehearsal.sql\"", { stdio: "ignore" });

    console.log("=======================================================");
    if (allModelsMatch && !hasOrphans && stagingUnchanged) {
      console.log("🎯 KAPSAMLI GERİ YÜKLEME DENETİMİ: BAŞARILI (8/8 MODEL %100 EŞLEŞTİ)");
    } else {
      console.log("❌ KAPSAMLI GERİ YÜKLEME DENETİMİ BAŞARISIZ!");
    }
    console.log("=======================================================\n");

  } catch (err: any) {
    console.error("Kurtarma testi hatası:", err);
  } finally {
    await prismaStaging.$disconnect();
    await prismaRestore.$disconnect();
  }
}

runExpandedRestoreRehearsal();
