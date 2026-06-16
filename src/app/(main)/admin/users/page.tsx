import type { Metadata } from "next";
import { AdminUsersTable } from "@/components/admin/AdminUsersTable";
import { getUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/supabase";

export const metadata: Metadata = { title: "Admin - Kelola Pengguna" };

type UserRow = Pick<
  Profile,
  | "id"
  | "name"
  | "username"
  | "avatar_url"
  | "role"
  | "buyer_warning_count"
  | "buyer_timeout_until"
  | "is_middleman"
>;

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const admin = await getUser();

  const { data: users } = await supabase
    .from("profiles")
    .select(
      "id, name, username, avatar_url, role, buyer_warning_count, buyer_timeout_until, is_middleman",
    )
    .order("created_at", { ascending: false });

  const typedUsers = (users ?? []) as UserRow[];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-[17px] font-bold tracking-tight text-gray-900">
            Kelola Pengguna
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {typedUsers.length} pengguna terdaftar
          </p>
        </div>
      </div>
      <AdminUsersTable users={typedUsers} adminId={admin!.id} />
    </div>
  );
}
