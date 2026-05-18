"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useParams } from "next/navigation";
import { loginAction, type ActionState } from "@/app/actions/auth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { AlertCircle } from "lucide-react";

const initialState: ActionState = {};

export function LoginForm() {
  const t = useTranslations("auth");
  const { locale } = useParams() as { locale: string };
  const [state, formAction, isPending] = useActionState(loginAction, initialState);

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
        label={t("email")}
        placeholder={t("emailPlaceholder")}
        required
        autoComplete="email"
        error={state.fieldErrors?.email?.[0]}
      />
      <Input
        id="password"
        name="password"
        type="password"
        label={t("password")}
        placeholder={t("passwordPlaceholder")}
        required
        autoComplete="current-password"
        error={state.fieldErrors?.password?.[0]}
      />

      <Button type="submit" loading={isPending} size="lg" className="mt-2">
        {t("loginButton")}
      </Button>

      <p className="text-center text-sm text-gray-600">
        {t("noAccount")}{" "}
        <Link
          href={`/${locale}/register`}
          className="font-medium text-blue-600 hover:underline"
        >
          {t("registerButton")}
        </Link>
      </p>
    </form>
  );
}
