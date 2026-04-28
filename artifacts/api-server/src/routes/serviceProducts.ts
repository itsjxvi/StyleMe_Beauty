import { Router } from "express";
import { db, serviceProductsTable, productsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { z } from "zod";

const router = Router();

router.get("/service-products", async (req, res) => {
  try {
    const { service_id } = req.query as any;
    let rows = await db.select().from(serviceProductsTable);
    if (service_id) rows = rows.filter(r => r.service_id === parseInt(service_id));
    const products = await db.select().from(productsTable);
    const pMap = Object.fromEntries(products.map(p => [p.id, p.name]));
    const items = rows.map(r => ({ ...r, product_name: pMap[r.product_id] ?? null }));
    res.json({ items });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

const createSchema = z.object({
  service_id: z.number().int(),
  product_id: z.number().int(),
  quantity: z.number().int().min(1),
});

router.post("/service-products", async (req, res) => {
  try {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: "Invalid request" }); return; }
    const inserted = await db.insert(serviceProductsTable).values(parsed.data).returning();
    res.status(201).json({ ...inserted[0], product_name: null });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/service-products/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(serviceProductsTable).where(eq(serviceProductsTable.id, id));
    res.status(204).send();
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
