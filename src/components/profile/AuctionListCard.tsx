import { Gavel, MessageCircle } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { formatIDR } from "@/lib/utils";

interface AuctionListCardProps {
  image: string | null;
  title: string;
  href: string;
  price: number;
  badge: {
    label: string;
    variant: "success" | "warning" | "info" | "default" | "danger";
  };
  subInfo?: string;
  actionLabel?: string;
  chatHref?: string;
}

export function AuctionListCard({
  image,
  title,
  href,
  price,
  badge,
  subInfo,
  actionLabel,
  chatHref,
}: AuctionListCardProps) {
  const imageEl = (
    <div className="w-[72px] h-[72px] rounded-xl bg-gray-100 overflow-hidden shrink-0">
      {image ? (
        // biome-ignore lint/performance/noImgElement: Supabase CDN
        <img src={image} alt="" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-teal-100">
          <Gavel className="h-6 w-6 text-teal-400" />
        </div>
      )}
    </div>
  );

  if (chatHref) {
    return (
      <div className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 shadow-sm p-3 hover:border-teal-300 hover:shadow-md transition-all">
        <Link href={href} className="shrink-0">
          {imageEl}
        </Link>
        <Link href={href} className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug hover:text-teal-600 transition-colors">
            {title}
          </p>
          <p className="text-sm font-bold text-teal-600 mt-1">
            {formatIDR(price)}
          </p>
          {subInfo && (
            <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">
              {subInfo}
            </p>
          )}
        </Link>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <Badge variant={badge.variant} className="text-xs">
            {badge.label}
          </Badge>
          <Link
            href={chatHref}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 px-2.5 py-1.5 rounded-lg transition-colors"
          >
            <MessageCircle className="h-3 w-3" />
            Chat Penjual
          </Link>
        </div>
      </div>
    );
  }

  return (
    <Link
      href={href}
      className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 shadow-sm p-3 hover:border-teal-300 hover:shadow-md transition-all group"
    >
      {imageEl}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug flex-1">
            {title}
          </p>
          <Badge variant={badge.variant} className="shrink-0 text-xs">
            {badge.label}
          </Badge>
        </div>
        <p className="text-sm font-bold text-teal-600 mt-1">
          {formatIDR(price)}
        </p>
        {subInfo && (
          <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{subInfo}</p>
        )}
        {actionLabel && (
          <p className="text-xs text-teal-600 font-semibold mt-1 group-hover:underline">
            {actionLabel} →
          </p>
        )}
      </div>
    </Link>
  );
}
