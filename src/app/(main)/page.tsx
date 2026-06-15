import { createClient as createAdminClient } from "@supabase/supabase-js";
import type { Metadata } from "next";
import { Suspense } from "react";
import { AuctionBrowser } from "@/components/auction/AuctionBrowser";
import { CategoryRail } from "@/components/home/CategoryRail";
import type { FeaturedAuction } from "@/components/home/FeaturedLot";
import { Hero } from "@/components/home/Hero";
import { createNotification } from "@/lib/notifications";
import { createClient } from "@/lib/supabase/server";
import type { Auction, Category, Database, Profile } from "@/types/supabase";

export const metadata: Metadata = {
  title: "TCG Auction — Lelang Kartu TCG Terpercaya",
};

type AuctionWithRelations = Auction & {
  seller: Pick<Profile, "username" | "name">;
  category: Pick<Category, "name" | "slug">;
  _count: { bids: number };
};

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{
    category?: string;
    condition?: string;
    status?: string;
    sort?: string;
    q?: string;
    buy?: string;
    free?: string;
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

  // Categories (real games first, "lainnya" last)
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

  // Hero stats
  const [
    { count: activeCount },
    { count: totalBids },
    { count: categoryCount },
  ] = await Promise.all([
    supabase
      .from("auctions")
      .select("*", { count: "exact", head: true })
      .eq("status", "active"),
    supabase.from("bids").select("*", { count: "exact", head: true }),
    supabase
      .from("categories")
      .select("*", { count: "exact", head: true })
      .not("slug", "eq", "lainnya"),
  ]);

  // Featured lot — priciest active auction
  const { data: featuredRows } = await supabase
    .from("auctions")
    .select(
      `*, seller:profiles!seller_id(username, name), category:categories(name, slug), bids(count)`,
    )
    .eq("status", "active")
    .order("current_price", { ascending: false })
    .limit(1);
  const featuredRaw = featuredRows?.[0] as
    | (FeaturedAuction & { bids?: { count: number }[] })
    | undefined;
  const featured: FeaturedAuction | null = featuredRaw
    ? { ...featuredRaw, bidCount: featuredRaw.bids?.[0]?.count ?? 0 }
    : null;

  // Filtered grid query
  let query = supabase
    .from("auctions")
    .select(
      `*, seller:profiles!seller_id(username, name), category:categories(name, slug), bids(count)`,
    )
    .neq("status", "draft")
    .neq("status", "cancelled");

  if (isEnded) {
    query = query.in("status", ["completed", "closed"]);
  } else {
    query = query.eq("status", "active");
  }

  if (params.category) query = query.eq("category_id", params.category);
  if (params.condition)
    query = query.eq("condition", params.condition as Auction["condition"]);
  if (params.q) query = query.ilike("title", `%${params.q}%`);
  if (params.buy === "1") query = query.not("buy_now_price", "is", null);
  if (params.free === "1") query = query.eq("free_shipping", true);

  const effectiveSort =
    params.sort ?? (isEnded ? "recently_ended" : "ending_soon");
  switch (effectiveSort) {
    case "ending_soon":
      query = query.order("end_time", { ascending: true });
      break;
    case "recently_ended":
      query = query.order("end_time", { ascending: false });
      break;
    case "popular":
      query = query.order("view_count", { ascending: false });
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

  // Attach each seller's average review rating for the card footer
  const sellerIds = [...new Set(typedAuctions.map((a) => a.seller_id))];
  if (sellerIds.length) {
    const { data: reviewRows } = await supabase
      .from("reviews")
      .select("seller_id, rating")
      .in("seller_id", sellerIds);
    const agg = new Map<string, { sum: number; n: number }>();
    for (const r of reviewRows ?? []) {
      const cur = agg.get(r.seller_id) ?? { sum: 0, n: 0 };
      cur.sum += r.rating;
      cur.n += 1;
      agg.set(r.seller_id, cur);
    }
    for (const a of typedAuctions) {
      const s = agg.get(a.seller_id);
      (
        a as AuctionWithRelations & { sellerRating?: number | null }
      ).sellerRating = s ? s.sum / s.n : null;
    }
  }

  return (
    <div className="flex flex-col">
      <Hero
        featured={featured}
        stats={[
          { value: String(activeCount ?? 0), label: "Lelang aktif sekarang" },
          {
            value: (totalBids ?? 0).toLocaleString("id-ID"),
            label: "Tawaran masuk",
          },
          { value: `${categoryCount ?? 0}`, label: "Game TCG didukung" },
          { value: "100%", label: "Transaksi terjamin" },
        ]}
      />

      <CategoryRail
        categories={categories}
        activeCategory={params.category}
        totalActive={activeCount ?? 0}
      />

      <section id="lelang" className="scroll-mt-16 pt-2">
        <Suspense>
          <AuctionBrowser
            auctions={typedAuctions}
            totalActive={activeCount ?? 0}
          />
        </Suspense>
      </section>
    </div>
  );
}
