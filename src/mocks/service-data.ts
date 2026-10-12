export type WorkOrderStatus =
  | "yeni"
  | "incelemede"
  | "teklif_bekliyor"
  | "onay_bekliyor"
  | "islemde"
  | "parca_bekliyor"
  | "hazir"
  | "teslim_edildi"
  | "iptal";

export type WorkOrderPriority = "dusuk" | "normal" | "yuksek" | "acil";

export interface StatusMeta {
  label: string;
  badgeBg: string;
  badgeText: string;
  dotColor: string;
  borderColor: string;
}

/* WCAG 2.2 AA (>= 4.5:1) ve AAA uyumlu semantik durum eşlemeleri */
export const STATUS_MAP: Record<WorkOrderStatus, StatusMeta> = {
  hazir: {
    label: "Teslime Hazır",
    badgeBg: "#E6F7EE",
    badgeText: "#087443", // Kontrast 5.29:1 (PASS AA)
    dotColor: "#12B76A",
    borderColor: "#A6F4C5",
  },
  islemde: {
    label: "Tamirde / İşlemde",
    badgeBg: "#EFF8FF",
    badgeText: "#175CD3", // Kontrast 5.86:1 (PASS AA)
    dotColor: "#2E90FA",
    borderColor: "#B2DDFF",
  },
  onay_bekliyor: {
    label: "Onay Bekliyor",
    badgeBg: "#FFFAEB",
    badgeText: "#8C3B00", // Kontrast 7.30:1 (PASS AAA)
    dotColor: "#F79009",
    borderColor: "#FEDF89",
  },
  parca_bekliyor: {
    label: "Parça Bekliyor",
    badgeBg: "#FEF3F2",
    badgeText: "#B42318", // Kontrast 6.50:1 (PASS AA)
    dotColor: "#F04438",
    borderColor: "#FECDCA",
  },
  incelemede: {
    label: "İncelemede",
    badgeBg: "#F0F9FF",
    badgeText: "#026AA2", // Kontrast 5.91:1 (PASS AA)
    dotColor: "#0BA5EC",
    borderColor: "#B9E6FE",
  },
  yeni: {
    label: "Yeni Kayıt",
    badgeBg: "#F2F4F7",
    badgeText: "#344054", // Kontrast 9.20:1 (PASS AAA)
    dotColor: "#667085",
    borderColor: "#D0D5DD",
  },
  teklif_bekliyor: {
    label: "Teklif Bekliyor",
    badgeBg: "#F8F9FC",
    badgeText: "#363F72", // Kontrast 9.05:1 (PASS AAA)
    dotColor: "#6172F3",
    borderColor: "#D5D9EB",
  },
  teslim_edildi: {
    label: "Teslim Edildi",
    badgeBg: "#F2F4F7",
    badgeText: "#344054", // Kontrast 9.20:1 (PASS AAA)
    dotColor: "#667085",
    borderColor: "#D0D5DD",
  },
  iptal: {
    label: "İptal Edildi",
    badgeBg: "#F2F4F7",
    badgeText: "#475467", // Kontrast 7.74:1 (PASS AAA)
    dotColor: "#98A2B3",
    borderColor: "#D0D5DD",
  },
};

export const PRIORITY_MAP: Record<WorkOrderPriority, { label: string; color: string; bg: string }> = {
  dusuk: { label: "Düşük", color: "#4E5C55", bg: "#EFF3F0" },
  normal: { label: "Normal", color: "#344054", bg: "#EAF0EC" },
  yuksek: { label: "Yüksek", color: "#8C3B00", bg: "#FFFAEB" },
  acil: { label: "Acil", color: "#B42318", bg: "#FEF3F2" },
};

export interface Technician {
  id: string;
  name: string;
  role: string;
}

export const MOCK_TECHNICIANS: Technician[] = [
  { id: "tech-1", name: "Murat Usta", role: "Kıdemli Usta (Donanım/BGA)" },
  { id: "tech-2", name: "Emre Can", role: "Bilgisayar & Anakart Uzmanı" },
  { id: "tech-3", name: "Zeynep Kaya", role: "Ön Büro & Servis Danışmanı" },
];

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  createdAt: string;
  notes?: string;
}

