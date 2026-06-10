"use client";

import { useEffect, useState } from "react";
import { Check, Copy, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Ticket } from "@/lib/api";
import {
  categoryClass,
  priorityClass,
  sentimentClass,
  titleCase,
} from "@/lib/triage-ui";
import { cn } from "@/lib/utils";

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="text-sm">{value && value.trim() ? value : "N/A"}</span>
    </div>
  );
}

export function TicketDetail({
  ticket,
  onClose,
}: {
  ticket: Ticket | null;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  useEffect(() => setCopied(false), [ticket?.id]);

  if (!ticket) return null;

  const copyReply = async () => {
    await navigator.clipboard.writeText(ticket.suggested_reply);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative flex h-full w-full max-w-lg flex-col border-l border-border/60 bg-card shadow-2xl animate-in slide-in-from-right">
        <div className="flex items-start justify-between border-b border-border/60 p-5">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className={cn("capitalize", priorityClass(ticket.priority))}
              >
                {ticket.priority}
              </Badge>
              <Badge
                variant="outline"
                className={categoryClass(ticket.category)}
              >
                {titleCase(ticket.category)}
              </Badge>
              <Badge
                variant="outline"
                className={sentimentClass(ticket.sentiment)}
              >
                {titleCase(ticket.sentiment)}
              </Badge>
            </div>
            <h2 className="text-base font-semibold leading-snug">
              {ticket.summary}
            </h2>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>

        <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-5">
          {ticket.status === "fallback" && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
              The model returned invalid output for this item. These values are
              safe defaults — please review manually.
            </div>
          )}

          <section>
            <h3 className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
              Original message
            </h3>
            <p className="whitespace-pre-wrap rounded-lg border border-border/60 bg-muted/30 p-3 text-sm">
              {ticket.raw_text}
            </p>
          </section>

          <section className="grid grid-cols-2 gap-4">
            <Field label="Customer" value={ticket.customer_name} />
            <Field label="Product" value={ticket.product} />
            <Field label="Order ID" value={ticket.order_id} />
            <Field
              label="Confidence"
              value={`${Math.round(ticket.confidence * 100)}%`}
            />
          </section>

          <section>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-xs uppercase tracking-wide text-muted-foreground">
                Suggested reply
              </h3>
              <Button variant="ghost" size="xs" onClick={copyReply}>
                {copied ? (
                  <Check className="size-3.5" />
                ) : (
                  <Copy className="size-3.5" />
                )}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
            <p className="whitespace-pre-wrap rounded-lg border border-border/60 bg-muted/30 p-3 text-sm leading-relaxed">
              {ticket.suggested_reply}
            </p>
          </section>
        </div>

        <div className="border-t border-border/60 px-5 py-3 text-xs text-muted-foreground">
          Triaged by{" "}
          <span className="font-medium text-foreground">{ticket.model}</span>
        </div>
      </div>
    </div>
  );
}
