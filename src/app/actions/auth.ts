"use server";

import type { AuthError } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { isValidProvince } from "@/lib/provinces";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { TimeoutError, withTimeout } from "@/lib/utils";

// Supabase auth calls are guarded with this so a stalled network request
// surfaces as a friendly message instead of an indefinitely pending form.
const AUTH_TIMEOUT_MS = 15000;

/**
 * Translates a Supabase auth error into a specific, user-facing Indonesian
 * message based on its `code`/`status`, instead of a single catch-all string.
 */
function authErrorMessage(
  error: Pick<AuthError, "code" | "status" | "message">,
): string {
  switch (error.code) {
    case "invalid_credentials":
      return "Email atau password salah.";
    case "email_not_confirmed":
      return "Email belum diverifikasi. Cek inbox atau folder spam untuk link verifikasi.";
    case "user_already_exists":
    case "email_exists":
      return "Email sudah terdaftar.";
    case "weak_password":
      return "Password terlalu lemah. Gunakan minimal 8 karakter.";
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return "Terlalu banyak percobaan. Silakan tunggu beberapa saat lalu coba lagi.";
    case "signup_disabled":
      return "Pendaftaran sedang dinonaktifkan untuk sementara.";
  }

  if (error.status === 429) {
    return "Terlalu banyak percobaan. Silakan tunggu beberapa saat lalu coba lagi.";
  }

  // No recognized code: fall back to the raw message (still dynamic), with a
  // couple of message-based guards for SDK responses that omit `code`.
  const msg = error.message?.trim();
  if (msg) {
    if (/invalid login credentials/i.test(msg))
      return "Email atau password salah.";
    if (/email not confirmed/i.test(msg))
      return "Email belum diverifikasi. Cek inbox atau folder spam.";
    return msg;
  }
  return "Terjadi kesalahan saat memproses permintaan. Silakan coba lagi.";
}

/**
 * Maps a thrown exception (timeout / network failure) from an auth flow to a
 * user-facing message. Unexpected errors are logged for diagnosis.
 */
function describeAuthException(err: unknown): string {
  if (err instanceof TimeoutError) {
    return "Koneksi ke server melebihi batas waktu. Periksa internet Anda lalu coba lagi.";
  }
  console.error("[auth] unexpected error:", err);
  return "Tidak dapat terhubung ke server. Periksa koneksi internet Anda dan coba lagi.";
}

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
  // Submitted values echoed back so the form can repopulate after a failed
  // attempt (React 19 auto-resets uncontrolled fields once an action returns).
  // Passwords are intentionally never echoed.
  values?: Record<string, string>;
};

/**
 * Best-effort check of whether an email already has an account, used to point
 * the user at the right field on a failed login. Returns `null` if the lookup
 * itself fails so the caller can fall back to a generic message.
 *
 * Note: the register form already reveals whether an email is taken, so this
 * does not add account-enumeration exposure beyond what already exists.
 */
async function emailIsRegistered(email: string): Promise<boolean | null> {
  try {
    const adminDb = createAdminClient();
    const { data } = await withTimeout(
      adminDb.from("profiles").select("id").eq("email", email).maybeSingle(),
      AUTH_TIMEOUT_MS,
    );
    return !!data;
  } catch {
    return null;
  }
}

