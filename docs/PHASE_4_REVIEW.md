# İŞEMRİAL — FAZ 4 KABUL VE İNCELEME RAPORU (PHASE 4 REVIEW)

**Tarih:** 12 Ekim 2026  
**Roller:** Kıdemli Backend Mimarı, NestJS Geliştiricisi, PostgreSQL/Prisma Uzmanı, Uygulama Güvenliği Mühendisi  
**Durum:** Faz 4 — Güvenli Backend, PostgreSQL ve Gerçek Veri Katmanı Tamamlandı

---

## 1. Yönetici Özeti ve Mimari Kararlar

Faz 4 kapsamında İşEmriAl, mock veriler ve istemci tarafı `localStorage` bağımlılığından kurtarılarak; PostgreSQL veritabanı, Prisma ORM ve NestJS üzerinde koşan, endüstri standardı çok kiracılı (multi-tenant) B2B SaaS mimarisine taşınmıştır.

### Mimari Kararlar ve Uygulanan İlkeler
1. **Frontend-Backend İzolasyonu:**
   - Mevcut Next.js 15 + React 19 frontend'i kök dizinde korunmuş, `backend/` dizini altında bağımsız NestJS 11 servisi kurulmuştur.
   - `next.config.ts` içerisine eklenen rewrites kuralı (`/api/:path* -> http://localhost:4000/api/:path*`) sayesinde tarayıcı ile sunucu aynı origin üzerinde haberleşmekte, CORS ve üçüncü parti çerez kısıtlamaları tamamen bertaraf edilmektedir.
2. **Kusursuz Çok Kiracılı Veri İzolasyonu (Tenant Isolation):**
   - Her `Customer`, `WorkOrder`, `WorkOrderNote` ve `TimelineEvent` kaydı mutlak surette `organizationId` ile ilişkilendirilmiştir.
   - İstemciden gelen `organizationId` gövde parametresi asla yetki kanıtı kabul edilmez; aktif işletme kimliği sunucuda doğrulanmış oturumun `Membership` kaydından çıkarılır.
   - IDOR (Insecure Direct Object Reference) zafiyetlerine karşı tüm sorgular `where: { id, organizationId }` şartıyla çalıştırılır. Başka işletmeye ait bir ID sorgulandığında sistem bilgi sızdırmamak adına tutarlı **404 Not Found** döner.
3. **Güvenli Kimlik Doğrulama ve Oturum Yönetimi:**
   - Parolalar endüstri standardı **Argon2id** algoritmasıyla tuzlanarak (salt) hashlenmiştir.
   - Oturumlar veritabanında `Session` tablosunda saklanır; ham token yerine kriptografik **SHA-256** hash'i tutulur.
   - Tarayıcıya aktarılan oturum çerezi `HttpOnly`, `SameSite=Lax` ve üretimde `Secure` bayraklarına sahiptir; JavaScript içerisinden okunamaz.
   - Çıkış (`/api/auth/logout`) yapıldığında sunucu tarafındaki oturum derhal iptal edilir (`delete`).
4. **Veri Bütünlüğü ve Atomik Durum Değişiklikleri:**
   - İş emri durumu değiştiğinde hem `WorkOrder.status` güncellenir hem de `TimelineEvent` geçmiş kaydı **tek bir Prisma `$transaction`** içerisinde yazılır. Biri başarısız olursa diğeri de geri alınır.
5. **Mevcut Veri Koruması:**
   - `isemrial_service_data_v1` yerel depolama anahtarı sessizce silinmemiş, kullanıcının gerçek veritabanına sahte demo kayıtları otomatik yüklenmemiştir. İstemci öncelikle gerçek API'yi dinler.

---

## 2. Değiştirilen ve Yeni Eklenen Dosyalar

### Altyapı ve Konfigürasyon
- `docker-compose.yml`: PostgreSQL 16 Alpine servisi (`isemrial_postgres`), port eşlemesi `5433:5432` (port 5432 çakışmasını önlemek için), `isemrial_pgdata` named volume, `pg_isready` healthcheck.
- `.env.example`: Veritabanı URL'si, oturum sırları ve API portları için örnek çevre değişkenleri şablonu.
- `.env`: Geliştirme ortamı yapılandırması (Git tarafından yok sayılır).
- `tsconfig.json`: Kök Next.js TypeScript derleyicisinin `backend/` diziniyle çakışmaması için `exclude` listesi güncellendi.
- `next.config.ts`: `/api/:path*` isteklerini arka plandaki `http://localhost:4000/api/:path*` adresine yönlendiren rewrite yapılandırması eklendi.

