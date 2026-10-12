"use client";

import React, { useState } from "react";
import {
  Button,
  Input,
  Textarea,
  Select,
  FormField,
  Badge,
  StatusBadge,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  SearchField,
  FilterChip,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Dialog,
  Alert,
  Toast,
  Skeleton,
  EmptyState,
  ErrorState,
  PageHeader,
  Breadcrumb,
} from "@/components/ui";
import {
  PlusCircle,
  Search,
  Trash2,
  Phone,
  Sparkles,
} from "lucide-react";

export default function DesignSystemClient() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [buttonLoading, setButtonLoading] = useState(false);
  const [searchVal, setSearchVal] = useState("İE-1042");
  const [activeChip, setActiveChip] = useState("all");
  const [inputVal, setInputVal] = useState("0532 987 65 43");
  const [hasInputError, setHasInputError] = useState(false);

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <Toast
          message={toastMessage}
          onClose={() => setToastMessage(null)}
        />
      )}

      {/* Dev Mode Banner */}
      <div className="bg-[#E9F9F0] border border-[#A6F4C5] p-3.5 rounded-xl flex items-center justify-between text-xs text-[#105C38]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#12B76A] animate-pulse" />
          <span className="font-bold">Geliştirici Bileşen Vitrini (/dev/design-system)</span>
          <span className="hidden sm:inline opacity-80">
            — Faz 2 Ortak UI Bileşenleri ve Tasarım Tokenları Kataloğu
          </span>
        </div>
        <span className="text-[11px] font-semibold bg-white/70 px-2 py-0.5 rounded-md border border-[#A6F4C5]">
          İşEmriAl UI v0.2
        </span>
      </div>

      <Breadcrumb
        items={[
          { label: "Geliştirici Araçları", href: "/dev/design-system" },
          { label: "Tasarım Sistemi Vitrini" },
        ]}
        backHref="/dashboard"
        backLabel="Dashboard'a Dön"
      />

      <PageHeader
        title="İşEmriAl Tasarım Sistemi ve Ortak UI Bileşenleri"
        description="Teknik servis iş akışına özel, Bubilet referanslı hafif, enerjik ve WCAG 2.2 AA erişilebilir bileşen kütüphanesi."
        badge={
          <Badge variant="brand" dot size="sm">
            Canlı Vitrin
          </Badge>
        }
        action={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setToastMessage("Örnek toast bildirimi başarıyla tetiklendi!");
              setTimeout(() => setToastMessage(null), 3000);
            }}
          >
            Toast Tetikle
          </Button>
        }
      />

      {/* 1. Renk Tokenları ve WCAG Kontrast Özeti */}
      <Card>
        <CardHeader>
          <CardTitle>1. Tasarım Tokenları & Renk Matrisi (WCAG 2.2 AA Uyumlu)</CardTitle>
          <CardDescription>
            Tüm arayüzde rastgele hex kodları yerine merkezi CSS değişkenleri kullanılmaktadır.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-3 rounded-xl border border-[#E5EBE7] bg-[#F7F9F7] space-y-1">
              <div className="w-full h-8 rounded-lg bg-[#F7F9F7] border border-[#E5EBE7]" />
              <div className="text-xs font-bold text-[#18231F]">Canvas</div>
              <div className="text-[11px] text-[#4E5C55]">#F7F9F7</div>
            </div>

            <div className="p-3 rounded-xl border border-[#E5EBE7] bg-white space-y-1">
              <div className="w-full h-8 rounded-lg bg-white border border-[#E5EBE7]" />
              <div className="text-xs font-bold text-[#18231F]">Surface</div>
              <div className="text-[11px] text-[#4E5C55]">#FFFFFF</div>
            </div>

            <div className="p-3 rounded-xl border border-[#E5EBE7] bg-white space-y-1">
              <div className="w-full h-8 rounded-lg bg-[#157347]" />
              <div className="text-xs font-bold text-[#18231F]">Primary CTA</div>
              <div className="text-[11px] text-[#4E5C55]">#157347 (5.91:1)</div>
            </div>

            <div className="p-3 rounded-xl border border-[#E5EBE7] bg-white space-y-1">
              <div className="w-full h-8 rounded-lg bg-[#20C875]" />
              <div className="text-xs font-bold text-[#18231F]">Brand Accent</div>
              <div className="text-[11px] text-[#4E5C55]">#20C875</div>
            </div>

            <div className="p-3 rounded-xl border border-[#E5EBE7] bg-[#E9F9F0] space-y-1">
              <div className="w-full h-8 rounded-lg bg-[#E9F9F0] border border-[#A6F4C5]" />
              <div className="text-xs font-bold text-[#105C38]">Brand Subtle</div>
              <div className="text-[11px] text-[#4E5C55]">#E9F9F0 (7.02:1)</div>
            </div>

            <div className="p-3 rounded-xl border border-[#E5EBE7] bg-white space-y-1">
              <div className="w-full h-8 rounded-lg bg-[#18231F]" />
              <div className="text-xs font-bold text-[#18231F]">Foreground</div>
              <div className="text-[11px] text-[#4E5C55]">#18231F (16.5:1)</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Butonlar (Button Variants & States) */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>2. Buton Bileşenleri (Button)</CardTitle>
              <CardDescription>
                Primary, secondary, outline, ghost, destructive, brand ve loading halleri.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setButtonLoading(!buttonLoading)}
            >
              Loading Durumunu Değiştir ({buttonLoading ? "Açık" : "Kapalı"})
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="primary"
              isLoading={buttonLoading}
              leftIcon={<PlusCircle className="w-4 h-4" />}
            >
              Yeni İş Emri Aç (Primary)
            </Button>

            <Button variant="secondary">İkincil Eylem (Secondary)</Button>

            <Button variant="outline">Kenarlık (Outline)</Button>

            <Button variant="ghost">Temizle (Ghost)</Button>

            <Button
              variant="destructive"
              leftIcon={<Trash2 className="w-4 h-4" />}
            >
              Kaydı Sil (Destructive)
            </Button>

            <Button variant="brand" leftIcon={<Sparkles className="w-4 h-4" />}>
              Marka Vurgusu (Brand)
            </Button>

            <Button variant="primary" disabled>
              Devre Dışı (Disabled)
            </Button>
          </div>

          <div className="pt-2 border-t border-[#EFF3F0] flex flex-wrap items-center gap-3">
            <span className="text-xs text-[#4E5C55] font-semibold">Boyutlar:</span>
            <Button size="sm">Küçük (sm - 36px)</Button>
            <Button size="md">Standart (md - 44px)</Button>
            <Button size="lg">Büyük (lg - 48px)</Button>
            <Button size="icon" aria-label="İkon buton" variant="secondary">
              <Search className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 3. Form Kontrolleri (Input, Label, Textarea, Select, FormField) */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>3. Form Bileşenleri & Doğrulama</CardTitle>
              <CardDescription>
                Erişilebilir etiketler, ikon slotları, hata durumları ve yardımcı metinler.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setHasInputError(!hasInputError)}
            >
              Hata Durumunu Değiştir ({hasInputError ? "Aktif" : "Kapalı"})
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              id="field-customer"
              label="Müşteri Adı ve Soyadı"
              required
              helperText="Fatura veya fiş üzerindeki tam isim"
            >
              <Input
                id="field-customer"
                placeholder="Örn: Ahmet Yılmaz"
                defaultValue="Ahmet Yılmaz"
              />
            </FormField>

            <FormField
              id="field-phone"
              label="Telefon Numarası"
              required
              error={hasInputError ? "Geçerli bir telefon numarası giriniz." : undefined}
            >
              <Input
                id="field-phone"
                leftIcon={<Phone className="w-4 h-4" />}
                hasError={hasInputError}
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="05XX XXX XX XX"
              />
            </FormField>

            <FormField id="field-device" label="Cihaz Türü" required>
              <Select id="field-device" defaultValue="telefon">
                <option value="telefon">Akıllı Telefon</option>
                <option value="laptop">Dizüstü Bilgisayar</option>
                <option value="tablet">Tablet</option>
                <option value="diger">Diğer Cihaz</option>
              </Select>
            </FormField>

            <FormField
              id="field-disabled"
              label="Atölye Kodu (Devre Dışı)"
              helperText="Sistem tarafından otomatik üretilir"
            >
              <Input id="field-disabled" disabled defaultValue="KDK-2026-01" />
            </FormField>

            <div className="md:col-span-2">
              <FormField
                id="field-issue"
                label="Arıza Şikâyeti ve Talep"
                required
                helperText="Müşterinin belirttiği cihaz problemi"
              >
                <Textarea
                  id="field-issue"
                  placeholder="Cihaz yere düştükten sonra ekran açılmıyor, şarj almıyor..."
                  defaultValue="Ekran kırık, dokunmatik alt kısımda basmıyor."
                />
              </FormField>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4. Durum Rozetleri ve Etiketler (StatusBadge & Badge) */}
      <Card>
        <CardHeader>
          <CardTitle>4. Semantik Durum Rozetleri (StatusBadge & Badge)</CardTitle>
          <CardDescription>
            Tek tip yeşilden kaçınan, operasyonel iş durumlarına özel ayrık renk kodlaması.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="text-xs font-semibold text-[#4E5C55] mb-2">
              İş Emri Durumları (StatusBadge):
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status="hazir" />
              <StatusBadge status="islemde" />
              <StatusBadge status="onay_bekliyor" />
              <StatusBadge status="parca_bekliyor" />
              <StatusBadge status="yeni" />
              <StatusBadge status="teslim_edildi" />
            </div>
          </div>

          <div className="pt-3 border-t border-[#EFF3F0]">
            <div className="text-xs font-semibold text-[#4E5C55] mb-2">
              Genel Amaçlı Semantik Rozetler (Badge):
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="brand" dot>
                Marka Vurgusu
              </Badge>
              <Badge variant="success" dot>
                İşlem Tamam
              </Badge>
              <Badge variant="info" dot>
                Serviste
              </Badge>
              <Badge variant="warning" dot>
                Beklemede
              </Badge>
              <Badge variant="danger" dot>
                Kritik
              </Badge>
              <Badge variant="neutral">Nötr Etiket</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 5. Arama & Filtreleme (SearchField & FilterChip) */}
      <Card>
        <CardHeader>
          <CardTitle>5. Operasyonel Arama & Filtre Çipleri</CardTitle>
          <CardDescription>
            Dashboard ve İş Emirleri listesinde kullanıcıyı doğrudan işe yönlendiren keşif araçları.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <SearchField
            value={searchVal}
            onChange={setSearchVal}
            placeholder="İş emri no, müşteri adı veya cihaz ara..."
          />

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <FilterChip
              label="Tüm İşler"
              count={18}
              active={activeChip === "all"}
              onClick={() => setActiveChip("all")}
            />
            <FilterChip
              label="Tamirde"
              count={7}
              active={activeChip === "islemde"}
              onClick={() => setActiveChip("islemde")}
            />
            <FilterChip
              label="Onay Bekleyen"
              count={3}
              active={activeChip === "onay"}
              onClick={() => setActiveChip("onay")}
            />
            <FilterChip
              label="Parça Bekleyen"
              count={2}
              active={activeChip === "parca"}
              onClick={() => setActiveChip("parca")}
            />
            <FilterChip
              label="Teslime Hazır"
              count={6}
              active={activeChip === "hazir"}
              onClick={() => setActiveChip("hazir")}
            />
          </div>
        </CardContent>
      </Card>

      {/* 6. Tablo Bileşeni (Table) */}
      <Card>
        <CardHeader>
          <CardTitle>6. Veri Tablosu (Table)</CardTitle>
          <CardDescription>
            Masaüstü yoğunluğu sağlarken satır odak ve hover durumlarına saygılı tablo yapısı.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>İş Emri No</TableHead>
                <TableHead>Müşteri</TableHead>
                <TableHead>Cihaz Modeli</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="text-right">Fiyat</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-bold text-[#157347]">İE-1042</TableCell>
                <TableCell>Ahmet Yılmaz</TableCell>
                <TableCell>iPhone 13 Pro (128GB)</TableCell>
                <TableCell>
                  <StatusBadge status="hazir" size="sm" />
                </TableCell>
                <TableCell className="text-right font-semibold">₺3.250</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-bold text-[#157347]">İE-1041</TableCell>
                <TableCell>Zeynep Kaya</TableCell>
                <TableCell>MacBook Air M1</TableCell>
                <TableCell>
                  <StatusBadge status="islemde" size="sm" />
                </TableCell>
                <TableCell className="text-right font-semibold">₺4.800</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-bold text-[#157347]">İE-1040</TableCell>
                <TableCell>Can Demir</TableCell>
                <TableCell>Samsung Galaxy S22</TableCell>
                <TableCell>
                  <StatusBadge status="parca_bekliyor" size="sm" />
                </TableCell>
                <TableCell className="text-right font-semibold">₺2.100</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 7. Dialog / Modal & Geri Bildirim */}
      <Card>
        <CardHeader>
          <CardTitle>7. Modal Pencere & Geri Bildirim (Dialog & Alert)</CardTitle>
          <CardDescription>
            Erişilebilir odak yönetimi, ESC tuşu desteği ve durum bildirim kutuları.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsDialogOpen(true)}
            >
              Örnek İş Emri Detay Modalı Aç (ESC Destekli)
            </Button>
          </div>

          <div className="space-y-2.5 pt-2">
            <Alert variant="info" title="Bilgilendirme">
              Cihaz tesliminde müşteri kimlik veya teslim fişini kontrol ediniz.
            </Alert>
            <Alert variant="success" title="Başarılı">
              İş emri durumu başarıyla güncellendi ve müşteriye taslak hazırlandı.
            </Alert>
            <Alert variant="warning" title="Parça Bekleniyor">
              Tedarikçi firma ekran stoğunu yarın saat 11:00'de sevk edecektir.
            </Alert>
            <Alert variant="danger" title="Doğrulama Uyarısı">
              Lütfen formu kaydetmeden önce zorunlu müşteri bilgilerini tamamlayınız.
            </Alert>
          </div>
        </CardContent>
      </Card>

      {/* 8. Yüklenme, Boş ve Hata Durumları (Skeleton, EmptyState, ErrorState) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Yükleniyor (Skeleton)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-9 w-1/2" />
          </CardContent>
        </Card>

        <EmptyState
          title="Sonuç Bulunamadı"
          description="Arama kriterlerinize uygun iş emri kaydı bulunamadı."
          action={
            <Button variant="outline" size="sm">
              Filtreleri Temizle
            </Button>
          }
        />

        <ErrorState
          title="Bağlantı Hatası"
          message="Veriler yüklenirken geçici bir sorun oluştu."
          onRetry={() => {
            setToastMessage("Yeniden deneme isteği gönderildi.");
            setTimeout(() => setToastMessage(null), 3000);
          }}
        />
      </div>

      {/* Modal Instance */}
      <Dialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title="İş Emri Detayı: İE-1042"
        description="Müşteri ve cihaz operasyonel bilgi kartı"
        size="md"
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsDialogOpen(false)}
            >
              Kapat (ESC)
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setIsDialogOpen(false);
                setToastMessage("Değişiklikler kaydedildi.");
                setTimeout(() => setToastMessage(null), 3000);
              }}
            >
              Kaydet
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-xs text-[#18231F]">
          <div className="p-3 bg-[#F7F9F7] rounded-xl border border-[#E5EBE7] flex justify-between">
            <span className="text-[#4E5C55]">Cihaz:</span>
            <span className="font-bold">iPhone 13 Pro (128GB)</span>
          </div>
          <div className="p-3 bg-[#F7F9F7] rounded-xl border border-[#E5EBE7] flex justify-between">
            <span className="text-[#4E5C55]">Müşteri:</span>
            <span className="font-bold">Ahmet Yılmaz (0532 987 65 43)</span>
          </div>
          <div className="p-3 bg-[#F7F9F7] rounded-xl border border-[#E5EBE7] flex justify-between">
            <span className="text-[#4E5C55]">Durum:</span>
            <StatusBadge status="hazir" size="sm" />
          </div>
          <p className="text-[#4E5C55] text-[11px] leading-relaxed">
            Bu modal klavye odağını içine hapseder (focus trap), Escape tuşuna basıldığında
            veya dışarıya tıklandığında güvenli şekilde kapanır.
          </p>
        </div>
      </Dialog>
    </div>
  );
}
