"use client";

import {
  Check,
  Loader2,
  MessageSquare,
  Search,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Channel as StreamChannel } from "stream-chat";
import { useChatContext } from "stream-chat-react";
import { getInitials } from "@/lib/utils";

type UserResult = {
  id: string;
  name: string;
  username: string;
  avatar_url: string | null;
  is_middleman: boolean;
};

interface NewMessageModalProps {
  open: boolean;
  onClose: () => void;
  currentUserId: string;
  onCreated: (channel: StreamChannel) => void;
}

// Deterministic channel ID for two-person DMs (same pair always → same channel)
function buildDmChannelId(a: string, b: string): string {
  return [a, b]
    .map((id) => id.replace(/-/g, ""))
    .sort()
    .join("")
    .slice(0, 64);
}

// Unique ID for group chats
function generateGroupId(): string {
  return `grp_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export function NewMessageModal({
  open,
  onClose,
  currentUserId,
  onCreated,
}: NewMessageModalProps) {
  const { client } = useChatContext();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserResult[]>([]);
  const [selected, setSelected] = useState<UserResult[]>([]);
  const [groupName, setGroupName] = useState("");
  const [searching, setSearching] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isGroup = selected.length >= 2;
  const canCreate = selected.length >= 1;

  // Reset when closed
  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
      setSelected([]);
      setGroupName("");
      setError(null);
    }
  }, [open]);

  // Debounced search
  useEffect(() => {
    if (!open) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `/api/users/search?q=${encodeURIComponent(query.trim())}`,
        );
        const data = await res.json();
        setResults(data.users ?? []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, open]);

  function toggleUser(user: UserResult) {
    setSelected((prev) =>
      prev.some((u) => u.id === user.id)
        ? prev.filter((u) => u.id !== user.id)
        : [...prev, user],
    );
    setError(null);
  }

  async function handleCreate() {
    if (!canCreate) return;
    setCreating(true);
    setError(null);
    try {
      let channelId: string;
      let name: string | undefined;
      const memberIds = [currentUserId, ...selected.map((u) => u.id)];

      if (!isGroup) {
        // Direct message — deterministic ID so the same pair always reuses the channel
        channelId = buildDmChannelId(currentUserId, selected[0].id);
      } else {
        // Group — unique ID + auto name
        channelId = generateGroupId();
        name =
          groupName.trim() ||
          selected.map((u) => u.name.split(" ")[0]).join(", ");
      }

      const res = await fetch("/api/stream/group", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelId, memberIds, name }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Gagal membuat percakapan");
      }

      // Use channel().watch() — direct reference by ID avoids membership
      // propagation delay that queryChannels can hit immediately after addMembers
      const ch = client.channel("messaging", channelId);
      await ch.watch();
      onCreated(ch);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Gagal membuat percakapan. Coba lagi.",
      );
      console.error(e);
    } finally {
      setCreating(false);
    }
  }

  if (!open) return null;

  const buttonLabel = isGroup
    ? `Buat Grup${selected.length > 0 ? ` (${selected.length + 1} anggota)` : ""}`
    : selected.length === 1
      ? `Mulai Chat dengan ${selected[0].name.split(" ")[0]}`
      : "Pilih pengguna";

  const ButtonIcon = isGroup ? Users : MessageSquare;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: backdrop click-to-close; Escape handled globally */}
      {/* biome-ignore lint/a11y/noStaticElementInteractions: backdrop dismiss */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm flex flex-col overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-semibold text-gray-900">
              {isGroup ? "Buat Grup Chat" : "Pesan Baru"}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {isGroup
                ? "Tambah lebih banyak pengguna untuk membuat grup"
                : "Pilih seseorang untuk memulai percakapan"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Group name — only visible when 2+ selected */}
        {isGroup && (
          <div className="px-5 pt-4 pb-2">
            <input
              type="text"
              placeholder="Nama grup (opsional, auto-dibuat jika kosong)"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        {/* Search input */}
        <div className="px-5 pt-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari nama atau username..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Selected chips */}
        {selected.length > 0 && (
          <div className="px-5 pb-2 flex flex-wrap gap-1.5">
            {selected.map((u) => (
              <button
                type="button"
                key={u.id}
                onClick={() => toggleUser(u)}
                className="flex items-center gap-1 bg-blue-50 text-blue-700 text-xs rounded-full px-2.5 py-1 hover:bg-blue-100 transition-colors"
              >
                {u.is_middleman && (
                  <ShieldCheck className="h-3 w-3 text-green-500 shrink-0" />
                )}
                {u.name.split(" ")[0]}
                <X className="h-3 w-3" />
              </button>
            ))}
          </div>
        )}

        {/* Results */}
        <div className="flex-1 overflow-y-auto min-h-[6rem] max-h-60 p-3">
          {searching && (
            <div className="flex items-center justify-center py-8 text-gray-400">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          )}
          {!searching && !query.trim() && (
            <p className="text-center text-sm text-gray-400 py-8">
              Ketik nama atau username untuk mencari
            </p>
          )}
          {!searching && query.trim() && results.length === 0 && (
            <p className="text-center text-sm text-gray-400 py-8">
              Tidak ada pengguna ditemukan
            </p>
          )}
          {!searching && results.length > 0 && (
            <div className="flex flex-col gap-1">
              {results.map((user) => {
                const isSelected = selected.some((u) => u.id === user.id);
                return (
                  <button
                    type="button"
                    key={user.id}
                    onClick={() => toggleUser(user)}
                    className={[
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors w-full",
                      isSelected ? "bg-blue-50" : "hover:bg-gray-50",
                    ].join(" ")}
                  >
                    <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-sm font-semibold shrink-0 overflow-hidden">
                      {user.avatar_url ? (
                        // biome-ignore lint/performance/noImgElement: external user avatar URL
                        <img
                          src={user.avatar_url}
                          alt={user.name}
                          className="w-9 h-9 rounded-full object-cover"
                        />
                      ) : (
                        getInitials(user.name)
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {user.name}
                        </p>
                        {user.is_middleman && (
                          <ShieldCheck className="h-3.5 w-3.5 text-green-500 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500">@{user.username}</p>
                    </div>
                    {isSelected && (
                      <Check className="h-4 w-4 text-blue-600 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 flex flex-col gap-2">
          {error && <p className="text-xs text-red-500 text-center">{error}</p>}
          <button
            type="button"
            onClick={handleCreate}
            disabled={creating || !canCreate}
            className="w-full bg-blue-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {creating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ButtonIcon className="h-4 w-4" />
            )}
            {creating ? "Memproses..." : buttonLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
