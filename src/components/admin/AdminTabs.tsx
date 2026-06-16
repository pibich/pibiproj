"use client";

import {
  ClipboardCheck,
  FileWarning,
  type LucideIcon,
  UserCog,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Tab = {
  href: string;
  label: string;
  icon: LucideIcon;
  count?: number;
  /** Render the count pill in amber (pending/needs-attention) vs blue. */
  amber?: boolean;
};

export function AdminTabs({
  pendingReports = 0,
  pendingApprovals = 0,
}: {
  pendingReports?: number;
  pendingApprovals?: number;
}) {
  const pathname = usePathname();

  const tabs: Tab[] = [
    {
      href: "/admin",
      label: "Laporan",
      icon: FileWarning,
      count: pendingReports,
      amber: true,
    },
    {
      href: "/admin/approvals",
      label: "Persetujuan",
      icon: ClipboardCheck,
      count: pendingApprovals,
      amber: true,
    },
    { href: "/admin/middleman", label: "Middleman", icon: Users },
    { href: "/admin/users", label: "Pengguna", icon: UserCog },
  ];

  return (
    <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="flex w-max gap-1 rounded-[13px] border border-gray-200 bg-gray-100 p-[5px]">
        {tabs.map((tab) => {
          const active =
            tab.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(tab.href);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={`flex shrink-0 items-center gap-2 whitespace-nowrap rounded-[9px] px-4 py-2 text-sm font-semibold transition-colors ${
                active
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
              {tab.count ? (
                <span
                  className={`inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1.5 font-mono text-[10.5px] font-bold text-white ${
                    tab.amber ? "bg-amber-600" : "bg-teal-600"
                  }`}
                >
                  {tab.count}
                </span>
              ) : null}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
