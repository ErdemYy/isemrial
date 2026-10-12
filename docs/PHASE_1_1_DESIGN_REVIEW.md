# İşEmriAl — Faz 1.1: Bubilet Referanslı Görsel Yön Revizyon Raporu
**Tarih:** 10 Ekim 2026  
**Aşama:** Faz 1.1 — Görsel Yön & Renk Paleti Revizyonu  
**Rol:** Ürün Mimarı, Kıdemli Full-Stack Geliştirici, Ürün Tasarımcısı  
**Referans Dokümanlar:** `AGENTS.md`, `.agents/skills/premium-saas-ui`, `docs/DESIGN_SYSTEM.md`, `docs/SCREEN_INVENTORY.md`  

---

## 1. Eski Tasarımdan Değiştirilen Görsel Kararlar

| Alan / Eleman | Eski Tasarım (Faz 1) | Yeni Tasarım (Faz 1.1 Revizyonu) | Değişim Gerekçesi |
| :--- | :--- | :--- | :--- |
| **Marka Vurgusu** | `#315EDB` (Klasik Kobalt Mavi) | `#20C875` (Canlı, taze zümrüt yeşili) | Soğuk kurumsal IT paneli hissini kırıp modern, enerjik ve akılda kalıcı bir marka kimliği kurmak. |
| **Ana Zemin** | `#F6F7F9` (Açık soğuk gri) | `#F7F9F7` (Sıcak/doğal hafif kırık açık yeşil-gri) | Ekrana bakan ustanın gözünü yormayan, organik ve ferah bir tuval. |
| **Ana Metin** | `#17212F` (Koyu lacivert-slate) | `#18231F` (Koyu zümrüt-slate) | Yeni renk sistemiyle mükemmel kontrast ve tipografik uyum (WCAG AAA kontrast). |
| **İkincil / Açık Yüzey** | `#EEF3FE` (Mavi tint) | `#E9F9F0` (Yumuşak taze yeşil yüzey) | Aktif menüler, rozetler ve odak alanlarında tutarlı marka tonu. |
| **Kenarlıklar** | `#E1E6ED` (Mavi-gri border) | `#E5EBE7` (Yumuşak zümrüt-gri border) | Yüzeyleri keskinleştirmeden doğal şekilde ayıran sakin sınırlar. |
| **Dashboard Karşılama** | Standart sayfa başlığı | "İyi çalışmalar, Murat Usta 👋" + Atölye Masası Açık rozeti | Teknisyene samimi, doğal ve güven veren işletme karşılaması. |
| **Arama Yerleşimi** | Yalnızca üst çubukta küçük input | Dashboard'un tam merkezinde operasyonel arama bandı | Bubilet'in hızlı keşif odaklı arama ergonomisini iş emirlerine uyarlamak. |
| **Durum Filtreleri** | Klasik tablo sekmeleri | Yatay kaydırılabilir, sayı rozetli keşif hapları (Pills) | Mobilde ve masaüstünde tek dokunuşla taranabilir durum akışı. |

---

## 2. Bubilet'ten Uyarlanan Genel UX İlkeleri

Bubilet etkinlik biletleme uygulaması incelenerek aşağıdaki ilkeler İşEmriAl teknik servis iş akışına adapte edilmiştir:

1. **Doğrudan Ana Göreve Yönlendirme:**
   - Sayfa açıldığında kullanıcı ne yapması gerektiğini anında görür: Üstte ferah arama çubuğu ve sağda belirgin yeşil `+ Yeni İş Emri Aç` aksiyonu.
2. **Kategorik ve Durumsal Taranabilirlik (Operasyonel Keşif):**
   - Atölyedeki işler devasa yorucu kartlar yerine 4 odak hapla (`Tamirde/Masada`, `Onay Bekleyen`, `Parça Bekleyen`, `Teslime Hazır`) tek tıkla filtrelenebilir hâle getirildi.
3. **Gerçek Mobil Uygulama Hissi (App-Like Ergonomi):**
   - 390px mobil görünümde masaüstü tablosu sıkıştırılmadı; dokunmatik dostu, ferah, başparmak erişimine uygun kart listesine dönüştürüldü.
   - En sık kullanılan rotalar için altta sabit `Genel Bakış`, `İş Emirleri` ve `Yeni İş` sekmeleri konumlandırıldı.
4. **Sıcak, Dinamik Fakat Güven Veren Denge:**
   - Yeşilin aşırı kullanımı engellendi; yalnızca markaya, birincil eylemlere ve kritik durumlara tahsis edildi.

---

## 3. İşEmriAl'ın Özgün Marka Kimliğinin Korunması

