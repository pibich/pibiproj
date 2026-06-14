import type { Metadata } from "next";
import { BlacklistTable } from "@/components/blacklist/BlacklistTable";
import { MobileBackBar } from "@/components/layout/MobileBackBar";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Daftar Blacklist" };

export default async function BlacklistPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("blacklist")
    .select("*")
    .order("created_at", { ascending: false });

  if (q) {
    query = query.or(
      `name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%,username.ilike.%${q}%`,
    );
  }

  const { data: entries } = await query;

  return (
    <>
      <MobileBackBar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Daftar Blacklist</h1>
          <p className="text-sm text-gray-500 mt-1">
            Pengguna yang terbukti melanggar aturan TCG Marketplace
          </p>
          <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
            ⚠️ Data blacklist bersifat informatif. TCG Marketplace tidak
            bertanggung jawab atas transaksi yang dilakukan dengan pengguna yang
            terdaftar.
          </div>
        </div>

        <form className="flex gap-2 mb-6">
          <input
            name="q"
            defaultValue={q}
            placeholder="Cari nama, email, username, atau telepon..."
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors"
          >
            Cari
          </button>
        </form>

        <p className="text-xs text-gray-500 mb-4">
          {entries?.length ?? 0} entri ditemukan
        </p>

        <BlacklistTable entries={entries ?? []} />
      </div>
    </>
  );
}
