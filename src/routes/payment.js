const express = require('express');
const router = express.Router();
const paymentService = require('../services/paymentService');
const { authenticateToken } = require('../middleware/auth');
const { paymentLimiter } = require('../middleware/rateLimiter');
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
 * POST /api/payment/process
 * Process a payment
 */
router.post(
    '/process',
    authenticateToken,
    paymentLimiter,
    [
        body('orderId').notEmpty().withMessage('Order ID is required'),
        body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
        body('paymentMethod').notEmpty().withMessage('Payment method is required'),
    ],
    validateRequest,
    async (req, res, next) =>
    {
        try
        {
            const token = req.headers.authorization?.split(' ')[1];
            const payment = await paymentService.processPayment(req.body, token);
            res.json(payment);
        } catch (error)
        {
            next(error);
        }
    }
);

/**
 * GET /api/payment/status/:id
 * Get payment status
 */
router.get('/status/:id', authenticateToken, async (req, res, next) =>
{
    try
    {
        const { id } = req.params;
        const token = req.headers.authorization?.split(' ')[1];
        const status = await paymentService.getPaymentStatus(id, token);
        res.json(status);
    } catch (error)
    {
        next(error);
    }
});

/**
 * GET /api/payment/history
 * Get payment history
 */
router.get('/history', authenticateToken, async (req, res, next) =>
{
    try
    {
        const token = req.headers.authorization?.split(' ')[1];
        const history = await paymentService.getPaymentHistory(req.query, token);
        res.json(history);
    } catch (error)
    {
        next(error);
    }
});

/**
 * POST /api/payment/:id/refund
 * Refund a payment
 */
router.post(
    '/:id/refund',
    authenticateToken,
    paymentLimiter,
    [
        body('amount').optional().isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
        body('reason').notEmpty().withMessage('Refund reason is required'),
    ],
    validateRequest,
    async (req, res, next) =>
    {
        try
        {
            const { id } = req.params;
            const token = req.headers.authorization?.split(' ')[1];
            const refund = await paymentService.refundPayment(id, req.body, token);
            res.json(refund);
        } catch (error)
        {
            next(error);
        }
    }
);

module.exports = router;
