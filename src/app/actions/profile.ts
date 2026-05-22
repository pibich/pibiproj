"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";

export async function updateAvatarAction(
  avatarUrl: string,
): Promise<{ error?: string }> {
  try {
    const user = await requireUser();
    const supabase = await createClient();

    const { error } = await supabase
      .from("profiles")
      .update({ avatar_url: avatarUrl })
      .eq("id", user.id);

    if (error) return { error: "Gagal memperbarui foto profil." };

    revalidatePath("/settings");
    revalidatePath(`/profile/${user.username}`);
    revalidatePath("/", "layout");

    return {};
  } catch {
    return { error: "Terjadi kesalahan. Silakan coba lagi." };
  }
}
