import { AlertTriangle, Inbox, ListChecks, ShieldAlert } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { TicketStats } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

function StatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span
          className={`flex size-8 items-center justify-center rounded-lg ${accent}`}
        >
          {icon}
        </span>
      </div>
      <div className="mt-2 text-2xl font-semibold tabular-nums">{value}</div>
    </Card>
  );
}

export function StatsCards({
  stats,
  loading,
}: {
  stats: TicketStats | null;
  loading: boolean;
}) {
  if (loading || !stats) {
    return (
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[88px] rounded-xl" />
        ))}
      </div>
    );
  }

  const urgent = (stats.byPriority.urgent ?? 0) + (stats.byPriority.high ?? 0);
  const categories = Object.keys(stats.byCategory).length;

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard
        label="Total tickets"
        value={stats.total}
        icon={<Inbox className="size-4 text-sky-400" />}
        accent="bg-sky-500/15"
      />
      <StatCard
        label="High / urgent"
        value={urgent}
        icon={<AlertTriangle className="size-4 text-orange-400" />}
        accent="bg-orange-500/15"
      />
      <StatCard
        label="Needs review"
        value={stats.needsReview}
        icon={<ShieldAlert className="size-4 text-red-400" />}
        accent="bg-red-500/15"
      />
      <StatCard
        label="Categories"
        value={categories}
        icon={<ListChecks className="size-4 text-violet-400" />}
        accent="bg-violet-500/15"
      />
    </div>
  );
}
