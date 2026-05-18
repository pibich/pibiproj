"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useParams } from "next/navigation";
import { registerAction, type ActionState } from "@/app/actions/auth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { AlertCircle, CheckCircle2 } from "lucide-react";

const initialState: ActionState = {};

export function RegisterForm() {
  const t = useTranslations("auth");
  const { locale } = useParams() as { locale: string };
  const [state, formAction, isPending] = useActionState(registerAction, initialState);

  if (state.success) {
    return (
      <div className="flex flex-col items-center gap-4 text-center py-4">
        <CheckCircle2 className="h-12 w-12 text-green-500" />
        <h3 className="text-lg font-semibold text-gray-900">{t("verifyEmail")}</h3>
        <p className="text-sm text-gray-600 max-w-sm">{t("verifyEmailMessage")}</p>
        <Link
          href={`/${locale}/login`}
          className="text-sm text-blue-600 hover:underline font-medium"
        >
          {t("hasAccount")} {t("loginButton")}
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
        {t("usernameNote")}
      </p>

      <Input
        id="name"
        name="name"
        label={t("name")}
        placeholder={t("namePlaceholder")}
        required
        autoComplete="name"
        error={state.fieldErrors?.name?.[0]}
      />
      <Input
        id="username"
        name="username"
        label={t("username")}
        placeholder={t("usernamePlaceholder")}
        required
        autoComplete="username"
        error={state.fieldErrors?.username?.[0]}
      />
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
        id="phone"
        name="phone"
        type="tel"
        label={t("phone")}
        placeholder={t("phonePlaceholder")}
        required
        autoComplete="tel"
        error={state.fieldErrors?.phone?.[0]}
      />
      <Input
        id="password"
        name="password"
        type="password"
        label={t("password")}
        placeholder={t("passwordPlaceholder")}
        required
        autoComplete="new-password"
        error={state.fieldErrors?.password?.[0]}
      />
      <Input
        id="confirmPassword"
        name="confirmPassword"
        type="password"
        label={t("confirmPassword")}
        placeholder={t("confirmPasswordPlaceholder")}
        required
        autoComplete="new-password"
        error={state.fieldErrors?.confirmPassword?.[0]}
      />

      <Button type="submit" loading={isPending} size="lg" className="mt-2">
        {t("registerButton")}
      </Button>

      <p className="text-center text-sm text-gray-600">
        {t("hasAccount")}{" "}
        <Link
          href={`/${locale}/login`}
          className="font-medium text-blue-600 hover:underline"
        >
          {t("loginButton")}
        </Link>
      </p>
    </form>
  );
}
