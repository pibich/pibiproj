"use client";

import { AlertCircle } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import { type ActionState, loginAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const initialState: ActionState = {};

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(
    loginAction,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      {state.error && (
        <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          {state.error}
        </div>
      )}

      <Input
        id="email"
        name="email"
        type="email"
        label="Email"
        placeholder="contoh@email.com"
        required
        autoComplete="email"
        defaultValue={state.values?.email ?? ""}
        error={state.fieldErrors?.email?.[0]}
      />
      <Input
        id="password"
        name="password"
        type="password"
        label="Password"
        placeholder="Minimal 8 karakter"
        required
        autoComplete="current-password"
        error={state.fieldErrors?.password?.[0]}
      />

      <Button type="submit" loading={isPending} size="lg" className="mt-2">
        Masuk
      </Button>

      <p className="text-center text-sm text-gray-600">
        Belum punya akun?{" "}
        <Link
          href="/register"
          className="font-medium text-teal-600 hover:underline"
        >
          Daftar Sekarang
        </Link>
      </p>
    </form>
  );
}
