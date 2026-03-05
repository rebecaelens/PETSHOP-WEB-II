const express = require('express');
const { z } = require('zod');
const { authRequired } = require('../middleware/auth');
const { getDb } = require('../db');

const router = express.Router();

router.get('/', authRequired, async (req, res, next) => {
  try {
    const db = await getDb();
    const orders = await db.all(
      'SELECT id, status, total, created_at FROM orders WHERE user_id = ? ORDER BY created_at DESC',
      req.user.id
    );

    return res.json(orders.map((o) => ({
      id: o.id,
      status: o.status,
      total: o.total,
      createdAt: o.created_at
    })));
  } catch (err) {
    return next(err);
  }
});

router.get('/:orderId', authRequired, async (req, res, next) => {
  try {
    const db = await getDb();
    const orderId = Number(req.params.orderId);

    const order = await db.get(
      'SELECT id, user_id, status, total, created_at FROM orders WHERE id = ? AND user_id = ?',
      orderId,
      req.user.id
    );
    if (!order) return res.status(404).json({ message: 'Pedido nao encontrado' });

    const items = await db.all(
      `SELECT oi.id, oi.product_id, oi.quantity, oi.grams, oi.unit_price, oi.total_price,
              p.name, p.image_url
       FROM order_items oi
       JOIN products p ON p.id = oi.product_id
       WHERE oi.order_id = ?`,
      orderId
    );

    return res.json({
      id: order.id,
      status: order.status,
      total: order.total,
      createdAt: order.created_at,
      items: items.map((i) => ({
        id: i.id,
        productId: i.product_id,
        quantity: i.quantity,
        grams: i.grams,
        unitPrice: i.unit_price,
        totalPrice: i.total_price,
        productName: i.name,
        imageUrl: i.image_url
      }))
    });
  } catch (err) {
    return next(err);
  }
});

router.post('/', authRequired, async (req, res, next) => {
  try {
    const schema = z.object({
      status: z.enum(['pending', 'paid', 'shipped', 'delivered', 'cancelled']).optional()
    });
    const { status } = schema.parse(req.body || {});

    const db = await getDb();
    const cartRows = await db.all(
      `SELECT c.product_id, c.quantity, c.grams, p.price, p.promo_price, p.price_per_kg
       FROM cart_items c
       JOIN products p ON p.id = c.product_id
       WHERE c.user_id = ?`,
      req.user.id
    );

    if (!cartRows.length) {
      return res.status(400).json({ message: 'Carrinho vazio' });
    }

    const prepared = cartRows.map((row) => {
      const byWeight = Number(row.price_per_kg) > 0;
      const unitPrice = byWeight
        ? Number(row.price_per_kg)
        : Number(row.promo_price != null ? row.promo_price : row.price);

      const lineTotal = byWeight
        ? (Number(row.grams) / 1000) * unitPrice
        : Number(row.quantity) * unitPrice;

      return {
        productId: row.product_id,
        quantity: byWeight ? 1 : Number(row.quantity),
        grams: byWeight ? Number(row.grams) : null,
        unitPrice,
        totalPrice: Number(lineTotal.toFixed(2))
      };
    });

    const total = Number(prepared.reduce((acc, item) => acc + item.totalPrice, 0).toFixed(2));

    await db.exec('BEGIN');
    try {
      const orderResult = await db.run(
        'INSERT INTO orders (user_id, status, total) VALUES (?, ?, ?)',
        req.user.id,
        status || 'pending',
        total
      );

      for (const item of prepared) {
        await db.run(
          'INSERT INTO order_items (order_id, product_id, quantity, grams, unit_price, total_price) VALUES (?, ?, ?, ?, ?, ?)',
          orderResult.lastID,
          item.productId,
          item.quantity,
          item.grams,
          item.unitPrice,
          item.totalPrice
        );
      }

      await db.run('DELETE FROM cart_items WHERE user_id = ?', req.user.id);
      await db.exec('COMMIT');

      return res.status(201).json({
        orderId: orderResult.lastID,
        status: status || 'pending',
        total
      });
    } catch (txErr) {
      await db.exec('ROLLBACK');
      throw txErr;
    }
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
