import { Gavel } from "lucide-react";
import { AuctionCard } from "@/components/auction/AuctionCard";
import { ApprovalStatusButton } from "@/components/profile/ApprovalStatusButton";
import { AuctionListCard } from "@/components/profile/AuctionListCard";
import { ProfileTabs } from "@/components/profile/ProfileTabs";
import type {
  AuctionWithRelations,
  ProfileTransaction,
} from "@/components/profile/profile-types";
import { TransactionCard } from "@/components/transaction/TransactionCard";
import { ConfirmationCountdown } from "@/components/ui/ConfirmationCountdown";
import { formatRelativeTime } from "@/lib/utils";

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
  // "Selesai" = laku & transaksi tuntas; "Gagal" = berakhir tanpa pemenang.
  const selesai = auctions.filter((a) => a.status === "completed");
  const gagal = auctions.filter((a) => a.status === "closed" && !a.winner_id);

  const berlangsungCount =
    activeAuctions.length + sellerTransactions.length + perluTindakan.length;

  const berlangsung =
    berlangsungCount === 0 ? (
      <EmptyState message="Tidak ada lelang yang sedang berlangsung." />
    ) : (
      <div className="flex flex-col gap-6">
        {activeAuctions.length > 0 && (
          <section>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
              Lelang Aktif
              <span className="ml-auto normal-case font-normal text-gray-400">
                {activeAuctions.length} lelang
              </span>
            </h3>
            <div className="flex flex-col gap-2">
              {activeAuctions.map((a) => {
                const bidCount =
                  (a as unknown as { bids?: { count: number }[] }).bids?.[0]
                    ?.count ?? 0;
                return (
                  <AuctionListCard
                    key={a.id}
                    image={a.images?.[0] ?? null}
                    title={a.title}
                    href={`/auctions/${a.id}`}
                    price={a.current_price}
                    badge={{ label: "AKTIF", variant: "success" }}
                    subInfo={`${bidCount} bid${a.end_time ? ` · Berakhir ${formatRelativeTime(a.end_time)}` : ""}`}
                  />
                );
              })}
            </div>
          </section>
        )}

        {sellerTransactions.length > 0 && (
          <section>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-500 inline-block" />
              Dalam Transaksi
              <span className="ml-auto normal-case font-normal text-gray-400">
                {sellerTransactions.length} transaksi
              </span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {sellerTransactions.map((tx) => (
                <TransactionCard
                  key={tx.id}
                  transaction={tx}
                  currentUserId={currentUserId}
                />
              ))}
            </div>
          </section>
        )}

        {perluTindakan.length > 0 && (
          <section>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
              Berakhir — Perlu Tindakan
              <span className="ml-auto normal-case font-normal text-gray-400">
                {perluTindakan.length} lelang
              </span>
            </h3>
            <div className="flex flex-col gap-2">
              {perluTindakan.map((a) => (
                <div key={a.id} className="flex flex-col gap-1.5">
                  <AuctionListCard
                    image={a.images?.[0] ?? null}
                    title={a.title}
                    href={`/auctions/${a.id}`}
                    price={a.current_price}
                    badge={{ label: "BUTUH TINDAKAN", variant: "warning" }}
                    subInfo={
                      a.winner ? `Pemenang: @${a.winner.username}` : undefined
                    }
                    actionLabel="Lihat Lelang"
                  />
                  {(a as unknown as { confirmation_deadline?: string | null })
                    .confirmation_deadline && (
                    <ConfirmationCountdown
                      deadline={
                        (a as unknown as { confirmation_deadline: string })
                          .confirmation_deadline
                      }
                      label="Batas buyer konfirmasi"
                    />
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    );

  return (
    <ProfileTabs
      variant="secondary"
      defaultTab="berlangsung"
      rightAction={<ApprovalStatusButton count={pendingApprovalCount} />}
      tabs={[
        {
          id: "berlangsung",
          label: "Berlangsung",
          count: berlangsungCount,
          content: berlangsung,
        },
        {
          id: "selesai",
          label: "Selesai",
          count: selesai.length,
          content:
            selesai.length === 0 ? (
              <EmptyState message="Belum ada lelang yang selesai." />
            ) : (
              <Grid items={selesai} />
            ),
        },
        {
          id: "gagal",
          label: "Gagal",
          count: gagal.length,
          content:
            gagal.length === 0 ? (
              <EmptyState message="Tidak ada lelang yang gagal (berakhir tanpa pemenang)." />
            ) : (
              <Grid items={gagal} />
            ),
        },
      ]}
    />
  );
}
