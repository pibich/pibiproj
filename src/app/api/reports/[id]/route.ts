import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { status, reviewed_by } = body;

  if (!["approved", "rejected"].includes(status)) {
    return NextResponse.json({ error: "Status tidak valid" }, { status: 400 });
  }

  const adminClient = createAdminClient();

  // Re-verify admin role using service role client to bypass RLS
  const { data: adminProfile } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (adminProfile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await adminClient
    .from("reports")
    .update({
      status,
      reviewed_by: reviewed_by ?? user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // When approved: increment buyer warning count, set timeout after 3 warnings
  if (status === "approved") {
    const { data: report } = await adminClient
      .from("reports")
      .select("reported_user_id")
      .eq("id", id)
      .single();

    if (report?.reported_user_id) {
      const { data: target } = await adminClient
        .from("profiles")
        .select("buyer_warning_count")
        .eq("id", report.reported_user_id)
        .single();

      const newCount = (target?.buyer_warning_count ?? 0) + 1;
      const update: { buyer_warning_count: number; buyer_timeout_until?: string } = {
        buyer_warning_count: newCount,
      };

      if (newCount >= 3) {
        const until = new Date();
        until.setDate(until.getDate() + 7);
        update.buyer_timeout_until = until.toISOString();
      }

      await adminClient
        .from("profiles")
        .update(update)
        .eq("id", report.reported_user_id);
    }
  }

  return NextResponse.json({ success: true });
}
