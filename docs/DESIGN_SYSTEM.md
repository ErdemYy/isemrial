# İşEmriAl — Design System v0.2 (Bubilet-Referenced Energetic & Operational UI)

## 1. Tasarım İlkesi ve Sanat Yönetimi

İşEmriAl; soğuk, donuk ve gri bir kurumsal admin paneli değildir.
Türkiye'deki teknik servisler ve tamir atölyeleri için tasarlanmış; **modern, canlı, dinamik, doğrudan amaca yönlendiren ve güven veren** bir yeni nesil operasyon platformudur.

### Referans Prensipleri (Bubilet Esinli Operasyonel Tasarım)
- **Canlı ve Kolay Tanınan Marka Kimliği:** Taze zümrüt yeşili (`#20C875`) ana aksiyonlarda ve canlı marka yüzeylerinde net odak oluşturur.
- **Doğrudan Ana İşe Yönlendirme:** Kullanıcı açılışta ne yapması gerektiğini anında anlar; arama çubuğu ve yeni iş açma aksiyonu ekranın en doğal odak noktasıdır.
- **Taranabilir Operasyonel Keşif:** İşler, durumlar ve teslimat vadeleri yorucu dev kartlar yerine akıcı kategorik bantlar ve net bölümler halinde sunulur.
- **Mobil Öncelikli Gerçek Uygulama Hissi (App-Like):** 390px mobil ekranda masaüstünün küçültülmüş bir kopyası değil; başparmak erişimine uygun, dokunmatik dostu, natif uygulama akışkanlığında bir deneyim sunulur.

---

## 2. Renk Sistemi (Color Tokens)

```css
:root {
  /* Temel Tuval ve Yüzeyler */
  --background: #F7F9F7;          /* Sıcak ve ferah doğal açık zemin */
  --surface: #FFFFFF;             /* Temiz çalışma yüzeyi */
  --surface-subtle: #F0F4F1;      /* İkincil yüzey / hover alanı */
  --surface-active: #E4ECE7;      /* Aktif basılmış yüzey */

  /* Tipografi Renkleri (WCAG 2.2 AAA Uygun) */
  --foreground: #18231F;          /* Koyu zümrüt-slate birincil metin (16.5:1 kontrast) */
  --muted-foreground: #4E5C55;    /* İkincil açıklama ve etiketler (7.02:1 kontrast) */

  /* Sınırlar */
  --border: #E5EBE7;              /* İnce, yumuşak sınır çizgileri */
  --border-subtle: #EFF3F0;       /* Çok hafif iç ayırıcılar */

  /* Marka ve Birincil Eylem (WCAG 2.2 AA Uyumlu) */
  --brand-accent: #20C875;        /* Canlı marka yeşili (Rozetler, ikonlar, marka kimliği) */
  --brand-accent-subtle: #E9F9F0; /* Açık marka yeşili yüzey */
  --primary: #157347;             /* Birincil buton rengi (Beyaz metinle 5.91:1 AA kontrast) */
  --primary-hover: #105C38;       /* Hover / koyulaşma (7.06:1 AAA kontrast) */
  --primary-foreground: #FFFFFF;  /* Buton içi metin */
  --ring: #157347;                /* Klavye odak halkası (focus-visible) */

  /* Semantik Durum Renkleri (Tek Tip Yeşilden Kaçınan Ayrık Palet) */
  --status-ready: #087443;        /* Hazır / Teslime Hazır (yeşil, 5.29:1) */
  --status-ready-bg: #E6F7EE;
  --status-process: #175CD3;      /* İşlemde / Onarımda (semantik mavi, 5.86:1) */
  --status-process-bg: #EFF8FF;
  --status-pending: #8C3B00;      /* Onay Bekliyor (kehribar, 7.30:1) */
  --status-pending-bg: #FFFAEB;
  --status-urgent: #B42318;       /* Parça Bekliyor / Gecikme (kırmızı-mercan, 6.50:1) */
  --status-urgent-bg: #FEF3F2;
  --status-neutral: #344054;      /* Yeni Kayıt / Teslim Edildi (nötr slate, 9.20:1) */
  --status-neutral-bg: #F2F4F7;
}
```

---

## 3. Tipografi ve Hiyerarşi

- **Ana Font:** `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
- **Sayfa Başlığı:** 22–26px, `font-bold`, `-0.02em` tracking.
- **Bölüm Başlıkları:** 15–17px, `font-semibold`.
- **Gövde Metin:** 13–14px, dengeli satır aralığı (`leading-relaxed`).
- **Mikro Etiketler / Durumlar:** 11–12px, `font-medium`.
- **Rakamlar ve Kodlar:** `font-bold` veya hafif tabular mono (fiyat ve iş emri no için).

---

## 4. Spacing, Geometri ve Bileşen Kuralları

- **Yarıçap (Border Radius):** 
  - Butonlar, inputlar ve durum rozetleri: `8–10px` (`rounded-lg`)
  - Kartlar ve ana paneller: `12–16px` (`rounded-xl` / `rounded-2xl`)
- **Gölge:** Ağır ve kirli gölgeler yerine çok hafif ve temiz yüzey ayrımı (`shadow-xs` ve `border`).
- **Dokunma Alanları:** Mobilde tüm buton ve interaktif öğeler minimum `44px` yüksekliğe sahiptir.
- **Alt Gezinme Barı (Mobile Bottom Bar):** Başparmakla tek dokunuşla ulaşılabilir 3 ana merkez: `Genel Bakış`, `İş Emirleri`, `Yeni İş`.

---

## 5. Kaçınılacak Hatalar (Anti-Patterns)

- Koyu siyah tam ekran arayüzler ve neon mor gradyanlar.
- Her veri kutusunu dev bir karta dönüştürme alışkanlığı.
- Dört büyük devasa metrik kutusunu otomatik olarak üst üste dizmek.
- Yeşili göz yoracak şekilde her yere rastgele basmak (yalnızca marka, birincil eylem ve anlamlı vurgu için ayrılmıştır).
- Mobilde yatay taşan kontrolsüz tablolar.
