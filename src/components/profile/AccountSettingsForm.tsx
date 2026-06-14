"use client";

import imageCompression from "browser-image-compression";
import { AlertCircle, Camera, CheckCircle2, Loader2, MapPin } from "lucide-react";
import { useRef, useState, useTransition } from "react";
import { updateAvatarAction, updateProvinceAction } from "@/app/actions/profile";
import { createClient } from "@/lib/supabase/client";
import { PROVINCES } from "@/lib/provinces";
import { getInitials } from "@/lib/utils";
import type { Profile } from "@/types/supabase";

const BUCKET = "auction-images";
const MAX_SIZE = 20 * 1024 * 1024; // 20 MB raw-input guard (compression targets 200 KB output)
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
const AVATAR_COMPRESSION_OPTIONS = {
  maxSizeMB: 0.2,
  maxWidthOrHeight: 400,
  useWebWorker: true,
} as const;

interface AccountSettingsFormProps {
  user: Profile;
}

export function AccountSettingsForm({ user }: AccountSettingsFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user.avatar_url);
  const [uploading, setUploading] = useState(false);
  const [, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [province, setProvince] = useState(user.province ?? "");
  const [savingProvince, startProvinceTransition] = useTransition();
  const [provinceSuccess, setProvinceSuccess] = useState(false);
  const [provinceError, setProvinceError] = useState<string | null>(null);

  function handleSaveProvince() {
    setProvinceError(null);
    setProvinceSuccess(false);
    if (!province) {
      setProvinceError("Silakan pilih provinsi terlebih dahulu.");
      return;
    }
    startProvinceTransition(async () => {
      const result = await updateProvinceAction(province);
      if (result.error) {
        setProvinceError(result.error);
      } else {
        setProvinceSuccess(true);
      }
    });
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setSuccess(false);

    if (!ACCEPTED.includes(file.type)) {
      setError("Format tidak didukung. Gunakan JPG, PNG, atau WebP.");
      return;
    }
    if (file.size > MAX_SIZE) {
      setError("Ukuran file terlalu besar.");
      return;
    }

    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${user.id}/avatar-${crypto.randomUUID()}.${ext}`;

      const compressed = await imageCompression(
        file,
        AVATAR_COMPRESSION_OPTIONS,
      );
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, compressed, { contentType: file.type });

      if (uploadError) {
        setError(`Gagal mengunggah foto: ${uploadError.message}`);
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from(BUCKET).getPublicUrl(path);
      const urlWithCacheBuster = `${publicUrl}?t=${Date.now()}`;

      // Best-effort cleanup of previous avatar (non-critical)
      if (avatarUrl) {
        try {
          const oldUrl = new URL(avatarUrl.split("?")[0]);
          const parts = oldUrl.pathname.split(`/object/public/${BUCKET}/`);
          if (parts[1]) {
            supabase.storage
              .from(BUCKET)
              .remove([decodeURIComponent(parts[1])]);
          }
        } catch {
          /* non-critical */
        }
      }

      startTransition(async () => {
        const result = await updateAvatarAction(urlWithCacheBuster);
        if (result.error) {
          setError(result.error);
        } else {
          setAvatarUrl(urlWithCacheBuster);
          setSuccess(true);
        }
      });
    } finally {
      setUploading(false);
      // Reset input so same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-6">
      <div>
        <h2 className="text-base font-semibold text-gray-900">Foto Profil</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          JPG, PNG, atau WebP · dikompres otomatis.
        </p>
      </div>

      <div className="flex items-center gap-6">
        {/* Avatar preview */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="relative w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-slate-100 to-teal-100 flex items-center justify-center text-teal-700 text-xl font-bold ring-4 ring-slate-100 group shrink-0 focus:outline-none focus:ring-teal-400"
        >
          {avatarUrl ? (
            // biome-ignore lint/performance/noImgElement: user avatar
            <img
              src={avatarUrl}
              alt={user.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span>{getInitials(user.name)}</span>
          )}
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            {uploading ? (
              <Loader2 className="h-6 w-6 text-white animate-spin" />
            ) : (
              <Camera className="h-6 w-6 text-white" />
            )}
          </div>
        </button>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="px-4 py-2 text-sm font-medium bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 transition-colors w-fit"
          >
            {uploading ? "Mengunggah..." : "Ganti Foto"}
          </button>
          {success && (
            <p className="text-sm text-green-600 flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4" />
              Foto profil berhasil diperbarui
            </p>
          )}
          {error && (
            <p className="text-sm text-red-500 flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4" />
              {error}
            </p>
          )}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Read-only user info */}
      <div className="border-t border-gray-100 pt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">Nama</p>
          <p className="text-sm text-gray-900 font-medium">{user.name}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">Username</p>
          <p className="text-sm text-gray-900 font-medium">@{user.username}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">Email</p>
          <p className="text-sm text-gray-900">{user.email}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">No. Telepon</p>
          <p className="text-sm text-gray-900">{user.phone}</p>
        </div>
      </div>

      {/* Editable province */}
      <div className="border-t border-gray-100 pt-5 flex flex-col gap-3">
        <div>
          <h2 className="text-base font-semibold text-gray-900 flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-gray-500" />
            Provinsi
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Membantu pembeli/penjual memperkirakan ongkos kirim.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <select
            value={province}
            onChange={(e) => {
              setProvince(e.target.value);
              setProvinceSuccess(false);
              setProvinceError(null);
            }}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 sm:w-64"
          >
            <option value="" disabled>
              Pilih provinsi domisili
            </option>
            {PROVINCES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleSaveProvince}
            disabled={savingProvince || province === (user.province ?? "")}
            className="px-4 py-2 text-sm font-medium bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 transition-colors w-fit flex items-center gap-1.5"
          >
            {savingProvince && <Loader2 className="h-4 w-4 animate-spin" />}
            Simpan
          </button>
        </div>

        {provinceSuccess && (
          <p className="text-sm text-green-600 flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4" />
            Provinsi berhasil diperbarui
          </p>
        )}
        {provinceError && (
          <p className="text-sm text-red-500 flex items-center gap-1.5">
            <AlertCircle className="h-4 w-4" />
            {provinceError}
          </p>
        )}
      </div>
    </div>
  );
}
