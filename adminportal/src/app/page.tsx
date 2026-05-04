"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabaseClient } from "@/lib/supabaseClient";

export default function Home() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const { error: authError } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    const { data: sessionData } = await supabaseClient.auth.getSession();
    const accessToken = sessionData?.session?.access_token;

    if (!accessToken) {
      setError("Session not found. Please sign in again.");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-16">
      <div className="w-full max-w-4xl">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-primary/10 bg-white/70 p-8 shadow-sm backdrop-blur">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              NeuroChain Admin
            </p>
            <h1 className="mt-4 text-3xl font-semibold text-foreground">
              Review specialists and keep the platform trusted.
            </h1>
            <p className="mt-3 text-base text-muted-foreground">
              Approve new specialist profiles, monitor verification status, and
              handle admin tasks in one place.
            </p>
            <div className="mt-8 rounded-2xl bg-primary/10 p-5 text-sm text-foreground">
              Only verified admin accounts can access approvals. If you need
              access, contact the platform owner.
            </div>
          </div>

          <Card className="border-primary/15 shadow-lg">
            <CardHeader>
              <CardTitle>Admin sign in</CardTitle>
              <CardDescription className="text-sm text-foreground/70">
                Use your approved admin credentials.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <Input
                  type="email"
                  placeholder="admin@neurochain.app"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
                {error ? (
                  <p className="rounded-xl bg-accent/50 px-3 py-2 text-sm text-accent-foreground">
                    {error}
                  </p>
                ) : null}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Signing in..." : "Sign in"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
