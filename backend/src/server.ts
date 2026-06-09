import cors from "cors";
import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import { config } from "./config.js";
import { isOllamaReachable } from "./llm/ollama.js";
import { ragRouter } from "./rag/routes.js";
import { triageRouter } from "./triage/routes.js";

const app = express();

app.use(cors({ origin: config.corsOrigin }));
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", async (_req, res) => {
  const ollamaUp = await isOllamaReachable();
  res.json({
    status: "ok",
    ollama: ollamaUp ? "up" : "down",
    chatModel: config.ollama.chatModel,
    embedModel: config.ollama.embedModel,
  });
});

app.use("/api", triageRouter);
app.use("/api", ragRouter);

// Centralized error handler — never leak stack traces to clients.
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const message = err instanceof Error ? err.message : "Internal server error";
  console.error("[error]", err);
  res.status(500).json({ error: message });
});

app.listen(config.port, () => {
  console.log(`Backend listening on http://localhost:${config.port}`);
  console.log(
    `Ollama host: ${config.ollama.host} (chat: ${config.ollama.chatModel}, embed: ${config.ollama.embedModel})`,
  );
});
