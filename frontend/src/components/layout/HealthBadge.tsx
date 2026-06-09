"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

type Health = { ollama: string; chatModel: string } | null;

export function HealthBadge() {
  const [health, setHealth] = useState<Health>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    const check = async () => {
      try {
        const h = await api.health();
        if (active) {
          setHealth(h);
          setError(false);
        }
      } catch {
        if (active) setError(true);
      }
    };
    check();
    const id = setInterval(check, 15000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  const ok = !error && health?.ollama === "up";

  return (
    <div className="rounded-lg border border-border/60 bg-card/50 p-3">
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "size-2 rounded-full",
            ok ? "bg-emerald-500" : "bg-red-500",
          )}
        />
        <span className="text-xs font-medium">
          {error ? "Backend offline" : ok ? "Model online" : "Model offline"}
        </span>
      </div>
      {health && (
        <p
          className="mt-1 truncate text-xs text-muted-foreground"
          title={health.chatModel}
        >
          {health.chatModel}
        </p>
      )}
    </div>
  );
}
