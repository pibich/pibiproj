import type { LucideIcon } from "lucide-react";

/**
 * Tinted icon boxes for dashboard stat tiles. `blue` is the primary signal
 * (accent), `green` is reserved for success — note the project remaps
 * teal/emerald to blue, so success states must use native `green-*`/`amber-*`.
 */
const tints = {
  blue: "bg-teal-50 text-teal-600",
  green: "bg-green-50 text-green-600",
  amber: "bg-amber-50 text-amber-600",
  red: "bg-red-50 text-red-600",
  slate: "bg-gray-100 text-gray-500 border border-gray-200",
} as const;

export type StatTint = keyof typeof tints;

export function StatTile({
  icon: Icon,
  value,
  label,
  tint = "blue",
}: {
  icon: LucideIcon;
  value: number | string;
  label: string;
  tint?: StatTint;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 transition-all hover:border-gray-300 hover:shadow-lg hover:shadow-slate-900/5 motion-safe:hover:-translate-y-0.5">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tints[tint]}`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="font-mono text-2xl font-bold leading-none tracking-tight text-gray-900 tabular-nums">
          {value}
        </p>
        <p className="mt-1.5 text-xs text-gray-500">{label}</p>
      </div>
    </div>
  );
}
