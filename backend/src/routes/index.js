const express = require('express');
const authRoutes = require('./auth.routes');
const userRoutes = require('./users.routes');
const productRoutes = require('./products.routes');
const favoriteRoutes = require('./favorites.routes');
const cartRoutes = require('./cart.routes');
const orderRoutes = require('./orders.routes');

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ ok: true, service: 'petshop-api' });
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/products', productRoutes);
router.use('/favorites', favoriteRoutes);
router.use('/cart', cartRoutes);
router.use('/orders', orderRoutes);

module.exports = router;
