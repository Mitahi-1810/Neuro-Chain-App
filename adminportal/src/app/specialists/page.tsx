"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import AdminShell from "@/components/admin/AdminShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabaseClient } from "@/lib/supabaseClient";

interface SpecialistRow {
  id: string;
  full_name: string | null;
  medical_reg_number: string | null;
  specialty: string | null;
  city: string | null;
  status: string | null;
  is_verified: number | null;
  created_at: string | null;
}

interface Stats {
  total: number;
  pending: number;
  active: number;
}

export default function SpecialistsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingSpecialists, setPendingSpecialists] = useState<SpecialistRow[]>(
    [],
  );
  const [stats, setStats] = useState<Stats>({
    total: 0,
    pending: 0,
    active: 0,
  });
  const [warning, setWarning] = useState<string | null>(null);

  const pendingCountLabel = useMemo(() => {
    return stats.pending === 1
      ? "1 pending profile"
      : `${stats.pending} pending profiles`;
  }, [stats.pending]);

  const fetchSpecialists = async () => {
    setLoading(true);
    setError(null);
    setWarning(null);

    const { data: sessionData } = await supabaseClient.auth.getSession();
    const token = sessionData?.session?.access_token;

    if (!token) {
      router.push("/");
      return;
    }

    const response = await fetch("/api/admin/specialists", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        await supabaseClient.auth.signOut();
        router.push("/");
        return;
      }
      const errorBody = await response.json().catch(() => null);
      setError(errorBody?.detail || "Unable to load specialist approvals.");
      setLoading(false);
      return;
    }

    const data = await response.json();
    setPendingSpecialists(data.pending || []);
    setStats(data.stats || { total: 0, pending: 0, active: 0 });
    setWarning(data.warning || null);
    setLoading(false);
  };

  useEffect(() => {
    fetchSpecialists();
  }, []);

  const handleAction = async (id: string, action: "approve" | "reject") => {
    setActionLoading(id);
    setError(null);

    const { data: sessionData } = await supabaseClient.auth.getSession();
    const token = sessionData?.session?.access_token;

    if (!token) {
      router.push("/");
      return;
    }

    const response = await fetch("/api/admin/specialists", {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id, action }),
    });

    if (!response.ok) {
      setError("Update failed. Please try again.");
      setActionLoading(null);
      return;
    }

    await fetchSpecialists();
    setActionLoading(null);
  };

  return (
    <AdminShell>
      <div className="flex flex-col gap-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Admin Dashboard
            </p>
            <h1 className="mt-2 text-3xl font-semibold">
              Specialist approvals
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {pendingCountLabel}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={fetchSpecialists}
              disabled={loading}
            >
              Refresh
            </Button>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader>
              <CardDescription>Total specialists</CardDescription>
              <CardTitle>{stats.total}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Pending review</CardDescription>
              <CardTitle>{stats.pending}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Active specialists</CardDescription>
              <CardTitle>{stats.active}</CardTitle>
            </CardHeader>
          </Card>
        </section>

        <Card className="border-primary/15">
          <CardHeader>
            <CardTitle>Pending verification</CardTitle>
            <CardDescription>
              Approve or reject specialist profiles.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {warning ? (
              <p className="mb-3 rounded-xl bg-accent/40 px-3 py-2 text-sm text-accent-foreground">
                {warning}
              </p>
            ) : null}
            {error ? (
              <p className="mb-4 rounded-xl bg-accent/60 px-3 py-2 text-sm text-accent-foreground">
                {error}
              </p>
            ) : null}
            {loading ? (
              <p className="text-sm text-muted-foreground">
                Loading specialists...
              </p>
            ) : pendingSpecialists.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No pending specialists right now.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Specialty</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingSpecialists.map((specialist) => (
                    <TableRow key={specialist.id}>
                      <TableCell>
                        <div className="font-medium">
                          {specialist.full_name || "Unnamed specialist"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {specialist.medical_reg_number || "No reg number"}
                        </div>
                      </TableCell>
                      <TableCell>{specialist.specialty || "-"}</TableCell>
                      <TableCell>{specialist.city || "-"}</TableCell>
                      <TableCell>
                        <Badge variant="pending">Pending</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            onClick={() =>
                              handleAction(specialist.id, "approve")
                            }
                            disabled={actionLoading === specialist.id}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleAction(specialist.id, "reject")
                            }
                            disabled={actionLoading === specialist.id}
                          >
                            Reject
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
