# Prompt 04 — Güvenli backend MVP

Önce repo mimarisini, `docs/TECHNICAL_PLAN.md` ve gerçek bağımlılık sürümlerini incele. Var olan backend pattern'lerini koru. Bu fazda yalnızca gerekli API, veritabanı ve frontend entegrasyonunu yap; alakasız refactor yapma.

Kapsam:
1. User, Organization/Workshop, Membership/Role, Customer, Device, WorkOrder, StatusHistory, Note ve Attachment modelleri.
2. Migration'lar ve sadece development/test için seed fixtures.
3. Authentication, organization scope ve role/permission kontrolleri.
4. Work order create/read/update/status transition; customer CRUD ve gerekli list/filter/search endpoint'leri.
5. Backend validation, pagination, ortak hata yanıtı ve güvenli loglama.
6. Frontend'de mock veriden API'ye geçiş; loading/error/success state'leri kaybetme.

Güvenlik kuralları:
- Bir kullanıcının URL'deki ID'yi değiştirerek başka organizasyonun müşteri/iş emri verisine erişememesini test et.
- Sadece buton gizlemek authorization değildir; her endpoint server-side kontrol yapmalı.
- Dosya yüklemelerinde boyut, MIME/content, izin ve private erişimi denetle.
- Secret'ları kod içine koyma; `.env.example` yalnızca örnek adlar içersin.
- ORM olarak projede mevcut tek ORM ile devam et; iki ORM'yi birlikte kullanma.
- Gerçek WhatsApp/SMS/e-posta entegrasyonu kurulduğu iddia edilmesin.

Önce schema/API planını ve riskleri yaz, sonra küçük dilimler hâlinde uygula. Migration, typecheck, unit/integration test ve build'i çalıştır. Sonunda test raporunu, açık güvenlik risklerini ve tamamlanmamış entegrasyonları belirt.
