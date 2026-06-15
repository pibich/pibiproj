"use client";

import { Gavel } from "lucide-react";
import { useState } from "react";
import { AuctionCard } from "@/components/auction/AuctionCard";
import { ApprovalStatusButton } from "@/components/profile/ApprovalStatusButton";
import { AuctionListCard } from "@/components/profile/AuctionListCard";
import type {
  AuctionWithRelations,
  ProfileTransaction,
} from "@/components/profile/profile-types";
import { TransactionCard } from "@/components/transaction/TransactionCard";

interface MyAuctionsTabProps {
  activeAuctions: AuctionWithRelations[];
  sellerTransactions: ProfileTransaction[];
  perluTindakan: AuctionWithRelations[];
  auctions: AuctionWithRelations[];
  pendingApprovalCount: number;
  currentUserId: string;
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
      <Gavel className="h-10 w-10 text-gray-300 mx-auto mb-2" />
      <p className="text-gray-500 text-sm">{message}</p>
    </div>
  );
}

function Grid({ items }: { items: AuctionWithRelations[] }) {
  if (items.length === 0) {
    return <EmptyState message="Tidak ada lelang pada kategori ini." />;
  }
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {items.map((a) => (
        <AuctionCard key={a.id} auction={a} />
      ))}
    </div>
  );
}

export function MyAuctionsTab({
  activeAuctions,
  sellerTransactions,
  perluTindakan,
  auctions,
  pendingApprovalCount,
  currentUserId,
}: MyAuctionsTabProps) {
  const aktif = activeAuctions;
  const selesai = auctions.filter(
    (a) => a.status === "completed" || (a.status === "closed" && a.winner_id),
  );
  const gagal = auctions.filter((a) => a.status === "closed" && !a.winner_id);
  const menungguCount = perluTindakan.length + sellerTransactions.length;

  const filters = [
    { key: "semua", label: "Semua", count: auctions.length },
    { key: "aktif", label: "Aktif", count: aktif.length },
    { key: "menunggu", label: "Menunggu Pembayaran", count: menungguCount },
    { key: "selesai", label: "Selesai", count: selesai.length },
    { key: "gagal", label: "Gagal", count: gagal.length },
  ] as const;

  const [filter, setFilter] = useState<string>("semua");

  return (
    <div className="flex flex-col gap-5">
      {/* Filter pills + approval status */}
      <div className="flex flex-wrap items-center justify-between gap-3">
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
        <ApprovalStatusButton count={pendingApprovalCount} />
      </div>

      {/* Content */}
      {filter === "semua" && <Grid items={auctions} />}
      {filter === "aktif" && <Grid items={aktif} />}
      {filter === "selesai" && <Grid items={selesai} />}
      {filter === "gagal" && <Grid items={gagal} />}

      {filter === "menunggu" &&
        (menungguCount === 0 ? (
          <EmptyState message="Tidak ada lelang yang menunggu pembayaran." />
        ) : (
          <div className="flex flex-col gap-2">
            {perluTindakan.map((a) => (
              <AuctionListCard
                key={a.id}
                image={a.images?.[0] ?? null}
                title={a.title}
                href={`/auctions/${a.id}`}
                price={a.current_price}
                badge={{ label: "MENUNGGU PEMBAYARAN", variant: "warning" }}
                subInfo={
                  a.winner
                    ? `Pemenang: @${a.winner.username} · Tunggu pembayaran atau gagalkan`
                    : undefined
                }
                actionLabel="Kelola di halaman lelang"
              />
            ))}
            {sellerTransactions.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {sellerTransactions.map((tx) => (
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
    </div>
  );
}
