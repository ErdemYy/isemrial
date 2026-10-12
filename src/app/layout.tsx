import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/AppShell";
import { ServiceDataProvider } from "@/context/ServiceDataContext";

export const metadata: Metadata = {
  title: "İşEmriAl — Teknik Servis İş Emri Yönetimi",
  description: "Türkiye'deki küçük teknik servisler için operasyonel iş emri, cihaz ve durum takip platformu.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body>
        <ServiceDataProvider>
          <AppShell>{children}</AppShell>
        </ServiceDataProvider>
      </body>
    </html>
  );
}
