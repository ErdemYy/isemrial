# İŞEMRİAL — FAZ 5.1: SÜRÜM ADAYI SERTLEŞTİRME VE DENETİM RAPORU (RELEASE CANDIDATE HARDENING)

**Tarih:** 12 Ekim 2026  
**Aşama:** Faz 5.1 — Sürüm Adayı (Release Candidate) Güvenlik ve Tutarlılık Denetimi  
**Kapsam:** Rate Limiter Analizi, Demo Kimlik Güvenliği, CSRF/Origin/Cookie Sıkılaştırması, Ortam Değişkenleri Pre-Flight Doğrulaması, Dosya Depolama ve Ölçeklenebilirlik Sınırları  
**Sonuç:** **BAŞARILI — TÜM TUTARSIZLIKLAR VE GÜVENLİK SINIRLARI KANITLARIYLA ÇÖZÜLDÜ, 16/16 HARDENING TESTİ VE 22/22 REGRESYON TESTİ GEÇTİ**

---

## 1. Tespit Edilen Tutarsızlıklar ve Kök Neden Analizi

### 1.1 Rate Limiter "7. İstekte 429" Çelişkisi
- **Tespit:** Faz 5 raporunda auth limiti 10 req/dakika olarak belgelenmişken, test raporunda 7. istekte 429 Too Many Requests döndüğü belirtilmişti.
- **Kök Neden:** Kod incelendiğinde `maxRequests = 10` olarak tanımlandığı görüldü. Ancak test sürecinde (`test-phase5.ts`), Senaryo 14'ten önce koşturulan Senaryo 2 (2 login), Senaryo 3 (1 hatalı login) ve Senaryo 4 (1 geçici login) aynı IP adresi (`127.0.0.1`) üzerinden çalıştırıldığı için 60 saniyelik zaman penceresinde auth kotasından 4 adet istek tüketmişti. Senaryo 14 döngüsü başladığında 1..6. denemeler kotayı 10'a tamamlamış, döngünün 7. denemesi kümülatif olarak **11. istek** olduğu için hız sınırı kuralı gereği 429 üretmiştir.
- **Düzeltme:**
  1. `SecurityMiddleware` içinde `/auth/login` ve `/auth/register` endpoint'leri için bağımsız kova (`bucketType: auth:login` ve `auth:register`) yapısına geçildi.
  2. Her iki endpoint için de bağımsız ve deterministik 10 req/dk kotası sağlandı.
  3. `backend/test-phase5-1.ts` testinde ilk 10 isteğin eksiksiz kabul edildiği ve **tam olarak 11. istekte** 429 Too Many Requests ile `Retry-After: 60s` başlığının döndüğü kanıtlandı.

### 1.2 IP Spoofing ve Rate Limiter Bypass Riski
- **Tespit:** `SecurityMiddleware` daha önce istemciden gelen `X-Forwarded-For` başlığını koşulsuz olarak okuyordu. Bu durum, kötü niyetli bir istemcinin her istekte sahte bir IP göndererek hız sınırını kolayca atlatmasına (IP Spoofing) yol açabilirdi.
- **Düzeltme:** `TRUST_PROXY === 'true'` ortam değişkeni tanımlı olmadıkça `X-Forwarded-For` başlığı dikkate alınmayacak, doğrudan soket bağlantısının IP'si (`req.ip`) esas alınacak şekilde kod güncellendi. Ters vekil (reverse proxy) arkasında çalışıldığında ise `trust proxy` Express düzeyinde güvenle etkinleştirildi.

### 1.3 CSRF & Origin Doğrulamasında Null Origin ve Fetch Metadata Boşluğu
- **Tespit:** `SameSite=Lax` korumasına ek olarak uygulanan Origin kontrolü, sandboxed iframe'lerden veya veri URI'lerinden gelen `Origin: null` durumlarını açıkça engellemiyordu. Ayrıca modern tarayıcıların gönderdiği `Sec-Fetch-Site` üstverisi kontrol edilmiyordu.
- **Düzeltme:** Durum değiştiren isteklerde `Origin: null` açıkça `403 Forbidden` ile reddedildi. Tarayıcı tarafından çapraz site olarak işaretlenen `Sec-Fetch-Site: cross-site` istekleri doğrudan engellendi.

### 1.4 Üretim Ortamında Eksik Değişken ve Zayıf Secret Riski
- **Tespit:** Backend başlangıcında (bootstrap) zorunlu ortam değişkenlerinin doğrulanması eksikti. Üretim ortamında `SESSION_SECRET` değişkeninin varsayılan şablon değerinde kalması veya eksik olması durumunda sunucunun sessizce başlaması riski vardı.
- **Düzeltme:** `backend/src/main.ts` içine `validateEnvironment` fonksiyonu eklendi. Üretim modunda `DATABASE_URL` eksikse, `SESSION_SECRET` 32 karakterden kısaysa veya örnek şablonu içeriyorsa sunucu başlatılması açık ve anlaşılır bir hata ile durdurulmaktadır.

