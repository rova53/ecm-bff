const express = require('express');
const router = express.Router();
const identityService = require('../services/identityService');
const { authenticateToken } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const { body, validationResult } = require('express-validator');
const config = require('../config');
const logger = require('../config/logger');

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
 * POST /api/auth/register
 * User registration
 */
router.post(
    '/register',
    authLimiter,
    [
        body('email').isEmail().withMessage('Valid email is required'),
        body('password')
            .isLength({ min: 8 })
            .withMessage('Password must be at least 8 characters'),
        body('firstName').notEmpty().withMessage('First name is required'),
        body('lastName').notEmpty().withMessage('Last name is required'),
    ],
    validateRequest,
    async (req, res, next) =>
    {
        try
        {
            logger.info('User registration attempt', { email: req.body.email });

            const result = await identityService.register(req.body);

            // If registration includes a token, set it in cookie
            if (result.token)
            {
                res.cookie(config.jwt.cookieName, result.token, config.cookie);

                // Remove token from response body for security
                const { token, ...userData } = result;

                logger.info('User registered successfully', { email: req.body.email });
                return res.status(201).json({
                    message: 'Registration successful',
                    user: userData.user || userData,
                });
            }

            res.status(201).json(result);
        } catch (error)
        {
            logger.error('Registration failed', {
                email: req.body.email,
                error: error.message
            });
            next(error);
        }
    }
);

/**
 * POST /api/auth/login
 * User login - Sets JWT in HttpOnly cookie
 */
router.post(
    '/login',
    authLimiter,
    [
        body('email').isEmail().withMessage('Valid email is required'),
        body('password').notEmpty().withMessage('Password is required'),
    ],
    validateRequest,
    async (req, res, next) =>
    {
        try
        {
            logger.info('User login attempt', { email: req.body.email });

            const result = await identityService.login(req.body);

            // Set JWT in HttpOnly cookie
            if (result.token)
            {
                res.cookie(config.jwt.cookieName, result.token, config.cookie);

                // Remove token from response body for security
                const { token, refreshToken, ...userData } = result;

                logger.info('User logged in successfully', {
                    email: req.body.email,
                    userId: userData.user?.id
                });

                return res.json({
                    message: 'Login successful',
                    user: userData.user || userData,
                });
            }

            // If no token in response, return as is
            res.json(result);
        } catch (error)
        {
            logger.error('Login failed', {
                email: req.body.email,
                error: error.message
            });
            next(error);
        }
    }
);

/**
 * POST /api/auth/logout
 * User logout - Clears the authentication cookie
 */
router.post('/logout', authenticateToken, async (req, res, next) =>
{
    try
    {
        const userId = req.user?.id || req.user?.sub;
        logger.info('User logout', { userId });

        // Optional: Call identity service to invalidate token on backend
        if (req.token)
        {
            try
            {
                await identityService.logout(req.token);
            } catch (error)
            {
                // Log but don't fail the logout if backend call fails
                logger.warn('Backend logout call failed', { error: error.message });
            }
        }

        // Clear the authentication cookie
        res.clearCookie(config.jwt.cookieName, {
            httpOnly: config.cookie.httpOnly,
            secure: config.cookie.secure,
            sameSite: config.cookie.sameSite,
        });

        logger.info('User logged out successfully', { userId });
        res.json({ message: 'Logged out successfully' });
    } catch (error)
    {
        logger.error('Logout error', { error: error.message });
        next(error);
    }
});

/**
 * GET /api/auth/profile
 * Get user profile
 */
router.get('/profile', authenticateToken, async (req, res, next) =>
{
    try
    {
        const userId = req.user?.id || req.user?.sub;
        logger.info('Fetching user profile', { userId });

        const profile = await identityService.getProfile(req.token);

        res.json(profile);
    } catch (error)
    {
        logger.error('Failed to fetch profile', {
            userId: req.user?.id,
            error: error.message
        });
        next(error);
    }
});

/**
 * PUT /api/auth/profile
 * Update user profile
 */
router.put('/profile', authenticateToken, async (req, res, next) =>
{
    try
    {
        const userId = req.user?.id || req.user?.sub;
        logger.info('Updating user profile', { userId });

        const profile = await identityService.updateProfile(req.body, req.token);

        logger.info('Profile updated successfully', { userId });
        res.json(profile);
    } catch (error)
    {
        logger.error('Failed to update profile', {
            userId: req.user?.id,
            error: error.message
        });
        next(error);
    }
});

/**
 * POST /api/auth/refresh
 * Refresh access token
 */
router.post(
    '/refresh',
    [body('refreshToken').notEmpty().withMessage('Refresh token is required')],
    validateRequest,
    async (req, res, next) =>
    {
        try
        {
            const { refreshToken } = req.body;
            const result = await identityService.refreshToken(refreshToken);

            // Set new token in cookie
            if (result.token)
            {
                res.cookie(config.jwt.cookieName, result.token, config.cookie);

                const { token, ...userData } = result;
                return res.json({
                    message: 'Token refreshed successfully',
                    user: userData.user || userData,
                });
            }

            res.json(result);
        } catch (error)
        {
            logger.error('Token refresh failed', { error: error.message });
            next(error);
        }
    }
);

/**
 * GET /api/auth/check
 * Check if user is authenticated (useful for frontend)
 */
router.get('/check', authenticateToken, (req, res) =>
{
    res.json({
        authenticated: true,
        user: {
            id: req.user.id || req.user.sub,
            email: req.user.email,
            // Add other safe user properties
        },
    });
});

module.exports = router;
