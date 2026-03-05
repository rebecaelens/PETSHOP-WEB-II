const express = require('express');
const { z } = require('zod');
const { authRequired } = require('../middleware/auth');
const { getDb } = require('../db');

const router = express.Router();

router.get('/', authRequired, async (req, res, next) => {
  try {
    const db = await getDb();
    const rows = await db.all(
      `SELECT f.product_id, f.created_at, p.name, p.description, p.category, p.price, p.promo_price, p.price_per_kg, p.image_url, p.is_promo
       FROM favorites f
       JOIN products p ON p.id = f.product_id
       WHERE f.user_id = ?
       ORDER BY f.created_at DESC`,
      req.user.id
    );

    return res.json(rows.map((row) => ({
      productId: row.product_id,
      createdAt: row.created_at,
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
      }
    })));
  } catch (err) {
    return next(err);
  }
});

router.post('/', authRequired, async (req, res, next) => {
  try {
    const schema = z.object({ productId: z.string().min(1) });
    const { productId } = schema.parse(req.body);

    const db = await getDb();
    const exists = await db.get('SELECT id FROM products WHERE id = ? AND is_active = 1', productId);
    if (!exists) return res.status(404).json({ message: 'Produto nao encontrado' });

    await db.run(
      'INSERT OR IGNORE INTO favorites (user_id, product_id) VALUES (?, ?)',
      req.user.id,
      productId
    );

    return res.status(201).json({ message: 'Favorito salvo', productId });
  } catch (err) {
    return next(err);
  }
});

router.delete('/:productId', authRequired, async (req, res, next) => {
  try {
    const db = await getDb();
    await db.run(
      'DELETE FROM favorites WHERE user_id = ? AND product_id = ?',
      req.user.id,
      req.params.productId
    );

    return res.json({ message: 'Favorito removido' });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
