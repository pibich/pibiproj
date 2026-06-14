import { MessageSquare, ShieldCheck, UserRound, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { MobileBackBar } from "@/components/layout/MobileBackBar";
import { Badge } from "@/components/ui/Badge";
import { createClient } from "@/lib/supabase/server";
import { getInitials } from "@/lib/utils";
import type { Profile } from "@/types/supabase";

export const metadata: Metadata = { title: "Daftar Middleman" };

type MiddlemanProfile = Pick<
  Profile,
  "id" | "name" | "username" | "avatar_url"
>;

export default async function MiddlemanPage() {
  const supabase = await createClient();

  const [{ data: middlemen }, { data: authData }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, name, username, avatar_url")
      .eq("is_middleman", true)
      .order("name"),
    supabase.auth.getUser(),
  ]);

  const list = (middlemen ?? []) as MiddlemanProfile[];
  const currentUserId = authData.user?.id ?? null;

  return (
    <>
      <MobileBackBar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              Daftar Middleman
            </h1>
          </div>
          <p className="text-gray-500 text-sm ml-13">
            Middleman terverifikasi untuk membantu transaksi aman
          </p>
        </div>

        <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 mb-8 text-sm text-teal-700 flex items-start gap-3">
          <Users className="h-4 w-4 mt-0.5 shrink-0" />
          <p>
            Middleman adalah pengguna terverifikasi yang dapat diundang ke
            percakapan antara seller dan buyer untuk memastikan transaksi
            berjalan aman. Chat dengan middleman pilihan kamu, lalu undang
            mereka ke grup chat dari halaman pesan.
          </p>
        </div>

        {list.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
            <ShieldCheck className="h-12 w-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500">Belum ada middleman terdaftar</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {list.map((mm) => (
              <div
                key={mm.id}
                className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col gap-4 hover:shadow-md hover:border-teal-200 transition-all"
              >
                {/* Avatar + name — clickable to profile */}
                <Link
                  href={`/profile/${mm.username}`}
                  className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                >
                  <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-semibold shrink-0 overflow-hidden">
                    {mm.avatar_url ? (
                      // biome-ignore lint/performance/noImgElement: external user avatar URL
                      <img
                        src={mm.avatar_url}
                        alt={mm.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      getInitials(mm.name)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">
                      {mm.name}
                    </p>
                    <p className="text-sm text-gray-500">@{mm.username}</p>
                  </div>
                  <Badge
                    variant="success"
                    className="shrink-0 flex items-center gap-1"
                  >
                    <ShieldCheck className="h-3 w-3" />
                    Terverifikasi
                  </Badge>
                </Link>

                {/* Action buttons */}
                <div className="flex gap-2">
                  <Link
                    href={`/profile/${mm.username}`}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
                  >
                    <UserRound className="h-4 w-4" />
                    Profil
                  </Link>

                  {/* Hide chat button for the middleman themselves */}
                  {currentUserId !== mm.id && (
                    <Link
                      href={`/chat?seller=${mm.id}`}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-teal-200 text-teal-600 text-sm font-medium hover:bg-teal-50 transition-colors"
                    >
                      <MessageSquare className="h-4 w-4" />
                      Chat
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
