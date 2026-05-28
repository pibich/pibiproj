import { createServerClient } from "@supabase/ssr";
import type { NextRequest, NextResponse } from "next/server";
import type { Database } from "@/types/supabase";

export async function updateSession(
  request: NextRequest,
  response: NextResponse,
): Promise<NextResponse> {
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const { error } = await supabase.auth.getUser();

  // Stale/invalid refresh token — clear it so the browser stops retrying
  if (error?.code === "refresh_token_not_found") {
    await supabase.auth.signOut();
  }

  return response;
}
