import { type NextRequest, NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminClient = createAdminClient();

  const { data: admin } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (admin?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: target, error: fetchError } = await adminClient
    .from("profiles")
    .select("is_middleman")
    .eq("id", id)
    .single();

  if (fetchError || !target) {
    return NextResponse.json(
      { error: "User tidak ditemukan" },
      { status: 404 },
    );
  }

  const { error } = await adminClient
    .from("profiles")
    .update({ is_middleman: !target.is_middleman })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    is_middleman: !target.is_middleman,
  });
}
