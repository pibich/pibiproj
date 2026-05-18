import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AuctionCard } from "@/components/auction/AuctionCard";
import { Button } from "@/components/ui/Button";
import { Gavel, Shield, MessageCircle, TrendingUp, ArrowRight, Sparkles } from "lucide-react";
import type { Auction, Category, Profile } from "@/types/supabase";

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

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations();
  const [auctions, supabase] = await Promise.all([getFeaturedAuctions(), createClient()]);

  const { count: categoryCount } = await supabase
    .from("categories")
    .select("*", { count: "exact", head: true })
    .not("slug", "eq", "lainnya");

  const features = [
    {
      icon: Gavel,
      title: "Sistem Lelang Real-Time",
      desc: "Bid langsung dan pantau harga secara real-time hingga lelang berakhir.",
      color: "from-sky-400 to-blue-500",
      bg: "bg-sky-50",
    },
    {
      icon: Shield,
      title: "Sistem Blacklist",
      desc: "Cek daftar penjual/pembeli bermasalah sebelum bertransaksi.",
      color: "from-emerald-400 to-teal-500",
      bg: "bg-emerald-50",
    },
    {
      icon: MessageCircle,
      title: "Chat Langsung",
      desc: "Komunikasi langsung dengan penjual sebelum dan sesudah lelang.",
      color: "from-violet-400 to-purple-500",
      bg: "bg-violet-50",
    },
    {
      icon: TrendingUp,
      title: "Komunitas TCG",
      desc: "Platform khusus kolektor kartu Pokémon, MTG, Yugioh, dan One Piece.",
      color: "from-amber-400 to-orange-500",
      bg: "bg-amber-50",
    },
  ];

  return (
    <div className="flex flex-col gap-16 pb-16">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-500 text-white py-24 px-4">
        {/* Background decorations */}
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
            {t("common.tagline")}
          </h1>
          <p className="text-lg text-sky-100 mb-8 max-w-2xl mx-auto leading-relaxed">
            Platform lelang kartu TCG terpercaya. Temukan kartu langka, bid secara real-time,
            dan bertransaksi dengan aman.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href={`/${locale}/auctions`}>
              <Button
                size="lg"
                className="bg-white text-sky-600 hover:bg-sky-50 shadow-lg shadow-sky-900/20 border-0 from-white to-white"
              >
                <Gavel className="h-5 w-5" />
                Lihat Semua Lelang
              </Button>
            </Link>
            <Link href={`/${locale}/register`}>
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

          {/* Stats */}
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
            <h2 className="text-2xl font-bold text-slate-800">
              {t("auction.activeAuctions")}
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">Lelang yang sedang berjalan sekarang</p>
          </div>
          <Link href={`/${locale}/auctions`}>
            <Button variant="outline" size="sm">
              {t("common.seeAll")}
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>

        {auctions.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-sky-100 shadow-sm">
            <div className="w-16 h-16 bg-sky-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Gavel className="h-8 w-8 text-sky-300" />
            </div>
            <p className="text-slate-500 mb-4">{t("auction.noAuctions")}</p>
            <Link href={`/${locale}/auctions/create`} className="inline-block">
              <Button size="sm">{t("auction.createAuction")}</Button>
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
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">
            Mengapa TCG Marketplace?
          </h2>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            Semua yang kamu butuhkan untuk transaksi kartu TCG yang aman dan mudah
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map(({ icon: Icon, title, desc, color, bg }) => (
            <div
              key={title}
              className="bg-white rounded-2xl border border-sky-100 p-6 flex flex-col gap-3 hover:shadow-md hover:shadow-sky-100/50 hover:-translate-y-0.5 transition-all duration-300 group"
            >
              <div className={`w-11 h-11 ${bg} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                <div className={`w-7 h-7 bg-gradient-to-br ${color} rounded-lg flex items-center justify-center`}>
                  <Icon className="h-4 w-4 text-white" />
                </div>
              </div>
              <h3 className="font-semibold text-slate-800">{title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
