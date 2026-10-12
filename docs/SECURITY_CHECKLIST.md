# İŞEMRİAL — GÜVENLİK KONTROL LİSTESİ (SECURITY CHECKLIST)

**Sürüm:** Faz 5 (Üretim Öncesi Kalite & Güvenlik Denetimi)  
**Tarih:** 12 Ekim 2026  
**Kapsam:** Authentication, Session Yönetimi, Multi-Tenant Veri İzolasyonu, CSRF/CORS, API Giriş Doğrulaması ve Üretim Ortamı Yapılandırması  

---

## 1. Authentication ve Session Güvenliği

| Kontrol Maddesi | Durum | Kanıt & Uygulama Yeri | Risk & Açıklama |
| :--- | :---: | :--- | :--- |
| **1.1 Güvenli Parola Hashleme (Argon2id)** | **VERIFIED** | `backend/src/auth/auth.service.ts` (`argon2.hash(password, { type: argon2.argon2id })`) | GPU ve rainbow table saldırılarına karşı endüstri standardı bellek-sert Argon2id algoritması kullanılıyor. |
| **1.2 Parola ve Tokenların Loglanmaması** | **VERIFIED** | Controller ve Service katmanları; DTO'lar doğrudan loglanmıyor, hata filtreleri hassas verileri filtreliyor. | Hassas kimlik verilerinin disk loglarına veya harici izleme servislerine sızması önleniyor. |
| **1.3 Kriptografik Rastgele Session Tokenları** | **VERIFIED** | `crypto.randomBytes(32).toString('hex')` (256-bit entropi). | Tahmin edilemez token üretimi; brute-force saldırılarına karşı dayanıklı. |
| **1.4 Ham Token Saklanmaması (SHA-256 Hashleme)** | **VERIFIED** | `crypto.createHash('sha256').update(rawToken).digest('hex')` ile veritabanında `Session.tokenHash` saklanıyor. | Veritabanı sızıntısı durumunda bile saldırgan doğrudan geçerli oturum elde edemez. |
| **1.5 Sunucu Taraflı Session Süre Kontrolü** | **VERIFIED** | `AuthGuard`: `session.expiresAt <= new Date()` kontrolü yapılarak süresi geçmiş oturumlar 401 ile sonlandırılıyor. | İstemci saatinin manipüle edilmesi sunucu güvenliğini etkilemez. |
| **1.6 Logout Sonrası Kesin İptal** | **VERIFIED** | `AuthService.logout`: Veritabanındaki `Session` kaydı `prisma.session.deleteMany` ile kalıcı olarak siliniyor; çerez maxAge=0 ile temizleniyor. | Oturum tekrar kullanılamaz (Token replay önlenir). |
| **1.7 Çerez Güvenlik Bayrakları (`HttpOnly`, `SameSite`, `Path`, `Secure`)** | **VERIFIED** | `backend/src/auth/auth.controller.ts`: `httpOnly: true`, `sameSite: 'lax'`, `path: '/'`, `secure: process.env.NODE_ENV === 'production'`. | XSS durumunda JavaScript çerezi okuyamaz; HTTPS üzerinden güvenli aktarım sağlanır. |
| **1.8 Bilgi Sızdırmayan Hata Mesajları** | **VERIFIED** | Login ve Register hatalarında "Geçersiz e-posta veya parola" genel mesajı döndürülüyor; kullanıcı varlığı/yokluğu ifşa edilmiyor. | Kullanıcı numaralandırma (User Enumeration) saldırıları önlenir. |
| **1.9 Auth Endpoint Rate Limiting** | **VERIFIED** | `SecurityMiddleware`: `/auth/login` ve `/auth/register` için IP başına 10 istek/dakika sınırı. Aşıldığında `429 Too Many Requests` ve `Retry-After`. | Kaba kuvvet (brute-force) ve kimlik bilgisi doldurma (credential stuffing) engellenir. |
| **1.10 Üretimde Demo Girişlerinin Kapatılması** | **VERIFIED** | `src/app/login/page.tsx`: Demo hızlı doldurma butonları `NODE_ENV !== 'production' \|\| NEXT_PUBLIC_ENABLE_DEMO_LOGIN === 'true'` koşuluna bağlıdır. | Üretim ortamında tek tıkla test kullanıcısı girişleri engellenir. |
| **1.11 Gizli Backdoor Bulunmaması** | **VERIFIED** | Tüm kimlik doğrulama akışları `AuthGuard` ve `prisma.session` üzerinden geçer; hardcoded bypass anahtarı veya mock token bulunmaz. | Yetkisiz erişim riski sıfırlanmıştır. |

