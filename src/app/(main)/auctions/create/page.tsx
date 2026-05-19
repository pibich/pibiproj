import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { CreateAuctionForm } from "@/components/auction/CreateAuctionForm";

export const metadata: Metadata = { title: "Buat Lelang Baru" };

export default async function CreateAuctionPage() {
  try {
    await requireUser();
  } catch {
    redirect("/login");
  }

  const supabase = await createClient();
  const { data: rawCategories } = await supabase.from("categories").select("*").order("name");

  const categories = (rawCategories ?? []).sort((a, b) => {
    const aOther = /lainnya/i.test(a.name);
    const bOther = /lainnya/i.test(b.name);
    if (aOther && !bOther) return 1;
    if (!aOther && bOther) return -1;
    return 0;
  });

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Buat Lelang Baru</h1>
      <CreateAuctionForm categories={categories ?? []} />
    </div>
  );
}
