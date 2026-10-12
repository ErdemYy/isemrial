# İŞEMRİAL — STAGING İŞLETİM VE DAĞITIM KILAVUZU (STAGING RUNBOOK)

**Sürüm:** Faz 5.2  
**Tarih:** 12 Ekim 2026  
**Hedef Kitle:** DevOps Mühendisleri, Backend Mimarları ve QA Ekipleri  
**Kapsam:** Sıfırdan Staging Ortamı Kurulumu, Servis Başlatma, Sağlık Denetimi, Yedekleme ve Kurtarma Prosedürleri  

---

## 1. Ön Koşullar ve Sistem Gereksinimleri

Staging provasını temiz bir ortamda çalıştırmak için aşağıdaki araçların kurulu olması gerekir:

- **İşletim Sistemi:** Linux (Ubuntu 22.04+), macOS veya Windows 11 (WSL2 / PowerShell)
- **Node.js:** v20.x, v22.x veya v24.x LTS
- **Paket Yöneticisi:** `pnpm` (v9.x veya v10.x önerilir)
- **Konteyner Motoru:** Docker Engine 24+ ve Docker Compose v2+
- **Veritabanı İstemcisi:** PostgreSQL CLI araçları (`psql`, `pg_dump`, `pg_isready`)

---

## 2. Sıfırdan Staging Kurulum Adımları (Step-by-Step)

### Adım 1: Depoyu Klonlama ve Bağımlılıkların Kurulması

```bash
git clone <repo-url> isemrial
cd isemrial

# Kök ve frontend bağımlılıkları
pnpm install

# Backend bağımlılıkları
cd backend
pnpm install
cd ..
```

---

### Adım 2: Docker PostgreSQL Servisinin Başlatılması

```bash
# PostgreSQL 16 konteynerini başlat
docker compose up -d postgres

# Konteyner sağlık durumunu doğrula
docker inspect --format='{{.State.Health.Status}}' isemrial_postgres
# Çıktı: healthy
```

*Not:* Host portu `5433:5432` olarak yapılandırılmıştır.

---

### Adım 3: İzole Staging Veritabanının Oluşturulması

Geliştirme veritabanı (`isemrial_dev`) ile staging ortamını izole etmek için ayrı bir veritabanı açılır:

```bash
docker exec isemrial_postgres psql -U postgres -c "CREATE DATABASE isemrial_staging;"
```

---

### Adım 4: Staging Ortam Değişkenlerinin Hazırlanması

Staging için `backend/.env.staging` veya ortam değişkenleri şu değerlerle tanımlanır:

```ini
# Backend Konfigürasyonu
PORT=4000
NODE_ENV=production
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/isemrial_staging?schema=public"
FRONTEND_ORIGIN="http://localhost:3000"
SESSION_SECRET="staging-very-secure-secret-token-random-key-64-bytes-sample"
SESSION_MAX_AGE_DAYS=7
TRUST_PROXY=true

# Frontend Konfigürasyonu (Kök dizin)
INTERNAL_API_URL="http://localhost:4000"
NEXT_PUBLIC_API_URL="http://localhost:4000"
NEXT_PUBLIC_ENABLE_DEMO_LOGIN="false"
```

---

### Adım 5: Prisma Migration'larının Uygulanması

Staging veritabanında kesinlikle `db push` çalıştırılmaz; atomik migrationlar uygulanır:

```bash
cd backend
# Windows:
cmd /c "set DATABASE_URL=postgresql://postgres:postgres@localhost:5433/isemrial_staging?schema=public && .\node_modules\.bin\prisma.cmd migrate deploy"

# Linux / macOS:
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/isemrial_staging?schema=public" ./node_modules/.bin/prisma migrate deploy
cd ..
```

---

### Adım 6: Staging Test Verisinin Yüklenmesi (Opsiyonel / Yalnızca Staging)

Yalnızca UAT ve staging provası için kontrollü demo verisi yüklemek üzere:

```bash
cd backend
# Windows:
cmd /c "set DATABASE_URL=postgresql://postgres:postgres@localhost:5433/isemrial_staging?schema=public && set NODE_ENV=development && pnpm.cmd dlx tsx prisma/seed.ts"

# Linux / macOS:
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/isemrial_staging?schema=public" NODE_ENV=development pnpm dlx tsx prisma/seed.ts
cd ..
```

---

### Adım 7: Servislerin Derlenmesi ve Başlatılması

#### A. Backend Başlatma (Production Modunda)
```bash
cd backend
pnpm run build

# Staging parametreleriyle arka planda başlatma (Windows örnek):
cmd /c "set DATABASE_URL=postgresql://postgres:postgres@localhost:5433/isemrial_staging?schema=public && set NODE_ENV=production && set PORT=4000 && set FRONTEND_ORIGIN=http://localhost:3000 && set SESSION_SECRET=staging-very-secure-secret-token-random-key-64-bytes-sample && set SESSION_MAX_AGE_DAYS=7 && set TRUST_PROXY=true && node dist/src/main.js"
```

