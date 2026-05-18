"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import { ShieldAlert } from "lucide-react";
import type { BlacklistEntry } from "@/types/supabase";

export function BlacklistTable({ entries }: { entries: BlacklistEntry[] }) {
  const t = useTranslations("blacklist");

  if (entries.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
        <ShieldAlert className="h-10 w-10 text-gray-300 mx-auto mb-2" />
        <p className="text-gray-500 text-sm">{t("noResults")}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-500">{t("name")}</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">{t("email")}</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">{t("phone")}</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">{t("reason")}</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">{t("type")}</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">{t("date")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {entries.map((entry) => (
              <tr key={entry.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium text-gray-900">{entry.name}</p>
                    {entry.username && (
                      <p className="text-xs text-gray-500">@{entry.username}</p>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-600">{entry.email ?? "—"}</td>
                <td className="px-4 py-3 text-gray-600">{entry.phone ?? "—"}</td>
                <td className="px-4 py-3 text-gray-600 max-w-xs">
                  <p className="truncate">{entry.reason}</p>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={entry.type === "automatic" ? "danger" : "warning"}>
                    {entry.type === "automatic" ? t("typeAutomatic") : t("typeManual")}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {formatDate(entry.created_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden divide-y divide-gray-100">
        {entries.map((entry) => (
          <div key={entry.id} className="p-4 flex flex-col gap-2">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-gray-900">{entry.name}</p>
                {entry.username && <p className="text-xs text-gray-500">@{entry.username}</p>}
              </div>
              <Badge variant={entry.type === "automatic" ? "danger" : "warning"}>
                {entry.type === "automatic" ? t("typeAutomatic") : t("typeManual")}
              </Badge>
            </div>
            {entry.email && (
              <p className="text-xs text-gray-600">✉️ {entry.email}</p>
            )}
            {entry.phone && (
              <p className="text-xs text-gray-600">📱 {entry.phone}</p>
            )}
            <p className="text-xs text-gray-600 italic">"{entry.reason}"</p>
            <p className="text-xs text-gray-400">{formatDate(entry.created_at)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
