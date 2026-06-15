import Link from "next/link";
import { getCategoryIcon } from "@/lib/categories";
import type { Category } from "@/types/supabase";

interface CategoryRailProps {
  categories: Category[];
  activeCategory?: string;
  totalActive: number;
}

export function CategoryRail({
  categories,
  activeCategory,
  totalActive,
}: CategoryRailProps) {
  const isAll = !activeCategory;

  return (
    <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="mb-1">
        <h2 className="text-xl font-extrabold tracking-tight text-slate-900">
          Telusuri per Game
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Delapan dunia TCG, satu ruang lelang.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2.5 py-4 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-9">
        {/* All */}
        <Link
          href="/#lelang"
          className={[
            "flex h-16 flex-col items-center justify-center gap-0.5 rounded-xl border bg-white px-3 transition-all hover:-translate-y-0.5 hover:shadow-sm",
            isAll
              ? "border-slate-900 shadow-[0_0_0_1px_theme(colors.slate.900)]"
              : "border-slate-200 hover:border-slate-300",
          ].join(" ")}
        >
          <span className="text-[15px] font-extrabold text-slate-900">
            Semua
          </span>
          <span className="font-mono text-[11px] text-slate-400">
            {totalActive} aktif
          </span>
        </Link>

        {/* Games (exclude the catch-all "Lainnya") */}
        {categories
          .filter((c) => c.slug !== "lainnya" && !/lainnya/i.test(c.name))
          .map((c) => {
            const icon = getCategoryIcon(c.slug);
            const active = activeCategory === c.id;
            return (
              <Link
                key={c.id}
                href={`/?category=${c.id}#lelang`}
                className={[
                  "flex h-16 items-center justify-center rounded-xl border bg-white px-4 transition-all hover:-translate-y-0.5 hover:shadow-sm",
                  active
                    ? "border-slate-900 bg-slate-50 shadow-[0_0_0_1px_theme(colors.slate.900)]"
                    : "border-slate-200 hover:border-slate-300",
                ].join(" ")}
                title={c.name}
              >
                {icon ? (
                  // biome-ignore lint/performance/noImgElement: small local category logo
                  <img
                    src={icon}
                    alt={c.name}
                    className="max-h-8 max-w-full object-contain"
                  />
                ) : (
                  <span className="text-center text-sm font-bold text-slate-700">
                    {c.name}
                  </span>
                )}
              </Link>
            );
          })}
      </div>
    </section>
  );
}
