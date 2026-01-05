const rateLimit = require('express-rate-limit');
const config = require('../config');
const logger = require('../config/logger');

/**
 * General rate limiter for all routes
 */
const generalLimiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    message: config.rateLimit.message,
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: (req, res) =>
    {
        logger.warn('Rate limit exceeded', {
            ip: req.ip,
            path: req.path,
        });
        res.status(429).json({
            error: 'Too Many Requests',
            message: config.rateLimit.message,
        });
    },
});

/**
 * Strict rate limiter for authentication routes
 */
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per windowMs
    message: 'Too many authentication attempts, please try again later.',
    skipSuccessfulRequests: true, // Don't count successful requests
    handler: (req, res) =>
    {
        logger.warn('Auth rate limit exceeded', {
            ip: req.ip,
            path: req.path,
        });
        res.status(429).json({
            error: 'Too Many Requests',
            message: 'Too many authentication attempts, please try again later.',
        });
    },
});

/**
 * Rate limiter for payment routes (more restrictive)
 */
const paymentLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // Limit each IP to 10 payment requests per hour
    message: 'Too many payment requests, please try again later.',
    handler: (req, res) =>
    {
        logger.warn('Payment rate limit exceeded', {
            ip: req.ip,
            path: req.path,
        });
        res.status(429).json({
            error: 'Too Many Requests',
            message: 'Too many payment requests, please try again later.',
        });
    },
});

module.exports = {
    generalLimiter,
    authLimiter,
    paymentLimiter,
};