export async function registerAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  // Coerce missing fields to "" so Zod reports its friendly rule messages
  // (e.g. "Provinsi wajib dipilih") instead of "expected string, received null"
  // when a control submits nothing.
  const raw = {
    name: (formData.get("name") ?? "") as string,
    username: (formData.get("username") ?? "") as string,
    email: (formData.get("email") ?? "") as string,
    phone: (formData.get("phone") ?? "") as string,
    province: (formData.get("province") ?? "") as string,
    password: (formData.get("password") ?? "") as string,
    confirmPassword: (formData.get("confirmPassword") ?? "") as string,
  };

  // Everything except passwords is echoed back so a validation error doesn't
  // wipe what the user already typed.
  const values = {
    name: raw.name,
    username: raw.username,
    email: raw.email,
    phone: raw.phone,
    province: raw.province,
  };

  const result = registerSchema.safeParse(raw);
  if (!result.success) {
    return { fieldErrors: result.error.flatten().fieldErrors, values };
  }

  const { name, username, email, phone, province, password } = result.data;

  const supabase = await createClient();

  try {
    // Check if username already taken
    const { data: existingUsername } = await withTimeout(
      supabase.from("profiles").select("id").eq("username", username).single(),
      AUTH_TIMEOUT_MS,
    );

    if (existingUsername) {
      return {
        fieldErrors: { username: ["Username sudah digunakan"] },
        values,
      };
    }

    // Check if phone already registered
    const { data: existingPhone } = await withTimeout(
      supabase.from("profiles").select("id").eq("phone", phone).single(),
      AUTH_TIMEOUT_MS,
    );

    if (existingPhone) {
      return {
        fieldErrors: { phone: ["Nomor telepon sudah terdaftar"] },
        values,
      };
    }

    // Check if email already registered. Supabase's signUp silently "succeeds"
    // for an existing email (anti-enumeration) without sending a mail, so we
    // must catch it ourselves to avoid a misleading "check your inbox" screen.
    const { data: existingEmail } = await withTimeout(
      supabase.from("profiles").select("id").eq("email", email).maybeSingle(),
      AUTH_TIMEOUT_MS,
    );

    if (existingEmail) {
      return { fieldErrors: { email: ["Email sudah terdaftar"] }, values };
    }

    // Register user
    const { data: signUpData, error } = await withTimeout(
      supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name, username, phone, province },
        },
      }),
      AUTH_TIMEOUT_MS,
    );

    if (error) {
      if (
        error.code === "user_already_exists" ||
        error.message.includes("already registered")
      ) {
        return { fieldErrors: { email: ["Email sudah terdaftar"] }, values };
      }
      return { error: authErrorMessage(error), values };
    }

    // Safety net: when the email already exists, Supabase returns a user with
    // an empty `identities` array instead of an error (and sends no email).
    // Treat that as "already registered" rather than a successful signup.
    if (signUpData.user?.identities?.length === 0) {
      return { fieldErrors: { email: ["Email sudah terdaftar"] }, values };
    }

    // The profiles row is created synchronously by the auth trigger from the
    // signup metadata. Persist `province` onto it via the service-role client
    // (no user session exists yet when email confirmation is required).
    if (signUpData.user) {
      try {
        const adminDb = createAdminClient();
        await withTimeout(
          adminDb
            .from("profiles")
            .update({ province })
            .eq("id", signUpData.user.id),
          AUTH_TIMEOUT_MS,
        );
      } catch {
        // Best-effort: registration already succeeded even if this write fails.
      }
    }
  } catch (err) {
    return { error: describeAuthException(err), values };
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
    return {
      fieldErrors: result.error.flatten().fieldErrors,
      values: { email: raw.email },
    };
  }

  const { email, password } = result.data;

  let signInError: AuthError | null;
  try {
    const supabase = await createClient();
    const { error } = await withTimeout(
      supabase.auth.signInWithPassword({ email, password }),
      AUTH_TIMEOUT_MS,
    );
    signInError = error;
  } catch (err) {
    // Network/timeout failure — must be caught here so it doesn't bubble as an
    // uncaught exception. `redirect()` below stays outside this block because
    // it signals success by throwing NEXT_REDIRECT.
    return { error: describeAuthException(err), values: { email } };
  }

  if (signInError) {
    // Supabase returns a single generic `invalid_credentials` for both an
    // unknown email and a wrong password. Look up the email so we can point the
    // error at the field that's actually wrong instead of blaming both.
    if (signInError.code === "invalid_credentials") {
      const registered = await emailIsRegistered(email);
      if (registered === false) {
        return {
          fieldErrors: { email: ["Email belum terdaftar"] },
          values: { email },
        };
      }
      if (registered === true) {
        return {
          fieldErrors: { password: ["Password salah"] },
          values: { email },
        };
      }
      // Lookup failed — fall back to a generic message.
      return { error: "Email atau password salah.", values: { email } };
    }
    return { error: authErrorMessage(signInError), values: { email } };
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
