import { FileWarning, ShieldCheck, UserCog, Users } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/dal";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  if (!user || user.role !== "admin") {
    redirect("/");
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <ShieldCheck className="h-4 w-4 text-white" />
        </div>
        <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        <Link
          href="/admin"
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-white transition-colors"
        >
          <FileWarning className="h-4 w-4" />
          Laporan
        </Link>
        <Link
          href="/admin/middleman"
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-white transition-colors"
        >
          <Users className="h-4 w-4" />
          Middleman
        </Link>
        <Link
          href="/admin/users"
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-white transition-colors"
        >
          <UserCog className="h-4 w-4" />
          Pengguna
        </Link>
      </div>

      {children}
    </div>
  );
}
