export function titleCase(value: string): string {
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// Tailwind classes for priority pills. Tuned to read well on the dark theme.
export const PRIORITY_STYLES: Record<string, string> = {
  urgent: "bg-red-500/15 text-red-400 border-red-500/30",
  high: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  medium: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  low: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
};

export const PRIORITY_DOT: Record<string, string> = {
  urgent: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-amber-500",
  low: "bg-emerald-500",
};

export const CATEGORY_STYLES: Record<string, string> = {
  billing: "bg-violet-500/15 text-violet-400 border-violet-500/30",
  technical: "bg-sky-500/15 text-sky-400 border-sky-500/30",
  account: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
  feature_request: "bg-fuchsia-500/15 text-fuchsia-400 border-fuchsia-500/30",
  complaint: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  other: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
};

export const SENTIMENT_STYLES: Record<string, string> = {
  positive: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  neutral: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
  negative: "bg-rose-500/15 text-rose-400 border-rose-500/30",
};

export function priorityClass(p: string): string {
  return PRIORITY_STYLES[p] ?? PRIORITY_STYLES.low;
}
export function categoryClass(c: string): string {
  return CATEGORY_STYLES[c] ?? CATEGORY_STYLES.other;
}
export function sentimentClass(s: string): string {
  return SENTIMENT_STYLES[s] ?? SENTIMENT_STYLES.neutral;
}

export function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}
