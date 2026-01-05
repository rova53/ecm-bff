const cache = require('../services/cache');
const logger = require('../config/logger');

/**
 * Cache middleware for GET requests
 * @param {number} ttl - Time to live in seconds (default: 300 = 5 minutes)
 * @param {function} keyGenerator - Optional function to generate custom cache key
 */
const cacheMiddleware = (ttl = 300, keyGenerator = null) =>
{
    return async (req, res, next) =>
    {
        // Only cache GET requests
        if (req.method !== 'GET')
        {
            return next();
        }

        try
        {
            // Generate cache key
            let cacheKey;
            if (keyGenerator)
            {
                cacheKey = keyGenerator(req);
            } else
            {
                // Default key: route + query params + user id (if authenticated)
                const userId = req.user?.id || req.user?.sub || 'anonymous';
                const queryString = new URLSearchParams(req.query).toString();
                cacheKey = cache.generateKey(
                    'route',
                    req.path,
                    userId,
                    queryString
                );
            }

            // Try to get from cache
            const cachedData = await cache.get(cacheKey);

            if (cachedData !== null)
            {
                logger.debug('Serving from cache', {
                    path: req.path,
                    cacheKey
                });

                // Add cache hit header
                res.set('X-Cache', 'HIT');
                return res.json(cachedData);
            }

            // Cache miss - continue to route handler
            logger.debug('Cache miss', { path: req.path, cacheKey });
            res.set('X-Cache', 'MISS');

            // Store original json method
            const originalJson = res.json.bind(res);

            // Override json method to cache response
            res.json = function (data)
            {
                // Cache the response
                cache.set(cacheKey, data, ttl)
                    .then(() =>
                    {
                        logger.debug('Response cached', {
                            path: req.path,
                            cacheKey,
                            ttl
                        });
                    })
                    .catch(err =>
                    {
                        logger.error('Failed to cache response', {
                            error: err.message
                        });
                    });

                // Send response
                return originalJson(data);
            };

            next();
        } catch (error)
        {
            logger.error('Cache middleware error', { error: error.message });
            // Continue without caching on error
            next();
        }
    };
};

/**
 * Middleware to invalidate cache by pattern
 */
const invalidateCache = (pattern) =>
{
    return async (req, res, next) =>
    {
        try
        {
            await cache.delPattern(pattern);
            logger.info('Cache invalidated', { pattern });
        } catch (error)
        {
            logger.error('Cache invalidation error', {
                pattern,
                error: error.message
            });
        }
        next();
    };
};

module.exports = {
    cacheMiddleware,
    invalidateCache,
};
