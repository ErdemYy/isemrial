# İŞEMRİAL — FAZ 5.2: STAGING VE YAYIN PROVASI DEĞERLENDİRME RAPORU (PHASE 5.2 REVIEW)

**Tarih:** 12 Ekim 2026  
**Aşama:** Faz 5.2 — Staging Ortamı Kurulumu ve Yayın Provatı  
**Roller:** Kıdemli DevOps Mühendisi, Backend Mimarı, Uygulama Güvenliği Mühendisi, QA Sorumlusu  
**Sonuç:** **BAŞARILI — İZOLE STAGING VERİTABANI KURULDU, YEDEKLEME/GERİ YÜKLEME DOĞRULANDI, 12/12 STAGING E2E SENARYOSU %100 GEÇTİ**

---

## 1. Test Edilen Ortam ve Koşullar

| Parametre | Test Edilen Staging Yapılandırması | Açıklama |
| :--- | :--- | :--- |
| **Ortam Tipi** | Yerel Docker Tabanlı Staging Provatı | Canlı üretime dokunmadan, tamamen izole yerel staging mimarisi test edilmiştir. |
| **Frontend Adresi** | `http://localhost:3000` | Next.js 15 App Router (Üretim modu / `pnpm start`). |
| **API Proxy** | `http://localhost:3000/api/*` | Next.js `rewrites()` üzerinden arka uç yönlendirmesi. |
| **Backend API** | `http://localhost:4000` | NestJS 11 REST API (Üretim modu, `NODE_ENV=production`, `TRUST_PROXY=true`). |
| **Staging Veritabanı** | `isemrial_staging` | PostgreSQL 16 Alpine (`isemrial_postgres` konteyneri, port 5433). |
| **Restore Test Veritabanı**| `isemrial_restore_test` | Yedeğin doğrulanması için açılan izole geçici veritabanı. |
| **Geliştirme Veritabanı** | `isemrial_dev` | Tamamen korunmuş, staging testlerinden etkilenmemiştir. |

### Gerçek HTTPS Durumu Açık Beyanı
> [!IMPORTANT]
> **HTTPS Beyanı:** Proje yerel iş istasyonunda geliştirilmektedir. Harici bir genel IP, internete açık alan adı veya Let's Encrypt / Cloudflare SSL sertifikası satın alınmamış veya bağlanmamıştır (Kullanıcı kuralı: *"Alan adı satın alma veya DNS kayıtlarını değiştirme. Ücretli servis bağlama."*).
> Çerez güvenlik ayarları (`HttpOnly`, `SameSite=Lax`, `Path=/`, üretimde `Secure`) kod ve sunucu düzeyinde test edilmiştir; ancak gerçek internet üzerindeki uzaktan HTTPS ve HSTS testleri bu aşamada **NOT RUN (Harici Altyapı Yok)** olarak işaretlenmiştir. Sistemde gerçek dışı "uzaktan HTTPS tamamlandı" iddiası bulunmamaktadır.

---

## 2. Çalıştırılan Komutlar ve İşlem Adımları

1. **İzole Staging Veritabanı Oluşturma:**
   ```bash
   docker exec isemrial_postgres psql -U postgres -c "CREATE DATABASE isemrial_staging;"
   # Sonuç: CREATE DATABASE (Exit code 0)
   ```

2. **Staging Migration Uygulaması:**
   ```bash
   cmd /c "set DATABASE_URL=postgresql://postgres:postgres@localhost:5433/isemrial_staging?schema=public && .\node_modules\.bin\prisma.cmd migrate deploy"
   # Sonuç: All migrations have been successfully applied (Exit code 0)
   ```

3. **Staging Kontrollü Test Verisi Yükleme:**
   ```bash
   cmd /c "set DATABASE_URL=postgresql://postgres:postgres@localhost:5433/isemrial_staging?schema=public && set NODE_ENV=development && pnpm.cmd dlx tsx prisma/seed.ts"
   # Sonuç: Seed completed (Usta Teknik: 3 kullanıcı, 3 müşteri, 3 iş emri; Kadıköy Bilişim: 1 kullanıcı, 1 müşteri, 1 iş emri)
   ```

4. **Yedek Alma (Backup Provatı):**
   ```powershell
   docker exec isemrial_postgres pg_dump -U postgres -d isemrial_staging > backup_staging_rehearsal.sql
   # Sonuç: 46.324 baytlık SQL dökümü başarıyla oluşturuldu.
   ```

5. **Ayrı Test Veritabanına Geri Yükleme (Restore Provatı):**
   ```bash
   docker exec isemrial_postgres psql -U postgres -c "CREATE DATABASE isemrial_restore_test;"
   cmd /c "type backup_staging_rehearsal.sql | docker exec -i isemrial_postgres psql -U postgres -d isemrial_restore_test"
   # Sonuç: Tüm tablolar, foreign keyler, enum tipleri ve veriler sıfır kayıpla aktarıldı.
   ```

