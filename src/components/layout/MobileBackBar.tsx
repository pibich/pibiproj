"use client";

import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export function MobileBackBar({ label = "Kembali" }: { label?: string }) {
  const router = useRouter();
  return (
    <div className="md:hidden flex items-center px-4 py-2.5 bg-white border-b border-gray-100">
      <button
        type="button"
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-teal-600 hover:text-teal-700 font-medium"
      >
        <ChevronLeft className="h-4 w-4" />
        {label}
      </button>
    </div>
  );
}
