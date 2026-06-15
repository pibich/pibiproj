import { redirect } from "next/navigation";

// The auction listing has been merged into the home page. Preserve any
// incoming filter query (category, condition, sort, q, status) and forward to
// the "#lelang" section on home.
export default async function AuctionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string") qs.set(key, value);
  }
  const query = qs.toString();
  redirect(query ? `/?${query}#lelang` : "/#lelang");
}
