# Prompt 01 — İşEmriAl tasarım konseptini oluştur

`AGENTS.md` ve `premium-saas-ui` Skill'ini uygula. Önce `docs/REPO_AUDIT.md`, `docs/IMPLEMENTATION_PLAN.md`, `docs/PRODUCT_BRIEF.md` ve `docs/DESIGN_SYSTEM.md` dosyalarını oku.

Henüz backend geliştirme. Önce yalnızca görsel konsept ve tıklanabilir/gerçekçi mock UI üret.

Hedef: Türkiye'deki küçük teknik servisler için güven veren, premium, hafif, operasyonel bir B2B SaaS. Varsayılan açık tema. Kırık beyaz zemin, beyaz yüzeyler, koyu slate metin, kontrollü cobalt/mavi aksan, ince border, net tipografi. Koyu arka plan, mor/pembe gradient, neon glow, glassmorphism, her şeyi kart yapma ve klişe dört dev KPI kutusu KULLANMA.

Önce bu üç ekranı tasarla:
1. Dashboard / Genel Bakış: tek belirgin “Yeni iş emri” CTA'sı, az sayıda anlamlı KPI, son iş emirleri listesi, gecikenler veya bugünkü teslimler.
2. İş emirleri listesi: yoğun ama nefes alan tablo, arama, durum/öncelik filtreleri, satır aksiyonları ve empty/loading hali.
3. Yeni iş emri: iyi bölümlendirilmiş form, müşteri/cihaz bilgileri, arıza açıklaması, öncelik, sorumlu kişi, tahmini teslim ve özet.

Gerçekçi Türkçe metinler ve tutarlı örnek veriler kullan. Sahte grafik/veri uydurma. İş akışını dekoratif grafiklerden daha önemli tut.

Çalışma şekli:
- Önce layout ve görsel kararları kısa yazılı olarak açıkla.
- Tokenları `docs/DESIGN_SYSTEM.md` içinde gerekirse düzelt.
- Mevcut projeye uyumlu component altyapısıyla yalnızca bu konsept ekranlarını oluştur.
- Tarayıcı aracı mevcutsa aç; 1440px ve 390px genişlikte ekran görüntüsü al, sorunları listele ve düzelt.
- Kullanılmayan bileşen veya buton bırakma. Tam çalışan backend entegrasyonu gerekmeyen yerlerde mock davranışı açık olsun.
- Bu konsepti genişletmeden önce ekran görüntülerini ve kararlarını raporla; tüm ürüne yaymadan dur.
