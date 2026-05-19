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
  title: {
    default: "TCG Marketplace — Lelang Kartu TCG Terpercaya",
    template: "%s | TCG Marketplace",
  },
  description:
    "Platform lelang kartu TCG (Pokemon, MTG, Yu-Gi-Oh!, One Piece) terpercaya di Indonesia.",
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
      <body className="min-h-full flex flex-col bg-sky-50 antialiased">
        {children}
      </body>
    </html>
  );
}
