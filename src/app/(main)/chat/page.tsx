import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/dal";
import { ChatContent } from "./ChatContent";

export const metadata: Metadata = { title: "Pesan" };

export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ seller?: string; auction?: string }>;
}) {
  const { seller, auction } = await searchParams;

  const user = await getUser();
  if (!user) redirect("/login");

  return <ChatContent currentUser={user} seller={seller} auction={auction} />;
}
