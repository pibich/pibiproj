import type { Metadata, Viewport } from "next";
import {
  Bricolage_Grotesque,
  JetBrains_Mono,
  Plus_Jakarta_Sans,
} from "next/font/google";
import "./globals.css";

// "Trusted Auction Floor" type system: Bricolage Grotesque (display/headings),
// Plus Jakarta Sans (body/UI default), JetBrains Mono (numbers, IDR, countdown,
// stats). Exposed as CSS variables and wired into Tailwind tokens in globals.css
// (font-display / font-sans / font-mono).
const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
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
      className={`${bricolage.variable} ${jakarta.variable} ${jetbrains.variable} h-full`}
      data-scroll-behavior="smooth"
    >
      <body className="min-h-screen flex flex-col bg-stone-50 antialiased">
        {children}
      </body>
    </html>
  );
}
