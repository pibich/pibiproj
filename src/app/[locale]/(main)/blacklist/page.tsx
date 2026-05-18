import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { BlacklistTable } from "@/components/blacklist/BlacklistTable";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("blacklist");
  return { title: t("title") };
}

export default async function BlacklistPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const t = await getTranslations("blacklist");
  const supabase = await createClient();

  let query = supabase
    .from("blacklist")
    .select("*")
    .order("created_at", { ascending: false });

  if (q) {
    query = query.or(`name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%,username.ilike.%${q}%`);
  }

  const { data: entries } = await query;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
        <p className="text-sm text-gray-500 mt-1">{t("subtitle")}</p>
        <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
          ⚠️ {t("disclaimer")}
        </div>
      </div>

      {/* Search */}
      <form className="flex gap-2 mb-6">
        <input
          name="q"
          defaultValue={q}
          placeholder={t("searchPlaceholder")}
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Cari
        </button>
      </form>

      <p className="text-xs text-gray-500 mb-4">
        {t("totalEntries", { count: entries?.length ?? 0 })}
      </p>

      <BlacklistTable entries={entries ?? []} />
    </div>
  );
}
