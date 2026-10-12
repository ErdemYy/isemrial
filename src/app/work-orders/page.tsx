"use client";

import React, { useState, useMemo, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useServiceData } from "@/context/ServiceDataContext";
import {
  MOCK_TECHNICIANS,
  STATUS_MAP,
  PRIORITY_MAP,
  type WorkOrderStatus,
  type WorkOrderItem,
} from "@/mocks/service-data";
import {
  Button,
  SearchField,
  FilterChip,
  StatusBadge,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Toast,
  Card,
  PageHeader,
  EmptyState,
} from "@/components/ui";
import {
  PlusCircle,
  Filter,
  Clock,
  RotateCcw,
  ExternalLink,
  ChevronRight,
} from "lucide-react";

function WorkOrdersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { workOrders, updateWorkOrderStatus } = useServiceData();

  const initialStatus = searchParams?.get("status") || "all";

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>(initialStatus);
  const [techFilter, setTechFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filtered list
  const filteredOrders = useMemo(() => {
    return workOrders.filter((order) => {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm.trim() ||
        order.orderNumber.toLowerCase().includes(term) ||
        order.customerName.toLowerCase().includes(term) ||
        order.customerPhone.includes(term) ||
        order.deviceModel.toLowerCase().includes(term) ||
        order.deviceSerial.toLowerCase().includes(term);

      const matchesStatus = statusFilter === "all" || order.status === statusFilter;
      const matchesTech = techFilter === "all" || order.technicianName === techFilter;
      const matchesType = typeFilter === "all" || order.deviceType === typeFilter;

      return matchesSearch && matchesStatus && matchesTech && matchesType;
    });
  }, [workOrders, searchTerm, statusFilter, techFilter, typeFilter]);

  // Quick status change
  const handleQuickStatusChange = (orderId: string, newStatus: WorkOrderStatus) => {
    updateWorkOrderStatus(orderId, newStatus, undefined, "Murat Usta");
    setToastMessage(`İş emri durumu "${STATUS_MAP[newStatus].label}" olarak güncellendi.`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
      )}

      {/* Page Header */}
      <PageHeader
        title="İş Emirleri"
        description="Atölyedeki tüm cihazlar, müşteri talepleri ve teslimat takibi."
        action={
          <div className="hidden sm:flex items-center gap-2">
            <Link href="/work-orders/new" prefetch={false}>
              <Button
                variant="primary"
                size="md"
                leftIcon={<PlusCircle className="w-4 h-4" />}
              >
                Yeni İş Emri Aç
              </Button>
            </Link>
          </div>
        }
      />

      {/* Discovery & Search Bar */}
      <Card className="p-3.5 shadow-2xs space-y-3">
        {/* Main Search Input & Secondary Selects */}
        <div className="flex flex-col md:flex-row gap-2.5">
          <div className="flex-1">
            <SearchField
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="İş emri no, müşteri adı, telefon veya cihaz modeli ara..."
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Tech Select */}
            <select
              value={techFilter}
              onChange={(e) => setTechFilter(e.target.value)}
              className="px-3 py-2.5 text-xs bg-[#F7F9F7] border border-[#E5EBE7] rounded-xl text-[#18231F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#157347] font-semibold min-h-[44px]"
            >
              <option value="all">Tüm Teknisyenler</option>
              {MOCK_TECHNICIANS.map((tech) => (
                <option key={tech.id} value={tech.name}>
                  {tech.name}
                </option>
              ))}
            </select>

            {/* Device Type Select */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2.5 text-xs bg-[#F7F9F7] border border-[#E5EBE7] rounded-xl text-[#18231F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#157347] font-semibold min-h-[44px]"
            >
              <option value="all">Tüm Cihaz Türleri</option>
              <option value="Telefon">Telefon</option>
              <option value="Bilgisayar">Bilgisayar</option>
              <option value="Tablet">Tablet</option>
              <option value="Diğer">Diğer</option>
            </select>

            {/* Reset Filters */}
            {(searchTerm || statusFilter !== "all" || techFilter !== "all" || typeFilter !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setTechFilter("all");
                  setTypeFilter("all");
                }}
                leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                className="text-[#4E5C55] hover:text-[#B42318] hover:bg-[#FEF3F2]"
              >
                Sıfırla
              </Button>
            )}
          </div>
        </div>

        {/* Status Horizontal Pill Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 scrollbar-none text-xs">
          <FilterChip
            label="Tümü"
            count={workOrders.length}
            active={statusFilter === "all"}
            onClick={() => setStatusFilter("all")}
          />

          {(
            [
              "islemde",
              "onay_bekliyor",
              "parca_bekliyor",
              "hazir",
              "incelemede",
              "yeni",
              "teslim_edildi",
            ] as WorkOrderStatus[]
          ).map((st) => {
            const count = workOrders.filter((o) => o.status === st).length;
            const meta = STATUS_MAP[st];
            const isActive = statusFilter === st;
            return (
              <FilterChip
                key={st}
                label={meta.label}
                count={count}
                active={isActive}
                onClick={() => setStatusFilter(isActive ? "all" : st)}
              />
            );
          })}
        </div>
      </Card>

      {/* Main Work Orders Container */}
      <Card className="overflow-hidden shadow-2xs">
        {/* Desktop Table View */}
        <div className="hidden md:block">
          {filteredOrders.length === 0 ? (
            <EmptyState
              icon={<Filter className="w-8 h-8 text-[#4E5C55]" />}
              title="Kayıt bulunamadı"
              description="Arama kriterlerinize veya seçilen filtrelere uygun iş emri bulunmuyor."
              className="m-6 border-0"
              action={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("all");
                    setTechFilter("all");
                    setTypeFilter("all");
                  }}
                >
                  Filtreleri Temizle
                </Button>
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">İş Emri No</TableHead>
                  <TableHead>Cihaz & Arıza Şikayeti</TableHead>
                  <TableHead>Müşteri</TableHead>
                  <TableHead>Öncelik</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Teknisyen / Teslim</TableHead>
                  <TableHead className="text-right">Tahmini Ücret</TableHead>
                  <TableHead className="text-right">Eylem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => {
                  const priority = PRIORITY_MAP[order.priority];
                  return (
                    <TableRow
                      key={order.id}
                      onClick={() => router.push(`/work-orders/${order.id}`)}
                      className="cursor-pointer"
                    >
                      <TableCell className="font-bold text-[#157347] font-mono">
                        {order.orderNumber}
                      </TableCell>
                      <TableCell>
                        <div className="font-bold text-[#18231F]">{order.deviceModel}</div>
                        <div className="text-[11px] text-[#4E5C55] truncate max-w-[240px]">
                          {order.issueSummary}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-[#18231F]">{order.customerName}</div>
                        <div className="text-[11px] text-[#4E5C55]">{order.customerPhone}</div>
                      </TableCell>
                      <TableCell>
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full font-bold inline-block"
                          style={{ color: priority.color, backgroundColor: priority.bg }}
                        >
                          {priority.label}
                        </span>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={order.status} size="sm" />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-[#18231F]">{order.technicianName}</div>
                        <div className="text-[11px] text-[#4E5C55] flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#4E5C55]" />
                          <span>{order.estimatedCompletion}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-bold text-[#18231F]">
                        {order.estimatedPrice.toLocaleString("tr-TR")} ₺
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/work-orders/${order.id}`);
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
          )}
        </div>

        {/* Mobile Cards View */}
        <div className="md:hidden divide-y divide-[#EFF3F0]">
          {filteredOrders.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#4E5C55]">
              Filtrelere uygun iş emri kaydı bulunamadı.
            </div>
          ) : (
            filteredOrders.map((order) => {
              const priority = PRIORITY_MAP[order.priority];
              return (
                <div
                  key={order.id}
                  onClick={() => router.push(`/work-orders/${order.id}`)}
                  className="p-3.5 hover:bg-[#F9FAF9] active:bg-[#F0F4F1] transition-colors cursor-pointer space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-[#157347] font-mono">
                        {order.orderNumber}
                      </span>
                      <span
                        className="text-[10px] px-2 py-0.2 rounded-full font-bold"
                        style={{ color: priority.color, backgroundColor: priority.bg }}
                      >
                        {priority.label}
                      </span>
                    </div>
                    <StatusBadge status={order.status} size="sm" />
                  </div>

                  <div>
                    <div className="font-bold text-xs text-[#18231F]">
                      {order.deviceModel}
                    </div>
                    <div className="text-[11px] text-[#4E5C55] line-clamp-1 mt-0.5">
                      {order.issueSummary}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#EFF3F0] flex items-center justify-between text-[11px]">
                    <div>
                      <span className="font-bold text-[#18231F] block">
                        {order.customerName}
                      </span>
                      <span className="text-[#4E5C55]">{order.customerPhone}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-[#18231F] block">
                        {order.estimatedPrice.toLocaleString("tr-TR")} ₺
                      </span>
                      <span className="text-[#B42318] font-bold flex items-center gap-1 justify-end">
                        <Clock className="w-3 h-3" />
                        {order.estimatedCompletion}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>
    </div>
  );
}

export default function WorkOrdersPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-[#4E5C55]">İş emirleri yükleniyor...</div>}>
      <WorkOrdersContent />
    </Suspense>
  );
}
