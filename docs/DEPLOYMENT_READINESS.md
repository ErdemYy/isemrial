# İŞEMRİAL — YAYIN HAZIRLIĞI VE DAĞITIM KILAVUZU (DEPLOYMENT READINESS)

**Sürüm:** Faz 5  
**Tarih:** 12 Ekim 2026  
**Hedef:** İşEmriAl uygulamasının yerel geliştirme ortamından staging ve üretim (production) sunucularına güvenli, tekrarlanabilir ve sıfır veri kaybıyla dağıtılması.

---

## 1. Mimari Genel Bakış

İşEmriAl mimarisi 3 ana katmandan oluşur:

1. **Frontend (Next.js 15 App Router):**
   - Node.js runtime üzerinde bağımsız çalışan SSR/SSG sunucusu (`PORT=3000`).
   - `/api/*` rotalarını `next.config.ts` rewrite kuralıyla arka uç servisine iletir.
2. **Backend API (NestJS 11):**
   - Modüler REST API (`PORT=4000`).
   - Cookie tabanlı kimlik doğrulama, rate limiter, CSRF/Origin kontrolleri ve güvenlik başlıklarını yönetir.
3. **Veritabanı (PostgreSQL 16):**
   - Docker container (`isemrial_postgres`) veya yönetilen bulut veritabanı (AWS RDS, Supabase, Neon vb.).
   - Prisma ORM aracılığıyla tip güvenli veri erişimi ve migration yönetimi.

---

## 2. Ortam Değişkenleri (Environment Variables)

Üretim ortamında `.env` dosyası Git takibine kesinlikle eklenmemeli, sunucu ortamında güvenli biçimde (Docker Secrets, Vault veya CI/CD Secrets) tanımlanmalıdır.

### Backend Değişkenleri

| Değişken | Örnek Üretim Değeri | Açıklama |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Güvenlik başlıklarını, Secure çerezleri ve kısıtlayıcı CORS'u etkinleştirir. |
| `PORT` | `4000` | Backend servisinin dinleyeceği port. |
| `DATABASE_URL` | `postgresql://user:pass@db-host:5432/isemrial_prod?schema=public` | PostgreSQL bağlantı adresi (SSL önerilir). |
| `FRONTEND_ORIGIN` | `https://app.isemrial.com` | CORS ve CSRF Origin doğrulamasında izin verilen ana alan adı. |
| `SESSION_SECRET` | *(64 karakterli kriptografik rastgele dize)* | Session HMAC/imzalama için kullanılan gizli anahtar. |
| `SESSION_MAX_AGE_DAYS` | `7` | Oturum çerezinin geçerlilik süresi (gün). |

### Frontend Değişkenleri

| Değişken | Örnek Üretim Değeri | Açıklama |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Next.js üretim optimizasyonlarını etkinleştirir. |
| `PORT` | `3000` | Frontend servisinin dinleyeceği port. |
| `INTERNAL_API_URL` | `http://backend:4000` | Sunucu tarafı rewrite'lar için backend adresi (Docker iç ağı). |
| `NEXT_PUBLIC_API_URL` | `https://api.isemrial.com` veya boş | İstemci tarafı doğrudan API bağlantısı (kullanılıyorsa). |
| `NEXT_PUBLIC_ENABLE_DEMO_LOGIN` | `false` | Giriş ekranındaki tek tıkla test girişi butonlarını gizler. |

---

## 3. Dağıtım Öncesi Doğrulama (Pre-Flight Checklist)

Üretim sürümüne çıkmadan önce şu adımlar doğrulanmalıdır:

- [x] **Gizli Anahtar Kontrolü:** `SESSION_SECRET` varsayılan geliştirme değeri taşımamalıdır.
- [x] **Demo Girişi Koruması:** `NEXT_PUBLIC_ENABLE_DEMO_LOGIN` değeri `false` olmalı veya tanımlanmamalıdır.
- [x] **Seed Koruması:** Üretim ortamında `prisma db seed` çalıştırılmamalıdır (kod düzeyinde `NODE_ENV=production` kontrolü mevcuttur).
- [x] **Secure Cookie:** Üretim HTTPS altında çalıştığında çerezin `Secure` bayrağı aktif olmalıdır.
- [x] **CORS & Origin:** Yalnızca gerçek üretim alan adlarına (`https://...`) izin verilmelidir.
- [x] **Build Doğrulaması:** Hem Next.js hem NestJS TypeScript ve paketleme hatası vermeden derlenmelidir (`pnpm build`).

---

## 4. Veritabanı Migration ve Dağıtım Prosedürü

Üretim ortamında veritabanı şeması **asla** `prisma db push` veya destructive reset ile güncellenmemelidir.

### Migration Dağıtım Komutu:
```bash
# Sadece uygulanmamış migration dosyalarını sırayla çalıştırır
cd backend
pnpm dlx prisma migrate deploy
```

Bu komut:
1. `_prisma_migrations` tablosunu kontrol eder.
2. Bekleyen migration'ları atomik transaction içinde uygular.
3. Mevcut verilere zarar vermez.

---

## 5. Veritabanı Yedekleme ve Geri Yükleme (Backup & Restore)

### 5.1 Geliştirme / Staging Ortamı Yedekleme (Docker)

