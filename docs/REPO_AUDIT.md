# İşEmriAl — Depo ve Altyapı Denetim Raporu (Repo Audit)
**Tarih:** 10 Ekim 2026  
**Rol:** Ürün Mimarı, Kıdemli Full-Stack Geliştirici, Ürün Tasarımcısı  
**Hedef:** Mevcut altyapı, çalışma ortamı, riskler, eksikler ve doğrulanmış bulguların analizi  

---

## 1. Yönetici Özeti (Executive Summary)

İşEmriAl projesi, Türkiye'deki küçük teknik servislerin (telefon, tablet, bilgisayar ve küçük elektronik tamir atölyeleri) günlük iş emri, cihaz, müşteri ve durum takibini kağıt, WhatsApp ve excel karmaşasından kurtarmak amacıyla tasarlanmış dikey bir B2B SaaS çözümüdür.

Mevcut çalışma alanı incelendiğinde projenin **"Greenfield / Hazırlık Paketi"** aşamasında olduğu tespit edilmiştir. Proje dizininde henüz derlenmiş veya çalışan bir uygulama kodu (`package.json`, `src/`, framework konfigürasyonları) bulunmamakta; proje `AGENTS.md`, `README.md`, `.agents/skills/premium-saas-ui` kural/beceri seti, `docs/` altındaki ürün kılavuzları ve `prompts/` altındaki faz çalıştırma senaryolarından oluşmaktadır.

Bu denetim; varsayımları gerçek çalışma ortamı bulgularından ayırmakta, teknik riskleri sınıflandırmakta ve sonraki geliştirme fazları için sağlam bir zemin hazırlamaktadır.

---

## 2. Doğrulanmış Ortam ve Çalışma Alanı Bulguları

Aşağıdaki bulgular doğrudan sistem üzerinde komut çalıştırılarak doğrulanmış somut gerçeklerdir:

| Kriter | Doğrulanan Değer | Durum / Not |
| :--- | :--- | :--- |
| **İşletim Sistemi** | Windows (x64) | Shell: PowerShell |
| **Node.js** | `v24.19.0` | Kurulu ve güncel LTS üstü sürüm |
| **npm** | `11.17.0` | Kurulu; ancak PowerShell `ExecutionPolicy Restricted` kısıtlaması nedeniyle doğrudan `npm` komutları ps1 engeline takılmaktadır. `npm.cmd` veya `-ExecutionPolicy Bypass` kullanılmalıdır. |
| **pnpm** | `12.6.0` | Kurulu; `npm` gibi ps1 kısıtlamasına tabidir. `pnpm.cmd` veya bypass bayrağı ile sorunsuz çalışmaktadır. |
| **Yarn / Bun** | Bulunamadı | Ortamda kurulu değildir. |
| **Git** | `2.55.0.windows.3` | Git CLI kurulu; ancak çalışma alanında henüz bir `.git` deposu ilklendirilmemiştir (`git init` yapılmamış). |
| **Docker Engine** | `Docker version 29.6.2` | Kurulu ve hazır. PostgreSQL ve Redis konteynerleri için kullanılabilir. |
| **psql CLI** | Bulunamadı | Sistem `PATH` değişkeninde yerel PostgreSQL CLI aracı yoktur. Veritabanı yönetimi Docker veya ORM migration'ları üzerinden yürütülmelidir. |
| **MCP Araçları** | `playwright` (lazy) | Tarayıcı otomasyonu, ekran görüntüsü (screenshot) ve responsive görsel QA için Playwright MCP hazır bulunmaktadır. |
| **Mevcut Kod Tabanı** | Boş (Greenfield) | `package.json`, frontend/backend çatısı henüz mevcut değildir. |

---

## 3. Mimari ve Teknik İnceleme

### 3.1. Frontend Mimarisi Değerlendirmesi
- **Önerilen Yapı:** Next.js (App Router) + TypeScript + Tailwind CSS v4 + Lucide React + React Hook Form / Zod.
- **Değerlendirme:** Next.js App Router, SSR ve Client Component ayrımı ile atölye içi hızlı sayfa yüklemeleri (iş emri listesi, detay sayfaları) için idealdir.
- **Tasarım Sistemi Uyarısı:** `docs/DESIGN_SYSTEM.md` ve `.agents/skills/premium-saas-ui` kuralları uyarınca; shadcn/ui veya Tailwind v4 bileşenleri doğrudan ham olarak kullanılmamalı; özel CSS custom property token'ları (`--background`, `--surface`, `--primary`, `--border` vb.) ile light-first, koyu slate metinli ve kontrollü mavi vurgulu kurumsal kimliğe büründürülmelidir.

### 3.2. Backend ve Veri Katmanı Değerlendirmesi
- **Mimari Seçenekler:**
  - *Seçenek A (Monolitik Next.js Full-Stack):* Next.js Route Handlers + Server Actions + ORM. (Tek repo, sıfır port çatışması, hızlı prototipleme).
  - *Seçenek B (Ayrık Frontend & Backend):* Next.js (Frontend) + NestJS (Backend API) + PostgreSQL. (`docs/TECHNICAL_PLAN.md` içinde belirtilen öneri).
