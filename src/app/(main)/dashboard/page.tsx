import { redirect } from "next/navigation";
import { getUser } from "@/lib/dal";

export default async function DashboardPage() {
  const user = await getUser();
  if (!user) redirect("/login");
  redirect(`/profile/${user.username}`);
}
