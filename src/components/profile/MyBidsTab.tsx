import { Package } from "lucide-react";
import { AuctionListCard } from "@/components/profile/AuctionListCard";
import { ProfileTabs } from "@/components/profile/ProfileTabs";
import type {
  BidWithAuction,
  ProfileTransaction,
  WonAuction,
} from "@/components/profile/profile-types";
import { TransactionCard } from "@/components/transaction/TransactionCard";
import { ConfirmationCountdown } from "@/components/ui/ConfirmationCountdown";
import { formatIDR } from "@/lib/utils";

interface MyBidsTabProps {
  bidAktif: BidWithAuction[];
  bidKalah: BidWithAuction[];
  bidMenang: BidWithAuction[];
  buyerTransactions: ProfileTransaction[];
  completedPurchases: ProfileTransaction[];
  menangBelumTransaksi: WonAuction[];
  currentUserId: string;
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
      <Package className="h-10 w-10 text-gray-300 mx-auto mb-2" />
      <p className="text-gray-500 text-sm">{message}</p>
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
  const berlangsungCount =
    bidAktif.length + buyerTransactions.length + menangBelumTransaksi.length;

  // Won bids with no transaction record at all (edge case) — surface under Selesai.
  const showMenangFallback =
    bidMenang.length > 0 &&
    buyerTransactions.length === 0 &&
    menangBelumTransaksi.length === 0;
  const selesaiCount =
    completedPurchases.length + (showMenangFallback ? bidMenang.length : 0);

  const berlangsung =
    berlangsungCount === 0 ? (
      <EmptyState message="Tidak ada bid atau transaksi yang sedang berjalan." />
    ) : (
      <div className="flex flex-col gap-6">
        {bidAktif.length > 0 && (
          <section>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
              Bid Aktif
              <span className="ml-auto normal-case font-normal text-gray-400">
                {bidAktif.length} bid
              </span>
            </h3>
            <div className="flex flex-col gap-2">
              {bidAktif.map((bid) => (
                <AuctionListCard
                  key={bid.id}
                  image={bid.auction?.images?.[0] ?? null}
                  title={bid.auction?.title ?? "Lelang"}
                  href={`/auctions/${bid.auction?.id}`}
                  price={bid.auction?.current_price ?? 0}
                  badge={
                    bid.is_winning
                      ? { label: "TERTINGGI", variant: "success" }
                      : { label: "DIKALAHKAN", variant: "warning" }
                  }
                  subInfo={`Bid saya: ${formatIDR(bid.amount)} | Saat ini: ${formatIDR(bid.auction?.current_price ?? 0)}`}
                />
              ))}
            </div>
          </section>
        )}

        {buyerTransactions.length > 0 && (
          <section>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-500 inline-block" />
              Dalam Transaksi
              <span className="ml-auto normal-case font-normal text-gray-400">
                {buyerTransactions.length} transaksi
              </span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {buyerTransactions.map((tx) => (
                <TransactionCard
                  key={tx.id}
                  transaction={tx}
                  currentUserId={currentUserId}
                />
              ))}
            </div>
          </section>
        )}

        {menangBelumTransaksi.length > 0 && (
          <section>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              Menang — Belum Transaksi
              <span className="ml-auto normal-case font-normal text-gray-400">
                {menangBelumTransaksi.length} lelang
              </span>
            </h3>
            <div className="flex flex-col gap-2">
              {menangBelumTransaksi.map((a) => (
                <div key={a.id} className="flex flex-col gap-1.5">
                  <AuctionListCard
                    image={a.images?.[0] ?? null}
                    title={a.title}
                    href={`/auctions/${a.id}`}
                    price={a.current_price}
                    badge={{ label: "MENANG", variant: "success" }}
                    subInfo={
                      a.seller ? `Seller: @${a.seller.username}` : undefined
                    }
                    chatHref={`/chat?seller=${a.seller_id}`}
                  />
                  {a.confirmation_deadline && (
                    <ConfirmationCountdown
                      deadline={a.confirmation_deadline}
                      label="Batas konfirmasi ke seller"
                    />
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    );

  const selesai =
    selesaiCount === 0 ? (
      <EmptyState message="Belum ada pembelian yang selesai." />
    ) : (
      <div className="flex flex-col gap-6">
        {completedPurchases.length > 0 && (
          <section>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              Riwayat Pembelian
              <span className="ml-auto normal-case font-normal text-gray-400">
                {completedPurchases.length} selesai
              </span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {completedPurchases.map((tx) => (
                <TransactionCard
                  key={tx.id}
                  transaction={tx}
                  currentUserId={currentUserId}
                />
              ))}
            </div>
          </section>
        )}

        {showMenangFallback && (
          <section>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              Menang
            </h3>
            <div className="flex flex-col gap-2">
              {bidMenang.map((bid) => (
                <AuctionListCard
                  key={bid.id}
                  image={bid.auction?.images?.[0] ?? null}
                  title={bid.auction?.title ?? "Lelang"}
                  href={`/auctions/${bid.auction?.id}`}
                  price={bid.auction?.current_price ?? 0}
                  badge={{ label: "MENANG", variant: "success" }}
                  subInfo={
                    bid.auction?.transaction_confirmed
                      ? "Transaksi selesai"
                      : undefined
                  }
                />
              ))}
            </div>
          </section>
        )}
      </div>
    );

  const gagal =
    bidKalah.length === 0 ? (
      <EmptyState message="Tidak ada bid yang kalah. Semua bid Anda masih berjalan atau menang." />
    ) : (
      <div className="flex flex-col gap-2">
        {bidKalah.map((bid) => (
          <AuctionListCard
            key={bid.id}
            image={bid.auction?.images?.[0] ?? null}
            title={bid.auction?.title ?? "Lelang"}
            href={`/auctions/${bid.auction?.id}`}
            price={bid.auction?.current_price ?? 0}
            badge={{ label: "TIDAK MENANG", variant: "default" }}
            subInfo={`Bid saya: ${formatIDR(bid.amount)}`}
          />
        ))}
      </div>
    );

  return (
    <ProfileTabs
      variant="secondary"
      defaultTab="berlangsung"
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
          count: selesaiCount,
          content: selesai,
        },
        {
          id: "gagal",
          label: "Gagal",
          count: bidKalah.length,
          content: gagal,
        },
      ]}
    />
  );
}
