import { MessageSquare, ShieldCheck, UserRoundCheck } from "lucide-react";
import type { Metadata } from "next";
import { MobileBackBar } from "@/components/layout/MobileBackBar";
import {
  MiddlemanBrowser,
  type MiddlemanWithStats,
} from "@/components/middleman/MiddlemanBrowser";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/supabase";

export const metadata: Metadata = { title: "Daftar Middleman" };

type MiddlemanProfile = Pick<
  Profile,
  "id" | "name" | "username" | "avatar_url" | "created_at"
>;

const steps = [
  {
    n: "01",
    icon: UserRoundCheck,
    title: "Pilih middleman",
    body: "Telusuri middleman terverifikasi, lihat rating dan jumlah transaksi yang pernah diurus.",
  },
  {
    n: "02",
    icon: MessageSquare,
    title: "Undang ke chat",
    body: "Mulai chat dengan penjual lalu undang middleman pilihanmu ke grup percakapan.",
  },
  {
    n: "03",
    icon: ShieldCheck,
    title: "Transaksi terjamin",
    body: "Middleman menahan dana hingga kartu diterima sesuai deskripsi. Aman untuk kedua pihak.",
  },
];

export default async function MiddlemanPage() {
  const supabase = await createClient();

  const [{ data: middlemen }, { data: authData }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, name, username, avatar_url, created_at")
      .eq("is_middleman", true)
      .order("name"),
    supabase.auth.getUser(),
  ]);

  const list = (middlemen ?? []) as MiddlemanProfile[];
  const currentUserId = authData.user?.id ?? null;
  const ids = list.map((m) => m.id);

  // Batch-load stats: transactions handled (as middleman) + review ratings
  const [{ data: txns }, { data: revs }] = await Promise.all([
    ids.length
      ? supabase
          .from("transactions")
          .select("middleman_id")
          .in("middleman_id", ids)
      : Promise.resolve({ data: [] as { middleman_id: string | null }[] }),
    ids.length
      ? supabase
          .from("reviews")
          .select("seller_id, rating")
          .in("seller_id", ids)
      : Promise.resolve({
          data: [] as { seller_id: string; rating: number }[],
        }),
  ]);

  const txCount = new Map<string, number>();
  for (const t of txns ?? []) {
    if (t.middleman_id)
      txCount.set(t.middleman_id, (txCount.get(t.middleman_id) ?? 0) + 1);
  }
  const ratingAgg = new Map<string, { sum: number; n: number }>();
  for (const r of revs ?? []) {
    const cur = ratingAgg.get(r.seller_id) ?? { sum: 0, n: 0 };
    cur.sum += r.rating;
    cur.n += 1;
    ratingAgg.set(r.seller_id, cur);
  }

  const withStats: MiddlemanWithStats[] = list.map((m) => {
    const agg = ratingAgg.get(m.id);
    return {
      id: m.id,
      name: m.name,
      username: m.username,
      avatar_url: m.avatar_url,
      transactions: txCount.get(m.id) ?? 0,
      rating: agg ? agg.sum / agg.n : null,
      joinedYear: new Date(m.created_at).getFullYear(),
      isSelf: currentUserId === m.id,
    };
  });

  return (
    <>
      <MobileBackBar />
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-12 sm:px-6 lg:px-8">
        {/* Heading */}
        <div>
          <div className="mb-3 inline-flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-[0.16em] text-teal-600">
            <span className="h-px w-8 bg-teal-600" />
            Transaksi Aman
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            Middleman tepercaya.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-600">
            Pengguna terverifikasi yang menjembatani penjual dan pembeli —
            diundang ke dalam chat untuk memastikan dana dan kartu berpindah
            dengan aman.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {steps.map(({ n, icon: Icon, title, body }) => (
            <div
              key={n}
              className="rounded-2xl border border-slate-200 bg-white p-6"
            >
              <div className="flex items-start justify-between">
                <span className="font-mono text-sm font-bold text-slate-400">
                  {n}
                </span>
                <Icon className="h-5 w-5 text-teal-600" />
              </div>
              <h3 className="mt-4 text-base font-bold text-slate-900">
                {title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                {body}
              </p>
            </div>
          ))}
        </div>

        {/* Directory */}
        {list.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white py-20 text-center">
            <ShieldCheck className="h-12 w-12 text-slate-300" />
            <p className="text-slate-500">Belum ada middleman terdaftar.</p>
          </div>
        ) : (
          <MiddlemanBrowser middlemen={withStats} />
        )}
      </div>
    </>
  );
}
