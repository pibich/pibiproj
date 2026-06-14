"use client";

import { MessageCircle } from "lucide-react";

export function ComplaintForm({ csPhone }: { csPhone: string }) {
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const name = (form.elements.namedItem("name") as HTMLInputElement).value;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const message = (form.elements.namedItem("message") as HTMLTextAreaElement)
      .value;

    const text = `Halo CS TCG Auction,

Nama: ${name}
Email: ${email}

Keluhan:
${message}`;

    const url = `https://wa.me/${csPhone}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">
            Nama Anda *
          </label>
          <input
            name="name"
            required
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">
            Email Anda
          </label>
          <input
            name="email"
            type="email"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">
          Detail Keluhan *
        </label>
        <textarea
          name="message"
          required
          rows={4}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
        />
      </div>
      <button
        type="submit"
        className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white rounded-xl py-3 font-medium transition-colors"
      >
        <MessageCircle className="h-5 w-5" />
        Kirim via WhatsApp
      </button>
    </form>
  );
}
