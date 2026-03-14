"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Music } from "lucide-react";

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
          "Account created! Check your email to confirm, then sign in.",
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
        {/* Logo */}
        <div className="flex flex-col items-center mb-8 gap-3">
          <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Music className="size-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Song Tool</h1>
          <p className="text-sm text-muted-foreground">
            Your personal music library
          </p>
        </div>

        {/* Tab toggle */}
        <div className="flex rounded-xl border border-border p-1 mb-6 bg-muted/40">
          <button
            type="button"
            onClick={() => { setMode("signin"); setError(null); setMessage(null); }}
            className={`flex-1 text-sm py-1.5 rounded-lg font-medium transition-all ${
              mode === "signin"
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => { setMode("signup"); setError(null); setMessage(null); }}
            className={`flex-1 text-sm py-1.5 rounded-lg font-medium transition-all ${
              mode === "signup"
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Create account
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              autoFocus
              className="h-10 px-3 rounded-lg border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-sm"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              minLength={6}
              className="h-10 px-3 rounded-lg border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-sm"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          {message && (
            <p className="text-sm text-emerald-600 bg-emerald-500/10 px-3 py-2 rounded-lg">
              {message}
            </p>
          )}

          <Button type="submit" disabled={loading} className="mt-1 h-10">
            {loading
              ? "..."
              : mode === "signin"
                ? "Sign in"
                : "Create account"}
          </Button>
        </form>
      </div>
    </div>
  );
}
