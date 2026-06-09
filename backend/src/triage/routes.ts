import { Router } from "express";
import { z } from "zod";
import { CATEGORIES, PRIORITIES } from "./schema.js";
import { getTicketStats, listTickets, triageText } from "./service.js";

export const triageRouter = Router();

const triageBody = z.object({
  text: z.string().min(1, "text is required").max(10_000),
});

// POST /api/triage  — classify + extract + draft a reply for one message
triageRouter.post("/triage", async (req, res, next) => {
  try {
    const parsed = triageBody.safeParse(req.body);
    console.log(parsed);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ error: parsed.error.issues[0]?.message ?? "Invalid body" });
    }
    const record = await triageText(parsed.data.text);
    res.status(201).json(record);
  } catch (err) {
    next(err);
  }
});

// GET /api/tickets?category=&priority=&search=
triageRouter.get("/tickets", async (req, res, next) => {
  try {
    const category =
      typeof req.query.category === "string" ? req.query.category : undefined;
    const priority =
      typeof req.query.priority === "string" ? req.query.priority : undefined;
    const search =
      typeof req.query.search === "string" ? req.query.search : undefined;
    const tickets = await listTickets({ category, priority, search });
    res.json({ tickets });
  } catch (err) {
    next(err);
  }
});

// GET /api/tickets/stats — counts for dashboard cards
triageRouter.get("/tickets/stats", async (_req, res, next) => {
  try {
    res.json(await getTicketStats());
  } catch (err) {
    next(err);
  }
});

// GET /api/triage/meta — enum options for the UI filters
triageRouter.get("/triage/meta", (_req, res) => {
  res.json({ categories: CATEGORIES, priorities: PRIORITIES });
});
