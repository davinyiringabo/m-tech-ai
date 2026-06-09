"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MessagesSquare, SendHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { api, type KbDocument } from "@/lib/api";
import { KnowledgePanel } from "./KnowledgePanel";
import { MessageBubble, type ChatMessage } from "./MessageBubble";

let idCounter = 0;
const nextId = () => `m${++idCounter}`;

export function ChatAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [documents, setDocuments] = useState<KbDocument[]>([]);
  const [docsLoading, setDocsLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadDocs = useCallback(async () => {
    try {
      const { documents } = await api.listDocuments();
      setDocuments(documents);
    } catch {
      console.error("Failed to load documents");
    } finally {
      setDocsLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { documents } = await api.listDocuments();
        if (active) setDocuments(documents);
      } catch {
        // panel will show empty state
      } finally {
        if (active) setDocsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const send = useCallback(
    async (question: string) => {
      const sanitizedQuestion = question.trim();
      if (!sanitizedQuestion || busy) return;

      const userMsg: ChatMessage = {
        id: nextId(),
        role: "user",
        content: sanitizedQuestion,
      };
      const pendingId = nextId();
      setMessages((prev) => [
        ...prev,
        userMsg,
        { id: pendingId, role: "assistant", pending: true },
      ]);
      setInput("");
      setBusy(true);

      try {
        const res = await api.ask(sanitizedQuestion);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === pendingId
              ? {
                  id: pendingId,
                  role: "assistant",
                  content: res.answer,
                  grounded: res.grounded,
                  citations: res.citations,
                  topSimilarity: res.topSimilarity,
                }
              : m,
          ),
        );
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Something went wrong";
        setMessages((prev) =>
          prev.map((m) =>
            m.id === pendingId
              ? {
                  id: pendingId,
                  role: "assistant",
                  content: `Error: ${message}`,
                  grounded: false,
                  citations: [],
                  topSimilarity: 0,
                }
              : m,
          ),
        );
      } finally {
        setBusy(false);
      }
    },
    [busy],
  );

  const empty = messages.length === 0;

  return (
    <div className="flex min-h-0 flex-1">
      <div className="flex min-w-0 flex-1 flex-col">
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-3xl px-6 py-6">
            {empty ? (
              <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-sky-500 text-white shadow-lg shadow-violet-500/20">
                  <MessagesSquare className="size-7" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">
                    Ask the knowledge base
                  </h2>
                  <p className="mt-1 max-w-md text-sm text-muted-foreground">
                    Answers are grounded in your documents with citations. If
                    something isn&apos;t covered, the assistant will say so
                    instead of guessing.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                {messages.map((m) => (
                  <MessageBubble key={m.id} message={m} />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-border/60 bg-background/80 backdrop-blur">
          <div className="mx-auto w-full max-w-3xl px-6 py-4">
            <div className="flex items-end gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question…"
                className="min-h-[44px] max-h-40 resize-none"
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send(input);
                  }
                }}
              />
              <Button
                size="icon"
                className="size-11 shrink-0"
                onClick={() => send(input)}
                disabled={!input.trim() || busy}
              >
                <SendHorizontal className="size-4" />
              </Button>
            </div>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              Grounded answers only
            </p>
          </div>
        </div>
      </div>

      <KnowledgePanel
        documents={documents}
        loading={docsLoading}
        onChanged={loadDocs}
      />
    </div>
  );
}
