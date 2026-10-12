# Prompt 03 — MVP ana ekranlarını üret

`premium-saas-ui` Skill'ini ve proje kurallarını uygula. `docs/UX_FLOWS.md` ve `docs/DESIGN_SYSTEM.md` ana referanstır. Önce çalışan tasarım sistemi üzerine ana kullanıcı akışlarını uygula.

Bu fazda yalnızca frontend ve fixture/mock veri katmanı:
- Dashboard
- İş emri listesi + arama + filtreler + sıralama
- Yeni iş emri oluşturma akışı
- İş emri detay: durum, tarihçe, notlar, cihaz ve müşteri
- Müşteri listesi + detay
- Takım/işletme ayarları için temel shell

Beklentiler:
- Tıklanabilir her kontrol anlamlı davranmalı. Gerçek backend yoksa local/mock state ile davranışını göster ve bunun mock olduğunu açıkça ayır.
- İş emri numarası, müşteri, cihaz, durum, öncelik ve teslim tarihi tutarlı fixture data içinde tanımlansın.
- Türkçe tarih/para/telefon gösterimi tutarlı olsun.
- Filtreler gerçekten listeyi değiştirsin. CTA'lar ilgili forma veya dialog'a götürsün.
- Empty, loading, error, success, unauthorized ve disabled hallerini uygun yerlerde düşün.
- Mobilde ana menü, form, tablo ve dialog kullanılabilir olsun.
- Erişilebilir etiketler, klavye odağı ve form doğrulaması olsun.
- Sayfaları aynı şablonun kopyası yapma; ama ortak tasarım dili korunsun.

Önce bir ekran/akış üzerinde tamamla, screenshot QA yap, sonra diğerine geç. En sonunda 1440/1024/390 genişliklerinde ana route'ları gezerek taşma, hizalama, küçük metin, sahte buton ve tutarsız renk sorunlarını düzelt. Test/build sonuçlarını doğru raporla.
