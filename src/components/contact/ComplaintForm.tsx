"use client";

import { Info, MessageCircle } from "lucide-react";

const categories = [
  "Laporan Transaksi",
  "Kendala Lelang",
  "Pertanyaan Umum",
  "Lainnya",
];

const fieldCls =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100";

export function ComplaintForm({ csPhone }: { csPhone: string }) {
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const name = (form.elements.namedItem("name") as HTMLInputElement).value;
    const category = (form.elements.namedItem("category") as HTMLSelectElement)
      .value;
    const auction = (form.elements.namedItem("auction") as HTMLInputElement)
      .value;
    const message = (form.elements.namedItem("message") as HTMLTextAreaElement)
      .value;

    const text = `Halo CS TCG Auction,

Nama: ${name}
Kategori: ${category}${auction ? `\nNomor Lelang: ${auction}` : ""}

Pesan:
${message}`;

    const url = `https://wa.me/${csPhone}?text=${encodeURIComponent(text)}`;
    // Navigate in-place: window.open("_blank") is frequently popup-blocked on
    // mobile; wa.me redirects to the WhatsApp app reliably this way.
    window.location.href = url;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label
            htmlFor="cf-name"
            className="text-sm font-semibold text-slate-700"
          >
            Nama <span className="text-teal-600">*</span>
          </label>
          <input
            id="cf-name"
            name="name"
            required
            placeholder="Nama kamu"
            className={fieldCls}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label
            htmlFor="cf-category"
            className="text-sm font-semibold text-slate-700"
          >
            Kategori <span className="text-teal-600">*</span>
          </label>
          <select
            id="cf-category"
            name="category"
            required
            defaultValue=""
            className={`${fieldCls} cursor-pointer`}
          >
            <option value="" disabled>
              Pilih kategori
            </option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="cf-auction"
          className="text-sm font-semibold text-slate-700"
        >
          Nomor Lelang terkait{" "}
          <span className="font-normal text-slate-400">(opsional)</span>
        </label>
        <input
          id="cf-auction"
          name="auction"
          placeholder="contoh: 0485"
          className={fieldCls}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="cf-message"
          className="text-sm font-semibold text-slate-700"
        >
          Pesan <span className="text-teal-600">*</span>
        </label>
        <textarea
          id="cf-message"
          name="message"
          required
          rows={5}
          placeholder="Jelaskan kendala atau pertanyaanmu sedetail mungkin…"
          className={`${fieldCls} resize-none`}
        />
      </div>

      <div className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
        Tombol di bawah akan membuka WhatsApp dengan pesanmu yang sudah terisi
        otomatis.
      </div>

      <button
        type="submit"
        className="flex items-center justify-center gap-2 rounded-full bg-teal-600 py-3.5 text-sm font-bold text-white shadow-sm shadow-teal-200 transition-colors hover:bg-teal-700"
      >
        <MessageCircle className="h-5 w-5" />
        Kirim via WhatsApp
      </button>
    </form>
  );
}
