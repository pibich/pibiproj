"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";

export function AuctionStatusTabs() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const currentStatus = searchParams.get("status") ?? "active";

  function setStatus(status: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (status === "active") {
      params.delete("status");
    } else {
      params.set("status", status);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
      <button
        onClick={() => setStatus("active")}
        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
          currentStatus === "active"
            ? "bg-white text-gray-900 shadow-sm"
            : "text-gray-500 hover:text-gray-700"
        }`}
      >
        Aktif
      </button>
      <button
        onClick={() => setStatus("ended")}
        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
          currentStatus === "ended"
            ? "bg-white text-gray-900 shadow-sm"
            : "text-gray-500 hover:text-gray-700"
        }`}
      >
        Selesai
      </button>
    </div>
  );
}
