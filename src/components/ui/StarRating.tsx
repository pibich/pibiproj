import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  /** Rating value, may be fractional (e.g. 4.3). */
  value: number;
  /** Pixel size of each star. */
  size?: number;
  className?: string;
}

const KEYS = ["s1", "s2", "s3", "s4", "s5"];

/**
 * Read-only star display supporting fractional values via a clipped overlay.
 * Interactive star selection lives in the review form itself.
 */
export function StarRating({ value, size = 16, className }: StarRatingProps) {
  const pct = Math.max(0, Math.min(100, (value / 5) * 100));

  const row = (colorClass: string) => (
    <div className="flex" style={{ width: size * 5 }}>
      {KEYS.map((k) => (
        <Star
          key={k}
          className={cn("shrink-0", colorClass)}
          style={{ width: size, height: size }}
        />
      ))}
    </div>
  );

  return (
    <span
      role="img"
      className={cn("relative inline-flex", className)}
      style={{ width: size * 5, height: size }}
      aria-label={`${value.toFixed(1)} dari 5 bintang`}
    >
      <span className="absolute inset-0">{row("text-gray-300")}</span>
      <span
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${pct}%` }}
      >
        {row("text-amber-400 fill-amber-400")}
      </span>
    </span>
  );
}
