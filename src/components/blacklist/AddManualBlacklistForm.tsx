"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function AddManualBlacklistForm({ adminId }: { adminId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    phone: "",
    reason: "",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      await fetch("/api/admin/blacklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, added_by: adminId }),
      });
      setForm({ name: "", username: "", email: "", phone: "", reason: "" });
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Tambah Blacklist Manual</h2>
          <p className="text-sm text-gray-500">Tambahkan pengguna ke blacklist secara manual</p>
        </div>
        <Button size="sm" onClick={() => setOpen((v) => !v)}>
          {open ? "Batal" : "+ Tambah"}
        </Button>
      </div>

      {open && (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Nama"
            id="name"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Nama lengkap"
          />
          <Input
            label="Username"
            id="username"
            name="username"
            value={form.username}
            onChange={handleChange}
            placeholder="username"
          />
          <Input
            label="Email"
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="email@example.com"
          />
          <Input
            label="No. Telepon"
            id="phone"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="08xxxxxxxxxx"
          />
          <div className="sm:col-span-2 flex flex-col gap-1">
            <label htmlFor="reason" className="text-sm font-medium text-slate-700">
              Alasan
            </label>
            <textarea
              id="reason"
              name="reason"
              value={form.reason}
              onChange={handleChange}
              rows={3}
              placeholder="Jelaskan alasan blacklist..."
              className="rounded-lg border border-sky-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent hover:border-sky-300 shadow-sm resize-none"
            />
          </div>
          <div className="sm:col-span-2 flex justify-end">
            <Button type="submit" loading={isPending}>
              Simpan
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
