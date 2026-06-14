"use client";

import { BookOpen, ClipboardList, X } from "lucide-react";

interface MiddlemanGuideModalProps {
  open: boolean;
  onClose: () => void;
}

const STEPS: {
  number: number;
  actor: string;
  actorColor: string;
  title: string;
  desc: string;
}[] = [
  {
    number: 1,
    actor: "Semua",
    actorColor: "bg-gray-100 text-gray-600",
    title: "Buat grup chat",
    desc: "Buyer, Seller, dan Middleman bergabung ke dalam satu grup chat.",
  },
  {
    number: 2,
    actor: "Buyer / Seller",
    actorColor: "bg-teal-100 text-teal-700",
    title: "Kirim Form Middleman",
    desc: 'Buka Form Middleman lewat ikon di header grup, isi detail transaksi (Buyer, Seller, Price, Tax), lalu kirim ke grup.',
  },
  {
    number: 3,
    actor: "Middleman",
    actorColor: "bg-teal-100 text-teal-700",
    title: "Kirim info rekening",
    desc: "Middleman mengecek detail, lalu mengirimkan nomor rekening tujuan pembayaran ke grup.",
  },
  {
    number: 4,
    actor: "Buyer",
    actorColor: "bg-teal-100 text-teal-700",
    title: "Transfer dana",
    desc: "Buyer mentransfer dana sesuai harga ke rekening Middleman.",
  },
  {
    number: 5,
    actor: "Middleman",
    actorColor: "bg-teal-100 text-teal-700",
    title: "Konfirmasi pembayaran",
    desc: "Middleman mengonfirmasi dana sudah diterima, lalu memberi sinyal kepada Seller untuk mengirim barang.",
  },
  {
    number: 6,
    actor: "Seller",
    actorColor: "bg-green-100 text-green-700",
    title: "Kirim barang",
    desc: "Seller mengirim barang/kartu ke Buyer dan membagikan bukti pengiriman di grup.",
  },
  {
    number: 7,
    actor: "Buyer",
    actorColor: "bg-teal-100 text-teal-700",
    title: "Konfirmasi terima barang",
    desc: "Buyer mengonfirmasi barang sudah diterima dengan kondisi sesuai.",
  },
  {
    number: 8,
    actor: "Middleman",
    actorColor: "bg-teal-100 text-teal-700",
    title: "Release dana ke Seller",
    desc: "Middleman meneruskan dana ke Seller. Transaksi selesai.",
  },
];

export function MiddlemanGuideModal({
  open,
  onClose,
}: MiddlemanGuideModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Tutup"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm flex flex-col overflow-hidden max-h-[90vh]">
        <div className="h-1 bg-gradient-to-r from-teal-500 to-teal-500" />

        <div className="flex items-center justify-between px-5 pt-4 pb-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center shrink-0">
              <BookOpen className="h-[18px] w-[18px] text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 text-sm leading-tight">
                Panduan Form Middleman
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Cara kerja transaksi middleman
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mx-5 border-t border-gray-100 shrink-0" />

        <div className="overflow-y-auto px-5 py-4 flex flex-col gap-4">
          {/* What is middleman */}
          <div className="rounded-xl bg-teal-50 border border-teal-100 px-4 py-3">
            <p className="text-xs font-semibold text-teal-700 mb-1">
              Apa itu Middleman?
            </p>
            <p className="text-xs text-teal-600 leading-relaxed">
              Middleman adalah pihak ketiga terpercaya yang menjamin keamanan
              transaksi. Dana ditahan sementara oleh Middleman hingga kedua
              pihak menyelesaikan kewajibannya.
            </p>
          </div>

          {/* Icon hint */}
          <div className="rounded-xl bg-teal-50 border border-teal-100 px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center shrink-0">
              <ClipboardList className="h-4 w-4 text-white" />
            </div>
            <p className="text-xs text-teal-700 leading-relaxed">
              Tekan ikon ini di pojok kanan header grup untuk membuka
              Form Middleman.
            </p>
          </div>

          {/* Steps */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Alur Transaksi
            </p>
            <div className="flex flex-col">
              {STEPS.map((step, idx) => (
                <div key={step.number} className="flex gap-3">
                  <div className="flex flex-col items-center shrink-0">
                    <div className="w-7 h-7 rounded-full bg-teal-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {step.number}
                    </div>
                    {idx < STEPS.length - 1 && (
                      <div className="w-px flex-1 bg-teal-100 my-1" />
                    )}
                  </div>
                  <div className={idx < STEPS.length - 1 ? "pb-4" : ""}>
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-semibold text-gray-800 leading-tight">
                        {step.title}
                      </p>
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${step.actorColor}`}
                      >
                        {step.actor}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Note */}
          <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-3">
            <p className="text-xs font-semibold text-amber-700 mb-1">
              Catatan Penting
            </p>
            <p className="text-xs text-amber-600 leading-relaxed">
              Pastikan semua pihak sepakat sebelum transaksi dimulai. Gunakan
              hanya Middleman resmi yang terdaftar di platform.
            </p>
          </div>
        </div>

        <div className="px-5 pb-5 pt-3 shrink-0 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            Mengerti
          </button>
        </div>
      </div>
    </div>
  );
}