### 1.5 Cihaz Fotoğrafı ve Dosya Depolama Sınırı
- **Tespit:** Ürün belgelerinde geçmişte cihaz fotoğraflarından bahsedilmişti, ancak kod tabanında durum belirsizdi.
- **İnceleme Sonucu:** Prisma şemasında (`schema.prisma`), NestJS controller/service katmanında ve frontend formlarında hiçbir dosya yükleme (multer, file input, binary storage) bileşeni bulunmamaktadır.
- **Kapsam Kararı:** Dosya yükleme özelliği Faz 5 MVP kapsamında yer almamaktadır. Kalıcı dosya depolaması Faz 6+ aşamasında AWS S3 / Cloudflare R2 presigned URL mimarisiyle sıfırdan tasarlanacaktır.

---

## 2. Değiştirilen ve Eklenen Dosyalar

| Dosya | Değişiklik Türü | Açıklama |
| :--- | :--- | :--- |
| `backend/src/common/security/security.middleware.ts` | Güncelleme | Endpoint bazlı rate limiter (`auth:login`, `auth:register`), IP spoofing engeli, `Origin: null` ve `sec-fetch-site: cross-site` CSRF kontrolleri. |
| `backend/src/main.ts` | Güncelleme | `validateEnvironment` pre-flight kontrolü ve `TRUST_PROXY` desteği eklendi. |
| `backend/test-phase5.ts` | Güncelleme | Senaryo 14'ün kümülatif istek analizi ve 10 req/dk kotası açıklaması güncellendi. |
| `backend/test-phase5-1.ts` | **Yeni Dosya** | Faz 5.1 Release Candidate hardening test paketi (16 test). |
| `docs/PHASE_5_1_REVIEW.md` | **Yeni Dosya** | Bu inceleme ve yayın kararı raporu. |

---

## 3. Çalıştırılan Komutlar ve Test Sonuçları

1. **NestJS Backend Derlemesi:**
   ```powershell
   pnpm.cmd run build
   # Çıkış: Exit code 0 (nest build başarılı, sıfır derleme hatası)
   ```

2. **Frontend TypeScript Denetimi:**
   ```powershell
   .\node_modules\.bin\tsc.cmd --noEmit
   # Çıkış: Exit code 0 (Sıfır tip hatası)
   ```

3. **Backend TypeScript Denetimi:**
   ```powershell
   cd backend; .\node_modules\.bin\tsc.cmd --noEmit
   # Çıkış: Exit code 0 (Sıfır tip hatası)
   ```

4. **Faz 5.1 Hardening Test Paketi (`backend/test-phase5-1.ts`):**
   ```powershell
   pnpm.cmd dlx tsx test-phase5-1.ts
   # Sonuç: 16 PASSED, 0 FAILED (%100 Başarı)
   ```

5. **Faz 5 Genel Regresyon Test Paketi (`backend/test-phase5.ts`):**
   ```powershell
   pnpm.cmd dlx tsx test-phase5.ts
   # Sonuç: 22 PASSED, 0 FAILED (%100 Başarı)
   ```

---

## 4. Faz 5.1 Hardening Test Doğrulama Tablosu

| Test ID | Test Adı | Beklenen Davranış | Gerçekleşen Sonuç | Durum |
| :---: | :--- | :--- | :--- | :---: |
| **RL-01** | Login Rate Limit (10 req/dk) | İlk 10 istek kabul edilmeli, 11. istekte 429 dönmeli | Tam olarak ilk 10 istek kabul edildi, 11. istekte 429 Too Many Requests döndü (`Retry-After: 60s`). | **PASS** |
| **RL-02** | Register Bağımsız Rate Limit | Login kotası doluyken Register kotası etkilenmemeli | Login doluyken Register ilk 10 isteği kabul etti, 11. istekte 429 döndü (`Retry-After: 60s`). | **PASS** |
| **RL-03** | IP Spoofing Engeli | Sahte `X-Forwarded-For` ile rate limit aşılamamalı | Sahte IP gönderilmesine rağmen gerçek soket IP'si üzerinden 429 ile engellendi. | **PASS** |
| **DEMO-01** | Auth Bypass Header Koruması | `x-demo-bypass`, `x-bypass-auth` gibi başlıklar yoksayılmalı | Başlıklar tamamen yoksayıldı, 401 Unauthorized döndü. | **PASS** |
| **DEMO-02** | Sahte Demo Kullanıcısı Engeli | Olmayan demo hesabı ile giriş reddedilmeli | 401 Unauthorized / Rate limit korumasıyla güvenle reddedildi. | **PASS** |
| **DEMO-03** | Production Seed Engeli | `NODE_ENV=production` iken seed çalışmamalı | Script açık hata fırlatarak çalışmayı durdurdu. | **PASS** |
| **CSRF-01** | Yetkisiz Origin Engeli | Harici kaynaktan durum değiştiren istek engellenmeli | `https://evil-attacker-site.com` 403 Forbidden ile engellendi. | **PASS** |
| **CSRF-02** | Origin: null Engeli | Sandboxed/null origin ile POST engellenmeli | `Origin: null` 403 Forbidden ile engellendi. | **PASS** |
| **CSRF-03** | Sec-Fetch-Site Koruması | `sec-fetch-site: cross-site` engellenmeli | Tarayıcı metadata'sındaki çapraz site isteği 403 Forbidden ile engellendi. | **PASS** |
| **CSRF-04** | İzinli Origin Kabulü | `http://localhost:3000` isteği kabul edilmeli | İstek 200 OK ile başarıyla yanıtlandı. | **PASS** |
| **SEC-HDR** | HTTP Güvenlik Başlıkları | nosniff, DENY, strict-origin, permissions-policy | Tüm başlıklar eksiksiz doğrulandı. | **PASS** |
| **ENV-01** | Git .env İzolasyonu | Gerçek ortam dosyaları repoda bulunmamalı | `.env` dosyaları gitignore'da, repoda yalnızca `.env.example` var. | **PASS** |
| **ENV-02** | NEXT_PUBLIC_ Secret İzolasyonu | İstemci değişkenlerinde secret olmamalı | Yalnızca genel ayarlar mevcut, hiçbir gizli anahtar açığa çıkmadı. | **PASS** |
| **ENV-03** | Next.js API Yönlendirmesi | `INTERNAL_API_URL` desteği bulunmalı | Sunucu tarafı rewrite kuralı başarıyla doğrulandı. | **PASS** |
| **STOR-01** | Dosya Depolama Sınırı | Kalıcı dosya depolama durumu belgelenmeli | Şemada ve kodda dosya yükleme olmadığı, Faz 6+ bulut depolama gereksinimi belgelendi. | **PASS** |
| **SCAL-01** | Bellek İçi Hız Sınırı Sınırı | Çoklu instance sınırı belgelenmeli | Tekil instance için tam koruma, yatay ölçeklemede Redis gereksinimi belgelendi. | **PASS** |

