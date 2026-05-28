import { createClient as createAdminClient } from "@supabase/supabase-js";
import { Clock, Gavel } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { AuctionCard } from "@/components/auction/AuctionCard";
import { AuctionFilters } from "@/components/auction/AuctionFilters";
import { AuctionFiltersMobile } from "@/components/auction/AuctionFiltersMobile";
import { AuctionStatusTabs } from "@/components/auction/AuctionStatusTabs";
import { createNotification } from "@/lib/notifications";
import { createClient } from "@/lib/supabase/server";
import type { Auction, Category, Database, Profile } from "@/types/supabase";

export const metadata: Metadata = { title: "Lelang" };

type AuctionWithRelations = Auction & {
  seller: Pick<Profile, "username" | "name">;
  category: Pick<Category, "name" | "slug">;
  _count: { bids: number };
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

  // Lazy close: move any expired active auctions to "closed" before rendering
  const db = createAdminClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
  const now = new Date().toISOString();
  const { data: justExpired } = await db
    .from("auctions")
    .select("id, seller_id, winner_id")
    .eq("status", "active")
    .lt("end_time", now);
  if (justExpired?.length) {
    await db
      .from("auctions")
      .update({ status: "closed" })
      .in(
        "id",
        justExpired.map((a) => a.id),
      );
    for (const auction of justExpired) {
      await createNotification(db, {
        user_id: auction.seller_id,
        type: "auction_ended",
        auction_id: auction.id,
      });
      if (auction.winner_id) {
        await createNotification(db, {
          user_id: auction.winner_id,
          type: "auction_won",
          auction_id: auction.id,
        });
      }
    }
  }

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
      `*, seller:profiles!seller_id(username, name), category:categories(name, slug), bids(count)`,
    )
    .in("status", ["active", "closed", "completed"]);

  if (isEnded) {
    query = query.in("status", ["completed", "closed"]);
  } else {
    query = query.eq("status", "active");
  }

  if (params.category) query = query.eq("category_id", params.category);
  if (params.condition)
    query = query.eq("condition", params.condition as Auction["condition"]);
  if (params.q) query = query.ilike("title", `%${params.q}%`);

  // Default sort: ending_soon for active, most recently ended for selesai
  const effectiveSort =
    params.sort ?? (isEnded ? "recently_ended" : "ending_soon");
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header + status tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lelang</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {isEnded
              ? "Menampilkan lelang yang telah selesai"
              : "Menampilkan lelang yang sedang berlangsung"}
          </p>
        </div>
        <Suspense>
          <AuctionStatusTabs />
        </Suspense>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Filters sidebar — desktop only */}
        <aside className="hidden lg:block w-56 shrink-0">
          <AuctionFilters
            categories={categories}
            initialCategory={params.category ?? ""}
            initialCondition={params.condition ?? ""}
            initialQ={params.q ?? ""}
            isEnded={isEnded}
            effectiveSort={effectiveSort}
          />
        </aside>

        {/* Grid */}
        <div className="flex-1">
          {/* Mobile filter trigger */}
          <div className="lg:hidden mb-4">
            <AuctionFiltersMobile
              categories={categories}
              initialCategory={params.category ?? ""}
              initialCondition={params.condition ?? ""}
              initialQ={params.q ?? ""}
              isEnded={isEnded}
              effectiveSort={effectiveSort}
            />
          </div>

          <p className="text-sm text-gray-500 mb-4">
            {typedAuctions.length} lelang ditemukan
          </p>

          {typedAuctions.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-200 flex flex-col items-center gap-3">
              {isEnded ? (
                <>
                  <Clock className="h-10 w-10 text-gray-300" />
                  <p className="text-gray-500 font-medium">
                    Belum ada lelang yang selesai
                  </p>
                  <p className="text-sm text-gray-400">
                    Coba ubah filter atau kembali lagi nanti
                  </p>
                </>
              ) : (
                <>
                  <Gavel className="h-10 w-10 text-gray-300" />
                  <p className="text-gray-500 font-medium">
                    Belum ada lelang aktif
                  </p>
                  <p className="text-sm text-gray-400">
                    Coba ubah filter atau kembali lagi nanti
                  </p>
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