```powershell
# SQL Dökümü Olarak Yedek Alma (Tarih damgalı)
$BACKUP_FILE = "backup_isemrial_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql"
docker exec -t isemrial_postgres pg_dump -U postgres isemrial_dev > $BACKUP_FILE
Write-Host "Yedek başarıyla oluşturuldu: $BACKUP_FILE"
```

### 5.2 Sıkıştırılmış / Binary Yedek (Production Önerisi)

```bash
# Özel format (-Fc) ile sıkıştırılmış yedek
docker exec -t isemrial_postgres pg_dump -U postgres -Fc isemrial_dev > isemrial_backup.dump
```

### 5.3 Yedekten Geri Yükleme Prosedürü (Restore)

```powershell
# 1. Mevcut bağlantıları sonlandırarak temiz bir veritabanı oluşturma veya mevcut veritabanına basma
# SQL formatından geri yükleme:
Get-Content $BACKUP_FILE | docker exec -i isemrial_postgres psql -U postgres -d isemrial_dev

# Binary formatından geri yükleme:
docker exec -i isemrial_postgres pg_restore -U postgres -d isemrial_dev --clean --if-exists isemrial_backup.dump
```

### 5.4 Yedek Bütünlüğü Doğrulama

Yedeğin geçerliliğini test etmek için:
1. İzole bir geçici veritabanı açın: `createdb test_restore`
2. Yedeği geçici veritabanına yükleyin.
3. Tablo kayıt sayılarını doğrulayın:
   ```sql
   SELECT count(*) FROM "Customer";
   SELECT count(*) FROM "WorkOrder";
   SELECT count(*) FROM "TimelineEvent";
   ```

### 5.5 Kurtarma Sonrası Oturum Geçersiz Kılma (Post-Restore Session Invalidation — Faz 5.2.2)

Veritabanı afet kurtarma veya yedekten geri yükleme operasyonlarında, yedekleme anında aktif olup daha sonra kapatılmış veya iptal edilmiş oturumların yeniden canlanması (**Session Resuscitation**) riski bulunmaktadır.

Uygulama dış trafiğe açılmadan önce aşağıdaki komutla kurtarılan veritabanındaki tüm eski oturumlar iptal edilmeli ve operatör doğrulaması yapılmalıdır:

```bash
cd backend
# Komut çalıştırma (DATABASE_URL kurtarılan veritabanını göstermelidir):
pnpm run post-restore:invalidate-sessions --target-db=<kurtarilan_db_adi> --confirm-invalidation
```

**Güvenlik Protokolü Kuralları:**
- Hedef veritabanı adı (`--target-db`), `DATABASE_URL` içindeki veritabanı adıyla birebir eşleşmelidir; uyuşmazlık durumunda işlem anında durdurulur (`exit 1`).
- `--confirm-invalidation` bayrağı olmadan işlem başlamaz.
- `isemrial_dev` geliştirme veritabanı, `--allow-dev-invalidation` açıkça verilmedikçe kazara oturum temizliğine karşı kilitlidir.
- İşlem atomik transaction içinde yürütülür; `Customer`, `WorkOrder`, `User` vb. iş modellerinde 1 satır bile değişiklik olursa işlem durdurulur ve geri alınır.
- Bu komut `exit 0` dönmeden sunucu portu dış ağa / ingress trafiğine **asla açılmamalıdır**.

---

## 6. Docker Healthcheck ve Konteyner Yönetimi

`docker-compose.yml` içerisinde PostgreSQL için aktif healthcheck konfigürasyonu tanımlıdır:

```yaml
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U postgres -d isemrial_dev"]
  interval: 5s
  timeout: 5s
  retries: 5
```

Konteyner yeniden başlatıldığında veriler Docker `isemrial_postgres_data` named volume üzerinde saklanır ve veri kaybı yaşanmaz.

---

## 7. Geri Alma (Rollback) Stratejisi

Eğer yeni bir dağıtımda kritik bir sorun oluşursa:
1. **Frontend / Backend:** Önceki Docker imajına veya Git commit'ine geri dönün (`git checkout <tag>` & `docker-compose restart`).
2. **Veritabanı:**
   - Eğer migration geri alınamaz bir şema değişikliği içeriyorsa, dağıtım öncesi alınan anlık yedek (`backup_pre_deploy.sql`) kullanılarak veritabanı geri yüklenir.
   - Dağıtım öncesinde her zaman anlık `pg_dump` yedeği alınmalıdır.

---

## 8. Canlıya Çıkış Öncesi Kalan Operasyonel Sınırlar

Faz 5 son kalite ve güvenlik denetimi tamamlanmış olup sistem MVP düzeyinde üretime hazırdır. Gerçek ticari canlıya çıkış öncesinde sonraki fazlarda entegre edilmesi gereken harici operasyonel servisler şunlardır:

1. **İşlemsel E-posta (Transactional Email):** SendGrid, Postmark veya AWS SES ile şifre sıfırlama ve bildirim akışları.
2. **SMS & Doğrudan WhatsApp API:** Twilio veya Meta WhatsApp Cloud API ile otomatik müşteri bilgilendirmeleri (Şu an kullanıcı onayıyla açılan `wa.me` taslağı çalışmaktadır).
3. **Bulut Dosya Depolama:** Cihaz hasar fotoğrafları için AWS S3 veya Cloudflare R2 entegrasyonu.
4. **Harici APM & Loglama:** Sentry ve Datadog / Grafana Loki ile merkezi loglama ve anomali tespiti.
