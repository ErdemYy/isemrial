import { PrismaClient, Role, DeviceType, WorkOrderStatus, WorkOrderPriority } from "@prisma/client";
import * as argon2 from "argon2";

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("GÜVENLİK ENGELİ: Veritabanı seed betiği üretim (production) ortamında çalıştırılamaz!");
  }

  console.log("🌱 Seeding İşEmriAl development database...");

  // Default secure hashed password for seed accounts
  const defaultPasswordHash = await argon2.hash("Parola123!", {
    type: argon2.argon2id,
  });

  // 1. Organization 1: Usta Teknik Servis (Primary Demo Workshop)
  const org1 = await prisma.organization.upsert({
    where: { slug: "usta-teknik-servis" },
    update: {},
    create: {
      name: "Usta Teknik Servis",
      slug: "usta-teknik-servis",
      phone: "0 (216) 330 45 67",
      address: "Caferağa Mah. Moda Cad. No: 42, Kadıköy / İstanbul",
    },
  });

  // Users for Org 1
  const muratUsta = await prisma.user.upsert({
    where: { email: "murat@ustateknik.com" },
    update: {},
    create: {
      email: "murat@ustateknik.com",
      fullName: "Murat Usta",
      passwordHash: defaultPasswordHash,
      phone: "0 (532) 100 20 30",
    },
  });

  const emreCan = await prisma.user.upsert({
    where: { email: "emre@ustateknik.com" },
    update: {},
    create: {
      email: "emre@ustateknik.com",
      fullName: "Emre Can",
      passwordHash: defaultPasswordHash,
      phone: "0 (533) 200 30 40",
    },
  });

  const zeynepKaya = await prisma.user.upsert({
    where: { email: "zeynep@ustateknik.com" },
    update: {},
    create: {
      email: "zeynep@ustateknik.com",
      fullName: "Zeynep Kaya",
      passwordHash: defaultPasswordHash,
      phone: "0 (534) 300 40 50",
    },
  });

  // Memberships for Org 1
  await prisma.membership.upsert({
    where: { userId_organizationId: { userId: muratUsta.id, organizationId: org1.id } },
    update: { role: Role.OWNER },
    create: { userId: muratUsta.id, organizationId: org1.id, role: Role.OWNER },
  });

  await prisma.membership.upsert({
    where: { userId_organizationId: { userId: emreCan.id, organizationId: org1.id } },
    update: { role: Role.TECHNICIAN },
    create: { userId: emreCan.id, organizationId: org1.id, role: Role.TECHNICIAN },
  });

  await prisma.membership.upsert({
    where: { userId_organizationId: { userId: zeynepKaya.id, organizationId: org1.id } },
    update: { role: Role.ADMIN },
    create: { userId: zeynepKaya.id, organizationId: org1.id, role: Role.ADMIN },
  });

  // Customers for Org 1
  const customer1 = await prisma.customer.create({
    data: {
      organizationId: org1.id,
      name: "Serdar Özkan",
      phone: "0 (532) 412 88 19",
      email: "serdar.ozkan@example.com",
      notes: "Kurumsal müşteri, faturalı işlem talep ediyor.",
    },
  });

  const customer2 = await prisma.customer.create({
    data: {
      organizationId: org1.id,
      name: "Büşra Çelik",
      phone: "0 (505) 789 23 44",
      email: "busra.celik@example.com",
      notes: "Grafik tasarımcı, MacBook verilerinin yedeklenmesi kritik.",
    },
  });

  const customer3 = await prisma.customer.create({
    data: {
      organizationId: org1.id,
      name: "Ali Kemal Erdem",
      phone: "0 (542) 654 11 02",
    },
  });

  // Work Orders for Org 1
  const wo1 = await prisma.workOrder.create({
    data: {
      organizationId: org1.id,
      orderNumber: "İE-1042",
      customerId: customer1.id,
      technicianId: muratUsta.id,
      technicianName: "Murat Usta",
      deviceType: DeviceType.TELEFON,
      deviceModel: "iPhone 13 Pro 128GB",
      deviceSerial: "DNQG92LK0D8P",
      screenPasscode: "1234",
      issueSummary: "Ekran kırık, üst dokunmatik alanda kör nokta var.",
      physicalCondition: "Sağ üst köşede darbe izi, arka cam temiz.",
      status: WorkOrderStatus.ISLEMDE,
      priority: WorkOrderPriority.ACIL,
      estimatedPrice: 4200.0,
      paidAmount: 1000.0,
      estimatedCompletion: "Bugün 17:30",
      notes: {
        create: [
          {
            organizationId: org1.id,
            authorName: "Zeynep Kaya",
            content: "Cihaz teslim alındı, müşteri acil toplantı için akşam teslim rica etti.",
          },
          {
            organizationId: org1.id,
            authorName: "Murat Usta",
            content: "Orijinal revize OLED ekran takıldı, TrueTone aktarımı yapılıyor.",
          },
        ],
      },
      timeline: {
        create: [
          {
            organizationId: org1.id,
            action: "created",
            title: "İş Emri Açıldı",
            actorName: "Zeynep Kaya",
            description: "Müşteri kabulü yapıldı ve servis fişi üretildi.",
          },
          {
            organizationId: org1.id,
            action: "status_change",
            title: "Durum Değiştirildi",
            actorName: "Murat Usta",
            oldStatus: WorkOrderStatus.YENI,
            newStatus: WorkOrderStatus.ISLEMDE,
            description: "Yeni Kayıt ➔ Tamirde / İşlemde",
          },
        ],
      },
    },
  });

  const wo2 = await prisma.workOrder.create({
    data: {
      organizationId: org1.id,
      orderNumber: "İE-1041",
      customerId: customer2.id,
      technicianId: emreCan.id,
      technicianName: "Emre Can",
      deviceType: DeviceType.BILGISAYAR,
      deviceModel: "MacBook Pro M1 13' (2020)",
      deviceSerial: "C02FK18PQ05D",
      screenPasscode: "5820",
      issueSummary: "Kahve döküldü, cihaz açılmıyor, şarj çekmiyor.",
      physicalCondition: "Klavye altı yapışkan, trackpad tıklama hissi sertleşmiş.",
      status: WorkOrderStatus.PARCA_BEKLIYOR,
      priority: WorkOrderPriority.YUKSEK,
      estimatedPrice: 7800.0,
      paidAmount: 2000.0,
      estimatedCompletion: "12 Eki 2026, 14:00",
      notes: {
        create: [
          {
            organizationId: org1.id,
            authorName: "Emre Can",
            content: "Anakart ultrasonik yıkamadan çıktı. Giriş MOSFET'i yanmış, parça sipariş edildi.",
          },
        ],
      },
      timeline: {
        create: [
          {
            organizationId: org1.id,
            action: "created",
            title: "İş Emri Açıldı",
            actorName: "Emre Can",
            description: "Servis kabulü yapıldı.",
          },
        ],
      },
    },
  });

  const wo3 = await prisma.workOrder.create({
    data: {
      organizationId: org1.id,
      orderNumber: "İE-1040",
      customerId: customer3.id,
      technicianId: muratUsta.id,
      technicianName: "Murat Usta",
      deviceType: DeviceType.TELEFON,
      deviceModel: "Samsung Galaxy S22 Ultra",
      deviceSerial: "R5CR3018VBP",
      screenPasscode: "8962",
      issueSummary: "Batarya 2 saatte bitiyor, kamera bölgesinde aşırı ısınma.",
      physicalCondition: "Kasa temiz, ekran koruyucuda kılcal çizikler.",
      status: WorkOrderStatus.ONAY_BEKLIYOR,
      priority: WorkOrderPriority.NORMAL,
      estimatedPrice: 2850.0,
      paidAmount: 0.0,
      estimatedCompletion: "13 Eki 2026, 12:00",
      notes: {
        create: [
          {
            organizationId: org1.id,
            authorName: "Murat Usta",
            content: "Orijinal batarya temin fiyatı 2.850 ₺, müşteri onayı bekleniyor.",
          },
        ],
      },
      timeline: {
        create: [
          {
            organizationId: org1.id,
            action: "created",
            title: "İş Emri Açıldı",
            actorName: "Murat Usta",
            description: "Cihaz kabulü yapıldı.",
          },
        ],
      },
    },
  });

  // 2. Organization 2: Kadıköy Bilişim & Tamir (Second Tenant for IDOR/Multi-tenancy Testing)
  const org2 = await prisma.organization.upsert({
    where: { slug: "kadikoy-bilisim" },
    update: {},
    create: {
      name: "Kadıköy Bilişim & Tamir",
      slug: "kadikoy-bilisim",
      phone: "0 (216) 414 11 22",
      address: "Osmanağa Mah. Söğütlüçeşme Cad. No: 18, Kadıköy / İstanbul",
    },
  });

  const ahmetTekin = await prisma.user.upsert({
    where: { email: "ahmet@kadikoybilisim.com" },
    update: {},
    create: {
      email: "ahmet@kadikoybilisim.com",
      fullName: "Ahmet Tekin",
      passwordHash: defaultPasswordHash,
      phone: "0 (530) 999 11 22",
    },
  });

  await prisma.membership.upsert({
    where: { userId_organizationId: { userId: ahmetTekin.id, organizationId: org2.id } },
    update: { role: Role.OWNER },
    create: { userId: ahmetTekin.id, organizationId: org2.id, role: Role.OWNER },
  });

  const org2Customer = await prisma.customer.create({
    data: {
      organizationId: org2.id,
      name: "Canan Yılmaz",
      phone: "0 (533) 999 88 77",
      email: "canan.yilmaz@example.com",
      notes: "İkinci organizasyon müşterisi.",
    },
  });

  const org2WorkOrder = await prisma.workOrder.create({
    data: {
      organizationId: org2.id,
      orderNumber: "İE-2001",
      customerId: org2Customer.id,
      technicianId: ahmetTekin.id,
      technicianName: "Ahmet Tekin",
      deviceType: DeviceType.TELEFON,
      deviceModel: "Xiaomi 13T Pro",
      deviceSerial: "XM13TPRO8899",
      screenPasscode: "9988",
      issueSummary: "Ekran çatlak, dokunmatik kısmen basıyor.",
      physicalCondition: "Kasa kenarında darbe.",
      status: WorkOrderStatus.INCELEMEDE,
      priority: WorkOrderPriority.NORMAL,
      estimatedPrice: 3500.0,
      paidAmount: 500.0,
      estimatedCompletion: "14 Eki 2026, 16:00",
      timeline: {
        create: [
          {
            organizationId: org2.id,
            action: "created",
            title: "İş Emri Açıldı",
            actorName: "Ahmet Tekin",
            description: "Kadıköy Bilişim kaydı.",
          },
        ],
      },
    },
  });

  console.log(`✅ Seed completed successfully:`);
  console.log(`   - Org 1: "${org1.name}" (${org1.id}) with 3 users, 3 customers, 3 work orders`);
  console.log(`   - Org 2: "${org2.name}" (${org2.id}) with 1 user, 1 customer, 1 work order (For IDOR tests)`);
  console.log(`   - Default Seed Password: "Parola123!"`);
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
