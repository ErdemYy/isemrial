"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useServiceData } from "@/context/ServiceDataContext";
import {
  MOCK_TECHNICIANS,
  PRIORITY_MAP,
  type WorkOrderPriority,
  type WorkOrderItem,
} from "@/mocks/service-data";
import {
  Button,
  Input,
  Textarea,
  Select,
  FormField,
  Card,
  PageHeader,
  Breadcrumb,
  Alert,
} from "@/components/ui";
import {
  Smartphone,
  Laptop,
  Tablet,
  HelpCircle,
  User,
  Wrench,
  CheckCircle2,
  FileCheck,
  ArrowRight,
} from "lucide-react";

function NewWorkOrderForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { createWorkOrder } = useServiceData();

  const initialName = searchParams?.get("name") || "";
  const initialPhone = searchParams?.get("phone") || "";

  // Form State
  const [customerName, setCustomerName] = useState(initialName);
  const [customerPhone, setCustomerPhone] = useState(initialPhone);
  const [customerEmail, setCustomerEmail] = useState("");
  const [deviceType, setDeviceType] = useState<"Telefon" | "Bilgisayar" | "Tablet" | "Diğer">("Telefon");
  const [deviceModel, setDeviceModel] = useState("");
  const [deviceSerial, setDeviceSerial] = useState("");
  const [screenPasscode, setScreenPasscode] = useState("");
  const [issueSummary, setIssueSummary] = useState("");
  const [physicalCondition, setPhysicalCondition] = useState("");
  const [priority, setPriority] = useState<WorkOrderPriority>("normal");
  const [technicianName, setTechnicianName] = useState(MOCK_TECHNICIANS[0].name);
  const [estimatedPrice, setEstimatedPrice] = useState("");
  const [paidAdvance, setPaidAdvance] = useState("");
  const [estimatedDelivery, setEstimatedDelivery] = useState("Bugün 18:00");

  // Validation & Submission
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<WorkOrderItem | null>(null);

  // Quick Customer Autofill
  const handleAutofillCustomer = (name: string, phone: string) => {
    setCustomerName(name);
    setCustomerPhone(phone);
    setErrors((prev) => ({ ...prev, customerName: "", customerPhone: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!customerName.trim()) {
      newErrors.customerName = "Müşteri adı ve soyadı zorunludur.";
    }
    if (!customerPhone.trim() || customerPhone.replace(/[^0-9]/g, "").length < 10) {
      newErrors.customerPhone = "En az 10 haneli geçerli bir telefon numarası giriniz.";
    }
    if (!deviceModel.trim()) {
      newErrors.deviceModel = "Cihaz marka ve model bilgisi zorunludur.";
    }
    if (!issueSummary.trim()) {
      newErrors.issueSummary = "Müşterinin arıza şikâyeti zorunludur.";
    }

    const priceNum = estimatedPrice === "" ? 0 : Number(estimatedPrice);
    if (isNaN(priceNum) || priceNum < 0) {
      newErrors.estimatedPrice = "Geçerli bir tutar giriniz.";
    }

    const advanceNum = paidAdvance === "" ? 0 : Number(paidAdvance);
    if (isNaN(advanceNum) || advanceNum < 0) {
      newErrors.paidAdvance = "Geçerli bir avans tutarı giriniz.";
    } else if (advanceNum > priceNum && priceNum > 0) {
      newErrors.paidAdvance = "Avans toplam tahmini tutardan büyük olamaz.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const order = await createWorkOrder({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim() || undefined,
        deviceType,
        deviceModel: deviceModel.trim(),
        deviceSerial: deviceSerial.trim() || undefined,
        screenPasscode: screenPasscode.trim() || undefined,
        issueSummary: issueSummary.trim(),
        physicalCondition: physicalCondition.trim() || undefined,
        priority,
        technicianName,
        estimatedCompletion: estimatedDelivery.trim() || "Bugün 18:00",
        estimatedPrice: priceNum,
        paidAmount: advanceNum,
      });

      setCreatedOrder(order);
    } catch (err: any) {
      setErrors({ form: err?.message || "İş emri oluşturulurken bir hata oluştu." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Top Breadcrumb and Header */}
      <Breadcrumb
        items={[
          { label: "İş Emirleri", href: "/work-orders" },
          { label: "Yeni İş Emri Aç" },
        ]}
        backHref="/work-orders"
        backLabel="İş Emirlerine Geri Dön"
      />

      <PageHeader
        title="Yeni İş Emri Aç"
        description="Cihaz kabulü, arıza tespiti ve teslimat planlaması."
        badge={
          <div className="flex items-center gap-1.5 text-xs text-[#4E5C55] bg-white px-2.5 py-1 rounded-lg border border-[#E5EBE7]">
            <span className="w-2 h-2 rounded-full bg-[#12B76A] animate-pulse" />
            <span className="font-semibold">Kayıt No: Otomatik Üretilir</span>
          </div>
        }
      />

      {/* Validation Summary Alert if Errors Exist */}
      {Object.keys(errors).length > 0 && (
        <Alert variant="danger" title="Eksik veya Hatalı Alanlar Var">
          Lütfen formda kırmızı ile işaretlenen zorunlu alanları kontrol ediniz.
        </Alert>
      )}

      {/* Success Modal / Banner */}
      {createdOrder ? (
        <Card className="p-6 md:p-8 text-center space-y-4 max-w-lg mx-auto my-8 border-[#A6F4C5] shadow-sm">
          <div className="w-12 h-12 rounded-full bg-[#E6F7EE] text-[#087443] flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6 text-[#12B76A]" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#18231F]">
              İş Emri Başarıyla Oluşturuldu!
            </h2>
            <p className="text-xs text-[#4E5C55] mt-1">
              <span className="font-bold text-[#157347] font-mono text-sm">
                {createdOrder.orderNumber}
              </span>{" "}
              numaralı servis fişi sisteme kaydedildi.
            </p>
          </div>

          <div className="bg-[#F7F9F7] p-3.5 rounded-xl text-xs text-left space-y-1.5 border border-[#E5EBE7]">
            <div className="flex justify-between">
              <span className="text-[#4E5C55] font-semibold">Müşteri:</span>
              <span className="font-bold text-[#18231F]">{createdOrder.customerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#4E5C55] font-semibold">Cihaz:</span>
              <span className="font-bold text-[#18231F]">{createdOrder.deviceModel}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#4E5C55] font-semibold">Tahmini Tutar:</span>
              <span className="font-bold text-[#18231F]">
                {createdOrder.estimatedPrice.toLocaleString("tr-TR")} ₺
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#4E5C55] font-semibold">Tahmini Teslim:</span>
              <span className="font-bold text-[#B42318]">{createdOrder.estimatedCompletion}</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <Button
              variant="primary"
              size="md"
              onClick={() => router.push(`/work-orders/${createdOrder.id}`)}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              İş Emri Detayına Git
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={() => {
                setCreatedOrder(null);
                setCustomerName("");
                setCustomerPhone("");
                setDeviceModel("");
                setIssueSummary("");
                setPhysicalCondition("");
                setEstimatedPrice("");
                setPaidAdvance("");
              }}
            >
              Yeni Bir Kayıt Daha Aç
            </Button>
          </div>
        </Card>
      ) : (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Form Sections (8 Cols) */}
          <div className="lg:col-span-8 space-y-4">
            {/* 1. Müşteri Bilgileri */}
            <Card className="p-4 md:p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#E5EBE7]">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-[#157347]" />
                  <h2 className="text-sm font-bold text-[#18231F]">
                    1. Müşteri İletişim Bilgileri
                  </h2>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-[#4E5C55]">
                  <span>Hızlı doldur:</span>
                  <button
                    type="button"
                    onClick={() => handleAutofillCustomer("Kadir Demir", "0 (532) 111 22 33")}
                    className="text-[#157347] font-bold hover:underline focus-visible:outline-none"
                  >
                    Kadir D.
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => handleAutofillCustomer("Selin Vural", "0 (544) 998 77 66")}
                    className="text-[#157347] font-bold hover:underline focus-visible:outline-none"
                  >
                    Selin V.
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <FormField
                  id="customerName"
                  label="Müşteri Adı ve Soyadı"
                  required
                  error={errors.customerName}
                >
                  <Input
                    id="customerName"
                    value={customerName}
                    hasError={Boolean(errors.customerName)}
                    onChange={(e) => {
                      setCustomerName(e.target.value);
                      if (errors.customerName) setErrors((prev) => ({ ...prev, customerName: "" }));
                    }}
                    placeholder="Örn: Ahmet Yılmaz"
                  />
                </FormField>

                <FormField
                  id="customerPhone"
                  label="Telefon Numarası (WhatsApp için)"
                  required
                  error={errors.customerPhone}
                >
                  <Input
                    id="customerPhone"
                    type="tel"
                    value={customerPhone}
                    hasError={Boolean(errors.customerPhone)}
                    onChange={(e) => {
                      setCustomerPhone(e.target.value);
                      if (errors.customerPhone) setErrors((prev) => ({ ...prev, customerPhone: "" }));
                    }}
                    placeholder="Örn: 0 (532) 555 44 33"
                  />
                </FormField>
              </div>
            </Card>

            {/* 2. Cihaz Bilgileri */}
            <Card className="p-4 md:p-5 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-[#E5EBE7]">
                <Smartphone className="w-4 h-4 text-[#157347]" />
                <h2 className="text-sm font-bold text-[#18231F]">
                  2. Cihaz Türü ve Tanımı
                </h2>
              </div>

              {/* Device Category Quick Selector */}
              <div>
                <span className="block text-xs font-bold text-[#18231F] mb-1.5">
                  Cihaz Kategorisi
                </span>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { type: "Telefon", icon: Smartphone },
                    { type: "Bilgisayar", icon: Laptop },
                    { type: "Tablet", icon: Tablet },
                    { type: "Diğer", icon: HelpCircle },
                  ].map((item) => {
                    const Icon = item.icon;
                    const isSelected = deviceType === item.type;
                    return (
                      <button
                        key={item.type}
                        type="button"
                        onClick={() => setDeviceType(item.type as any)}
                        className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#157347] ${
                          isSelected
                            ? "bg-[#E9F9F0] border-[#157347] text-[#105C38] ring-1 ring-[#157347] shadow-2xs"
                            : "bg-[#F7F9F7] border-[#E5EBE7] text-[#344054] hover:bg-white"
                        }`}
                      >
                        <Icon className="w-4 h-4 mb-1" />
                        <span>{item.type}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="sm:col-span-2">
                  <FormField
                    id="deviceModel"
                    label="Marka ve Model"
                    required
                    error={errors.deviceModel}
                  >
                    <Input
                      id="deviceModel"
                      value={deviceModel}
                      hasError={Boolean(errors.deviceModel)}
                      onChange={(e) => {
                        setDeviceModel(e.target.value);
                        if (errors.deviceModel) setErrors((prev) => ({ ...prev, deviceModel: "" }));
                      }}
                      placeholder="Örn: iPhone 14 Pro 128GB veya Dell XPS 15"
                    />
                  </FormField>
                </div>

                <div>
                  <FormField id="deviceSerial" label="Seri No / IMEI">
                    <Input
                      id="deviceSerial"
                      value={deviceSerial}
                      onChange={(e) => setDeviceSerial(e.target.value)}
                      placeholder="Opsiyonel"
                    />
                  </FormField>
                </div>
              </div>

              <FormField
                id="screenPasscode"
                label="Ekran Kilidi / Pin / Desen (Testler için)"
                helperText="Müşteri onayıyla donanım testleri için alınır"
              >
                <Input
                  id="screenPasscode"
                  value={screenPasscode}
                  onChange={(e) => setScreenPasscode(e.target.value)}
                  placeholder="Örn: 1234 veya L Çizimi"
                />
              </FormField>
            </Card>

            {/* 3. Arıza ve Fiziksel Durum */}
            <Card className="p-4 md:p-5 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-[#E5EBE7]">
                <Wrench className="w-4 h-4 text-[#157347]" />
                <h2 className="text-sm font-bold text-[#18231F]">
                  3. Arıza Şikayeti ve Teslim Alma Durumu
                </h2>
              </div>

              <FormField
                id="issueSummary"
                label="Müşteri Arıza Şikayeti"
                required
                error={errors.issueSummary}
              >
                <Textarea
                  id="issueSummary"
                  rows={2}
                  value={issueSummary}
                  hasError={Boolean(errors.issueSummary)}
                  onChange={(e) => {
                    setIssueSummary(e.target.value);
                    if (errors.issueSummary) setErrors((prev) => ({ ...prev, issueSummary: "" }));
                  }}
                  placeholder="Örn: Cihaz açılmıyor, şarja takınca kırmızı ışık yanıp sönüyor..."
                />
              </FormField>

              <FormField
                id="physicalCondition"
                label="Teslim Alınırken Fiziksel Kusur / Kasa Durumu"
                helperText="İleride yaşanabilecek müşteri itirazlarını önlemek için mevcut hasarları kaydedin."
              >
                <Textarea
                  id="physicalCondition"
                  rows={2}
                  value={physicalCondition}
                  onChange={(e) => setPhysicalCondition(e.target.value)}
                  placeholder="Örn: Ekran sağ üstten çatlak, arka kapakta derin çizikler var, SIM çekmecesi mevcut..."
                />
              </FormField>
            </Card>
          </div>

          {/* Right Summary Card */}
          <div className="lg:col-span-4 space-y-4">
            <Card className="p-4 md:p-5 shadow-2xs space-y-4 sticky top-20">
              <h3 className="text-xs font-bold text-[#18231F] pb-2 border-b border-[#E5EBE7]">
                Servis Planı ve Öncelik
              </h3>

              {/* Priority Select with Semantic Colors */}
              <div>
                <span className="block text-xs font-bold text-[#18231F] mb-1.5">
                  İşlem Önceliği
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  {(["normal", "yuksek", "acil"] as WorkOrderPriority[]).map((p) => {
                    const isSelected = priority === p;
                    const meta = PRIORITY_MAP[p];
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPriority(p)}
                        className={`py-2 px-2 rounded-xl text-xs font-bold border text-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#157347] ${
                          isSelected
                            ? "border-[#157347] bg-[#E9F9F0] text-[#105C38] shadow-2xs"
                            : "border-[#E5EBE7] bg-white text-[#344054] hover:bg-[#F7F9F7]"
                        }`}
                      >
                        {meta.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Technician Assignment */}
              <FormField id="technicianName" label="Atanan Teknisyen">
                <Select
                  id="technicianName"
                  value={technicianName}
                  onChange={(e) => setTechnicianName(e.target.value)}
                >
                  {MOCK_TECHNICIANS.map((tech) => (
                    <option key={tech.id} value={tech.name}>
                      {tech.name} ({tech.role.split(" ")[0]})
                    </option>
                  ))}
                </Select>
              </FormField>

              {/* Estimated Delivery */}
              <FormField id="estimatedDelivery" label="Tahmini Teslim Zamanı">
                <Input
                  id="estimatedDelivery"
                  value={estimatedDelivery}
                  onChange={(e) => setEstimatedDelivery(e.target.value)}
                  placeholder="Örn: Bugün 18:00 veya 12 Eki 2026"
                />
              </FormField>

              {/* Estimated Price & Advance */}
              <div className="grid grid-cols-2 gap-2">
                <FormField
                  id="estimatedPrice"
                  label="Tahmini Tutar (₺)"
                  error={errors.estimatedPrice}
                >
                  <Input
                    id="estimatedPrice"
                    type="number"
                    min="0"
                    hasError={Boolean(errors.estimatedPrice)}
                    value={estimatedPrice}
                    onChange={(e) => {
                      setEstimatedPrice(e.target.value);
                      if (errors.estimatedPrice) setErrors((prev) => ({ ...prev, estimatedPrice: "" }));
                    }}
                    placeholder="0"
                  />
                </FormField>
                <FormField
                  id="paidAdvance"
                  label="Alınan Avans (₺)"
                  error={errors.paidAdvance}
                >
                  <Input
                    id="paidAdvance"
                    type="number"
                    min="0"
                    hasError={Boolean(errors.paidAdvance)}
                    value={paidAdvance}
                    onChange={(e) => {
                      setPaidAdvance(e.target.value);
                      if (errors.paidAdvance) setErrors((prev) => ({ ...prev, paidAdvance: "" }));
                    }}
                    placeholder="0"
                  />
                </FormField>
              </div>

              {/* Primary Submit Button */}
              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={isSubmitting}
                  leftIcon={<FileCheck className="w-4 h-4" />}
                  className="w-full"
                >
                  İş Emrini Kaydet ve Fiş Oluştur
                </Button>
              </div>
            </Card>
          </div>
        </form>
      )}
    </div>
  );
}

export default function NewWorkOrderPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-[#4E5C55]">Form yükleniyor...</div>}>
      <NewWorkOrderForm />
    </Suspense>
  );
}
