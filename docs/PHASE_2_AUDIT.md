# İşEmriAl — Faz 2 Denetim ve Uygulama Öncesi Mimari İnceleme (Phase 2 Audit)

**Tarih:** 10 Ekim 2026  
**Aşama:** Faz 2 — Tasarım Sistemi ve Ortak UI Bileşenleri (Design System & UI Components)  
**Rol:** Kıdemli Frontend Mimarı, Design Systems Mühendisi, UI/Erişilebilirlik Geliştiricisi  
**Referans Dokümanlar:** `AGENTS.md`, `.agents/skills/premium-saas-ui`, `docs/DESIGN_SYSTEM.md`, `docs/IMPLEMENTATION_PLAN.md`, `docs/SCREEN_INVENTORY.md`, `docs/PHASE_1_1_FINAL_QA.md`

---

## 1. Faz Kapsamı ve Dokümantasyon Çelişkisi Düzeltmesi

### 1.1 Onaylı Yol Haritası Sıralaması
`docs/IMPLEMENTATION_PLAN.md` içinde onaylanan resmî geliştirme sıralaması şu şekildedir:
- **Faz 0:** Temel Hazırlık & Depo İskeleti (Tamamlandı)
- **Faz 1 / 1.1:** Tasarım Konsepti & Bubilet Referanslı Görsel Yön Revizyonu (Tamamlandı)
- **Faz 2:** Tasarım Sistemi & Ortak UI Bileşenleri (ŞU ANKİ AŞAMA)
- **Faz 3:** Çekirdek Kullanıcı Arayüzü & Operasyonel Akışlar
- **Faz 4:** Güvenli Backend MVP, Veri Katmanı & Prisma Entegrasyonu
- **Faz 5:** Kalite, Güvenlik & Yayın Denetimi

### 1.2 Tespit Edilen Çelişki ve Gerekçeli Düzeltme
`docs/PHASE_1_1_FINAL_QA.md` dosyasının kapanış bölümünde (madde 7.1 ve 8) sehven *"Gerçek veritabanı (Prisma/PostgreSQL) entegrasyonu Faz 2 kapsamındadır"* ifadesi yer almaktaydı. Bu durum yol haritası ile çelişmekteydi; çünkü backend ve veritabanı entegrasyonu Faz 4 olarak planlanmıştır. 

Bu çelişki `docs/PHASE_1_1_FINAL_QA.md` dosyasında düzeltilmiş; Faz 2'nin kesin sınırları **Tasarım Sistemi, Ortak UI Bileşenleri ve Bileşen Vitrini** olarak tescil edilmiştir. Bu fazda gereksiz paket ekleme, veritabanı kurma veya backend yazma işlemleri **yapılmayacaktır**.

---

## 2. Mevcut Bileşenler ve Kod Tekrarlarının Analizi

Depodaki mevcut durum incelendiğinde, `src/components/` dizini altında yalnızca iki dosya bulunmaktadır:
- `src/components/AppShell.tsx`: Masaüstü ve mobil gezinme kabuğu.
- `src/components/StatusBadge.tsx`: İş emri durum rozeti.

Tüm ekranlar (`/dashboard`, `/work-orders`, `/work-orders/new`) arayüz öğelerini kendi içinde **satır içi (inline) Tailwind sınıflarıyla** üretmektedir. Bu durum ciddi kod tekrarlarına, bakım zorluklarına ve token tutarsızlığı riskine yol açmaktadır.

### Tespit Edilen Tekrarlayan Yapılar (Repetitive Inline Patterns)

1. **Butonlar (Buttons):**
   - Birincil CTA butonları: `bg-[#157347] hover:bg-[#105C38] text-white text-xs font-bold rounded-xl px-4 py-2.5 shadow-xs transition-colors focus-visible:...` 3 farklı sayfada ve AppShell'de 7 kez birebir tekrar etmektedir.
   - İkincil / Beyaz butonlar: `bg-white border border-[#E5EBE7] hover:bg-[#F0F4F1] text-[#18231F] text-xs font-semibold rounded-xl px-3 py-2...` 8 yerde kopyalanmıştır.
   - Destructive / İptal butonları tek tip bir standarda sahip değildir.
   - Loading (yükleniyor) ve disabled durumları butonlarda merkezi bir prop ile yönetilmemektedir.

