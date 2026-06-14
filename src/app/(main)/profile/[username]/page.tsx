import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Gavel,
  MapPin,
  MessageSquare,
  Package,
  ShieldCheck,
  ShoppingBag,
  Star,
  TrendingUp,
  Trophy,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MobileBackBar } from "@/components/layout/MobileBackBar";
import { MobileAccountMenu } from "@/components/profile/MobileAccountMenu";
import { MyAuctionsTab } from "@/components/profile/MyAuctionsTab";
import { MyBidsTab } from "@/components/profile/MyBidsTab";
import { ProfileReportSection } from "@/components/profile/ProfileReportSection";
import { ProfileTabs } from "@/components/profile/ProfileTabs";
import type {
  AuctionWithRelations,
  BidWithAuction,
  ProfileTransaction as TransactionWithRelations,
  WonAuction,
} from "@/components/profile/profile-types";
import { SellerListingsTab } from "@/components/profile/SellerListingsTab";
import {
  type SellerReviewItem,
  SellerReviews,
} from "@/components/profile/SellerReviews";
import { TransactionCard } from "@/components/transaction/TransactionCard";
import { Badge } from "@/components/ui/Badge";
import { StarRating } from "@/components/ui/StarRating";
import { getUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { formatDate, getInitials } from "@/lib/utils";
import type { BuyerWarning } from "@/types/supabase";

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
  params: Promise<{ username: string }>;
  searchParams: Promise<{ report?: string }>;
}) {
  const { username } = await params;
  const { report } = await searchParams;

  const supabase = await createClient();
  const currentUser = await getUser();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .single();

  if (error || !profile) notFound();

  const isOwnProfile = !!currentUser && currentUser.id === profile.id;
  const canReport = !!currentUser && currentUser.id !== profile.id;

  const [auctionsResult, sellerStatsResult, reviewsResult] = await Promise.all([
    supabase
      .from("auctions")
      .select(
        `*, seller:profiles!seller_id(username, name), winner:profiles!winner_id(username, name), category:categories(name, slug), bids(count)`,
      )
      .eq("seller_id", profile.id)
      .in("status", ["active", "closed", "completed"])
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("auctions")
      .select("status")
      .eq("seller_id", profile.id)
      .neq("status", "cancelled"),
    supabase
      .from("reviews")
      .select(
        `id, rating, comment, receipt_photo_url, created_at, buyer:profiles!buyer_id(username, name, avatar_url), auction:auctions(id, title)`,
      )
      .eq("seller_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  const auctions = (auctionsResult.data ??
    []) as unknown as AuctionWithRelations[];
  const sellerStats = sellerStatsResult.data ?? [];

  const reviews = (reviewsResult.data ?? []) as unknown as SellerReviewItem[];
  const reviewCount = reviews.length;
  const reviewAverage =
    reviewCount > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
      : 0;

  const activeAuctions = auctions.filter((a) => a.status === "active");
  const completedAuctions = auctions.filter(
    (a) => a.status === "completed" || a.status === "closed",
  );

  const totalAuctions = sellerStats.length;
  const completedCount = sellerStats.filter(
    (a) => a.status === "completed",
  ).length;
  const pendingApprovalCount = sellerStats.filter(
    (a) => a.status === "pending_approval",
  ).length;
  const sellerSuccessRate =
    totalAuctions > 0
      ? Math.round((completedCount / totalAuctions) * 100)
      : null;

  const isTimedOut =
    profile.buyer_timeout_until &&
    new Date(profile.buyer_timeout_until) > new Date();

  // Additional data for own-profile dashboard sections
  let myBids: BidWithAuction[] = [];
  let wonAuctionsCount = 0;
  let sellerTransactions: TransactionWithRelations[] = [];
  let buyerTransactions: TransactionWithRelations[] = [];
  // The buyer's completed purchases (history), each tagged with whether it has
  // already been reviewed so the card can show the right action.
  let completedPurchases: TransactionWithRelations[] = [];
  let wonAuctions: WonAuction[] = [];
  let buyerWarnings: BuyerWarning[] = [];

  if (isOwnProfile) {
    const txQuery = supabase
      .from("transactions")
      .select(
        `*, auction:auctions(id, title, images), seller:profiles!seller_id(id, username, name), buyer:profiles!buyer_id(id, username, name), middleman:profiles!middleman_id(id, username, name)`,
      )
      .not("status", "in", '("completed","cancelled")')
      .order("updated_at", { ascending: false });

    // Completed purchases are excluded from `txQuery` above; fetch them
    // separately so the buyer can be prompted to review them.
    const completedBuyerTxQuery = supabase
      .from("transactions")
      .select(
        `*, auction:auctions(id, title, images), seller:profiles!seller_id(id, username, name), buyer:profiles!buyer_id(id, username, name), middleman:profiles!middleman_id(id, username, name)`,
      )
      .eq("buyer_id", profile.id)
      .eq("status", "completed")
      .order("updated_at", { ascending: false });

    // Which transactions this user has already reviewed (reliable, no embed).
    const myReviewsQuery = supabase
      .from("reviews")
      .select("transaction_id")
      .eq("buyer_id", profile.id);

    const [
      bidsRes,
      wonCountRes,
      txRes,
      completedBuyerTxRes,
      myReviewsRes,
      wonAuctionsRes,
      warningsRes,
    ] = await Promise.all([
      supabase
        .from("bids")
        .select(
          `*, auction:auctions(id, title, current_price, status, end_time, images, winner_id, transaction_confirmed)`,
        )
        .eq("bidder_id", profile.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("auctions")
        .select("id", { count: "exact", head: true })
        .eq("winner_id", profile.id)
        .in("status", ["completed", "closed"]),
      txQuery,
      completedBuyerTxQuery,
      myReviewsQuery,
      supabase
        .from("auctions")
        .select(
          "id, title, images, current_price, seller_id, confirmation_deadline, seller:profiles!seller_id(username, name)",
        )
        .eq("winner_id", profile.id)
        .in("status", ["closed", "completed"])
        .eq("transaction_confirmed", false)
        .order("updated_at", { ascending: false })
        .limit(10),
      supabase
        .from("buyer_warnings")
        .select("*")
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

    myBids = (bidsRes.data ?? []) as unknown as BidWithAuction[];
    wonAuctionsCount = wonCountRes.count ?? 0;
    wonAuctions = (wonAuctionsRes.data ?? []) as unknown as WonAuction[];
    buyerWarnings = (warningsRes.data ?? []) as BuyerWarning[];

    const allTx = (txRes.data ?? []) as unknown as TransactionWithRelations[];
    sellerTransactions = allTx.filter((t) => t.seller_id === profile.id);
    buyerTransactions = allTx.filter(
      (t) => t.buyer_id === profile.id && t.seller_id !== profile.id,
    );

    // Completed purchases form the buyer's purchase history. Tag each with
    // whether it's already reviewed so the card shows "Beri Ulasan" or
    // "Ulasan sudah terkirim".
    const reviewedTxIds = new Set(
      ((myReviewsRes.data ?? []) as { transaction_id: string }[]).map(
        (r) => r.transaction_id,
      ),
    );
    const completedBuyerTx = (completedBuyerTxRes.data ??
      []) as unknown as TransactionWithRelations[];
    completedPurchases = completedBuyerTx
      .filter((t) => t.seller_id !== profile.id)
      .map((t) => ({ ...t, reviewed: reviewedTxIds.has(t.id) }));
  }

  // Derived sets for filtering
  const sellerTxAuctionIds = new Set(
    sellerTransactions.map((t) => t.auction_id),
  );
  const buyerTxAuctionIds = new Set(buyerTransactions.map((t) => t.auction_id));

  // "Berakhir - Perlu Tindakan": ended with winner, no transaction yet
  const perluTindakan = auctions.filter(
    (a) =>
      (a.status === "closed" || a.status === "completed") &&
      a.winner_id &&
      !a.transaction_confirmed &&
      !sellerTxAuctionIds.has(a.id),
  );

  // "Menang - Belum Transaksi": user won, no active transaction
  const menangBelumTransaksi = wonAuctions.filter(
    (a) => !buyerTxAuctionIds.has(a.id),
  );

  // Bids by category
  const bidAktif = myBids.filter((b) => b.auction?.status === "active");
  const bidEnded = myBids.filter(
    (b) => b.auction?.status === "closed" || b.auction?.status === "completed",
  );
  const bidMenang = bidEnded.filter(
    (b) => b.auction?.winner_id === currentUser?.id,
  );
  const bidKalah = bidEnded.filter(
    (b) => b.auction?.winner_id !== currentUser?.id,
  );

  const ownStats = [
    {
      label: "Lelang Aktif",
      value: activeAuctions.length,
      icon: Gavel,
      color: "text-teal-600",
    },
    {
      label: "Total Bid",
      value: myBids.length,
      icon: Package,
      color: "text-purple-600",
    },
    {
      label: "Dimenangkan",
      value: wonAuctionsCount,
      icon: Trophy,
      color: "text-green-600",
    },
    {
      label: "Penjualan Sukses",
      value: profile.successful_sales ?? 0,
      icon: CheckCircle2,
      color: "text-emerald-600",
    },
    {
      label: "Pembelian Sukses",
      value: profile.successful_purchases ?? 0,
      icon: ShoppingBag,
      color: "text-teal-600",
    },
    {
      label: "Peringatan",
      value: profile.buyer_warning_count,
      icon: AlertTriangle,
      color:
        profile.buyer_warning_count > 0 ? "text-orange-500" : "text-gray-400",
    },
  ];

  return (
    <>
      {!isOwnProfile && <MobileBackBar />}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Cover banner + profile card */}
        <div className="relative mb-4">
          {/* Cover */}
          <div className="h-24 sm:h-32 rounded-2xl bg-gradient-to-r from-teal-500 via-teal-600 to-emerald-600 relative overflow-hidden">
            <div className="absolute -top-10 -left-8 w-40 h-40 rounded-full bg-white/10" />
            <div className="absolute top-4 right-24 w-24 h-24 rounded-full bg-white/10" />
            <div className="absolute -bottom-12 right-1/4 w-36 h-36 rounded-full bg-white/10" />
          </div>

          {/* Profile card overlapping the cover */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-6 mx-2 sm:mx-4 -mt-14 relative">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5">
              {/* Avatar */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white text-2xl font-bold shrink-0 ring-4 ring-white overflow-hidden -mt-12 sm:-mt-14">
                {profile.avatar_url ? (
                  // biome-ignore lint/performance/noImgElement: Supabase CDN URLs not compatible with next/image domain allowlist
                  <img
                    src={profile.avatar_url}
                    alt={profile.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  getInitials(profile.name)
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 w-full">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                  <div className="min-w-0 text-center sm:text-left">
                    <h1 className="text-xl font-bold text-gray-900 truncate">
                      {profile.name}
                    </h1>
                    <p className="text-gray-500 text-sm">@{profile.username}</p>
                  </div>

                  {/* Success badges — top-right on desktop */}
                  <div className="flex flex-wrap gap-1.5 justify-center sm:justify-end shrink-0">
                    {(profile.successful_sales ?? 0) > 0 && (
                      <Badge
                        variant="success"
                        className="flex items-center gap-1"
                      >
                        <Trophy className="h-3 w-3" />
                        {profile.successful_sales} Penjualan Sukses
                      </Badge>
                    )}
                    {(profile.successful_purchases ?? 0) > 0 && (
                      <Badge variant="info" className="flex items-center gap-1">
                        <ShoppingBag className="h-3 w-3" />
                        {profile.successful_purchases} Pembelian Sukses
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Status badges */}
                <div className="flex flex-wrap gap-1.5 mt-2 justify-center sm:justify-start">
                  {profile.buyer_warning_count > 0 && (
                    <Badge
                      variant="warning"
                      className="flex items-center gap-1"
                    >
                      <AlertTriangle className="h-3 w-3" />
                      {profile.buyer_warning_count}x peringatan
                    </Badge>
                  )}
                  {isTimedOut && (
                    <Badge variant="danger" className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Timeout
                    </Badge>
                  )}
                  {profile.is_middleman && (
                    <Badge
                      variant="success"
                      className="flex items-center gap-1"
                    >
                      <ShieldCheck className="h-3 w-3" />
                      Middleman
                    </Badge>
                  )}
                  {profile.facebook_name &&
                    (profile.facebook_public || isOwnProfile) && (
                      <Badge variant="info" className="flex items-center gap-1">
                        <svg
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="h-3 w-3"
                          aria-hidden="true"
                        >
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                        </svg>
                        {profile.facebook_name}
                        {isOwnProfile && !profile.facebook_public && (
                          <span className="text-[10px] opacity-70">
                            (hanya kamu)
                          </span>
                        )}
                      </Badge>
                    )}
                </div>

                {/* Meta row — includes rating, always shown */}
                <div className="flex items-center gap-x-4 gap-y-1.5 mt-3 text-sm text-gray-500 flex-wrap justify-center sm:justify-start">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Bergabung {formatDate(profile.created_at, "id")}
                  </span>
                  {profile.province && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {profile.province}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Gavel className="h-4 w-4" />
                    {activeAuctions.length} Lelang Aktif
                  </span>
                  {sellerSuccessRate !== null && (
                    <span
                      className={`flex items-center gap-1 font-medium ${
                        sellerSuccessRate >= 60
                          ? "text-green-600"
                          : "text-yellow-600"
                      }`}
                    >
                      <TrendingUp className="h-4 w-4" />
                      {sellerSuccessRate}% berhasil
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <StarRating value={reviewAverage} size={14} />
                    {reviewCount > 0 ? (
                      <>
                        <span className="font-medium text-gray-700">
                          {reviewAverage.toFixed(1)}
                        </span>
                        <span className="text-gray-400">
                          ({reviewCount} ulasan)
                        </span>
                      </>
                    ) : (
                      <span className="text-gray-400">Belum ada rating</span>
                    )}
                  </span>
                </div>

                {/* Chat & report — others' profile when logged in */}
                {canReport && (
                  <div className="mt-4 flex items-center gap-2 justify-center sm:justify-start">
                    <Link
                      href={`/chat?seller=${profile.id}`}
                      className="inline-flex items-center justify-center gap-1.5 py-2 px-4 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <MessageSquare className="h-4 w-4" />
                      Chat Penjual
                    </Link>
                    <ProfileReportSection
                      reportedUserId={profile.id}
                      reportedUsername={profile.username}
                      openReport={report === "true"}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Account menu — own profile, mobile only */}
        {isOwnProfile && (
          <MobileAccountMenu
            isMiddleman={profile.is_middleman}
            isAdmin={profile.role === "admin"}
          />
        )}

        {/* ── Own profile: dashboard sections ─────────────────────────── */}
        {isOwnProfile && (
          <div className="flex flex-col gap-6">
            {/* Alert banners */}
            {isTimedOut && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 flex items-start gap-2">
                <Clock className="h-4 w-4 mt-0.5 shrink-0" />
                <span>
                  Akun Anda sedang dalam masa <strong>timeout</strong>. Anda
                  tidak dapat melakukan bid hingga{" "}
                  <strong>
                    {new Date(
                      profile.buyer_timeout_until ?? "",
                    ).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </strong>
                  .
                </span>
              </div>
            )}
            {!isTimedOut && profile.buyer_warning_count > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-sm text-orange-700 flex flex-col gap-2">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>
                    Akun Anda memiliki{" "}
                    <strong>{profile.buyer_warning_count} peringatan</strong>{" "}
                    terkonfirmasi. Setelah 3 peringatan, akun akan masuk masa
                    timeout 1 minggu.
                  </span>
                </div>
                {buyerWarnings.length > 0 && (
                  <div className="flex flex-col gap-1 ml-6 border-l-2 border-orange-200 pl-3">
                    {buyerWarnings.map((w, i) => (
                      <div key={w.id} className="text-xs text-orange-600">
                        <span className="font-semibold">
                          Peringatan {buyerWarnings.length - i}
                        </span>
                        {w.note && (
                          <span className="text-orange-500"> — {w.note}</span>
                        )}
                        <span className="text-orange-400 ml-1">
                          (
                          {new Date(w.created_at).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                          )
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Stat cards */}
            <div className="grid grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
              {ownStats.map(({ label, value, icon: Icon, color }) => (
                <div
                  key={label}
                  className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4 flex flex-col items-center sm:items-start text-center sm:text-left"
                >
                  <Icon className={`h-4 w-4 mb-1.5 ${color}`} />
                  <p className={`text-xl sm:text-2xl font-bold ${color}`}>
                    {value}
                  </p>
                  <span className="text-[11px] sm:text-xs text-gray-500 leading-tight">
                    {label}
                  </span>
                </div>
              ))}
            </div>

            {/* Transaksi yang diurus sebagai middleman hanya tampil di
                halaman /middleman/dashboard, bukan di profil. */}

            {/* ── Tabs: Penjual | Pembeli | Ulasan ── */}
            <ProfileTabs
              defaultTab="auctions"
              tabs={[
                {
                  id: "auctions",
                  label: "Penjual",
                  icon: <Gavel className="h-4 w-4" />,
                  content: (
                    <MyAuctionsTab
                      activeAuctions={activeAuctions}
                      sellerTransactions={sellerTransactions}
                      perluTindakan={perluTindakan}
                      auctions={auctions}
                      pendingApprovalCount={pendingApprovalCount}
                      currentUserId={currentUser!.id}
                    />
                  ),
                },
                {
                  id: "bids",
                  label: "Pembeli",
                  icon: <Package className="h-4 w-4" />,
                  content: (
                    <MyBidsTab
                      bidAktif={bidAktif}
                      bidKalah={bidKalah}
                      bidMenang={bidMenang}
                      buyerTransactions={buyerTransactions}
                      completedPurchases={completedPurchases}
                      menangBelumTransaksi={menangBelumTransaksi}
                      currentUserId={currentUser!.id}
                    />
                  ),
                },
                {
                  id: "ulasan",
                  label: "Ulasan",
                  icon: <Star className="h-4 w-4" />,
                  count: reviewCount,
                  content: (
                    <SellerReviews
                      reviews={reviews}
                      average={reviewAverage}
                      count={reviewCount}
                    />
                  ),
                },
              ]}
            />
          </div>
        )}

        {/* ── Others' profile: reputation-first tabs ─────────────────── */}
        {!isOwnProfile && (
          <ProfileTabs
            defaultTab="ulasan"
            tabs={[
              {
                id: "ulasan",
                label: "Ulasan",
                icon: <Star className="h-4 w-4" />,
                count: reviewCount,
                content: (
                  <SellerReviews
                    reviews={reviews}
                    average={reviewAverage}
                    count={reviewCount}
                  />
                ),
              },
              {
                id: "lelang",
                label: "Lelang",
                icon: <Gavel className="h-4 w-4" />,
                count: activeAuctions.length,
                content: (
                  <SellerListingsTab
                    activeAuctions={activeAuctions}
                    completedAuctions={completedAuctions}
                  />
                ),
              },
            ]}
          />
        )}
      </div>
    </>
  );
}
