# İŞEMRİAL — FAZ 4 MİMARİ VE GÜVENLİK DENETİMİ (PHASE 4 AUDIT)

**Tarih:** 12 Ekim 2026  
**Rol:** Kıdemli Backend Mimarı, NestJS Geliştiricisi, PostgreSQL/Prisma Uzmanı, Uygulama Güvenliği Mühendisi  
**Durum:** Faz 4 Öncesi Teknik Denetim ve Mimari Karar Belgesi

---

## 1. Mevcut Depo ve Kod Tabanı Analizi

### 1.1. Proje Yapısı ve Paket Yönetimi
- **Kök Dizin:** Next.js 15.2.1, React 19.0.0, Tailwind CSS v4.0.9 ve TypeScript 5.8.2 ile yapılandırılmış tek bir frontend projesi bulunmaktadır.
- **Paket Yöneticisi:** `pnpm` (sürüm 12.6.0). Windows PowerShell yürütme politikası nedeniyle doğrudan `pnpm` yerine `pnpm.cmd` veya `-ExecutionPolicy Bypass` bayrağı ile çalıştırılmaktadır.
- **Mevcut Frontend Durumu:** Faz 1, 1.1, 2 ve 3 başarıyla tamamlanmış; `src/app/` altında Dashboard, İş Emirleri, Yeni İş Emri, Detay ve Müşteriler rotaları sorunsuz çalışmaktadır.
- **Mevcut Veri Katmanı:** `src/context/ServiceDataContext.tsx` üzerinden reaktif state ve `localStorage` (`isemrial_service_data_v1`) kalıcılığıyla çalışmaktadır.

### 1.2. Onaylı Belgeler Arasındaki Çelişkinin Tespiti ve Çözümü
- **`docs/TECHNICAL_PLAN.md`:** Mimariyi açıkça **Next.js App Router (Frontend) + NestJS (Backend) + PostgreSQL + Prisma (ORM)** olarak tanımlamıştır.
- **`docs/IMPLEMENTATION_PLAN.md`:** Faz 4 taslağında alternatif bir not olarak Next.js Route Handlers (`src/app/api/...`) ifadesi kullanılmıştır.
- **Faz 4 Görev Talimatı:** "Onaylanan hedef mimari Next.js frontend + NestJS API + PostgreSQL + Prisma'dır. Ancak mevcut dosya yapısını ve paket yönetimini denetle. Çalışan frontend'i gereksiz yere taşımadan API katmanını entegre et."
- **Mimari Karar:** 
  Çalışan Next.js frontend'i gereksiz taşıma ve kırılmalardan korumak, React 19 / Next.js 15 bağımlılıkları ile NestJS 10/11 ekosisteminin (Express, class-validator, Swagger vb.) bağımlılık çakışması yaşamaması için **`backend/`** alt dizininde bağımsız bir NestJS projesi kurulacaktır.
  Frontend, API çağrılarını Next.js rewrites (`/api/:path* -> http://localhost:4000/api/:path*`) veya doğrudan CORS yapılandırmalı HTTP istemcisi üzerinden güvenli çerezlerle (`credentials: 'include'`) gerçekleştirecektir. Böylece hem yerel geliştirmede hem de prodüksiyonda sıfır çerez çakışması ve tam izolasyon sağlanacaktır.

---

## 2. PostgreSQL ve Altyapı Ortamı Denetimi

### 2.1. Docker ve Port Durumu
- `docker` CLI (29.6.2) ve `docker compose` (v5.3.1) mevcuttur.
- Docker Desktop arka plan servisi WSL2 (`docker-desktop`) üzerinde aktifleştirilmiştir.
- **Önemli Bulgu / Risk:** Makinede daha önceden çalışan başka bir projeye ait `aitrade_postgres` konteyneri `5432` portunu dinlemektedir.
- **Çözüm:** `docker-compose.yml` içinde İşEmriAl için host portu `5433` olarak yapılandırılacak (`5433:5432`), böylece port çakışması riski tamamen ortadan kaldırılacaktır.

