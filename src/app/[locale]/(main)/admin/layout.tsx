import { redirect } from "next/navigation";
import { getUser } from "@/lib/dal";
import Link from "next/link";
import { ShieldCheck, FileWarning, Ban } from "lucide-react";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const user = await getUser();

  if (!user || user.role !== "admin") {
    redirect(`/${locale}`);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <ShieldCheck className="h-4 w-4 text-white" />
        </div>
        <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
      </div>

      {/* Admin nav tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        <Link
          href={`/${locale}/admin`}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-white transition-colors"
        >
          <FileWarning className="h-4 w-4" />
          Laporan
        </Link>
        <Link
          href={`/${locale}/admin/blacklist`}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-white transition-colors"
        >
          <Ban className="h-4 w-4" />
          Blacklist
        </Link>
      </div>

      {children}
    </div>
  );
}
