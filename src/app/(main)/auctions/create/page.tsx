import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CreateAuctionForm } from "@/components/auction/CreateAuctionForm";
import { requireUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Buat Lelang Baru" };

export default async function CreateAuctionPage() {
  let user: Awaited<ReturnType<typeof requireUser>>;
  try {
    user = await requireUser();
  } catch {
    redirect("/login");
  }

  const supabase = await createClient();
  const [{ data: rawCategories }, { data: reviewRows }] = await Promise.all([
    supabase.from("categories").select("*").order("name"),
    supabase.from("reviews").select("rating").eq("seller_id", user.id),
  ]);

  const categories = (rawCategories ?? []).sort((a, b) => {
    const aOther = /lainnya/i.test(a.name);
    const bOther = /lainnya/i.test(b.name);
    if (aOther && !bOther) return 1;
    if (!aOther && bOther) return -1;
    return 0;
  });

  const ratings = (reviewRows ?? []).map((r) => r.rating);
  const sellerRating =
    ratings.length > 0
      ? ratings.reduce((a, b) => a + b, 0) / ratings.length
      : null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="mb-3 inline-flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-[0.16em] text-teal-600">
          <span className="h-px w-8 bg-teal-600" />
          Pasang Lelang Baru
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
          Lelang kartumu.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-600">
          Lengkapi detail kartu dan tentukan kapan palu jatuh. Lelang akan
          ditinjau admin/middleman sebelum tampil publik.
        </p>
      </div>

      <CreateAuctionForm
        categories={categories ?? []}
        sellerUsername={user.username}
        sellerRating={sellerRating}
      />
    </div>
  );
}
