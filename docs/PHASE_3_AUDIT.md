# İşEmriAl — Faz 3 Ön İnceleme ve Çekirdek Akışlar Denetimi (Phase 3 Audit)

**Tarih:** 12 Ekim 2026  
**Aşama:** Faz 3 — Çekirdek Kullanıcı Arayüzü ve İş Akışları (Core UI & Operational Workflows)  
**Rol:** Kıdemli Frontend Geliştirici, Uygulama Mimarı  
**Referans Dokümanlar:** `AGENTS.md`, `.agents/skills/premium-saas-ui`, `docs/PRODUCT_BRIEF.md`, `docs/DESIGN_SYSTEM.md`, `docs/UX_FLOWS.md`, `docs/IMPLEMENTATION_PLAN.md`, `docs/SCREEN_INVENTORY.md`, `docs/PHASE_2_REVIEW.md`

---

## 1. Mevcut Sayfa ve Rota Durumları

| Rota | Mevcut Durum | Tespit Edilen Eksiklik & Sınır |
| :--- | :--- | :--- |
| `/` | `redirect("/dashboard")` | Sorunsuz çalışıyor. |
| `/dashboard` | Faz 2 ortak bileşenleriyle refactor edildi. | Sayfaya gömülü statik mock array kullanıyor. Yeni iş emri açıldığında veya başka sayfada durum değiştiğinde sayaçlar güncellenmiyor. Satır tıklaması tam sayfa rotaya değil, sadece bir önizleme modalına açılıyor. |
| `/work-orders` | Faz 2 ortak bileşenleriyle refactor edildi. | Lokal `useState` ile mock array tutuyor. Başka sayfadan eklenen kayıtları görmüyor. Satır tıklaması sadece modal açıyor; `/work-orders/[id]` detay rotası henüz yok. |
| `/work-orders/new` | Faz 2 form bileşenleriyle refactor edildi. | Form gönderildiğinde oluşturulan numara bellekte geçici kalıyor; `/work-orders` listesine ve `/dashboard` sayaçlarına eklenmiyor. |
| `/work-orders/[id]` | **Mevcut Değil (Eksik)** | İş emrinin kronolojik geçmişi, detaylı servis notları, teknisyen ataması ve durum geçişlerinin yönetildiği ana operasyonel sayfa eksik. |
| `/customers` | **Mevcut Değil (Eksik)** | Müşteri arama, telefon/cihaz listesi, açık iş emri sayısı özeti sunan rehber sayfası eksik (`AppShell` üzerinde "Yakında" rozetiyle pasif duruyor). |
| `/customers/[id]` | **Mevcut Değil (Eksik)** | Müşteriye ait tüm geçmiş ve aktif iş emirlerini, teslim edilen cihazları gösteren müşteri detay profili eksik. |
| `/dev/design-system` | Faz 2 vitrini aktif. | **Güvenlik/Kapsam Açığı:** Üretim ortamında (`production`) doğrudan erişilebilir durumda. `AppShell` menüsünde koşulsuz gösteriliyor. Üretimde 404 dönmeli ve menüde gizlenmeli. |

---

## 2. Mock Veri Yapısı ve Ayrık Durum (State) Analizi

### 2.1 Mevcut `src/mocks/service-data.ts`
- `MOCK_WORK_ORDERS`: 6 adet sabit iş emri nesnesi içeriyor.
- `MOCK_TECHNICIANS`: 3 adet teknisyen profili tanımlı.
- `STATUS_MAP` ve `PRIORITY_MAP`: WCAG AA uyumlu renkler ve etiketler barındırıyor.

### 2.2 Ayrık State Problemi
Mevcut mimaride:
1. `dashboard/page.tsx` kendi içinde `MOCK_WORK_ORDERS` üzerinden filtreleme yapıyor.
2. `work-orders/page.tsx` bağımsız bir `useState(MOCK_WORK_ORDERS)` tutuyor.
3. `work-orders/new/page.tsx` formu doldurunca sadece `setCreatedOrderNumber` yapıyor, veriyi hiçbir listeye eklemiyor.
4. Bir teknisyen iş emri durumunu "Hazır" yaptığında, dashboard'daki "Hazır" sayacı veya teslim edilecekler listesi bu durumdan haberdar olmuyor. Sayfa yenilendiğinde yapılan tüm değişiklikler kayboluyor.

---

## 3. Öncelikli Güvenlik ve Kapsam Düzeltmesi (`/dev/design-system`)

Faz 2 gereksiniminde açıkça belirtildiği üzere, bileşen vitrini (`/dev/design-system`) son kullanıcıya ve üretim ortamına açık bırakılmamalıdır.

