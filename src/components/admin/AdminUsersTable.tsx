"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { getInitials } from "@/lib/utils";
import { ShieldCheck, ShieldOff, AlertTriangle, Clock, Search } from "lucide-react";
import type { Profile } from "@/types/supabase";

type UserRow = Pick<
  Profile,
  "id" | "name" | "username" | "avatar_url" | "role" | "buyer_warning_count" | "buyer_timeout_until" | "is_middleman"
>;

function isTimeoutActive(until: string | null): boolean {
  if (!until) return false;
  return new Date(until) > new Date();
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function AdminUsersTable({
  users,
  adminId,
}: {
  users: UserRow[];
  adminId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase())
  );

  async function handleAction(userId: string, action: "toggle_role" | "reset_timeout") {
    setLoadingId(userId);
    setLoadingAction(action);
    startTransition(async () => {
      await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      router.refresh();
      setLoadingId(null);
      setLoadingAction(null);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama atau username..."
          className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <p className="text-gray-500 text-sm">Tidak ada pengguna ditemukan</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Pengguna</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Role</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Peringatan</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Timeout</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((user) => {
                  const timeoutActive = isTimeoutActive(user.buyer_timeout_until);
                  const isSelf = user.id === adminId;
                  const isLoading = isPending && loadingId === user.id;

                  return (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-semibold shrink-0">
                            {user.avatar_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={user.avatar_url}
                                alt={user.name}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              getInitials(user.name)
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 leading-tight">{user.name}</p>
                            <p className="text-xs text-gray-500">@{user.username}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {user.role === "admin" ? (
                            <Badge variant="default" className="flex items-center gap-1 text-xs">
                              <ShieldCheck className="h-3 w-3" />
                              Admin
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">User</Badge>
                          )}
                          {user.is_middleman && (
                            <Badge variant="success" className="text-xs">Middleman</Badge>
                          )}
                          {isSelf && (
                            <span className="text-xs text-gray-400">(Anda)</span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        {user.buyer_warning_count > 0 ? (
                          <div className="flex items-center gap-1 text-orange-600">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            <span className="text-xs font-medium">{user.buyer_warning_count}x</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {timeoutActive ? (
                          <div className="flex items-center gap-1 text-red-600">
                            <Clock className="h-3.5 w-3.5" />
                            <span className="text-xs font-medium">
                              s/d {formatDate(user.buyer_timeout_until!)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {timeoutActive && (
                            <Button
                              size="sm"
                              variant="outline"
                              loading={isLoading && loadingAction === "reset_timeout"}
                              onClick={() => handleAction(user.id, "reset_timeout")}
                              className="text-xs"
                            >
                              Reset Timeout
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant={user.role === "admin" ? "outline" : "default"}
                            loading={isLoading && loadingAction === "toggle_role"}
                            disabled={isSelf}
                            onClick={() => handleAction(user.id, "toggle_role")}
                            title={isSelf ? "Tidak bisa mengubah role akun sendiri" : undefined}
                            className="text-xs"
                          >
                            {user.role === "admin" ? (
                              <>
                                <ShieldOff className="h-3.5 w-3.5" />
                                Turunkan
                              </>
                            ) : (
                              <>
                                <ShieldCheck className="h-3.5 w-3.5" />
                                Jadikan Admin
                              </>
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
