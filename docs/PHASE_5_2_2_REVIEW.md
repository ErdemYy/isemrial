# İŞEMRİAL — FAZ 5.2.2: YEDEKTEN GERİ YÜKLEME SONRASI OTURUM GÜVENLİĞİ DENETİM VE KABUL RAPORU

**Tarih:** 12 Ekim 2026  
**Aşama:** Faz 5.2.2 — Yedekten Geri Yükleme Sonrası Oturum Güvenliği (Post-Restore Session Security)  
**Roller:** Kıdemli Uygulama Güvenliği Mühendisi, Backend Mimarı, DevOps Mühendisi, QA Sorumlusu  
**Sonuç:** **BAŞARILI — YEDEKTEN DÖNEN ESKİ OTURUM DİRİLME RİSKİ (SESSION RESUSCITATION) KANITLANDI, ÇOK KATMANLI OTURUM İPTAL PROSEDÜRÜ DEVREYE ALINDI VE %100 DOĞRULANDI**

---

## 1. Giriş ve Amaç

Faz 5.2.1 aşamasında Dashboard metriklerinin kiracı izolasyonu ve 8 Prisma modelinin yedekleme/geri yükleme döngüsü doğrulanmıştı.

Bu denetimin (Faz 5.2.2) odak noktası şudur:
> *Bir afet kurtarma (disaster recovery) veya geri yükleme (rollback/restore) sonrasında, yedek anında aktif olup daha sonra normal logout veya güvenlik gerekçesiyle iptal edilmiş olan oturumların yeniden geçerli hâle gelmesi (**Session Resuscitation**) riski.*

Bu aşamada:
1. Mevcut mimarideki session doğrulama, iptal ve zaman aşımı mekanizması kaynak kod üzerinden incelenmiştir.
2. İzole bir test veritabanında oturum dirilme riski kontrollü olarak reproduces edilmiş ve kanıtlanmıştır.
3. Kurtarılan veritabanındaki oturumları güvenli, atomik ve veri kaybı oluşturmaksızın geçersiz kılan otomatik kurtarma prosedürü geliştirilmiştir.
4. Geliştirme (`isemrial_dev`) ve staging (`isemrial_staging`) ortamlarının kazara oturum kaybına uğramasını engelleyen çok katmanlı koruma kalkanları eklenmiştir.

---

## 2. Mevcut Mimari ve Oturum Yaşam Döngüsü İncelemesi

### 2.1 Oturum Yaşam Döngüsü (`backend/src/auth/` & `backend/src/common/guards/auth.guard.ts`)

| Aşama | Kod / Metot | Davranış ve Güvenlik Mekanizması |
| :--- | :--- | :--- |
| **Oturum Oluşturma** | `AuthService.login`<br>`AuthService.register` | - 32-byte kriptografik rastgele token üretilir (`crypto.randomBytes(32)`).<br>- Token'ın SHA-256 hash'i alınarak veritabanına yazılır (`Session.tokenHash`).<br>- İstemciye `isemrial_session` adıyla `HttpOnly`, `SameSite: Lax`, üretimde `Secure` çerez verilir.<br>- Oturum geçerlilik süresi 7 gün olarak belirlenir (`expiresAt = now + 7 gün`). |
| **Oturum Doğrulama** | `AuthGuard.canActivate` | - Çerez veya `Authorization: Bearer` başlığı okunur.<br>- SHA-256 ile hash'lenip `prisma.session.findUnique({ where: { tokenHash } })` ile aranır.<br>- Kayıt yoksa: `401 Unauthorized ("Oturum geçersiz")`.<br>- Süresi geçmişse (`expiresAt < now`): DB'den silinir ve `401 Unauthorized ("Oturum süresi doldu")`.<br>- Kullanıcı pasifse (`!user.isActive`): `401 Unauthorized ("Kullanıcı hesabı aktif değil")`.<br>- Kullanıcının geçerli atölye üyeliği `request.user` olarak enjekte edilir. |
| **Oturum İptali (Logout)** | `AuthService.logout`<br>`AuthController.logout` | - İstemci token'ı alınır ve SHA-256 hash'i hesaplanır.<br>- Veritabanından silinir: `prisma.session.deleteMany({ where: { tokenHash } })`.<br>- İstemcide çerez temizlenir (`res.clearCookie`).<br>- Bu andan itibaren aynı token'la gelen tüm istekler `AuthGuard` tarafından `401 Unauthorized` ile engellenir. |

