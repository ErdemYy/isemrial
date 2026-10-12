"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Wrench, ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { Alert } from "@/components/ui/alert";
import { useServiceData } from "@/context/ServiceDataContext";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useServiceData();

  const [organizationName, setOrganizationName] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organizationName.trim()) {
      setError("Lütfen atölye veya işletme adını giriniz.");
      return;
    }
    if (!fullName.trim()) {
      setError("Lütfen ad ve soyadınızı giriniz.");
      return;
    }
    if (!email.trim()) {
      setError("Lütfen geçerli bir e-posta adresi giriniz.");
      return;
    }
    if (password.length < 8) {
      setError("Parola en az 8 karakter uzunluğunda olmalıdır.");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      await register({
        organizationName: organizationName.trim(),
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        password,
      });
      router.push("/dashboard");
    } catch (err: any) {
      setError(err?.message || "Kayıt oluşturulamadı. Lütfen bilgilerinizi kontrol ediniz.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-[#F7F9F7]">
      <div className="w-full max-w-md space-y-6">
        {/* Branding Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#20C875] text-white shadow-xs mx-auto mb-2">
            <Wrench className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-[#18231F] tracking-tight">
            İşEmriAl
          </h1>
          <p className="text-xs text-[#4E5C55]">
            Yeni Teknik Servis / Atölye Kaydı
          </p>
        </div>

        {/* Register Card */}
        <Card className="p-6 md:p-8 shadow-xs border-[#E5EBE7] bg-white space-y-5">
          <div className="border-b border-[#E5EBE7] pb-3">
            <h2 className="text-base font-bold text-[#18231F]">İşletmenizi Kaydedin</h2>
            <p className="text-xs text-[#4E5C55] mt-0.5">
              Bir dakikada atölyenizi kurun ve iş emirlerinizi yönetmeye başlayın.
            </p>
          </div>

          {error && (
            <Alert variant="danger" title="Kayıt Başarısız">
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <FormField id="organizationName" label="Atölye / İşletme Adı" required>
              <Input
                id="organizationName"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                placeholder="Örn: Güven Teknik Servis"
                required
              />
            </FormField>

            <FormField id="fullName" label="Yetkili Adı ve Soyadı" required>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Örn: Ali Yılmaz"
                required
              />
            </FormField>

            <FormField id="email" label="E-posta Adresi" required>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Örn: ali@guventeknik.com"
                required
              />
            </FormField>

            <FormField id="phone" label="Telefon Numarası">
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Örn: 0 (532) 555 44 33"
              />
            </FormField>

            <FormField id="password" label="Parola (En az 8 karakter)" required>
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
                Atölye Hesabı Oluştur
              </Button>
            </div>
          </form>
        </Card>

        {/* Footer Link to Login */}
        <div className="text-center text-xs text-[#4E5C55]">
          <span>Zaten bir hesabınız var mı? </span>
          <Link
            href="/login"
            className="font-bold text-[#157347] hover:underline"
          >
            Giriş Yap
          </Link>
        </div>
      </div>
    </div>
  );
}
