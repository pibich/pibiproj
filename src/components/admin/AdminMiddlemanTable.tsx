"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { getInitials } from "@/lib/utils";
import { ShieldCheck, ShieldOff, Search } from "lucide-react";
import type { Profile } from "@/types/supabase";

type MiddlemanRow = Pick<Profile, "id" | "name" | "username" | "avatar_url" | "is_middleman">;

export function AdminMiddlemanTable({ users }: { users: MiddlemanRow[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase())
  );

  async function toggleMiddleman(userId: string) {
    setLoadingId(userId);
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/admin/middleman/${userId}`, { method: "PATCH" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Gagal memperbarui status middleman");
      }
      setLoadingId(null);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama atau username..."
          className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <p className="text-gray-500 text-sm">Tidak ada user ditemukan</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {filtered.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-sm font-semibold shrink-0">
                  {user.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.avatar_url}
                      alt={user.name}
                      className="w-9 h-9 rounded-full object-cover"
                    />
                  ) : (
                    getInitials(user.name)
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500">@{user.username}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {user.is_middleman && (
                  <Badge variant="success" className="flex items-center gap-1 text-xs">
                    <ShieldCheck className="h-3 w-3" />
                    Middleman
                  </Badge>
                )}
                <Button
                  size="sm"
                  variant={user.is_middleman ? "outline" : "primary"}
                  loading={loadingId === user.id}
                  onClick={() => toggleMiddleman(user.id)}
                >
                  {user.is_middleman ? (
                    <>
                      <ShieldOff className="h-3.5 w-3.5" />
                      Hapus
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Jadikan Middleman
                    </>
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
