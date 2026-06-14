"use client";

import { AlertCircle, CheckCircle2, ChevronDown, ClipboardList, HelpCircle, Loader2, Send, ShieldCheck, X } from "lucide-react";
import { useEffect, useState } from "react";
import { formatIDR } from "@/lib/utils";

interface EligibleAuction {
  id: string;
  title: string;
  current_price: number;
  images: string[] | null;
  seller_id: string;
  winner_id: string | null;
  seller: { username: string; name: string } | null;
  winner: { username: string; name: string } | null;
}

interface TransactionData {
  id: string;
  status: "awaiting_payment" | "awaiting_shipment" | "shipped" | "delivery_confirmed" | "completed" | "cancelled";
}

interface MiddlemanSchemaModalProps {
  open: boolean;
  onClose: () => void;
  onSend: (text: string) => void;
  onOpenGuide: () => void;
  currentUserId?: string;
  middlemanId?: string;
  channelId?: string;
}

const TAX_OPTIONS = [
  { value: "Buyer", label: "Buyer" },
  { value: "Seller", label: "Seller" },
  { value: "Buyer & Seller", label: "Split" },
] as const;

const STATUS_LABELS: Record<string, string> = {
  awaiting_payment: "Belum Dibayar",
  awaiting_shipment: "Sudah Dibayar — Menunggu Kirim",
  shipped: "Sedang Dikirim",
  delivery_confirmed: "Paket Diterima — Menunggu Dana",
  completed: "Selesai",
  cancelled: "Dibatalkan",
};

const STATUS_COLORS: Record<string, string> = {
  awaiting_payment: "text-amber-600 bg-amber-50 border-amber-200",
  awaiting_shipment: "text-teal-600 bg-teal-50 border-teal-200",
  shipped: "text-teal-600 bg-teal-50 border-teal-200",
  delivery_confirmed: "text-emerald-600 bg-emerald-50 border-emerald-200",
  completed: "text-green-700 bg-green-50 border-green-200",
  cancelled: "text-gray-500 bg-gray-50 border-gray-200",
};

