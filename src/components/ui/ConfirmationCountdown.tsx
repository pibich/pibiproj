"use client";

import { AlertTriangle, Clock } from "lucide-react";
import { useEffect, useState } from "react";

interface ConfirmationCountdownProps {
  deadline: string;
  label?: string;
}

function getTimeLeft(deadline: string) {
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff <= 0) return null;
  const h = Math.floor(diff / (1000 * 60 * 60));
  const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const s = Math.floor((diff % (1000 * 60)) / 1000);
  return { h, m, s, totalMs: diff };
}

export function ConfirmationCountdown({
  deadline,
  label = "Batas konfirmasi ke seller",
}: ConfirmationCountdownProps) {
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(deadline));

  useEffect(() => {
    const id = setInterval(() => {
      const t = getTimeLeft(deadline);
      setTimeLeft(t);
      if (!t) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, [deadline]);

  if (!timeLeft) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-2.5 py-1.5 font-semibold">
        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
        Batas waktu konfirmasi telah habis
      </div>
    );
  }

  const isUrgent = timeLeft.totalMs < 2 * 60 * 60 * 1000; // < 2 jam
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div
      className={[
        "flex items-center gap-1.5 text-xs rounded-lg px-2.5 py-1.5 font-medium border",
        isUrgent
          ? "text-red-700 bg-red-50 border-red-200"
          : "text-amber-700 bg-amber-50 border-amber-200",
      ].join(" ")}
    >
      <Clock className="h-3.5 w-3.5 shrink-0" />
      <span>{label}:</span>
      <span className="font-mono font-bold tabular-nums">
        {pad(timeLeft.h)}:{pad(timeLeft.m)}:{pad(timeLeft.s)}
      </span>
    </div>
  );
}
