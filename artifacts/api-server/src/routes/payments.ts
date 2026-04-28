import { Router } from "express";
import { db, paymentsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

const router = Router();

function serialize(p: any) {
  return {
    ...p,
    amount: Number(p.amount),
    created_at: p.created_at instanceof Date ? p.created_at.toISOString() : p.created_at,
  };
}

router.get("/payments", async (req, res) => {
  try {
    const { client_name, appointment_id } = req.query as any;
    let rows = await db.select().from(paymentsTable).orderBy(desc(paymentsTable.id));
    if (client_name) rows = rows.filter(r => r.client_name?.toLowerCase().includes(String(client_name).toLowerCase()));
    if (appointment_id) rows = rows.filter(r => r.appointment_id === parseInt(appointment_id));
    res.json({ items: rows.map(serialize) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

const paymentSchema = z.object({
  invoice_id: z.number().int().nullable().optional(),
  appointment_id: z.number().int().nullable().optional(),
  client_name: z.string().nullable().optional(),
  amount: z.number().positive(),
  payment_method: z.enum(["cash", "card", "transfer"]),
  notes: z.string().nullable().optional(),
});

router.post("/payments", async (req, res) => {
  try {
    const parsed = paymentSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: "Invalid request" }); return; }
    const inserted = await db.insert(paymentsTable).values({
      invoice_id: parsed.data.invoice_id ?? null,
      appointment_id: parsed.data.appointment_id ?? null,
      client_name: parsed.data.client_name ?? null,
      amount: String(parsed.data.amount),
      payment_method: parsed.data.payment_method,
      notes: parsed.data.notes ?? null,
    }).returning();
    res.status(201).json(serialize(inserted[0]));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/payments/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(paymentsTable).where(eq(paymentsTable.id, id));
    res.status(204).send();
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