- Bubilet'in logosu, tipografisi veya etkinlik biletleme bileşenleri kopyalanmamıştır.
- Tasarım tamamen Türkiye'deki teknik servislerin jargonuna (`İş Emri No`, `Arıza Şikâyeti`, `Fiziksel Kasa Durumu`, `Parça Bekliyor`, `WhatsApp Taslağı`, `Murat Usta`) göre inşa edilmiştir.
- Renk token'ları rastgele uygulanmamış; `docs/DESIGN_SYSTEM.md` içinde semantic CSS custom properties olarak sabitlenmiştir.

---

## 4. Ekranların Görsel ve Tarayıcı Denetimi

Tüm ekranlar yerel üretim derlemesinde (`pnpm build` -> `next start -p 3000`) çalıştırılmış, Playwright MCP ile taranmış ve doğrulanmıştır:

| Ekran | Viewport | Durum | Kanıt Ekran Görüntüsü |
| :--- | :---: | :---: | :--- |
| **Genel Bakış (`/dashboard`)** | 1440px Masaüstü | Doğrulandı | [`docs/screenshots/dashboard-1440.png`](file:///c:/Users/Okul/OneDrive/Belgeler/İşEmriAl/docs/screenshots/dashboard-1440.png) |
| **Genel Bakış (`/dashboard`)** | 1024px Tablet | Doğrulandı | [`docs/screenshots/dashboard-1024.png`](file:///c:/Users/Okul/OneDrive/Belgeler/İşEmriAl/docs/screenshots/dashboard-1024.png) |
| **Genel Bakış (`/dashboard`)** | 390px Mobil | Doğrulandı | [`docs/screenshots/dashboard-390.png`](file:///c:/Users/Okul/OneDrive/Belgeler/İşEmriAl/docs/screenshots/dashboard-390.png) |
| **İş Emirleri (`/work-orders`)** | 1440px Masaüstü | Doğrulandı | [`docs/screenshots/work-orders-1440.png`](file:///c:/Users/Okul/OneDrive/Belgeler/İşEmriAl/docs/screenshots/work-orders-1440.png) |
| **İş Emirleri (`/work-orders`)** | 390px Mobil | Doğrulandı | [`docs/screenshots/work-orders-390.png`](file:///c:/Users/Okul/OneDrive/Belgeler/İşEmriAl/docs/screenshots/work-orders-390.png) |
| **Yeni İş Emri (`/work-orders/new`)** | 1440px Masaüstü | Doğrulandı | [`docs/screenshots/work-orders-new-1440.png`](file:///c:/Users/Okul/OneDrive/Belgeler/İşEmriAl/docs/screenshots/work-orders-new-1440.png) |
| **Yeni İş Emri (`/work-orders/new`)** | 390px Mobil | Doğrulandı | [`docs/screenshots/work-orders-new-390.png`](file:///c:/Users/Okul/OneDrive/Belgeler/İşEmriAl/docs/screenshots/work-orders-new-390.png) |

---

## 5. Gerçekten Çalıştırılan Testler

1. **TypeScript ve Derleme Testi:**
   - Komut: `pnpm.cmd build`
   - Sonuç: `✓ Compiled successfully in 3.4s`, `✓ Generating static pages (8/8)`, Exit Code: `0` (Hatasız).
2. **Konsol Hata Denetimi:**
   - Araç: Playwright `browser_console_messages`
   - Sonuç: `Total messages: 0 (Errors: 0, Warnings: 0)`.
3. **Yatay Taşma (Horizontal Overflow) Denetimi:**
   - Viewport: 390x844 (Mobil)
   - Sonuç: Body yatay kaydırma çubuğu oluşmamakta (`overflow-x: hidden/clip`), tüm kartlar ekrana tam oturmaktadır.

---

## 6. Hâlâ Çözülmemiş / Bilinen Sınırlar

1. **Mock Veri Sınırı:** Henüz PostgreSQL ve Prisma katmanı kurulmadığı için yeni açılan iş emirleri hafızadaki mock state üzerinde tutulmakta, sayfa yenilendiğinde ilk 6 iş emrine dönmektedir (Faz 4'te veritabanına bağlanacaktır).
2. **Fotoğraf / Ek Dosya Yükleme:** Cihaz kabulünde fiziksel hasar fotoğraflarının çekilip yüklenmesi için UI alanı henüz eklenmemiştir; Faz 3 Core UI aşamasında eklenecektir.
3. **Gerçek WhatsApp API:** Mesajlaşma entegrasyonu kural gereği yalnızca güvenli `wa.me` taslağıdır; harici webhook veya otomatik SMS servisi bağlı değildir.

---

## 7. Sonuç

Faz 1.1 görsel revizyonu başarıyla tamamlanmıştır. Yeni canlı yeşil (`#20C875`) marka dili, sıcak kırık zemin (`#F7F9F7`) ve Bubilet esintili operasyonel keşif ergonomisi üç ana ekranda da tescillenmiştir.

Kural gereği Faz 2'ye geçilmemiştir. İncelemeniz için beklenmektedir.
