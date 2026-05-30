"use client";

import { Clock } from "lucide-react";
import { useRouter } from "next/navigation";

export function ApprovalStatusButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.push("/auctions/pending")}
      className="flex items-center gap-1.5 py-2 px-3 rounded-lg bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 transition-colors"
    >
      <Clock className="h-4 w-4" />
      Status persetujuan
    </button>
  );
}
