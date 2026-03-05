const express = require('express');
const { getDb } = require('../db');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const db = await getDb();

    const q = String(req.query.q || '').trim().toLowerCase();
    const category = String(req.query.category || req.query.cat || '').trim().toLowerCase();
    const promo = String(req.query.promo || '').trim().toLowerCase();
    const minPrice = Number(req.query.minPrice || 0);
    const maxPrice = Number(req.query.maxPrice || 0);
    const limit = Math.min(Number(req.query.limit || 100), 200);
    const offset = Math.max(Number(req.query.offset || 0), 0);

    const where = ['is_active = 1'];
    const params = [];

    if (q) {
      where.push('(LOWER(name) LIKE ? OR LOWER(description) LIKE ?)');
      params.push(`%${q}%`, `%${q}%`);
    }

    if (category && category !== 'all') {
      if (category === 'promocoes') {
        where.push('is_promo = 1');
      } else {
        where.push('LOWER(category) = ?');
        params.push(category);
      }
    }

    if (promo === 'true' || promo === '1') where.push('is_promo = 1');
    if (Number.isFinite(minPrice) && minPrice > 0) {
      where.push('COALESCE(promo_price, price) >= ?');
      params.push(minPrice);
    }
    if (Number.isFinite(maxPrice) && maxPrice > 0) {
      where.push('COALESCE(promo_price, price) <= ?');
      params.push(maxPrice);
    }

    params.push(limit, offset);

    const rows = await db.all(
      `SELECT id, name, description, category, price, promo_price, price_per_kg, image_url, is_promo
       FROM products
       WHERE ${where.join(' AND ')}
       ORDER BY id
       LIMIT ? OFFSET ?`,
      params
    );

    return res.json(rows.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      category: p.category,
      price: p.price,
      promoPrice: p.promo_price,
      pricePerKg: p.price_per_kg,
      imageUrl: p.image_url,
      isPromo: Boolean(p.is_promo)
    })));
  } catch (err) {
    return next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const db = await getDb();
    const row = await db.get(
      `SELECT id, name, description, category, price, promo_price, price_per_kg, image_url, is_promo
       FROM products WHERE id = ? AND is_active = 1`,
      req.params.id
    );

    if (!row) return res.status(404).json({ message: 'Produto nao encontrado' });

    return res.json({
      id: row.id,
      name: row.name,
      description: row.description,
      category: row.category,
      price: row.price,
      promoPrice: row.promo_price,
      pricePerKg: row.price_per_kg,
      imageUrl: row.image_url,
      isPromo: Boolean(row.is_promo)
    });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
