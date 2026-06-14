"use client";

import { SlidersHorizontal, X } from "lucide-react";
import { useState } from "react";
import type { Category } from "@/types/supabase";
import { AuctionFilters } from "./AuctionFilters";

interface AuctionFiltersMobileProps {
  categories: Category[];
  initialCategory: string;
  initialCondition: string;
  initialQ: string;
  isEnded: boolean;
  effectiveSort: string;
}

export function AuctionFiltersMobile({
  categories,
  initialCategory,
  initialCondition,
  initialQ,
  isEnded,
  effectiveSort,
}: AuctionFiltersMobileProps) {
  const [open, setOpen] = useState(false);

  const activeCount = [initialCategory, initialCondition, initialQ].filter(
    Boolean,
  ).length;

  function handleClose() {
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={[
          "flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors",
          activeCount > 0
            ? "border-slate-300 bg-slate-50 text-teal-700"
            : "border-gray-200 bg-white text-gray-600 hover:border-gray-300",
        ].join(" ")}
      >
        <SlidersHorizontal className="h-4 w-4 shrink-0" />
        Filter
        {activeCount > 0 && (
          <span className="ml-0.5 flex items-center justify-center w-5 h-5 rounded-full bg-teal-600 text-white text-[10px] font-bold">
            {activeCount}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Backdrop */}
          {/* biome-ignore lint/a11y/noStaticElementInteractions: backdrop click-to-close */}
          {/* biome-ignore lint/a11y/useKeyWithClickEvents: Escape is not wired here; tap outside closes */}
          <div
            className="fixed inset-0 z-40 bg-black/40"
            onClick={handleClose}
          />

          {/* Bottom sheet */}
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-xl max-h-[85dvh] flex flex-col">
            {/* Sheet header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
              <span className="text-sm font-semibold text-gray-800">
                Filter
              </span>
              <button
                type="button"
                onClick={handleClose}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                aria-label="Tutup filter"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="overflow-y-auto flex-1 p-4">
              <AuctionFilters
                categories={categories}
                initialCategory={initialCategory}
                initialCondition={initialCondition}
                initialQ={initialQ}
                isEnded={isEnded}
                effectiveSort={effectiveSort}
                onApply={handleClose}
              />
            </div>
          </div>
        </>
      )}
    </>
  );
}
