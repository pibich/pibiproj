"use client";

import { ShieldCheck, X } from "lucide-react";
import { useEffect, useState } from "react";
import { getInitials } from "@/lib/utils";

type Profile = {
  id: string;
  name: string;
  username: string;
  avatar_url: string | null;
  is_middleman: boolean;
};

interface UserProfileModalProps {
  userId: string;
  onClose: () => void;
}

export function UserProfileModal({ userId, onClose }: UserProfileModalProps) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/users/${userId}`)
      .then((r) => r.json())
      .then((data) => setProfile(data))
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, [userId]);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Tutup"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xs overflow-hidden">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors z-10"
        >
          <X className="h-4 w-4" />
        </button>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : profile ? (
          <div className="flex flex-col items-center px-6 py-8 gap-3">
            <div className="w-20 h-20 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 text-2xl font-semibold overflow-hidden shrink-0">
              {profile.avatar_url ? (
                // biome-ignore lint/performance/noImgElement: external user avatar URL
                <img
                  src={profile.avatar_url}
                  alt={profile.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                getInitials(profile.name)
              )}
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1.5">
                <p className="text-base font-semibold text-gray-900">
                  {profile.name}
                </p>
                {profile.is_middleman && (
                  <ShieldCheck className="h-4 w-4 text-green-500 shrink-0" />
                )}
              </div>
              <p className="text-sm text-gray-500 mt-0.5">
                @{profile.username}
              </p>
              {profile.is_middleman && (
                <span className="mt-2 inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 border border-green-200 rounded-full px-2.5 py-0.5">
                  <ShieldCheck className="h-3 w-3" />
                  Middleman Terverifikasi
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="py-10 text-center text-sm text-gray-400">
            Pengguna tidak ditemukan
          </div>
        )}
      </div>
    </div>
  );
}
