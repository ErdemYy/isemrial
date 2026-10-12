"use client";

import React, { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useServiceData } from "@/context/ServiceDataContext";
import {
  STATUS_MAP,
  PRIORITY_MAP,
} from "@/mocks/service-data";
import {
  Button,
  StatusBadge,
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Breadcrumb,
  EmptyState,
} from "@/components/ui";
import {
  User,
  Phone,
  Mail,
  PlusCircle,
  Clock,
  ChevronRight,
  CreditCard,
  Wrench,
  Smartphone,
  FileText,
} from "lucide-react";

export default function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { getCustomer, getCustomerOrders } = useServiceData();

  const customer = getCustomer(id);
  const orders = customer ? getCustomerOrders(customer.id) : [];

  if (!customer) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 space-y-4">
        <Breadcrumb
          items={[
            { label: "Müşteri Rehberi", href: "/customers" },
            { label: "Kayıt Bulunamadı" },
          ]}
          backHref="/customers"
          backLabel="Müşteri Rehberine Geri Dön"
        />
        <EmptyState
          icon={<User className="w-8 h-8 text-[#B42318]" />}
          title="Müşteri Bulunamadı"
          description={`"${id}" kimliğine sahip bir müşteri kaydı bulunamadı.`}
          action={
            <Button
              variant="primary"
              size="md"
              onClick={() => router.push("/customers")}
            >
              Müşteri Rehberine Dön
            </Button>
          }
        />
      </div>
    );
  }

  const activeOrders = orders.filter(
    (o) => o.status !== "teslim_edildi" && o.status !== "iptal"
  );
  const totalBilled = orders.reduce((sum, o) => sum + o.estimatedPrice, 0);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      <Breadcrumb
        items={[
          { label: "Müşteri Rehberi", href: "/customers" },
          { label: customer.name },
        ]}
        backHref="/customers"
        backLabel="Müşteri Rehberine Geri Dön"
      />

      {/* Customer Header Banner */}
      <div className="bg-white border border-[#E5EBE7] rounded-2xl p-4 md:p-6 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#EFF3F0]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#E9F9F0] text-[#105C38] font-bold text-lg flex items-center justify-center border border-[#A6F4C5] shadow-xs shrink-0">
              {customer.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-bold text-[#18231F] tracking-tight">
                  {customer.name}
                </h1>
                {activeOrders.length > 0 && (
                  <Badge variant="warning" size="sm">
                    {activeOrders.length} Aktif Cihaz
                  </Badge>
                )}
              </div>
              <p className="text-xs text-[#4E5C55] mt-0.5">
                Kayıt Tarihi: <strong className="text-[#18231F]">{customer.createdAt}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <Link
              href={`/work-orders/new?name=${encodeURIComponent(customer.name)}&phone=${encodeURIComponent(customer.phone)}`}
              prefetch={false}
            >
              <Button
                variant="primary"
                size="md"
                leftIcon={<PlusCircle className="w-4 h-4" />}
              >
                Bu Müşteriye Yeni Cihaz Kaydı Aç
              </Button>
            </Link>
          </div>
        </div>

        {/* Contact Info Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
          <div className="p-3 rounded-xl bg-[#F7F9F7] border border-[#E5EBE7] space-y-0.5">
            <span className="text-[#4E5C55] text-[11px] font-semibold">Telefon:</span>
            <a
              href={`tel:${customer.phone}`}
              className="font-bold text-[#157347] flex items-center gap-1.5 hover:underline"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>{customer.phone}</span>
            </a>
          </div>

          <div className="p-3 rounded-xl bg-[#F7F9F7] border border-[#E5EBE7] space-y-0.5">
            <span className="text-[#4E5C55] text-[11px] font-semibold">E-posta:</span>
            <div className="font-medium text-[#18231F] flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-[#4E5C55]" />
              <span>{customer.email || "Belirtilmedi"}</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#F7F9F7] border border-[#E5EBE7] space-y-0.5">
            <span className="text-[#4E5C55] text-[11px] font-semibold">Toplam Servis Hacmi:</span>
            <div className="font-bold text-[#18231F] flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-[#157347]" />
              <span>{totalBilled.toLocaleString("tr-TR")} ₺ ({orders.length} işlem)</span>
            </div>
          </div>
        </div>

        {customer.notes && (
          <div className="p-3 rounded-xl bg-[#FFFAEB] border border-[#FEDF89] text-xs text-[#8C3B00]">
            <span className="font-bold block mb-0.5">Müşteri Özel Notu:</span>
            {customer.notes}
          </div>
        )}
      </div>

      {/* Customer's Work Orders History */}
      <Card className="overflow-hidden shadow-2xs">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Wrench className="w-4 h-4 text-[#157347]" />
            <CardTitle>Müşterinin İş Emirleri ({orders.length})</CardTitle>
          </div>
        </CardHeader>

        {orders.length === 0 ? (
          <CardContent>
            <p className="text-xs text-[#4E5C55] text-center py-6">
              Bu müşteriye ait kayıtlı iş emri bulunmuyor.
            </p>
          </CardContent>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>İş Emri No</TableHead>
                    <TableHead>Cihaz Modeli & Şikayet</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead>Öncelik</TableHead>
                    <TableHead>Kayıt Tarihi</TableHead>
                    <TableHead className="text-right">Tutar</TableHead>
                    <TableHead className="text-right">Eylem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((o) => {
                    const priorityMeta = PRIORITY_MAP[o.priority];
                    return (
                      <TableRow
                        key={o.id}
                        onClick={() => router.push(`/work-orders/${o.id}`)}
                        className="cursor-pointer"
                      >
                        <TableCell className="font-bold text-[#157347] font-mono">
                          {o.orderNumber}
                        </TableCell>

                        <TableCell>
                          <div className="font-bold text-[#18231F]">{o.deviceModel}</div>
                          <div className="text-[11px] text-[#4E5C55] truncate max-w-[240px]">
                            {o.issueSummary}
                          </div>
                        </TableCell>

                        <TableCell>
                          <StatusBadge status={o.status} size="sm" />
                        </TableCell>

                        <TableCell>
                          <span
                            className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                            style={{ color: priorityMeta.color, backgroundColor: priorityMeta.bg }}
                          >
                            {priorityMeta.label}
                          </span>
                        </TableCell>

                        <TableCell>
                          <span className="text-xs text-[#4E5C55]">{o.createdAt}</span>
                        </TableCell>

                        <TableCell className="text-right font-bold text-[#18231F]">
                          {o.estimatedPrice.toLocaleString("tr-TR")} ₺
                        </TableCell>

                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/work-orders/${o.id}`);
                            }}
                          >
                            Detay
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Cards View */}
            <div className="md:hidden divide-y divide-[#EFF3F0]">
              {orders.map((o) => (
                <div
                  key={o.id}
                  onClick={() => router.push(`/work-orders/${o.id}`)}
                  className="p-3.5 hover:bg-[#F9FAF9] active:bg-[#F0F4F1] transition-colors cursor-pointer space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-[#157347] font-mono">
                      {o.orderNumber}
                    </span>
                    <StatusBadge status={o.status} size="sm" />
                  </div>

                  <div>
                    <div className="font-bold text-xs text-[#18231F]">
                      {o.deviceModel}
                    </div>
                    <div className="text-[11px] text-[#4E5C55] line-clamp-1 mt-0.5">
                      {o.issueSummary}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#EFF3F0] flex items-center justify-between text-[11px] text-[#4E5C55]">
                    <span>{o.createdAt}</span>
                    <span className="font-bold text-[#18231F]">
                      {o.estimatedPrice.toLocaleString("tr-TR")} ₺
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
