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
import { cn } from "@/lib/utils";

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

type Tab = "pending" | "approved" | "all";

const TABS: { id: Tab; label: string }[] = [
  { id: "pending", label: "Pending" },
  { id: "approved", label: "Approved" },
  { id: "all", label: "All" },
];

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function SpecialistsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("pending");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  const [allSpecialists, setAllSpecialists] = useState<SpecialistRow[]>([]);
  const [pendingSpecialists, setPendingSpecialists] = useState<SpecialistRow[]>([]);
  const [approvedSpecialists, setApprovedSpecialists] = useState<SpecialistRow[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, active: 0 });

  const tabRows: Record<Tab, SpecialistRow[]> = useMemo(
    () => ({
      pending: pendingSpecialists,
      approved: approvedSpecialists,
      all: allSpecialists,
    }),
    [allSpecialists, pendingSpecialists, approvedSpecialists],
  );

  const counts: Record<Tab, number> = useMemo(
    () => ({
      pending: pendingSpecialists.length,
      approved: approvedSpecialists.length,
      all: allSpecialists.length,
    }),
    [allSpecialists, pendingSpecialists, approvedSpecialists],
  );

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
      headers: { Authorization: `Bearer ${token}` },
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
    setAllSpecialists(data.all || []);
    setPendingSpecialists(data.pending || []);
    setApprovedSpecialists(data.approved || []);
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

  const rows = tabRows[activeTab];

  return (
    <AdminShell>
      <div className="flex flex-col gap-6">
        {/* ── Header ── */}
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Admin Dashboard
            </p>
            <h1 className="mt-2 text-3xl font-semibold">Specialists</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage and verify specialist profiles
            </p>
          </div>
          <Button variant="outline" onClick={fetchSpecialists} disabled={loading}>
            Refresh
          </Button>
        </header>

        {/* ── Stat cards ── */}
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

        {/* ── Tabs + table ── */}
        <Card className="border-primary/15">
          {/* Tab bar */}
          <div className="flex items-center gap-1 border-b border-primary/10 px-5 pt-4">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "relative flex items-center gap-2 rounded-t-lg px-4 py-2.5 text-sm font-medium transition-colors",
                  activeTab === tab.id
                    ? "text-primary after:absolute after:bottom-[-1px] after:left-0 after:right-0 after:h-[2px] after:rounded-full after:bg-primary after:content-['']"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {tab.label}
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-semibold",
                    activeTab === tab.id
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {counts[tab.id]}
                </span>
              </button>
            ))}
          </div>

          <CardHeader className="pb-2">
            <CardTitle>
              {activeTab === "pending" && "Pending verification"}
              {activeTab === "approved" && "Approved specialists"}
              {activeTab === "all" && "All specialists"}
            </CardTitle>
            <CardDescription>
              {activeTab === "pending" && "Approve or reject specialist profiles."}
              {activeTab === "approved" && "Specialists who have been verified and are active."}
              {activeTab === "all" && "Every specialist registered on the platform."}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {warning && (
              <p className="mb-3 rounded-xl bg-accent/40 px-3 py-2 text-sm text-accent-foreground">
                {warning}
              </p>
            )}
            {error && (
              <p className="mb-4 rounded-xl bg-accent/60 px-3 py-2 text-sm text-accent-foreground">
                {error}
              </p>
            )}

            {loading ? (
              <p className="py-4 text-sm text-muted-foreground">Loading specialists…</p>
            ) : rows.length === 0 ? (
              <p className="py-4 text-sm text-muted-foreground">
                {activeTab === "pending" && "No pending specialists right now."}
                {activeTab === "approved" && "No approved specialists yet."}
                {activeTab === "all" && "No specialists found."}
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Specialty</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Status</TableHead>
                    {activeTab === "pending" && (
                      <TableHead className="text-right">Action</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((specialist) => {
                    const isActive =
                      specialist.status === "ACTIVE" && specialist.is_verified === 1;
                    const isPending =
                      specialist.status === "PENDING" || specialist.is_verified === 0;

                    return (
                      <TableRow key={specialist.id}>
                        <TableCell>
                          <div className="font-medium">
                            {specialist.full_name || "Unnamed specialist"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {specialist.medical_reg_number || "No reg number"}
                          </div>
                        </TableCell>
                        <TableCell>{specialist.specialty || "—"}</TableCell>
                        <TableCell>{specialist.city || "—"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(specialist.created_at)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              isActive ? "active" : isPending ? "pending" : "inactive"
                            }
                          >
                            {isActive ? "Active" : isPending ? "Pending" : "Inactive"}
                          </Badge>
                        </TableCell>
                        {activeTab === "pending" && (
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleAction(specialist.id, "approve")}
                                disabled={actionLoading === specialist.id}
                              >
                                Approve
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleAction(specialist.id, "reject")}
                                disabled={actionLoading === specialist.id}
                              >
                                Reject
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
