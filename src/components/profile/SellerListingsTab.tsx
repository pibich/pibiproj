import { Gavel } from "lucide-react";
import { AuctionCard } from "@/components/auction/AuctionCard";
import type { AuctionWithRelations } from "@/components/profile/profile-types";

interface SellerListingsTabProps {
  activeAuctions: AuctionWithRelations[];
  completedAuctions: AuctionWithRelations[];
}

export function SellerListingsTab({
  activeAuctions,
  completedAuctions,
}: SellerListingsTabProps) {
  const isEmpty = activeAuctions.length === 0 && completedAuctions.length === 0;

  if (isEmpty) {
    return (
      <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
        <Gavel className="h-10 w-10 text-gray-300 mx-auto mb-2" />
        <p className="text-gray-500 text-sm">Belum ada lelang</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {activeAuctions.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-4">
            Lelang Aktif
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {activeAuctions.map((a) => (
              <AuctionCard key={a.id} auction={a} />
            ))}
          </div>
        </section>
      )}

      {completedAuctions.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-4">
            Lelang Selesai
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {completedAuctions.map((a) => (
              <AuctionCard key={a.id} auction={a} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
