const express = require('express');
const router = express.Router();

// Import all route modules
const catalogRoutes = require('./catalog');
const cartRoutes = require('./cart');
const orderRoutes = require('./orders');
const authRoutes = require('./auth');
const paymentRoutes = require('./payment');

// Mount routes
router.use('/catalog', catalogRoutes);
router.use('/cart', cartRoutes);
router.use('/orders', orderRoutes);
router.use('/auth', authRoutes);
router.use('/payment', paymentRoutes);

// Health check endpoint
router.get('/health', (req, res) =>
{
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        service: 'ecom2micro-bff',
    });
});

module.exports = router;
