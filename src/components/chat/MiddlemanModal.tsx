"use client";

import { Loader2, MessageSquare, ShieldCheck, X } from "lucide-react";
import { useEffect, useState } from "react";
import { getInitials } from "@/lib/utils";

type Middleman = {
  id: string;
  name: string;
  username: string;
  avatar_url: string | null;
};

interface MiddlemanModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (middlemanId: string, middlemanName: string) => void;
  currentMemberIds: string[];
}

export function MiddlemanModal({
  open,
  onClose,
  onSelect,
  currentMemberIds,
}: MiddlemanModalProps) {
  const [middlemen, setMiddlemen] = useState<Middleman[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    fetch("/api/middlemen")
      .then((r) => r.json())
      .then((data) => setMiddlemen(data.middlemen ?? []))
      .catch(() => setError("Gagal memuat daftar middleman"))
      .finally(() => setLoading(false));
  }, [open]);

  if (!open) return null;

  const available = middlemen.filter((mm) => !currentMemberIds.includes(mm.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Tutup"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-semibold text-gray-900">Pilih Middleman</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Undang middleman ke percakapan ini
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

        {/* Body */}
        <div className="flex-1 overflow-y-auto max-h-80 p-3">
          {loading && (
            <div className="flex items-center justify-center py-10 text-gray-400">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          )}
          {error && (
            <p className="text-center text-sm text-red-500 py-8">{error}</p>
          )}
          {!loading && !error && available.length === 0 && (
            <p className="text-center text-sm text-gray-400 py-8">
              {middlemen.length === 0
                ? "Belum ada middleman terdaftar"
                : "Semua middleman sudah ada di percakapan ini"}
            </p>
          )}
          {!loading && !error && available.length > 0 && (
            <div className="flex flex-col gap-1">
              {available.map((mm) => (
                <button
                  type="button"
                  key={mm.id}
                  onClick={() => onSelect(mm.id, mm.name)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-teal-50 text-left transition-colors w-full group"
                >
                  <div className="w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 text-sm font-semibold shrink-0">
                    {mm.avatar_url ? (
                      // biome-ignore lint/performance/noImgElement: external user avatar URL
                      <img
                        src={mm.avatar_url}
                        alt={mm.name}
                        className="w-9 h-9 rounded-full object-cover"
                      />
                    ) : (
                      getInitials(mm.name)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {mm.name}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <ShieldCheck className="h-3 w-3 text-green-500" />@
                      {mm.username}
                    </div>
                  </div>
                  <MessageSquare className="h-4 w-4 text-gray-300 group-hover:text-teal-400 transition-colors shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
