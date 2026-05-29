"use client";

import { formatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  AlertTriangle,
  Banknote,
  CheckCircle,
  ClipboardCheck,
  Package,
  ThumbsUp,
  Trophy,
  Truck,
  XCircle,
} from "lucide-react";

type NotificationType =
  | "auction_won"
  | "auction_ended"
  | "transaction_confirmed"
  | "awaiting_shipment"
  | "shipping_proof_submitted"
  | "delivery_confirmed"
  | "funds_released"
  | "confirmation_expired"
  | "auction_pending_approval"
  | "auction_approved"
  | "auction_rejected";

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
  awaiting_shipment: Truck,
  shipping_proof_submitted: Package,
  delivery_confirmed: CheckCircle,
  funds_released: Banknote,
  confirmation_expired: AlertTriangle,
  auction_pending_approval: ClipboardCheck,
  auction_approved: ThumbsUp,
  auction_rejected: XCircle,
};

const colors: Record<NotificationType, string> = {
  auction_won: "text-green-500 bg-green-50",
  auction_ended: "text-blue-500 bg-blue-50",
  transaction_confirmed: "text-emerald-500 bg-emerald-50",
  awaiting_shipment: "text-orange-500 bg-orange-50",
  shipping_proof_submitted: "text-blue-500 bg-blue-50",
  delivery_confirmed: "text-emerald-500 bg-emerald-50",
  funds_released: "text-purple-500 bg-purple-50",
  confirmation_expired: "text-red-500 bg-red-50",
  auction_pending_approval: "text-indigo-500 bg-indigo-50",
  auction_approved: "text-green-500 bg-green-50",
  auction_rejected: "text-red-500 bg-red-50",
};

function getLabel(
  type: NotificationType,
  auctionTitle?: string | null,
): string {
  const title = auctionTitle ? `"${auctionTitle}"` : "lelang";
  switch (type) {
    case "auction_won":
      return `Anda memenangkan ${title}`;
    case "auction_ended":
      return `Lelang Anda telah berakhir: ${title}`;
    case "transaction_confirmed":
      return `Transaksi terkonfirmasi: ${title}`;
    case "awaiting_shipment":
      return `Pembayaran dikonfirmasi — silakan kirim paket: ${title}`;
    case "shipping_proof_submitted":
      return `Seller upload bukti pengiriman: ${title}`;
    case "delivery_confirmed":
      return `Buyer konfirmasi penerimaan paket: ${title}`;
    case "funds_released":
      return `Dana telah dilepaskan untuk: ${title}`;
    case "confirmation_expired":
      return `Peringatan: batas waktu konfirmasi ${title} telah habis`;
    case "auction_pending_approval":
      return auctionTitle
        ? `Lelang ${title} memerlukan persetujuan`
        : "Ada postingan yang memerlukan persetujuan";
    case "auction_approved":
      return `Lelang ${title} telah disetujui`;
    case "auction_rejected":
      return `Lelang ${title} ditolak`;
  }
}

export function NotificationItem({
  type,
  auctionTitle,
  createdAt,
  isRead,
}: NotificationItemProps) {
  const Icon = icons[type];
  const colorClass = colors[type];

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer ${!isRead ? "bg-sky-50/40" : ""}`}
    >
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${colorClass}`}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm leading-snug ${!isRead ? "font-medium text-gray-900" : "text-gray-700"}`}
        >
          {getLabel(type, auctionTitle)}
        </p>
        {createdAt && (
          <p className="text-xs text-gray-400 mt-0.5">
            {formatDistanceToNow(new Date(createdAt), {
              addSuffix: true,
              locale: idLocale,
            })}
          </p>
        )}
      </div>
      {!isRead && (
        <div className="w-2 h-2 rounded-full bg-sky-500 shrink-0 mt-1.5" />
      )}
    </div>
  );
}
