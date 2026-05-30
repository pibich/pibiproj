"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/dal";
import { isValidProvince } from "@/lib/provinces";
import { createClient } from "@/lib/supabase/server";

export async function updateProvinceAction(
  province: string,
): Promise<{ error?: string }> {
  try {
    if (!isValidProvince(province)) {
      return { error: "Provinsi tidak valid." };
    }

    const user = await requireUser();
    const supabase = await createClient();

    const { error } = await supabase
      .from("profiles")
      .update({ province })
      .eq("id", user.id);

    if (error) return { error: "Gagal memperbarui provinsi." };

    revalidatePath("/settings");
    revalidatePath(`/profile/${user.username}`);

    return {};
  } catch {
    return { error: "Terjadi kesalahan. Silakan coba lagi." };
  }
}

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

export async function updateFacebookVisibilityAction(
  isPublic: boolean,
): Promise<{ error?: string }> {
  try {
    const user = await requireUser();
    const supabase = await createClient();

    const { error } = await supabase
      .from("profiles")
      .update({ facebook_public: isPublic })
      .eq("id", user.id);

    if (error) return { error: "Gagal memperbarui visibilitas Facebook." };

    revalidatePath("/settings");
    revalidatePath(`/profile/${user.username}`);

    return {};
  } catch {
    return { error: "Terjadi kesalahan. Silakan coba lagi." };
  }
}
