import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/dal";
import { ChatWidget } from "@/components/chat/ChatWidget";

export const metadata: Metadata = { title: "Pesan" };

export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ seller?: string; auction?: string }>;
}) {
  const { seller, auction } = await searchParams;

  const user = await getUser();
  if (!user) redirect("/login");

  return (
    <>
      {/* Mobile: full height, no padding, no footer/bottom-nav */}
      <div className="sm:hidden h-[calc(100dvh-64px)] overflow-hidden">
        <ChatWidget currentUser={user} targetUserId={seller} auctionId={auction} className="rounded-none border-0 border-t border-gray-100" />
      </div>

      {/* Desktop: padded layout */}
      <div className="hidden sm:block min-h-screen bg-sky-50 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto flex flex-col gap-4">
          <h1 className="text-xl font-bold text-gray-900">Pesan</h1>
          <div style={{ height: "min(calc(100dvh - 10rem), 680px)" }}>
            <ChatWidget currentUser={user} targetUserId={seller} auctionId={auction} />
          </div>
        </div>
      </div>
    </>
  );
}
