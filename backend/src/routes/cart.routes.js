const express = require('express');
const { z } = require('zod');
const { authRequired } = require('../middleware/auth');
const { getDb } = require('../db');

const router = express.Router();

const addItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().positive().optional(),
  grams: z.number().positive().optional()
});

function normalizeCartItem(row) {
  const priceUnit = row.promo_price != null ? row.promo_price : row.price;
  const isByWeight = Number(row.price_per_kg) > 0;
  let totalPrice = 0;

  if (isByWeight) {
    totalPrice = (Number(row.grams) / 1000) * Number(row.price_per_kg);
  } else {
    totalPrice = Number(priceUnit) * Number(row.quantity);
  }

  return {
    id: row.id,
    productId: row.product_id,
    quantity: row.quantity,
    grams: row.grams,
    product: {
      id: row.product_id,
      name: row.name,
      description: row.description,
      category: row.category,
      price: row.price,
      promoPrice: row.promo_price,
      pricePerKg: row.price_per_kg,
      imageUrl: row.image_url,
      isPromo: Boolean(row.is_promo)
    },
    totalPrice: Number(totalPrice.toFixed(2))
  };
}

router.get('/', authRequired, async (req, res, next) => {
  try {
    const db = await getDb();
    const rows = await db.all(
      `SELECT c.id, c.product_id, c.quantity, c.grams,
              p.name, p.description, p.category, p.price, p.promo_price, p.price_per_kg, p.image_url, p.is_promo
       FROM cart_items c
       JOIN products p ON p.id = c.product_id
       WHERE c.user_id = ?
       ORDER BY c.created_at DESC`,
      req.user.id
    );

    const items = rows.map(normalizeCartItem);
    const total = items.reduce((acc, item) => acc + item.totalPrice, 0);

    return res.json({ items, total: Number(total.toFixed(2)) });
  } catch (err) {
    return next(err);
  }
});

router.post('/', authRequired, async (req, res, next) => {
  try {
    const payload = addItemSchema.parse(req.body);
    const db = await getDb();

    const product = await db.get(
      'SELECT id, price, promo_price, price_per_kg FROM products WHERE id = ? AND is_active = 1',
      payload.productId
    );
    if (!product) return res.status(404).json({ message: 'Produto nao encontrado' });

    const byWeight = Number(product.price_per_kg) > 0;
    const quantity = byWeight ? 1 : payload.quantity || 1;
    const grams = byWeight ? Math.round(payload.grams || 1000) : null;

    const existing = await db.get(
      'SELECT id, quantity, grams FROM cart_items WHERE user_id = ? AND product_id = ?',
      req.user.id,
      payload.productId
    );

    if (existing) {
      if (byWeight) {
        await db.run(
          "UPDATE cart_items SET grams = ?, updated_at = datetime('now') WHERE id = ?",
          Number(existing.grams || 0) + grams,
          existing.id
        );
      } else {
        await db.run(
          "UPDATE cart_items SET quantity = ?, updated_at = datetime('now') WHERE id = ?",
          Number(existing.quantity || 0) + quantity,
          existing.id
        );
      }
    } else {
      await db.run(
        'INSERT INTO cart_items (user_id, product_id, quantity, grams) VALUES (?, ?, ?, ?)',
        req.user.id,
        payload.productId,
        quantity,
        grams
      );
    }

    return res.status(201).json({ message: 'Item adicionado ao carrinho' });
  } catch (err) {
    return next(err);
  }
});

router.patch('/:itemId', authRequired, async (req, res, next) => {
  try {
    const schema = z.object({
      quantity: z.number().positive().optional(),
      grams: z.number().positive().optional()
    });
    const payload = schema.parse(req.body);

    const db = await getDb();
    const item = await db.get(
      `SELECT c.id, c.product_id, p.price_per_kg
       FROM cart_items c
       JOIN products p ON p.id = c.product_id
       WHERE c.id = ? AND c.user_id = ?`,
      Number(req.params.itemId),
      req.user.id
    );

    if (!item) return res.status(404).json({ message: 'Item nao encontrado' });

    if (Number(item.price_per_kg) > 0) {
      if (!payload.grams) return res.status(400).json({ message: 'Informe grams para produto por peso' });
      await db.run(
        "UPDATE cart_items SET grams = ?, updated_at = datetime('now') WHERE id = ?",
        Math.round(payload.grams),
        item.id
      );
    } else {
      if (!payload.quantity) return res.status(400).json({ message: 'Informe quantity para produto unitario' });
      await db.run(
        "UPDATE cart_items SET quantity = ?, updated_at = datetime('now') WHERE id = ?",
        Math.round(payload.quantity),
        item.id
      );
    }

    return res.json({ message: 'Carrinho atualizado' });
  } catch (err) {
    return next(err);
  }
});

router.delete('/:itemId', authRequired, async (req, res, next) => {
  try {
    const db = await getDb();
    await db.run('DELETE FROM cart_items WHERE id = ? AND user_id = ?', Number(req.params.itemId), req.user.id);
    return res.json({ message: 'Item removido' });
  } catch (err) {
    return next(err);
  }
});

router.delete('/', authRequired, async (req, res, next) => {
  try {
    const db = await getDb();
    await db.run('DELETE FROM cart_items WHERE user_id = ?', req.user.id);
    return res.json({ message: 'Carrinho limpo' });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
