"use client";

import { Clock, Gavel } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function AuctionStatusTabs() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const isEnded = searchParams.get("status") === "ended";

  function setStatus(status: "active" | "ended") {
    const params = new URLSearchParams(searchParams.toString());
    if (status === "active") {
      params.delete("status");
    } else {
      params.set("status", status);
    }
    // Reset sort when switching tabs so defaults make sense
    params.delete("sort");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm w-fit shrink-0">
      <button
        onClick={() => setStatus("active")}
        className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium transition-colors ${
          !isEnded ? "bg-teal-600 text-white" : "text-gray-500 hover:bg-gray-50"
        }`}
      >
        <Gavel className="h-4 w-4" />
        Lelang Aktif
      </button>
      <div className="w-px bg-gray-200 shrink-0" />
      <button
        onClick={() => setStatus("ended")}
        className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium transition-colors ${
          isEnded ? "bg-slate-700 text-white" : "text-gray-500 hover:bg-gray-50"
        }`}
      >
        <Clock className="h-4 w-4" />
        Lelang Selesai
      </button>
    </div>
  );
}
