"use client";

import { useState } from "react";
import { Loader2, Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { api, type Ticket } from "@/lib/api";

export function IntakeForm({
  onCreated,
}: {
  onCreated: (ticket: Ticket) => void;
}) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!text.trim() || loading) return;
    setLoading(true);
    setError(null);
    try {
      const ticket = await api.triage(text.trim());
      onCreated(ticket);
      setText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to triage");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">New intake</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className={"resize-none"}
          placeholder="Paste an inbound support ticket or customer message..."
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") submit();
          }}
        />

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex items-center justify-end">
          <Button onClick={submit} disabled={!text.trim() || loading}>
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Creating…
              </>
            ) : (
              <>
                <Sparkles className="size-4" /> Create
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
