"use client";

import { CheckCircle, Send, Upload, X } from "lucide-react";
import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface ReceiptProofModalProps {
  transactionId: string;
  auctionTitle: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function ReceiptProofModal({
  transactionId,
  auctionTitle,
  onClose,
  onSuccess,
}: ReceiptProofModalProps) {
  const [notes, setNotes] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function handleSubmit() {
    if (!photoFile) {
      setError("Foto bukti penerimaan wajib diupload");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Unauthorized");

      const ext = photoFile.name.split(".").pop() ?? "jpg";
      const path = `${transactionId}/${user.id}/receipt.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("transaction-proofs")
        .upload(path, photoFile, { upsert: true });
      if (uploadErr) throw new Error(`Gagal upload foto: ${uploadErr.message}`);

      const { data: urlData } = supabase.storage
        .from("transaction-proofs")
        .getPublicUrl(path);
      const photoUrl = urlData.publicUrl;

      const res = await fetch(`/api/transactions/${transactionId}/confirm-receipt`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receipt_photo_url: photoUrl,
          receipt_notes: notes.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Gagal submit");
      }

      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Tutup"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm flex flex-col overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-emerald-400 to-teal-500" />

        <div className="flex items-center justify-between px-5 pt-4 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center">
              <CheckCircle className="h-[18px] w-[18px] text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 text-sm leading-tight">
                Konfirmasi Penerimaan
              </h2>
              <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{auctionTitle}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mx-5 border-t border-gray-100" />

        <div className="p-5 flex flex-col gap-4">
          <p className="text-xs text-gray-500 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
            Upload foto paket yang Anda terima sebagai bukti penerimaan. Dana akan segera diproses oleh middleman.
          </p>

          {/* Upload foto */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Foto Paket Diterima
            </label>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full h-32 rounded-xl border-2 border-dashed border-gray-200 hover:border-emerald-300 flex flex-col items-center justify-center gap-2 transition-colors bg-gray-50 hover:bg-emerald-50"
            >
              {photoPreview ? (
                // biome-ignore lint/performance/noImgElement: object URL preview
                <img src={photoPreview} alt="preview" className="h-full w-full object-contain rounded-xl" />
              ) : (
                <>
                  <Upload className="h-6 w-6 text-gray-400" />
                  <span className="text-xs text-gray-500">Klik untuk pilih foto</span>
                </>
              )}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Catatan kondisi */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Catatan Kondisi <span className="text-gray-400 font-normal">(opsional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Misal: paket diterima dalam kondisi baik"
              rows={2}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent focus:bg-white transition-all resize-none"
            />
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
        </div>

        <div className="px-5 pb-5 flex gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors font-medium"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !photoFile}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition-colors"
          >
            <Send className="h-3.5 w-3.5" />
            {loading ? "Mengupload..." : "Konfirmasi Terima"}
          </button>
        </div>
      </div>
    </div>
  );
}