2. **Arama Alanı (SearchField):**
   - Dashboard ve İş Emirleri sayfalarında arama inputu, sol büyüteç ikonu, temizleme butonu ve odak stilleri satır içi olarak kopyalanmıştır.

3. **Filtre Çipleri ve Sekmeler (FilterChip & Tabs):**
   - Durum filtreleme hapları (`activeFilter === 'all' ? 'bg-[#157347] text-white' : 'bg-white border border-[#E5EBE7] text-[#4E5C55]'`) iki ana ekranda 20+ satır tekrar etmektedir.

4. **Form Elemanları (`Input`, `Label`, `Select`, `Textarea`):**
   - `/work-orders/new` sayfasında 8 farklı form alanı için `w-full px-3.5 py-2.5 text-xs bg-white border border-[#E5EBE7] rounded-xl text-[#18231F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#157347]` sınıfları yinelenmiştir.
   - Hata durumunda `border-[#B42318] bg-[#FEF3F2]` stilleri ve inline hata metinleri manuel uygulanmaktadır.

5. **Kartlar ve Bölüm Başlıkları (`Card`, `CardHeader`, `CardContent`):**
   - `bg-white border border-[#E5EBE7] rounded-2xl p-4 md:p-6 shadow-2xs` kalıbı tüm ekranlarda elle yazılmaktadır.

6. **Detay Modalı / Pencere (`Dialog` / `Modal`):**
   - Hem Dashboard hem de İş Emirleri sayfasında `selectedOrder` için açılan modal (`fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4...`) ~120 satır halinde kopyalanmıştır. Odak kapanı (focus trap) ve ESC tuşu dinleyicisi eksiktir.

7. **Bildirim Mesajları (`Toast` / `Alert`):**
   - Hızlı durum güncellemelerinde gösterilen bildirim (`fixed top-16 right-4 z-50 bg-[#18231F] text-white...`) kütüphanesiz, geçici bir `setTimeout` ile sayfaya gömülmüştür.

8. **Durum İskeletleri ve Boş Durumlar (`Skeleton`, `EmptyState`, `ErrorState`):**
   - Ekranlarda veri arandığında sonuç bulunamadığında gösterilen boş durum (empty state) kartları dağınık ve tek tipleştirilmemiştir. Yüklenme aşaması için skeleton bileşenleri bulunmamaktadır.

---

## 3. Tasarım Tokenları ve CSS Değişkenleri Analizi

`src/app/globals.css` içinde Faz 1.1'de sabitlenen tokenlar şu şekildedir:
- `--background: #F7F9F7` (Sıcak/doğal ferah tuval)
- `--surface: #FFFFFF` (Çalışma yüzeyi)
- `--surface-subtle: #F0F4F1` (Hover ve ikincil zemin)
- `--foreground: #18231F` (Birincil metin)
- `--muted-foreground: #4E5C55` (WCAG AAA uyumlu ikincil metin)
- `--border: #E5EBE7` (Yumuşak kenarlık)
- `--border-subtle: #EFF3F0` (İç çizgi)
- `--primary: #157347` (WCAG AA 5.91:1 uyumlu birincil buton rengi)
- `--primary-hover: #105C38` (AAA uyumlu koyu hover)
- `--brand-accent: #20C875` (Canlı marka vurgusu)
- `--brand-accent-subtle: #E9F9F0` (Hafif marka yüzeyi)
- `--status-ready: #087443` / `--status-ready-bg: #E6F7EE`
- `--status-process: #175CD3` / `--status-process-bg: #EFF8FF`
- `--status-pending: #8C3B00` / `--status-pending-bg: #FFFAEB`
- `--status-urgent: #B42318` / `--status-urgent-bg: #FEF3F2`
- `--status-neutral: #344054` / `--status-neutral-bg: #F2F4F7`

Bileşenler bu tokenları CSS değişkenleri ve yardımcı sınıflar üzerinden kullanacak; rastgele keyfî hex kodları yazılmayacaktır.

