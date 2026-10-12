# İŞEMRİAL — FAZ 5 KALİTE, GÜVENLİK VE YAYIN DENETİMİ RAPORU (AUDIT)

**Tarih:** 12 Ekim 2026  
**Roller:** Kıdemli Yazılım Mimarı, Uygulama Güvenliği Mühendisi, QA Mühendisi, DevOps Mühendisi, Ürün Kalite Sorumlusu  
**Amaç:** Üretim Öncesi Kapsamlı Kod Tabanı, Güvenlik, Veri Bütünlüğü ve Altyapı Denetimi

---

## 1. Yönetici Özeti ve Denetim Metodolojisi

İşEmriAl Faz 0–4 aşamalarında; Next.js 15 frontend'i, Bubilet referanslı kullanıcı arayüzü, PostgreSQL 16 veritabanı, Prisma 6 ORM ve NestJS 11 backend mimarisi inşa edilmiştir.

Faz 5 denetimi, yeni bir işlevsellik geliştirmeden önce uygulamanın üretim ortamında karşılaşabileceği güvenlik zafiyetlerini, veri bütünlüğü risklerini, eşzamanlılık (concurrency) sorunlarını ve operasyonel eksiklikleri tespit etmek amacıyla gerçekleştirilmiştir.

Denetim kategorileri:
- **Critical:** Sistemin çökmesine, veri kaybına veya doğrudan yetkisiz veri sızıntısına yol açabilecek açıklar.
- **High:** Güvenlik savunma mekanizmalarında ciddi boşluk oluşturan (brute-force, race condition, CSRF vb.) açıklar.
- **Medium:** Üretim ortamında istenmeyen davranışlar veya konfigürasyon kusurları.
- **Low:** Kod kalitesi, aşırı esnek izinler veya küçük tutarsızlıklar.
- **Informational:** İkincil bağımlılıklar ve operasyonel bilgilendirmeler.

---

## 2. Tespit Edilen Bulgular Tablosu

| # | Başlık | Seviye | Dosya / Konum | Durum |
|---|---|---|---|---|
| SEC-01 | Eşzamanlı İş Emri Numaralandırmasında Race Condition & Çakışma Riski | **High** | `backend/src/work-orders/work-orders.service.ts` | Düzeltilecek |
| SEC-02 | Kimlik Doğrulama Endpoint'lerinde İstek Hız Sınırı (Rate Limiting) Yokluğu | **High** | `backend/src/main.ts`, `backend/src/auth/` | Düzeltilecek |
| SEC-03 | HTTP Güvenlik Başlıkları (Security Headers) Eksikliği | **Medium** | `backend/src/main.ts` | Düzeltilecek |
| SEC-04 | State-Changing İsteklerde Origin / CSRF Doğrulaması Eksikliği | **High** | `backend/src/main.ts`, `backend/src/common/guards/` | Düzeltilecek |
| SEC-05 | Üretim Modunda Demo Test Girişlerinin `/login` Ekranında Görünmesi | **Medium** | `src/app/login/page.tsx` | Düzeltilecek |
| SEC-06 | `next.config.ts` Proxy Hedefinde Sunucu Sırrı İfşası Riski (`NEXT_PUBLIC_`) | **Medium** | `next.config.ts` | Düzeltilecek |
| SEC-07 | `OrganizationsController.updateCurrent` İçin DTO Validasyonu Eksikliği | **Medium** | `backend/src/organizations/` | Düzeltilecek |
| SEC-08 | Üretim Modunda Yerel Origin'lerin CORS Listesinde Açık Kalması | **Low** | `backend/src/main.ts` | Düzeltilecek |
| SEC-09 | Seed Script'in Üretimde Hata Vermek Yerine Sessizce Sonlanması | **Low** | `backend/prisma/seed.ts` | Düzeltilecek |
| SEC-10 | Transitive Bağımlılık Güvenlik Uyarıları (`postcss`, `deepmerge-ts`) | **Informational**| Kök & Backend `package.json` | Belgelenecek |

