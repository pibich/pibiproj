"use client";

import { formatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Trophy, Package, CheckCircle, MessageSquare } from "lucide-react";

type NotificationType = "auction_won" | "auction_ended" | "transaction_confirmed" | "new_message";

interface NotificationItemProps {
  type: NotificationType;
  auctionTitle?: string | null;
  createdAt?: string;
  isRead: boolean;
}

const icons: Record<NotificationType, React.ElementType> = {
  auction_won: Trophy,
  auction_ended: Package,
  transaction_confirmed: CheckCircle,
  new_message: MessageSquare,
};

const colors: Record<NotificationType, string> = {
  auction_won: "text-green-500 bg-green-50",
  auction_ended: "text-blue-500 bg-blue-50",
  transaction_confirmed: "text-emerald-500 bg-emerald-50",
  new_message: "text-sky-500 bg-sky-50",
};

function getLabel(type: NotificationType, auctionTitle?: string | null): string {
  const title = auctionTitle ? `"${auctionTitle}"` : "lelang";
  switch (type) {
    case "auction_won":
      return `Anda memenangkan ${title}`;
    case "auction_ended":
      return `Lelang Anda telah berakhir: ${title}`;
    case "transaction_confirmed":
      return `Transaksi terkonfirmasi: ${title}`;
    case "new_message":
      return "1 pesan baru";
  }
}

export function NotificationItem({ type, auctionTitle, createdAt, isRead }: NotificationItemProps) {
  const Icon = icons[type];
  const colorClass = colors[type];

  return (
    <div className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${!isRead ? "bg-sky-50/40" : ""}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${colorClass}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-snug ${!isRead ? "font-medium text-gray-900" : "text-gray-700"}`}>
          {getLabel(type, auctionTitle)}
        </p>
        {createdAt && (
          <p className="text-xs text-gray-400 mt-0.5">
            {formatDistanceToNow(new Date(createdAt), { addSuffix: true, locale: idLocale })}
          </p>
        )}
      </div>
      {!isRead && (
        <div className="w-2 h-2 rounded-full bg-sky-500 shrink-0 mt-1.5" />
      )}
    </div>
  );
}
