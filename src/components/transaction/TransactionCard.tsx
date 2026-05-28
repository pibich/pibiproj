"use client";

import {
  Banknote,
  CheckCircle,
  Clock,
  Eye,
  Gavel,
  Package,
  Truck,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { TransactionStatus } from "@/types/supabase";
import { ReceiptProofModal } from "./ReceiptProofModal";
import { ShippingProofModal } from "./ShippingProofModal";

type TransactionWithRelations = {
  id: string;
  auction_id: string;
  seller_id: string;
  buyer_id: string;
  middleman_id: string | null;
  amount: number;
  status: TransactionStatus;
  shipping_tracking_number: string | null;
  shipping_photo_url: string | null;
  receipt_photo_url: string | null;
  stream_channel_id: string | null;
  auction: { id: string; title: string; images: string[] } | null;
  seller: { id: string; username: string; name: string } | null;
  buyer: { id: string; username: string; name: string } | null;
  middleman: { id: string; username: string; name: string } | null;
};

interface TransactionCardProps {
  transaction: TransactionWithRelations;
  currentUserId: string;
  onActionComplete?: () => void;
}

const STEPS: { status: TransactionStatus; label: string }[] = [
  { status: "awaiting_payment", label: "Menunggu Pembayaran" },
  { status: "awaiting_shipment", label: "Persiapan Kirim" },
  { status: "shipped", label: "Dikirim" },
  { status: "delivery_confirmed", label: "Diterima" },
  { status: "completed", label: "Selesai" },
];

const STATUS_ORDER: Record<TransactionStatus, number> = {
  awaiting_payment: 0,
  awaiting_shipment: 1,
  shipped: 2,
  delivery_confirmed: 3,
  completed: 4,
  cancelled: -1,
};

const statusLabels: Record<TransactionStatus, string> = {
  awaiting_payment: "Menunggu Pembayaran",
  awaiting_shipment: "Siap Dikirim",
  shipped: "Dalam Pengiriman",
  delivery_confirmed: "Menunggu Rilis Dana",
  completed: "Selesai",
  cancelled: "Dibatalkan",
};

function formatIDR(amount: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);
}

