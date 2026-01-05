const jwt = require('jsonwebtoken');
const config = require('../config');
const logger = require('../config/logger');

/**
 * Middleware to authenticate JWT tokens from cookies
 */
const authenticateToken = (req, res, next) =>
{
    try
    {
        // Try to get token from cookie first, then fallback to Authorization header
        let token = req.cookies[config.jwt.cookieName];

        // Fallback to Authorization header for API clients
        if (!token)
        {
            const authHeader = req.headers['authorization'];
            token = authHeader && authHeader.split(' ')[1];
        }

        if (!token)
        {
            return res.status(401).json({
                error: 'Access denied',
                message: 'No token provided',
            });
        }

        jwt.verify(token, config.jwt.secret, (err, user) =>
        {
            if (err)
            {
                logger.warn('Token verification failed', { error: err.message });
                return res.status(403).json({
                    error: 'Forbidden',
                    message: 'Invalid or expired token',
                });
            }

            req.user = user;
            req.token = token; // Store token for further use
            next();
        });
    } catch (error)
    {
        logger.error('Authentication error', { error: error.message });
        res.status(500).json({
            error: 'Internal server error',
            message: 'Authentication failed',
        });
    }
};

/**
 * Optional authentication - continues even if token is invalid
 */
const optionalAuth = (req, res, next) =>
{
    try
    {
        // Try to get token from cookie first, then fallback to Authorization header
        let token = req.cookies[config.jwt.cookieName];

        if (!token)
        {
            const authHeader = req.headers['authorization'];
            token = authHeader && authHeader.split(' ')[1];
        }

        if (token)
        {
            jwt.verify(token, config.jwt.secret, (err, user) =>
            {
                if (!err)
                {
                    req.user = user;
                    req.token = token;
                }
            });
        }
        next();
    } catch (error)
    {
        logger.error('Optional auth error', { error: error.message });
        next();
    }
};

module.exports = {
    authenticateToken,
    optionalAuth,
};
