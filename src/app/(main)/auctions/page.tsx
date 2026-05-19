import type { Metadata } from "next";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { AuctionCard } from "@/components/auction/AuctionCard";
import { AuctionStatusTabs } from "@/components/auction/AuctionStatusTabs";
import { Gavel, Clock } from "lucide-react";
import type { Auction, Category, Profile } from "@/types/supabase";

export const metadata: Metadata = { title: "Lelang" };

type AuctionWithRelations = Auction & {
  seller: Pick<Profile, "username" | "name">;
  category: Pick<Category, "name" | "slug">;
  _count: { bids: number };
};

const conditionLabels: Record<string, string> = {
  mint: "Mint",
  near_mint: "Near Mint",
  excellent: "Excellent",
  good: "Good",
  light_play: "Light Play",
  heavy_play: "Heavy Play",
  damaged: "Damaged",
};

export default async function AuctionsPage({
  searchParams,
}: {
  searchParams: Promise<{
    category?: string;
    condition?: string;
    status?: string;
    sort?: string;
    q?: string;
  }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const isEnded = params.status === "ended";

  const { data: rawCategories } = await supabase
    .from("categories")
    .select("*")
    .order("name");

  const categories = (rawCategories ?? []).sort((a, b) => {
    const aOther = /lainnya/i.test(a.name);
    const bOther = /lainnya/i.test(b.name);
    if (aOther && !bOther) return 1;
    if (!aOther && bOther) return -1;
    return 0;
  });

  let query = supabase
    .from("auctions")
    .select(
      `*, seller:profiles!seller_id(username, name), category:categories(name, slug), bids(count)`
    )
    .neq("status", "draft")
    .neq("status", "cancelled");

  if (isEnded) {
    query = query.in("status", ["completed", "closed"]);
  } else {
    query = query.eq("status", "active");
  }

  if (params.category) query = query.eq("category_id", params.category);
  if (params.condition) query = query.eq("condition", params.condition as Auction["condition"]);
  if (params.q) query = query.ilike("title", `%${params.q}%`);

  // Default sort: ending_soon for active, most recently ended for selesai
  const effectiveSort = params.sort ?? (isEnded ? "recently_ended" : "ending_soon");
  switch (effectiveSort) {
    case "ending_soon":
      query = query.order("end_time", { ascending: true });
      break;
    case "recently_ended":
      query = query.order("end_time", { ascending: false });
      break;
    case "price_low":
      query = query.order("current_price", { ascending: true });
      break;
    case "price_high":
      query = query.order("current_price", { ascending: false });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }

  const { data: auctions } = await query.limit(48);
  const typedAuctions = (auctions ?? []) as unknown as AuctionWithRelations[];
  const conditions = Object.keys(conditionLabels);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header + status tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lelang</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {isEnded ? "Menampilkan lelang yang telah selesai" : "Menampilkan lelang yang sedang berlangsung"}
          </p>
        </div>
        <Suspense>
          <AuctionStatusTabs />
        </Suspense>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Filters sidebar */}
        <aside className="w-full lg:w-56 shrink-0">
          <form className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-5">
            {/* Preserve status param when submitting other filters */}
            <input type="hidden" name="status" value={isEnded ? "ended" : ""} />

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">
                Cari
              </label>
              <input
                name="q"
                defaultValue={params.q}
                placeholder="Nama kartu..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">
                Kategori
              </label>
              <div className="flex flex-col gap-1">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="category"
                    value=""
                    defaultChecked={!params.category}
                    className="accent-blue-600"
                  />
                  Semua
                </label>
                {categories.map((cat) => (
                  <label key={cat.id} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="category"
                      value={cat.id}
                      defaultChecked={params.category === cat.id}
                      className="accent-blue-600"
                    />
                    {cat.name}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">
                Kondisi
              </label>
              <select
                name="condition"
                defaultValue={params.condition ?? ""}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Semua</option>
                {conditions.map((c) => (
                  <option key={c} value={c}>
                    {conditionLabels[c]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">
                Urutkan
              </label>
              <select
                name="sort"
                defaultValue={effectiveSort}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {isEnded ? (
                  <>
                    <option value="recently_ended">Terbaru Selesai</option>
                    <option value="price_high">Harga Tertinggi</option>
                    <option value="price_low">Harga Terendah</option>
                    <option value="newest">Terbaru Dibuat</option>
                  </>
                ) : (
                  <>
                    <option value="ending_soon">Segera Berakhir</option>
                    <option value="newest">Terbaru Dibuat</option>
                    <option value="price_low">Harga Terendah</option>
                    <option value="price_high">Harga Tertinggi</option>
                  </>
                )}
              </select>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Terapkan Filter
            </button>
          </form>
        </aside>

        {/* Grid */}
        <div className="flex-1">
          <p className="text-sm text-gray-500 mb-4">
            {typedAuctions.length} lelang ditemukan
          </p>

          {typedAuctions.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-200 flex flex-col items-center gap-3">
              {isEnded ? (
                <>
                  <Clock className="h-10 w-10 text-gray-300" />
                  <p className="text-gray-500 font-medium">Belum ada lelang yang selesai</p>
                  <p className="text-sm text-gray-400">Coba ubah filter atau kembali lagi nanti</p>
                </>
              ) : (
                <>
                  <Gavel className="h-10 w-10 text-gray-300" />
                  <p className="text-gray-500 font-medium">Belum ada lelang aktif</p>
                  <p className="text-sm text-gray-400">Coba ubah filter atau kembali lagi nanti</p>
                </>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
              {typedAuctions.map((auction) => (
                <AuctionCard key={auction.id} auction={auction} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