### Alınacak Aksiyonlar:
1. **Navigasyon Koruması (`AppShell.tsx`):**
   - Menüdeki "Bileşen Vitrini" bağlantısı yalnızca `process.env.NODE_ENV !== "production"` koşulunda listelenmelidir.
2. **Rota Koruması (`src/app/dev/design-system/page.tsx`):**
   - Sunucu tarafında `process.env.NODE_ENV === "production"` kontrolü yapılarak doğrudan Next.js `notFound()` tetiklenmeli ve 404 döndürülmelidir.
3. **Doğrulama:**
   - Üretim derlemesinde (`next start`) bu sayfaya gidildiğinde 404 sayfası geldiği Playwright ile doğrulanmalıdır.

---

## 4. Önerilen Merkezi Mock Veri Mimarisi (`ServiceDataContext`)

Ayrı veri adacıklarını ortadan kaldırmak için React Context tabanlı, istemci tarafında güvenli `localStorage` kalıcılığına sahip bir servis katmanı inşa edilecektir:

```
src/
├── context/
│   └── ServiceDataContext.tsx   # Merkezi Provider, Hook (useServiceData)
├── mocks/
│   ├── service-data.ts          # Zenginleştirilmiş veri modelleri (Customer, TimelineEvent, Note)
│   └── default-data.ts          # Varsayılan tohum (seed) veriler
```

### Veri Modelleri:
- **`Customer`:** `id`, `name`, `phone`, `email`, `createdAt`, `notes`, `deviceSummary`.
- **`WorkOrderItem`:** `id`, `orderNumber`, `customerId`, `customerName`, `customerPhone`, `deviceType`, `deviceModel`, `deviceSerial`, `screenPasscode`, `issueSummary`, `physicalCondition`, `status`, `priority`, `technicianName`, `createdAt`, `estimatedCompletion`, `estimatedPrice`, `paidAmount`, `notes: WorkOrderNote[]`, `timeline: TimelineEvent[]`.
- **`TimelineEvent`:** `id`, `timestamp`, `action` ("Oluşturuldu", "Durum Güncellendi", "Not Eklendi"), `actor`, `description`, `oldStatus?`, `newStatus?`.
- **`WorkOrderNote`:** `id`, `createdAt`, `author`, `content`.

### SSR & Hydration Güvenliği:
- Sunucu tarafında (SSR) `localStorage`'a erişilmeyecek; ilk render'da varsayılan mock veriler kullanılacak.
- `useEffect` içinde istemci bağlandığında (`mounted`), tarayıcı belleğindeki güncel veri okunacak ve `isLoaded: true` bayrağı ile atomik olarak devreye sokulacak. Böylece hydration hatası (`Text content does not match server-rendered HTML`) tamamen önlenecektir.

---

## 5. Faz 3 Kullanıcı Akışları ve Yol Haritası

1. **Adım 1: `/dev/design-system` Üretim Koruması:**
   - Navigasyon ve rota seviyesinde production kontrolü ve 404 testi.
2. **Adım 2: Merkezi Servis Veri Katmanı:**
   - `Customer`, `TimelineEvent` ve `WorkOrderNote` tiplerini ekleme.
   - `ServiceDataContext` ve `useServiceData` hook'u oluşturma; `layout.tsx` sarmalama.
3. **Adım 3: Dashboard Entegrasyonu (`/dashboard`):**
   - Sayaçları dinamik hesaplama, iş emri tıklamasında `/work-orders/[id]` rotasına yönlendirme.
4. **Adım 4: İş Emirleri Listesi (`/work-orders`):**
   - Merkezi sağlayıcıya bağlama; satır/kart tıklamasında `/work-orders/[id]` rotasına yönlendirme.
5. **Adım 5: İş Emri Detay Sayfası (`/work-orders/[id]`):**
   - Cihaz ve müşteri profili, durum değiştirme eylemleri, kronolojik zaman çizelgesi, servis notu ekleme, WhatsApp taslağı ve geçersiz ID durumunda temiz 404/EmptyState sunumu.
6. **Adım 6: Müşteri Rehberi (`/customers` & `/customers/[id]`):**
   - Müşteri arama listesi, müşteri profil sayfası, ilişkili cihazlar ve geçmiş iş emirleri.
7. **Adım 7: Yeni İş Emri Akışı (`/work-orders/new`):**
   - Formu merkezi provider'a bağlama, otomatik müşteri eşleştirme veya oluşturma, benzersiz ID ve İE-XXXX üretimi, başarı sonrası detay sayfasına geçiş.
8. **Adım 8: Kalite, Build ve Playwright Testleri:**
   - `pnpm build`, `pnpm lint`, Playwright responsive testleri, `docs/PHASE_3_REVIEW.md` raporu.
