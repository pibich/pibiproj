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

  const body = await req.json() as { action: "toggle_role" | "reset_timeout" };
  const adminClient = createAdminClient();

  const { data: admin } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (admin?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (body.action === "toggle_role") {
    if (id === user.id) {
      return NextResponse.json(
        { error: "Tidak bisa mengubah role akun sendiri" },
        { status: 400 }
      );
    }

    const { data: target, error: fetchError } = await adminClient
      .from("profiles")
      .select("role")
      .eq("id", id)
      .single();

    if (fetchError || !target) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }

    const newRole = target.role === "admin" ? "user" : "admin";
    const { error } = await adminClient
      .from("profiles")
      .update({ role: newRole })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, role: newRole });
  }

  if (body.action === "reset_timeout") {
    const { error } = await adminClient
      .from("profiles")
      .update({ buyer_timeout_until: null })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
