"use client";

import {
  MessageSquare,
  Search,
  ShieldCheck,
  Star,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { getInitials } from "@/lib/utils";

export interface MiddlemanWithStats {
  id: string;
  name: string;
  username: string;
  avatar_url: string | null;
  transactions: number;
  rating: number | null;
  joinedYear: number;
  isSelf: boolean;
}

export function MiddlemanBrowser({
  middlemen,
}: {
  middlemen: MiddlemanWithStats[];
}) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return middlemen;
    return middlemen.filter(
      (m) =>
        m.name.toLowerCase().includes(term) ||
        m.username.toLowerCase().includes(term),
    );
  }, [q, middlemen]);

  return (
    <div>
      {/* Header + search */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-xl font-extrabold tracking-tight text-slate-900">
          Middleman Terverifikasi{" "}
          <span className="text-slate-400">· {filtered.length}</span>
        </h2>
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari nama middleman…"
            className="h-10 w-full rounded-full border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white py-16 text-center">
          <ShieldCheck className="h-10 w-10 text-slate-300" />
          <p className="text-slate-500">Tidak ada middleman yang cocok.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((mm) => (
            <div
              key={mm.id}
              className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:border-slate-300 hover:shadow-md"
            >
              {/* Identity */}
              <div className="flex items-center gap-3">
                <Link href={`/profile/${mm.username}`} className="shrink-0">
                  <div className="grid h-11 w-11 place-items-center overflow-hidden rounded-xl bg-slate-100 text-sm font-bold text-slate-500">
                    {mm.avatar_url ? (
                      // biome-ignore lint/performance/noImgElement: external user avatar URL
                      <img
                        src={mm.avatar_url}
                        alt={mm.name}
                        className="h-11 w-11 rounded-xl object-cover"
                      />
                    ) : (
                      getInitials(mm.name)
                    )}
                  </div>
                </Link>
                <Link
                  href={`/profile/${mm.username}`}
                  className="min-w-0 flex-1 hover:opacity-80"
                >
                  <p className="truncate font-bold text-slate-900">{mm.name}</p>
                  <p className="truncate font-mono text-xs text-slate-400">
                    @{mm.username}
                  </p>
                </Link>
                <span className="inline-flex shrink-0 items-center gap-1 rounded-md border border-teal-200 bg-teal-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-teal-700">
                  <ShieldCheck className="h-3 w-3" />
                  Verified
                </span>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-4">
                <div>
                  <p className="font-mono text-lg font-bold tracking-tight text-slate-900">
                    {mm.transactions}
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-400">
                    Transaksi diurus
                  </p>
                </div>
                <div>
                  <p className="flex items-center gap-1 font-mono text-lg font-bold tracking-tight text-slate-900">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    {mm.rating != null ? mm.rating.toFixed(1) : "—"}
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-400">Rating</p>
                </div>
                <div>
                  <p className="font-mono text-lg font-bold tracking-tight text-slate-900">
                    {mm.joinedYear}
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-400">Bergabung</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Link
                  href={`/profile/${mm.username}`}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                >
                  <UserRound className="h-4 w-4" />
                  Profil
                </Link>
                {!mm.isSelf && (
                  <Link
                    href={`/chat?seller=${mm.id}`}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-slate-900 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
                  >
                    <MessageSquare className="h-4 w-4" />
                    Chat
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
