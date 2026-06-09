"use client";

import { Inbox } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { Ticket } from "@/lib/api";
import {
  categoryClass,
  formatRelativeTime,
  priorityClass,
  titleCase,
} from "@/lib/triage-ui";
import { cn } from "@/lib/utils";

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color =
    pct >= 70 ? "bg-emerald-500" : pct >= 40 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-14 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full", color)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs tabular-nums text-muted-foreground">{pct}%</span>
    </div>
  );
}

export function TicketsTable({
  tickets,
  loading,
  onSelect,
  selectedId,
}: {
  tickets: Ticket[];
  loading: boolean;
  onSelect: (t: Ticket) => void;
  selectedId?: string;
}) {
  if (loading) {
    return (
      <div className="flex flex-col gap-2 p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 rounded-lg" />
        ))}
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted">
          <Inbox className="size-6 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium">No tickets yet</p>
        <p className="max-w-xs text-sm text-muted-foreground">
          Paste a message above to triage it, or adjust your filters.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <th className="px-4 py-3 font-medium">Priority</th>
            <th className="px-4 py-3 font-medium">Category</th>
            <th className="px-4 py-3 font-medium">Summary</th>
            <th className="hidden px-4 py-3 font-medium md:table-cell">
              Customer
            </th>
            <th className="hidden px-4 py-3 font-medium lg:table-cell">
              Confidence
            </th>
            <th className="px-4 py-3 font-medium">Created</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((t) => (
            <tr
              key={t.id}
              onClick={() => onSelect(t)}
              className={cn(
                "cursor-pointer border-b border-border/40 transition-colors hover:bg-muted/40",
                selectedId === t.id && "bg-muted/60",
              )}
            >
              <td className="px-4 py-3">
                <Badge
                  variant="outline"
                  className={cn("capitalize", priorityClass(t.priority))}
                >
                  {t.priority}
                </Badge>
              </td>
              <td className="px-4 py-3">
                <Badge variant="outline" className={categoryClass(t.category)}>
                  {titleCase(t.category)}
                </Badge>
              </td>
              <td className="max-w-[320px] px-4 py-3">
                <div className="flex items-center gap-2">
                  {t.status === "fallback" && (
                    <span
                      title="Recovered from invalid model output — needs review"
                      className="size-2 shrink-0 rounded-full bg-red-500"
                    />
                  )}
                  <span className="truncate text-foreground">{t.summary}</span>
                </div>
              </td>
              <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                {t.customer_name ?? "—"}
              </td>
              <td className="hidden px-4 py-3 lg:table-cell">
                <ConfidenceBar value={t.confidence} />
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                {formatRelativeTime(t.created_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
