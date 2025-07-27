import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://www.fareja.ai'),
  title: "Fareja - As Melhores Promoções e Ofertas",
  description: "Descubra as melhores promoções e ofertas online. Cupons de desconto, ofertas relâmpago e muito mais!",
  openGraph: {
    title: "Fareja - As Melhores Promoções e Ofertas",
    description: "Descubra as melhores promoções e ofertas online. Cupons de desconto, ofertas relâmpago e muito mais!",
    url: process.env.NEXT_PUBLIC_BASE_URL || 'https://www.fareja.ai',
    siteName: 'Fareja',
    locale: 'pt_BR',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