export function MiddlemanSchemaModal({
  open,
  onClose,
  onSend,
  onOpenGuide,
  currentUserId,
  middlemanId,
  channelId,
}: MiddlemanSchemaModalProps) {
  const [buyer, setBuyer] = useState("");
  const [seller, setSeller] = useState("");
  const [price, setPrice] = useState("");
  const [tax, setTax] = useState("Buyer");
  const [selectedAuctionId, setSelectedAuctionId] = useState("");
  const [auctions, setAuctions] = useState<EligibleAuction[]>([]);
  const [loadingAuctions, setLoadingAuctions] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [transactionData, setTransactionData] = useState<TransactionData | null>(null);
  const [loadingTx, setLoadingTx] = useState(false);
  const [confirmPayment, setConfirmPayment] = useState(false);
  const [confirmRelease, setConfirmRelease] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const isMiddleman = currentUserId === middlemanId;
  const selectedAuction = auctions.find((a) => a.id === selectedAuctionId);

  useEffect(() => {
    if (!open || !currentUserId) return;
    setLoadingAuctions(true);
    fetch("/api/auctions/for-transaction")
      .then((r) => r.json())
      .then((data) => setAuctions(data.auctions ?? []))
      .catch(() => setAuctions([]))
      .finally(() => setLoadingAuctions(false));
  }, [open, currentUserId]);

  useEffect(() => {
    if (!isMiddleman || !selectedAuctionId) {
      setTransactionData(null);
      return;
    }
    setLoadingTx(true);
    fetch(`/api/transactions/by-auction/${selectedAuctionId}`)
      .then((r) => r.json())
      .then((data) => setTransactionData(data.transaction ?? null))
      .catch(() => setTransactionData(null))
      .finally(() => setLoadingTx(false));
  }, [isMiddleman, selectedAuctionId]);

  function handleAuctionSelect(auctionId: string) {
    setSelectedAuctionId(auctionId);
    setConfirmPayment(false);
    setConfirmRelease(false);
  }

  async function handleConfirmPayment() {
    if (!transactionData) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/transactions/${transactionData.id}/confirm-payment`, { method: "PATCH" });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Gagal mengkonfirmasi pembayaran");
      } else {
        setTransactionData((prev) => prev ? { ...prev, status: "awaiting_shipment" } : null);
        setConfirmPayment(false);
      }
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReleaseFunds() {
    if (!transactionData) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/transactions/${transactionData.id}/release-funds`, { method: "PATCH" });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Gagal melepaskan dana");
      } else {
        setTransactionData((prev) => prev ? { ...prev, status: "completed" } : null);
        setConfirmRelease(false);
      }
    } finally {
      setActionLoading(false);
    }
  }

  async function handleSend() {
    setError(null);

    const displayBuyer = selectedAuction?.winner
      ? `${selectedAuction.winner.name} (@${selectedAuction.winner.username})`
      : buyer;
    const displaySeller = selectedAuction?.seller
      ? `${selectedAuction.seller.name} (@${selectedAuction.seller.username})`
      : seller;
    const displayPrice = selectedAuction
      ? formatIDR(selectedAuction.current_price)
      : `Rp ${price}`;

    if (selectedAuction && currentUserId) {
      setSubmitting(true);
      try {
        const res = await fetch("/api/transactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            auction_id: selectedAuction.id,
            middleman_id: middlemanId ?? null,
            tax_bearer: tax,
            stream_channel_id: channelId ?? null,
          }),
        });
        if (!res.ok) {
          const data = await res.json();
          if (res.status !== 409) {
            throw new Error(data.error ?? "Gagal membuat transaksi");
          }
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Terjadi kesalahan");
        setSubmitting(false);
        return;
      }
      setSubmitting(false);
    }

    const auctionLine = selectedAuction ? `\n🎯 Lelang: ${selectedAuction.title}` : "";
    const text = `📋 Form Middleman${auctionLine}\n\n👤 Buyer: ${displayBuyer}\n🏷️ Seller: ${displaySeller}\n💰 Price: ${displayPrice}\n🧾 Tax: ${tax}`;
    onSend(text);
    onClose();
    resetForm();
  }

  function resetForm() {
    setBuyer("");
    setSeller("");
    setPrice("");
    setTax("Buyer");
    setSelectedAuctionId("");
    setError(null);
    setTransactionData(null);
    setConfirmPayment(false);
    setConfirmRelease(false);
  }

  if (!open) return null;

  const canSend = selectedAuction
    ? !submitting
    : buyer.trim() !== "" && seller.trim() !== "" && price.trim() !== "" && !submitting;

  const displayBuyer = selectedAuction?.winner
    ? `${selectedAuction.winner.name} (@${selectedAuction.winner.username})`
    : null;
  const displaySeller = selectedAuction?.seller
    ? `${selectedAuction.seller.name} (@${selectedAuction.seller.username})`
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Tutup"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm flex flex-col overflow-hidden max-h-[90vh]">
        <div className="h-1 bg-gradient-to-r from-teal-500 to-teal-500" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center shrink-0">
              <ClipboardList className="h-[18px] w-[18px] text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 text-sm leading-tight">
                Form Middleman
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Template transaksi middleman
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onOpenGuide}
              className="p-1.5 rounded-lg text-teal-400 hover:text-teal-600 hover:bg-teal-50 transition-colors"
              title="Panduan"
            >
              <HelpCircle className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mx-5 border-t border-gray-100" />

        {/* Form (scrollable) */}
        <div className="p-5 flex flex-col gap-4 overflow-y-auto">
          {/* Auction selector */}
          {currentUserId && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Pilih Lelang{" "}
                <span className="text-gray-400 font-normal">(opsional)</span>
              </label>
              {loadingAuctions ? (
                <div className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-400">
                  Memuat lelang...
                </div>
              ) : auctions.length === 0 ? (
                <div className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-400">
                  Tidak ada lelang yang perlu dimiddleman
                </div>
              ) : (
                <div className="relative">
                  <select
                    value={selectedAuctionId}
                    onChange={(e) => handleAuctionSelect(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-3 pr-8 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent focus:bg-white transition-all appearance-none"
                  >
                    <option value="">— Pilih lelang (opsional) —</option>
                    {auctions.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.title}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              )}
            </div>
          )}

          {/* Buyer & Seller — auto-fill when auction selected, manual otherwise */}
          <div className="flex items-start gap-2">
            <div className="flex-1 min-w-0">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Buyer
              </label>
              {selectedAuction ? (
                <div
                  title={displayBuyer ?? undefined}
                  className="w-full rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5 text-sm text-gray-700 truncate"
                >
                  {displayBuyer ?? <span className="text-gray-400 italic">Tidak ada pemenang</span>}
                </div>
              ) : (
                <input
                  value={buyer}
                  onChange={(e) => setBuyer(e.target.value)}
                  placeholder="Nama buyer"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent focus:bg-white transition-all"
                />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Seller
              </label>
              {selectedAuction ? (
                <div
                  title={displaySeller ?? undefined}
                  className="w-full rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5 text-sm text-gray-700 truncate"
                >
                  {displaySeller ?? <span className="text-gray-400 italic">—</span>}
                </div>
              ) : (
                <input
                  value={seller}
                  onChange={(e) => setSeller(e.target.value)}
                  placeholder="Nama seller"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent focus:bg-white transition-all"
                />
              )}
            </div>
          </div>

          {/* Price — auto-fill when auction selected */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Price
            </label>
            {selectedAuction ? (
              <div className="w-full rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5 text-sm font-semibold text-teal-700">
                {formatIDR(selectedAuction.current_price)}
              </div>
            ) : (
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400 pointer-events-none">
                  Rp
                </span>
                <input
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent focus:bg-white transition-all"
                />
              </div>
            )}
          </div>

          {/* Tax toggle */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Tax ditanggung
            </label>
            <div className="flex gap-2">
              {TAX_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setTax(opt.value)}
                  className={[
                    "flex-1 py-2 rounded-xl text-xs font-semibold border transition-all",
                    tax === opt.value
                      ? "bg-teal-600 border-teal-600 text-white shadow-sm"
                      : "bg-gray-50 border-gray-200 text-gray-500 hover:border-teal-300 hover:text-teal-600",
                  ].join(" ")}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="rounded-xl border border-teal-100 overflow-hidden">
            <div className="px-3.5 py-2 bg-teal-600 flex items-center gap-2">
              <ShieldCheck className="h-3.5 w-3.5 text-white/80 shrink-0" />
              <span className="text-xs font-semibold text-white">
                Preview Pesan
              </span>
            </div>
            <div className="px-4 py-3 bg-teal-50 text-xs text-teal-900 leading-relaxed space-y-0.5">
              <p className="font-semibold">📋 Form Middleman</p>
              {selectedAuction && (
                <p className="pt-0.5">🎯 Lelang: {selectedAuction.title}</p>
              )}
              <p className="pt-1">
                👤 Buyer:{" "}
                {(displayBuyer ?? buyer) || (
                  <span className="text-teal-400">...</span>
                )}
              </p>
              <p>
                🏷️ Seller:{" "}
                {(displaySeller ?? seller) || (
                  <span className="text-teal-400">...</span>
                )}
              </p>
              <p>
                💰 Price:{" "}
                {selectedAuction
                  ? formatIDR(selectedAuction.current_price)
                  : price
                    ? `Rp ${price}`
                    : <span className="text-teal-400">...</span>}
              </p>
              <p>🧾 Tax: {tax}</p>
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 flex items-center gap-2">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              {error}
            </p>
          )}

          {/* ── Panel Status Transaksi (middleman only) ── */}
          {isMiddleman && selectedAuctionId && (
            <div className="rounded-xl border border-teal-100 overflow-hidden">
              <div className="px-3.5 py-2 bg-teal-600 flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5 text-white/80 shrink-0" />
                <span className="text-xs font-semibold text-white">
                  Status Transaksi
                </span>
              </div>
              <div className="px-4 py-3 bg-teal-50 flex flex-col gap-3">
                {loadingTx ? (
                  <div className="flex items-center gap-2 text-teal-500 text-xs">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Memuat status...
                  </div>
                ) : !transactionData ? (
                  <p className="text-xs text-teal-400 italic">
                    Belum ada transaksi tercatat untuk lelang ini.
                  </p>
                ) : (
                  <>
                    <div
                      className={`text-xs font-semibold px-3 py-2 rounded-lg border ${STATUS_COLORS[transactionData.status] ?? "text-gray-600 bg-gray-50 border-gray-200"}`}
                    >
                      {STATUS_LABELS[transactionData.status] ?? transactionData.status}
                    </div>

                    {/* Confirm payment action */}
                    {transactionData.status === "awaiting_payment" && (
                      <>
                        {confirmPayment ? (
                          <div className="flex flex-col gap-2 bg-white rounded-xl border border-amber-200 p-3">
                            <p className="text-xs text-amber-700 font-medium">
                              Konfirmasi bahwa pembayaran sudah diterima?
                            </p>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => setConfirmPayment(false)}
                                className="flex-1 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-600 hover:bg-gray-50"
                              >
                                Batal
                              </button>
                              <button
                                type="button"
                                onClick={handleConfirmPayment}
                                disabled={actionLoading}
                                className="flex-1 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-1"
                              >
                                {actionLoading && <Loader2 className="h-3 w-3 animate-spin" />}
                                Ya, Konfirmasi
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmPayment(true)}
                            className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold transition-colors"
                          >
                            Konfirmasi Pembayaran Diterima
                          </button>
                        )}
                      </>
                    )}

                    {/* Release funds action */}
                    {transactionData.status === "delivery_confirmed" && (
                      <>
                        {confirmRelease ? (
                          <div className="flex flex-col gap-2 bg-white rounded-xl border border-emerald-200 p-3">
                            <p className="text-xs text-emerald-700 font-medium">
                              Lepaskan dana ke seller? Tindakan ini tidak dapat dibatalkan.
                            </p>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => setConfirmRelease(false)}
                                className="flex-1 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-600 hover:bg-gray-50"
                              >
                                Batal
                              </button>
                              <button
                                type="button"
                                onClick={handleReleaseFunds}
                                disabled={actionLoading}
                                className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-1"
                              >
                                {actionLoading && <Loader2 className="h-3 w-3 animate-spin" />}
                                Ya, Lepaskan
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmRelease(true)}
                            className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors"
                          >
                            Lepaskan Dana ke Seller
                          </button>
                        )}
                      </>
                    )}

                    {transactionData.status === "completed" && (
                      <div className="flex items-center gap-2 text-green-700 text-xs font-semibold">
                        <CheckCircle2 className="h-4 w-4" />
                        Transaksi selesai ✓
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 flex gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors font-medium"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSend}
            disabled={!canSend}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition-colors"
          >
            <Send className="h-3.5 w-3.5" />
            {submitting ? "Memproses..." : "Kirim"}
          </button>
        </div>
      </div>
    </div>
  );
}