- **Kritik Karar & Değerlendirme:** MVP aşamasında iki ayrı servis çalıştırmak küçük teknik servis kapsamı için dev ortamında ekstra port/CORS yönetimi doğurur. Ancak `TECHNICAL_PLAN.md` belgesindeki NestJS kuralına sadık kalınacaksa; API sözleşmeleri (DTO'lar, Swagger/OpenAPI, katı yetkilendirme muhafızları) baştan sıkı tutulmalı veya monorepo yapısı kurgulanmalıdır.
- **ORM Standardı:** `README.md` ve `AGENTS.md` açıkça belirtmiştir: *“ORM olarak TypeORM veya Prisma'dan yalnızca biri seçilmeli; aynı projede ikisi birlikte kullanılmamalıdır.”*
  - **Tercih:** Modern TypeScript tip güvenliği, hızlı migration üretimi ve declarative şema netliği nedeniyle **Prisma** (veya NestJS resmi tercihi istenirse TypeORM) tek başına seçilmelidir. Bu raporda standart olarak **Prisma ORM** önerilmektedir.

### 3.3. Güvenlik ve İzolasyon Modeli
- **Organizasyon İzolasyonu (Multi-Tenancy):** Sistemdeki her `Customer`, `Device`, `WorkOrder`, `Note` ve `Attachment` mutlaka bir `organizationId` (veya `workshopId`) ile ilişkilendirilmelidir.
- **URL Manipülasyon Riski:** Kullanıcının `/work-orders/WO-1092` adresine giderken başka bir atölyenin iş emrini görmesi engellenmelidir. Bu kontrol yalnızca UI seviyesinde buton saklama ile değil, veritabanı sorgusu katmanında `WHERE id = :id AND organizationId = :currentUserOrgId` şeklinde zorunlu kılınmalıdır.

---

## 4. Risk Analizi ve Azaltma Stratejileri

| Risk | Olasılık | Etki | Azaltma Stratejisi (Mitigation) |
| :--- | :---: | :---: | :--- |
| **Windows ExecutionPolicy Engeli** | Yüksek | Yüksek | Tüm npm/pnpm komutları `pnpm.cmd` veya `powershell -ExecutionPolicy Bypass` ile çalıştırılmalı, otomasyon scriptleri bu standartla hazırlanmalıdır. |
| **Erken Entegrasyon Yanılsaması** | Orta | Yüksek | WhatsApp API, otomatik SMS, e-fatura veya online ödeme bağlanmış gibi sahte arayüz/servis üretilmemelidir. Müşteriye bildirim için yalnızca onaylı `wa.me/?text=...` taslak bağlantısı sunulmalıdır. |
| **Görsel AI Klişeleri ve Aşırı Karmaşıklık** | Yüksek | Orta | Koyu siyah arayüzler, mor-pembe gradientler, cam efekti (glassmorphism), dev anlamsız metrik kartları kesin olarak engellenmeli; açık tema, yüksek okunurluk ve işlevsel veri tabloları uygulanmalıdır. |
| **İki Ayrık Uygulamanın Başlatma Zorluğu** | Orta | Orta | Frontend ve Backend ayrıldığında geliştirme aşamasında tek komutla her ikisini ayağa kaldıran script (`concurrently` veya workspace yapısı) kurulmalıdır. |
| **Dosya Yükleme Güvenliği** | Orta | Yüksek | Cihaz fotoğrafları ve hasar kayıtları yüklenirken uzantı bazlı değil MIME türü ve dosya boyutu (max 5MB) sunucu tarafında doğrulanmalı; yerel diskte güvenli private dizinde saklanmalıdır. |

---

## 5. Doğrulanmış Bulgular vs. Kanıtsız Varsayımlar

Proje kuralları gereği, kanıtlanmış gerçekler ile varsayımlar net bir çizgiyle ayrılmıştır:

### Doğrulanmış Gerçekler:
1. Workspace dizininde `package.json` bulunmamaktadır; proje sıfırdan kurulacaktır.
2. Node.js `24.19.0`, npm `11.17.0`, pnpm `12.6.0`, Docker `29.6.2`, Git `2.55.0` sistemde yüklüdür.
3. PowerShell doğrudan ps1 script yürütmesini engellemektedir (`Restricted` policy).
4. Playwright MCP entegrasyonu mevcuttur; tarayıcı tabanlı görsel denetim yapılabilir.

### Varsayımlar (Doğrulanması Gerekenler):
1. **Hedef Dikey:** İlk dikey telefon/bilgisayar teknik servisleri olarak varsayılmıştır. Başka sektörlere (beyaz eşya, oto elektrik vb.) genelleştirilmeden önce pilot servislerle doğrulanmalıdır.
2. **Durum Akışı:** 9 adımlı durum akışı (`Yeni` -> `İncelemede` -> `Teklif bekliyor` -> `Müşteri onayı bekliyor` -> `İşlemde` -> `Parça bekliyor` -> `Hazır` -> `Teslim edildi` -> `İptal`) teorik bir modeldir; küçük servislerin bazıları daha sade (3-4 adımlı) bir akışı tercih edebilir.
3. **Rol Ayrımı:** Küçük atölyelerde genellikle tek bir usta veya 2-3 kişilik ekip çalışmaktadır; işletme sahibi ile teknisyenin aynı kişi olduğu senaryo yaygındır.

---

## 6. Sonraki Adım İçin Öneriler

1. Git deposu ilklendirilmeli (`git init`) ve `.gitignore` dosyası oluşturulmalıdır.
2. Tasarım konsepti (`prompts/01-DESIGN-CONCEPT.md`) aşamasına geçilirken, kod tabanına geçmeden önce Dashboard, İş Emri Listesi ve Yeni İş Emri formu için yazılı görsel yönergeler ve mock UI şablonu hazırlanmalıdır.
3. Paket kurulumu ve mimari inşa yalnızca ilgili faza gelindiğinde ve onay alındığında başlatılmalıdır.
