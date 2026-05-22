"use client";

import { Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getTimeRemaining } from "@/lib/utils";

export function CountdownTimer({
  endTime,
  auctionId,
}: {
  endTime: string;
  auctionId?: string;
}) {
  const [time, setTime] = useState(getTimeRemaining(endTime));
  const [forcedEnded, setForcedEnded] = useState(false);

  // Realtime: immediately stop timer if auction status changes (e.g. buy now)
  useEffect(() => {
    if (!auctionId) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`timer-${auctionId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "auctions",
          filter: `id=eq.${auctionId}`,
        },
        (payload) => {
          const updated = payload.new as { status: string };
          if (updated.status !== "active") setForcedEnded(true);
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [auctionId]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(getTimeRemaining(endTime));
    }, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  if (forcedEnded || time.expired) {
    return (
      <div className="flex items-center gap-2 text-red-600">
        <Clock className="h-5 w-5" />
        <span className="font-semibold">Lelang Telah Berakhir</span>
      </div>
    );
  }

  const isUrgent = time.total < 3600;

  return (
    <div
      className={`flex flex-col gap-1 ${isUrgent ? "text-red-600" : "text-gray-900"}`}
    >
      <div className="flex items-center gap-1.5 text-sm font-medium text-gray-500">
        <Clock className="h-4 w-4" />
        Sisa Waktu
      </div>
      <div className="flex items-end gap-2">
        {time.days > 0 && (
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold tabular-nums">{time.days}</span>
            <span className="text-xs text-gray-500">hari</span>
          </div>
        )}
        <div className="flex flex-col items-center">
          <span className="text-2xl font-bold tabular-nums">
            {String(time.hours).padStart(2, "0")}
          </span>
          <span className="text-xs text-gray-500">jam</span>
        </div>
        <span className="text-xl font-bold mb-1">:</span>
        <div className="flex flex-col items-center">
          <span className="text-2xl font-bold tabular-nums">
            {String(time.minutes).padStart(2, "0")}
          </span>
          <span className="text-xs text-gray-500">menit</span>
        </div>
        <span className="text-xl font-bold mb-1">:</span>
        <div className="flex flex-col items-center">
          <span className="text-2xl font-bold tabular-nums">
            {String(time.seconds).padStart(2, "0")}
          </span>
          <span className="text-xs text-gray-500">detik</span>
        </div>
      </div>
    </div>
  );
}
