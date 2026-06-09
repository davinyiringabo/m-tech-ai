"use client";

import { useState } from "react";
import { ChevronDown, FileText, Info, Sparkles, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Citation } from "@/lib/api";
import { cn } from "@/lib/utils";

export type ChatMessage =
  | { id: string; role: "user"; content: string }
  | {
      id: string;
      role: "assistant";
      content: string;
      grounded: boolean;
      citations: Citation[];
      topSimilarity: number;
      pending?: false;
    }
  | { id: string; role: "assistant"; pending: true };

function Sources({ citations }: { citations: Citation[] }) {
  const [open, setOpen] = useState(false);
  if (citations.length === 0) return null;

  return (
    <div className="mt-3 border-t border-border/60 pt-3">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <FileText className="size-3.5" />
        {citations.length} source{citations.length > 1 ? "s" : ""}
        <ChevronDown
          className={cn("size-3.5 transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <ul className="mt-2 flex flex-col gap-2">
          {citations.map((c) => (
            <li
              key={`${c.documentId}-${c.chunkIndex}`}
              className="rounded-lg border border-border/60 bg-background/60 p-2.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-xs font-medium">
                  <span className="flex size-4 items-center justify-center rounded bg-primary/15 text-[10px] text-primary">
                    {c.index}
                  </span>
                  {c.documentTitle}
                </span>
                <Badge variant="muted" className="shrink-0 text-[10px]">
                  {Math.round(c.similarity * 100)}% match
                </Badge>
              </div>
              <p className="mt-1.5 line-clamp-3 text-xs text-muted-foreground">
                {c.snippet}…
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex gap-3", isUser && "flex-row-reverse")}>
      <div
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-lg",
          isUser
            ? "bg-secondary text-secondary-foreground"
            : "bg-gradient-to-br from-violet-500 to-sky-500 text-white",
        )}
      >
        {isUser ? <User className="size-4" /> : <Sparkles className="size-4" />}
      </div>

      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
          isUser
            ? "bg-secondary text-secondary-foreground"
            : "border border-border/60 bg-card",
        )}
      >
        {message.role === "assistant" && message.pending ? (
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="size-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.3s]" />
            <span className="size-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.15s]" />
            <span className="size-1.5 animate-bounce rounded-full bg-current" />
          </span>
        ) : message.role === "assistant" && !message.grounded ? (
          <div className="flex items-start gap-2 text-muted-foreground">
            <Info className="mt-0.5 size-4 shrink-0 text-amber-400" />
            <span>{message.content}</span>
          </div>
        ) : (
          <>
            <p className="whitespace-pre-wrap">{message.content}</p>
            {message.role === "assistant" && (
              <Sources citations={message.citations} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
