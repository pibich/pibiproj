import { Clock, FileX, Gavel } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MobileBackBar } from "@/components/layout/MobileBackBar";
import { AuctionListCard } from "@/components/profile/AuctionListCard";
import { requireUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { formatRelativeTime } from "@/lib/utils";
import type { Profile } from "@/types/supabase";

export const metadata: Metadata = { title: "Status Persetujuan Lelang" };

type PendingAuction = {
  id: string;
  title: string;
  images: string[] | null;
  starting_price: number;
  current_price: number;
  created_at: string;
  status: "pending_approval" | "rejected";
  rejection_reason: string | null;
  category: { name: string } | null;
};

export default async function PendingAuctionsPage() {
  let user: Profile;
  try {
    user = await requireUser();
  } catch {
    redirect("/login");
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("auctions")
    .select(
      "id, title, images, starting_price, current_price, created_at, status, rejection_reason, category:categories(name)",
    )
    .eq("seller_id", user.id)
    .in("status", ["pending_approval", "rejected"])
    .order("created_at", { ascending: false });

  const auctions = (data ?? []) as unknown as PendingAuction[];
  const pending = auctions.filter((a) => a.status === "pending_approval");
  const rejected = auctions.filter((a) => a.status === "rejected");

  return (
    <>
      <MobileBackBar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">
            Status Persetujuan Lelang
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Lelang yang masih menunggu persetujuan admin atau yang ditolak.
          </p>
        </div>

        {auctions.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <Gavel className="h-10 w-10 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">
              Tidak ada lelang yang menunggu persetujuan atau ditolak.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {/* Menunggu Persetujuan */}
            {pending.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-500" />
                  Menunggu Persetujuan
                  <span className="ml-auto normal-case font-normal text-gray-400">
                    {pending.length} lelang
                  </span>
                </h2>
                <div className="flex flex-col gap-2">
                  {pending.map((a) => (
                    <AuctionListCard
                      key={a.id}
                      image={a.images?.[0] ?? null}
                      title={a.title}
                      href={`/auctions/${a.id}`}
                      price={a.starting_price}
                      badge={{ label: "MENUNGGU", variant: "warning" }}
                      subInfo={`Diajukan ${formatRelativeTime(a.created_at)}${a.category ? ` · ${a.category.name}` : ""}`}
                      actionLabel="Lihat Lelang"
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Ditolak */}
            {rejected.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <FileX className="h-4 w-4 text-red-500" />
                  Ditolak
                  <span className="ml-auto normal-case font-normal text-gray-400">
                    {rejected.length} lelang
                  </span>
                </h2>
                <div className="flex flex-col gap-2">
                  {rejected.map((a) => (
                    <AuctionListCard
                      key={a.id}
                      image={a.images?.[0] ?? null}
                      title={a.title}
                      href={`/auctions/${a.id}`}
                      price={a.starting_price}
                      badge={{ label: "DITOLAK", variant: "danger" }}
                      subInfo={
                        a.rejection_reason
                          ? `Alasan: ${a.rejection_reason}`
                          : `Ditolak ${formatRelativeTime(a.created_at)}`
                      }
                      actionLabel="Lihat Lelang"
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </>
  );
}
