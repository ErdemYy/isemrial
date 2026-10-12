# İşEmriAl — Product Brief

## 1. Ürün özeti

İşEmriAl, küçük teknik servislerin müşteri taleplerini, cihazları, iş emirlerini, teklifleri ve teslimat durumlarını tek yerde takip etmesini sağlayan bir web uygulamasıdır. İlk hedef dikey: telefon ve bilgisayar teknik servisleri. Dikey seçimi varsayımdır; koddan önce gerçek işletmelerle doğrulanmalıdır.

## 2. Problem

Servis çalışanları talepleri WhatsApp konuşmaları, telefon görüşmeleri, kâğıt notlar ve elektronik tablolar arasında kaybedebilir. Müşteri hangi aşamada olduğunu öğrenmek için tekrar arar; teslim tarihi, onay ve parça bekleme gibi adımlar takip edilmesi gereken işlere dönüşür.

## 3. Ana değer önerisi

“Her cihazın, her müşterinin ve her iş emrinin durumunu birkaç saniyede görebil; hiçbir işi unutma.”

## 4. Kullanıcı rolleri

- İşletme sahibi: İş yükünü ve işlerin durumunu görür, kullanıcıları yönetir.
- Servis personeli/teknisyen: Atanan işleri, arıza notlarını, yapılan işlemleri ve parçaları günceller.
- Ön büro: Müşteri ve cihaz bilgilerini açar, iş emri oluşturur, tahmini teslimi ve müşteriye verilecek durum bilgisini yönetir.

İlk MVP'de bu rollerin yetki matrisi basit tutulabilir. Yetki kontrolü hem UI hem API'de yapılmalıdır.

## 5. MVP kapsamı

1. Kimlik doğrulama ve işletme çalışma alanı.
2. Dashboard: bugünkü iş yükü, geciken işler, yeni talepler ve son aktiviteler.
3. İş emri listeleme, arama, durum/öncelik filtreleri ve sıralama.
4. Yeni iş emri akışı: müşteri, cihaz, arıza açıklaması, öncelik, sorumlu kişi ve tahmini teslim tarihi.
5. İş emri detay sayfası: durum geçmişi, notlar, parçalar, dosyalar/fotoğraflar ve müşteri iletişim bilgisi.
6. Müşteri listesi ve müşteri detay profili.
7. Durum değiştirme ve aktivite kaydı.
8. Hazır Türkçe müşteri mesajı taslakları; ilk sürümde WhatsApp'a otomatik gönderim yok.
9. Responsive arayüz, form doğrulama, temel audit trail ve hata/boş/yükleniyor durumları.

## 6. İlk durum akışı

- Yeni
- İncelemede
- Teklif bekliyor
- Müşteri onayı bekliyor
- İşlemde
- Parça bekliyor
- Hazır
- Teslim edildi
- İptal

Durum geçişleri iş kuralı olarak uygulanmalı; hatalı veya mantıksız geçişleri engelle. Durum adlarını işletmelerle yapılan görüşmeler sonrasında değiştirmek mümkün olmalı.

## 7. MVP dışı

- Tam muhasebe ve e-fatura
- Online ödeme alma
- Otomatik WhatsApp/SMS gönderimi
- Tedarikçi/ERP entegrasyonları
- Gelişmiş stok/malzeme depo yönetimi
- Çok lokasyonlu franchise yönetimi
- AI ile kesin arıza teşhisi veya garanti/onarım sonucu garantisi
- Native iOS/Android uygulaması

## 8. Başarı sinyalleri

- Bir iş emri 60–90 saniyede oluşturulabiliyor mu?
- Kullanıcı bir işin durumunu 10 saniye içinde bulabiliyor mu?
- İlk pilot işletmeler her gün geri dönüp ürünü kullanıyor mu?
- Müşteriler daha az durum sorması için ürün içindeki hazır mesajları kullanıyor mu?
- En az birkaç işletme ücretli pilot için gerçek istek gösteriyor mu?

Bu eşikler ilk ürün deneyini yapılandırmak içindir; sektörel standart değildir.
