"use client";

import { Gavel, Package } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { AuctionListCard } from "@/components/profile/AuctionListCard";
import type {
  BidWithAuction,
  ProfileTransaction,
  WonAuction,
} from "@/components/profile/profile-types";
import { TransactionCard } from "@/components/transaction/TransactionCard";
import { formatIDR, formatRelativeTime } from "@/lib/utils";

interface MyBidsTabProps {
  bidAktif: BidWithAuction[];
  bidKalah: BidWithAuction[];
  bidMenang: BidWithAuction[];
  buyerTransactions: ProfileTransaction[];
  completedPurchases: ProfileTransaction[];
  menangBelumTransaksi: WonAuction[];
  currentUserId: string;
}

type RowStatus = {
  label: string;
  color: string;
};

function BidRow({ bid, status }: { bid: BidWithAuction; status: RowStatus }) {
  const a = bid.auction;
  const ended = a?.status === "closed" || a?.status === "completed";
  const timeLabel = ended
    ? "Berakhir"
    : a?.end_time
      ? `Berakhir ${formatRelativeTime(a.end_time)}`
      : "";

  return (
    <Link
      href={`/auctions/${a?.id}`}
      className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 transition-all hover:border-teal-300 hover:shadow-sm"
    >
      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-gray-100">
        {a?.images?.[0] ? (
          // biome-ignore lint/performance/noImgElement: Supabase CDN URL
          <img
            src={a.images[0]}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 to-teal-100">
            <Gavel className="h-5 w-5 text-teal-400" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-1 text-sm font-semibold text-slate-900">
          {a?.title ?? "Lelang"}
        </p>
        <p className="mt-0.5 text-xs text-slate-400">{timeLabel}</p>
      </div>
      <div className="shrink-0 text-right">
        <p className="font-mono text-sm font-bold text-slate-900">
          {formatIDR(bid.amount)}
        </p>
        <p className={`text-xs font-semibold ${status.color}`}>
          {status.label}
        </p>
      </div>
    </Link>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white py-12 text-center">
      <Package className="mx-auto mb-2 h-10 w-10 text-gray-300" />
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  );
}

export function MyBidsTab({
  bidAktif,
  bidKalah,
  bidMenang,
  buyerTransactions,
  completedPurchases,
  menangBelumTransaksi,
  currentUserId,
}: MyBidsTabProps) {
  const statusFor = (bid: BidWithAuction): RowStatus => {
    const a = bid.auction;
    const ended = a?.status === "closed" || a?.status === "completed";
    if (!ended) {
      return bid.is_winning
        ? { label: "Tertinggi", color: "text-emerald-600" }
        : { label: "Terlampaui", color: "text-amber-600" };
    }
    return a?.winner_id === currentUserId
      ? { label: "Menang", color: "text-emerald-600" }
      : { label: "Kalah", color: "text-slate-400" };
  };

  const semua = [...bidAktif, ...bidMenang, ...bidKalah];
  const belumDibayarCount =
    menangBelumTransaksi.length + buyerTransactions.length;

  // Wins with no transaction record at all (edge case) — surface under Selesai.
  const showMenangFallback =
    bidMenang.length > 0 &&
    buyerTransactions.length === 0 &&
    menangBelumTransaksi.length === 0 &&
    completedPurchases.length === 0;
  const selesaiCount =
    completedPurchases.length + (showMenangFallback ? bidMenang.length : 0);

  const filters = [
    { key: "semua", label: "Semua", count: semua.length },
    { key: "berlangsung", label: "Berlangsung", count: bidAktif.length },
    { key: "belum_dibayar", label: "Belum Dibayar", count: belumDibayarCount },
    { key: "selesai", label: "Selesai", count: selesaiCount },
    { key: "gagal", label: "Gagal", count: bidKalah.length },
  ] as const;

  const [filter, setFilter] = useState<string>("semua");

  function List({ bids }: { bids: BidWithAuction[] }) {
    if (bids.length === 0) {
      return <EmptyState message="Tidak ada tawaran pada kategori ini." />;
    }
    return (
      <div className="flex flex-col gap-2">
        {bids.map((bid) => (
          <BidRow key={bid.id} bid={bid} status={statusFor(bid)} />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Filter pills */}
      <div className="flex flex-wrap gap-2">
        {filters.map((f) => {
          const active = f.key === filter;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                active
                  ? "bg-slate-900 text-white"
                  : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300"
              }`}
            >
              {f.label}
              <span
                className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold ${
                  active
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {f.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      {filter === "semua" && <List bids={semua} />}
      {filter === "berlangsung" && <List bids={bidAktif} />}
      {filter === "gagal" && <List bids={bidKalah} />}

      {filter === "belum_dibayar" &&
        (belumDibayarCount === 0 ? (
          <EmptyState message="Tidak ada pembelian yang menunggu pembayaran." />
        ) : (
          <div className="flex flex-col gap-2">
            {menangBelumTransaksi.map((a) => (
              <AuctionListCard
                key={a.id}
                image={a.images?.[0] ?? null}
                title={a.title}
                href={`/auctions/${a.id}`}
                price={a.current_price}
                badge={{ label: "BELUM DIBAYAR", variant: "warning" }}
                subInfo={
                  a.seller
                    ? `Seller: @${a.seller.username} · Selesaikan pembayaran ke seller`
                    : "Selesaikan pembayaran ke seller"
                }
                chatHref={`/chat?seller=${a.seller_id}`}
              />
            ))}
            {buyerTransactions.length > 0 && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {buyerTransactions.map((tx) => (
                  <TransactionCard
                    key={tx.id}
                    transaction={tx}
                    currentUserId={currentUserId}
                  />
                ))}
              </div>
            )}
          </div>
        ))}

      {filter === "selesai" &&
        (selesaiCount === 0 ? (
          <EmptyState message="Belum ada pembelian yang selesai." />
        ) : (
          <div className="flex flex-col gap-6">
            {completedPurchases.length > 0 && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {completedPurchases.map((tx) => (
                  <TransactionCard
                    key={tx.id}
                    transaction={tx}
                    currentUserId={currentUserId}
                  />
                ))}
              </div>
            )}
            {showMenangFallback && <List bids={bidMenang} />}
          </div>
        ))}
    </div>
  );
}