### Backend Katmanı (`backend/`)
- `backend/package.json`: NestJS 11, Prisma 6, Argon2, Cookie-Parser, Class-Validator bağımlılıkları.
- `backend/prisma/schema.prisma`: `User`, `Organization`, `Membership`, `Session`, `Customer`, `WorkOrder`, `WorkOrderNote`, `TimelineEvent` modelleri, enumlar ve bileşik indeksler (`@@unique([organizationId, orderNumber])`).
- `backend/prisma/migrations/20261012144936_init_multi_tenant_schema/migration.sql`: Üretilebilir ilk şema göç dosyası.
- `backend/prisma/seed.ts`: Geliştirme ve test amacıyla 2 ayrı işletme (`Usta Teknik Servis`, `Kadıköy Bilişim & Tamir`), 4 kullanıcı, müşteriler ve iş emirleri oluşturan tohumlama betiği.
- `backend/src/prisma/prisma.service.ts`: Yaşam döngüsü kancaları ve hata loglamalı Prisma istemcisi.
- `backend/src/common/guards/auth.guard.ts`: Çerezden SHA-256 session hash doğrulaması yapan koruma.
- `backend/src/common/guards/roles.guard.ts`: Rol tabanlı yetki kontrolü.
- `backend/src/common/filters/http-exception.filter.ts`: Prisma ve genel sistem hatalarını güvenli, hassas veri sızdırmayan API hata formatına dönüştüren küresel filtre.
- `backend/src/common/decorators/current-user.decorator.ts`: İstek bağlamından doğrulanmış kullanıcıyı alan dekoratör.
- `backend/src/auth/`: Kimlik doğrulama servisi, oturum yönetimi, DTO doğrulamaları ve kontrolcüsü.
- `backend/src/organizations/`: Aktif işletme bilgileri ve üyelik yönetimi.
- `backend/src/customers/`: İşletme kapsamlı müşteri CRUD ve arama modülü.
- `backend/src/work-orders/`: Atomik durum geçişleri, otomatik iş emri numaralandırması (`İE-1001` vb.), not ve zaman çizelgesi yönetimi.
- `backend/src/health/`: Veritabanı canlılık kontrolü (`/api/health`).
- `backend/src/main.ts`: Küresel `ValidationPipe`, `cookieParser`, CORS ve başlatma mantığı.
- `backend/test-api.ts`: 13 adet otomatik uçtan uca API, güvenlik ve kiracı izolasyon testini koşan doğrulama betiği.

### Frontend Katmanı (`src/`)
- `src/lib/api-client.ts`: Çerezli (`credentials: 'include'`), tip güvenli ve hata fırlatan birleşik `apiFetch` istemcisi.
- `src/context/ServiceDataContext.tsx`: `localStorage` yerine gerçek `/api/auth/me`, `/api/work-orders`, `/api/customers` ve `/api/work-orders/metrics` uç noktalarına bağlanan reaktif bağlam.
- `src/app/login/page.tsx`: Bubilet tasarım diline uygun, erişilebilir, tek tıkla test girişi sunan atölye giriş sayfası.
- `src/app/register/page.tsx`: Yeni işletme ve yetkili kaydı açan atölye kayıt sayfası.
- `src/components/AppShell.tsx`: Giriş yapılmamışsa `/login` rotasına yönlendiren, dinamik işletme ve kullanıcı bilgilerini gösteren ve güvenli çıkış butonu içeren kabuk bileşeni.
- `src/app/dashboard/page.tsx`: Giriş yapan teknisyenin ve işletmenin adına dinamik hitap eden, gerçek API sayaçlarıyla çalışan gösterge paneli.

### Dokümantasyon
- `docs/PHASE_4_AUDIT.md`: Mimari analiz, risk değerlendirmesi ve uygulama planı.
- `docs/PHASE_4_REVIEW.md`: İşbu kabul ve inceleme dokümanı.

---

## 3. Çalıştırılan Testler ve Doğrulama Sonuçları

### 3.1. Otomatik Backend Güvenlik ve İzolasyon Testleri (`test-api.ts`)
Tüm testler gerçek PostgreSQL veritabanı üzerinde koşturulmuş ve **13/13 BAŞARILI** olmuştur:

