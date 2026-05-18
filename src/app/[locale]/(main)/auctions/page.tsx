import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { AuctionCard } from "@/components/auction/AuctionCard";
import type { Auction, Category, Profile } from "@/types/supabase";

type AuctionWithRelations = Auction & {
  seller: Pick<Profile, "username" | "name">;
  category: Pick<Category, "name" | "slug">;
  _count: { bids: number };
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auction");
  return { title: t("title") };
}

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
  const t = await getTranslations("auction");
  const supabase = await createClient();

  // Fetch categories — "Lainnya" always last
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

  // Build auction query
  let query = supabase
    .from("auctions")
    .select(
      `*, seller:profiles!seller_id(username, name), category:categories(name, slug), bids(count)`
    )
    .neq("status", "draft");

  if (params.status) {
    query = query.eq("status", params.status as Auction["status"]);
  } else {
    query = query.eq("status", "active");
  }
  if (params.category) query = query.eq("category_id", params.category);
  if (params.condition) query = query.eq("condition", params.condition as Auction["condition"]);
  if (params.q) query = query.ilike("title", `%${params.q}%`);

  // Sort
  switch (params.sort) {
    case "ending_soon":
      query = query.order("end_time", { ascending: true });
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

  const conditions = [
    "mint", "near_mint", "excellent", "good", "light_play", "heavy_play", "damaged",
  ];
  const statuses = ["active", "closed", "completed"];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t("title")}</h1>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Filters sidebar */}
        <aside className="w-full lg:w-56 shrink-0">
          <form className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-5">
            {/* Search */}
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

            {/* Category */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">
                {t("category")}
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
                {(categories ?? []).map((cat) => (
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

            {/* Condition */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">
                {t("condition")}
              </label>
              <select
                name="condition"
                defaultValue={params.condition ?? ""}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Semua</option>
                {conditions.map((c) => (
                  <option key={c} value={c}>
                    {t(`conditions.${c}`)}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">
                {t("sortBy")}
              </label>
              <select
                name="sort"
                defaultValue={params.sort ?? "newest"}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="newest">{t("sort.newest")}</option>
                <option value="ending_soon">{t("sort.ending_soon")}</option>
                <option value="price_low">{t("sort.price_low")}</option>
                <option value="price_high">{t("sort.price_high")}</option>
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
            <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
              <p className="text-gray-500">{t("noAuctions")}</p>
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
