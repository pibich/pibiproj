import { Sparkles } from "lucide-react";
import Link from "next/link";
import { NotificationBell } from "@/components/notifications/NotificationBell";

interface MobileHeaderProps {
  userId: string;
}

export function MobileHeader({ userId }: MobileHeaderProps) {
  return (
    <header className="md:hidden sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-sky-100 shadow-sm shadow-sky-100/50">
      <div className="flex items-center justify-between h-12 px-4">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-7 h-7 bg-gradient-to-br from-sky-400 to-blue-500 rounded-lg flex items-center justify-center shadow-sm shadow-sky-200 group-hover:shadow-sky-300 transition-shadow">
            <Sparkles className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="font-bold text-slate-800 tracking-tight text-sm">
            TCG <span className="text-sky-500">Marketplace</span>
          </span>
        </Link>

        <NotificationBell userId={userId} channelId="mobile" />
      </div>
    </header>
  );
}