```text
🚀 Starting Phase 4 Backend Security & Multi-tenancy Verification Tests...

✅ PASS: 1. Healthcheck returns healthy database connection
✅ PASS: 2. Invalid password is properly rejected with 401 Unauthorized
✅ PASS: 3. Murat Usta logs in successfully to 'Usta Teknik Servis' with HttpOnly session cookie
✅ PASS: 4. GET /api/auth/me returns authenticated user context
✅ PASS: 5. Org 1 orders list contains İE-1042 and strictly excludes Org 2's İE-2001
✅ PASS: 6. Org 2 orders list contains İE-2001 and strictly excludes Org 1's orders
✅ PASS: 7. IDOR: Org 1 user querying Org 2 order ID is rejected with 404 Not Found (zero info leak)
✅ PASS: 8. IDOR: Org 2 user modifying Org 1 order is rejected with 404 Not Found
✅ PASS: 9. Cross-tenant customer linking rejected with 400 Bad Request
✅ PASS: 10. Status change and TimelineEvent are atomically updated
✅ PASS: 11. New work order created with auto-generated orderNumber and customer link
✅ PASS: 12. Logout revokes session successfully
✅ PASS: 13. Request after logout is properly rejected with 401 Unauthorized

========================================
🎯 Test Summary: 13 PASSED, 0 FAILED
========================================
```

### 3.2. Üretim Build Sonuçları
- **Frontend Build (`pnpm.cmd build`):**
  - Next.js 15.5.27 derlemesi hatasız tamamlandı.
  - 12 sayfa (statik ve dinamik rotalar) başarıyla üretildi (`Exit code: 0`).
  - TypeScript kontrolü ve lint geçerliliği sağlandı.
- **Backend Build (`pnpm.cmd --prefix backend build`):**
  - NestJS TypeScript derlemesi başarıyla tamamlandı (`Exit code: 0`).

### 3.3. Uçtan Uca Tarayıcı (Playwright) Doğrulaması
1. **Kimlik Doğrulama:**
   - Murat Usta (Atölye Sahibi) bilgileriyle giriş yapıldı. Çerez tarayıcıya güvenli şekilde yazıldı.
   - Giriş yapmamış kullanıcı doğrudan `/login` sayfasına yönlendirildi.
2. **İş Emri Listesi ve Detay:**
   - Gerçek PostgreSQL veritabanındaki `İE-1046` iş emri listelendi.
   - Detay sayfasına gidildiğinde cihaz bilgileri, müşteri verileri ve önceki işlem geçmişi görüntülendi.
3. **Atomik Durum Değişikliği:**
   - Durum butonu üzerinden "Tamirde / İşlemde" seçildi.
   - Durum etiketi ve WhatsApp bilgilendirme metni anında güncellendi.
   - Kronolojik geçmişe "Durum Güncellendi: Yeni Kayıt ➔ Tamirde / İşlemde" kaydı yazıldı.
4. **Servis Notu Ekleme:**
   - Teknisyen notu girildi: *"Termal macun yenilendi, fan ızgaraları basınçlı hava ile temizlendi. Sıcaklık stres testinde 68 dereceye düştü."*
   - Not listeye eklendi ve aynı anda zaman çizelgesine "Servis Notu Eklendi" olayı kaydedildi.
5. **Yeni İş Emri Oluşturma:**
   - `/work-orders/new` rotasında "Burak Yılmaz" adına "MacBook Pro M1 14 inç" cihazı için yeni kayıt açıldı.
   - Başarı ekranında otomatik üretilen `İE-1047` numarası görüntülendi.
6. **Güvenli Çıkış ve Yeni Atölye Kaydı:**
   - Çıkış yap butonuyla oturum sonlandırıldı.
   - `/register` sayfası üzerinden sıfırdan "Bursa Hızlı Onarım" atölyesi ("Serkan Usta") kaydedildi.
   - Yeni atölyenin gösterge panelinde 0 iş emri, 0 müşteri görüntülendi; diğer atölyelerin hiçbir verisi sızmadı.

---

## 4. Ekran Görüntüleri Envanteri

Aşağıdaki ekran görüntüleri testler sırasında kaydedilmiştir:

| Ekran Görüntüsü Dosyası | Çözünürlük | Açıklama |
|---|---|---|
| `docs/screenshots/phase4-login-1440.png` | 1440x900 | Masaüstü atölye giriş sayfası (Hızlı test doldurucuları dahil) |
| `docs/screenshots/phase4-login-1024.png` | 1024x768 | Tablet atölye giriş ekranı |
| `docs/screenshots/phase4-login-390.png` | 390x844 | Mobil atölye giriş ekranı |
| `docs/screenshots/phase4-dashboard-authenticated.png` | 1440x900 | Usta Teknik Servis oturum açılmış gösterge paneli |
| `docs/screenshots/phase4-dashboard-1024.png` | 1024x768 | Tablet gösterge paneli |
| `docs/screenshots/phase4-dashboard-390.png` | 390x844 | Mobil gösterge paneli |
| `docs/screenshots/phase4-work-orders-real-api.png` | 1440x900 | Gerçek PostgreSQL verileriyle çalışan iş emirleri listesi |
| `docs/screenshots/phase4-work-orders-390.png` | 390x844 | Mobil iş emirleri listesi |
| `docs/screenshots/phase4-work-order-detail-real-api.png` | 1440x900 | Durumu güncellenmiş ve not eklenmiş iş emri detay sayfası |
| `docs/screenshots/phase4-order-created-real-api.png` | 1440x900 | Gerçek API üzerinden oluşturulan `İE-1047` başarı modalı |
| `docs/screenshots/phase4-new-workshop-dashboard.png` | 1440x900 | Sıfırdan kaydedilen "Bursa Hızlı Onarım" temiz gösterge paneli |

---

## 5. Kurulum, Ortam ve Geliştirme Yönergeleri

### 5.1. Gereksinimler
- Node.js 20+
- pnpm 10+
- Docker ve Docker Compose

### 5.2. Veritabanını Başlatma
```powershell
# PostgreSQL konteynerini başlat
docker compose up -d

# Konteyner durumunu kontrol et
docker compose ps
```
PostgreSQL, host makinede `localhost:5433` portunda çalışır.

### 5.3. Migration ve Seed Çalıştırma
```powershell
# Backend bağımlılıklarını kur
pnpm.cmd --prefix backend install

# Native paket onaylarını ver (pnpm v12 için)
pnpm.cmd --prefix backend approve-builds --all

# Veritabanı şemasını uygula (Migration)
pnpm.cmd --prefix backend prisma migrate dev

# Örnek geliştirme verilerini yükle (Seed)
pnpm.cmd --prefix backend prisma db seed
```

### 5.4. Geliştirme Sunucularını Başlatma
1. **NestJS API (Terminal 1):**
   ```powershell
   cd backend
   pnpm.cmd start:dev
   ```
   API `http://localhost:4000` üzerinde açılır.
2. **Next.js Frontend (Terminal 2):**
   ```powershell
   pnpm.cmd dev
   ```
   Uygulama `http://localhost:3000` üzerinde açılır.

### 5.5. Çevre Değişkenleri (`.env.example`)
```env
# Veritabanı Bağlantısı (Port 5433 - Host portu)
DATABASE_URL="postgresql://postgres:postgres123@localhost:5433/isemrial_dev?schema=public"

# Oturum ve Güvenlik
SESSION_SECRET="isemrial-super-secret-session-key-dev-environment-min-32-chars"
NODE_ENV="development"
PORT="4000"

# İzin Verilen Frontend Origin
FRONTEND_URL="http://localhost:3000"
```

### 5.6. Hazır Test Kullanıcıları (Seed Sonrası)
| İşletme | E-posta | Parola | Rol |
|---|---|---|---|
| **Usta Teknik Servis** | `murat@ustateknik.com` | `Password123!` | OWNER |
| **Usta Teknik Servis** | `emre@ustateknik.com` | `Password123!` | TECHNICIAN |
| **Usta Teknik Servis** | `zeynep@ustateknik.com` | `Password123!` | TECHNICIAN |
| **Kadıköy Bilişim & Tamir** | `ahmet@kadikoybilisim.com` | `Password123!` | OWNER |

---

## 6. API Uç Noktaları ve Hata Davranışı