### 2.2 Güvenlik Zafiyeti: Oturum Dirilme Tehlikesi (Session Resuscitation Hazard)

PostgreSQL `pg_dump` yedeği alındığında, o an geçerli olan tüm oturumlar döküm dosyasındaki `sessions` tablosuna dahil edilir.

**Tehlike Senaryosu:**
1. **T0 (Yedekleme Anı):** Operatör veya otomatik cron yedeği alır. Kullanıcının oturumu yedek dosyasında mevcuttur.
2. **T1 (Güvenli Çıkış):** Kullanıcı oturumu kapatır (veya cihaz çalınmış / şifre değiştirilmiş olduğundan oturum iptal edilir). Veritabanındaki oturum satırı kalıcı olarak silinir. İstekler 401 alır.
3. **T2 (Afet Kurtarma / Restore):** Sunucu çökmesi veya veri bozulması nedeniyle T0 anındaki yedek sisteme geri yüklenir.
4. **T3 (Dirilme - Resuscitation):** T0 yedeğindeki `sessions` tablosu geri geldiği için, T1'de bilinçli olarak kapatılmış olan oturum veritabanında tekrar belirir!
5. **Sonuç:** Kullanıcının eski çerezi (veya saldırganın önceden ele geçirdiği oturum anahtarı), 7 günlük `expiresAt` süresi dolana kadar **yeniden yetkili ve geçerli** hâle gelir.

---

## 3. Kurtarma Senaryosunun İzole Ortamda Test Edilmesi

