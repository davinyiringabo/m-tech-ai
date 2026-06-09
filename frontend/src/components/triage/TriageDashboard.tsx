"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RotateCw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { api, type Ticket, type TicketStats, type TriageMeta } from "@/lib/api";
import { titleCase } from "@/lib/triage-ui";
import { IntakeForm } from "./IntakeForm";
import { StatsCards } from "./StatsCards";
import { TicketDetail } from "./TicketDetail";
import { TicketsTable } from "./TicketsTable";

export function TriageDashboard() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [meta, setMeta] = useState<TriageMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Ticket | null>(null);

  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    api
      .meta()
      .then(setMeta)
      .catch(() => setMeta({ categories: [], priorities: [] }));
  }, []);

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setDebouncedSearch(search), 300);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [search]);

  const loadTickets = useCallback(async () => {
    try {
      setLoadError(null);
      const { tickets } = await api.listTickets({
        category: category || undefined,
        priority: priority || undefined,
        search: debouncedSearch || undefined,
      });
      setTickets(tickets);
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : "Failed to load tickets",
      );
    } finally {
      setLoading(false);
    }
  }, [category, priority, debouncedSearch]);

  const loadStats = useCallback(async () => {
    try {
      setStats(await api.stats());
    } catch {
      // stats are non-critical
    }
  }, []);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const refresh = useCallback(() => {
    loadTickets();
    loadStats();
  }, [loadTickets, loadStats]);

  const onCreated = useCallback(
    (ticket: Ticket) => {
      setTickets((prev) => [ticket, ...prev]);
      setSelected(ticket);
      loadStats();
    },
    [loadStats],
  );

  const hasFilters = useMemo(
    () => Boolean(category || priority || search),
    [category, priority, search],
  );

  return (
    <div className="flex flex-col gap-5">
      <StatsCards stats={stats} loading={loading && !stats} />

      <IntakeForm onCreated={onCreated} />

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-border/60 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-wrap items-center gap-2">
            <div className="relative w-full sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tickets…"
                className="pl-9"
              />
            </div>
            <div className="w-36">
              <Select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">All categories</option>
                {meta?.categories.map((c) => (
                  <option key={c} value={c}>
                    {titleCase(c)}
                  </option>
                ))}
              </Select>
            </div>
            <div className="w-32">
              <Select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="">All priorities</option>
                {meta?.priorities.map((p) => (
                  <option key={p} value={p} className="capitalize">
                    {titleCase(p)}
                  </option>
                ))}
              </Select>
            </div>
            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setCategory("");
                  setPriority("");
                  setSearch("");
                }}
              >
                Clear
              </Button>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={refresh}>
            <RotateCw className="size-4" /> Refresh
          </Button>
        </div>

        {loadError ? (
          <div className="flex flex-col items-center gap-1 py-16 text-center">
            <p className="text-sm font-medium text-red-400">{loadError}</p>
            <p className="text-sm text-muted-foreground">
              Is the backend running on the API URL?
            </p>
          </div>
        ) : (
          <TicketsTable
            tickets={tickets}
            loading={loading}
            onSelect={setSelected}
            selectedId={selected?.id}
          />
        )}
      </Card>

      <TicketDetail ticket={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
