import { Router } from "express";
import { db, invoicesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { z } from "zod";

const router = Router();

function toInvoice(i: any) {
  return {
    ...i,
    total: Number(i.total),
    subtotal: Number(i.total),
    tax: 0,
    discount: 0,
    invoice_number: `INV-${String(i.id).padStart(4, "0")}`,
    created_at: i.created_at instanceof Date ? i.created_at.toISOString() : i.created_at,
  };
}

function mapStatus(s: string): "pending" | "paid" | "cancelled" {
  if (s === "issued" || s === "draft") return "pending";
  if (s === "paid") return "paid";
  if (s === "cancelled") return "cancelled";
  return "pending";
}

router.get("/invoices", async (req, res) => {
  try {
    let rows = await db.select().from(invoicesTable).orderBy(invoicesTable.id);
    const { search } = req.query as any;
    if (search) rows = rows.filter(r => (r.client_name || "").toLowerCase().includes(search.toLowerCase()));
    res.json({ items: rows.map(toInvoice), total: rows.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

const invoiceSchema = z.object({
  appointment_id: z.number().int().optional().nullable(),
  client_name: z.string().optional().nullable(),
  total: z.union([z.number(), z.string()]).transform(v => Number(v)).optional(),
  subtotal: z.union([z.number(), z.string()]).transform(v => Number(v)).optional(),
  tax: z.union([z.number(), z.string()]).transform(v => Number(v)).optional(),
  discount: z.union([z.number(), z.string()]).transform(v => Number(v)).optional(),
  status: z.string().optional(),
  notes: z.string().optional().nullable(),
});

router.post("/invoices", async (req, res) => {
  try {
    const parsed = invoiceSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: "Invalid request", details: parsed.error }); return; }
    const d = parsed.data;
    const total = d.total ?? d.subtotal ?? 0;
    const inserted = await db.insert(invoicesTable).values({
      appointment_id: d.appointment_id ?? null,
      client_name: d.client_name ?? "Cliente",
      total: String(total),
      status: mapStatus(d.status || "draft"),
      notes: d.notes ?? null,
    }).returning();
    res.status(201).json(toInvoice(inserted[0]));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/invoices/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const parsed = invoiceSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: "Invalid request" }); return; }
    const d = parsed.data;
    const total = d.total ?? d.subtotal ?? undefined;
    const upd: any = {};
    if (d.appointment_id !== undefined) upd.appointment_id = d.appointment_id;
    if (d.client_name !== undefined) upd.client_name = d.client_name;
    if (total !== undefined) upd.total = String(total);
    if (d.status) upd.status = mapStatus(d.status);
    if (d.notes !== undefined) upd.notes = d.notes;
    const updated = await db.update(invoicesTable).set(upd).where(eq(invoicesTable.id, id)).returning();
    if (!updated[0]) { res.status(404).json({ error: "Not found" }); return; }
    res.json(toInvoice(updated[0]));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/invoices/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(invoicesTable).where(eq(invoicesTable.id, id));
    res.status(204).send();
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
