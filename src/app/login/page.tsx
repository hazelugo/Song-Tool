"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Mode = "signin" | "signup";

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          setError(error.message);
          return;
        }
        router.push("/songs");
        router.refresh();
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) {
          setError(error.message);
          return;
        }
        setMessage(
          "Account created. Check your email to confirm, then sign in.",
        );
        setMode("signin");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="mb-8 border-b border-border/60 pb-4">
          <span className="text-[10px] font-mono font-semibold uppercase tracking-[0.3em] text-muted-foreground border border-border/60 rounded-sm px-3 py-1">
            Repertoire v1.0
          </span>
          <h1 className="text-6xl font-bold tracking-tight leading-none mb-3">
            Repertoire
          </h1>
          <p className="text-xl text-muted-foreground tracking-wide">
            Built for flow.
          </p>
        </div>

        {/* Tab toggle — underline style */}
        <div className="flex border-b border-border mb-6">
          {(["signin", "signup"] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMode(m);
                setError(null);
                setMessage(null);
              }}
              className={cn(
                "flex-1 text-xs font-medium uppercase tracking-wider py-2 border-b-2 -mb-px transition-colors duration-100",
                mode === m
                  ? "border-b-[color:var(--color-chart-4)] text-foreground"
                  : "border-b-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {m === "signin" ? "Sign in" : "Create account"}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="email"
              className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium"
            >
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              autoFocus
              className="h-8 rounded-sm text-sm"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="password"
              className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium"
            >
              Password
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete={
                mode === "signin" ? "current-password" : "new-password"
              }
              minLength={6}
              className="h-8 rounded-sm text-sm"
            />
          </div>

          {error && (
            <p className="text-xs text-destructive border border-destructive/30 bg-destructive/8 px-3 py-2 rounded-sm font-mono">
              {error}
            </p>
          )}

          {message && (
            <p className="text-xs text-muted-foreground border border-border bg-muted/30 px-3 py-2 rounded-sm font-mono">
              {message}
            </p>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="mt-1 h-8 rounded-sm w-full text-xs"
          >
            {loading ? "..." : mode === "signin" ? "Sign in" : "Create account"}
          </Button>
        </form>
      </div>
    </div>
  );
}
