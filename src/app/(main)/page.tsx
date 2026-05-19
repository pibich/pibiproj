import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AuctionCard } from "@/components/auction/AuctionCard";
import { Button } from "@/components/ui/Button";
import { FeaturesCarousel } from "@/components/home/FeaturesCarousel";
import { Gavel, ArrowRight, Sparkles } from "lucide-react";
import type { Auction, Category, Profile } from "@/types/supabase";

export const metadata: Metadata = { title: "TCG Marketplace — Lelang Kartu TCG Terpercaya" };

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
      `*, seller:profiles!seller_id(username, name), category:categories(name, slug), bids(count)`
    )
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(8);

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
    <div className="flex flex-col gap-16 pb-16">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-500 text-white py-24 px-4">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-sky-300/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-400/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm font-medium mb-6 border border-white/30">
            <Sparkles className="h-3.5 w-3.5 text-sky-200" />
            Platform TCG #1 di Indonesia
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-5 leading-tight tracking-tight">
            Lelang Kartu TCG Terpercaya
          </h1>
          <p className="text-lg text-sky-100 mb-8 max-w-2xl mx-auto leading-relaxed">
            Platform lelang kartu TCG terpercaya. Temukan kartu langka, bid secara real-time,
            dan bertransaksi dengan aman.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/auctions">
              <Button
                size="lg"
                className="bg-white text-sky-600 hover:bg-sky-50 shadow-lg shadow-sky-900/20 border-0 from-white to-white"
              >
                <Gavel className="h-5 w-5" />
                Lihat Semua Lelang
              </Button>
            </Link>
            <Link href="/register">
              <Button
                size="lg"
                variant="outline"
                className="border-white/50 text-white hover:bg-white/15 bg-white/10 backdrop-blur-sm"
              >
                Daftar Gratis
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="mt-12 flex items-center justify-center gap-8 flex-wrap">
            {[
              { value: "100%", label: "Terpercaya" },
              { value: "Real-Time", label: "Sistem Bid" },
              { value: `${categoryCount ?? 0} Game`, label: "TCG Supported" },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <div className="text-2xl font-bold text-white">{value}</div>
                <div className="text-sm text-sky-200">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Active auctions */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Lelang Aktif</h2>
            <p className="text-sm text-slate-500 mt-0.5">Lelang yang sedang berjalan sekarang</p>
          </div>
          <Link href="/auctions">
            <Button variant="outline" size="sm">
              Lihat Semua
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>

        {auctions.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-sky-100 shadow-sm">
            <div className="w-16 h-16 bg-sky-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Gavel className="h-8 w-8 text-sky-300" />
            </div>
            <p className="text-slate-500 mb-4">Belum ada lelang</p>
            <Link href="/auctions/create" className="inline-block">
              <Button size="sm">Buat Lelang</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {auctions.map((auction) => (
              <AuctionCard key={auction.id} auction={auction} />
            ))}
          </div>
        )}
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Mengapa TCG Marketplace?</h2>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            Semua yang kamu butuhkan untuk transaksi kartu TCG yang aman dan mudah
          </p>
        </div>
        <FeaturesCarousel />
      </section>
    </div>
  );
}
