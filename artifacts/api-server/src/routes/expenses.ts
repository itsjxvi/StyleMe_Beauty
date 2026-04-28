import { Router } from "express";
import { db, expensesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { z } from "zod";

const router = Router();

function toExpense(e: any) {
  return {
    ...e,
    amount: Number(e.amount),
    category: e.expense_type,
    expense_date: e.date,
    created_at: e.created_at instanceof Date ? e.created_at.toISOString() : e.created_at,
  };
}

router.get("/expenses", async (req, res) => {
  try {
    let rows = await db.select().from(expensesTable).orderBy(expensesTable.id);
    const { search } = req.query as any;
    if (search) rows = rows.filter(r => r.description.toLowerCase().includes(search.toLowerCase()));
    res.json({ items: rows.map(toExpense), total: rows.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

const expenseSchema = z.object({
  description: z.string().min(1),
  amount: z.union([z.number(), z.string()]).transform(v => Number(v)),
  expense_type: z.enum(["salary", "rent", "supplies", "other"]).optional(),
  category: z.string().optional(),
  date: z.string().optional(),
  expense_date: z.string().optional(),
  notes: z.string().optional().nullable(),
});

function normalizeExpenseData(data: any) {
  const expenseType = data.expense_type || mapCategory(data.category) || "other";
  const date = data.date || data.expense_date || new Date().toISOString().split("T")[0];
  return { description: data.description, amount: String(data.amount), expense_type: expenseType, date, notes: data.notes ?? null };
}

function mapCategory(cat?: string): string {
  const map: Record<string, string> = { supplies: "supplies", salary: "salary", rent: "rent" };
  return map[cat ?? ""] || "other";
}

router.post("/expenses", async (req, res) => {
  try {
    const parsed = expenseSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: "Invalid request", details: parsed.error }); return; }
    const inserted = await db.insert(expensesTable).values(normalizeExpenseData(parsed.data)).returning();
    res.status(201).json(toExpense(inserted[0]));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/expenses/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const parsed = expenseSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: "Invalid request" }); return; }
    const updated = await db.update(expensesTable).set(normalizeExpenseData(parsed.data)).where(eq(expensesTable.id, id)).returning();
    if (!updated[0]) { res.status(404).json({ error: "Not found" }); return; }
    res.json(toExpense(updated[0]));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/expenses/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(expensesTable).where(eq(expensesTable.id, id));
    res.status(204).send();
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
