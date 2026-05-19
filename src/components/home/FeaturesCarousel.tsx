"use client";

import { useEffect, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, Gavel, Shield, MessageCircle, TrendingUp } from "lucide-react";

const features = [
  {
    icon: Gavel,
    title: "Sistem Lelang Real-Time",
    desc: "Bid langsung dan pantau harga secara real-time hingga lelang berakhir.",
    color: "from-sky-400 to-blue-500",
    bg: "bg-sky-50",
    accent: "text-sky-600",
  },
  {
    icon: Shield,
    title: "Sistem Blacklist",
    desc: "Cek daftar penjual/pembeli bermasalah sebelum bertransaksi.",
    color: "from-emerald-400 to-teal-500",
    bg: "bg-emerald-50",
    accent: "text-emerald-600",
  },
  {
    icon: MessageCircle,
    title: "Chat Langsung",
    desc: "Komunikasi langsung dengan penjual sebelum dan sesudah lelang.",
    color: "from-violet-400 to-purple-500",
    bg: "bg-violet-50",
    accent: "text-violet-600",
  },
  {
    icon: TrendingUp,
    title: "Komunitas TCG",
    desc: "Platform khusus kolektor kartu Pokémon, MTG, Yugioh, dan One Piece.",
    color: "from-amber-400 to-orange-500",
    bg: "bg-amber-50",
    accent: "text-amber-600",
  },
];

export function FeaturesCarousel() {
  const [active, setActive] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const next = useCallback(() => {
    setActive((prev) => (prev + 1) % features.length);
  }, []);

  const prev = useCallback(() => {
    setActive((prev) => (prev - 1 + features.length) % features.length);
  }, []);

  useEffect(() => {
    if (isPaused) return;
    const id = setInterval(next, 3500);
    return () => clearInterval(id);
  }, [isPaused, next]);

  const { icon: Icon, title, desc, color, bg, accent } = features[active];

  return (
    <div
      className="bg-white rounded-2xl border border-sky-100 shadow-sm overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Progress bar */}
      <div className="h-1 bg-sky-50">
        <div
          className={`h-full bg-gradient-to-r ${color} transition-none`}
          style={{ width: `${((active + 1) / features.length) * 100}%`, transition: "width 0.4s ease" }}
        />
      </div>

      <div className="flex items-stretch">
        {/* Main content */}
        <div className="flex-1 p-6 sm:p-8 flex items-center gap-6">
          <div className={`shrink-0 w-14 h-14 ${bg} rounded-2xl flex items-center justify-center`}>
            <div className={`w-8 h-8 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center`}>
              <Icon className="h-4 w-4 text-white" />
            </div>
          </div>
          <div className="min-w-0">
            <h3 className={`font-bold text-slate-800 text-base mb-1 ${accent}`}>{title}</h3>
            <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
          </div>
        </div>

        {/* Navigation */}
        <div className="shrink-0 flex flex-col items-center justify-center gap-2 pr-4">
          <button
            onClick={prev}
            className="w-8 h-8 rounded-full bg-sky-50 hover:bg-sky-100 flex items-center justify-center transition-colors"
            aria-label="Sebelumnya"
          >
            <ChevronLeft className="h-4 w-4 text-sky-600" />
          </button>
          <button
            onClick={next}
            className="w-8 h-8 rounded-full bg-sky-50 hover:bg-sky-100 flex items-center justify-center transition-colors"
            aria-label="Selanjutnya"
          >
            <ChevronRight className="h-4 w-4 text-sky-600" />
          </button>
        </div>
      </div>

      {/* Dots */}
      <div className="flex justify-center gap-1.5 pb-4">
        {features.map((_, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={`rounded-full transition-all duration-300 ${
              i === active ? "w-5 h-2 bg-sky-500" : "w-2 h-2 bg-sky-200 hover:bg-sky-300"
            }`}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
