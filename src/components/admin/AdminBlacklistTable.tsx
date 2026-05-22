"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { BlacklistEntry } from "@/components/blacklist/BlacklistTable";
import { Button } from "@/components/ui/Button";

export function AdminBlacklistTable({
  entries,
}: {
  entries: BlacklistEntry[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function handleDelete(id: string) {
    setDeletingId(id);
    startTransition(async () => {
      await fetch(`/api/admin/blacklist/${id}`, { method: "DELETE" });
      setDeletingId(null);
      router.refresh();
    });
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
        <p className="text-gray-500 text-sm">Tidak ada entri blacklist</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="text-left px-4 py-3 font-medium text-gray-600">
              Nama
            </th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">
              Username
            </th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">
              Email
            </th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">
              No. Telepon
            </th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">
              Alasan
            </th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">
              Tanggal
            </th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {entries.map((entry) => (
            <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 font-medium text-gray-900">
                {entry.name ?? "-"}
              </td>
              <td className="px-4 py-3 text-gray-600">
                {entry.username ? `@${entry.username}` : "-"}
              </td>
              <td className="px-4 py-3 text-gray-600">{entry.email ?? "-"}</td>
              <td className="px-4 py-3 text-gray-600">{entry.phone ?? "-"}</td>
              <td className="px-4 py-3 text-gray-600">{entry.reason ?? "-"}</td>
              <td className="px-4 py-3 text-gray-400 text-xs">
                {new Date(entry.created_at).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </td>
              <td className="px-4 py-3">
                <Button
                  size="sm"
                  variant="danger"
                  loading={isPending && deletingId === entry.id}
                  onClick={() => handleDelete(entry.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