#### B. Frontend Başlatma
```bash
# Kök dizinde Next.js derleme ve başlatma
pnpm run build
pnpm run start -p 3000
```

---

## 3. Sağlık Denetimi ve Doğrulama (Healthcheck)

Tüm servisler ayağa kalktıktan sonra Next.js rewrite proxy'si üzerinden sağlık durumu denetlenir:

```bash
curl http://localhost:3000/api/health
```

**Beklenen Yanıt:**
```json
{
  "status": "ok",
  "uptime": 12.5,
  "timestamp": "2026-10-12T17:00:33.827Z",
  "services": {
    "database": "healthy"
  }
}
```

---

## 4. Veritabanı Yedekleme Prosedürü (Backup)

Staging veritabanından veri bütünlüğünü bozmadan anlık yedek alma:

```powershell
# Windows PowerShell
$DATE = Get-Date -Format 'yyyyMMdd_HHmmss'
docker exec isemrial_postgres pg_dump -U postgres -d isemrial_staging > "backup_staging_$DATE.sql"
```

```bash
# Linux / macOS
docker exec isemrial_postgres pg_dump -U postgres -d isemrial_staging > "backup_staging_$(date +%Y%m%d_%H%M%S).sql"
```

---

## 5. Kurtarma ve Geri Yükleme Prosedürü (Restore Rehearsal)

Orijinal staging veritabanını silmeden, yedeğin tam çalıştığını doğrulamak için izole geçici bir veritabanına geri yükleme yapılır:

```bash
# 1. İzole test veritabanı oluştur
docker exec isemrial_postgres psql -U postgres -c "CREATE DATABASE isemrial_restore_test;"

# 2. Yedeği geri yükle
cmd /c "type backup_staging_rehearsal.sql | docker exec -i isemrial_postgres psql -U postgres -d isemrial_restore_test"

# 3. Kayıt sayılarını ve foreign key ilişkilerini doğrula
docker exec isemrial_postgres psql -U postgres -d isemrial_restore_test -c "
SELECT 'users' as tbl, count(*) FROM users
UNION ALL SELECT 'organizations', count(*) FROM organizations
UNION ALL SELECT 'customers', count(*) FROM customers
UNION ALL SELECT 'work_orders', count(*) FROM work_orders
UNION ALL SELECT 'timeline_events', count(*) FROM timeline_events;
"

# 4. Geri Yükleme Sonrası Oturum Güvenliği (Post-Restore Session Invalidation)
# KRİTİK GÜVENLİK ADIMI (Faz 5.2.2):
# Yedekten dönüldüğünde eski/iptal edilmiş oturumların yeniden canlanmasını (Session Resuscitation)
# engellemek için, kurtarılan veritabanı trafiğe açılmadan önce oturumlar geçersiz kılınmalıdır:

cd backend
# Windows:
cmd /c "set DATABASE_URL=postgresql://postgres:postgres@localhost:5433/isemrial_restore_test?schema=public && pnpm.cmd run post-restore:invalidate-sessions --target-db=isemrial_restore_test --confirm-invalidation"

# Linux / macOS:
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/isemrial_restore_test?schema=public" pnpm run post-restore:invalidate-sessions --target-db=isemrial_restore_test --confirm-invalidation
cd ..
```

> [!CAUTION]
> **Güvenlik Kuralı:** Eğer oturum iptal adımı hata verirse (`exit 1`), uygulama kesinlikle dış trafiğe AÇILMAMALIDIR. Operatör hatayı incelemeli ve oturumların sıfırlandığını doğrulamadan DNS / proxy yönlendirmesini açmamalıdır.

---

## 6. Sık Karşılaşılan Sorunlar ve Çözümleri (Troubleshooting)

1. **Port Çakışması (`bind: address already in use: 5433`):**
   Host makinede başka bir servis 5433 portunu kullanıyorsa, `docker-compose.yml` içindeki `POSTGRES_PORT` değişkenini `5434` olarak güncelleyin.
2. **P1001 Veritabanı Bağlantı Hatası:**
   PostgreSQL konteynerinin henüz `healthy` durumuna gelmediğini gösterir. `docker inspect isemrial_postgres` ile konteyner durumunu kontrol edin.
3. **403 Forbidden (CSRF / Origin Hatası):**
   İstemcinin `Origin` başlığı ile backend `FRONTEND_ORIGIN` eşleşmiyordur. İsteklerin izinli alan adından geldiğinden emin olun.
4. **429 Too Many Requests (Rate Limit):**
   Login/register için 10 istek/dk kotası dolmuştur. `Retry-After` süresi kadar (en fazla 60 saniye) bekleyin.
