/**
 * Routes mock pour développement/test sans backend
 * À utiliser quand les microservices ne sont pas disponibles
 */

const express = require('express');
const router = express.Router();
const { mockMiddleware, extractUserFromToken } = require('../middleware/mockData');

// Appliquer l'extraction du user sur toutes les routes
router.use(extractUserFromToken);

// ==================== Health Check ====================
router.get('/health', (req, res) =>
{
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        service: 'ecom2micro-bff',
        mode: 'mock'
    });
});

// ==================== Auth Routes ====================
router.post('/auth/register', mockMiddleware.register);
router.post('/auth/login', mockMiddleware.login);
router.get('/auth/me', mockMiddleware.me);
router.post('/auth/logout', mockMiddleware.logout);

// ==================== Catalog Routes ====================
router.get('/catalog/products', mockMiddleware.getProducts);
router.get('/catalog/products/search', mockMiddleware.searchProducts);
router.get('/catalog/products/:id', mockMiddleware.getProduct);
router.get('/catalog/categories', mockMiddleware.getCategories);

// ==================== Cart Routes ====================
router.get('/cart', mockMiddleware.getCart);
router.post('/cart/items', mockMiddleware.addToCart);
router.put('/cart/items/:productId', mockMiddleware.updateCartItem);
router.delete('/cart/items/:productId', mockMiddleware.removeFromCart);
router.delete('/cart', mockMiddleware.clearCart);

// ==================== Order Routes ====================
router.post('/orders', mockMiddleware.createOrder);
router.get('/orders', mockMiddleware.getOrders);
router.get('/orders/:orderId', mockMiddleware.getOrder);
router.post('/orders/:orderId/cancel', mockMiddleware.cancelOrder);

// ==================== Payment Routes ====================
router.post('/payment/process', mockMiddleware.processPayment);
router.get('/payment/status/:orderId', mockMiddleware.getPaymentStatus);

module.exports = router;
