"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import AdminShell from "@/components/admin/AdminShell";
import {
  Card,
  CardHeader,
  CardDescription,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { supabaseClient } from "@/lib/supabaseClient";

interface Stats {
  total: number;
  pending: number;
  active: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: sessionData } = await supabaseClient.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) { router.push("/"); return; }

      const res = await fetch("/api/admin/specialists", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401 || res.status === 403) {
        await supabaseClient.auth.signOut();
        router.push("/");
        return;
      }

      if (!res.ok) { setError("Failed to load stats."); return; }

      const data = await res.json();
      setStats(data.stats);
    })();
  }, [router]);

  return (
    <AdminShell>
      <div className="flex flex-col gap-6">
        <header>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Admin Overview
          </p>
          <h1 className="mt-2 text-3xl font-semibold">Platform summary</h1>
        </header>

        {error ? (
          <p className="rounded-xl bg-accent/60 px-3 py-2 text-sm text-accent-foreground">
            {error}
          </p>
        ) : null}

        <section className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader>
              <CardDescription>Total specialists</CardDescription>
              <CardTitle className="text-4xl">
                {stats ? stats.total : "—"}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              All registered specialist profiles
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Pending review</CardDescription>
              <CardTitle className="text-4xl">
                {stats ? stats.pending : "—"}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Awaiting admin approval
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Active specialists</CardDescription>
              <CardTitle className="text-4xl">
                {stats ? stats.active : "—"}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Verified and live on the platform
            </CardContent>
          </Card>
        </section>
      </div>
    </AdminShell>
  );
}
