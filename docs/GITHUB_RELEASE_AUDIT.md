# İŞEMRİAL — GITHUB RELEASE AUDIT & INVENTORY

**Tarih:** 12 Ekim 2026  
**Aşama:** GitHub Release, Güvenlik Denetimi ve Profesyonel Depo Hazırlığı  
**GitHub Hesabı:** `ErdemYy`  
**Hedef Depo:** `https://github.com/ErdemYy/isemrial`  
**Denetçi Rolleri:** Kıdemli DevOps Mühendisi, Git Uzmanı, Açık Kaynak Proje Maintainer'ı, Uygulama Güvenliği Mühendisi  

---

## 1. Proje Keşfi ve Envanter (Discovery & Inventory)

### 1.1 Proje Kök Dizini ve Git Durumu
- **Çalışma Dizini:** `c:\Users\Okul\OneDrive\Belgeler\İşEmriAl` (Doğrulandı, doğru kök dizin)
- **Git Repository Durumu:** Git repository mevcut, aktif branch: `master`.
- **Commit Geçmişi:** `No commits yet` (Temiz başlangıç durumu).
- **Mevcut Remote'lar:** Yok (`git remote -v` boş). Başka bir projeye ait remote bulunmuyor, üzerine yazma riski yoktur.
- **GitHub CLI (`gh`):** Doğrulandı (`gh auth status` -> `github.com` ErdemYy aktif, 'repo' kapsamı mevcut).
- **Hedef Depo Durumu:** `https://github.com/ErdemYy/isemrial` henüz GitHub üzerinde mevcut değil (`Could not resolve to a Repository`). Temiz şekilde oluşturulmaya hazır.

### 1.2 Paket ve Mimarî Envanteri
- **Frontend (Kök):**
  - Next.js: `v15.2.1` (App Router, Standalone Build)
  - React: `v19.0.0`
  - Tailwind CSS: `v4.0.9` (@tailwindcss/postcss)
  - Lucide Icons: `v1.16.0`
  - TypeScript: `v5.8.2`
  - Paket Yöneticisi: `pnpm` (pnpm-lock.yaml)
- **Backend (`backend/`):**
  - NestJS Core & Common: `v11.0.0`
  - Prisma ORM: `v6.4.1` (PostgreSQL 16)
  - Kimlik Doğrulama: Argon2 (`v0.41.1`), HTTP-only çerezler, Server-side Session yönetimi
  - Doğrulama: `class-validator` (`v0.14.1`), `class-transformer` (`v0.5.1`)
  - Güvenlik: Helmet eşdeğeri `SecurityMiddleware`, Rate Limiter (IP tabanlı sliding window), CORS/CSRF origin koruması
  - TypeScript: `v5.8.2`
  - Paket Yöneticisi: `pnpm` (bağımsız backend/pnpm-lock.yaml)
- **Konteyner ve Dağıtım Altyapısı:**
  - `Dockerfile`: Multi-stage Next.js Standalone Runner (Non-root `nextjs:1001`, ~65.6 MB)
  - `backend/Dockerfile`: Multi-stage NestJS API Runner (Non-root `node:1000`, ~263 MB)
  - `docker-compose.yml`: `web`, `api`, `db`, `migration` servisleri, `isemrial_net` bridge ağı, `isemrial_pgdata` named volume
  - `docker-compose.prod.yml`: Host port izolasyon profili (yalnızca web portu açılır, DB ve API dışarı kapalıdır)

---

## 2. Güvenlik ve Gizli Bilgi Taraması (Security & Secret Scan)

GitHub'a açık kaynak olarak gönderilmeden önce tüm proje dosyaları ve geçmişi taranmıştır:

### 2.1 Taranan Hassas Ögeler ve Sonuçlar

