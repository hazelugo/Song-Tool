"use client";

interface PageErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
  context?: string;
}

export function PageError({ error, reset, context }: PageErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 text-center px-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-destructive">
        {context ?? "Error"}
      </p>
      <p className="text-sm text-muted-foreground max-w-sm">
        {error.message || "Something went wrong. Try again or reload the page."}
      </p>
      {error.digest && (
        <p className="text-[10px] font-mono text-muted-foreground/50">
          {error.digest}
        </p>
      )}
      <button
        onClick={reset}
        className="mt-2 h-7 px-4 text-xs rounded-sm border border-border bg-card hover:bg-muted transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
