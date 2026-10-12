# İŞEMRİAL — FAZ 5.2.1: TENANT METRİKLERİ VE VERİ GERİ YÜKLEME DENETİM RAPORU

**Tarih:** 12 Ekim 2026  
**Aşama:** Faz 5.2.1 — Dashboard Metrikleri İzolasyonu ve Kapsamlı Geri Yükleme Denetimi  
**Roller:** Kıdemli DevOps Mühendisi, Backend Mimarı, Uygulama Güvenliği Mühendisi, QA Sorumlusu  
**Sonuç:** **BAŞARILI — METRİK İZOLASYONU VE TENANT BAĞLAMI %100 KANITLANDI, 8 PRISMA MODELİ İLE GENİŞLETİLMİŞ GERİ YÜKLEME EKSİKSİZ DOĞRULANDI**

---

## 1. Giriş ve Problem Tanımı

Faz 5.2 yerel staging provası kabul raporunda, Dashboard sayaçlarında 5 iş emri ve 5 müşteri raporlanması üzerine haklı bir güvenlik sorusu ortaya çıkmıştır:
> *"Staging yedeğinde iki işletmeye dağıtılmış 4 iş emri ve 4 müşteri bulunuyordu. Test sırasında yeni müşteri ve iş emri oluşturulduktan sonra Dashboard sonucunda 5 iş emri ve 5 müşteri raporlandı. Bu sayılar aktif işletmeye mi yoksa veritabanındaki bütün işletmelerin toplamına mı aittir?"*

Bu denetim görevinin amacı:
1. Söz konusu sayıların kök nedenini koddan, oturum bağlamından ve veritabanı kayıtlarından kanıtlarıyla tespit etmek.
2. En az 3 farklı işletme (Org A, Org B ve temiz Org C) ile Dashboard sayaçlarının kiracı izolasyonunu matematiksel kesinlikle test etmek.
3. Geri yükleme testinin kapsamını Prisma şemasındaki iş açısından anlamlı **tüm 8 modele** genişleterek ilişkisel bütünlüğü doğrulamak.

---

## 2. Kök Neden Analizi (Root Cause Analysis with Evidence)

### 2.1 Backend Sorgu Mimarisi İncelemesi
Backend `WorkOrdersService.getMetrics` metodunun kaynak kodu incelenmiştir:
```typescript
async getMetrics(organizationId: string) {
  const orders = await this.prisma.workOrder.findMany({
    where: { organizationId }, // <-- KESİN KİRACI FİLTRESİ
    select: { status: true, priority: true },
  });

  const totalCustomers = await this.prisma.customer.count({
    where: { organizationId }, // <-- KESİN KİRACI FİLTRESİ
  });
  ...
}
```
Metot, `organizationId` parametresiyle hem iş emirlerini hem de müşterileri kesin olarak filtrelemektedir. Global bir `findMany()` veya filtresiz sayım **kesinlikle bulunmamaktadır**.

Ayrıca `WorkOrdersController` katmanında `user.organizationId` değeri istemcinin gönderdiği body veya header'dan değil, `AuthGuard` tarafından doğrulanmış sunucu oturumundan (`request.user.organizationId`) enjekte edilmektedir.

### 2.2 5 Sayısının Ortaya Çıkış Nedeni (Oturum Bağlamı ve Test Artığı)
Veritabanı kayıtları (`check_org_counts.sql`) incelendiğinde durum açıkça kanıtlanmıştır:

1. **Oturum Bağlamı Geçişi (Session Context Switch):**
   `backend/test-staging-e2e.ts` dosyasının Adım 2'sinde şu kod yer almaktaydı:
   ```typescript
   barisCookie = muratCookie; // Using Murat (Org 1) for the core workflow
   ```
   Test senaryosu, oturumu Adım 1'de açılan yeni atölye yerine bilinçli olarak **Murat Usta (Usta Teknik Servis - Org 1)** oturumuna devretmişti. Dolayısıyla takip eden Adım 3 ve 4'teki müşteri ve iş emri oluşturma işlemleri **Usta Teknik Servis** adına yürütülmüştür.

2. **Tekrarlanan Çalıştırmadan Doğan Kümülatif Artış:**
   - **Başlangıç Tohumu (Seed):** Usta Teknik Servis (Org 1): **3 müşteri, 3 iş emri**. Kadıköy Bilişim (Org 2): **1 müşteri, 1 iş emri**.
   - **İlk Test Denemesi (20:01):** Testin ilk koşturulmasında Adım 3 ve 4 çalışmış ve Usta Teknik Servis'e +1 müşteri ve +1 iş emri eklenmişti (Org 1: **4 müşteri, 4 iş emri** oldu). Ardından Adım 5'teki bir özellik adı uyumsuzluğu nedeniyle test sonlanmıştı.
   - **İkinci Test Denemesi (20:02):** Düzeltilen test baştan çalıştığında Adım 3 ve 4 birer kayıt daha oluşturmuştur (Org 1: **5 müşteri, 5 iş emri** oldu).
   - **Metrik Çıktısı (Adım 8):** Usta Teknik Servis (Murat Usta) oturumunda `GET /api/work-orders/metrics` çağrıldığında, API tam olarak Usta Teknik Servis'in o anki verilerini döndürmüştür: **5 iş emri, 5 müşteri**.
   - **Global Toplam:** O esnada veritabanındaki toplam iş emri sayısı **6** (5 Usta Teknik + 1 Kadıköy Bilişim) ve toplam müşteri sayısı **6** idi.

