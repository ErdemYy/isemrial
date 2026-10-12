# İŞEMRİAL — FAZ 5.2 STAGING ORTAMI VE DAĞITIM DENETİMİ (PHASE 5.2 AUDIT)

**Tarih:** 12 Ekim 2026  
**Aşama:** Faz 5.2 — Staging Ortamı Hazırlığı ve Dağıtım Provatı Denetimi  
**Roller:** Kıdemli DevOps Mühendisi, Backend Mimarı, Uygulama Güvenliği Mühendisi, QA Sorumlusu  
**Kapsam:** Mevcut Docker Altyapısı, Ağ İletişimi, Sağlık Kontrolleri (Healthchecks), Ortam Değişkenleri İzolasyonu ve Staging Eksiklikleri  

---

## 1. Giriş ve Amaç

İşEmriAl Faz 5 ve 5.1 aşamalarında kod kalitesi, multi-tenant veri izolasyonu (sıfır IDOR), eşzamanlı iş emri oluşturma bütünlüğü ve güvenlik açıkları giderilmiş; RC-1 (Release Candidate) sürümü onaylanmıştır.

Faz 5.2'nin amacı, uygulamayı doğrudan canlı üretime almak yerine, **izole bir staging ortamında kontrollü bir yayın provası** gerçekleştirmektir. Bu denetim belgesi, mevcut altyapının durumunu, Docker yapılandırmasını, servis bağlantılarını ve staging ortamına geçiş için gereken adımları eksiksiz ortaya koyar.

---

## 2. Mevcut Docker Yapılandırması ve Konteyner İncelemesi

### 2.1 Veritabanı Servisi (`isemrial_postgres`)
- **İmaj:** `postgres:16-alpine`
- **Port:** `5433:5432` (Host portu 5433, konteyner içi 5432). Host makinede önceden var olan `aitrade_postgres` konteyneri port 5432'yi kullandığı için çakışmayı önlemek amacıyla 5433 olarak yapılandırılmıştır.
- **Kalıcı Depolama:** `isemrial_pgdata` Docker named volume (`/var/lib/postgresql/data`). Konteyner yeniden başlatıldığında veri kaybı yaşanmamaktadır.
- **Healthcheck:** `pg_isready -U postgres -d isemrial_dev` her 5 saniyede bir kontrol edilmektedir. Konteyner durumu `healthy` olarak raporlanmaktadır.

### 2.2 Frontend ve Backend Servisleri
- Şu anda `docker-compose.yml` yalnızca PostgreSQL veritabanını tanımlamaktadır.
- Next.js frontend ve NestJS backend servisleri host makinede Node.js süreçleri (port 3000 ve port 4000) olarak çalıştırılmaktadır.
- **Staging Tespiti:** Canlı benzeri bir staging ortamında veritabanı ayrımı (`isemrial_staging`) zorunludur. Geliştirme veritabanı (`isemrial_dev`) ile staging veritabanı kesinlikle birbirinden izole edilmelidir.

---

## 3. Frontend / Backend Bağlantısı ve Ağ Mimarisi

