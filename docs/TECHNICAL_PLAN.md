# İşEmriAl — Teknik Plan

## Önerilen başlangıç mimarisi

Projede mevcut yapı varsa önce onu incele ve gereksiz yere değiştirme. Yeni proje ise kullanıcının bildiği ekosistemle uyumlu bir seçenek:

- Frontend: Next.js App Router + TypeScript
- Stil: Tailwind CSS v4
- Component primitives: shadcn/ui (tek başına görsel tasarım değildir; tokenlarla özelleştirilmeli)
- Icons: lucide-react
- Forms: React Hook Form + Zod
- Backend: NestJS
- Database: PostgreSQL
- ORM: TypeORM **veya** Prisma; yalnızca biri
- Auth: güvenli cookie tabanlı oturum/JWT tasarımı; token saklama/yenileme stratejisi tehdit modeline göre seçilmeli
- File uploads: ilk sürümde lokal geliştirme storage abstraction; üretimde private object storage
- Tests: backend unit/integration tests + frontend e2e smoke tests (mevcut araçlara göre)

shadcn/ui bileşen kaynak kodlarını projeye ekler ve özelleştirmeye izin verir; resmi dokümantasyonu Tailwind v4/React 19 desteği ve CSS variable temalarını açıklar: https://ui.shadcn.com/docs/tailwind-v4 ve https://ui.shadcn.com/docs/theming.

## Ana veri modelleri

- User
- Organization/Workshop
- OrganizationMember + role
- Customer
- Device
- WorkOrder
- WorkOrderStatusHistory
- WorkOrderNote
- Attachment
- ServicePart (MVP kapsamına göre yalnızca kullanılan parça kaydı; stok yönetimi değil)

Kurallar:
- Organizasyon verileri organization/workshop ID ile izole edilmeli.
- Her API endpoint'i authentication + organization scope + role/permission kontrolü uygulamalı.
- Kullanıcı istemcisinden gelen organization ID tek başına yetki kanıtı olamaz.
- Durum değişiklikleri audit trail üretmeli.
- Dosya uzantısından çok gerçek içerik türü/size kontrol edilmeli; private dosya erişimi yetkilendirilmeli.

## Aşamalar

### Phase 0 — Repo keşfi ve ürün planı
- Klasör yapısı, paket yöneticisi, sürümler, mevcut test ve lint araçları incelenir.
- Ürün brief'i, ekran envanteri, mimari ve risk listesi oluşturulur.
- Kod yazmaya başlanmaz.

### Phase 1 — Tasarım yönü
- App shell, dashboard, iş emri listesi ve create flow için konsept çıkarılır.
- Renk/font/tokenlar sabitlenir.
- Kullanıcı tasarım yönünü onaylamadan tüm ekranlara yayılmaz.

### Phase 2 — Frontend foundation
- Tokens, typography, buttons, inputs, badges, table, dialogs, empty/loading/error states.
- Mock verilerle çalışan responsive UI.
- Ekran görüntüsü incelemesi ve düzeltme.

### Phase 3 — Core UI flows
- Work-order list, create, detail, customers, dashboard.
- Form validation, filtreler ve tüm önemli etkileşimler.
- Responsive regression kontrolü.

### Phase 4 — API/database
- Schema/migrations, auth, organization scope, CRUD endpoints, validation, error format.
- Seed fixtures yalnızca geliştirme/test ortamında.

### Phase 5 — Integration and security
- UI/API entegrasyonu, permission tests, upload checks, log hygiene, rate limits uygun endpoint'lerde.
- Testlerde organizasyonlar arası data isolation.

### Phase 6 — Visual QA and release readiness
- 1440/1024/390 viewport kontrolleri.
- Empty, loading, error, success, long text ve izin senaryoları.
- Build/lint/test ve kullanım senaryoları.
- Bilinen eksikler raporlanır; çalıştırılmamış testler başarılı diye gösterilmez.

## MVP dışı entegrasyonlar

WhatsApp Business API, SMS sağlayıcıları, ödeme, e-fatura, tedarikçi katalogları gibi entegrasyonları erken aşamada ekleme. Önce kullanıcıların ana akışı günlük kullandığını doğrula.