export function TransactionCard({
  transaction: tx,
  currentUserId,
  onActionComplete,
}: TransactionCardProps) {
  const router = useRouter();
  const [showShipping, setShowShipping] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [confirmRelease, setConfirmRelease] = useState(false);
  const [confirmPayment, setConfirmPayment] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSeller = tx.seller_id === currentUserId;
  const isBuyer = tx.buyer_id === currentUserId;
  const isMiddleman = tx.middleman_id === currentUserId;

  const currentStep = STATUS_ORDER[tx.status] ?? 0;

  async function callAction(endpoint: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/transactions/${tx.id}/${endpoint}`, { method: "PATCH" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Terjadi kesalahan");
      }
      router.refresh();
      onActionComplete?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  const auctionTitle = tx.auction?.title ?? "Lelang";
  const auctionImage = tx.auction?.images?.[0];

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-gray-50">
          <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden shrink-0">
            {auctionImage ? (
              // biome-ignore lint/performance/noImgElement: Supabase CDN
              <img src={auctionImage} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Gavel className="h-4 w-4 text-gray-400" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 line-clamp-1">{auctionTitle}</p>
            <p className="text-xs text-gray-500">{formatIDR(tx.amount)}</p>
          </div>
          <Link
            href={`/auctions/${tx.auction_id}`}
            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Eye className="h-4 w-4" />
          </Link>
        </div>

        {/* Stepper */}
        <div className="px-4 py-3">
          <div className="flex items-center gap-1">
            {STEPS.map((step, i) => {
              const done = i <= currentStep;
              const active = i === currentStep;
              return (
                <div key={step.status} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center">
                    <div
                      className={[
                        "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0",
                        done && !active ? "bg-emerald-500 text-white" : "",
                        active ? "bg-blue-600 text-white ring-2 ring-blue-200" : "",
                        !done ? "bg-gray-100 text-gray-400" : "",
                      ].join(" ")}
                    >
                      {done && !active ? <CheckCircle className="h-3 w-3" /> : i + 1}
                    </div>
                    <span className={`text-[9px] mt-0.5 text-center leading-tight w-12 ${active ? "text-blue-600 font-semibold" : done ? "text-emerald-600" : "text-gray-400"}`}>
                      {step.label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`h-px flex-1 mx-0.5 mb-3 ${i < currentStep ? "bg-emerald-400" : "bg-gray-200"}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Status detail */}
        <div className="px-4 pb-3">
          {tx.status === "shipped" && tx.shipping_tracking_number && (
            <div className="flex items-center gap-2 text-xs text-blue-700 bg-blue-50 rounded-lg px-3 py-2">
              <Truck className="h-3.5 w-3.5 shrink-0" />
              <span>Resi: <strong>{tx.shipping_tracking_number}</strong></span>
            </div>
          )}
          {tx.status === "delivery_confirmed" && (
            <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2">
              <CheckCircle className="h-3.5 w-3.5 shrink-0" />
              <span>Buyer telah konfirmasi penerimaan. Menunggu middleman melepaskan dana.</span>
            </div>
          )}
          {tx.middleman && tx.status !== "completed" && (
            <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
              <Package className="h-3 w-3 shrink-0" />
              <span>Middleman: @{tx.middleman.username}</span>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="px-4 pb-4 flex flex-col gap-2">
          {error && (
            <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          {/* Middleman: konfirmasi pembayaran */}
          {isMiddleman && tx.status === "awaiting_payment" && (
            confirmPayment ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmPayment(false)}
                  className="flex-1 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => callAction("confirm-payment")}
                  disabled={loading}
                  className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold disabled:opacity-50"
                >
                  {loading ? "Memproses..." : "Ya, Konfirmasi"}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmPayment(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold"
              >
                <CheckCircle className="h-4 w-4" />
                Konfirmasi Pembayaran Diterima
              </button>
            )
          )}

          {/* Seller: upload bukti pengiriman */}
          {isSeller && tx.status === "awaiting_shipment" && (
            <button
              type="button"
              onClick={() => setShowShipping(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold"
            >
              <Truck className="h-4 w-4" />
              Upload Bukti Pengiriman
            </button>
          )}

          {/* Buyer: konfirmasi penerimaan */}
          {isBuyer && tx.status === "shipped" && (
            <button
              type="button"
              onClick={() => setShowReceipt(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold"
            >
              <CheckCircle className="h-4 w-4" />
              Konfirmasi Penerimaan
            </button>
          )}

          {/* Middleman: lepaskan dana */}
          {isMiddleman && tx.status === "delivery_confirmed" && (
            confirmRelease ? (
              <div className="flex flex-col gap-2">
                <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  Pastikan Anda sudah memverifikasi foto bukti penerimaan dari buyer sebelum melepaskan dana.
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmRelease(false)}
                    className="flex-1 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={() => callAction("release-funds")}
                    disabled={loading}
                    className="flex-1 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold disabled:opacity-50"
                  >
                    {loading ? "Memproses..." : "Lepaskan Dana"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {tx.receipt_photo_url && (
                  <a
                    href={tx.receipt_photo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 py-2 border border-gray-200 text-sm text-gray-600 rounded-xl hover:bg-gray-50"
                  >
                    <Eye className="h-4 w-4" />
                    Lihat Bukti Penerimaan
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setConfirmRelease(true)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-semibold"
                >
                  <Banknote className="h-4 w-4" />
                  Lepaskan Dana ke Seller
                </button>
              </div>
            )
          )}

          {/* Status info jika tidak ada action */}
          {((isSeller && !["awaiting_shipment"].includes(tx.status)) ||
            (isBuyer && !["shipped"].includes(tx.status)) ||
            (isMiddleman && !["awaiting_payment", "delivery_confirmed"].includes(tx.status))) &&
            tx.status !== "completed" && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              <span>{statusLabels[tx.status]}</span>
            </div>
          )}
        </div>
      </div>

      {showShipping && (
        <ShippingProofModal
          transactionId={tx.id}
          auctionTitle={auctionTitle}
          onClose={() => setShowShipping(false)}
          onSuccess={() => { setShowShipping(false); router.refresh(); onActionComplete?.(); }}
        />
      )}

      {showReceipt && (
        <ReceiptProofModal
          transactionId={tx.id}
          auctionTitle={auctionTitle}
          onClose={() => setShowReceipt(false)}
          onSuccess={() => { setShowReceipt(false); router.refresh(); onActionComplete?.(); }}
        />
      )}
    </>
  );
}
