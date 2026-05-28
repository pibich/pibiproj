"use client";

import imageCompression from "browser-image-compression";
import { AlertCircle, ImagePlus, Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Combobox } from "@/components/ui/Combobox";
import { Input } from "@/components/ui/Input";
import { getCategoryIcon } from "@/lib/categories";
import { containsProfanity } from "@/lib/profanity";
import { createClient } from "@/lib/supabase/client";
import type { Category } from "@/types/supabase";

const BUCKET = "auction-images";
const MAX_IMAGES = 5;
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB raw-input guard (compression targets 1 MB output)
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const COMPRESSION_OPTIONS = {
  maxSizeMB: 1,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
} as const;

const conditionLabels: Record<string, string> = {
  mint: "Mint",
  near_mint: "Near Mint",
  excellent: "Excellent",
  good: "Good",
  light_play: "Light Play",
  heavy_play: "Heavy Play",
  damaged: "Damaged",
};

interface CreateAuctionFormProps {
  categories: Category[];
}

export function CreateAuctionForm({ categories }: CreateAuctionFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [categoryId, setCategoryId] = useState("");
  const [conditionVal, setConditionVal] = useState("");

  const conditions = [
    "mint",
    "near_mint",
    "excellent",
    "good",
    "light_play",
    "heavy_play",
    "damaged",
  ] as const;

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    const remaining = MAX_IMAGES - images.length;
    const toUpload = files.slice(0, remaining);

    for (const file of toUpload) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setError("Format tidak didukung. Gunakan JPG, PNG, WebP, atau GIF.");
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setError("Ukuran file terlalu besar.");
        return;
      }
    }

    setError(null);
    setUploading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Tidak terautentikasi");

      const uploaded: string[] = [];
      for (const file of toUpload) {
        const ext = file.name.split(".").pop();
        const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
        const compressed = await imageCompression(file, COMPRESSION_OPTIONS);
        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(path, compressed, { upsert: false, contentType: file.type });
        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
        uploaded.push(data.publicUrl);
      }
      setImages((prev) => [...prev, ...uploaded]);
    } catch (err) {
      setError(
        "Gagal mengupload gambar. Pastikan bucket 'auction-images' sudah dibuat dan bersifat publik.",
      );
      console.error(err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function removeImage(index: number) {
    const url = images[index];
    setImages((prev) => prev.filter((_, i) => i !== index));

    try {
      const supabase = createClient();
      const urlObj = new URL(url);
      const parts = urlObj.pathname.split(`/object/public/${BUCKET}/`);
      if (parts[1]) {
        await supabase.storage
          .from(BUCKET)
          .remove([decodeURIComponent(parts[1])]);
      }
    } catch {
      // Non-critical
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const data = new FormData(form);

    const title = data.get("title") as string;
    if (containsProfanity(title)) {
      setError("Judul lelang mengandung kata yang tidak pantas.");
      return;
    }

    if (images.length === 0) {
      setError("Minimal 1 foto kartu wajib diunggah.");
      return;
    }

    const startDateStr = data.get("start_date") as string;
    const startTimeVal = data.get("start_time_val") as string;
    const endDateStr = data.get("end_date") as string;
    const endTimeVal = data.get("end_time_val") as string;
    const startingPrice = Number(data.get("starting_price"));
    const buyNowPrice = data.get("buy_now_price")
      ? Number(data.get("buy_now_price"))
      : null;

    const startTimeISO =
      startDateStr && startTimeVal
        ? new Date(`${startDateStr}T${startTimeVal}`).toISOString()
        : null;
    const endTimeISO = new Date(`${endDateStr}T${endTimeVal}`).toISOString();

    const effectiveStart = startTimeISO ? new Date(startTimeISO) : new Date();
    const endDate = new Date(endTimeISO);

    if (endDate <= effectiveStart) {
      setError("Waktu selesai harus setelah waktu mulai.");
      return;
    }

    const maxDays = 14;
    const diffDays =
      (endDate.getTime() - effectiveStart.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays > maxDays) {
      setError("Durasi lelang maksimal 2 minggu (14 hari).");
      return;
    }

    if (buyNowPrice !== null && buyNowPrice <= startingPrice) {
      setError("Harga Buy Now harus lebih tinggi dari harga mulai.");
      return;
    }

    startTransition(async () => {
      const res = await fetch("/api/auctions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.get("title"),
          description: data.get("description"),
          category_id: data.get("category_id"),
          condition: data.get("condition"),
          starting_price: startingPrice,
          current_price: startingPrice,
          buy_now_price: buyNowPrice,
          min_bid_increment: Number(data.get("min_bid_increment")) || 1000,
          images,
          start_time: startTimeISO,
          end_time: endTimeISO,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Gagal membuat lelang");
      } else {
        router.push(`/auctions/${json.id}`);
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-5"
    >
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* ── Cluster 1: Informasi Kartu ────────────────────────────────────── */}
      <div className="flex flex-col gap-4 rounded-lg border border-gray-100 bg-gray-50/50 p-4">
        <h2 className="text-sm font-semibold text-gray-700">Informasi Kartu</h2>

        <Input
          id="title"
          name="title"
          label="Judul Lelang"
          placeholder="contoh: Charizard Holo Base Set PSA 10"
          required
        />

        <div className="flex flex-col gap-1">
          <label
            htmlFor="description"
            className="text-sm font-medium text-gray-700"
          >
            Deskripsi
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            placeholder="Jelaskan kondisi kartu, nomor set, edisi, dll."
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="photo-upload"
            className="text-sm font-medium text-gray-700"
          >
            Foto Kartu (maks. {MAX_IMAGES}){" "}
            <span className="text-red-500">*</span>
          </label>
          <input
            id="photo-upload"
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_TYPES.join(",")}
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
          <div className="flex gap-2 flex-wrap">
            {images.map((img, i) => (
              <div key={img} className="relative group">
                {/* biome-ignore lint/performance/noImgElement: Supabase CDN URLs not compatible with next/image domain allowlist */}
                <img
                  src={img}
                  alt={`Gambar ${i + 1}`}
                  className="h-20 w-20 object-cover rounded-lg border border-gray-200"
                />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            {images.length < MAX_IMAGES && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="h-20 w-20 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-blue-400 hover:text-blue-400 transition-colors disabled:opacity-50"
              >
                {uploading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <ImagePlus className="h-5 w-5" />
                    <span className="text-xs">Upload</span>
                  </>
                )}
              </button>
            )}
          </div>
          <p className="text-xs text-gray-400">
            JPG, PNG, WebP, GIF · dikompres otomatis
          </p>
        </div>
      </div>

      {/* ── Cluster 2: Detail Lelang ──────────────────────────────────────── */}
      <div className="flex flex-col gap-4 rounded-lg border border-gray-100 bg-gray-50/50 p-4">
        <h2 className="text-sm font-semibold text-gray-700">Detail Lelang</h2>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label
              htmlFor="category_id"
              className="text-sm font-medium text-gray-700"
            >
              Kategori <span className="text-red-500">*</span>
            </label>
            <Combobox
              id="category_id"
              name="category_id"
              options={categories.map((cat) => ({
                value: cat.id,
                label: `${getCategoryIcon(cat.name)} ${cat.name}`,
              }))}
              value={categoryId}
              onChange={setCategoryId}
              placeholder="Pilih kategori"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor="condition"
              className="text-sm font-medium text-gray-700"
            >
              Kondisi <span className="text-red-500">*</span>
            </label>
            <Combobox
              id="condition"
              name="condition"
              options={conditions.map((c) => ({
                value: c,
                label: conditionLabels[c],
              }))}
              value={conditionVal}
              onChange={setConditionVal}
              placeholder="Pilih kondisi"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            id="starting_price"
            name="starting_price"
            type="number"
            label="Harga Mulai (Rp)"
            placeholder="50000"
            min={1000}
            required
          />
          <Input
            id="buy_now_price"
            name="buy_now_price"
            type="number"
            label="Harga Buy Now (Rp, opsional)"
            placeholder="kosongkan jika tidak ada"
            min={1000}
          />
        </div>

        <Input
          id="min_bid_increment"
          name="min_bid_increment"
          type="number"
          label="Kenaikan Bid Minimum (Rp)"
          placeholder="1000"
          defaultValue={1000}
          min={500}
          required
        />

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">
              Waktu Mulai (opsional)
            </label>
            <div className="flex flex-col gap-1.5">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-gray-400">Tanggal</span>
                <input
                  id="start_date"
                  name="start_date"
                  type="date"
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-gray-400">Jam</span>
                <input
                  id="start_time_val"
                  name="start_time_val"
                  type="time"
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                />
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">
              Waktu Selesai <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-col gap-1.5">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-gray-400">Tanggal</span>
                <input
                  id="end_date"
                  name="end_date"
                  type="date"
                  required
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-gray-400">Jam</span>
                <input
                  id="end_time_val"
                  name="end_time_val"
                  type="time"
                  required
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Batal
        </Button>
        <Button type="submit" loading={isPending} className="flex-1">
          Buat Lelang
        </Button>
      </div>
    </form>
  );
}
