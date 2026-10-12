# Prompt 02 — Tasarım sistemini kur

Onaylanan tasarım yönünü bütün temel UI bileşenlerine uygula. Önce mevcut package.json ve CSS yapısını kontrol et. Gerekli olmayan paketleri kurma.

Mümkünse Tailwind CSS v4 + shadcn/ui + React 19 ile uyumlu resmi kurulum yolunu kullan; projede uyumsuz sürüm varsa körlemesine upgrade yapma. shadcn/ui'yi bitmiş görsel kimlik olarak kabul etme; token ve stilini İşEmriAl'a göre özelleştir.

Yapılacaklar:
1. Semantic CSS tokens: background, surface, foreground, muted, border, primary, focus, success, warning, danger, info.
2. Tipografi ve spacing/radius ölçeği.
3. Button, input, select, textarea, form field, status badge, dropdown, dialog/drawer, toast, tooltip, table, skeleton, empty state ve alert bileşenleri.
4. Hover, focus-visible, active, disabled, loading, validation ve error halleri.
5. Dark mode zorunlu değil; önce light theme kusursuz olsun. Dark mode eklenecekse ayrı bilinçli tema olarak tasarla, ana arayüzü siyaha çevirmek için kullanma.
6. Component showcase / design-system demo sayfası oluştur; her varyantı gerçek içerikle göster.
7. Token dışında rastgele hex renkleri ve keyfî radius/shadow kullanımlarını denetle.

Tasarım kontrolü:
- Her şeyi kartlara dönüştürme.
- Butonları gereksiz yere pill yapma.
- Geniş gradient hero veya cam paneller ekleme.
- Form, tablo ve statü etiketlerinin okunabilirliğini önceliklendir.
- 1440, 1024 ve 390 viewport'ta incele.

İş bitince test/build/lint sonuçlarını ve ekran görüntüsünden gördüğün gerçek kusurları raporla. Çalıştırılmayan testleri başarılı diye yazma.
