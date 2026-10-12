"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Wrench, ArrowRight, ShieldCheck, UserCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { Alert } from "@/components/ui/alert";
import { useServiceData } from "@/context/ServiceDataContext";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useServiceData();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Lütfen e-posta adresinizi ve parolanızı giriniz.");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      await login(email.trim(), password);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err?.message || "Giriş yapılamadı. Lütfen bilgilerinizi kontrol ediniz.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("Parola123!");
    setError(null);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-[#F7F9F7]">
      <div className="w-full max-w-md space-y-6">
        {/* Logo and Branding Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#20C875] text-white shadow-xs mx-auto mb-2">
            <Wrench className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-[#18231F] tracking-tight">
            İşEmriAl
          </h1>
          <p className="text-xs text-[#4E5C55]">
            Teknik Servis ve Atölye Yönetim Platformu
          </p>
        </div>

        {/* Main Login Card */}
        <Card className="p-6 md:p-8 shadow-xs border-[#E5EBE7] bg-white space-y-5">
          <div className="border-b border-[#E5EBE7] pb-3">
            <h2 className="text-base font-bold text-[#18231F]">Atölye Girişi</h2>
            <p className="text-xs text-[#4E5C55] mt-0.5">
              Hesabınıza erişmek için bilgilerinizi giriniz.
            </p>
          </div>

          {error && (
            <Alert variant="danger" title="Giriş Başarısız">
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField id="email" label="E-posta Adresi" required>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Örn: usta@ustateknik.com"
                required
              />
            </FormField>

            <FormField id="password" label="Parola" required>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </FormField>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isLoading}
                className="w-full"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Giriş Yap
              </Button>
            </div>
          </form>

          {/* Quick Demo Fill Buttons for Testing & Assessment (Disabled in production mode) */}
          {(process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_ENABLE_DEMO_LOGIN === "true") && (
            <div className="pt-4 border-t border-[#E5EBE7] space-y-2">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#4E5C55]">
                <UserCheck className="w-3.5 h-3.5 text-[#157347]" />
                <span>Geliştirme / Test Girişleri (Tek Tık):</span>
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleQuickFill("murat@ustateknik.com")}
                  className="text-left px-3 py-2 rounded-xl text-xs bg-[#F7F9F7] hover:bg-[#E9F9F0] border border-[#E5EBE7] text-[#18231F] transition-colors flex items-center justify-between"
                >
                  <span className="font-semibold">Murat Usta (Atölye Sahibi — Usta Teknik)</span>
                  <span className="text-[10px] text-[#157347] font-bold">Doldur</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill("emre@ustateknik.com")}
                  className="text-left px-3 py-2 rounded-xl text-xs bg-[#F7F9F7] hover:bg-[#E9F9F0] border border-[#E5EBE7] text-[#18231F] transition-colors flex items-center justify-between"
                >
                  <span className="font-semibold">Emre Can (Teknisyen — Usta Teknik)</span>
                  <span className="text-[10px] text-[#157347] font-bold">Doldur</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill("ahmet@kadikoybilisim.com")}
                  className="text-left px-3 py-2 rounded-xl text-xs bg-[#F7F9F7] hover:bg-[#E9F9F0] border border-[#E5EBE7] text-[#18231F] transition-colors flex items-center justify-between"
                >
                  <span className="font-semibold">Ahmet Tekin (Kadıköy Bilişim — 2. İşletme)</span>
                  <span className="text-[10px] text-[#157347] font-bold">Doldur</span>
                </button>
              </div>
            </div>
          )}
        </Card>

        {/* Footer Link to Register */}
        <div className="text-center text-xs text-[#4E5C55]">
          <span>Henüz bir atölye hesabınız yok mu? </span>
          <Link
            href="/register"
            className="font-bold text-[#157347] hover:underline"
          >
            Yeni Atölye Kaydı Aç
          </Link>
        </div>
      </div>
    </div>
  );
}
