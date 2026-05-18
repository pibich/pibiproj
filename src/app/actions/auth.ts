"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const registerSchema = z
  .object({
    name: z.string().min(2, "Nama minimal 2 karakter"),
    username: z
      .string()
      .min(3, "Username minimal 3 karakter")
      .max(30, "Username maksimal 30 karakter")
      .regex(/^[a-zA-Z0-9_]+$/, "Username hanya boleh huruf, angka, dan _"),
    email: z.string().email("Format email tidak valid"),
    phone: z
      .string()
      .regex(/^08[0-9]{8,11}$/, "Nomor telepon tidak valid (contoh: 08123456789)"),
    password: z.string().min(8, "Password minimal 8 karakter"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Password tidak cocok",
    path: ["confirmPassword"],
  });

const loginSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});

export type ActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
};

export async function registerAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const raw = {
    name: formData.get("name") as string,
    username: formData.get("username") as string,
    email: formData.get("email") as string,
    phone: formData.get("phone") as string,
    password: formData.get("password") as string,
    confirmPassword: formData.get("confirmPassword") as string,
  };

  const result = registerSchema.safeParse(raw);
  if (!result.success) {
    return { fieldErrors: result.error.flatten().fieldErrors };
  }

  const { name, username, email, phone, password } = result.data;

  const supabase = await createClient();

  // Check if username already taken
  const { data: existingUsername } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .single();

  if (existingUsername) {
    return { fieldErrors: { username: ["Username sudah digunakan"] } };
  }

  // Check if phone already registered
  const { data: existingPhone } = await supabase
    .from("profiles")
    .select("id")
    .eq("phone", phone)
    .single();

  if (existingPhone) {
    return { fieldErrors: { phone: ["Nomor telepon sudah terdaftar"] } };
  }

  // Check if email/phone is in manual blacklist
  const { data: blacklisted } = await supabase
    .from("blacklist")
    .select("id")
    .or(`email.eq.${email},phone.eq.${phone}`)
    .is("user_id", null)
    .limit(1);

  if (blacklisted && blacklisted.length > 0) {
    return {
      error:
        "Email atau nomor telepon ini telah diblacklist. Hubungi customer service untuk informasi lebih lanjut.",
    };
  }

  // Register user
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name, username, phone },
    },
  });

  if (error) {
    if (error.message.includes("already registered")) {
      return { fieldErrors: { email: ["Email sudah terdaftar"] } };
    }
    return { error: error.message };
  }

  return { success: true };
}

export async function loginAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const raw = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const result = loginSchema.safeParse(raw);
  if (!result.success) {
    return { fieldErrors: result.error.flatten().fieldErrors };
  }

  const { email, password } = result.data;
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "Email atau password salah" };
  }

  // Check if account is active
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_active")
      .eq("id", user.id)
      .single();

    if (profile && !profile.is_active) {
      await supabase.auth.signOut();
      return {
        error:
          "Akun Anda telah dinonaktifkan karena pelanggaran. Hubungi customer service.",
      };
    }
  }

  revalidatePath("/", "layout");
  redirect("/id/dashboard");
}

export async function logoutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/id/login");
}
