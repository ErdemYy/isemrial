import { notFound } from "next/navigation";
import DesignSystemClient from "./DesignSystemClient";

export default function DesignSystemPage() {
  // Faz 2 & Faz 3 Güvenlik Kuralı: Geliştirici vitrini üretim ortamında erişilemez olmalıdır.
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return <DesignSystemClient />;
}
