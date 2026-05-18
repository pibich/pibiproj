"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { AlertCircle, CheckCircle2, Plus } from "lucide-react";

export function AddManualBlacklistForm({ adminId }: { adminId: string }) {
  const t = useTranslations("admin");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    const form = e.currentTarget;
    const data = new FormData(form);

    startTransition(async () => {
      const res = await fetch("/api/admin/blacklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email") || null,
          phone: data.get("phone") || null,
          reason: data.get("reason"),
          added_by_admin: adminId,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Gagal menambahkan ke blacklist");
      } else {
        setSuccess(true);
        form.reset();
        router.refresh();
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
          <Plus className="h-4 w-4" />
          {t("addManualBlacklist")}
        </h2>
      </CardHeader>
      <CardBody>
        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700 mb-4">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-700 mb-4">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            Berhasil ditambahkan ke blacklist
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            id="bl_name"
            name="name"
            label={t("manualBlacklistName")}
            placeholder="Nama lengkap"
            required
          />
          <Input
            id="bl_email"
            name="email"
            type="email"
            label={t("manualBlacklistEmail")}
            placeholder="email@contoh.com"
          />
          <Input
            id="bl_phone"
            name="phone"
            type="tel"
            label={t("manualBlacklistPhone")}
            placeholder="08xxxxxxxxxx"
          />
          <Input
            id="bl_reason"
            name="reason"
            label={t("manualBlacklistReason")}
            placeholder="Jelaskan alasan blacklist"
            required
          />
          <div className="sm:col-span-2 flex justify-end">
            <Button type="submit" variant="danger" loading={isPending}>
              {t("addToBlacklist")}
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
