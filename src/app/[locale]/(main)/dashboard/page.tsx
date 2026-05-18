import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { AuctionCard } from "@/components/auction/AuctionCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatIDR, formatDate } from "@/lib/utils";
import { Gavel, Package, Eye, Plus, Trophy } from "lucide-react";
import type { Auction, Category, Profile } from "@/types/supabase";

type AuctionWithRelations = Auction & {
  seller: Pick<Profile, "username" | "name">;
  category: Pick<Category, "name" | "slug">;
  _count: { bids: number };
};

type BidWithAuction = {
  id: string;
  amount: number;
  is_winning: boolean;
  created_at: string;
  auction: Pick<Auction, "id" | "title" | "current_price" | "status" | "end_time" | "images"> | null;
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("dashboard");
  return { title: t("title") };
}

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("dashboard");
  const user = await getUser();

  if (!user) redirect(`/${locale}/login`);

  const supabase = await createClient();

  const [
    { data: myAuctions },
    { data: myBids },
    { data: wonAuctions },
  ] = await Promise.all([
    supabase
      .from("auctions")
      .select(`*, seller:profiles!seller_id(username, name), category:categories(name, slug), bids(count)`)
      .eq("seller_id", user.id)
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("bids")
      .select(`*, auction:auctions(id, title, current_price, status, end_time, images)`)
      .eq("bidder_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("auctions")
      .select(`*, seller:profiles!seller_id(username, name), category:categories(name, slug), bids(count)`)
      .eq("winner_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(4),
  ]);

  const typedBids = (myBids ?? []) as unknown as BidWithAuction[];
  const activeAuctions = (myAuctions ?? []).filter((a) => a.status === "active");

  const stats = [
    { label: "Lelang Aktif", value: activeAuctions.length, icon: Gavel, color: "text-blue-600" },
    { label: "Total Bid", value: typedBids.length, icon: Package, color: "text-purple-600" },
    { label: "Lelang Dimenangkan", value: wonAuctions?.length ?? 0, icon: Trophy, color: "text-green-600" },
    { label: "Pelanggaran", value: user.violation_count, icon: Eye, color: user.violation_count > 0 ? "text-red-600" : "text-gray-600" },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Selamat datang, {user.name}!
          </p>
        </div>
        <Link href={`/${locale}/auctions/create`}>
          <Button>
            <Plus className="h-4 w-4" />
            Buat Lelang
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon className={`h-4 w-4 ${color}`} />
              <span className="text-xs text-gray-500">{label}</span>
            </div>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Violation warning */}
      {user.violation_count > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-sm text-orange-700">
          ⚠️ Akun Anda memiliki <strong>{user.violation_count} pelanggaran</strong> terkonfirmasi.
          Setelah 3 pelanggaran, akun akan diblacklist otomatis.
        </div>
      )}

      {/* My Auctions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">{t("myAuctions")}</h2>
        </div>

        {(myAuctions ?? []).length === 0 ? (
          <div className="text-center py-10 bg-white rounded-xl border border-gray-200">
            <Gavel className="h-10 w-10 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">{t("noAuctions")}</p>
            <Link href={`/${locale}/auctions/create`} className="mt-3 inline-block">
              <Button size="sm">Buat Lelang Pertama</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {(myAuctions ?? []).map((auction) => (
              <AuctionCard
                key={auction.id}
                auction={auction as unknown as AuctionWithRelations}
              />
            ))}
          </div>
        )}
      </div>

      {/* My Bids */}
      {typedBids.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t("myBids")}</h2>
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {typedBids.map((bid) => (
              <Link
                key={bid.id}
                href={`/${locale}/auctions/${bid.auction?.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                    {bid.auction?.images?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={bid.auction.images[0]}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Gavel className="h-4 w-4 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 line-clamp-1">
                      {bid.auction?.title ?? "Lelang"}
                    </p>
                    <p className="text-xs text-gray-500">
                      Bid saya: {formatIDR(bid.amount)}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-blue-600">
                    {formatIDR(bid.auction?.current_price ?? 0)}
                  </p>
                  <Badge
                    variant={
                      bid.is_winning
                        ? "success"
                        : bid.auction?.status === "closed"
                        ? "default"
                        : "warning"
                    }
                    className="text-xs"
                  >
                    {bid.is_winning ? "Tertinggi" : "Kalah"}
                  </Badge>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
