const express = require('express');
const router = express.Router();
const orderService = require('../services/orderService');
const { authenticateToken } = require('../middleware/auth');
const { body, query, validationResult } = require('express-validator');

/**
 * Validation middleware
 */
const validateRequest = (req, res, next) =>
{
    const errors = validationResult(req);
    if (!errors.isEmpty())
    {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

/**
 * GET /api/orders
 * Get all orders for user with pagination
 */
router.get(
    '/',
    authenticateToken,
    [
        query('page').optional().isInt({ min: 1 }).withMessage('Page must be at least 1'),
        query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
        query('status').optional().isString().withMessage('Status must be a string'),
        query('sortBy').optional().isIn(['createdAt', 'updatedAt', 'total']).withMessage('Invalid sort field'),
        query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),
    ],
    validateRequest,
    async (req, res, next) =>
    {
        try
        {
            const token = req.token; // Use token from auth middleware
            const orders = await orderService.getOrders(req.query, token);
            res.json(orders);
        } catch (error)
        {
            next(error);
        }
    }
);

/**
 * GET /api/orders/:id
 * Get order by ID
 */
router.get('/:id', authenticateToken, async (req, res, next) =>
{
    try
    {
        const { id } = req.params;
        const token = req.token; // Use token from auth middleware
        const order = await orderService.getOrderById(id, token);
        res.json(order);
    } catch (error)
    {
        next(error);
    }
});

/**
 * POST /api/orders
 * Create a new order
 */
router.post(
    '/',
    authenticateToken,
    [
        body('items').isArray({ min: 1 }).withMessage('Order must contain at least one item'),
        body('shippingAddress').notEmpty().withMessage('Shipping address is required'),
    ],
    validateRequest,
    async (req, res, next) =>
    {
        try
        {
            const token = req.token; // Use token from auth middleware
            const order = await orderService.createOrder(req.body, token);
            res.status(201).json(order);
        } catch (error)
        {
            next(error);
        }
    }
);

/**
 * PUT /api/orders/:id/cancel
 * Cancel an order
 */
router.put('/:id/cancel', authenticateToken, async (req, res, next) =>
{
    try
    {
        const { id } = req.params;
        const token = req.token; // Use token from auth middleware
        const order = await orderService.cancelOrder(id, token);
        res.json(order);
    } catch (error)
    {
        next(error);
    }
});

/**
 * GET /api/orders/:id/status
 * Get real-time order status
 */
router.get('/:id/status', authenticateToken, async (req, res, next) =>
{
    try
    {
        const { id } = req.params;
        const token = req.token; // Use token from auth middleware
        const status = await orderService.getOrderStatus(id, token);
        res.json(status);
    } catch (error)
    {
        next(error);
    }
});

module.exports = router;
