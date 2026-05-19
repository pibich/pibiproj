import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/dal";
import { AuctionCard } from "@/components/auction/AuctionCard";
import { Badge } from "@/components/ui/Badge";
import { ProfileReportSection } from "@/components/profile/ProfileReportSection";
import { formatDate, getInitials } from "@/lib/utils";
import { Calendar, Gavel, AlertTriangle, ShieldCheck, TrendingUp, Clock, Trophy, ShoppingBag } from "lucide-react";
import type { Auction, Category, Profile } from "@/types/supabase";

type AuctionWithRelations = Auction & {
  seller: Pick<Profile, "username" | "name">;
  category: Pick<Category, "name" | "slug">;
  _count: { bids: number };
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  return { title: `@${username}` };
}

export default async function ProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string; locale: string }>;
  searchParams: Promise<{ report?: string }>;
}) {
  const { username, locale } = await params;
  const { report } = await searchParams;
  const t = await getTranslations("profile");

  const supabase = await createClient();
  const currentUser = await getUser();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .single();

  if (error || !profile) notFound();

  const [auctionsResult, sellerStatsResult] = await Promise.all([
    supabase
      .from("auctions")
      .select(`*, seller:profiles!seller_id(username, name), category:categories(name, slug), bids(count)`)
      .eq("seller_id", profile.id)
      .in("status", ["active", "closed", "completed"])
      .order("created_at", { ascending: false })
      .limit(12),
    supabase
      .from("auctions")
      .select("status")
      .eq("seller_id", profile.id)
      .neq("status", "cancelled"),
  ]);

  const auctions = (auctionsResult.data ?? []) as AuctionWithRelations[];
  const sellerStats = sellerStatsResult.data ?? [];

  const activeAuctions = auctions.filter((a) => a.status === "active");
  const completedAuctions = auctions.filter(
    (a) => a.status === "completed" || a.status === "closed"
  );

  const totalAuctions = sellerStats.length;
  const completedCount = sellerStats.filter((a) => a.status === "completed").length;
  const sellerSuccessRate =
    totalAuctions > 0 ? Math.round((completedCount / totalAuctions) * 100) : null;

  const isTimedOut =
    profile.buyer_timeout_until && new Date(profile.buyer_timeout_until) > new Date();

  const canReport = currentUser && currentUser.id !== profile.id;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Profile header */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <div className="flex items-start gap-5">
          <div className="w-20 h-20 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-700 text-2xl font-bold shrink-0">
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt={profile.name}
                className="w-20 h-20 rounded-2xl object-cover"
              />
            ) : (
              getInitials(profile.name)
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <h1 className="text-xl font-bold text-gray-900">{profile.name}</h1>
                <p className="text-gray-500">@{profile.username}</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {/* Buyer warning badge */}
                {profile.buyer_warning_count > 0 && (
                  <Badge variant="warning" className="flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {profile.buyer_warning_count}x peringatan
                  </Badge>
                )}
                {/* Timeout badge */}
                {isTimedOut && (
                  <Badge variant="danger" className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Timeout
                  </Badge>
                )}
                {/* Middleman badge */}
                {profile.is_middleman && (
                  <Badge variant="success" className="flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" />
                    Middleman
                  </Badge>
                )}
                {/* Positive rating badges */}
                {(profile.successful_sales ?? 0) > 0 && (
                  <Badge variant="success" className="flex items-center gap-1">
                    <Trophy className="h-3 w-3" />
                    {profile.successful_sales} penjualan sukses
                  </Badge>
                )}
                {(profile.successful_purchases ?? 0) > 0 && (
                  <Badge variant="success" className="flex items-center gap-1">
                    <ShoppingBag className="h-3 w-3" />
                    {profile.successful_purchases} pembelian sukses
                  </Badge>
                )}
                {canReport && (
                  <ProfileReportSection
                    reportedUserId={profile.id}
                    reportedUsername={profile.username}
                    openReport={report === "true"}
                  />
                )}
              </div>
            </div>
            <div className="flex items-center gap-4 mt-3 text-sm text-gray-500 flex-wrap">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {t("joinedAt", { date: formatDate(profile.created_at, "id") })}
              </span>
              <span className="flex items-center gap-1">
                <Gavel className="h-4 w-4" />
                {activeAuctions.length} {t("activeAuctions")}
              </span>
              {/* Seller success rate */}
              {sellerSuccessRate !== null ? (
                <span
                  className={`flex items-center gap-1 font-medium ${
                    sellerSuccessRate >= 60 ? "text-green-600" : "text-yellow-600"
                  }`}
                >
                  <TrendingUp className="h-4 w-4" />
                  {sellerSuccessRate}% berhasil
                </span>
              ) : (
                <span className="flex items-center gap-1 text-gray-400 text-xs">
                  <TrendingUp className="h-3.5 w-3.5" />
                  Belum ada riwayat lelang
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Active auctions */}
      {activeAuctions.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t("activeAuctions")}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {activeAuctions.map((a) => (
              <AuctionCard key={a.id} auction={a} />
            ))}
          </div>
        </div>
      )}

      {/* Completed auctions */}
      {completedAuctions.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t("completedAuctions")}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {completedAuctions.map((a) => (
              <AuctionCard key={a.id} auction={a} />
            ))}
          </div>
        </div>
      )}

      {auctions.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <Gavel className="h-10 w-10 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">Belum ada lelang</p>
        </div>
      )}
    </div>
  );
}
