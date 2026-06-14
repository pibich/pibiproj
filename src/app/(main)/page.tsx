import { ArrowRight, Gavel, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AuctionCard } from "@/components/auction/AuctionCard";
import { FeaturesCarousel } from "@/components/home/FeaturesCarousel";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/server";
import type { Auction, Category, Profile } from "@/types/supabase";

export const metadata: Metadata = {
  title: "TCG Auction — Lelang Kartu TCG Terpercaya",
};

type AuctionWithRelations = Auction & {
  seller: Pick<Profile, "username" | "name">;
  category: Pick<Category, "name" | "slug">;
  _count: { bids: number };
};

async function getFeaturedAuctions() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("auctions")
    .select(
      `*, seller:profiles!seller_id(username, name), category:categories(name, slug), bids(count)`,
    )
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(20);

  return (data ?? []) as unknown as AuctionWithRelations[];
}

export default async function HomePage() {
  const supabase = await createClient();
  const [auctions] = await Promise.all([getFeaturedAuctions()]);

  const { count: categoryCount } = await supabase
    .from("categories")
    .select("*", { count: "exact", head: true })
    .not("slug", "eq", "lainnya");

  return (
    <div className="flex flex-col gap-8 sm:gap-12 pb-16">
      {/* Hero — compact banner so the auction grid leads the page */}
      <section className="relative overflow-hidden bg-gradient-to-br from-teal-600 via-teal-700 to-emerald-800 text-white">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-72 h-72 bg-emerald-300/20 rounded-full blur-3xl animate-float" />
          <div
            className="absolute -bottom-24 -left-20 w-72 h-72 bg-teal-300/20 rounded-full blur-3xl animate-float"
            style={{ animationDelay: "1.2s" }}
          />
          {/* Subtle dotted texture */}
          <div className="absolute inset-0 opacity-[0.07] [background-image:radial-gradient(circle,white_1px,transparent_1px)] [background-size:22px_22px]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 animate-fade-in-up">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1 text-xs sm:text-sm font-medium mb-3 border border-white/25">
                <Sparkles className="h-3.5 w-3.5 text-emerald-200" />
                Platform TCG #1 di Indonesia
              </div>
              <h1 className="text-2xl sm:text-4xl font-bold mb-2.5 leading-tight tracking-tight">
                Lelang Kartu TCG{" "}
                <span className="bg-gradient-to-r from-emerald-200 to-teal-100 bg-clip-text text-transparent">
                  Terpercaya
                </span>
              </h1>
              <p className="text-sm sm:text-base text-teal-50/90 max-w-xl leading-relaxed">
                Temukan kartu langka, bid real-time, dan bertransaksi aman lewat
                sistem middleman tepercaya.
              </p>
            </div>

            <div className="flex flex-col gap-4 shrink-0">
              <div className="flex gap-2.5 flex-wrap">
                <Link href="/auctions">
                  <Button
                    size="md"
                    className="bg-white text-teal-600 hover:bg-slate-50 shadow-lg shadow-teal-900/20 border-0 from-white to-white"
                  >
                    <Gavel className="h-4 w-4" />
                    Lihat Semua Lelang
                  </Button>
                </Link>
                <Link href="/register">
                  <Button
                    size="md"
                    variant="outline"
                    className="border-white/50 text-white hover:bg-white/15 bg-white/10 backdrop-blur-sm"
                  >
                    Daftar Gratis
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
              <div className="flex items-center gap-6 flex-wrap">
                {[
                  { value: "100%", label: "Terpercaya" },
                  { value: "Real-Time", label: "Sistem Bid" },
                  {
                    value: `${categoryCount ?? 0} Game`,
                    label: "TCG Supported",
                  },
                ].map(({ value, label }) => (
                  <div key={label}>
                    <div className="text-lg font-bold text-white leading-none">
                      {value}
                    </div>
                    <div className="text-xs text-teal-100 mt-1">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Active auctions */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Lelang Aktif</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Lelang yang sedang berjalan sekarang
            </p>
          </div>
          <Link href="/auctions">
            <Button variant="outline" size="sm">
              Lihat Semua
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>

        {auctions.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Gavel className="h-8 w-8 text-slate-300" />
            </div>
            <p className="text-slate-500 mb-4">Belum ada lelang</p>
            <Link href="/auctions/create" className="inline-block">
              <Button size="sm">Buat Lelang</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {auctions.map((auction) => (
              <AuctionCard key={auction.id} auction={auction} />
            ))}
          </div>
        )}
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">
            Mengapa TCG Auction?
          </h2>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            Semua yang kamu butuhkan untuk transaksi kartu TCG yang aman dan
            mudah
          </p>
        </div>
        <FeaturesCarousel />
      </section>
    </div>
  );
}