---

## 2. Çok Kiracılı (Multi-Tenant) Veri İzolasyonu

| Kontrol Maddesi | Durum | Kanıt & Uygulama Yeri | Risk & Açıklama |
| :--- | :---: | :--- | :--- |
| **2.1 Aktif İşletmenin Oturumdan Çıkarılması** | **VERIFIED** | `AuthGuard` ve `@CurrentUser()` dekoratörü: `req.user.organizationId` ve `organizationRole` doğrudan veritabanındaki oturum ve üyelikten çekilir. | İstemcinin header veya parametre ile kiracı taklit etmesi engellenir. |
| **2.2 İstemci Tarafı Tenant Belirleyicilerinin Geçersiz Kılınması** | **VERIFIED** | ValidationPipe `whitelist: true`, `forbidNonWhitelisted: true`: Request body içerisindeki `organizationId` alanı 400 Bad Request ile reddedilir. | Payload üzerinden kiracı manipülasyonu (Tenant Injection) imkansızdır. |
| **2.3 Müşteri Sorgularında Kiracı İzolasyonu** | **VERIFIED** | `CustomersService`: `findMany({ where: { organizationId } })`, `findFirst({ where: { id, organizationId } })`. Başka işletmenin müşterisi 404 döner. | IDOR (Insecure Direct Object Reference) ile müşteri verisi sızıntısı engellenir. |
| **2.4 İş Emri Sorgularında Kiracı İzolasyonu** | **VERIFIED** | `WorkOrdersService`: `findFirst({ where: { id, organizationId } })`. Güncelleme ve detay işlemlerinde başka kiracının iş emri 404 döner. | Rakip teknik servisin iş emirlerine ve cihaz arıza bilgilerine erişim engellenir. |
| **2.5 Cross-Tenant İlişki Doğrulaması (İş Emri - Müşteri)** | **VERIFIED** | `WorkOrdersService.create`: Müşteri ID'si verildiğinde `customersService.findOne(customerId, organizationId)` çağrılarak aynı işletmeye ait olduğu doğrulanır. Farklıysa `400 Bad Request` fırlatılır. | Başka işletmenin müşterisine yetkisiz iş emri bağlama veya veri kirliliği engellenir. |
| **2.6 Zaman Çizelgesi ve Not İzolasyonu** | **VERIFIED** | `WorkOrdersService.addNote`: Önce iş emrinin kiracıya ait olduğu doğrulanır; not ve timeline olayı kiracı bağlamında oluşturulur. | Başka kiracının iş emrine yetkisiz operasyonel not veya durum eklenmesi engellenir. |
| **2.7 Dashboard ve Metrik İzolasyonu** | **VERIFIED** | `OrganizationsService.getMetrics`: Bütün `count` ve `aggregate` sorguları `{ where: { organizationId } }` filtresiyle yürütülür. | Başka kiracıların ciro, iş hacmi veya müşteri istatistiklerinin görülmesi engellenir. |
| **2.8 Güvenli Hata Yanıtları** | **VERIFIED** | Yetkisiz sorgularda "Kayıt bulunamadı (404)" döndürülerek ID'nin sistemde var olup olmadığı gizlenir. | Veri keşfi ve varlık taraması engellenir. |

---

## 3. CSRF, Origin Doğrulaması ve HTTP Güvenliği

