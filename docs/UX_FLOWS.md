# İşEmriAl — UX Flows

## Flow A: Yeni iş emri oluşturma

1. Kullanıcı “Yeni iş emri”ne basar.
2. Müşteri seçer veya hızlıca yeni müşteri kaydı açar.
3. Cihaz türü, marka/model, seri numarası varsa, arıza şikâyeti ve fiziksel durum notunu girer.
4. Öncelik, sorumlu teknisyen ve tahmini teslim tarihini belirler.
5. İsteğe bağlı fotoğraf/ek ekler.
6. Kaydetmeden önce kısa özet görür.
7. Kaydetme sonrası iş emri numarası ve sonraki önerilen eylem gösterilir.

Kurallar:
- Uzun tek formu bölümlere ayır; gereksiz wizard adımları ekleme.
- Zorunlu/isteğe bağlı alanlar açık olsun.
- Hatalar alanın yanında anlaşılır Türkçe gösterilsin.
- Çift tıklama veya tekrar istek duplicate kayıt üretmemeli.

## Flow B: İş emri takip

1. Liste ekranında serbest metin arama, durum, öncelik ve tarih filtreleri bulunur.
2. Kullanıcı satıra tıklayarak detay ekranına gider.
3. Detay üst bölümünde numara, müşteri/cihaz, durum ve tek ana aksiyon görülür.
4. Zaman çizelgesi durum değişikliklerini ve notları sıralı gösterir.
5. Durum değişikliği onaylanır ve aktivite kaydı oluşur.
6. Müşteriye iletilecek mesaj taslağı üretilebilir; otomatik gönderilmez.

## Flow C: Müşteri araması

1. Global arama müşteri adı, telefon, iş emri numarası veya cihaz bilgisine göre sonuç verir.
2. Arama sonuçları türlere ayrılır.
3. Yetkili kullanıcı müşteri profiline, açık iş emirlerine ve geçmiş kayıtlara gider.
4. Kişisel veri gereğinden fazla arama önerilerinde veya loglarda tutulmaz.

## Screen inventory

- `/login`
- `/dashboard`
- `/work-orders`
- `/work-orders/new`
- `/work-orders/[id]`
- `/customers`
- `/customers/[id]`
- `/settings/team`
- `/settings/workshop`

Route adları mevcut proje yapısına göre değiştirilebilir.

## Every screen must define

- Main job-to-be-done
- Page title and description
- Primary CTA
- Main content layout
- Loading, error, empty and success states
- Keyboard interactions
- Mobile layout
- Permissions and destructive action confirmation