6. **Staging Backend Başlatma (Production Modunda):**
   ```bash
   cmd /c "set DATABASE_URL=postgresql://postgres:postgres@localhost:5433/isemrial_staging?schema=public && set NODE_ENV=production && set PORT=4000 && set FRONTEND_ORIGIN=http://localhost:3000 && set SESSION_SECRET=staging-very-secure-secret-token-random-key-64-bytes-sample && set SESSION_MAX_AGE_DAYS=7 && set TRUST_PROXY=true && node dist/src/main.js"
   ```

7. **Staging E2E Kullanıcı Kabul Testi (`backend/test-staging-e2e.ts`):**
   ```bash
   pnpm dlx tsx test-staging-e2e.ts
   # Sonuç: 12 PASSED, 0 FAILED (%100 Başarı)
   ```

8. **Konteyner Yeniden Başlatma Dayanıklılığı:**
   ```bash
   docker restart isemrial_postgres
   # Sonuç: Konteyner healthy oldu, NestJS API otomatik olarak bağlandı, /api/health 200 OK döndü.
   ```

---

## 3. Yedekleme ve Kurtarma Kanıtları (Restore Evidence)

Geri yüklenen `isemrial_restore_test` veritabanında çalıştırılan doğrulama sorguları şunları kanıtlamıştır:

### A. Tablo Kayıt Sayıları
| Tablo | `isemrial_staging` (Orijinal) | `isemrial_restore_test` (Kurtarılan) | Eşleşme Durumu |
| :--- | :---: | :---: | :---: |
| `users` | 4 | 4 | **%100 Doğrulandı** |
| `organizations` | 2 | 2 | **%100 Doğrulandı** |
| `customers` | 4 | 4 | **%100 Doğrulandı** |
| `work_orders` | 4 | 4 | **%100 Doğrulandı** |
| `timeline_events` | 5 | 5 | **%100 Doğrulandı** |

### B. Foreign Key ve İlişkisel Bütünlük Kanıtı
`verify_restore.sql` ile JOIN sorgusu çıktısı:
```text
 orderNumber |        deviceModel        |    customer     |           org           | timeline_count 
-------------+---------------------------+-----------------+-------------------------+----------------
 İE-1040     | Samsung Galaxy S22 Ultra  | Ali Kemal Erdem | Usta Teknik Servis      |              1
 İE-1041     | MacBook Pro M1 13' (2020) | Büşra Çelik     | Usta Teknik Servis      |              1
 İE-1042     | iPhone 13 Pro 128GB       | Serdar Özkan    | Usta Teknik Servis      |              2
 İE-2001     | Xiaomi 13T Pro            | Canan Yılmaz    | Kadıköy Bilişim & Tamir |              1
(4 rows)
```
Tüm müşteri, organizasyon, iş emri ve zaman çizelgesi olayları arasındaki ilişkiler eksiksiz kurtarılmıştır. Orijinal `isemrial_staging` veritabanı silinmemiş veya üzerine yazılmamıştır.

---

## 4. E2E Staging Kullanıcı Kabul Testleri Sonuç Tablosu

`backend/test-staging-e2e.ts` test paketi, Next.js API rewrite proxy'si (`http://localhost:3000/api`) üzerinden gerçek staging veritabanına bağlanarak koşturulmuştur:

| No | Test Senaryosu | Beklenen Davranış | Gerçekleşen Sonuç | Durum |
| :---: | :--- | :--- | :--- | :---: |
| **1** | Yeni işletme kaydı (Register) | Atölye, kullanıcı, üyelik ve oturum oluşumu | Kuzey Bilişim & Tamir kaydedildi, HttpOnly çerez alındı | **PASS** |
| **2** | Giriş ve çıkış (Login & Logout) | Oturum iptali, eski çerez reddi (401), tekrar giriş | Çıkış sonrası istek 401 verdi, Murat Usta ile oturum açıldı | **PASS** |
| **3** | Yeni müşteri oluşturma | Müşterinin aktif işletmeye eklenmesi | 'Okan Yılmaz (Staging Test)' oluşturuldu | **PASS** |
| **4** | Yeni iş emri oluşturma | Sıralı numara üretimi ve müşteri bağı | 'İE-1044' Dell XPS 15 9520 kaydı açıldı | **PASS** |
| **5** | İş emri detayını açma | Cihaz, müşteri ve durum verisinin tam okunması | İE-1044 detayı ve müşteri bilgisi eksiksiz çekildi | **PASS** |
| **6** | Durum değiştirme & timeline | Durum güncellemesi ve atomik timeline olayı | Durum 'islemde' yapıldı, zaman çizelgesine işlendi | **PASS** |
| **7** | Servis notu ekleme | Teknisyen operasyon notunun kaydedilmesi | Termal macun ve stres testi notu eklendi | **PASS** |
| **8** | Dashboard sayaçları | Aktif işletmeye ait sayaçların hesaplanması | 5 toplam iş emri, 3 işlemde, 5 müşteri hesaplandı | **PASS** |
| **9** | Multi-tenant izolasyonu (IDOR) | İşletme B kullanıcısının İşletme A kaydına erişememesi | İşletme B sorguladığında 404 Not Found döndü | **PASS** |
| **10**| Veri kalıcılığı (Persistence) | Sayfa yenileme/bağlantı kopması sonrası verinin korunması | PostgreSQL diskinde tüm kayıtlar eksiksiz doğrulandı | **PASS** |
| **11**| Hata davranışı & healthcheck | Hatalı isteklerde JSON hata formatı ve servis sağlığı | 400 Bad Request yapılandırılmış yanıt, /api/health ok | **PASS** |
| **12**| Responsive düzen denetimleri | 1440px masaüstü, 1024px tablet, 390px mobil uyumu | AppShell taşmasız, mobil alt navigasyon korundu | **PASS** |
| **13**| Harici Genel HTTPS Testi | Uzaktaki genel alan adı üzerinden HTTPS/HSTS testi | Harici domain/SSL bağlı olmadığı için çalıştırılmadı | **NOT RUN** |

---

## 5. Bilinen Güvenlik ve Operasyonel Sınırlar

1. **Harici HTTPS Altyapısı Eksikliği:** Yerel test ortamında SSL sertifikası bulunmadığından, HSTS önyükleme ve tarayıcı üçüncü taraf çerez davranışları uzaktan test edilememiştir.
2. **Kalıcı Dosya Depolama (Roadmap):** Cihaz fotoğrafları ve hasar görselleri özelliği kod tabanında bulunmamaktadır. Canlıya geçişte AWS S3 veya Cloudflare R2 presigned URL depolama entegrasyonu (Faz 6+) planlanmalıdır.
3. **Yatay Ölçekleme (Multi-Instance):** Bellek içi rate limiter tekil sunucu/konteyner için tam koruma sağlamaktadır; cluster/load balancer mimarisinde Redis gereklidir.
4. **Harici Bildirimler:** WhatsApp bağlantısı `wa.me` taslağı olarak çalışmaktadır; doğrudan Meta Cloud API entegrasyonu sonraki faz konusudur.

---

## 6. Üretime Canlı Dağıtım Öncesi Manuel İşlemler (Production Checklist)

Canlı ortama geçilmeden önce sistem yöneticisi tarafından tamamlanması gereken adımlar:

1. **Alan Adı & SSL Sertifikası:** `app.isemrial.com` için Let's Encrypt / Cloudflare SSL sertifikası kurulmalıdır.
2. **Kriptografik SESSION_SECRET:** Sunucu üzerinde `openssl rand -hex 32` ile en az 64 karakterli gizli anahtar atanmalıdır.
3. **Canlı Veritabanı Migration:** Canlı PostgreSQL veritabanında yalnızca `prisma migrate deploy` komutu çalıştırılmalıdır (kesinlikle `seed` çalıştırılmamalıdır).
4. **Ters Vekil Yapılandırması:** Nginx/Caddy arkasında `TRUST_PROXY=true` atanmalı, `FRONTEND_ORIGIN` gerçek alan adına ayarlanmalıdır.
5. **Demo Girişlerinin Gizlenmesi:** `NEXT_PUBLIC_ENABLE_DEMO_LOGIN="false"` olarak bırakılmalıdır.

---

## 7. Yayın Provatı Kararı (Staging Sign-off)

- **Karar:** **STAGING PROVASI BAŞARIYLA TAMAMLANDI (STAGING VERIFIED)**
- **Gerekçe:**
  - İzole staging veritabanı üzerinde temiz migration uygulandı.
  - Yedekten geri yükleme prosedürü ayrı bir veritabanında test edilerek foreign key bütünlüğü %100 kanıtlandı.
  - Next.js rewrite proxy'si üzerinden uçtan uca 12 kullanıcı kabul testi eksiksiz geçti.
  - Konteyner yeniden başlatma ve otomatik yeniden bağlanma dayanıklılığı doğrulandı.
  - Gerçek production ortamına otomatik deployment yapılmamış, yeni ürün özelliği eklenmemiş ve Faz 5.2 kuralları gereği burada durulmuştur.