export interface WorkOrderNote {
  id: string;
  createdAt: string;
  author: string;
  content: string;
}

export interface TimelineEvent {
  id: string;
  timestamp: string;
  action: "created" | "status_change" | "note_added" | "price_updated";
  title: string;
  actor: string;
  description?: string;
  oldStatus?: WorkOrderStatus;
  newStatus?: WorkOrderStatus;
}

export interface WorkOrderItem {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  deviceType: "Telefon" | "Bilgisayar" | "Tablet" | "Diğer";
  deviceModel: string;
  deviceSerial: string;
  screenPasscode?: string;
  issueSummary: string;
  physicalCondition: string;
  status: WorkOrderStatus;
  priority: WorkOrderPriority;
  technicianName: string;
  createdAt: string;
  estimatedCompletion: string;
  estimatedPrice: number;
  paidAmount: number;
  notes: WorkOrderNote[];
  timeline: TimelineEvent[];
}

export const MOCK_CUSTOMERS: Customer[] = [
  {
    id: "cust-1",
    name: "Serdar Özkan",
    phone: "0 (532) 412 88 19",
    email: "serdar.ozkan@example.com",
    createdAt: "01 Eki 2026",
    notes: "Kurumsal müşteri, faturalı işlem talep ediyor.",
  },
  {
    id: "cust-2",
    name: "Büşra Çelik",
    phone: "0 (505) 789 23 44",
    email: "busra.celik@example.com",
    createdAt: "03 Eki 2026",
    notes: "Grafik tasarımcı, MacBook verilerinin yedeklenmesi kritik.",
  },
  {
    id: "cust-3",
    name: "Ali Kemal Erdem",
    phone: "0 (542) 654 11 02",
    createdAt: "05 Eki 2026",
  },
  {
    id: "cust-4",
    name: "Mustafa Yıldız",
    phone: "0 (533) 220 90 71",
    email: "mustafa.yildiz@example.com",
    createdAt: "08 Eki 2026",
  },
  {
    id: "cust-5",
    name: "Ayşe Demir",
    phone: "0 (535) 901 34 56",
    createdAt: "09 Eki 2026",
  },
  {
    id: "cust-6",
    name: "Kemal Sunal Ticaret",
    phone: "0 (216) 444 01 22",
    email: "muhasebe@kemalsunal.com.tr",
    createdAt: "10 Eki 2026",
    notes: "Ofis tabletleri periyodik bakımı.",
  },
];

