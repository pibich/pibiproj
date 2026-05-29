import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");
  const next = searchParams.get("next") ?? "/dashboard";

  // OAuth provider returned an error (e.g. user denied, or email missing)
  // Redirect back to `next` with the error so the UI can display it
  if (error) {
    const dest = new URL(`${origin}${next}`);
    dest.searchParams.set("oauth_error", errorDescription ?? error);
    return NextResponse.redirect(dest.toString());
  }

  if (code) {
    const supabase = await createClient();
    const { error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code);
    if (!exchangeError) {
      // If a Facebook identity is now linked, persist its display name to the
      // public profiles table so it can be shown on the user's profile.
      // Wrapped in try/catch so a sync failure never breaks the redirect.
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        const facebook = user?.identities?.find(
          (id) => id.provider === "facebook",
        );
        const facebookName =
          (facebook?.identity_data?.name as string | undefined) ??
          (facebook?.identity_data?.full_name as string | undefined);
        if (user && facebookName) {
          await supabase
            .from("profiles")
            .update({ facebook_name: facebookName })
            .eq("id", user.id);
        }
      } catch {
        // ignore — linking already succeeded, name sync is best-effort
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