> [!IMPORTANT]
> **Kesin Kanıt:** Eğer Dashboard sorgusunda bir tenant sızıntısı olsaydı, dönen sayı **6** olurdu. Dönen sayının **5** olması, Kadıköy Bilişim'in 1 kaydının sorguya **kesinlikle dahil edilmediğini**, metriklerin yalnızca aktif kiracıya ait olduğunu kanıtlamaktadır.

---

## 3. Dashboard Metrikleri Çok Kiracılı İzolasyon Testi

Geliştirilen [backend/test-metrics-isolation.ts](file:///c:/Users/Okul/OneDrive/Belgeler/İşEmriAl/backend/test-metrics-isolation.ts) test paketi ile 3 farklı işletme üzerinden uçtan uca izolasyon doğrulanmıştır:

- **İşletme A:** Usta Teknik Servis (`b27fd3cc...`, Murat Usta)
- **İşletme B:** Kadıköy Bilişim & Tamir (`2f4bb1cf...`, Ahmet Tekin)
- **İşletme C:** Anadolu Elektronik Staging (`76b9520b...`, Kemal Demir - Test sırasında sıfırdan oluşturuldu)

### 3.1 Metrik Değişim Tablosu (Dinamik Baseline)

| Aşama / Olay | İşletme A (Usta Teknik) | İşletme B (Kadıköy Bilişim) | İşletme C (Anadolu Elk.) | Doğrulama & İzolasyon Durumu |
| :--- | :---: | :---: | :---: | :--- |
| **Başlangıç Baseline** | 17 Sipariş / 17 Müşteri (6 İşlemde) | 1 Sipariş / 1 Müşteri (0 İşlemde) | Henüz Yok | Her iki işletme yalnızca kendi verisini gördü. |
| **Org C Kaydı** | 17 Sipariş / 17 Müşteri | 1 Sipariş / 1 Müşteri | **0 Sipariş / 0 Müşteri (0 İşlemde)** | **Sıfır İzolasyonu:** C işletmesi sistemdeki 18 siparişten hiçbirini görmedi. |
| **Org A'ya +1 Müşteri, +1 Sipariş** | **18 Sipariş / 18 Müşteri** (+1 / +1) | **1 Sipariş / 1 Müşteri (SABİT)** | **0 Sipariş / 0 Müşteri (SABİT)** | A'daki artış B ve C'ye sızmadı. |
| **Org A Siparişi -> 'islemde'** | **7 İşlemde** (+1) | **0 İşlemde (SABİT)** | **0 İşlemde (SABİT)** | Durum sayacı yalnızca A işletmesinde arttı. |
| **Org C'ye +1 Müşteri, +1 Sipariş** | **18 Sipariş (SABİT)** | **1 Sipariş (SABİT)** | **1 Sipariş / 1 Müşteri (+1 / +1)** | **Ters Yönlü İzolasyon:** C'deki yeni kayıt A veya B'yi değiştirmedi. |

### 3.2 Ek Güvenlik Doğrulamaları
- **Body Tenant Injection Koruması:** `POST /api/work-orders` isteğine fazladan `organizationId: orgBId` enjekte edildiğinde, ValidationPipe (`forbidNonWhitelisted: true`) isteği **400 Bad Request** ile reddetti.
- **Sıfır IDOR (Kayıt Gizleme):** İşletme B kullanıcısı, İşletme A'nın yeni açtığı siparişi doğrudan ID ile sorguladığında **404 Not Found** aldı; kaydın varlığı dahi gizlendi.

---

## 4. Genişletilmiş Veritabanı Geri Yükleme Denetimi (8 Model)

[backend/test-expanded-restore.ts](file:///c:/Users/Okul/OneDrive/Belgeler/İşEmriAl/backend/test-expanded-restore.ts) aracıyla Prisma şemasındaki **iş açısından anlamlı tüm 8 model** denetime dahil edilmiştir:

1. `pg_dump` ile `isemrial_staging` veritabanından anlık tam SQL yedeği alındı (`backup_expanded_rehearsal.sql`).
2. İzole `isemrial_restore_test` veritabanı sıfırlanıp yedek geri yüklendi.
3. Kaynak ve kurtarılan veritabanları model bazında birebir sayıldı.
4. Raw SQL `LEFT JOIN` sorgularıyla yetim (orphan) yabancı anahtar kontrolü yapıldı.

### 4.1 8 Modelin Birebir Eşleşme Tablosu
| Model Adı | Kaynak (`isemrial_staging`) | Kurtarılan (`isemrial_restore_test`) | Eşleşme |
| :--- | :---: | :---: | :---: |
| **User** | 10 | 10 | **%100 PASS** |
| **Organization** | 8 | 8 | **%100 PASS** |
| **Membership** | 10 | 10 | **%100 PASS** |
| **Session** | 19 | 19 | **%100 PASS** |
| **Customer** | 22 | 22 | **%100 PASS** |
| **WorkOrder** | 22 | 22 | **%100 PASS** |
| **WorkOrderNote** | 13 | 13 | **%100 PASS** |
| **TimelineEvent** | 32 | 32 | **%100 PASS** |
| **TOPLAM KAYIT** | **146** | **146** | **%100 EŞLEŞTİ** |

### 4.2 İlişkisel Bütünlük ve Güvenlik
- **Orphan Membership:** `memberships` tablosunda geçersiz `userId` veya `organizationId` içeren kayıt sayısı: **0**.
- **Orphan Work Order:** `work_orders` tablosunda geçersiz `customerId` veya `organizationId` içeren kayıt sayısı: **0**.
- **Orphan Note & Timeline:** `work_order_notes` ve `timeline_events` tablolarında geçersiz `workOrderId` içeren kayıt sayısı: **0**.
- **Gizlilik:** Parola hash'leri veya session token'ları rapor çıktısına kesinlikle yazılmamıştır.
- **Veri Korunumu:** Kaynak `isemrial_staging` veritabanı denetim boyunca hiçbir şekilde değiştirilmemiştir.

---

## 5. PASS / FAIL / NOT RUN Test Sonuçları Tablosu

| Test ID | Test Kapsamı | Beklenen Davranış | Sonuç |
| :---: | :--- | :--- | :---: |
| **MET-01** | İşletme A Başlangıç Metrikleri | Yalnızca Org A kayıtlarının sayılması | **PASS** |
| **MET-02** | İşletme B Başlangıç Metrikleri | Yalnızca Org B kayıtlarının sayılması | **PASS** |
| **MET-03** | Temiz İşletme C Sıfır Metrikleri | 0 sipariş, 0 müşteri, sıfır sızıntı | **PASS** |
| **MET-04** | İşletme A Kayıt Artışı | Yalnızca Org A sayaçlarının +1 artması | **PASS** |
| **MET-05** | İşletme B Sayaç Sabitliği | Org A'daki artışın B'yi etkilememesi | **PASS** |
| **MET-06** | İşletme C Sayaç Sabitliği | Org A'daki artışın C'yi etkilememesi | **PASS** |
| **MET-07** | Durum Sayacı İzolasyonu | Durum değişikliğinde yalnızca ilgili işletmenin sayacının artması | **PASS** |
| **MET-08** | Ters Yönlü İzolasyon | Org C'deki kaydın A veya B'ye sızmaması | **PASS** |
| **MET-09** | Payload Tenant Enjeksiyonu | Request body `organizationId` alanının 400 ile engellenmesi | **PASS** |
| **MET-10** | Sıfır IDOR Kayıt Gizleme | Başka işletmenin siparişinin 404 ile gizlenmesi | **PASS** |
| **RST-01** | Genişletilmiş Geri Yükleme (8 Model) | 8 Prisma modelinin %100 birebir sayılması (146/146 kayıt) | **PASS** |
| **RST-02** | İlişkisel Bütünlük (Foreign Keys) | 0 yetim kayıt, foreign key ilişkilerinin tam korunması | **PASS** |
| **RST-03** | Kaynak Veri Bütünlüğü | `isemrial_staging` veritabanının değişmeden korunması | **PASS** |
| **REG-22** | Faz 5 Genel Regresyon Paketi | 22 kritik senaryonun staging ortamında doğrulanması | **PASS** |

---

## 6. Sonuç ve Yayın Kararı

- **Sonuç:** Faz 5.2 raporundaki 5 sipariş / 5 müşteri sorusu tam olarak açıklığa kavuşturulmuştur. Dashboard metriklerinin ve kiracı veri tabanının **%100 izole olduğu kanıtlanmıştır**.
- **Kurtarma Güvencesi:** 8 iş modelinin tamamı `pg_dump` ve `psql` döngüsünde sıfır veri kaybı ve sıfır ilişkisel bozulma ile geri yüklenmiştir.
- **Karar:** **RELEASE CANDIDATE (RC-1) METRİK VE VERİ GÜVENLİĞİ ONAYLANDI.**

*Kural gereği burada durulmuştur. Yeni özellik geliştirilmemiş, harici canlı sunucuya otomatik deployment yapılmamış ve tüm kanıtlar incelemenize sunulmuştur.*
