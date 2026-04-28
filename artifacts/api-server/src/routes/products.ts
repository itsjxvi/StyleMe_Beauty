import { Router } from "express";
import { db, productsTable, categoriesTable, brandsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { z } from "zod";

const router = Router();

router.get("/products/low-stock", async (req, res) => {
  const threshold = req.query.threshold ? parseInt(String(req.query.threshold)) : 5;
  const rows = await db.select().from(productsTable);
  const items = rows
    .filter(p => p.is_active !== false && p.stock <= threshold)
    .map(p => ({
      ...p,
      price: Number(p.price),
      cost: p.cost ? Number(p.cost) : null,
      category_name: null,
      brand_name: null,
    }));
  res.json({ items });
});

router.get("/products", async (_req, res) => {
  const rows = await db.select().from(productsTable).orderBy(productsTable.id);
  const cats = await db.select().from(categoriesTable);
  const brds = await db.select().from(brandsTable);
  const catMap = Object.fromEntries(cats.map(c => [c.id, c.name]));
  const brdMap = Object.fromEntries(brds.map(b => [b.id, b.name]));
  const items = rows.map(p => ({
    ...p,
    price: Number(p.price),
    cost: p.cost ? Number(p.cost) : null,
    category_name: p.category_id ? (catMap[p.category_id] ?? null) : null,
    brand_name: p.brand_id ? (brdMap[p.brand_id] ?? null) : null,
  }));
  res.json({ items });
});

const productSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  price: z.coerce.number().positive(),
  cost: z.coerce.number().optional().nullable(),
  stock: z.coerce.number().int().min(0).optional().default(0),
  category_id: z.coerce.number().int().optional().nullable(),
  brand_id: z.coerce.number().int().optional().nullable(),
  provider_id: z.coerce.number().int().optional().nullable(),
}).passthrough();

function pickProduct(d: any) {
  return {
    name: d.name,
    description: d.description ?? null,
    price: String(d.price),
    cost: d.cost != null ? String(d.cost) : null,
    stock: d.stock ?? 0,
    category_id: d.category_id ?? null,
    brand_id: d.brand_id ?? null,
    provider_id: d.provider_id ?? null,
  };
}

router.post("/products", async (req, res) => {
  const parsed = productSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid request", details: parsed.error.issues }); return; }
  const inserted = await db.insert(productsTable).values(pickProduct(parsed.data)).returning();
  const p = inserted[0];
  res.status(201).json({ ...p, price: Number(p.price), cost: p.cost ? Number(p.cost) : null, category_name: null, brand_name: null });
});

router.put("/products/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const parsed = productSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid request", details: parsed.error.issues }); return; }
  const updated = await db.update(productsTable).set(pickProduct(parsed.data)).where(eq(productsTable.id, id)).returning();
  if (!updated[0]) { res.status(404).json({ error: "Not found" }); return; }
  const p = updated[0];
  res.json({ ...p, price: Number(p.price), cost: p.cost ? Number(p.cost) : null, category_name: null, brand_name: null });
});

router.delete("/products/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(productsTable).where(eq(productsTable.id, id));
  res.status(204).send();
});

export default router;