---

## 3. Detaylı Bulgu İncelemeleri

### SEC-01: Eşzamanlı İş Emri Numaralandırmasında Race Condition & Çakışma Riski
- **Konum:** [backend/src/work-orders/work-orders.service.ts:L241-L244](file:///c:/Users/Okul/OneDrive/Belgeler/İşEmriAl/backend/src/work-orders/work-orders.service.ts#L241-L244)
- **Seviye:** **High**
- **Kanıt:**
  ```typescript
  const count = await tx.workOrder.count({ where: { organizationId } });
  const nextNum = 1040 + count + 1;
  const orderNumber = `İE-${nextNum}`;
  ```
- **Olası Etki:** İki veya daha fazla kullanıcı aynı anda yeni iş emri kaydettiğinde, her iki transaksiyon da aynı `count` değerini okur ve aynı `orderNumber`ı (`İE-1044` vb.) üretmeye çalışır. Veritabanındaki `@@unique([organizationId, orderNumber])` kısıtı nedeniyle transaksiyonlardan biri `P2002 Unique constraint failed` hatasıyla iptal edilir ve teknisyenin kaydı başarısız olur. Ayrıca silinen kayıt olduğunda numara mükerrer hesaplanır.
- **Yeniden Üretme:** İki eşzamanlı `POST /api/work-orders` çağrısı yapıldığında numara çakışması.
- **Önerilen Düzeltme:** Organizasyona ait mevcut en yüksek numarayı regex/sıralama ile çekmek (`findFirst({ orderBy: { createdAt: 'desc' } })`), çakışma durumunda transaksiyon içinde retry mekanizması uygulamak.

---

### SEC-02: Kimlik Doğrulama Endpoint'lerinde İstek Hız Sınırı (Rate Limiting) Yokluğu
- **Konum:** [backend/src/main.ts](file:///c:/Users/Okul/OneDrive/Belgeler/İşEmriAl/backend/src/main.ts), [backend/src/auth/auth.controller.ts](file:///c:/Users/Okul/OneDrive/Belgeler/İşEmriAl/backend/src/auth/auth.controller.ts)
- **Seviye:** **High**
- **Kanıt:** Projede herhangi bir Throttler / Rate Limit middleware veya guard'ı yapılandırılmamıştır.
- **Olası Etki:** Kötü niyetli kullanıcılar `/api/auth/login` uç noktasına binlerce deneme yaparak parola kırma (brute-force) veya `/api/auth/register` ile toplu sahte işletme kaydı açarak DoS saldırısı gerçekleştirebilir.
- **Yeniden Üretme:** Bir IP adresinden arka arkaya yüzlerce login isteği gönderildiğinde sistemin hiçbir istek engeli koymadan yanıt dönmesi.
- **Önerilen Düzeltme:** Güvenilir bir Throttler Guard eklemek. Login ve register uç noktalarına IP başına dakikada maksimum 10 istek sınırı getirmek; aşıldığında `429 Too Many Requests` yanıtı döndürmek.

---

### SEC-03: HTTP Güvenlik Başlıkları (Security Headers) Eksikliği
- **Konum:** [backend/src/main.ts](file:///c:/Users/Okul/OneDrive/Belgeler/İşEmriAl/backend/src/main.ts)
- **Seviye:** **Medium**
- **Kanıt:** API yanıtlarında `X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security` veya `Referrer-Policy` gibi güvenlik başlıkları bulunmamaktadır.
- **Olası Etki:** Tarayıcı tarafında MIME türü koklama (sniffing), iframe içine gömülerek clickjacking saldırılarına maruz kalma riski.
- **Önerilen Düzeltme:** `helmet` kütüphanesini veya standart güvenlik başlıkları middleware'ini `main.ts` içerisine entegre etmek.

---

### SEC-04: State-Changing İsteklerde Origin / CSRF Doğrulaması Eksikliği
- **Konum:** [backend/src/main.ts](file:///c:/Users/Okul/OneDrive/Belgeler/İşEmriAl/backend/src/main.ts)
- **Seviye:** **High**
- **Kanıt:** Cookie tabanlı oturum kullanılmaktadır. `SameSite=Lax` varsayılandır; fakat zararlı bir üçüncü taraf kaynaktan tetiklenebilecek cross-origin isteklerde Origin / Referer başlığı doğrulanmamaktadır.
- **Olası Etki:** OWASP yönergelerine göre, çerez tabanlı kimlik doğrulamada yalnızca `SameSite=Lax`'e güvenmek yeterli savunma-derinliği (defense-in-depth) sağlamaz.
- **Önerilen Düzeltme:** State-changing (POST, PATCH, PUT, DELETE) isteklerde gelen `Origin` veya `Referer` başlığının izin verilen origin listesinde yer aldığını denetleyen bir Origin/CSRF koruma katmanı eklemek. Eşleşmiyorsa `403 Forbidden` döndürmek.

---

### SEC-05: Üretim Modunda Demo Test Girişlerinin `/login` Ekranında Görünmesi
- **Konum:** [src/app/login/page.tsx:L120-L150](file:///c:/Users/Okul/OneDrive/Belgeler/İşEmriAl/src/app/login/page.tsx#L120-L150)
- **Seviye:** **Medium**
- **Kanıt:** "Geliştirme / Test Girişleri (Tek Tık)" kartı doğrudan bileşen içinde koşulsuz yer almaktadır.
- **Olası Etki:** Üretim ortamında gerçek kullanıcılara Murat Usta, Emre Can, Ahmet Tekin gibi demo hesapları ve test verileri görünür.
- **Önerilen Düzeltme:** `process.env.NODE_ENV !== "production"` ve `NEXT_PUBLIC_ENABLE_DEMO_LOGIN === "true"` kontrolleriyle üretim derlemelerinde bu bileşenin tamamen gizlenmesi.

---

### SEC-06: `next.config.ts` Proxy Hedefinde Sunucu Sırrı İfşası Riski (`NEXT_PUBLIC_`)
- **Konum:** [next.config.ts:L9](file:///c:/Users/Okul/OneDrive/Belgeler/İşEmriAl/next.config.ts#L9)
- **Seviye:** **Medium**
- **Kanıt:** `destination: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/:path*``
- **Olası Etki:** Next.js sunucu tarafı rewrite kuralı için `NEXT_PUBLIC_` değişkeni kullanılmıştır. Bu değişken istemci bundle'ına gömülebilir ve iç ağ Docker servis adreslerini (örn. `http://backend:4000`) açığa çıkarabilir.
- **Önerilen Düzeltme:** Sunucu tarafı özel ortam değişkeni olan `INTERNAL_API_URL || process.env.API_URL || "http://localhost:4000"` hiyerarşisine geçilmesi.

---

### SEC-07: `OrganizationsController.updateCurrent` İçin DTO Validasyonu Eksikliği
- **Konum:** [backend/src/organizations/organizations.controller.ts:L28](file:///c:/Users/Okul/OneDrive/Belgeler/İşEmriAl/backend/src/organizations/organizations.controller.ts#L28)
- **Seviye:** **Medium**
- **Kanıt:** `@Body() body: { name?: string; phone?: string; address?: string }` doğrudan inline tip kullanmaktadır.
- **Olası Etki:** NestJS ValidationPipe'ın whitelist ve dönüştürme kurallarını atlayabilir; aşırı uzun metinler veya geçersiz tipler doğrulanmadan veritabanına iletilebilir.
- **Önerilen Düzeltme:** `UpdateOrganizationDto` sınıfı tanımlanarak `@IsOptional()`, `@IsString()`, `@MaxLength()` doğrulamalarının uygulanması.

---

### SEC-08: Üretim Modunda Yerel Origin'lerin CORS Listesinde Açık Kalması
- **Konum:** [backend/src/main.ts:L19](file:///c:/Users/Okul/OneDrive/Belgeler/İşEmriAl/backend/src/main.ts#L19)
- **Seviye:** **Low**
- **Kanıt:** `origin: [frontendOrigin, "http://localhost:3000", "http://127.0.0.1:3000"]`
- **Olası Etki:** Üretim ortamında gerçek bir domain çalışırken dahi yerel makineden (`localhost:3000`) yapılan CORS istekleri kabul edilir.
- **Önerilen Düzeltme:** Üretimde yalnızca tanımlı `FRONTEND_ORIGIN` adresine izin verilmesi; `localhost` adreslerinin yalnızca `NODE_ENV !== "production"` durumunda listeye dahil edilmesi.

---

### SEC-09: Seed Script'in Üretimde Hata Vermek Yerine Sessizce Sonlanması
- **Konum:** [backend/prisma/seed.ts:L7-L10](file:///c:/Users/Okul/OneDrive/Belgeler/İşEmriAl/backend/prisma/seed.ts#L7-L10)
- **Seviye:** **Low**
- **Kanıt:** `if (process.env.NODE_ENV === "production") { console.warn(...); return; }`
- **Olası Etki:** CI/CD veya üretim ortamında seed script'i yanlışlıkla tetiklendiğinde sessizce çıkış kodu 0 ile biter ve otomasyon araçları işlemin başarılı olduğunu varsayar.
- **Önerilen Düzeltme:** Açıkça bir hata fırlatılması (`throw new Error(...)`) veya çıkış kodunun 1 olması.

---

### SEC-10: Transitive Bağımlılık Güvenlik Uyarıları (`postcss`, `deepmerge-ts`)
- **Konum:** Kök & Backend `pnpm-lock.yaml`
- **Seviye:** **Informational**
- **Kanıt:** `pnpm audit` çıktılarında Next.js 15.2.1 içindeki `postcss` ve Prisma içindeki `deepmerge-ts` için moderate/high uyarılar raporlanmıştır.
- **Olası Etki:** Doğrudan uygulama çalışma zamanı API'lerinde kullanılmayan derleme araçları bağımlılıklarıdır.
- **Önerilen Düzeltme:** Proje stabilitesini ve React 19 uyumunu bozmadan, üst paketlerin sonraki minör sürümlerinde takip edilmesi.

---

## 4. Düzeltme Önceliklendirme ve Eylem Planı

Aşağıdaki sırayla düzeltmeler uygulanacaktır:

1. **Aşama 1 (High/Critical Savunma):**
   - SEC-01: `WorkOrdersService` içinde eşzamanlı güvenli numara üretimi ve P2002 retry mekanizması.
   - SEC-02: Backend Throttler (Rate Limit) guard'ı ve auth endpoint limitleri.
   - SEC-04: State-changing isteklerde Origin / CSRF doğrulama katmanı.
2. **Aşama 2 (Medium Savunma & Standartlar):**
   - SEC-03: `helmet` ile HTTP güvenlik başlıkları (X-Content-Type-Options, HSTS vb.).
   - SEC-05: `/login` ekranında üretim modunda demo hesap butonlarının gizlenmesi.
   - SEC-06: `next.config.ts` rewrite kuralında `INTERNAL_API_URL` desteği.
   - SEC-07: `UpdateOrganizationDto` tanımlanması ve validasyon eklenmesi.
3. **Aşama 3 (Low / İyileştirmeler):**
   - SEC-08: CORS origin listesinin üretim moduna göre sıkılaştırılması.
   - SEC-09: `seed.ts` üretim guard'ının güçlendirilmesi.
4. **Aşama 4 (Test ve Kabul):**
   - 22 adet zorunlu test senaryosunun gerçek test betiği ve tarayıcı ile çalıştırılması.
   - `docs/SECURITY_CHECKLIST.md`, `docs/DEPLOYMENT_READINESS.md` ve `docs/PHASE_5_REVIEW.md` hazırlanması.
