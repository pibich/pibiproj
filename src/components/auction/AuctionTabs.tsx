"use client";

import { AlertTriangle, MapPin, Package, Truck } from "lucide-react";
import { useState } from "react";
import { formatIDR } from "@/lib/utils";

interface BidItem {
  id: string;
  username: string;
  amount: number;
  warningCount: number;
}

interface AuctionTabsProps {
  description: string | null;
  bids: BidItem[];
  freeShipping: boolean;
  province: string | null;
}

const TABS = [
  { id: "deskripsi", label: "Deskripsi" },
  { id: "riwayat", label: "Riwayat Tawaran" },
  { id: "pengiriman", label: "Pengiriman" },
] as const;

export function AuctionTabs({
  description,
  bids,
  freeShipping,
  province,
}: AuctionTabsProps) {
  const [active, setActive] = useState<string>("deskripsi");

  return (
    <div>
      <div className="flex gap-6 border-b border-slate-200">
        {TABS.map((tab) => {
          const isActive = tab.id === active;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActive(tab.id)}
              className={`-mb-px border-b-2 px-1 pb-3 text-sm font-semibold transition-colors ${
                isActive
                  ? "border-teal-600 text-teal-600"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="pt-5">
        {active === "deskripsi" &&
          (description ? (
            <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600">
              {description}
            </p>
          ) : (
            <p className="text-sm text-slate-400">Tidak ada deskripsi.</p>
          ))}

        {active === "riwayat" &&
          (bids.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">
              Belum ada tawaran. Jadilah yang pertama!
            </p>
          ) : (
            <div className="flex max-h-80 flex-col gap-2 overflow-y-auto">
              {bids.map((bid, i) => (
                <div
                  key={bid.id}
                  className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm ${
                    i === 0
                      ? "border-teal-200 bg-teal-50 font-semibold text-teal-700"
                      : "border-slate-100 bg-white text-slate-600"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-white/70 font-mono text-xs">
                      {i + 1}
                    </span>
                    <span>@{bid.username}</span>
                    {bid.warningCount > 0 && (
                      <span
                        title={`Pembeli ini memiliki ${bid.warningCount}x peringatan`}
                        className="flex items-center gap-0.5 text-orange-500"
                      >
                        <AlertTriangle className="h-3 w-3" />
                        <span className="text-xs">{bid.warningCount}</span>
                      </span>
                    )}
                  </div>
                  <span className="font-mono">{formatIDR(bid.amount)}</span>
                </div>
              ))}
            </div>
          ))}

        {active === "pengiriman" && (
          <div className="flex flex-col gap-3 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <Truck
                className={`h-4 w-4 ${freeShipping ? "text-teal-600" : "text-slate-400"}`}
              />
              {freeShipping
                ? "Gratis ongkir — ditanggung penjual."
                : "Ongkir ditanggung pembeli."}
            </div>
            {province && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-slate-400" />
                Dikirim dari {province}
              </div>
            )}
            <div className="flex items-start gap-2 text-slate-500">
              <Package className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
              Detail pengiriman (kurir, estimasi, packing) disepakati dengan
              penjual lewat chat setelah lelang selesai.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