### 2.2. Docker Compose Gereksinimleri
- **Kalıcılık:** `isemrial_pgdata` adında named volume kullanılacak.
- **Healthcheck:** `pg_isready -U postgres -d isemrial_dev` komutuyla sağlıklı açılış doğrulanacak.
- **Güvenlik:** `.env.example` şablonu oluşturulacak, gerçek şifreler Git'e eklenmeyecek.

---

## 3. Veri Modeli ve Prisma Şeması Tasarımı

Mevcut `service-data.ts` ve UI gereksinimleri Prisma şemasına 1:1 eksiksiz eşlenecektir:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Role {
  OWNER
  ADMIN
  TECHNICIAN
}

enum WorkOrderStatus {
  YENI            // "Yeni Kayıt"
  INCELEMEDE      // "İncelemede"
  TEKLIF_BEKLIYOR // "Teklif Bekliyor"
  ONAY_BEKLIYOR   // "Onay Bekliyor"
  ISLEMDE         // "Tamirde / İşlemde"
  PARCA_BEKLIYOR  // "Parça Bekliyor"
  HAZIR           // "Teslime Hazır"
  TESLIM_EDILDI   // "Teslim Edildi"
  IPTAL           // "İptal Edildi"
}

enum WorkOrderPriority {
  DUSUK
  NORMAL
  YUKSEK
  ACIL
}

enum DeviceType {
  TELEFON
  BILGISAYAR
  TABLET
  DIGER
}
```

### 3.1. Çekirdek Modeller ve İlişkiler
1. **`User`:** `id`, `email`, `fullName`, `passwordHash`, `phone`, `isActive`, `createdAt`, `updatedAt`.
2. **`Organization`:** `id`, `name`, `slug`, `phone`, `address`, `createdAt`, `updatedAt`.
3. **`Membership`:** `id`, `userId`, `organizationId`, `role` (`Role`), `createdAt`. (`@@unique([userId, organizationId])`)
4. **`Session`:** `id`, `tokenHash` (SHA-256), `userId`, `expiresAt`, `ipAddress`, `userAgent`, `createdAt`.
5. **`Customer`:** `id`, `organizationId`, `name`, `phone`, `email`, `notes`, `createdAt`, `updatedAt`.
   - İndeksler: `@@index([organizationId, phone])`, `@@index([organizationId, name])`.
6. **`WorkOrder`:**
   - `id`, `organizationId`, `orderNumber` (örn: `İE-1001`), `customerId`, `technicianId?`.
   - `deviceType`, `deviceModel`, `deviceSerial`, `screenPasscode`.
   - `issueSummary`, `physicalCondition`.
   - `status`, `priority`.
   - `estimatedPrice` (`Decimal(10, 2)`), `paidAmount` (`Decimal(10, 2)`).
   - `estimatedCompletion`, `completedAt?`, `createdAt`, `updatedAt`.
   - Kısıt: `@@unique([organizationId, orderNumber])`.
7. **`WorkOrderNote`:** `id`, `workOrderId`, `organizationId`, `authorName`, `authorId?`, `content`, `createdAt`.
8. **`TimelineEvent`:** `id`, `workOrderId`, `organizationId`, `action`, `title`, `actorName`, `actorId?`, `description?`, `oldStatus?`, `newStatus?`, `createdAt`.

---

## 4. Güvenlik ve Kimlik Doğrulama Mimarisi

### 4.1. Kimlik Doğrulama (Authentication)
- **Parola Güvenliği:** OWASP standartlarına uygun **Argon2id** (`argon2` paketi) kullanılacaktır.
- **Oturum Yönetimi (Stateful Sessions):**
  - İstemciye `32` baytlık kriptografik güvenli rastgele oturum belirteci (token) üretilir (`crypto.randomBytes(32).toString('hex')`).
  - Veritabanında oturum belirtecinin **SHA-256 özeti** saklanır. Böylece veritabanı yedeği sızsa dahi oturumlar çalınamaz.
  - Oturum süresi varsayılan 7 gün; çıkış yapıldığında oturum kaydı veritabanından silinir/geçersiz kılınır.
- **Çerez Güvenliği:**
  - Ad: `isemrial_session`
  - `httpOnly: true` (XSS ile JavaScript üzerinden okunamaz)
  - `sameSite: 'lax'` (CSRF saldırılarına karşı güvenli)
  - `secure: process.env.NODE_ENV === 'production'`
- **Brute-Force Koruması:** Giriş denemeleri için IP tabanlı rate limiter uygulanacaktır.

### 4.2. Çok Kiracılı Veri İzolasyonu (Tenant Scoping & Anti-IDOR)
- **İlke 1:** Kullanıcı oturum açtığında ait olduğu organizasyon(lar) sunucuda sorgulanır ve aktif `organizationId` doğrulanmış oturum nesnesine bağlanır.
- **İlke 2:** İstemciden gelen gövdedeki (body) veya başlıktaki hiçbir `organizationId` doğrudan güvenilmez.
- **İlke 3:** Her Prisma sorgusu mutlaka `{ where: { organizationId } }` kısıtı içerir.
- **İlke 4 (IDOR Savunması):** Kullanıcı başka bir organizasyonun `workOrderId` veya `customerId`'sini URL'e yazarsa, sorgu `null` döner ve sistem **404 Not Found** üretir. Böylece kaydın başka bir müşteride var olup olmadığı dahi sızdırılmaz.
- **İlke 5 (İlişkisel Bütünlük):** Yeni iş emri oluştururken gönderilen `customerId`'nin aynı `organizationId`'ye ait olduğu doğrulanır; çapraz organizasyon ilişkilendirmesi engellenir.
- **İlke 6 (Atomik İşlem):** Durum güncellemesi ve `TimelineEvent` geçmiş kaydı tek bir Prisma `$transaction` içinde işlenir.

---

## 5. Frontend Entegrasyonu ve Demo Veri Stratejisi

### 5.1. Demo Verisi (`localStorage`) Yönetimi
- Mevcut `isemrial_service_data_v1` anahtarı kullanıcının tarayıcısında mevcuttur.
- Kullanıcı giriş yapmadığı sürece demo modu aktif kalabilir; ancak **kullanıcı gerçek bir atölye hesabıyla giriş yaptığı anda**, uygulama gerçek NestJS API verilerine geçer.
- Demo verileri hiçbir zaman izinsiz biçimde yeni oluşturulan bir işletmenin gerçek veritabanına otomatik yüklenmeyecektir. İleride gerekirse "Demo Verilerini İçe Aktar" seçeneği kullanıcı onayına sunulabilir.

### 5.2. Arayüzün Korunması
- Faz 1.1'deki Bubilet yeşil marka rengi (`#157347` / `#20C875`), açık tema zeminleri (`#F7F9F7`), tipografi ve Faz 2 bileşenleri (Button, FormField, StatusBadge vb.) eksiksiz korunacaktır.
- `/login` ve `/register` ekranları aynı tasarım dili ve bileşenlerle inşa edilecektir.

