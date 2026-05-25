"use client";

import { ArrowRight, ClipboardList, HelpCircle, Send, ShieldCheck, X } from "lucide-react";
import { useState } from "react";

interface MiddlemanSchemaModalProps {
  open: boolean;
  onClose: () => void;
  onSend: (text: string) => void;
  onOpenGuide: () => void;
}

const TAX_OPTIONS = [
  { value: "Buyer", label: "Buyer" },
  { value: "Seller", label: "Seller" },
  { value: "Buyer & Seller", label: "Split" },
] as const;

export function MiddlemanSchemaModal({
  open,
  onClose,
  onSend,
  onOpenGuide,
}: MiddlemanSchemaModalProps) {
  const [buyer, setBuyer] = useState("");
  const [seller, setSeller] = useState("");
  const [price, setPrice] = useState("");
  const [tax, setTax] = useState("Buyer");

  function handleSend() {
    const text = `📋 Form Middleman\n\n👤 Buyer: ${buyer}\n🏷️ Seller: ${seller}\n💰 Price: Rp ${price}\n🧾 Tax: ${tax}`;
    onSend(text);
    onClose();
    setBuyer("");
    setSeller("");
    setPrice("");
    setTax("Buyer");
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Tutup"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm flex flex-col overflow-hidden">
        {/* Accent bar */}
        <div className="h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
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
              className="p-1.5 rounded-lg text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
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

        {/* Form */}
        <div className="p-5 flex flex-col gap-4">
          {/* Buyer & Seller */}
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Buyer
              </label>
              <input
                value={buyer}
                onChange={(e) => setBuyer(e.target.value)}
                placeholder="Nama buyer"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all"
              />
            </div>
            <div className="shrink-0 pb-2.5">
              <ArrowRight className="h-4 w-4 text-gray-300" />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Seller
              </label>
              <input
                value={seller}
                onChange={(e) => setSeller(e.target.value)}
                placeholder="Nama seller"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Price */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Price
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400 pointer-events-none">
                Rp
              </span>
              <input
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all"
              />
            </div>
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
                      ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                      : "bg-gray-50 border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-600",
                  ].join(" ")}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="rounded-xl border border-blue-100 overflow-hidden">
            <div className="px-3.5 py-2 bg-blue-600 flex items-center gap-2">
              <ShieldCheck className="h-3.5 w-3.5 text-white/80 shrink-0" />
              <span className="text-xs font-semibold text-white">
                Preview Pesan
              </span>
            </div>
            <div className="px-4 py-3 bg-blue-50 text-xs text-blue-900 leading-relaxed space-y-0.5">
              <p className="font-semibold">📋 Form Middleman</p>
              <p className="pt-1">👤 Buyer: {buyer || <span className="text-blue-400">...</span>}</p>
              <p>🏷️ Seller: {seller || <span className="text-blue-400">...</span>}</p>
              <p>💰 Price: Rp {price || <span className="text-blue-400">...</span>}</p>
              <p>🧾 Tax: {tax}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 flex gap-2.5">
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
            disabled={!buyer.trim() || !seller.trim() || !price.trim()}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition-colors"
          >
            <Send className="h-3.5 w-3.5" />
            Kirim
          </button>
        </div>
      </div>
    </div>
  );
}
