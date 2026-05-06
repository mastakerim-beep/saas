import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import { StoreProvider } from "@/lib/store";
import ClientWrapper from "./ClientWrapper";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Aura Spa ERP - Premium Klinik Yönetimi",
  description: "Gelişmiş Spa, Klinik ve Salon Yönetim Sistemi",
  manifest: "/manifest.json",
  themeColor: "#4F46E5",
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans`}>
        <StoreProvider>
          <ClientWrapper>
            {children}
          </ClientWrapper>
        </StoreProvider>
      </body>
    </html>
  );
}
