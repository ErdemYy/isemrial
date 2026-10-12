# Prompt 05 — Premium kalite ve release denetimi

Yeni özellik eklemeyi bırak ve mevcut uygulamayı ürün kalitesi açısından denetle. `AGENTS.md` ile `premium-saas-ui` Skill'ini uygula.

## Visual audit

Tarayıcı aracı varsa şu ekranları 1440px, 1024px ve 390px viewport'ta aç ve screenshot al:
- Dashboard
- İş emri listesi
- Yeni iş emri formu
- İş emri detay
- Müşteri listesi/detayı

Her ekran için şunları denetle:
- Görsel hiyerarşi ve net birincil aksiyon
- Tutarlı font, spacing, radius, border ve ikonlar
- Siyah yüzey, neon gradient, glassmorphism veya gereksiz kart kalıpları
- Gerçekçi Türkçe copy ve veriler
- Mobil overflow ve tıklama alanları
- Loading, empty, error, success ve validation halleri
- Klavye odağı, form label'ları, kontrast ve erişilebilir dialog
- Çalışmayan buton/filtre/link, console error ve network failure

## Technical audit

- Install/build/typecheck/lint/test komutlarını repo scripts'e göre çalıştır.
- Yetkilendirme, organizasyon verisi izolasyonu, form/server validation, dosya yükleme ve secret'ları gözden geçir.
- Kırık route, hydration hatası, console error, duplicate kaydetme veya eksik empty/error state'lerini bul.
- Gerçek entegrasyon olmayan özellikleri mock olarak işaretle.

## Düzeltme sırası

1. Çalışmayı engelleyen bug/güvenlik problemi.
2. Kullanıcının ana iş akışını engelleyen UX problemi.
3. Responsive/erişilebilirlik sorunu.
4. Görsel tutarsızlıklar.
5. İkincil polish.

Önce sorun listesini önem derecesiyle yaz; ardından güvenli kapsamda düzelt, tekrar test et ve ikinci screenshot setini al. En sonda `docs/RELEASE_AUDIT.md` oluştur: kontrol edilen viewport'lar, test komutları/sonuçları, düzeltilen sorunlar, kalan riskler, çalıştırılmayan kontroller. Kanıt olmadan PASS deme.
