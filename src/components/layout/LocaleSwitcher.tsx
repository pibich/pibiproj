"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import { cn } from "@/lib/utils";

export function LocaleSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function switchLocale(newLocale: string) {
    // Replace the locale segment in the pathname
    const segments = pathname.split("/");
    segments[1] = newLocale;
    const newPath = segments.join("/");
    startTransition(() => {
      router.replace(newPath);
    });
  }

  return (
    <div className="flex items-center gap-1 rounded-lg border border-gray-200 p-0.5 bg-gray-50">
      {(["id", "en"] as const).map((l) => (
        <button
          key={l}
          onClick={() => switchLocale(l)}
          disabled={isPending}
          className={cn(
            "px-2.5 py-1 rounded-md text-xs font-semibold transition-colors",
            locale === l
              ? "bg-white text-blue-600 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          )}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
