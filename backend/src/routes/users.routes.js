const express = require('express');
const { z } = require('zod');
const { authRequired } = require('../middleware/auth');
const { getDb } = require('../db');

const router = express.Router();

router.get('/me', authRequired, async (req, res, next) => {
  try {
    const db = await getDb();
    const user = await db.get(
      'SELECT id, name, email, avatar_url, created_at FROM users WHERE id = ?',
      req.user.id
    );

    if (!user) return res.status(404).json({ message: 'Usuario nao encontrado' });

    return res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatar_url,
      createdAt: user.created_at
    });
  } catch (err) {
    return next(err);
  }
});

router.patch('/me/avatar', authRequired, async (req, res, next) => {
  try {
    const schema = z.object({ avatarUrl: z.string().min(1) });
    const { avatarUrl } = schema.parse(req.body);

    const db = await getDb();
    await db.run(
      "UPDATE users SET avatar_url = ?, updated_at = datetime('now') WHERE id = ?",
      avatarUrl,
      req.user.id
    );

    return res.json({ message: 'Avatar atualizado', avatarUrl });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