---

## 6. Faz 4 Uygulama Adımları

1. **Adım 1:** `docker-compose.yml` ve `.env.example` oluşturulması, PostgreSQL konteynerinin ayağa kaldırılması.
2. **Adım 2:** `backend/` dizininde NestJS projesinin yapılandırılması, Prisma şeması, migration ve tohumlama (seed) betiği.
3. **Adım 3:** Kimlik doğrulama modülü (`AuthModule`): Argon2id, Session servisi, `AuthGuard`, `RolesGuard`, login/register/logout/me endpoint'leri.
4. **Adım 4:** Organizasyon ve üyelik modülü (`OrganizationModule`).
5. **Adım 5:** Müşteri (`CustomerModule`) ve İş Emri (`WorkOrderModule`) modülleri: CRUD, durum değiştirme, servis notu ekleme, işlem geçmişi ve çok kiracılı doğrulama.
6. **Adım 6:** Frontend'de `/login`, `/register` ekranlarının eklenmesi; `ServiceDataContext`'in API istemcisine bağlanması.
7. **Adım 7:** Çok kiracılı güvenlik testleri (en az 2 ayrı organizasyon ile IDOR denetimi), E2E akış doğrulaması ve build kabulü.
8. **Adım 8:** `docs/PHASE_4_REVIEW.md` raporunun hazırlanması.
