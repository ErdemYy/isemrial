# İşEmriAl — Ekran ve Arayüz Envanteri (Screen Inventory)
**Tarih:** 10 Ekim 2026  
**Rol:** Ürün Mimarı, Kıdemli Full-Stack Geliştirici, Ürün Tasarımcısı  
**Tasarım Dili:** Light-First, Warm-Neutral (#F6F7F9), Koyu Slate Metin (#17212F), Kontrollü Kobalt Mavi (#315EDB)  

Bu doküman, İşEmriAl uygulamasının MVP aşamasında yer alan tüm ekranlarının amacını, birincil eylemlerini, düzen mimarisini, mobil adaptasyonunu ve tüm durumlarını (loading, empty, error, success, disabled) eksiksiz olarak tanımlar.

---

## Genel Gezinme ve Uygulama Kabuğu (App Shell)

Tüm dahili ekranlar (`/dashboard`, `/work-orders`, `/customers`, `/settings`) tutarlı bir uygulama kabuğu içinde çalışır:
* **Masaüstü (1440px):** 240px genişliğinde açık zeminli sol yan menü (Sidebar), üst bağlam çubuğu (Atölye adı, evrensel arama `Ctrl+K`, aktif teknisyen profili).
* **Tablet (1024px):** Daraltılabilir sol menü (yalnızca ikonlar veya çekmece).
* **Mobil (390px):** Üst çubukta kompakt logo, hızlı `+` butonu ve hamburger çekmece menü (Sheet drawer). Alt navigasyon çubuğuyla en sık kullanılan 3 rota (`Genel Bakış`, `İş Emirleri`, `Müşteriler`) tek başparmak erişimine sunulur.

---

## 1. Giriş ve Atölye Doğrulama (`/login`)

* **Amaç / JTBD:** Teknisyenin veya atölye sahibinin kimliğini güvenle doğrulayıp kendi atölye çalışma alanına giriş yapması.
* **Birincil Aksiyon (Primary CTA):** `Giriş Yap` (Mavi buton, tam genişlik, enter tuşu tetiklemeli).
* **İkincil Aksiyonlar:** `Şifremi Unuttum`, `Demo Hesabı ile Dene` (yalnızca deneme ortamında).
* **Masaüstü Düzeni (1440px):** Ekran ortasında 420px genişliğinde temiz beyaz kart (`--surface`), hafif sınır çizgisi (`--border`), üstte minimal İşEmriAl logosu ve sakin atölye karşılama metni.
* **Mobil Düzeni (390px):** Ekranın tamamına yayılan form alanı; klavye açıldığında input alanlarının görünür kalması için yeterli dikey boşluk.
* **Durum Matrisi (State Matrix):**
  - **Yükleniyor:** Buton içinde dönen spinner ve `"Giriş yapılıyor..."` metni, inputlar `disabled`.
  - **Hata Durumu:** Yanlış şifre veya e-postada form üstünde kırmızı çerçeveli sakin uyarı kutusu: `"E-posta veya şifre hatalı. Lütfen kontrol ediniz."`
  - **Başarı Durumu:** Doğrulama başarılı olduğunda anında `/dashboard` rotasına yönlendirme.
  - **Boş Durum:** Alanlar boşken form gönderilirse satır altı inline doğrulama uyarısı (`"E-posta adresi gereklidir"`).
* **Erişilebilirlik:** `autoComplete="email"`, `autoComplete="current-password"`, belirgin focus halkası.

---

## 2. Genel Bakış / Günlük Operasyon Masası (`/dashboard`)

* **Amaç / JTBD:** Atölye sahibinin ve teknisyenin günün iş yükünü 5 saniye içinde anlaması: Hangi cihazlar onay bekliyor, hangi işler gecikti, bugün nelerin teslim edilmesi gerekiyor?
* **Birincil Aksiyon (Primary CTA):** `+ Yeni İş Emri Aç` (Sağ üstte belirgin kobalt mavi buton).
* **İkincil Aksiyonlar:** Durum filtreleme butonları, geciken işe doğrudan tıklayarak detayına gitme.
* **Masaüstü Düzeni (1440px):**
  - Üst Başlık: Atölye adı, günün tarihi (`10 Ekim 2026, Cuma`), hızlı eylem butonu.
  - 3 Kompakt Metrik Şeridi (Büyük AI kartları değil!):
    1. *İşlemdeki Cihazlar* (Örn: 14 aktif tamir)
    2. *Onay / Teklif Bekleyenler* (Örn: 5 müşteri yanıtı bekleniyor)
    3. *Bugün Teslim Edilecekler* (Örn: 3 cihaz hazır)
  - Ana Gövde (2 sütunlu asimetrik grid):
    - Sol Geniş Alan (8 birim): *"Son Güncellenen İş Emirleri"* tablosu (Numara, Müşteri, Cihaz, Durum, Son İşlem).
    - Sağ Dar Alan (4 birim): *"Dikkat Gerektirenler"* paneli (Süresi geçen işler, parça bekleyen kritik cihazlar).
* **Mobil Düzeni (390px):**
  - Metrikler yatay kaydırılabilir 3 mini göstergeye dönüşür.
  - Tablo dikey kompakt kart listesine evrilir (Her kartta Cihaz adı, İş emri no, Renkli Durum Rozeti ve Teknisyen).
* **Durum Matrisi (State Matrix):**
  - **Yükleniyor:** Metrikler ve tablo satırları için gerçek ölçülerinde gri pulsasyonlu skeleton blokları.
  - **Boş Durum (İlk Açılış):** Atölyede henüz hiç iş emri yoksa: Görsel bir tamir illüstrasyonu yerine sakin bir mesaj: `"Henüz kayıtlı bir iş emriniz bulunmuyor. İlk tamir kaydınızı hemen açarak işlerinizi takip etmeye başlayın."` Altında birincil `İlk İş Emrini Aç` butonu.
  - **Hata Durumu:** Veri çekilemezse panellerde: `"Güncel veriler yüklenirken bir sorun oluştu. [Yeniden Dene]"` butonu.
  - **Başarı Durumu:** Yeni kayıt oluşturulup dashboard'a dönüldüğünde üstte geçici toast bildirimi.

---

## 3. İş Emirleri Listesi ve Filtreleme (`/work-orders`)

* **Amaç / JTBD:** Atölyedeki yüzlerce cihaz arasından aranan iş emrini saniyeler içinde bulmak, duruma göre filtrelemek ve toplu iş yükünü yönetmek.
* **Birincil Aksiyon (Primary CTA):** `+ Yeni İş Emri`
* **İkincil Aksiyonlar:** Arama çubuğu (`Müşteri adı, tel, iş emri no veya seri no`), Durum sekmeleri (`Tümü`, `İncelemede`, `Onay Bekliyor`, `İşlemde`, `Hazır`), Öncelik filtresi, Sıralama (`Teslim tarihine göre`, `Kayıt tarihine göre`).
* **Masaüstü Düzeni (1440px):**
  - Filtreleme ve arama araç çubuğu (Tek satırda dengeli arama inputu, durum dropdown'ı, teknisyen filtresi).
  - Yoğun Operasyon Tablosu (`DataTable`):
    - Sütunlar: `İş Emri No`, `Müşteri`, `Cihaz & Model`, `Şikâyet / Arıza Özeti`, `Durum Rozeti`, `Öncelik`, `Tahmini Teslim`, `Eylemler (...)`.
    - Satıra tıklandığında detay sayfasına hızlı geçiş.
* **Mobil Düzeni (390px):**
  - Arama alanı tam genişlik. Durum filtreleri yatay kaydırılabilir hap etiketlere (pills) dönüşür.
  - Tablo satırları yerine dokunmatik dostu kart listesi:
    - Üst satır: `#WO-1042` - `iPhone 13 Pro` - `[İşlemde]`
    - Orta: Müşteri adı (`Ahmet Yılmaz`) ve arıza (`Ekran değişimi`)
    - Alt: Teslim tarihi ve tek tıkla arama / detay butonu.
* **Durum Matrisi (State Matrix):**
  - **Yükleniyor:** 8 satırlık tablo iskeleti (Skeleton row).
  - **Boş Durum (Arama Sonucu Yok):** `"Aramanızla eşleşen iş emri bulunamadı. Filtreleri temizlemeyi deneyin."` `[Filtreleri Sıfırla]` butonu.
  - **Hata Durumu:** Satırların yerinde uyarı ikonu, hata mesajı ve `Tekrar Dene` eylemi.

---

## 4. Yeni İş Emri Açma Akışı (`/work-orders/new`)

* **Amaç / JTBD:** Müşteri dükkana cihazı bıraktığı anda 60-90 saniye içinde müşteriyi seçmek/kaydetmek, cihaz arızasını girmek ve teslim fişi oluşturmak.
* **Birincil Aksiyon (Primary CTA):** `İş Emrini Kaydet ve Fiş Oluştur` (Sağ alt / form sonunda mavi buton).
* **İkincil Aksiyonlar:** `Vazgeç`, `Hızlı Müşteri Ekle` (+ ikonu ile satır içi açılan mini dialog).
* **Masaüstü Düzeni (1440px):**
  - 2 Sütunlu Form Mimarisi:
    - Sol Geniş Bölüm (8 birim):
      - *Bölüm 1: Müşteri Bilgisi* (Mevcut müşteri arama/seçme veya anında Ad-Soyad / Telefon girişi).
      - *Bölüm 2: Cihaz Bilgileri* (Cihaz türü: Telefon/Laptop/Tablet, Marka/Model, Seri No / IMEI, Kilit kodu / Desen).
      - *Bölüm 3: Arıza ve Fiziksel Durum* (Müşteri şikâyeti, teknisyenin ilk fiziksel gözlemi: örn. *"Kasada ezik var"*).
    - Sağ Bölüm (4 birim - Sabit Özet Kartı):
      - *Öncelik:* Normal / Yüksek / Acil.
      - *Atanan Teknisyen:* Usta seçimi.
      - *Tahmini Teslim Tarihi ve Saati:* Tarih seçici.
      - *Tahmini Ücret / Avans Bilgisi.*
      - Kayıt özeti önizlemesi.
* **Mobil Düzeni (390px):**
  - Tek sütunlu dikey akış. Adımlar arası net ayırıcı çizgiler.
  - En altta sabitlenen (sticky footer) onay barı: `İş Emrini Kaydet` butonu her zaman ekranda görünür.
* **Durum Matrisi (State Matrix):**
  - **Form Doğrulama Hatası:** Zorunlu alanlar (Müşteri telefonu, Cihaz modeli, Arıza açıklaması) doldurulmadığında ilgili input altına kırmızı uyarı metni ve input'a kırmızı kenarlık.
  - **Kaydediliyor:** Buton devre dışı, spinner aktif, mükerrer tıklama önleyici (`double-click prevention`).
  - **Başarı Durumu:** İş emri oluşturulur oluşturulmaz anında detay ekranına (`/work-orders/WO-XXXX`) yönlendirme ve üstte `"İş emri başarıyla oluşturuldu"` bildirimi.

---

## 5. İş Emri Detay ve Durum Yönetimi (`/work-orders/[id]`)

* **Amaç / JTBD:** Teknisyenin cihaz üzerinde yaptığı işlemleri kaydetmesi, parça eklemesi, durumu güncellemesi ve müşteriye hazır WhatsApp mesajı göndermesi.
* **Birincil Aksiyon (Primary CTA):** `Durumu Güncelle` (Açılır durum geçiş menüsü: örn. *"Hazır"* durumuna geçir).
* **İkincil Aksiyonlar:** `WhatsApp Bildirimi Hazırla` (`wa.me` taslak modalı açar), `Yazdır / Teslim Fişi Al`, `Teknisyen Notu Ekle`.
* **Masaüstü Düzeni (1440px):**
  - Üst Bar: Geri dön linki, `#WO-1042` başlığı, mevcut `StatusBadge`, ana aksiyon butonları.
  - Sol Ana Panel (8 birim):
    - *Cihaz ve Arıza Kartı:* Marka/Model, Seri No, İlk Şikâyet, Fiziksel Durum.
    - *Kronolojik Durum Geçmişi (Timeline):* Hangi tarihte kim tarafından hangi duruma alındığı (Audit log).
    - *Servis Notları:* Teknisyenin arıza tespit notları ve dahili yorumlar.
    - *Kullanılan Parçalar & İşçilik:* Eklenen parçalar (örn. *"iPhone 13 Orijinal Ekran - 3.500 TL"*).
  - Sağ Panel (4 birim):
    - *Müşteri Kartı:* Ad-Soyad, Telefon (Tıkla-ara özellikli), Adres, müşterinin diğer iş emirleri.
    - *Hızlı İletişim:* `"Müşteriye Durum Bildir"` butonu -> Modal açılır:
      > *"Sayın Ahmet Yılmaz, #WO-1042 numaralı iPhone 13 cihazınızın onarımı tamamlanmış olup teslimata hazırdır. İşEmriAl Teknik Servis"*
      > `[WhatsApp Web ile Gönder]` (Otomatik API değil, `wa.me` güvenli bağlantısı).
* **Mobil Düzeni (390px):**
  - Üstte sabit başlık ve durum rozeti.
  - Sekmeli yapı veya akıcı tek sütun: `Genel Bilgiler`, `Zaman Çizelgesi`, `Notlar`.
  - Alt barda büyük `Durumu Değiştir` ve `WhatsApp Mesajı` butonları.
* **Durum Matrisi (State Matrix):**
  - **Yükleniyor:** Sol ve sağ paneller için blok skeleton yükleyiciler.
  - **Hata Durumu:** Geçersiz ID girilirse: `"İş emri bulunamadı veya bu kayda erişim yetkiniz yok."` `[Listeye Dön]` butonu.
  - **Durum Güncelleme Başarısı:** Zaman çizelgesi anında yenilenir ve yeşil toast bildirimi çıkar.

---

## 6. Müşteri Rehberi (`/customers`) ve Müşteri Detayı (`/customers/[id]`)

* **Amaç / JTBD:** Atölyeye gelen daimi müşterileri, telefon numaralarını ve geçmişte bıraktıkları tüm cihazların onarım geçmişini tek yerde incelemek.
* **Birincil Aksiyon (Primary CTA):** `+ Yeni Müşteri Ekle`
* **İkincil Aksiyonlar:** Müşteri adına veya telefonuna göre anlık arama, müşteriye doğrudan telefon etme (`tel:` linki).
* **Masaüstü Düzeni (1440px):**
  - Liste Ekranı: Arama çubuğu, Müşteri Adı, Telefon, Kayıtlı Cihaz Sayısı, Toplam İş Emri, Son Ziyaret Tarihi sütunları.
  - Detay Ekranı: Müşteri iletişim kartı ve altında müşteriye ait tüm aktif ve tamamlanmış iş emirleri tablosu.
* **Mobil Düzeni (390px):**
  - Telefon rehberi stili arama ve alfabetik kart dizilimi. Tek tıkla arama butonu (`Ara`).
* **Durum Matrisi (State Matrix):**
  - **Yükleniyor:** Tablo skeleton'ı.
  - **Boş Durum:** `"Kayıtlı müşteri bulunamadı."`
  - **Hata Durumu:** Hata paneli ve tekrar dene seçeneği.

---

## 7. Atölye ve Ekip Ayarları (`/settings/workshop`, `/settings/team`)

* **Amaç / JTBD:** Atölye adını, fiş üzerinde çıkacak servis adresini, telefonunu ve çalışan teknisyen hesaplarını yönetmek.
* **Birincil Aksiyon (Primary CTA):** `Değişiklikleri Kaydet` / `+ Yeni Teknisyen Davet Et`
* **Masaüstü Düzeni (1440px):** Sol dikey ayar sekmesi (`Atölye Bilgileri`, `Ekip Üyeleri`, `Fiş Şablonu`), sağda form paneli.
* **Mobil Düzeni (390px):** Dikey yığılmış ayar kartları.
* **Durum Matrisi:** Başarılı kayıtta yeşil toast; yetkisiz personelde alanlar kilitli ve disabled.

---

## 8. Ekranlar Arası Ortak UX Kuralları ve Durum Standartları

1. **Hiçbir Zaman Yalnızca Renkle Durum Belirtilmez:** Her durum göstergesinde hem renk hem de açık Türkçe durum metni (örn. *"Parça Bekliyor"*, *"Müşteri Onayı Bekliyor"*) yer alır.
2. **Klavye Erişilebilirliği:** Formlarda `Tab` sırası mantıksal düzendedir; diyaloglar `Esc` tuşuyla kapanır; birincil aksiyonlar `Enter` ile tetiklenebilir.
3. **Dokunmatik Hedefler (Touch Targets):** Mobilde tüm buton ve interaktif öğeler minimum `44x44px` tıklama alanına sahiptir.
4. **Gerçekçi Türkçe Örnek Veriler:** Tüm prototip ve mock ekranlarında gerçekçi esnaf ve servis dili kullanılır (örn. *"Ahmet Usta"*, *"iPhone 11 Ekran Kırık"*, *"Batarya Şişmiş"*).