Testler, kaynak geliştirme (`isemrial_dev`) ve staging (`isemrial_staging`) veritabanlarına kesinlikle dokunulmadan, geçici izole `isemrial_session_eval` veritabanında [backend/test-session-restore-security.ts](file:///c:/Users/Okul/OneDrive/Belgeler/İşEmriAl/backend/test-session-restore-security.ts) paketiyle yürütülmüştür.

### Adım Adım Simülasyon:

1. **Test Kullanıcısı ve Müşteri Oluşturma:**
   - Kullanıcı: `Kemal Elektronik Test Atolyesi` (`kemal.restore...@test.com`)
   - Test Müşterisi: `Ahmet Yılmaz Müşteri`
   - Test İş Emri: `iPhone 13 Pro` (İş emri no: dinamik)
   - Çerez `activeTokenA` alındı. `AuthGuard` başarıyla doğruladı (**AUTH-01: PASS**).

2. **Normal Logout Kontrolü:**
   - `authService.logout(activeTokenA)` çalıştırıldı.
   - `AuthGuard` isteği `401 Unauthorized ("Oturum geçersiz. Lütfen tekrar giriş yapınız.")` ile engelledi (**AUTH-02: PASS**).

3. **Riskin Kanıtlanması (Session Resuscitation Reproduce):**
   - Kullanıcı tekrar giriş yaptı ve `Token B` üretildi.
   - Anlık veritabanı yedeği alındı (`/tmp/backup_resuscitation_test.sql`).
   - Kullanıcı güvenli çıkış yaptı (`logout`). `Token B` iptal edildi ve 401 vermeye başladı.
   - **Afet Simülasyonu:** `psql` ile önceki yedek geri yüklendi.
   - **Gözlem:** Müdahale edilmediğinde `AuthGuard`, iptal edilmiş `Token B` çerezini **tekrar kabul etti (`true`)**!
   - **Sonuç:** Oturum dirilme riski canlı test ortamında kanıtlandı (**RISK-01: PASS**).

---

## 4. Geliştirilen Oturum İptal Prosedürü ve Güvenlik Kalkanları

Sorunu kalıcı olarak çözmek için [backend/scripts/post-restore-session-invalidation.ts](file:///c:/Users/Okul/OneDrive/Belgeler/İşEmriAl/backend/scripts/post-restore-session-invalidation.ts) otomasyon aracı geliştirilmiş ve [backend/package.json](file:///c:/Users/Okul/OneDrive/Belgeler/İşEmriAl/backend/package.json) manifestine `post-restore:invalidate-sessions` script'i eklenmiştir.

### 4.1 Çok Katmanlı Güvenlik Korumaları (Safety Guards)

1. **Hedef Veritabanı ve URL Uyuşmazlık Kalkanı (`SAFE-02`):**
   Komutta belirtilen `--target-db=<isim>` parametresi ile `DATABASE_URL` içindeki veritabanı adı birebir eşleşmek zorundadır. Yanlış veritabanında çalıştırılmak istendiğinde işlem anında iptal edilir (`exit 1`).
2. **Açık Onay Zorunluluğu (`SAFE-01`):**
   `--confirm-invalidation` bayrağı verilmedikçe işlem başlamaz; operatörün kazara çalıştırması önlenir.
3. **Geliştirme Ortamı Kazara Silme Kalkanı (`SAFE-03`):**
   Eğer hedef veritabanı `isemrial_dev` ise ve `--allow-dev-invalidation` bayrağı verilmemişse işlem durdurulur; yazılımcıların yerel oturumları korunur.
4. **Sıfır Veri Kaybı Garantisi (Zero Data Loss - `DATA-01`):**
   İşlem öncesinde ve sonrasında iş modelleri (`User`, `Organization`, `Membership`, `Customer`, `WorkOrder`, `WorkOrderNote`, `TimelineEvent`) sayılır. 1 satır bile veri sapması olursa transaction geri alınır ve işlem durdurulur.
5. **Kalan Oturum Kesin Doğrulaması (`PROC-02`):**
   Veritabanında kalan oturum sayısı kesinlikle `0` olmalıdır. Aksi hâlde başarı raporlanmaz.

---

## 5. Kabul Testleri Sonuçları

[backend/test-session-restore-security.ts](file:///c:/Users/Okul/OneDrive/Belgeler/İşEmriAl/backend/test-session-restore-security.ts) test suiti tarafından gerçekleştirilen gerçek test sonuçları aşağıdadır:

| Test ID | Test Senaryosu | Beklenen Davranış | Gerçekleşen Sonuç | Karar |
| :---: | :--- | :--- | :--- | :---: |
| **AUTH-01** | Kullanıcı Girişi ve Oturum Doğrulama | Aktif çerezin AuthGuard tarafından kabul edilmesi | `Guard sonucu: true` | **PASS** |
| **AUTH-02** | Normal Logout Sonrası İptal | Logout sonrası eski çereze 401 dönülmesi | `Oturum geçersiz. Lütfen tekrar giriş yapınız.` | **PASS** |
| **RISK-01** | Yedekten Geri Yükleme Oturum Dirilme Riski | Müdahalesiz restore sonrasında eski çerezin dirildiğinin kanıtlanması | `Guard sonucu: true (Dirilme Kanıtlandı)` | **PASS** |
| **PROC-01** | Kurtarma Prosedürü Başarılı Yürütme | Prosedürün başarıyla tamamlanması ve oturumları silmesi | `success: true, İptal Edilen: 1` | **PASS** |
| **PROC-02** | Kalan Oturum Sayısı Doğrulaması | Kurtarılan veritabanında kalan oturum sayısının 0 olması | `Kalan oturum sayısı: 0` | **PASS** |
| **SEC-01** | Prosedür Sonrası Eski Çerezin Engellenmesi | Dirilmiş çerezin prosedür sonrası 401 ile reddedilmesi | `Oturum geçersiz. Lütfen tekrar giriş yapınız.` | **PASS** |
| **AUTH-03** | Kurtarma Sonrası Meşru Yeniden Giriş | Kullanıcının şifresiyle yeni oturum açabilmesi | `Guard sonucu: true` | **PASS** |
| **DATA-01** | İş Modelleri Korunumu (Sıfır Veri Kaybı) | Müşteri, iş emri ve not kayıtlarının eksiksiz korunması | `Müşteri: Ahmet Yılmaz, İş Emri: WO-TEST-...` | **PASS** |
| **SAFE-01** | Onay Eksikliğinde İşlemi Durdurma | `--confirm-invalidation` yoksa işlemin başlamaması | `GÜVENLİK HATASI: açık onay bayrağı gereklidir` | **PASS** |
| **SAFE-02** | Hedef DB Uyuşmazlığında Durdurma | Target DB ile DATABASE_URL uyuşmadığında abort | `GÜVENLİK HATASI: ... eşleşmiyor!` | **PASS** |
| **SAFE-03** | Geliştirme DB Kazara Silme Koruması | `isemrial_dev` hedefinde allowDev yoksa abort | `GÜVENLİK KORUMASI: allow-dev bayrağı gerekli` | **PASS** |
| **ISO-01** | Geliştirme DB Dokunulmazlığı | `isemrial_dev` veritabanı kayıtlarının değişmemesi | `Users: 5/5, Orders: 24/24 (SABİT)` | **PASS** |
| **ISO-02** | Staging DB Dokunulmazlığı | `isemrial_staging` veritabanı kayıtlarının değişmemesi | `Users: 10/10, Orders: 27/27 (SABİT)` | **PASS** |

**Genel Başarı Oranı:** **13 / 13 Senaryo (%100 PASS)**

---

## 6. Dokümantasyon ve İşletim Kılavuzu Güncellemeleri

1. **[docs/STAGING_RUNBOOK.md](file:///c:/Users/Okul/OneDrive/Belgeler/İşEmriAl/docs/STAGING_RUNBOOK.md):**
   Bölüm 5.4'e *"Geri Yükleme Sonrası Oturum Güvenliği (Post-Restore Session Invalidation)"* adımı, Windows ve Linux çalıştırma komutları ve `exit 1` durumunda trafiği açmama güvenlik uyarısıyla eklendi.
2. **[docs/DEPLOYMENT_READINESS.md](file:///c:/Users/Okul/OneDrive/Belgeler/İşEmriAl/docs/DEPLOYMENT_READINESS.md):**
   Bölüm 5.5'e *"Kurtarma Sonrası Oturum Geçersiz Kılma Prosedürü (Faz 5.2.2)"* operasyonel kontrol listesi ve güvenlik protokolü kuralları işlendi.
3. **[backend/package.json](file:///c:/Users/Okul/OneDrive/Belgeler/İşEmriAl/backend/package.json):**
   `"post-restore:invalidate-sessions"` npm script'i eklendi.

---

## 7. Değiştirilen ve Oluşturulan Dosyalar

1. `backend/scripts/post-restore-session-invalidation.ts` *(Yeni dosya — Çok katmanlı oturum iptal CLI ve modül aracı)*
2. `backend/test-session-restore-security.ts` *(Yeni dosya — 13 senaryolu uçtan uca kabul ve güvenlik test paketi)*
3. `backend/package.json` *(Güncellendi — post-restore npm script'i eklendi)*
4. `docs/STAGING_RUNBOOK.md` *(Güncellendi — Bölüm 5.4 kurtarma adımı eklendi)*
5. `docs/DEPLOYMENT_READINESS.md` *(Güncellendi — Bölüm 5.5 canlıya çıkış kontrolü eklendi)*
6. `docs/PHASE_5_2_2_REVIEW.md` *(Yeni dosya — Bu kabul raporu)*

---

## 8. Sonuç ve Yayın Kararı

- **Session Resuscitation Riski:** Canlı ortamda başarıyla reproduces edilmiş, tehlikesi kanıtlanmış ve otomatik post-restore prosedürüyle tamamen bertaraf edilmiştir.
- **İşletme ve Veri Bütünlüğü:** Oturum iptali sırasında işletmeler, müşteriler, iş emirleri, notlar ve zaman çizelgesi verilerinde **%0 veri kaybı** gerçekleştiği matematiksel olarak doğrulanmıştır.
- **Kaynak Veritabanı Güvenliği:** `isemrial_dev` ve `isemrial_staging` veritabanları test boyunca değişmeden korunmuştur.
- **Karar:** **FAZ 5.2.2 GERİ YÜKLEME SONRASI OTURUM GÜVENLİĞİ %100 ONAYLANDI.**

*Kural gereği burada durulmuştur. Canlı sunucuya otomatik deployment yapılmamış, production veritabanına dokunulmamış ve Faz dışı yeni ürün özelliği geliştirilmemiştir.*
