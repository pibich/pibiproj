"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { getTimeRemaining } from "@/lib/utils";
import { Clock } from "lucide-react";

export function CountdownTimer({ endTime }: { endTime: string }) {
  const t = useTranslations("auction");
  const [time, setTime] = useState(getTimeRemaining(endTime));

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(getTimeRemaining(endTime));
    }, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  if (time.expired) {
    return (
      <div className="flex items-center gap-2 text-red-600">
        <Clock className="h-5 w-5" />
        <span className="font-semibold">{t("auctionEnded")}</span>
      </div>
    );
  }

  const isUrgent = time.total < 3600;

  return (
    <div className={`flex flex-col gap-1 ${isUrgent ? "text-red-600" : "text-gray-900"}`}>
      <div className="flex items-center gap-1.5 text-sm font-medium text-gray-500">
        <Clock className="h-4 w-4" />
        {t("timeLeft")}
      </div>
      <div className="flex items-end gap-2">
        {time.days > 0 && (
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold tabular-nums">{time.days}</span>
            <span className="text-xs text-gray-500">{t("days")}</span>
          </div>
        )}
        <div className="flex flex-col items-center">
          <span className="text-2xl font-bold tabular-nums">
            {String(time.hours).padStart(2, "0")}
          </span>
          <span className="text-xs text-gray-500">{t("hours")}</span>
        </div>
        <span className="text-xl font-bold mb-1">:</span>
        <div className="flex flex-col items-center">
          <span className="text-2xl font-bold tabular-nums">
            {String(time.minutes).padStart(2, "0")}
          </span>
          <span className="text-xs text-gray-500">{t("minutes")}</span>
        </div>
        <span className="text-xl font-bold mb-1">:</span>
        <div className="flex flex-col items-center">
          <span className="text-2xl font-bold tabular-nums">
            {String(time.seconds).padStart(2, "0")}
          </span>
          <span className="text-xs text-gray-500">{t("seconds")}</span>
        </div>
      </div>
    </div>
  );
}
