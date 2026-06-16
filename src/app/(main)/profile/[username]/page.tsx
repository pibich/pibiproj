import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Gavel,
  MessageSquare,
  Package,
  Pencil,
  ShieldCheck,
  Star,
  TrendingUp,
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
  let sellerTransactions: TransactionWithRelations[] = [];
  // Auction ids of the seller's completed sales (for the "Menunggu Pembayaran"
  // exclusion — see `sellerTxAuctionIds`).
  let sellerCompletedAuctionIds: string[] = [];
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

    // Auction ids of the seller's completed sales. Completed transactions are
    // excluded from `txQuery`, so without this their auctions re-surface under
    // "Menunggu Pembayaran" when the auction still has
    // transaction_confirmed = false (legacy/escrow rows).
    const completedSellerTxQuery = supabase
      .from("transactions")
      .select("auction_id")
      .eq("seller_id", profile.id)
      .eq("status", "completed");

    // Which transactions this user has already reviewed (reliable, no embed).
    const myReviewsQuery = supabase
      .from("reviews")
      .select("transaction_id")
      .eq("buyer_id", profile.id);

    const [
      bidsRes,
      txRes,
      completedBuyerTxRes,
      completedSellerTxRes,
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
      txQuery,
      completedBuyerTxQuery,
      completedSellerTxQuery,
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
    wonAuctions = (wonAuctionsRes.data ?? []) as unknown as WonAuction[];
    buyerWarnings = (warningsRes.data ?? []) as BuyerWarning[];

    const allTx = (txRes.data ?? []) as unknown as TransactionWithRelations[];
    sellerTransactions = allTx.filter((t) => t.seller_id === profile.id);
    sellerCompletedAuctionIds = (
      (completedSellerTxRes.data ?? []) as { auction_id: string }[]
    ).map((t) => t.auction_id);
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

  // Derived sets for filtering. Include completed sales (active transactions
  // alone aren't enough) so a finished escrow sale doesn't re-appear under
  // "Menunggu Pembayaran" when its auction still has transaction_confirmed=false.
  const sellerTxAuctionIds = new Set([
    ...sellerTransactions.map((t) => t.auction_id),
    ...sellerCompletedAuctionIds,
  ]);
  // Any auction the buyer already has a transaction for — active OR completed.
  // Completed ones must be included so a finished escrow purchase doesn't
  // re-appear as "Belum Dibayar" when its auction still has
  // transaction_confirmed = false (legacy/escrow rows).
  const buyerTxAuctionIds = new Set([
    ...buyerTransactions.map((t) => t.auction_id),
    ...completedPurchases.map((t) => t.auction_id),
  ]);

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

  const ownStats: {
    label: string;
    value: number | string;
    icon: typeof Gavel;
    color: string;
  }[] = [
    {
      label: "Lelang Aktif",
      value: activeAuctions.length,
      icon: Gavel,
      color: "text-teal-600",
    },
    {
      label: "Lelang Selesai",
      value: completedCount,
      icon: CheckCircle2,
      color: "text-emerald-600",
    },
    {
      label: "Total Tawaran",
      value: myBids.length,
      icon: TrendingUp,
      color: "text-purple-600",
    },
    {
      label: "Peringatan",
      value: profile.buyer_warning_count,
      icon: AlertTriangle,
      color:
        profile.buyer_warning_count > 0 ? "text-orange-500" : "text-gray-400",
    },
    {
      label: "Rating",
      value: reviewCount > 0 ? reviewAverage.toFixed(1) : "—",
      icon: Star,
      color: "text-amber-500",
    },
    {
      label: "Transaksi Sukses",
      value: sellerSuccessRate !== null ? `${sellerSuccessRate}%` : "—",
      icon: CheckCircle2,
      color: "text-green-600",
    },
  ];

  return (
    <>
      {!isOwnProfile && <MobileBackBar />}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Cover banner + profile card */}
        <div className="relative mb-4">
          {/* Cover */}
          <div className="h-28 sm:h-40 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 relative overflow-hidden">
            <div className="absolute -top-10 -left-8 w-40 h-40 rounded-full bg-white/[0.04]" />
            <div className="absolute top-6 right-24 w-24 h-24 rounded-full bg-white/[0.04]" />
            <div className="absolute -bottom-12 right-1/4 w-36 h-36 rounded-full bg-teal-400/10" />
          </div>

          {/* Profile card overlapping the cover */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-6 mx-2 sm:mx-4 -mt-16 relative">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5">
              {/* Avatar */}
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500 text-3xl font-bold shrink-0 ring-4 ring-white overflow-hidden -mt-16 sm:-mt-20">
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
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="min-w-0 text-center sm:text-left">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-2.5 gap-y-1">
                      <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                        {profile.name}
                      </h1>
                      {/* Status badges next to name */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        {profile.is_active && (
                          <span className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                            <ShieldCheck className="h-3 w-3" />
                            Terverifikasi
                          </span>
                        )}
                        {profile.is_middleman && (
                          <span className="inline-flex items-center gap-1 rounded-lg border border-teal-200 bg-teal-50 px-2 py-0.5 text-xs font-semibold text-teal-700">
                            <ShieldCheck className="h-3 w-3" />
                            Middleman
                          </span>
                        )}
                        {profile.buyer_warning_count > 0 && (
                          <span className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
                            <AlertTriangle className="h-3 w-3" />
                            {profile.buyer_warning_count}× Peringatan
                          </span>
                        )}
                        {isTimedOut && (
                          <span className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700">
                            <Clock className="h-3 w-3" />
                            Timeout
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-gray-500 text-sm mt-1">
                      @{profile.username}
                      {profile.province && ` · ${profile.province}`}
                    </p>

                    {/* Meta row */}
                    <div className="flex items-center gap-x-4 gap-y-1.5 mt-3 text-sm text-gray-500 flex-wrap justify-center sm:justify-start">
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
                          <span className="text-gray-400">
                            Belum ada rating
                          </span>
                        )}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Bergabung {formatDate(profile.created_at, "id")}
                      </span>
                      <span className="flex items-center gap-1 text-emerald-600 font-medium">
                        <CheckCircle2 className="h-4 w-4" />
                        {(profile.successful_sales ?? 0) +
                          (profile.successful_purchases ?? 0)}{" "}
                        transaksi sukses
                      </span>
                      {profile.facebook_name &&
                        (profile.facebook_public || isOwnProfile) && (
                          <span className="flex items-center gap-1 text-blue-600">
                            <svg
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              className="h-4 w-4"
                              aria-hidden="true"
                            >
                              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                            </svg>
                            {profile.facebook_name}
                          </span>
                        )}
                    </div>

                    {/* Action buttons */}
                    <div className="mt-4 flex items-center gap-2 justify-center sm:justify-start">
                      {isOwnProfile ? (
                        <Link
                          href="/settings"
                          className="inline-flex items-center justify-center gap-1.5 py-2 px-4 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <Pencil className="h-4 w-4" />
                          Edit Profil
                        </Link>
                      ) : (
                        canReport && (
                          <>
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
                          </>
                        )
                      )}
                    </div>
                  </div>
                </div>
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
              <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
                  <div>
                    <p className="font-bold text-amber-900">
                      Sistem Peringatan — {profile.buyer_warning_count} dari 3
                    </p>
                    <p className="mt-0.5 text-sm text-amber-700">
                      Akun ini memiliki{" "}
                      <strong>
                        {profile.buyer_warning_count} peringatan terkonfirmasi
                      </strong>{" "}
                      dari tim moderasi (berlaku sebagai pembeli &amp; penjual).
                    </p>
                    <p className="text-sm text-amber-700">
                      Pada peringatan ke-3, akun akan otomatis masuk{" "}
                      <strong>timeout 1 minggu</strong>.
                    </p>
                  </div>
                </div>

                {/* Progress — 3 segments */}
                <div className="mt-4 flex gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className={`h-1.5 flex-1 rounded-full ${
                        i < profile.buyer_warning_count
                          ? "bg-amber-500"
                          : "bg-amber-200/60"
                      }`}
                    />
                  ))}
                </div>

                {buyerWarnings.length > 0 && (
                  <div className="mt-4 flex flex-col gap-2">
                    {buyerWarnings.map((w, i) => (
                      <div
                        key={w.id}
                        className="flex flex-wrap items-center gap-2 text-sm"
                      >
                        <span className="rounded-md bg-amber-200/70 px-2 py-0.5 text-xs font-semibold text-amber-800">
                          Peringatan {buyerWarnings.length - i}
                        </span>
                        {w.note && (
                          <span className="flex-1 text-amber-800">
                            {w.note}
                          </span>
                        )}
                        <span className="font-mono text-xs text-amber-500">
                          {new Date(w.created_at).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
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
                  label: "Lelang Saya",
                  icon: <Gavel className="h-4 w-4" />,
                  count: auctions.length,
                  content: (
                    <MyAuctionsTab
                      key="auctions"
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
                  label: "Tawaran Saya",
                  icon: <Package className="h-4 w-4" />,
                  count: myBids.length,
                  content: (
                    <MyBidsTab
                      key="bids"
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
                      key="ulasan"
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
                    key="ulasan"
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
