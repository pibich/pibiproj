"use client";

import { Clock } from "lucide-react";
import { useRouter } from "next/navigation";

export function ApprovalStatusButton({ count = 0 }: { count?: number }) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.push("/auctions/pending")}
      className="flex items-center gap-1.5 py-2 px-3 rounded-lg bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 transition-colors"
    >
      <Clock className="h-4 w-4" />
      Status persetujuan
      {count > 0 && (
        <span
          role="img"
          className="ml-0.5 inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-white text-amber-600 text-xs font-semibold leading-none"
          aria-label={`${count} lelang menunggu persetujuan`}
        >
          {count}
        </span>
      )}
    </button>
  );
}