| Güvenlik Kriteri | Kontrol Yöntemi | Sonuç | Durum |
| :--- | :--- | :--- | :---: |
| **Ortam Dosyaları (`.env*`)** | `.gitignore` ve `git status -u` | `.env`, `backend/.env`, `.env.staging` git takibinde DEĞİLDİR. Yalnızca `.env.example` ve `backend/.env.example` placeholder olarak mevcuttur. | **TEMİZ** |
| **Özel Anahtarlar ve Tokenlar** | Ripgrep Regex (`ghp_`, `gho_`, `PRIVATE KEY`, `AKIA`) | Kod ve dokümantasyon içerisinde gerçek API anahtarı veya token bulunmamaktadır. | **TEMİZ** |
| **Veritabanı Dökümleri (`*.sql`, `*.dump`)** | Dosya uzantısı filtreleri | Hiçbir `*.sql`, `*.dump`, `*.backup` dosyası repoda bulunmamaktadır. | **TEMİZ** |
| **Oturum ve Secret Anahtarları** | `SESSION_SECRET` taraması | Dokümanlardaki değerler açıkça placeholder/örnek olarak işaretlenmiştir (`change-this-...`, `staging-...sample`). Kodda dinamik kontrol zorunludur. | **TEMİZ** |
| **Kişisel Veri ve Gerçek Müşteri Bilgisi** | Veritabanı ve test dosyaları | Müşteri verileri temsili Türk atölye senaryolarıdır (Usta Teknik Servis, Kadıköy Bilişim, sahte 5xx telefonları). Gerçek şahıs verisi yoktur. | **TEMİZ** |
| **Derleme ve Test Çıktıları** | `.gitignore` doğrulaması | `node_modules/`, `dist/`, `.next/`, `coverage/`, `.playwright-mcp/` tamamen `.gitignore` kapsamındadır. | **TEMİZ** |

---

## 3. Ekran Görüntüsü Envanteri (Screenshot Inventory)

`docs/screenshots/` dizinindeki ekran görüntüleri tek tek incelenmiş; çözünürlük, okunabilirlik ve gizlilik açısından onaylanmıştır. README'de temiz kullanım için standart adlarla eşleştirilmiştir:

| Standart Dosya Adı | Kaynak Dosya | Çözünürlük / Tip | Doğrulanan İçerik |
| :--- | :--- | :---: | :--- |
| `dashboard-desktop.png` | `phase4-dashboard-authenticated.png` | 1440x900 / Masaüstü | Usta Teknik Servis paneli, metrikler, güncel iş emirleri tablosu, hızlı aksiyonlar. |
| `dashboard-tablet.png` | `phase4-dashboard-1024.png` | 1024x768 / Tablet | Tablet uyumlu duyarlı dashboard düzeni. |
| `dashboard-mobile.png` | `phase4-dashboard-390.png` | 390x844 / Mobil | Mobil cihazlar için optimize edilmiş kart ve navigasyon görünümü. |
| `work-orders-desktop.png` | `phase4-work-orders-real-api.png` | 1440x900 / Masaüstü | Filtre çipleri (Tümü, Tamirde, Onay Bekliyor, vb.), arama, teknisyen ve cihaz türü filtreleri, iş emri tablosu. |
| `work-orders-mobile.png` | `phase4-work-orders-390.png` | 390x844 / Mobil | Mobil iş emirleri kart listesi ve hızlı durum filtreleri. |
| `work-order-detail.png` | `phase4-work-order-detail-real-api.png` | 1440x900 / Masaüstü | Cihaz şikayeti, servis ve tamir notları girişi, kronolojik işlem geçmişi (timeline), ücret ve avans dökümü. |
| `new-work-order.png` | `work-orders-new-1440.png` | 1440x900 / Masaüstü | 3 adımlı iş emri açma formu: müşteri bilgisi, cihaz kategorisi/tanımı, arıza şikayeti ve teslim koşulları. |
| `login-desktop.png` | `phase4-login-1440.png` | 1440x900 / Masaüstü | Atölye giriş ekranı, e-posta/şifre doğrulaması ve demo profil kısayolları. |
| `login-mobile.png` | `phase4-login-390.png` | 390x844 / Mobil | Mobil giriş arayüzü ve dokunmatik optimize form. |
| `customer-detail.png` | `phase3-customer-detail-1440.png` | 1440x900 / Masaüstü | Müşteri profili, iletişim detayları ve geçmiş cihaz onarım kayıtları. |

---

## 4. Yayın Hazırlığı ve Kabul Kriterleri (Release Readiness)

- [x] Proje kök dizini doğrulandı.
- [x] Gizli anahtar ve veri sızıntısı taraması tamamlandı (Sıfır risk).
- [x] `.gitignore` güncellendi (`.playwright-mcp/`, loglar ve build artıkları engellendi).
- [x] `.env.example` ve `backend/.env.example` hazırlandı.
- [x] 10 adet doğrulanmış, yüksek kaliteli ekran görüntüsü standartlaştırıldı.
- [x] Profesyonel İngilizce `README.md` hazırlandı.
- [x] `CONTRIBUTING.md` ve `SECURITY.md` kılavuzları oluşturuldu.
- [x] Lisans beyanı (`No license has been specified yet`) README'de açıklandı.
- [ ] GitHub remote oluşturma ve ilk push işlemi (Aşama 6).
- [ ] Push sonrası canlı depo doğrulama (Aşama 7).

*(Bu raporun son bölümü GitHub push işlemi sonrasında güncellenecektir.)*
