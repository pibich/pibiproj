"use client";

import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface LinkedAccountsSectionProps {
  hasFacebook: boolean;
  linkedSuccess?: string;
  oauthError?: string;
}

export function LinkedAccountsSection({
  hasFacebook: initialHasFacebook,
  linkedSuccess,
  oauthError,
}: LinkedAccountsSectionProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    oauthError
      ? oauthError.includes("email")
        ? "Facebook tidak memberikan akses email. Aktifkan 'Allow users without an email' di Supabase → Authentication → Providers → Facebook, lalu coba lagi."
        : `Gagal menghubungkan: ${oauthError}`
      : null,
  );
  const [hasFacebook, setHasFacebook] = useState(initialHasFacebook);

  const justLinkedFacebook = linkedSuccess === "facebook";

  async function handleLinkFacebook() {
    if (hasFacebook) return;
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      // encodeURIComponent prevents ?linked=facebook from being parsed as a
      // separate query param by the browser — it must stay part of `next`
      const next = encodeURIComponent("/settings?linked=facebook");
      const { error: linkError } = await supabase.auth.linkIdentity({
        provider: "facebook",
        options: {
          scopes: "email,public_profile",
          redirectTo: `${window.location.origin}/api/auth/callback?next=${next}`,
        },
      });
      if (linkError) {
        if (linkError.message.toLowerCase().includes("already")) {
          setHasFacebook(true);
        } else if (linkError.message.toLowerCase().includes("manual linking")) {
          setError(
            "Fitur linking belum diaktifkan. Aktifkan 'Allow manual linking' di Supabase Dashboard → Authentication → Settings.",
          );
        } else if (
          linkError.message.toLowerCase().includes("provider") ||
          linkError.message.toLowerCase().includes("not enabled") ||
          linkError.message.toLowerCase().includes("not supported")
        ) {
          setError(
            "Provider Facebook belum diaktifkan. Pastikan konfigurasi Supabase sudah dilengkapi.",
          );
        } else {
          setError(`Gagal menghubungkan: ${linkError.message}`);
        }
      }
    } catch (err) {
      setError(
        `Terjadi kesalahan: ${err instanceof Error ? err.message : "Coba lagi."}`,
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-5">
      <div>
        <h2 className="text-base font-semibold text-gray-900">
          Akun Terhubung
        </h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Hubungkan akun media sosial untuk verifikasi tambahan
        </p>
      </div>

      {(justLinkedFacebook || hasFacebook) && (
        <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 border border-green-100 rounded-lg px-4 py-3">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>
            {justLinkedFacebook
              ? "Akun Facebook berhasil dihubungkan!"
              : "Akun Facebook sudah terhubung"}
          </span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex items-center justify-between p-4 border border-gray-100 rounded-xl bg-gray-50">
        <div className="flex items-center gap-3">
          {/* Facebook logo */}
          <div className="w-9 h-9 rounded-full bg-[#1877F2] flex items-center justify-center shrink-0">
            <svg
              viewBox="0 0 24 24"
              fill="white"
              className="w-5 h-5"
              aria-hidden="true"
            >
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">Facebook</p>
            <p className="text-xs text-gray-500">
              {hasFacebook ? "Terhubung" : "Belum terhubung"}
            </p>
          </div>
        </div>

        {hasFacebook ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-100 px-3 py-1.5 rounded-full">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Terhubung
          </span>
        ) : (
          <button
            type="button"
            onClick={handleLinkFacebook}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-[#1877F2] text-white rounded-lg hover:bg-[#1565C0] disabled:opacity-60 transition-colors"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "Menghubungkan..." : "Hubungkan"}
          </button>
        )}
      </div>

      <p className="text-xs text-gray-400">
        Menghubungkan akun Facebook digunakan sebagai verifikasi identitas
        tambahan. Kami tidak memposting apapun ke akun Facebook kamu.
      </p>
    </div>
  );
}
