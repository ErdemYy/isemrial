# Prompt 00 — Önce incele ve planla

Sen İşEmriAl projesinde ürün mimarı, kıdemli full-stack geliştirici ve ürün tasarımcısı olarak çalışıyorsun. Google Antigravity içinde Gemini 3.8 Flash kullanıyorum.

ÖNEMLİ: Bu ilk görevde uygulama kodu yazma, dosyaları topluca değiştirme veya paket kurma. Önce mevcut workspace'i incele. `AGENTS.md`, `.agents/skills/premium-saas-ui/SKILL.md`, `docs/PRODUCT_BRIEF.md`, `docs/DESIGN_SYSTEM.md`, `docs/UX_FLOWS.md` ve `docs/TECHNICAL_PLAN.md` dosyalarını oku.

Yapılacaklar:
1. Repo kökünü, package manager'ı, mevcut framework'leri, mevcut bağımlılıkları, test/lint/build komutlarını ve mevcut route/component yapısını incele.
2. Çalışan proje varsa sıfırdan kurmaya kalkma; var olanı koru.
3. Ürün hedefi ve MVP kapsamına göre eksik/çelişkili noktaları listele.
4. `docs/REPO_AUDIT.md` oluştur: mevcut durum, riskler, varsayımlar, önerilen değişiklikler.
5. `docs/IMPLEMENTATION_PLAN.md` oluştur: küçük fazlara ayrılmış sıra, her fazın dosya kapsamı, kabul kriterleri, testleri ve geri dönüş planı.
6. `docs/SCREEN_INVENTORY.md` oluştur: route, ana görev, birincil CTA, loading/empty/error/success halleri, mobil davranış.
7. Teknoloji seçimini gerekçelendir. Mevcut yapıda TypeORM varsa sırf tercih nedeniyle Prisma'ya, Prisma varsa TypeORM'a geçme. Tek ORM kullan.
8. Tasarım yönünü bu aşamada yalnızca yazılı tarif et; henüz tüm arayüzü üretme.
9. Tahminleri gerçek bulgudan ayır. Çalıştırmadığın testin sonucunu iddia etme.

Çıkışta kısa bir özet, oluşturduğun dosyalar, bilinmeyenler ve başlamadan önce çözülmesi gereken engelleri bildir. Bu görev sonunda dur; sonraki prompt'u bekle.