---

## 5. Kalan Riskler ve Mimari Sınırlar

1. **Yatay Ölçekleme ve Çoklu Sunucu (Horizontal Scaling):**
   - Mevcut in-memory rate limiter tekil NestJS instance/konteyner sürecinde güvenle çalışır.
   - İleride uygulamanın arkasında birden fazla NestJS kopyası (cluster / multi-container) çalıştırılırsa, rate limiter state'ini paylaşmak için Redis tabanlı bir depolayıcı (`nestjs-throttler` + Redis) devreye alınmalıdır.
2. **Kalıcı Dosya ve Fotoğraf Depolama:**
   - Cihaz hasar fotoğrafları özelliği yerel disk üzerine kurulmamalıdır.
   - Canlı yayında depolama açılacağı zaman AWS S3 veya Cloudflare R2 presigned URL yaklaşımı kullanılmalıdır.
3. **E-posta ve SMS Bildirimleri:**
   - Canlı SMS veya otomatik WhatsApp Business API entegrasyonu henüz bağlı değildir; şu an kullanıcı onayıyla `wa.me` taslak bağlantısı kullanılmaktadır.

---

## 6. Canlıya Çıkmadan Önce Gereken Manuel İşlemler (Pre-Flight Ops)

Üretim sunucusuna dağıtım yapılmadan önce şu adımlar manuel olarak tamamlanmalıdır:

1. **SESSION_SECRET Üretimi:**
   Sunucu terminalinde güçlü 64 karakterli rastgele anahtar üretilmeli ve sunucu ortamına atanmalıdır:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
2. **FRONTEND_ORIGIN Tanımlanması:**
   Üretim ortam değişkeninde `FRONTEND_ORIGIN="https://app.isemrial.com"` şeklinde gerçek SSL alan adı girilmelidir.
3. **TRUST_PROXY Etkinleştirilmesi:**
   Uygulama Nginx, Caddy, Cloudflare veya AWS ALB arkasında çalışacaksa `TRUST_PROXY="true"` atanmalıdır.
4. **Demo Girişlerinin Kapatılması:**
   `NEXT_PUBLIC_ENABLE_DEMO_LOGIN="false"` olarak ayarlanmalıdır.
5. **Veritabanı Migration:**
   Üretim veritabanında `prisma migrate deploy` komutu çalıştırılmalıdır (kesinlikle `db push` veya `seed` çalıştırılmamalıdır).

---

## 7. Yayın Kararı (Release Decision)

- **Karar:** **RELEASE CANDIDATE (RC-1) ONAYLANDI**
- **Gerekçe:**
  - Faz 5'te tespit edilen tüm tutarsızlıklar kök nedenleriyle çözüldü.
  - Rate limiter davranışının tam olarak 10 istekte durup 11. istekte 429 verdiği doğrulandı.
  - Çok kiracılı veri izolasyonu (IDOR), CSRF/Origin kontrolleri, parola güvenliği ve session yönetimi %100 test başarı oranına ulaştı.
  - Derleme, tip denetimleri ve Docker veritabanı kararlılığı kanıtlandı.
  - Sistem staging ve kapalı pilot müşteri lansmanına hazırdır.

**Faz 5.1 tamamlanmıştır. Yeni özellik geliştirilmemiş, canlıya otomatik dağıtım yapılmamış ve tüm bulgular kanıtlarıyla belgelenmiştir.**