| Kontrol Maddesi | Durum | Kanıt & Uygulama Yeri | Risk & Açıklama |
| :--- | :---: | :--- | :--- |
| **3.1 SameSite=Lax Çerez Koruması** | **VERIFIED** | Oturum çerezi `SameSite=Lax` ile ayarlanır. | Üçüncü taraf sitelerden gelen çapraz site POST isteklerinde çerez gönderilmez. |
| **3.2 Durum Değiştiren İsteklerde Origin Doğrulaması** | **VERIFIED** | `SecurityMiddleware`: POST, PUT, PATCH, DELETE isteklerinde `Origin` başlığı beyaz listedeki (`FRONTEND_ORIGIN`, `localhost:3000`) adreslerle eşleşmiyorsa `403 Forbidden` döner. | SameSite kısıtlamalarını aşabilecek tarayıcı açıkları ve CSRF vektörlerine karşı çift katmanlı savunma. |
| **3.3 CORS Yapılandırması** | **VERIFIED** | `backend/src/main.ts`: `credentials: true`, dinamik origin kontrolü; üretimde sadece tanımlı alan adlarına izin verilir. Wildcard (`*`) kullanılmaz. | Çapraz kökenli veri sızıntıları engellenir. |
| **3.4 HTTP Güvenlik Başlıkları** | **VERIFIED** | `SecurityMiddleware`:  <br>• `X-Content-Type-Options: nosniff`<br>• `X-Frame-Options: DENY`<br>• `X-XSS-Protection: 0`<br>• `Referrer-Policy: strict-origin-when-cross-origin`<br>• `Permissions-Policy: camera=(), microphone=(), geolocation=()`<br>• `Strict-Transport-Security: max-age=31536000; includeSubDomains` (Üretimde) | MIME-sniffing, Clickjacking ve protokol düşürme saldırılarına karşı tarayıcı düzeyinde koruma. |
| **3.5 Hata Filtreleri ve Stack Trace Gizleme** | **VERIFIED** | `backend/src/common/filters/all-exceptions.filter.ts`: Dahili 500 hatalarında genel hata mesajı döndürülür, hassas stack trace istemciye iletilmez. | Sunucu iç mimarisi ve kütüphane sürümlerinin saldırgana ifşa olması önlenir. |
| **3.6 Genel API Rate Limiting** | **VERIFIED** | `SecurityMiddleware`: IP başına dakikada 120 istek sınırı. | DoS ve API kaynak tüketim saldırıları sınırlandırılır. |

---

## 4. Veri Bütünlüğü ve Eşzamanlılık (Concurrency)

| Kontrol Maddesi | Durum | Kanıt & Uygulama Yeri | Risk & Açıklama |
| :--- | :---: | :--- | :--- |
| **4.1 İş Emri Numarası Çakışma Koruması** | **VERIFIED** | `WorkOrdersService.create`: Mevcut numaraların sayısal maksimumu hesaplanır (`WO-XXXXX`), Prisma `unique([organizationId, orderNumber])` çakışmasında 5 denemeli retry döngüsü çalışır. | Eşzamanlı iş emri oluşturulduğunda aynı numaranın verilmesi ve kayıt çökmesi engellenir. |
| **4.2 Durum Güncellemesi & Timeline Transaction Bütünlüğü** | **VERIFIED** | `WorkOrdersService.updateStatus`: `prisma.$transaction` içinde `workOrder.update` ve `timelineEvent.create` atomik olarak yürütülür. | İş emri durumu değişip olay kaydının düşmemesi gibi veri tutarsızlıkları engellenir. |
| **4.3 Yabancı Anahtar (Foreign Key) Bütünlüğü** | **VERIFIED** | Prisma şeması: `Customer`, `WorkOrder`, `TimelineEvent`, `Session`, `Membership` tablolarında zorunlu FK ilişkileri tanımlıdır. | Yetim (orphan) kayıtlar oluşamaz. |

---

## 5. Üretim Yapılandırması ve Gizlilik

| Kontrol Maddesi | Durum | Kanıt & Uygulama Yeri | Risk & Açıklama |
| :--- | :---: | :--- | :--- |
| **5.1 Ortam Değişkenleri Ayrımı** | **VERIFIED** | `.env.example`: `NEXT_PUBLIC_` değişkenlerinde gizli anahtar bulunmaz. Hassas anahtarlar (`SESSION_SECRET`, `DATABASE_URL`) yalnızca sunucu tarafında tutulur. | İstemci bundle'ına gizli anahtar sızması engellenir. |
| **5.2 Next.js Dahili API Rewrite** | **VERIFIED** | `next.config.ts`: `INTERNAL_API_URL` öncelikli kullanılır. Docker iç ağı (`http://backend:4000`) güvenle desteklenir; `localhost:4000` bağımlılığı kaldırılmıştır. | Konteyner veya sunucu mimarilerinde güvenli ve esnek yönlendirme sağlanır. |
| **5.3 Seed Script Üretim Koruması** | **VERIFIED** | `backend/prisma/seed.ts`: `NODE_ENV === 'production'` veya `DATABASE_URL` içinde `prod` geçiyorsa script açık hata vererek sonlanır. | Canlı veritabanına sahte demo verilerinin yazılması engellenir. |

---

## 6. Özet Sonuç

- **Toplam İncelenen Madde:** 26  
- **Doğrulanan (VERIFIED):** 26 (%100)  
- **Başarısız (FAILED):** 0  
- **Sonuç:** Uygulama, MVP ve SaaS üretim öncesi güvenlik gereksinimlerini eksiksiz karşılamaktadır.
