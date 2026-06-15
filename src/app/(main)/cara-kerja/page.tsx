import {
  ArrowRight,
  Gavel,
  PackageCheck,
  Search,
  ShieldCheck,
  Trophy,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Cara Kerja Lelang — TCG Auction",
};

const steps = [
  {
    icon: Search,
    title: "Jelajahi & temukan lelang",
    body: "Telusuri ratusan lelang dari kolektor tepercaya. Saring berdasarkan game, kondisi kartu, harga, atau yang segera berakhir.",
  },
  {
    icon: Gavel,
    title: "Pasang tawaran (bid)",
    body: "Masukkan tawaranmu di atas harga tertinggi. Bid berjalan real-time — kamu langsung tahu kalau ada yang menyalip. Ada opsi Beli Langsung untuk lelang tertentu.",
  },
  {
    icon: Trophy,
    title: "Menangkan saat palu jatuh",
    body: "Saat hitung mundur berakhir, penawar tertinggi memenangkan lelang. Kamu akan menerima notifikasi kemenangan secara otomatis.",
  },
  {
    icon: ShieldCheck,
    title: "Transaksi dijamin middleman",
    body: "Pembayaran ditahan oleh middleman tepercaya hingga kartu sampai dengan aman. Tidak ada penjual yang dibayar sebelum kamu konfirmasi.",
  },
  {
    icon: PackageCheck,
    title: "Terima kartu & konfirmasi",
    body: "Setelah kartu diterima sesuai deskripsi, konfirmasi transaksi. Dana diteruskan ke penjual dan kamu bisa meninggalkan ulasan.",
  },
];

export default function CaraKerjaPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-3 inline-flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-[0.16em] text-teal-600">
        <span className="h-px w-8 bg-teal-600" />
        Panduan
      </div>
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
        Cara Kerja Lelang
      </h1>
      <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-600">
        Lima langkah dari menemukan kartu langka sampai kartu jadi milikmu —
        dengan transaksi yang dijamin aman lewat sistem middleman.
      </p>

      <ol className="mt-10 flex flex-col gap-4">
        {steps.map(({ icon: Icon, title, body }, i) => (
          <li
            key={title}
            className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-5"
          >
            <div className="flex flex-col items-center gap-2">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-teal-50 text-teal-600">
                <Icon className="h-5 w-5" />
              </div>
              <span className="font-mono text-xs font-bold text-slate-300">
                {String(i + 1).padStart(2, "0")}
              </span>
            </div>
            <div className="pt-1">
              <h2 className="text-lg font-bold tracking-tight text-slate-900">
                {title}
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                {body}
              </p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          href="/#lelang"
          className="inline-flex items-center gap-2 rounded-full bg-teal-600 px-6 py-3.5 text-sm font-bold text-white shadow-sm shadow-teal-200 transition-colors hover:bg-teal-700"
        >
          <Gavel className="h-4 w-4" />
          Lihat Lelang
        </Link>
        <Link
          href="/middleman"
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3.5 text-sm font-bold text-slate-900 transition-colors hover:border-slate-300 hover:bg-slate-50"
        >
          Tentang Middleman
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
