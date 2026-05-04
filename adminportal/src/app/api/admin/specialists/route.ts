import { NextResponse } from "next/server";

import {
  createServerSupabaseClient,
  createServiceRoleClient,
} from "@/lib/supabaseServer";

const ADMIN_ROLE = "ADMIN";

async function requireAdmin(request: Request) {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.replace("Bearer ", "").trim();

  if (!token) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  // Anon client for token validation only.
  const anonClient = createServerSupabaseClient();
  const { data: userData, error: userError } =
    await anonClient.auth.getUser(token);

  if (userError || !userData?.user) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  // Service-role client bypasses RLS for admin queries.
  const adminClient = createServiceRoleClient();

  const { data: profile } = await adminClient
    .from("users")
    .select("role")
    .eq("id", userData.user.id)
    .maybeSingle();

  const role =
    profile?.role ||
    userData.user.app_metadata?.role ||
    userData.user.user_metadata?.role;

  if (role !== ADMIN_ROLE) {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { supabase: adminClient };
}

export async function GET(request: Request) {
  const { supabase, error } = await requireAdmin(request);
  if (error) return error;

  const { data: allSpecialists, error: statsError } = await supabase
    .from("specialists")
    .select("id, status, is_verified");

  if (statsError) {
    const message = statsError.message || "Failed to load stats";
    if (message.includes("Could not find the table")) {
      return NextResponse.json({
        stats: { total: 0, pending: 0, active: 0 },
        pending: [],
        warning: "Specialists table not found in Supabase.",
      });
    }
    return NextResponse.json(
      { error: "Failed to load stats", detail: message },
      { status: 500 },
    );
  }

  const total = allSpecialists?.length ?? 0;
  const pending =
    allSpecialists?.filter(
      (row) => row.status === "PENDING" || row.is_verified === 0,
    ).length ?? 0;
  const active =
    allSpecialists?.filter(
      (row) => row.status === "ACTIVE" && row.is_verified === 1,
    ).length ?? 0;

  const { data: pendingSpecialists, error: pendingError } = await supabase
    .from("specialists")
    .select(
      "id, full_name, medical_reg_number, specialty, city, status, is_verified, created_at",
    )
    .or("status.eq.PENDING,is_verified.eq.0")
    .order("created_at", { ascending: false });

  if (pendingError) {
    const message = pendingError.message || "Failed to load specialists";
    if (message.includes("Could not find the table")) {
      return NextResponse.json({
        stats: { total, pending: 0, active },
        pending: [],
        warning: "Specialists table not found in Supabase.",
      });
    }
    return NextResponse.json(
      { error: "Failed to load specialists", detail: message },
      { status: 500 },
    );
  }

  return NextResponse.json({
    stats: { total, pending, active },
    pending: pendingSpecialists || [],
  });
}

export async function PATCH(request: Request) {
  const { supabase, error } = await requireAdmin(request);
  if (error) return error;

  const body = await request.json();
  const id = body?.id as string | undefined;
  const action = body?.action as "approve" | "reject" | undefined;

  if (!id || !action) {
    return NextResponse.json(
      { error: "Missing id or action" },
      { status: 400 },
    );
  }

  const updates =
    action === "approve"
      ? {
          status: "ACTIVE",
          is_verified: 1,
          updated_at: new Date().toISOString(),
        }
      : { status: "INACTIVE", updated_at: new Date().toISOString() };

  const { error: updateError } = await supabase
    .from("specialists")
    .update(updates)
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
