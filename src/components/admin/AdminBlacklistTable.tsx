"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/utils";
import { Trash2 } from "lucide-react";
import type { BlacklistEntry } from "@/types/supabase";

export function AdminBlacklistTable({ entries }: { entries: BlacklistEntry[] }) {
  const t = useTranslations("blacklist");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  async function handleRemove(id: string) {
    if (!confirm("Apakah Anda yakin ingin menghapus entri ini dari blacklist?")) return;

    startTransition(async () => {
      await fetch(`/api/admin/blacklist/${id}`, { method: "DELETE" });
      router.refresh();
    });
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
        <p className="text-gray-500 text-sm">Blacklist kosong</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-500">{t("name")}</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">{t("email")}</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">{t("phone")}</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">{t("reason")}</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">{t("type")}</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">{t("date")}</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {entries.map((entry) => (
              <tr key={entry.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{entry.name}</p>
                  {entry.username && (
                    <p className="text-xs text-gray-500">@{entry.username}</p>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-600">{entry.email ?? "—"}</td>
                <td className="px-4 py-3 text-gray-600">{entry.phone ?? "—"}</td>
                <td className="px-4 py-3 text-gray-600 max-w-[200px]">
                  <p className="truncate">{entry.reason}</p>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={entry.type === "automatic" ? "danger" : "warning"}>
                    {entry.type === "automatic" ? t("typeAutomatic") : t("typeManual")}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                  {formatDate(entry.created_at)}
                </td>
                <td className="px-4 py-3">
                  <Button
                    size="sm"
                    variant="ghost"
                    loading={isPending}
                    onClick={() => handleRemove(entry.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
