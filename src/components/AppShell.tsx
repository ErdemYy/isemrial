"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  PlusCircle,
  Users,
  Settings,
  Menu,
  X,
  Wrench,
  Search,
  Sparkles,
  LogOut,
} from "lucide-react";
import { useServiceData } from "@/context/ServiceDataContext";

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, organization, isAuthenticated, isAuthLoading, logout } = useServiceData();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Redirect to login if unauthenticated on protected routes
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated && pathname !== "/login" && pathname !== "/register") {
      router.push("/login");
    }
  }, [isAuthLoading, isAuthenticated, pathname, router]);

  // If on login or register, render children standalone without navigation shells
  if (pathname === "/login" || pathname === "/register") {
    return <main>{children}</main>;
  }

  const navItems = [
    {
      label: "Genel Bakış",
      href: "/dashboard",
      icon: LayoutDashboard,
      active: pathname === "/dashboard",
    },
    {
      label: "İş Emirleri",
      href: "/work-orders",
      icon: ClipboardList,
      active: pathname.startsWith("/work-orders") && pathname !== "/work-orders/new",
    },
    {
      label: "Yeni İş Emri",
      href: "/work-orders/new",
      icon: PlusCircle,
      active: pathname === "/work-orders/new",
    },
    {
      label: "Müşteriler",
      href: "/customers",
      icon: Users,
      active: pathname === "/customers" || pathname.startsWith("/customers/"),
    },
    {
      label: "Atölye Ayarları",
      href: "/settings",
      icon: Settings,
      active: pathname === "/settings",
      badge: "Yakında",
    },
    ...(process.env.NODE_ENV !== "production"
      ? [
          {
            label: "Bileşen Vitrini",
            href: "/dev/design-system",
            icon: Sparkles,
            active: pathname === "/dev/design-system",
            badge: "Dev",
          },
        ]
      : []),
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F7F9F7] text-[#18231F]">
      {/* Desktop Sidebar (240px) */}
      <aside className="hidden md:flex flex-col w-60 border-r border-[#E5EBE7] bg-[#FFFFFF] shrink-0 min-h-screen sticky top-0 h-screen">
        {/* Brand Header */}
        <div className="h-16 flex items-center px-5 border-b border-[#E5EBE7] justify-between">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-[#20C875] flex items-center justify-center text-white shadow-xs font-semibold text-sm">
              <Wrench className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm tracking-tight text-[#18231F] group-hover:text-[#157347] transition-colors">
                İşEmriAl
              </span>
              <span className="text-[11px] text-[#4E5C55] font-medium leading-none truncate max-w-[140px]">
                {organization?.name || "Usta Teknik Servis"}
              </span>
            </div>
          </Link>
        </div>

        {/* Primary Action Button inside Sidebar (WCAG AA Compliant #157347) */}
        <div className="p-3">
          <Link
            href="/work-orders/new"
            prefetch={false}
            className="flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-xl bg-[#157347] hover:bg-[#105C38] text-white text-xs font-bold shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#157347] focus-visible:ring-offset-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Yeni İş Emri Aç</span>
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={false}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#157347] ${
                  item.active
                    ? "bg-[#E9F9F0] text-[#105C38]"
                    : "text-[#344054] hover:bg-[#F0F4F1] hover:text-[#18231F]"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`w-4 h-4 ${
                      item.active ? "text-[#157347]" : "text-[#4E5C55]"
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] font-normal px-1.5 py-0.5 rounded bg-[#F2F4F7] text-[#4E5C55]">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Workshop status & Active User */}
        <div className="p-3 border-t border-[#E5EBE7] bg-[#FCFDFD]">
          <div className="flex items-center gap-2.5 px-2 py-1.5">
            <div className="w-8 h-8 rounded-full bg-[#157347] flex items-center justify-center text-xs font-bold text-white shrink-0">
              {user?.fullName
                ? user.fullName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)
                : "MU"}
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-bold text-[#18231F] truncate">
                {user?.fullName || "Murat Usta"}
              </span>
              <div className="flex items-center gap-1 text-[11px] text-[#087443] font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-[#12B76A]" />
                <span className="truncate">{organization?.name || "Usta Teknik"}</span>
              </div>
            </div>
            {isAuthenticated && (
              <button
                type="button"
                onClick={async () => {
                  await logout();
                  router.push("/login");
                }}
                title="Çıkış Yap"
                aria-label="Çıkış Yap"
                className="p-1.5 rounded-lg text-[#4E5C55] hover:text-[#B42318] hover:bg-[#FEF3F2] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B42318]"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-14 bg-[#FFFFFF] border-b border-[#E5EBE7] px-4 md:px-6 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-lg text-[#344054] hover:bg-[#F0F4F1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#157347]"
              aria-label="Menüyü aç"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex items-center text-xs text-[#4E5C55] gap-2">
              <span className="font-bold text-[#18231F]">{organization?.name || "Usta Teknik Servis"}</span>
              <span>•</span>
              <span>10 Ekim 2026, Cumartesi</span>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <div className="relative hidden lg:block">
              <Search className="w-3.5 h-3.5 text-[#4E5C55] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="İş emri, müşteri veya seri no ara..."
                className="pl-8 pr-3 py-1.5 text-xs bg-[#F7F9F7] border border-[#E5EBE7] rounded-lg w-64 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#157347] focus:bg-white transition-all text-[#18231F]"
                readOnly
              />
            </div>

            <Link
              href="/work-orders/new"
              prefetch={false}
              className="md:hidden flex items-center gap-1.5 py-2 px-3 rounded-xl bg-[#157347] hover:bg-[#105C38] text-white text-xs font-bold shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#157347]"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Yeni İş</span>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6 pb-20 md:pb-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Mobile Drawer (Backdrop + Menu) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <div className="relative flex flex-col w-64 max-w-xs bg-white h-full shadow-xl border-r border-[#E5EBE7] p-4 z-10">
            <div className="flex items-center justify-between pb-4 border-b border-[#E5EBE7]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#20C875] flex items-center justify-center text-white font-bold text-xs">
                  <Wrench className="w-3.5 h-3.5" />
                </div>
                <span className="font-bold text-sm text-[#18231F]">
                  İşEmriAl
                </span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-[#4E5C55] hover:bg-[#F0F4F1]"
                aria-label="Kapat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 py-4 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={false}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold ${
                      item.active
                        ? "bg-[#E9F9F0] text-[#105C38]"
                        : "text-[#344054] hover:bg-[#F0F4F1]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#F2F4F7] text-[#4E5C55]">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            <div className="pt-3 border-t border-[#E5EBE7] flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-[#18231F]">
                  {user?.fullName || "Giriş Yapılmadı"}
                </div>
                <div className="text-[11px] text-[#4E5C55]">
                  {organization?.name || "İşEmriAl"}
                </div>
              </div>
              {isAuthenticated && (
                <button
                  type="button"
                  onClick={async () => {
                    await logout();
                    setMobileMenuOpen(false);
                    router.push("/login");
                  }}
                  className="p-2 rounded-lg text-[#B42318] hover:bg-[#FEF3F2]"
                  aria-label="Çıkış Yap"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar (Min 44px Touch Target) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-14 bg-white/95 backdrop-blur-md border-t border-[#E5EBE7] flex items-center justify-around px-2 z-30 shadow-xs">
        <Link
          href="/dashboard"
          prefetch={false}
          className={`flex flex-col items-center justify-center min-w-[64px] min-h-[44px] gap-1 text-[10px] font-semibold py-1 px-3 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#157347] ${
            pathname === "/dashboard"
              ? "text-[#105C38]"
              : "text-[#4E5C55]"
          }`}
        >
          <LayoutDashboard
            className={`w-4 h-4 ${
              pathname === "/dashboard" ? "text-[#157347]" : "text-[#4E5C55]"
            }`}
          />
          <span>Genel Bakış</span>
        </Link>
        <Link
          href="/work-orders"
          prefetch={false}
          className={`flex flex-col items-center justify-center min-w-[64px] min-h-[44px] gap-1 text-[10px] font-semibold py-1 px-3 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#157347] ${
            pathname === "/work-orders"
              ? "text-[#105C38]"
              : "text-[#4E5C55]"
          }`}
        >
          <ClipboardList
            className={`w-4 h-4 ${
              pathname === "/work-orders" ? "text-[#157347]" : "text-[#4E5C55]"
            }`}
          />
          <span>İş Emirleri</span>
        </Link>
        <Link
          href="/work-orders/new"
          prefetch={false}
          className={`flex flex-col items-center justify-center min-w-[64px] min-h-[44px] gap-1 text-[10px] font-semibold py-1 px-3 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#157347] ${
            pathname === "/work-orders/new"
              ? "text-[#105C38]"
              : "text-[#4E5C55]"
          }`}
        >
          <PlusCircle
            className={`w-4 h-4 ${
              pathname === "/work-orders/new" ? "text-[#157347]" : "text-[#4E5C55]"
            }`}
          />
          <span>Yeni İş</span>
        </Link>
      </div>
    </div>
  );
};
