# İşEmriAl — Kalıcı Proje Kuralları

## Ürün ve kullanıcı
- İşEmriAl, ilk aşamada Türkiye'deki küçük teknik servisler ve tamir atölyeleri için iş emri yönetim ürünüdür.
- İlk dikey olarak telefon/bilgisayar teknik servislerini varsay; ürün kararlarını genelleştirmeden önce varsayımı kullanıcı görüşmeleriyle doğrula.
- Her özellik şu soruya cevap vermelidir: teknisyen veya işletme sahibi bugün hangi işi daha hızlı, daha doğru veya daha az unutularak yapabilecek?
- Gerçek dışı müşteri, entegrasyon, otomatik mesaj gönderimi veya tamamlanmış işlem iddiası üretme.

## Görsel kalite kuralları
- Varsayılan görünüm light-first olmalı. Genel arka plan sıcak/soğuk kırık beyaz veya açık gri; metin koyu lacivert-gri; ana vurgu kontrollü mavi olmalı.
- Siyah tam ekran arka plan, neon vurgular, mor-pembe gradientler, her bölümde glassmorphism, aşırı gölge ve gereksiz animasyon kullanma.
- Hazır AI dashboard klişelerinden kaçın: yan yana aynı boyda dört dev istatistik kartı, her şeyi karta sarma, aşırı yuvarlak pill butonlar, anlamsız grafikler, sahte canlı veriler ve genel “AI-powered” sloganları kullanma.
- Tasarımın ana hiyerarşisini gerçek operasyonel iş akışları kursun: iş emri tablosu, durumlar, müşteri/cihaz bilgisi, sonraki eylemler, arama ve filtreleme.
- Renk, tipografi, radius, spacing ve gölgeleri token'lar üzerinden yönet. Component'lerde keyfî hex renkleri ve tek seferlik ölçüleri çoğaltma.
- Kartları yalnızca gerçek bir bilgi veya etkileşim grubu oluşturuyorsa kullan; tablo, liste, sekme, ayırıcı ve boşluklarla çeşitlilik kur.
- Arayüz metinleri doğal Türkçe olmalı. “Lorem ipsum”, anlamsız ürün isimleri veya çevrilmemiş İngilizce etiketler bırakma.
- Gerçekçi demo verileri kullan; örnek veriyi üretim verisi gibi gösterme.
- Her ana ekranda loading, empty, error, success ve permission/disabled durumlarını tasarla.
- Masaüstü, tablet ve mobil düzeni düşün. Tablo mobilde taşmamalı; gerekirse satır kartına dönüşmeli veya yatay kaydırma açıkça kontrol edilmeli.
- Klavye odağı görünür olmalı; form etiketleri, hata metinleri, yeterli kontrast ve touch target boyutları gözetilmeli.
- Animasyonlar kısa, amaçlı ve azaltılmış hareket tercihine saygılı olmalı.

## Kod kalitesi
- Mevcut repo yapısını, package manager'ı ve var olan bağımlılıkları incelemeden yeni mimari veya paket ekleme.
- Kullanıcı açıkça istemeden çalışan özellikleri silme veya proje çatısını yeniden kurma.
- Tek seferde çok geniş değişiklik yapma. Küçük, doğrulanabilir fazlar hâlinde ilerle.
- Tek ORM, tek form doğrulama stratejisi ve tutarlı API hata formatı kullan.
- Form girişlerini istemci ve sunucu tarafında doğrula. Yetkilendirme yalnızca UI'da gizleme şeklinde uygulanamaz; API tarafında da kontrol edilir.
- Hassas bilgiler, erişim tokenları, müşteri verileri ve ortam sırları log'lara veya istemci bundle'ına yazılmaz.
- Veritabanı değişikliklerinde migration, anlamlı test ve geri alınabilirlik düşün.
- Gerçek WhatsApp, ödeme, SMS veya e-posta entegrasyonu kurulmadıysa bunu bağlıymış gibi göstermemelisin. İlk sürümde WhatsApp bağlantıları yalnızca kullanıcı onayıyla açılan `wa.me` taslak bağlantısı olabilir.

## Her görev sonunda rapor
1. Değiştirilen dosyalar.
2. Tamamlanan kullanıcı davranışları.
3. Çalıştırılan testler/build/lint sonuçları; çalıştırılmadıysa bunu açıkça belirt.
4. Bilinen eksikler veya varsayımlar.
5. Uygun olduğunda masaüstü ve mobil ekran görüntüleri.
6. Bir sonraki faza geçmeden önce bloklayıcı sorunlar.

## Süreç kuralı
- Önce plan ve tasarım kararlarını üret, ardından kodla.
- Tasarım yönü onaylanmadan uygulamanın bütün ekranlarını üretme.
- Görsel kalite denetimi başarısızsa yeni özellik eklemeyi durdur, önce görsel kusurları gider.
