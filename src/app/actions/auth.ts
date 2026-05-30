"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { isValidProvince } from "@/lib/provinces";
import { createAdminClient, createClient } from "@/lib/supabase/server";

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
      .regex(
        /^08[0-9]{8,11}$/,
        "Nomor telepon tidak valid (contoh: 08123456789)",
      ),
    province: z
      .string()
      .min(1, "Provinsi wajib dipilih")
      .refine(isValidProvince, "Provinsi tidak valid"),
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
  formData: FormData,
): Promise<ActionState> {
  const raw = {
    name: formData.get("name") as string,
    username: formData.get("username") as string,
    email: formData.get("email") as string,
    phone: formData.get("phone") as string,
    province: formData.get("province") as string,
    password: formData.get("password") as string,
    confirmPassword: formData.get("confirmPassword") as string,
  };

  const result = registerSchema.safeParse(raw);
  if (!result.success) {
    return { fieldErrors: result.error.flatten().fieldErrors };
  }

  const { name, username, email, phone, province, password } = result.data;

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

  // Register user
  const { data: signUpData, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name, username, phone, province },
    },
  });

  if (error) {
    if (error.message.includes("already registered")) {
      return { fieldErrors: { email: ["Email sudah terdaftar"] } };
    }
    return { error: error.message };
  }

  // The profiles row is created synchronously by the auth trigger from the
  // signup metadata. Persist `province` onto it via the service-role client
  // (no user session exists yet when email confirmation is required).
  if (signUpData.user) {
    try {
      const adminDb = createAdminClient();
      await adminDb
        .from("profiles")
        .update({ province })
        .eq("id", signUpData.user.id);
    } catch {
      // Best-effort: registration already succeeded even if this write fails.
    }
  }

  return { success: true };
}

export async function loginAction(
  _prevState: ActionState,
  formData: FormData,
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

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
