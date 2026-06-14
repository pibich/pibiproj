"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Combobox } from "@/components/ui/Combobox";
import { getCategoryIcon } from "@/lib/categories";
import type { Category } from "@/types/supabase";

const conditionLabels: Record<string, string> = {
  mint: "Mint",
  near_mint: "Near Mint",
  excellent: "Excellent",
  good: "Good",
  light_play: "Light Play",
  heavy_play: "Heavy Play",
  damaged: "Damaged",
};

interface AuctionFiltersProps {
  categories: Category[];
  initialCategory?: string;
  initialCondition?: string;
  initialSort?: string;
  initialQ?: string;
  isEnded?: boolean;
  effectiveSort: string;
  onApply?: () => void;
}

export function AuctionFilters({
  categories,
  initialCategory = "",
  initialCondition = "",
  initialQ = "",
  isEnded = false,
  effectiveSort,
  onApply,
}: AuctionFiltersProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [category, setCategory] = useState(initialCategory);
  const [condition, setCondition] = useState(initialCondition);
  const [sort, setSort] = useState(effectiveSort);
  const [q, setQ] = useState(initialQ);

  const categoryOptions = categories.map((c) => ({
    value: c.id,
    label: c.name,
    icon: getCategoryIcon(c.slug),
  }));
  const conditionOptions = Object.entries(conditionLabels).map(([k, v]) => ({
    value: k,
    label: v,
  }));

  function applyFilters(
    overrides?: Partial<{
      category: string;
      condition: string;
      sort: string;
      q: string;
    }>,
  ) {
    const params = new URLSearchParams();
    const final = { category, condition, sort, q, ...overrides };
    if (isEnded) params.set("status", "ended");
    if (final.q) params.set("q", final.q);
    if (final.category) params.set("category", final.category);
    if (final.condition) params.set("condition", final.condition);
    if (final.sort) params.set("sort", final.sort);
    startTransition(() => {
      router.push(`/auctions?${params.toString()}`);
      onApply?.();
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    applyFilters();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-5"
    >
      <div>
        <label
          htmlFor="filter-q"
          className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block"
        >
          Cari
        </label>
        <input
          id="filter-q"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Nama kartu..."
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
      </div>

      <div>
        <label
          htmlFor="filter-category"
          className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block"
        >
          Kategori
        </label>
        <Combobox
          id="filter-category"
          options={categoryOptions}
          value={category}
          onChange={(v) => setCategory(v)}
          allLabel="Semua"
          placeholder="Pilih kategori..."
        />
      </div>

      <div>
        <label
          htmlFor="filter-condition"
          className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block"
        >
          Kondisi
        </label>
        <Combobox
          id="filter-condition"
          options={conditionOptions}
          value={condition}
          onChange={(v) => setCondition(v)}
          allLabel="Semua"
          placeholder="Pilih kondisi..."
        />
      </div>

      <div>
        <label
          htmlFor="filter-sort"
          className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block"
        >
          Urutkan
        </label>
        <select
          id="filter-sort"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          {isEnded ? (
            <>
              <option value="recently_ended">Terbaru Selesai</option>
              <option value="price_high">Harga Tertinggi</option>
              <option value="price_low">Harga Terendah</option>
              <option value="newest">Terbaru Dibuat</option>
            </>
          ) : (
            <>
              <option value="ending_soon">Segera Berakhir</option>
              <option value="newest">Terbaru Dibuat</option>
              <option value="price_low">Harga Terendah</option>
              <option value="price_high">Harga Tertinggi</option>
            </>
          )}
        </select>
      </div>

      <button
        type="submit"
        className="w-full bg-teal-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-teal-700 transition-colors"
      >
        Terapkan Filter
      </button>
    </form>
  );
}