### 3.1 Next.js API Yönlendirmesi (Rewrites)
- `next.config.ts` dosyasında şu kural tanımlıdır:
  ```typescript
  destination: `${process.env.INTERNAL_API_URL || process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/:path*`
  ```
- Bu mimari sayesinde:
  1. İstemci tarayıcısı `/api/*` adresine istek attığında Next.js sunucusu bu isteği arka planda `INTERNAL_API_URL` adresine yönlendirir.
  2. Tarayıcı ile backend arasında CORS sorunları ve gereksiz açık port bağımlılıkları ortadan kalkar.
  3. Konteyner içi ağda (`http://backend:4000`) güvenli iç haberleşme sağlanır.

### 3.2 İstemci Tarafı Çerez ve Oturum İletişimi
- Oturum çerezi (`isemrial_session`), Next.js rewrite üzerinden aynen backend'e iletilmektedir.
- Backend, `req.cookies['isemrial_session']` değerini okuyup veritabanında doğrulamaktadır.
- Logout işleminde `res.clearCookie` yanıtı istemciye aktarılmaktadır.

---

## 4. Sağlık Kontrolleri (Healthchecks) ve Başlatma Sırası Dayanıklılığı

| Servis | Healthcheck Yöntemi | Mevcut Durum | Başlatma Bağımlılığı Riski |
| :--- | :--- | :---: | :--- |
| **PostgreSQL** | `pg_isready -U postgres -d isemrial_dev` | **Sağlıklı (Healthy)** | Konteyner başlatma süresi 2-4 saniye sürmektedir. |
| **NestJS API** | `GET /api/health` | **Sağlıklı (Healthy)** | Backend açılırken DB henüz ayağa kalkmadıysa `PrismaClientInitializationError (P1001)` ile kapanmaktadır. Docker dağıtımında `depends_on: { postgres: { condition: service_healthy } }` gereklidir. |
| **Next.js Frontend** | `GET /` veya SSR rotası | **Sağlıklı (Healthy)** | API henüz açık değilse SSR sayfaları hata mesajı vermeden istemciye yüklenmeli, API hazır olduğunda veri çekebilmelidir. |

---

## 5. Ortam Değişkenleri ve Gizlilik İncelemesi

### 5.1 Staging Değişken Ayrımı
Staging provası için geliştirme (`.env`) ortamından farklı parametreler gerekmektedir:
- `DATABASE_URL`: `postgresql://postgres:postgres@localhost:5433/isemrial_staging?schema=public`
- `NODE_ENV`: `production` (Üretim benzeri davranış, güvenlik başlıkları ve gizlenmiş stack traceler için).
- `SESSION_SECRET`: En az 32 karakterli güçlü ve staging'e özel anahtar.
- `NEXT_PUBLIC_ENABLE_DEMO_LOGIN`: `"false"` (Demo butonları gizlenmeli).
- `FRONTEND_ORIGIN`: Staging frontend adresi (`http://localhost:3000` veya staging domaini).

### 5.2 Secret Sızıntı Kontrolü
- `.gitignore` dosyası `.env`, `.env.local`, `.env.staging` ve `.env.production` dosyalarını hariç tutmaktadır.
- `git status` denetiminde hiçbir gerçek kimlik veya secret Git takibinde bulunmamaktadır.
- `NEXT_PUBLIC_` önekli değişkenlerde hiçbir özel anahtar veya veritabanı bilgisi bulunmamaktadır.

---

## 6. HTTPS ve Çerez Sınırları Beyanı

- **Mevcut Durum:** Proje yerel iş istasyonunda geliştirilmektedir. Harici bir genel IP'ye bağlı gerçek bir alan adı (örn: `staging.isemrial.com`) veya Let's Encrypt / Cloudflare SSL sertifikası şu an için temin edilmemiştir (Kullanıcı kuralı: *"Alan adı satın alma veya DNS kayıtlarını değiştirme. Ücretli servis bağlama."*).
- **Yerel Sınır:** Tarayıcılar `localhost` ve `127.0.0.1` adreslerini güvenli bağlam (Secure Context) olarak kabul eder. Ancak gerçek genel HTTPS ortamında HSTS, sertifika zinciri, Mixed Content ve üçüncü taraf çerez kısıtlamaları farklılık gösterebilir.
- **Açık Beyan:** Faz 5.2 kapsamında yerel HTTPS simülasyonu ve çerez güvenlik bayrakları (`HttpOnly`, `SameSite=Lax`, `Path=/`, üretimde `Secure`) kod ve yerel sunucu düzeyinde test edilmektedir. Ancak gerçek internet üzerinde harici HTTPS provası yapılmadığı açıkça raporlanır.

---

## 7. Staging İçin Eksik Parçalar ve Uygulama Planı

Staging provasını gerçekleştirmek için gereken adımlar:

1. **İzole Staging Veritabanının Oluşturulması:**
   `isemrial_postgres` konteyneri içinde `isemrial_staging` veritabanı oluşturulmalıdır.
2. **Migration Uygulaması:**
   `prisma migrate deploy` komutu `DATABASE_URL` staging hedefiyle çalıştırılarak temiz şema kurulmalıdır.
3. **Staging Seed İşlemi:**
   Yalnızca staging testleri için güvenli, kontrollü test verisi oluşturulmalıdır.
4. **Yedekleme ve Geri Yükleme Provatı (Backup & Restore Rehearsal):**
   - `isemrial_staging` veritabanından `pg_dump` ile SQL yedeği alınmalıdır.
   - İzole bir `isemrial_restore_test` veritabanı açılmalıdır.
   - Yedek `isemrial_restore_test` veritabanına geri yüklenmeli ve tabloların tamlığı (`Customer`, `WorkOrder`, `TimelineEvent`, `Session`) doğrulanmalıdır.
5. **E2E Kullanıcı Kabul Testleri (UAT):**
   12 temel kullanıcı senaryosu gerçek staging veritabanı üzerinden koşturulmalıdır.
6. **Dokümantasyon:**
   `docs/PHASE_5_2_REVIEW.md` ve `docs/STAGING_RUNBOOK.md` oluşturulmalıdır.
