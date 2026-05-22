import type { Metadata } from "next";
import { AdminMiddlemanTable } from "@/components/admin/AdminMiddlemanTable";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/supabase";

export const metadata: Metadata = { title: "Admin - Kelola Middleman" };

type MiddlemanRow = Pick<
  Profile,
  "id" | "name" | "username" | "avatar_url" | "is_middleman"
>;

export default async function AdminMiddlemanPage() {
  const supabase = await createClient();

  const { data: users } = await supabase
    .from("profiles")
    .select("id, name, username, avatar_url, is_middleman")
    .eq("role", "user")
    .order("name");

  const typedUsers = (users ?? []) as MiddlemanRow[];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Kelola Middleman
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {typedUsers.filter((u) => u.is_middleman).length} middleman aktif
            dari {typedUsers.length} user
          </p>
        </div>
      </div>
      <AdminMiddlemanTable users={typedUsers} />
    </div>
  );
}