---

## 4. Önerilen Bileşen Mimarisi ve Dosya Yapısı

Gereksiz üçüncü parti paket kurmadan, projenin mevcut `clsx`, `tailwind-merge` ve `lucide-react` bağımlılıkları ile tam uyumlu, saf ve yüksek performanslı bir bileşen kütüphanesi kurulacaktır:

```
src/
├── components/
│   ├── ui/
│   │   ├── button.tsx           # Primary, secondary, outline, ghost, destructive, loading/disabled
│   │   ├── input.tsx            # Standart & ikonlu girdi, error state
│   │   ├── label.tsx            # Erişilebilir etiket, zorunlu yıldızı (*)
│   │   ├── textarea.tsx         # Çok satırlı metin girdisi
│   │   ├── select.tsx           # Seçim kutusu
│   │   ├── badge.tsx            # Genel semantik etiket (neutral, success, warning, danger, info)
│   │   ├── status-badge.tsx     # İş emri durum rozeti (STATUS_MAP eşleşmeli)
│   │   ├── card.tsx             # Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter
│   │   ├── search-field.tsx     # Arama kutusu (büyüteç, temizle butonu, klavye kısayolu)
│   │   ├── filter-chip.tsx      # Sayı rozetli filtreleme hapı (Pill)
│   │   ├── table.tsx            # Table, TableHeader, TableBody, TableRow, TableHead, TableCell
│   │   ├── dialog.tsx           # Erişilebilir modal pencere (focus trap, backdrop, ESC dinleyici)
│   │   ├── alert.tsx            # Bilgilendirme ve hata uyarı kutusu
│   │   ├── toast.tsx            # Hafif, erişilebilir bildirim mesajı bileşeni
│   │   ├── skeleton.tsx         # Yükleniyor iskeleti
│   │   ├── empty-state.tsx      # Boş durum görünümü (ikon, başlık, açıklama, CTA)
│   │   ├── error-state.tsx      # Hata ekranı (tekrar dene butonu ile)
│   │   ├── form-field.tsx       # Label + Input/Textarea + Error/Helper sarmalayıcısı
│   │   └── page-header.tsx      # Başlık, açıklama, ek rozet ve birincil aksiyon alanı
│   └── AppShell.tsx             # Genel uygulama kabuğu
└── app/
    ├── dev/
    │   └── design-system/       # Geliştirici Bileşen Vitrini (Showcase)
    │       └── page.tsx
    ├── dashboard/
    ├── work-orders/
    │   └── new/
    └── globals.css
```

---

## 5. Uygulama Adımları ve Kabul Kriterleri

1. **Bileşenlerin İnşası (`src/components/ui/`):**
   - TypeScript ile katı tip tanımları (`any` içermeyen).
   - Erişilebilirlik nitelikleri (`aria-invalid`, `aria-describedby`, `role="dialog"`, ESC tuşu desteği, odak yönetimi).
   - Dokunma alanları: Mobilde minimum `44px` yüksekliği garantileyen boyutlandırma.
2. **Geliştirici Vitrininin Kurulması (`/dev/design-system`):**
   - Tüm bileşenlerin varsayılan, varyant, hover/focus, disabled, error ve loading durumlarının canlı sunumu.
   - Renk tokenları ve WCAG kontrast tablosunun vitrin üzerinden taranabilmesi.
3. **Mevcut Sayfaların Ortak Bileşenlere Refactor Edilmesi:**
   - `/dashboard`, `/work-orders` ve `/work-orders/new` sayfalarındaki tekrarlayan satır içi kodların yeni `src/components/ui/` bileşenlerine bağlanması.
   - Fonksiyonelliğin, filtrelerin ve form doğrulamasının eksiksiz korunması.
4. **Kalite ve Tarayıcı Testleri:**
   - `pnpm.cmd build` ve `pnpm.cmd lint` çalıştırma.
   - Playwright ile 1440px, 1024px ve 390px ekranlarda vitrin ve temel ekranların görsel doğrulaması.
   - `docs/PHASE_2_REVIEW.md` raporu oluşturularak tamamlanması.
