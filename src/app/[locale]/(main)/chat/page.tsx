import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/dal";
import { ChatWidget } from "@/components/chat/ChatWidget";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("chat");
  return { title: t("title") };
}

export default async function ChatPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ seller?: string; auction?: string }>;
}) {
  const { locale } = await params;
  const { seller, auction } = await searchParams;

  const user = await getUser();
  if (!user) redirect(`/${locale}/login`);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <h1 className="text-xl font-bold text-gray-900 mb-4">Pesan</h1>
      <ChatWidget
        currentUser={user}
        targetUserId={seller}
        auctionId={auction}
      />
    </div>
  );
}
