"use client";

import imageCompression from "browser-image-compression";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Gavel,
  Loader2,
  Star,
  UploadCloud,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Combobox } from "@/components/ui/Combobox";
import { Modal } from "@/components/ui/Modal";
import { getCategoryIcon } from "@/lib/categories";
import { containsProfanity } from "@/lib/profanity";
import { createClient } from "@/lib/supabase/client";
import { formatIDR, getTimeRemaining } from "@/lib/utils";
import type { Category } from "@/types/supabase";

const BUCKET = "auction-images";
const MAX_IMAGES = 5;
const MAX_FILE_SIZE = 20 * 1024 * 1024;
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

const fieldCls =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100";
const labelCls = "mb-2 block text-sm font-semibold text-slate-700";

interface CreateAuctionFormProps {
  categories: Category[];
  sellerUsername: string;
  sellerRating: number | null;
}

export function CreateAuctionForm({
  categories,
  sellerUsername,
  sellerRating,
}: CreateAuctionFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [successOpen, setSuccessOpen] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  // Controlled fields (also feed the live preview)
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [conditionVal, setConditionVal] = useState("");
  const [startingPrice, setStartingPrice] = useState("");
  const [buyNowPrice, setBuyNowPrice] = useState("");
  const [freeShipping, setFreeShipping] = useState(false);
  const [endAt, setEndAt] = useState("");

  const conditions = [
    "mint",
    "near_mint",
    "excellent",
    "good",
    "light_play",
    "heavy_play",
    "damaged",
  ] as const;

  const previewCategory = categories.find((c) => c.id === categoryId);
  const previewRemaining = (() => {
    if (!endAt) return null;
    const t = getTimeRemaining(new Date(endAt));
    if (t.expired) return null;
    return t.days > 0
      ? `${t.days}h ${String(t.hours).padStart(2, "0")}j`
      : `${String(t.hours).padStart(2, "0")}:${String(t.minutes).padStart(2, "0")}`;
  })();

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

    if (containsProfanity(title)) {
      setError("Judul lelang mengandung kata yang tidak pantas.");
      return;
    }

    if (images.length === 0) {
      setError("Minimal 1 foto kartu wajib diunggah.");
      return;
    }

    const startStr = data.get("start_at") as string;
    const endStr = data.get("end_at") as string;
    const startingPriceNum = Number(startingPrice);
    const buyNowNum = buyNowPrice ? Number(buyNowPrice) : null;

    const startTimeISO = startStr ? new Date(startStr).toISOString() : null;
    const endTimeISO = new Date(endStr).toISOString();

    const effectiveStart = startTimeISO ? new Date(startTimeISO) : new Date();
    const endDate = new Date(endTimeISO);

    if (endDate <= effectiveStart) {
      setError("Waktu selesai harus setelah waktu mulai.");
      return;
    }

    const diffDays =
      (endDate.getTime() - effectiveStart.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays > 14) {
      setError("Durasi lelang maksimal 2 minggu (14 hari).");
      return;
    }

    if (buyNowNum !== null && buyNowNum <= startingPriceNum) {
      setError("Harga Beli Langsung harus lebih tinggi dari harga mulai.");
      return;
    }

    startTransition(async () => {
      const res = await fetch("/api/auctions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: data.get("description"),
          category_id: data.get("category_id"),
          condition: data.get("condition"),
          starting_price: startingPriceNum,
          current_price: startingPriceNum,
          buy_now_price: buyNowNum,
          min_bid_increment: Number(data.get("min_bid_increment")) || 1000,
          free_shipping: freeShipping,
          images,
          start_time: startTimeISO,
          end_time: endTimeISO,
          status: "active",
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Gagal membuat lelang");
      } else {
        setSuccessOpen(true);
      }
    });
  }

  function resetForm() {
    setSuccessOpen(false);
    setError(null);
    setImages([]);
    setTitle("");
    setCategoryId("");
    setConditionVal("");
    setStartingPrice("");
    setBuyNowPrice("");
    setFreeShipping(false);
    setEndAt("");
    formRef.current?.reset();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const checklist = [
    "Foto kartu yang jelas (depan & belakang) menaikkan kepercayaan pembeli.",
    "Cantumkan grading & nomor set di deskripsi.",
    "Gunakan middleman untuk transaksi bernilai tinggi.",
  ];

  return (
    <>
      <form ref={formRef} onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_350px]">
          {/* ── Left: form sections ── */}
          <div className="flex flex-col gap-6">
            {/* Section 1 */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="mb-5 flex items-center gap-3">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-slate-900 text-xs font-bold text-white">
                  1
                </span>
                <h2 className="text-base font-bold text-slate-900">
                  Informasi Kartu
                </h2>
              </div>

              <div className="flex flex-col gap-5">
                <div>
                  <label htmlFor="title" className={labelCls}>
                    Judul Lelang <span className="text-teal-600">*</span>
                  </label>
                  <input
                    id="title"
                    name="title"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="contoh: Charizard ex 199/165 Special Art Rare — SV151"
                    className={fieldCls}
                  />
                </div>

                <div>
                  <label htmlFor="description" className={labelCls}>
                    Deskripsi
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={4}
                    placeholder="Jelaskan kondisi kartu, nomor set, edisi, grading, dll."
                    className={`${fieldCls} resize-none`}
                  />
                </div>

                <div>
                  <label htmlFor="photo-upload" className={labelCls}>
                    Foto Kartu (maks. {MAX_IMAGES}){" "}
                    <span className="text-teal-600">*</span>
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
                  <div className="flex flex-wrap gap-2.5">
                    {images.map((img, i) => (
                      <div key={img} className="group relative">
                        {/* biome-ignore lint/performance/noImgElement: Supabase CDN URL */}
                        <img
                          src={img}
                          alt={`Gambar ${i + 1}`}
                          className="h-24 w-24 rounded-xl border border-slate-200 object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(i)}
                          className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-red-500 text-white opacity-0 transition-opacity group-hover:opacity-100"
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
                        className="grid h-24 w-24 place-items-center gap-1 rounded-xl border-2 border-dashed border-slate-300 text-slate-400 transition-colors hover:border-teal-400 hover:text-teal-500 disabled:opacity-50"
                      >
                        {uploading ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <span className="flex flex-col items-center gap-1">
                            <UploadCloud className="h-5 w-5" />
                            <span className="text-xs font-medium">Upload</span>
                          </span>
                        )}
                      </button>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-slate-400">
                    JPG, PNG, WebP, GIF · dikompres otomatis
                  </p>
                </div>
              </div>
            </section>

            {/* Section 2 */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="mb-5 flex items-center gap-3">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-slate-900 text-xs font-bold text-white">
                  2
                </span>
                <h2 className="text-base font-bold text-slate-900">
                  Detail Lelang
                </h2>
              </div>

              <div className="flex flex-col gap-5">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="category_id" className={labelCls}>
                      Kategori <span className="text-teal-600">*</span>
                    </label>
                    <Combobox
                      id="category_id"
                      name="category_id"
                      options={categories.map((cat) => ({
                        value: cat.id,
                        label: cat.name,
                        icon: getCategoryIcon(cat.slug),
                      }))}
                      value={categoryId}
                      onChange={setCategoryId}
                      placeholder="Pilih kategori"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="condition" className={labelCls}>
                      Kondisi <span className="text-teal-600">*</span>
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

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="starting_price" className={labelCls}>
                      Harga Mulai (Rp) <span className="text-teal-600">*</span>
                    </label>
                    <div className="flex items-center rounded-xl border border-slate-200 transition-colors focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-100">
                      <span className="pl-4 pr-1 font-mono text-sm text-slate-400">
                        Rp
                      </span>
                      <input
                        id="starting_price"
                        type="number"
                        min={1000}
                        required
                        value={startingPrice}
                        onChange={(e) => setStartingPrice(e.target.value)}
                        placeholder="50.000"
                        className="w-full bg-transparent py-3 pr-4 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="buy_now_price" className={labelCls}>
                      Harga Beli Langsung{" "}
                      <span className="font-normal text-slate-400">
                        (opsional)
                      </span>
                    </label>
                    <div className="flex items-center rounded-xl border border-slate-200 transition-colors focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-100">
                      <span className="pl-4 pr-1 font-mono text-sm text-slate-400">
                        Rp
                      </span>
                      <input
                        id="buy_now_price"
                        type="number"
                        min={1000}
                        value={buyNowPrice}
                        onChange={(e) => setBuyNowPrice(e.target.value)}
                        placeholder="kosongkan jika tidak ada"
                        className="w-full bg-transparent py-3 pr-4 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="min_bid_increment" className={labelCls}>
                    Kenaikan Bid Minimum (Rp){" "}
                    <span className="text-teal-600">*</span>
                  </label>
                  <div className="flex items-center rounded-xl border border-slate-200 transition-colors focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-100">
                    <span className="pl-4 pr-1 font-mono text-sm text-slate-400">
                      Rp
                    </span>
                    <input
                      id="min_bid_increment"
                      name="min_bid_increment"
                      type="number"
                      min={500}
                      required
                      defaultValue={50000}
                      className="w-full bg-transparent py-3 pr-4 text-sm text-slate-900 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <span className={labelCls}>Ongkos Kirim</span>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setFreeShipping(true)}
                      aria-pressed={freeShipping}
                      className={`rounded-xl py-3 text-sm font-semibold transition-colors ${
                        freeShipping
                          ? "bg-teal-600 text-white"
                          : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      Gratis Ongkir
                    </button>
                    <button
                      type="button"
                      onClick={() => setFreeShipping(false)}
                      aria-pressed={!freeShipping}
                      className={`rounded-xl py-3 text-sm font-semibold transition-colors ${
                        !freeShipping
                          ? "bg-slate-900 text-white"
                          : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      Ditanggung Pembeli
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-slate-400">
                    {freeShipping
                      ? "Kamu (penjual) menanggung biaya pengiriman."
                      : "Biaya pengiriman ditanggung oleh pemenang lelang."}
                  </p>
                </div>
              </div>
            </section>

            {/* Section 3 */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="mb-5 flex items-center gap-3">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-slate-900 text-xs font-bold text-white">
                  3
                </span>
                <h2 className="text-base font-bold text-slate-900">
                  Waktu Lelang
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="start_at" className={labelCls}>
                    Waktu Mulai{" "}
                    <span className="font-normal text-slate-400">
                      (opsional)
                    </span>
                  </label>
                  <input
                    id="start_at"
                    name="start_at"
                    type="datetime-local"
                    className={fieldCls}
                  />
                  <p className="mt-1.5 text-xs text-slate-400">
                    Kosongkan untuk mulai langsung saat disetujui.
                  </p>
                </div>
                <div>
                  <label htmlFor="end_at" className={labelCls}>
                    Waktu Selesai <span className="text-teal-600">*</span>
                  </label>
                  <input
                    id="end_at"
                    name="end_at"
                    type="datetime-local"
                    required
                    value={endAt}
                    onChange={(e) => setEndAt(e.target.value)}
                    className={fieldCls}
                  />
                  <p className="mt-1.5 text-xs text-slate-400">
                    Durasi maksimal 14 hari.
                  </p>
                </div>
              </div>
            </section>

            {/* Warning */}
            <div className="flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Lelang akan ditinjau admin/middleman sebelum tampil publik. Kamu
                akan menerima notifikasi setelah disetujui atau ditolak.
              </span>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="rounded-full border border-slate-200 bg-white px-6 py-3.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="flex flex-1 items-center justify-center gap-2 rounded-full bg-teal-600 py-3.5 text-sm font-bold text-white shadow-sm shadow-teal-200 transition-colors hover:bg-teal-700 disabled:opacity-50"
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Gavel className="h-4 w-4" />
                )}
                Pasang Lelang
              </button>
            </div>
          </div>

          {/* ── Right: sticky preview + checklist ── */}
          <aside className="flex flex-col gap-4 lg:sticky lg:top-20">
            <div>
              <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-teal-600">
                <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
                Pratinjau Langsung
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm">
                <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-gradient-to-br from-slate-100 to-teal-50">
                  {images[0] ? (
                    // biome-ignore lint/performance/noImgElement: blob/CDN preview
                    <img
                      src={images[0]}
                      alt="Pratinjau"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-slate-300">
                      <Gavel className="h-10 w-10" />
                    </div>
                  )}
                  <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-lg bg-slate-900/90 px-2.5 py-1.5 font-mono text-xs font-semibold text-white">
                    <Clock className="h-3.5 w-3.5" />
                    {previewRemaining ?? "—"}
                  </span>
                </div>

                <div className="px-1.5 pb-1 pt-3">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                    {previewCategory &&
                      getCategoryIcon(previewCategory.slug) && (
                        // biome-ignore lint/performance/noImgElement: local icon
                        <img
                          src={getCategoryIcon(previewCategory.slug) as string}
                          alt=""
                          className="h-3.5 w-3.5 object-contain"
                        />
                      )}
                    {previewCategory?.name ?? "Kategori"}
                    {conditionVal && (
                      <>
                        <span className="text-slate-300">·</span>
                        {conditionLabels[conditionVal]}
                      </>
                    )}
                  </div>
                  <h3 className="mt-1.5 line-clamp-2 text-[15px] font-bold leading-snug text-slate-900">
                    {title || "Judul lelang kamu akan tampil di sini"}
                  </h3>
                  <p className="mt-3 text-[11px] text-slate-400">Harga Mulai</p>
                  <p className="mt-0.5 font-mono text-xl font-bold tracking-tight text-slate-900">
                    {startingPrice ? formatIDR(Number(startingPrice)) : "Rp—"}
                  </p>
                  <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-[11px] text-slate-400">
                    <span className="inline-flex items-center gap-1">
                      <Gavel className="h-3 w-3" />0 tawaran
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="text-slate-500">@{sellerUsername}</span>
                      {sellerRating != null && (
                        <>
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          <span className="font-semibold text-slate-600">
                            {sellerRating.toFixed(1)}
                          </span>
                        </>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="font-bold text-slate-900">Sebelum kamu pasang</p>
              <ul className="mt-3 flex flex-col gap-3 text-sm leading-relaxed text-slate-600">
                {checklist.map((item) => (
                  <li key={item} className="flex gap-2.5">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </form>

      {/* Error popup */}
      <Modal
        open={!!error}
        onClose={() => setError(null)}
        title="Perhatian"
        size="sm"
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3 text-sm text-gray-700">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
            <p>{error}</p>
          </div>
          <Button
            type="button"
            onClick={() => setError(null)}
            className="self-end"
          >
            Mengerti
          </Button>
        </div>
      </Modal>

      {/* Success popup */}
      <Modal
        open={successOpen}
        onClose={() => router.push("/auctions")}
        title="Lelang Menunggu Persetujuan"
        size="sm"
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-amber-100 p-2 shrink-0">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <p className="text-sm text-gray-600">
              Lelang Anda berhasil dibuat dan sedang menunggu peninjauan
              admin/middleman. Anda akan menerima notifikasi setelah disetujui
              atau ditolak.
            </p>
          </div>
          <div className="flex flex-col gap-2 pt-1">
            <Button
              type="button"
              onClick={() => router.push("/auctions/pending")}
            >
              Cek Status Persetujuan
            </Button>
            <Button type="button" variant="outline" onClick={resetForm}>
              Buat Lelang Lagi
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