| Uç Nokta | Metot | Açıklama | Yetki |
|---|---|---|---|
| `/api/health` | GET | Servis ve veritabanı canlılık kontrolü | Herkese Açık |
| `/api/auth/register` | POST | Yeni işletme ve yetkili kaydı açar | Herkese Açık |
| `/api/auth/login` | POST | E-posta/parola ile giriş yapar, HttpOnly çerez döner | Herkese Açık |
| `/api/auth/logout` | POST | Oturumu veritabanından siler ve çerezi temizler | Oturum Gerekli |
| `/api/auth/me` | GET | Aktif kullanıcı ve işletme bağlamını döner | Oturum Gerekli |
| `/api/organizations/current` | GET | Aktif işletme detaylarını döner | Oturum Gerekli |
| `/api/customers` | GET | İşletmenin müşterilerini arar ve listeler | Oturum Gerekli |
| `/api/customers/:id` | GET | Müşteri detayı ve servis geçmişi | Oturum Gerekli |
| `/api/customers` | POST | Yeni müşteri kaydı açar | Oturum Gerekli |
| `/api/work-orders` | GET | Filtrelenebilir iş emri listesi | Oturum Gerekli |
| `/api/work-orders/metrics`| GET | Masada, onayda, parçada ve hazır iş sayaçları | Oturum Gerekli |
| `/api/work-orders/:id` | GET | İş emri detayları, notlar ve zaman çizelgesi | Oturum Gerekli |
| `/api/work-orders` | POST | Yeni iş emri oluşturur (müşteri otomatik bağlanır) | Oturum Gerekli |
| `/api/work-orders/:id/status`| PATCH | Atomik durum değiştirir ve TimelineEvent ekler | Oturum Gerekli |
| `/api/work-orders/:id/notes` | POST | İş emrine teknisyen notu ve geçmiş kaydı ekler | Oturum Gerekli |

### Hata Yanıt Formatı
API hataları standartlaştırılmış ve hassas sistem ayrıntılarını sızdırmayacak şekilde yapılandırılmıştır:
```json
{
  "statusCode": 404,
  "message": "İş emri bulunamadı.",
  "timestamp": "2026-10-12T15:32:00.000Z",
  "path": "/api/work-orders/..."
}
```

---

## 7. Güvenlik Değerlendirmesi ve Bilinen Sınırlar

### Uygulanan Güvenlik Önlemleri
- **Parola Güvenliği:** Argon2id (zaman ve bellek maliyetli, GPU kaba kuvvet saldırılarına dayanıklı).
- **Session Hijacking Koruması:** Oturum token'ı veritabanında düz metin olarak değil, SHA-256 özeti olarak saklanır.
- **XSS Koruması:** Oturum anahtarı JavaScript'e kapalı (`HttpOnly`).
- **CSRF Önlemi:** Çerez `SameSite=Lax` olarak işaretlidir; durum değiştiren isteklerde Next.js proxy rewrite yapısı aynı-origin ortamı sunar.
- **SQL Injection:** Prisma ORM parametrik sorgular kullanır. Ham SQL sorguları bulunmamaktadır.
- **Bilgi Sızıntısı:** Yetkisiz veya var olmayan ID sorgularında kayıt varlığına dair ipucu verilmez; tutarlı 404 döner.

### Faz 4 Kapsamı Sınırları (Bilinçli Olarak Hariç Tutulanlar)
- **Harici Mesajlaşma Servisleri:** Doğrudan Twilio / Netgsm SMS API'si bağlanmamıştır. WhatsApp bilgilendirmeleri, kullanıcı onayıyla açılan `wa.me` taslak bağlantısı kuralına tam uygun olarak tasarlanmıştır.
- **Ödeme Entegrasyonu:** Gerçek İyzico / PayTR kredi kartı tahsilatı eklenmemiştir; avans ve tahmini tutarlar işletme muhasebe takibi amacıyla yerel veritabanında tutulmaktadır.
- **E-posta Gönderimi:** E-posta doğrulama veya şifre sıfırlama linki için harici SMTP/SendGrid entegrasyonu bağlanmamıştır.
- **Gelişmiş Raporlama & Muhasebe:** Faz 4 MVP kapsamında tutulmamıştır.

---

## 8. Faz 4 Kabul Beyanı

Faz 4 görev gereksinimlerinde belirtilen tüm hedefler; PostgreSQL altyapısı, Prisma şeması ve göçleri, oturum yönetimi, güvenli CRUD API'leri, atomik durum güncellemeleri, frontend entegrasyonu ve çok kiracılı güvenlik testleri eksiksiz olarak tamamlanmıştır.

Kullanıcı talimatı uyarınca **Faz 5'e geçilmemiştir**. Proje, stabil ve test edilmiş durumda Faz 4 kabulüne sunulmuştur.
