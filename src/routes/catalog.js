const express = require('express');
const router = express.Router();
const catalogService = require('../services/catalogService');
const { optionalAuth } = require('../middleware/auth');
const { cacheMiddleware } = require('../middleware/cache');
const { query, validationResult } = require('express-validator');
const logger = require('../config/logger');

/**
 * Validation middleware
 */
const validateRequest = (req, res, next) =>
{
    const errors = validationResult(req);
    if (!errors.isEmpty())
    {
        return res.status(400).json({
            error: 'Validation Error',
            errors: errors.array()
        });
    }
    next();
};

/**
 * GET /api/catalog/products
 * Get paginated products list with filters
 * 
 * Query params:
 * - page: number (default: 1)
 * - limit: number (default: 20, max: 100)
 * - category: string (category ID or name)
 * - minPrice: number
 * - maxPrice: number
 * - search: string (search in name/description)
 * - sortBy: string (name, price, createdAt)
 * - sortOrder: string (asc, desc)
 */
router.get(
    '/products',
    optionalAuth,
    cacheMiddleware(300), // Cache for 5 minutes
    [
        query('page').optional().isInt({ min: 1 }).toInt(),
        query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
        query('minPrice').optional().isFloat({ min: 0 }).toFloat(),
        query('maxPrice').optional().isFloat({ min: 0 }).toFloat(),
        query('sortBy').optional().isIn(['name', 'price', 'createdAt']),
        query('sortOrder').optional().isIn(['asc', 'desc']),
    ],
    validateRequest,
    async (req, res, next) =>
    {
        try
        {
            const {
                page = 1,
                limit = 20,
                category,
                minPrice,
                maxPrice,
                search,
                sortBy,
                sortOrder,
            } = req.query;

            logger.info('Fetching products', {
                page,
                limit,
                category,
                minPrice,
                maxPrice,
                search,
                sortBy,
                sortOrder,
            });

            const token = req.token || req.headers.authorization?.split(' ')[1];

            const filters = {
                page,
                limit,
                category,
                minPrice,
                maxPrice,
                search,
                sortBy,
                sortOrder,
            };

            const products = await catalogService.getProducts(filters, token);

            res.json(products);
        } catch (error)
        {
            logger.error('Failed to fetch products', { error: error.message });
            next(error);
        }
    }
);

/**
 * GET /api/catalog/products/search
 * Search products
 * Deprecated: Use /api/catalog/products?search=query instead
 */
router.get(
    '/products/search',
    optionalAuth,
    cacheMiddleware(300),
    [query('q').notEmpty().withMessage('Search query is required')],
    validateRequest,
    async (req, res, next) =>
    {
        try
        {
            const { q } = req.query;

            logger.info('Searching products', { query: q });

            const token = req.token || req.headers.authorization?.split(' ')[1];
            const products = await catalogService.searchProducts(q, token);

            res.json(products);
        } catch (error)
        {
            logger.error('Product search failed', { error: error.message });
            next(error);
        }
    }
);

/**
 * GET /api/catalog/products/:id
 * Get product by ID with detailed information
 */
router.get(
    '/products/:id',
    optionalAuth,
    cacheMiddleware(300), // Cache for 5 minutes
    async (req, res, next) =>
    {
        try
        {
            const { id } = req.params;

            logger.info('Fetching product detail', { productId: id });

            const token = req.token || req.headers.authorization?.split(' ')[1];
            const product = await catalogService.getProductById(id, token);

            res.json(product);
        } catch (error)
        {
            logger.error('Failed to fetch product', {
                productId: req.params.id,
                error: error.message
            });
            next(error);
        }
    }
);

/**
 * GET /api/catalog/categories
 * Get all categories
 */
router.get(
    '/categories',
    optionalAuth,
    cacheMiddleware(600), // Cache for 10 minutes (categories change less frequently)
    async (req, res, next) =>
    {
        try
        {
            logger.info('Fetching categories');

            const token = req.token || req.headers.authorization?.split(' ')[1];
            const categories = await catalogService.getCategories(token);

            res.json(categories);
        } catch (error)
        {
            logger.error('Failed to fetch categories', { error: error.message });
            next(error);
        }
    }
);

/**
 * GET /api/catalog/categories/:id
 * Get category by ID with details
 */
router.get(
    '/categories/:id',
    optionalAuth,
    cacheMiddleware(600),
    async (req, res, next) =>
    {
        try
        {
            const { id } = req.params;

            logger.info('Fetching category detail', { categoryId: id });

            const token = req.token || req.headers.authorization?.split(' ')[1];
            const category = await catalogService.getCategoryById(id, token);

            res.json(category);
        } catch (error)
        {
            logger.error('Failed to fetch category', {
                categoryId: req.params.id,
                error: error.message
            });
            next(error);
        }
    }
);

/**
 * GET /api/catalog/categories/:id/products
 * Get products by category with pagination
 */
router.get(
    '/categories/:id/products',
    optionalAuth,
    cacheMiddleware(300),
    [
        query('page').optional().isInt({ min: 1 }).toInt(),
        query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    ],
    validateRequest,
    async (req, res, next) =>
    {
        try
        {
            const { id } = req.params;
            const { page = 1, limit = 20 } = req.query;

            logger.info('Fetching products by category', {
                categoryId: id,
                page,
                limit
            });

            const token = req.token || req.headers.authorization?.split(' ')[1];
            const products = await catalogService.getProductsByCategory(
                id,
                { page, limit },
                token
            );

            res.json(products);
        } catch (error)
        {
            logger.error('Failed to fetch products by category', {
                categoryId: req.params.id,
                error: error.message
            });
            next(error);
        }
    }
);

module.exports = router;
