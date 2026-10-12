"use client";

import React, { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useServiceData } from "@/context/ServiceDataContext";
import {
  STATUS_MAP,
  PRIORITY_MAP,
  type WorkOrderStatus,
} from "@/mocks/service-data";
import {
  Button,
  StatusBadge,
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Textarea,
  Toast,
  Breadcrumb,
  EmptyState,
} from "@/components/ui";
import {
  ArrowLeft,
  Clock,
  User,
  Phone,
  Smartphone,
  Laptop,
  Tablet,
  HelpCircle,
  Wrench,
  CheckCircle2,
  MessageSquare,
  ExternalLink,
  Printer,
  Plus,
  FileText,
  AlertCircle,
  Shield,
  CreditCard,
  History,
} from "lucide-react";

export default function WorkOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { getWorkOrder, updateWorkOrderStatus, addWorkOrderNote, getCustomer } = useServiceData();

  const [newNote, setNewNote] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [selectedNewStatus, setSelectedNewStatus] = useState<WorkOrderStatus | "">("");
  const [statusChangeNote, setStatusChangeNote] = useState("");

  const decodedId = React.useMemo(() => {
    try {
      return decodeURIComponent(id);
    } catch {
      return id;
    }
  }, [id]);

  const order = getWorkOrder(id) || getWorkOrder(decodedId);
  const customer = order ? getCustomer(order.customerId) : undefined;

  // Not Found View
  if (!order) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 space-y-4">
        <Breadcrumb
          items={[
            { label: "İş Emirleri", href: "/work-orders" },
            { label: "Kayıt Bulunamadı" },
          ]}
          backHref="/work-orders"
          backLabel="İş Emirlerine Geri Dön"
        />
        <EmptyState
          icon={<FileText className="w-8 h-8 text-[#B42318]" />}
          title="İş Emri Bulunamadı"
          description={`"${id}" kimliğine veya numarasına sahip bir iş emri kaydı bulunamadı. Yanlış bir bağlantı girmiş veya kayıt silinmiş olabilir.`}
          action={
            <Button
              variant="primary"
              size="md"
              onClick={() => router.push("/work-orders")}
            >
              Tüm İş Emirlerini Görüntüle
            </Button>
          }
        />
      </div>
    );
  }

  const priorityMeta = PRIORITY_MAP[order.priority];
  const remainingBalance = Math.max(0, order.estimatedPrice - order.paidAmount);

  const deviceIcons = {
    Telefon: Smartphone,
    Bilgisayar: Laptop,
    Tablet: Tablet,
    Diğer: HelpCircle,
  };
  const DeviceIcon = deviceIcons[order.deviceType] || Smartphone;

  // Handle Note Submission
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    try {
      await addWorkOrderNote(order.id, newNote.trim(), "Murat Usta");
      setNewNote("");
      setToastMessage("Servis notu başarıyla eklendi.");
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err: any) {
      setToastMessage(err?.message || "Not eklenemedi.");
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  // Handle Status Update
  const handleConfirmStatusChange = async (status: WorkOrderStatus) => {
    try {
      await updateWorkOrderStatus(order.id, status, statusChangeNote.trim() || undefined, "Murat Usta");
      setIsChangingStatus(false);
      setSelectedNewStatus("");
      setStatusChangeNote("");
      setToastMessage(`İş emri durumu "${STATUS_MAP[status].label}" olarak güncellendi.`);
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err: any) {
      setToastMessage(err?.message || "Durum güncellenemedi.");
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
      )}

      {/* Breadcrumb Navigation */}
      <Breadcrumb
        items={[
          { label: "İş Emirleri", href: "/work-orders" },
          { label: order.orderNumber },
        ]}
        backHref="/work-orders"
        backLabel="İş Emirlerine Geri Dön"
      />

      {/* Main Order Header Banner */}
      <div className="bg-white border border-[#E5EBE7] rounded-2xl p-4 md:p-6 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#EFF3F0]">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-mono text-lg md:text-xl font-bold text-[#157347]">
                {order.orderNumber}
              </span>
              <StatusBadge status={order.status} size="md" />
              <span
                className="text-xs px-2.5 py-0.5 rounded-full font-bold inline-block"
                style={{ color: priorityMeta.color, backgroundColor: priorityMeta.bg }}
              >
                {priorityMeta.label} Öncelik
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-[#18231F] tracking-tight">
              {order.deviceModel}
            </h1>
            <p className="text-xs text-[#4E5C55]">
              Kayıt Tarihi: <strong className="text-[#18231F]">{order.createdAt}</strong> • Sorumlu:{" "}
              <strong className="text-[#18231F]">{order.technicianName}</strong>
            </p>
          </div>

          {/* Quick Action CTAs */}
          <div className="flex items-center gap-2 flex-wrap">
            <a
              href={`https://wa.me/90${order.customerPhone.replace(/[^0-9]/g, "").slice(-10)}?text=${encodeURIComponent(
                `Sayın ${order.customerName}, ${order.orderNumber} numaralı ${order.deviceModel} cihazınızın servis durumu: "${STATUS_MAP[order.status].label}". Bilgi almak için bu mesaja dönüş yapabilirsiniz. (Usta Teknik Servis)`
              )}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-[#157347] text-[#105C38] bg-[#E9F9F0] hover:bg-[#d5f5e2] text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#157347]"
            >
              <MessageSquare className="w-4 h-4 text-[#157347]" />
              <span>WhatsApp Bilgilendir</span>
              <ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
            </a>

            <Button
              variant="secondary"
              size="md"
              leftIcon={<Printer className="w-4 h-4" />}
              onClick={() => {
                setToastMessage("Servis teslim fişi yazıcı kuyruğuna gönderildi (Demo).");
                setTimeout(() => setToastMessage(null), 3000);
              }}
            >
              Fiş Yazdır
            </Button>
          </div>
        </div>

        {/* Quick Status Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-1.5 text-xs text-[#4E5C55] font-semibold">
            <span>Durumu Güncelle:</span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {(
              [
                "incelemede",
                "onay_bekliyor",
                "islemde",
                "parca_bekliyor",
                "hazir",
                "teslim_edildi",
              ] as WorkOrderStatus[]
            ).map((st) => {
              const isCurrent = order.status === st;
              const meta = STATUS_MAP[st];
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => handleConfirmStatusChange(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#157347] ${
                    isCurrent
                      ? "bg-[#157347] text-white border-[#157347] shadow-xs cursor-default font-bold"
                      : "bg-[#F7F9F7] hover:bg-white text-[#344054] border-[#E5EBE7] hover:border-[#D5DFD8]"
                  }`}
                >
                  {isCurrent && "✓ "}
                  {meta.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Two-Column Operational Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Device Info, Complaint, Notes, Timeline (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Cihaz ve Arıza Detayı */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-[#157347]" />
                <CardTitle>Cihaz & Arıza Tespiti</CardTitle>
              </div>
              <Badge variant="neutral" size="sm">
                {order.deviceType}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-[#F7F9F7] border border-[#E5EBE7] space-y-1">
                  <span className="text-[#4E5C55] font-semibold block">Cihaz Modeli:</span>
                  <span className="font-bold text-sm text-[#18231F] block">
                    {order.deviceModel}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[#F7F9F7] border border-[#E5EBE7] space-y-1">
                  <span className="text-[#4E5C55] font-semibold block">Seri No / IMEI:</span>
                  <span className="font-mono font-bold text-sm text-[#18231F] block">
                    {order.deviceSerial}
                  </span>
                </div>
              </div>

              {order.screenPasscode && (
                <div className="p-3 rounded-xl bg-[#FFFAEB] border border-[#FEDF89] text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-[#8C3B00]" />
                    <span className="font-semibold text-[#8C3B00]">Ekran Kilidi / Pin:</span>
                  </div>
                  <span className="font-mono font-bold text-[#8C3B00] bg-white/70 px-2.5 py-0.5 rounded-md border border-[#FEDF89]">
                    {order.screenPasscode}
                  </span>
                </div>
              )}

              <div className="space-y-1 text-xs">
                <span className="text-[#4E5C55] font-semibold block">Müşteri Arıza Şikâyeti:</span>
                <div className="p-3.5 rounded-xl border border-[#E5EBE7] bg-white text-[#18231F] font-medium leading-relaxed">
                  {order.issueSummary}
                </div>
              </div>

              <div className="space-y-1 text-xs">
                <span className="text-[#4E5C55] font-semibold block">
                  Teslim Alınırken Kasa & Fiziksel Durum:
                </span>
                <div className="p-3.5 rounded-xl border border-[#E5EBE7] bg-[#F7F9F7] text-[#344054] leading-relaxed">
                  {order.physicalCondition}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Servis Notları (Teknisyen Notları) */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#157347]" />
                <CardTitle>Servis & Tamir Notları ({order.notes.length})</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Not Ekleme Formu */}
              <form onSubmit={handleAddNote} className="space-y-2">
                <Textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Yapılan işlem, parça bilgisi veya test sonucu ekleyiniz..."
                  rows={2}
                />
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={!newNote.trim()}
                    leftIcon={<Plus className="w-3.5 h-3.5" />}
                  >
                    Not Ekle
                  </Button>
                </div>
              </form>

              {/* Notlar Listesi */}
              {order.notes.length === 0 ? (
                <p className="text-xs text-[#4E5C55] text-center py-4 bg-[#F7F9F7] rounded-xl border border-[#E5EBE7]">
                  Henüz servis notu eklenmemiş.
                </p>
              ) : (
                <div className="space-y-2.5 pt-2 border-t border-[#EFF3F0]">
                  {order.notes.map((note) => (
                    <div
                      key={note.id}
                      className="p-3.5 rounded-xl border border-[#E5EBE7] bg-[#F7F9F7] space-y-1 text-xs"
                    >
                      <div className="flex items-center justify-between text-[11px] text-[#4E5C55]">
                        <span className="font-bold text-[#18231F]">{note.author}</span>
                        <span>{note.createdAt}</span>
                      </div>
                      <p className="text-[#18231F] leading-relaxed whitespace-pre-wrap">
                        {note.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Kronolojik İşlem Geçmişi (Timeline) */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-[#157347]" />
                <CardTitle>Kronolojik İşlem Geçmişi</CardTitle>
              </div>
              <CardDescription>
                İş emri üzerindeki tüm durum değişiklikleri ve olay kayıtları.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E5EBE7]">
                {order.timeline.map((event) => (
                  <div key={event.id} className="relative text-xs space-y-1">
                    <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-[#157347] ring-4 ring-white" />
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#18231F]">{event.title}</span>
                      <span className="text-[11px] text-[#4E5C55]">{event.timestamp}</span>
                    </div>
                    {event.description && (
                      <p className="text-[#344054] leading-relaxed">{event.description}</p>
                    )}
                    <span className="text-[10px] text-[#4E5C55] font-semibold block">
                      İşlemi Yapan: {event.actor}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Customer Info & Financial Summary (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Müşteri İletişim Kartı */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-[#157347]" />
                <CardTitle>Müşteri Bilgileri</CardTitle>
              </div>
              {customer && (
                <Link
                  href={`/customers/${customer.id}`}
                  className="text-xs font-bold text-[#157347] hover:underline"
                >
                  Profili Gör
                </Link>
              )}
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div>
                <span className="text-[#4E5C55] font-semibold block">Müşteri:</span>
                <span className="font-bold text-sm text-[#18231F] block mt-0.5">
                  {order.customerName}
                </span>
              </div>

              <div>
                <span className="text-[#4E5C55] font-semibold block">Telefon:</span>
                <a
                  href={`tel:${order.customerPhone}`}
                  className="font-bold text-[#157347] flex items-center gap-1.5 mt-0.5 hover:underline"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>{order.customerPhone}</span>
                </a>
              </div>

              {customer?.email && (
                <div>
                  <span className="text-[#4E5C55] font-semibold block">E-posta:</span>
                  <span className="text-[#18231F] font-medium block mt-0.5">
                    {customer.email}
                  </span>
                </div>
              )}

              {customer?.notes && (
                <div className="p-2.5 rounded-xl bg-[#F7F9F7] border border-[#E5EBE7] text-[11px] text-[#4E5C55]">
                  <span className="font-bold text-[#18231F] block mb-0.5">Müşteri Notu:</span>
                  {customer.notes}
                </div>
              )}

              <div className="pt-2 border-t border-[#EFF3F0]">
                <Link
                  href={`/customers/${order.customerId}`}
                  className="inline-flex items-center justify-center w-full py-2 px-3 rounded-xl border border-[#E5EBE7] bg-white hover:bg-[#F0F4F1] text-xs font-bold text-[#18231F] transition-colors"
                >
                  Müşterinin Tüm Cihazları ve Geçmişi
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Finansal & Teslimat Özeti */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#157347]" />
                <CardTitle>Ücret & Teslimat</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3.5 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-[#EFF3F0]">
                <span className="text-[#4E5C55]">Tahmini Onarım Ücreti:</span>
                <span className="font-bold text-base text-[#18231F]">
                  {order.estimatedPrice.toLocaleString("tr-TR")} ₺
                </span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-[#EFF3F0]">
                <span className="text-[#4E5C55]">Alınan Peşinat / Avans:</span>
                <span className="font-semibold text-[#087443]">
                  {order.paidAmount.toLocaleString("tr-TR")} ₺
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-[#F7F9F7] border border-[#E5EBE7]">
                <span className="font-bold text-[#18231F]">Kalan Bakiye:</span>
                <span className="font-bold text-base text-[#B42318]">
                  {remainingBalance.toLocaleString("tr-TR")} ₺
                </span>
              </div>

              <div className="pt-1 space-y-1">
                <span className="text-[#4E5C55] font-semibold block">Tahmini Teslimat:</span>
                <div className="flex items-center gap-2 font-bold text-xs text-[#8C3B00] bg-[#FFFAEB] border border-[#FEDF89] p-2.5 rounded-xl">
                  <Clock className="w-4 h-4 text-[#8C3B00] shrink-0" />
                  <span>{order.estimatedCompletion}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
