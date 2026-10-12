"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useServiceData } from "@/context/ServiceDataContext";
import {
  Button,
  SearchField,
  Card,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Badge,
  PageHeader,
  EmptyState,
} from "@/components/ui";
import {
  Users,
  Phone,
  Mail,
  ChevronRight,
  PlusCircle,
  Smartphone,
  Calendar,
} from "lucide-react";

export default function CustomersPage() {
  const router = useRouter();
  const { customers, workOrders } = useServiceData();
  const [searchTerm, setSearchTerm] = useState("");

  // Customer statistics mapping
  const customersWithStats = useMemo(() => {
    return customers.map((c) => {
      const orders = workOrders.filter((o) => o.customerId === c.id);
      const activeOrders = orders.filter((o) => o.status !== "teslim_edildi" && o.status !== "iptal");
      const latestDevice = orders[0]?.deviceModel || "Kayıtlı cihaz yok";
      return {
        ...c,
        totalOrdersCount: orders.length,
        activeOrdersCount: activeOrders.length,
        latestDevice,
      };
    });
  }, [customers, workOrders]);

  // Filtered customers
  const filteredCustomers = useMemo(() => {
    if (!searchTerm.trim()) return customersWithStats;
    const term = searchTerm.toLowerCase();
    return customersWithStats.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        c.phone.includes(term) ||
        (c.email && c.email.toLowerCase().includes(term)) ||
        c.latestDevice.toLowerCase().includes(term)
    );
  }, [customersWithStats, searchTerm]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      <PageHeader
        title="Müşteri Rehberi"
        description="Atölyenize kayıtlı müşteriler, iletişim bilgileri ve geçmiş servis kayıtları."
        badge={
          <Badge variant="brand" size="sm">
            {customers.length} Müşteri
          </Badge>
        }
        action={
          <Link href="/work-orders/new" prefetch={false}>
            <Button
              variant="primary"
              size="md"
              leftIcon={<PlusCircle className="w-4 h-4" />}
            >
              Yeni Cihaz & Müşteri Kaydı
            </Button>
          </Link>
        }
      />

      {/* Search Bar */}
      <Card className="p-3.5 shadow-2xs">
        <SearchField
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Müşteri adı, telefon numarası veya cihaz modeli ile ara..."
          ariaLabel="Müşteri arama"
        />
      </Card>

      {/* Customers Table / Mobile Cards */}
      <Card className="overflow-hidden shadow-2xs">
        {/* Desktop Table View */}
        <div className="hidden md:block">
          {filteredCustomers.length === 0 ? (
            <EmptyState
              icon={<Users className="w-8 h-8 text-[#4E5C55]" />}
              title="Müşteri Bulunamadı"
              description="Arama kriterlerinize uygun müşteri kaydı bulunmuyor."
              className="m-6 border-0"
              action={
                searchTerm ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSearchTerm("")}
                  >
                    Aramayı Temizle
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Müşteri Adı</TableHead>
                  <TableHead>İletişim</TableHead>
                  <TableHead>Son İşlem Gören Cihaz</TableHead>
                  <TableHead>Açık İşler</TableHead>
                  <TableHead>Toplam Kayıt</TableHead>
                  <TableHead>Kayıt Tarihi</TableHead>
                  <TableHead className="text-right">Eylem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((cust) => (
                  <TableRow
                    key={cust.id}
                    onClick={() => router.push(`/customers/${cust.id}`)}
                    className="cursor-pointer"
                  >
                    <TableCell className="font-bold text-[#18231F]">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#E9F9F0] text-[#105C38] font-bold text-xs flex items-center justify-center shrink-0">
                          {cust.name.charAt(0)}
                        </div>
                        <span>{cust.name}</span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="text-[#18231F] font-semibold flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-[#157347]" />
                        <span>{cust.phone}</span>
                      </div>
                      {cust.email && (
                        <div className="text-[11px] text-[#4E5C55] flex items-center gap-1.5 mt-0.5">
                          <Mail className="w-3 h-3" />
                          <span>{cust.email}</span>
                        </div>
                      )}
                    </TableCell>

                    <TableCell>
                      <span className="font-medium text-[#18231F]">
                        {cust.latestDevice}
                      </span>
                    </TableCell>

                    <TableCell>
                      {cust.activeOrdersCount > 0 ? (
                        <Badge variant="warning" size="sm">
                          {cust.activeOrdersCount} aktif iş
                        </Badge>
                      ) : (
                        <span className="text-xs text-[#4E5C55]">Yok</span>
                      )}
                    </TableCell>

                    <TableCell>
                      <span className="font-bold text-[#18231F]">
                        {cust.totalOrdersCount} iş emri
                      </span>
                    </TableCell>

                    <TableCell>
                      <span className="text-xs text-[#4E5C55]">
                        {cust.createdAt}
                      </span>
                    </TableCell>

                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/customers/${cust.id}`);
                        }}
                      >
                        Profili Gör
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
          {filteredCustomers.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#4E5C55]">
              Aramanıza uygun müşteri bulunamadı.
            </div>
          ) : (
            filteredCustomers.map((cust) => (
              <div
                key={cust.id}
                onClick={() => router.push(`/customers/${cust.id}`)}
                className="p-3.5 hover:bg-[#F9FAF9] active:bg-[#F0F4F1] transition-colors cursor-pointer space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-[#E9F9F0] text-[#105C38] font-bold text-xs flex items-center justify-center shrink-0">
                      {cust.name.charAt(0)}
                    </div>
                    <span className="font-bold text-sm text-[#18231F]">
                      {cust.name}
                    </span>
                  </div>

                  {cust.activeOrdersCount > 0 && (
                    <Badge variant="warning" size="sm">
                      {cust.activeOrdersCount} aktif iş
                    </Badge>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-[#4E5C55]">
                  <span className="font-semibold text-[#157347] flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" />
                    {cust.phone}
                  </span>
                  <span>{cust.latestDevice}</span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#4E5C55] pt-1 border-t border-[#EFF3F0]">
                  <span>Toplam {cust.totalOrdersCount} iş emri</span>
                  <span className="flex items-center gap-1 font-semibold text-[#157347]">
                    Detay
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
