import type { Metadata } from "next";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import ClientWrapper from "./ClientWrapper";

export const metadata: Metadata = {
  title: "Aura Spa ERP - Premium Klinik Yönetimi",
  description: "Gelişmiş Spa, Klinik ve Salon Yönetim Sistemi",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body>
        <StoreProvider>
          <ClientWrapper>
            {children}
          </ClientWrapper>
        </StoreProvider>
      </body>
    </html>
  );
}
