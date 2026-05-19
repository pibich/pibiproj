"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerAction, type ActionState } from "@/app/actions/auth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { AlertCircle, CheckCircle2 } from "lucide-react";

const initialState: ActionState = {};

export function RegisterForm() {
  const [state, formAction, isPending] = useActionState(registerAction, initialState);

  if (state.success) {
    return (
      <div className="flex flex-col items-center gap-4 text-center py-4">
        <CheckCircle2 className="h-12 w-12 text-green-500" />
        <h3 className="text-lg font-semibold text-gray-900">Verifikasi Email</h3>
        <p className="text-sm text-gray-600 max-w-sm">
          Kami telah mengirimkan link verifikasi ke email Anda. Silakan cek inbox atau folder spam.
        </p>
        <Link href="/login" className="text-sm text-blue-600 hover:underline font-medium">
          Sudah punya akun? Masuk
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      {state.error && (
        <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          {state.error}
        </div>
      )}

      <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
        Username, email, dan nomor telepon tidak dapat diubah setelah pendaftaran.
      </p>

      <Input
        id="name"
        name="name"
        label="Nama Lengkap"
        placeholder="Masukkan nama lengkap"
        required
        autoComplete="name"
        error={state.fieldErrors?.name?.[0]}
      />
      <Input
        id="username"
        name="username"
        label="Username"
        placeholder="Masukkan username unik"
        required
        autoComplete="username"
        error={state.fieldErrors?.username?.[0]}
      />
      <Input
        id="email"
        name="email"
        type="email"
        label="Email"
        placeholder="contoh@email.com"
        required
        autoComplete="email"
        error={state.fieldErrors?.email?.[0]}
      />
      <Input
        id="phone"
        name="phone"
        type="tel"
        label="Nomor Telepon"
        placeholder="08xxxxxxxxxx"
        required
        autoComplete="tel"
        error={state.fieldErrors?.phone?.[0]}
      />
      <Input
        id="password"
        name="password"
        type="password"
        label="Password"
        placeholder="Minimal 8 karakter"
        required
        autoComplete="new-password"
        error={state.fieldErrors?.password?.[0]}
      />
      <Input
        id="confirmPassword"
        name="confirmPassword"
        type="password"
        label="Konfirmasi Password"
        placeholder="Ulangi password"
        required
        autoComplete="new-password"
        error={state.fieldErrors?.confirmPassword?.[0]}
      />

      <Button type="submit" loading={isPending} size="lg" className="mt-2">
        Daftar Sekarang
      </Button>

      <p className="text-center text-sm text-gray-600">
        Sudah punya akun?{" "}
        <Link href="/login" className="font-medium text-blue-600 hover:underline">
          Masuk
        </Link>
      </p>
    </form>
  );
}
