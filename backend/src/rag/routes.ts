import { Router } from "express";
import { z } from "zod";
import { answerQuestion, ingestDocument, listDocuments } from "./service.js";

export const ragRouter = Router();

const ingestBody = z.object({
  title: z.string().min(1),
  source: z.string().optional(),
  content: z.string().min(1),
});

// POST /api/documents — add a document to the knowledge base
ragRouter.post("/documents", async (req, res, next) => {
  try {
    const parsed = ingestBody.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid body" });
    }
    const result = await ingestDocument(parsed.data);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

// GET /api/documents — list the knowledge base
ragRouter.get("/documents", async (_req, res, next) => {
  try {
    res.json({ documents: await listDocuments() });
  } catch (err) {
    next(err);
  }
});

const askBody = z.object({
  question: z.string().min(1).max(2_000),
});

// POST /api/ask — grounded question answering with citations
ragRouter.post("/ask", async (req, res, next) => {
  try {
    const parsed = askBody.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid body" });
    }
    const result = await answerQuestion(parsed.data.question);
    res.json(result);
  } catch (err) {
    next(err);
  }
});
