const express = require('express');
const router = express.Router();
const cartService = require('../services/cartService');
const { authenticateToken } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

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
 * GET /api/cart
 * Get cart items
 */
router.get('/', authenticateToken, async (req, res, next) =>
{
    try
    {
        const token = req.token; // Use token from auth middleware
        const cart = await cartService.getCart(token);
        res.json(cart);
    } catch (error)
    {
        next(error);
    }
});

/**
 * POST /api/cart/items
 * Add item to cart
 */
router.post(
    '/items',
    authenticateToken,
    [
        body('productId').notEmpty().withMessage('Product ID is required'),
        body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    ],
    validateRequest,
    async (req, res, next) =>
    {
        try
        {
            const token = req.token; // Use token from auth middleware
            const item = await cartService.addItem(req.body, token);
            res.status(201).json(item);
        } catch (error)
        {
            next(error);
        }
    }
);

/**
 * PUT /api/cart/items/:productId
 * Update cart item quantity
 */
router.put(
    '/items/:productId',
    authenticateToken,
    [body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1')],
    validateRequest,
    async (req, res, next) =>
    {
        try
        {
            const { productId } = req.params;
            const { quantity } = req.body;
            const token = req.token; // Use token from auth middleware
            const item = await cartService.updateItem(productId, quantity, token);
            res.json(item);
        } catch (error)
        {
            next(error);
        }
    }
);

/**
 * DELETE /api/cart/items/:productId
 * Remove item from cart
 */
router.delete('/items/:productId', authenticateToken, async (req, res, next) =>
{
    try
    {
        const { productId } = req.params;
        const token = req.token; // Use token from auth middleware
        await cartService.removeItem(productId, token);
        res.status(204).send();
    } catch (error)
    {
        next(error);
    }
});

/**
 * DELETE /api/cart
 * Clear cart
 */
router.delete('/', authenticateToken, async (req, res, next) =>
{
    try
    {
        const token = req.token; // Use token from auth middleware
        await cartService.clearCart(token);
        res.status(204).send();
    } catch (error)
    {
        next(error);
    }
});

/**
 * POST /api/cart/checkout
 * Checkout cart
 */
router.post('/checkout', authenticateToken, async (req, res, next) =>
{
    try
    {
        const token = req.token; // Use token from auth middleware
        const order = await cartService.checkout(req.body, token);
        res.json(order);
    } catch (error)
    {
        next(error);
    }
});

module.exports = router;
