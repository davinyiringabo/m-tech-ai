"use client";

import { useRef, useState } from "react";
import {
  BookOpen,
  Check,
  FileText,
  Loader2,
  Plus,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { api, type KbDocument } from "@/lib/api";
import { cn } from "@/lib/utils";

const ACCEPT = ".txt,.md,.markdown,text/plain,text/markdown";

function isTextFile(file: File): boolean {
  return (
    /\.(txt|md|markdown)$/i.test(file.name) || file.type.startsWith("text/")
  );
}

// To get the title from filename
function titleFromFilename(name: string): string {
  return name
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

type UploadStatus = {
  name: string;
  status: "uploading" | "done" | "error";
  error?: string;
};

export function KnowledgePanel({
  documents,
  loading,
  onChanged,
}: {
  documents: KbDocument[];
  loading: boolean;
  onChanged: () => void;
}) {
  const [adding, setAdding] = useState(false);
  const [mode, setMode] = useState<"upload" | "paste">("upload");

  // Paste mode
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Upload mode
  const [dragOver, setDragOver] = useState(false);
  const [uploads, setUploads] = useState<UploadStatus[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function submitPaste() {
    if (!title.trim() || !content.trim() || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.addDocument({ title: title.trim(), content: content.trim() });
      setTitle("");
      setContent("");
      setAdding(false);
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add document");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);

    setUploads(files.map((f) => ({ name: f.name, status: "uploading" })));
    let anySucceeded = false;

    for (const file of files) {
      try {
        if (!isTextFile(file)) {
          throw new Error("Unsupported file type (use .txt or .md)");
        }
        const text = await file.text();
        if (!text.trim()) throw new Error("File is empty");
        await api.addDocument({
          title: titleFromFilename(file.name),
          source: file.name,
          content: text,
        });
        anySucceeded = true;
        setUploads((prev) =>
          prev.map((u) =>
            u.name === file.name ? { ...u, status: "done" } : u,
          ),
        );
      } catch (err) {
        setUploads((prev) =>
          prev.map((u) =>
            u.name === file.name
              ? {
                  ...u,
                  status: "error",
                  error: err instanceof Error ? err.message : "Failed",
                }
              : u,
          ),
        );
      }
    }

    if (anySucceeded) onChanged();
  }

  return (
    <aside className="hidden w-80 shrink-0 flex-col border-l border-border/60 bg-sidebar/30 lg:flex">
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-4">
        <div className="flex items-center gap-2">
          <BookOpen className="size-4 text-violet-400" />
          <span className="text-sm font-semibold">Knowledge base</span>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setAdding((v) => !v)}
        >
          {adding ? <X className="size-4" /> : <Plus className="size-4" />}
        </Button>
      </div>

      {adding && (
        <div className="flex flex-col gap-3 border-b border-border/60 p-4">
          <div className="flex rounded-lg border border-border/60 p-0.5">
            <button
              onClick={() => setMode("upload")}
              className={cn(
                "flex-1 rounded-md px-2 py-1 text-xs font-medium transition-colors",
                mode === "upload"
                  ? "bg-secondary text-secondary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Upload file
            </button>
            <button
              onClick={() => setMode("paste")}
              className={cn(
                "flex-1 rounded-md px-2 py-1 text-xs font-medium transition-colors",
                mode === "paste"
                  ? "bg-secondary text-secondary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Paste text
            </button>
          </div>

          {mode === "upload" ? (
            <div className="flex flex-col gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPT}
                multiple
                className="hidden"
                onChange={(e) => {
                  handleFiles(e.target.files);
                  e.target.value = "";
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  handleFiles(e.dataTransfer.files);
                }}
                className={cn(
                  "flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-8 text-center transition-colors",
                  dragOver
                    ? "border-violet-400 bg-violet-500/10"
                    : "border-border hover:border-border/80 hover:bg-muted/30",
                )}
              >
                <Upload className="size-5 text-muted-foreground" />
                <span className="text-sm font-medium">
                  Drop files or click to browse
                </span>
                <span className="text-xs text-muted-foreground">
                  .txt or .md — multiple allowed
                </span>
              </button>

              {uploads.length > 0 && (
                <ul className="flex flex-col gap-1">
                  {uploads.map((u) => (
                    <li
                      key={u.name}
                      className="flex items-center gap-2 rounded-md border border-border/60 bg-background/60 px-2.5 py-1.5 text-xs"
                    >
                      {u.status === "uploading" ? (
                        <Loader2 className="size-3.5 shrink-0 animate-spin text-muted-foreground" />
                      ) : u.status === "done" ? (
                        <Check className="size-3.5 shrink-0 text-emerald-400" />
                      ) : (
                        <X className="size-3.5 shrink-0 text-red-400" />
                      )}
                      <span className="min-w-0 flex-1 truncate">{u.name}</span>
                      {u.status === "error" && (
                        <span className="shrink-0 text-red-400" title={u.error}>
                          failed
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Input
                placeholder="Document title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <Textarea
                placeholder="Paste document content…"
                className="min-h-[140px]"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
              {error && <p className="text-xs text-red-400">{error}</p>}
              <Button
                size="sm"
                onClick={submitPaste}
                disabled={!title.trim() || !content.trim() || submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Embedding…
                  </>
                ) : (
                  "Add to knowledge base"
                )}
              </Button>
            </div>
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-3">
        {loading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-lg" />
            ))}
          </div>
        ) : documents.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
            <FileText className="size-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No documents yet. Add one, or run the ingest script to load the
              sample knowledge base.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {documents.map((doc) => (
              <li
                key={doc.id}
                className="rounded-lg border border-border/60 bg-card/50 p-3 transition-colors hover:bg-card"
              >
                <div className="flex items-start gap-2">
                  <FileText className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{doc.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {doc.chunks} chunks
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
