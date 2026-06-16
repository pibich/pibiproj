import { ArrowRight, Gavel } from "lucide-react";
import Link from "next/link";
import { type FeaturedAuction, FeaturedLot } from "./FeaturedLot";

interface HeroStat {
  value: string;
  label: string;
}

interface HeroProps {
  featured: FeaturedAuction | null;
  stats: HeroStat[];
}

export function Hero({ featured, stats }: HeroProps) {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12 lg:py-16 lg:px-8">
        {/* Left — copy */}
        <div className="animate-fade-in-up">
          <div className="mb-5 inline-flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-[0.16em] text-teal-600">
            <span className="h-px w-8 bg-teal-600" />
            Ruang Lelang Kartu · Indonesia
          </div>

          <h1 className="text-4xl font-extrabold leading-[0.98] tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
            Tawar kartu langka
            <br />
            secara <span className="text-amber-500">live</span>.
          </h1>

          <p className="mt-5 max-w-[44ch] text-base leading-relaxed text-slate-600">
            Ratusan lelang dari kolektor tepercaya, bid real-time, dan
            transaksi dijamin lewat sistem middleman. Palu jatuh — kartu jadi
            milikmu.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <a
              href="#lelang"
              className="inline-flex items-center gap-2 rounded-full bg-teal-600 px-6 py-3.5 text-sm font-bold text-white shadow-sm shadow-teal-200 transition-colors hover:bg-teal-700"
            >
              <Gavel className="h-4 w-4" />
              Lihat Lelang
            </a>
            <Link
              href="/cara-kerja"
              className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-white px-6 py-3.5 text-sm font-bold text-amber-700 transition-colors hover:border-amber-400 hover:bg-amber-50"
            >
              Cara Kerja Lelang
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-9 flex flex-wrap gap-x-9 gap-y-5">
            {stats.map((s) => (
              <div key={s.label}>
                <div className="font-mono text-2xl font-bold tracking-tight text-slate-900">
                  {s.value}
                </div>
                <div className="mt-1 text-xs text-slate-500">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — featured lot */}
        <div className="animate-fade-in-up">
          {featured ? (
            <FeaturedLot auction={featured} />
          ) : (
            <div className="flex aspect-[16/11] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/60 text-sm text-slate-400">
              Belum ada lot sorotan
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
