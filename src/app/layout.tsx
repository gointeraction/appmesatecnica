import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClientToaster } from "@/components/client-toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mesa Técnica de Criptoactivos - CAVECOM-e",
  description: "Plataforma de gestión de consultas técnicas sobre criptoactivos y comercio electrónico de la Cámara Venezolana de Comercio Electrónico.",
  keywords: ["CAVECOM-e", "Criptoactivos", "Comercio Electrónico", "Venezuela", "Consultas Técnicas", "Mesa Técnica"],
  authors: [{ name: "CAVECOM-e" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "Mesa Técnica de Criptoactivos - CAVECOM-e",
    description: "Plataforma de gestión de consultas técnicas sobre criptoactivos y comercio electrónico",
    url: "https://cavecom-e.org",
    siteName: "Mesa Técnica CAVECOM-e",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mesa Técnica de Criptoactivos - CAVECOM-e",
    description: "Plataforma de gestión de consultas técnicas sobre criptoactivos y comercio electrónico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
        suppressHydrationWarning
      >
        {children}
        <ClientToaster />
      </body>
    </html>
  );
}