export const MOCK_WORK_ORDERS: WorkOrderItem[] = [
  {
    id: "wo-1",
    orderNumber: "İE-1042",
    customerId: "cust-1",
    customerName: "Serdar Özkan",
    customerPhone: "0 (532) 412 88 19",
    deviceType: "Telefon",
    deviceModel: "iPhone 13 Pro 128GB",
    deviceSerial: "DNQG92LK0D8P",
    screenPasscode: "1234",
    issueSummary: "Ekran kırık, üst dokunmatik alanda kör nokta var.",
    physicalCondition: "Sağ üst köşede darbe izi, arka cam temiz.",
    status: "islemde",
    priority: "acil",
    technicianName: "Murat Usta",
    createdAt: "10 Eki 2026, 10:15",
    estimatedCompletion: "Bugün 17:30",
    estimatedPrice: 4200,
    paidAmount: 1000,
    notes: [
      {
        id: "note-1-1",
        createdAt: "10 Eki 2026, 10:30",
        author: "Zeynep Kaya",
        content: "Cihaz teslim alındı, müşteri acil toplantı için akşam teslim rica etti.",
      },
      {
        id: "note-1-2",
        createdAt: "10 Eki 2026, 11:45",
        author: "Murat Usta",
        content: "Orijinal revize OLED ekran takıldı, TrueTone aktarımı yapılıyor.",
      },
    ],
    timeline: [
      {
        id: "tl-1-1",
        timestamp: "10 Eki 2026, 10:15",
        action: "created",
        title: "İş Emri Açıldı",
        actor: "Zeynep Kaya",
        description: "Müşteri kabulü yapıldı ve servis fişi üretildi.",
      },
      {
        id: "tl-1-2",
        timestamp: "10 Eki 2026, 11:30",
        action: "status_change",
        title: "Durum Değiştirildi",
        actor: "Murat Usta",
        description: "Yeni Kayıt ➔ Tamirde / İşlemde",
        oldStatus: "yeni",
        newStatus: "islemde",
      },
    ],
  },
  {
    id: "wo-2",
    orderNumber: "İE-1041",
    customerId: "cust-2",
    customerName: "Büşra Çelik",
    customerPhone: "0 (505) 789 23 44",
    deviceType: "Bilgisayar",
    deviceModel: "MacBook Pro M1 13' (2020)",
    deviceSerial: "C02F812PMD6R",
    issueSummary: "Kahve döküldü, cihaz açılmıyor, şarj çekmiyor.",
    physicalCondition: "Klavyede yapışkanlık var, alt kapak vidaları orijinal.",
    status: "parca_bekliyor",
    priority: "yuksek",
    technicianName: "Emre Can",
    createdAt: "09 Eki 2026, 16:40",
    estimatedCompletion: "12 Eki 2026, 14:00",
    estimatedPrice: 7800,
    paidAmount: 0,
    notes: [
      {
        id: "note-2-1",
        createdAt: "09 Eki 2026, 17:00",
        author: "Emre Can",
        content: "Ultrasonik anakart temizliği yapıldı. Şarj entegresi (CD3217) arızalı, tedarikçiden sipariş edildi.",
      },
    ],
    timeline: [
      {
        id: "tl-2-1",
        timestamp: "09 Eki 2026, 16:40",
        action: "created",
        title: "İş Emri Açıldı",
        actor: "Zeynep Kaya",
        description: "Sıvı teması uyarısıyla iş emri açıldı.",
      },
      {
        id: "tl-2-2",
        timestamp: "10 Eki 2026, 09:30",
        action: "status_change",
        title: "Durum Değiştirildi",
        actor: "Emre Can",
        description: "İncelemede ➔ Parça Bekliyor",
        oldStatus: "incelemede",
        newStatus: "parca_bekliyor",
      },
    ],
  },
  {
    id: "wo-3",
    orderNumber: "İE-1040",
    customerId: "cust-3",
    customerName: "Ali Kemal Erdem",
    customerPhone: "0 (542) 654 11 02",
    deviceType: "Telefon",
    deviceModel: "Samsung Galaxy S22 Ultra",
    deviceSerial: "R5CR30V56LE",
    screenPasscode: "8899",
    issueSummary: "Batarya 2 saatte bitiyor, kamera bölgesinde aşırı ısınma.",
    physicalCondition: "Kılcal çizikler mevcut, sıvı teması yok.",
    status: "onay_bekliyor",
    priority: "normal",
    technicianName: "Murat Usta",
    createdAt: "10 Eki 2026, 11:30",
    estimatedCompletion: "Bugün 18:00",
    estimatedPrice: 2400,
    paidAmount: 0,
    notes: [
      {
        id: "note-3-1",
        createdAt: "10 Eki 2026, 12:15",
        author: "Murat Usta",
        content: "Batarya sağlığı %68, kamera sensöründe kısa devre yok. Orijinal batarya değişimi için müşteri aranacak.",
      },
    ],
    timeline: [
      {
        id: "tl-3-1",
        timestamp: "10 Eki 2026, 11:30",
        action: "created",
        title: "İş Emri Açıldı",
        actor: "Murat Usta",
      },
      {
        id: "tl-3-2",
        timestamp: "10 Eki 2026, 12:30",
        action: "status_change",
        title: "Durum Değiştirildi",
        actor: "Murat Usta",
        description: "İncelemede ➔ Onay Bekliyor",
        oldStatus: "incelemede",
        newStatus: "onay_bekliyor",
      },
    ],
  },
  {
    id: "wo-4",
    orderNumber: "İE-1039",
    customerId: "cust-4",
    customerName: "Mustafa Yıldız",
    customerPhone: "0 (533) 220 90 71",
    deviceType: "Bilgisayar",
    deviceModel: "Lenovo ThinkPad E14 Gen 4",
    deviceSerial: "PF3XK912",
    issueSummary: "Sol menteşe kırık, fan yüksek devirde ötüyor ve ısınıyor.",
    physicalCondition: "Sol menteşe yuvası açık, ekran kasasında zorlanma.",
    status: "incelemede",
    priority: "normal",
    technicianName: "Emre Can",
    createdAt: "10 Eki 2026, 09:00",
    estimatedCompletion: "13 Eki 2026, 12:00",
    estimatedPrice: 3100,
    paidAmount: 500,
    notes: [
      {
        id: "note-4-1",
        createdAt: "10 Eki 2026, 09:30",
        author: "Emre Can",
        content: "Termal macun kurumuş, menteşe vida yatakları rekonstrüksiyon gerektiriyor.",
      },
    ],
    timeline: [
      {
        id: "tl-4-1",
        timestamp: "10 Eki 2026, 09:00",
        action: "created",
        title: "İş Emri Açıldı",
        actor: "Emre Can",
      },
    ],
  },
  {
    id: "wo-5",
    orderNumber: "İE-1038",
    customerId: "cust-5",
    customerName: "Ayşe Demir",
    customerPhone: "0 (535) 901 34 56",
    deviceType: "Telefon",
    deviceModel: "Xiaomi Redmi Note 12 Pro",
    deviceSerial: "867123049102391",
    issueSummary: "Type-C şarj soketi temassızlık yapıyor, hızlı şarj almıyor.",
    physicalCondition: "Soket içi tozlu, cihaz kasası sağlam.",
    status: "hazir",
    priority: "normal",
    technicianName: "Murat Usta",
    createdAt: "09 Eki 2026, 14:20",
    estimatedCompletion: "Bugün 12:00",
    estimatedPrice: 950,
    paidAmount: 950,
    notes: [
      {
        id: "note-5-1",
        createdAt: "10 Eki 2026, 11:00",
        author: "Murat Usta",
        content: "Sub-board ve şarj entegresi temizlendi, soket yenilendi. Testler başarılı, 67W hızlı şarj çalışıyor.",
      },
    ],
    timeline: [
      {
        id: "tl-5-1",
        timestamp: "09 Eki 2026, 14:20",
        action: "created",
        title: "İş Emri Açıldı",
        actor: "Murat Usta",
      },
      {
        id: "tl-5-2",
        timestamp: "10 Eki 2026, 11:15",
        action: "status_change",
        title: "Durum Değiştirildi",
        actor: "Murat Usta",
        description: "Tamirde / İşlemde ➔ Teslime Hazır",
        oldStatus: "islemde",
        newStatus: "hazir",
      },
    ],
  },
  {
    id: "wo-6",
    orderNumber: "İE-1037",
    customerId: "cust-6",
    customerName: "Kemal Sunal Ticaret",
    customerPhone: "0 (216) 444 01 22",
    deviceType: "Tablet",
    deviceModel: "iPad Air 4. Nesil",
    deviceSerial: "DMPD2910Q16M",
    issueSummary: "Ön cam çatlak, görüntü ve touch sağlam.",
    physicalCondition: "Cam çatlağı sağ alt köşeden yayılıyor.",
    status: "yeni",
    priority: "yuksek",
    technicianName: "Zeynep Kaya",
    createdAt: "10 Eki 2026, 13:50",
    estimatedCompletion: "14 Eki 2026, 17:00",
    estimatedPrice: 3800,
    paidAmount: 0,
    notes: [
      {
        id: "note-6-1",
        createdAt: "10 Eki 2026, 13:55",
        author: "Zeynep Kaya",
        content: "Cihaz teslim alındı. Cam değişimi (OCA pres) yapılacak.",
      },
    ],
    timeline: [
      {
        id: "tl-6-1",
        timestamp: "10 Eki 2026, 13:50",
        action: "created",
        title: "İş Emri Açıldı",
        actor: "Zeynep Kaya",
      },
    ],
  },
];
