"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useServiceData } from "@/context/ServiceDataContext";
import {
  STATUS_MAP,
  type WorkOrderStatus,
} from "@/mocks/service-data";
import {
  Button,
  SearchField,
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
  EmptyState,
} from "@/components/ui";
import {
  PlusCircle,
  ArrowRight,
  Clock,
  ChevronRight,
  Users,
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const { workOrders, metrics, user, organization } = useServiceData();

  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Filtered orders
  const filteredOrders = workOrders.filter((order) => {
    const matchesFilter = activeFilter === "all" || order.status === activeFilter;
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm.trim() ||
      order.orderNumber.toLowerCase().includes(term) ||
      order.customerName.toLowerCase().includes(term) ||
      order.deviceModel.toLowerCase().includes(term) ||
      order.customerPhone.includes(term);
    return matchesFilter && matchesSearch;
  });

  // Today's urgent/critical items
  const todayUrgentOrders = workOrders.filter(
    (o) =>
      o.status !== "teslim_edildi" &&
      o.status !== "iptal" &&
      (o.estimatedCompletion.includes("Bugün") || o.priority === "acil")
  );

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-16">
      {/* 1. Natural Welcome & Discovery Header (Bubilet Style Clean Banner) */}
      <Card className="p-4 md:p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#E9F9F0] text-[#087443] border border-[#A6F4C5] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#12B76A] animate-pulse" />
                Atölye Masası Açık
              </span>
              {organization && (
                <span className="text-xs text-[#4E5C55] hidden sm:inline">
                  {organization.name}
                </span>
              )}
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[#18231F] mt-1.5">
              İyi çalışmalar{user ? `, ${user.fullName}` : ""} 👋
            </h1>
            <p className="text-xs md:text-sm text-[#4E5C55] mt-0.5">
              Bugün masada <strong className="text-[#175CD3]">{metrics.inProgressCount} tamir</strong>, onay bekleyen{" "}
              <strong className="text-[#8C3B00]">{metrics.pendingApprovalCount} cihaz</strong> ve teslim edilecek{" "}
              <strong className="text-[#087443]">{metrics.readyCount} hazır iş</strong> var.
            </p>
          </div>

          <div className="hidden md:flex items-center gap-2.5 shrink-0">
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
        </div>

        {/* Prominent Operational Search Bar (Direct Action Focus) */}
        <div className="mt-4 pt-4 border-t border-[#EFF3F0]">
          <SearchField
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="İş emri no (İE-1042), müşteri adı, telefon veya cihaz modeli ara..."
          />
        </div>
      </Card>

      {/* 2. Operational Discovery Strip (Dinamik Merkezi Sayaçlar) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <button
          type="button"
          onClick={() => setActiveFilter(activeFilter === "islemde" ? "all" : "islemde")}
          className={`p-3 rounded-xl border text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#175CD3] ${
            activeFilter === "islemde"
              ? "bg-[#EFF8FF] border-[#175CD3] ring-1 ring-[#175CD3]"
              : "bg-white border-[#E5EBE7] hover:border-[#B2DDFF]"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#175CD3]">Tamirde / Masada</span>
            <span className="w-2 h-2 rounded-full bg-[#2E90FA]" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-[#18231F]">
              {metrics.inProgressCount}
            </span>
            <span className="text-[11px] text-[#4E5C55]">aktif onarım</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter(activeFilter === "onay_bekliyor" ? "all" : "onay_bekliyor")}
          className={`p-3 rounded-xl border text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8C3B00] ${
            activeFilter === "onay_bekliyor"
              ? "bg-[#FFFAEB] border-[#F79009] ring-1 ring-[#F79009]"
              : "bg-white border-[#E5EBE7] hover:border-[#FEDF89]"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#8C3B00]">Onay Bekleyen</span>
            <span className="w-2 h-2 rounded-full bg-[#F79009]" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-[#8C3B00]">
              {metrics.pendingApprovalCount}
            </span>
            <span className="text-[11px] text-[#4E5C55]">fiyat teyidi</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter(activeFilter === "parca_bekliyor" ? "all" : "parca_bekliyor")}
          className={`p-3 rounded-xl border text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B42318] ${
            activeFilter === "parca_bekliyor"
              ? "bg-[#FEF3F2] border-[#F04438] ring-1 ring-[#F04438]"
              : "bg-white border-[#E5EBE7] hover:border-[#FECDCA]"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#B42318]">Parça Bekleyen</span>
            <span className="w-2 h-2 rounded-full bg-[#F04438]" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-[#B42318]">
              {metrics.waitingPartsCount}
            </span>
            <span className="text-[11px] text-[#4E5C55]">kargoda</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter(activeFilter === "hazir" ? "all" : "hazir")}
          className={`p-3 rounded-xl border text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#087443] ${
            activeFilter === "hazir"
              ? "bg-[#E6F7EE] border-[#12B76A] ring-1 ring-[#12B76A]"
              : "bg-white border-[#E5EBE7] hover:border-[#A6F4C5]"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#087443]">Teslime Hazır</span>
            <span className="w-2 h-2 rounded-full bg-[#12B76A]" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-[#087443]">
              {metrics.readyCount}
            </span>
            <span className="text-[11px] text-[#4E5C55]">müşteri bekliyor</span>
          </div>
        </button>
      </div>

      {/* 3. Main Workspace: Orders List + Urgent Delivery Strip */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        {/* Left Column: Orders Table / Mobile Feed (8 cols on xl) */}
        <Card className="xl:col-span-8 overflow-hidden shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <CardTitle>Güncel İş Emirleri</CardTitle>
              {activeFilter !== "all" && (
                <Badge variant="neutral" size="sm">
                  {STATUS_MAP[activeFilter as WorkOrderStatus]?.label} filtrelendi
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-3">
              {(activeFilter !== "all" || searchTerm) && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveFilter("all");
                    setSearchTerm("");
                  }}
                  className="text-xs text-[#4E5C55] hover:text-[#18231F] underline focus-visible:outline-none"
                >
                  Filtreyi Temizle
                </button>
              )}
              <Link
                href="/work-orders"
                prefetch={false}
                className="text-xs font-bold text-[#157347] hover:text-[#105C38] flex items-center gap-1 transition-colors"
              >
                <span>Tümünü Gör ({workOrders.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </CardHeader>

          {/* Desktop Table View */}
          <div className="hidden md:block">
            {filteredOrders.length === 0 ? (
              <EmptyState
                title="İş Emri Bulunamadı"
                description="Aramanıza veya seçilen filtreye uygun iş emri kaydı bulunmuyor."
                className="m-4"
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>İş Emri No</TableHead>
                    <TableHead>Cihaz & Model</TableHead>
                    <TableHead>Müşteri</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead>Teslim</TableHead>
                    <TableHead className="text-right">Eylem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
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
                        <div className="text-[11px] text-[#4E5C55] truncate max-w-[200px]">
                          {order.issueSummary}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-[#18231F]">{order.customerName}</div>
                        <div className="text-[11px] text-[#4E5C55]">{order.customerPhone}</div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={order.status} size="sm" />
                      </TableCell>
                      <TableCell>
                        <span className="text-xs font-medium text-[#4E5C55]">
                          {order.estimatedCompletion}
                        </span>
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
                          İncele
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          {/* Mobile Feed View */}
          <div className="md:hidden divide-y divide-[#EFF3F0]">
            {filteredOrders.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#4E5C55]">
                Aramanıza uygun iş emri bulunamadı.
              </div>
            ) : (
              filteredOrders.map((order) => (
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
                      <span className="text-[11px] text-[#4E5C55]">
                        {order.technicianName}
                      </span>
                    </div>
                    <StatusBadge status={order.status} size="sm" />
                  </div>

                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-sm font-bold text-[#18231F]">
                        {order.deviceModel}
                      </div>
                      <div className="text-xs text-[#4E5C55] line-clamp-1">
                        {order.issueSummary}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#4E5C55] shrink-0 mt-1" />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[#4E5C55] pt-1">
                    <span>{order.customerName}</span>
                    <span className="font-semibold text-[#18231F]">
                      {order.estimatedCompletion}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Right Column: Urgent Action Panel + Quick Links (4 cols on xl) */}
        <div className="xl:col-span-4 space-y-4">
          {/* Today Urgent Deliveries */}
          <Card className="p-4 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#EFF3F0]">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#8C3B00]" />
                <h3 className="text-xs font-bold text-[#18231F] uppercase tracking-wider">
                  Bugün Teslim & Acil
                </h3>
              </div>
              <Badge variant="warning" size="sm">
                {todayUrgentOrders.length} cihaz
              </Badge>
            </div>

            <div className="mt-3 space-y-2">
              {todayUrgentOrders.length === 0 ? (
                <p className="text-xs text-[#4E5C55] text-center py-4">
                  Bugün teslim bekleyen acil cihaz bulunmuyor.
                </p>
              ) : (
                todayUrgentOrders.map((order) => (
                  <div
                    key={order.id}
                    onClick={() => router.push(`/work-orders/${order.id}`)}
                    className="p-3 rounded-xl border border-[#E5EBE7] hover:border-[#157347] hover:bg-[#F9FAF9] cursor-pointer transition-colors text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#157347] font-mono">
                        {order.orderNumber}
                      </span>
                      <span className="text-[10px] text-[#B42318] font-bold bg-[#FEF3F2] px-2 py-0.5 rounded-full border border-[#FECDCA]">
                        {order.estimatedCompletion}
                      </span>
                    </div>
                    <div className="mt-1 font-bold text-[#18231F] truncate">
                      {order.deviceModel}
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[11px] text-[#4E5C55]">
                      <span>{order.customerName}</span>
                      <span className="font-semibold text-[#344054]">{order.technicianName}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Quick Action Shortcuts */}
          <Card className="p-4 shadow-2xs">
            <h3 className="text-xs font-bold text-[#18231F] pb-2.5 border-b border-[#EFF3F0]">
              Hızlı Atölye Kısayolları
            </h3>
            <div className="mt-3 space-y-2">
              <Link
                href="/work-orders/new"
                prefetch={false}
                className="flex items-center justify-between p-2.5 rounded-xl border border-[#E5EBE7] hover:bg-[#E9F9F0] hover:border-[#157347] text-xs font-bold text-[#18231F] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#157347]"
              >
                <div className="flex items-center gap-2">
                  <PlusCircle className="w-4 h-4 text-[#157347]" />
                  <span>Yeni Cihaz Kabulü Yap</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-[#4E5C55]" />
              </Link>

              <Link
                href="/customers"
                prefetch={false}
                className="flex items-center justify-between p-2.5 rounded-xl border border-[#E5EBE7] hover:bg-[#E9F9F0] hover:border-[#157347] text-xs font-bold text-[#18231F] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#157347]"
              >
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#157347]" />
                  <span>Müşteri Rehberine Git ({metrics.totalCustomers})</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-[#4E5C55]" />
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
