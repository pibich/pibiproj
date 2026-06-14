import type { Metadata, Viewport } from "next";
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
  title: {
    default: "TCG Auction — Lelang Kartu TCG Terpercaya",
    template: "%s | TCG Auction",
  },
  description:
    "Platform lelang kartu TCG (Pokemon, MTG, Yu-Gi-Oh!, One Piece) terpercaya di Indonesia.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  interactiveWidget: "resizes-content",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
      data-scroll-behavior="smooth"
    >
      <body className="h-full flex flex-col bg-stone-50 antialiased">
        {children}
      </body>
    </html>
  );
}
