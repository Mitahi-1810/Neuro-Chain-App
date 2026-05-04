import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminEmail = process.env.ADMIN_EMAIL;
const adminPassword = process.env.ADMIN_PASSWORD;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Missing Supabase service role env vars.");
}

const adminClient = createClient(supabaseUrl, serviceRoleKey);

export async function POST() {
  if (!adminEmail || !adminPassword) {
    return NextResponse.json(
      { error: "Missing ADMIN_EMAIL or ADMIN_PASSWORD" },
      { status: 500 },
    );
  }

  const { data: existing, error: lookupError } =
    await adminClient.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });

  if (lookupError) {
    return NextResponse.json(
      { error: "Unable to check users" },
      { status: 500 },
    );
  }

  const match = existing?.users?.find((user) => user.email === adminEmail);
  let userId = match?.id;

  if (!userId) {
    const { data: created, error: createError } =
      await adminClient.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
        user_metadata: {
          full_name: "Admin",
          role: "ADMIN",
          tier_level: "FREE",
        },
      });

    if (createError || !created?.user) {
      return NextResponse.json(
        { error: createError?.message || "Create user failed" },
        { status: 500 },
      );
    }

    userId = created.user.id;
  }

  const now = new Date().toISOString();

  const { error: upsertError } = await adminClient.from("users").upsert(
    {
      id: userId,
      email: adminEmail,
      full_name: "Admin",
      role: "ADMIN",
      tier_level: "FREE",
      created_at: now,
      updated_at: now,
    },
    { onConflict: "id" },
  );

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, userId });
}
