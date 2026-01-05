const { createHttpClient, addAuthToken } = require('./httpClient');
const config = require('../config');
const logger = require('../config/logger');

class CatalogService
{
    constructor()
    {
        this.client = createHttpClient();
        this.baseUrl = config.services.catalog.baseUrl;
    }

    /**
     * Get products with pagination and filters
     * @param {Object} filters - Filter options (page, limit, category, price range, search, sort)
     * @param {string} token - Optional auth token
     */
    async getProducts(filters = {}, token = null)
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
        } = filters;

        // Build query parameters
        const params = {
            page,
            limit,
            ...(category && { category }),
            ...(minPrice !== undefined && { minPrice }),
            ...(maxPrice !== undefined && { maxPrice }),
            ...(search && { search }),
            ...(sortBy && { sortBy }),
            ...(sortOrder && { sortOrder }),
        };

        logger.debug('Fetching products from Catalog.Service', { params });

        const requestConfig = {
            method: 'GET',
            url: `${this.baseUrl}${config.services.catalog.endpoints.products}`,
            params,
        };

        const response = await this.client(addAuthToken(requestConfig, token));
        return response.data;
    }

    /**
     * Get product by ID
     */
    async getProductById(productId, token = null)
    {
        logger.debug('Fetching product by ID from Catalog.Service', { productId });

        const requestConfig = {
            method: 'GET',
            url: `${this.baseUrl}${config.services.catalog.endpoints.products}/${productId}`,
        };

        const response = await this.client(addAuthToken(requestConfig, token));
        return response.data;
    }

    /**
     * Search products
     */
    async searchProducts(searchTerm, token = null)
    {
        logger.debug('Searching products in Catalog.Service', { searchTerm });

        const requestConfig = {
            method: 'GET',
            url: `${this.baseUrl}${config.services.catalog.endpoints.products}/search`,
            params: { q: searchTerm },
        };

        const response = await this.client(addAuthToken(requestConfig, token));
        return response.data;
    }

    /**
     * Get all categories
     */
    async getCategories(token = null)
    {
        logger.debug('Fetching categories from Catalog.Service');

        const requestConfig = {
            method: 'GET',
            url: `${this.baseUrl}${config.services.catalog.endpoints.categories}`,
        };

        const response = await this.client(addAuthToken(requestConfig, token));
        return response.data;
    }

    /**
     * Get category by ID
     */
    async getCategoryById(categoryId, token = null)
    {
        logger.debug('Fetching category by ID from Catalog.Service', { categoryId });

        const requestConfig = {
            method: 'GET',
            url: `${this.baseUrl}${config.services.catalog.endpoints.categories}/${categoryId}`,
        };

        const response = await this.client(addAuthToken(requestConfig, token));
        return response.data;
    }

    /**
     * Get products by category with pagination
     */
    async getProductsByCategory(categoryId, options = {}, token = null)
    {
        const { page = 1, limit = 20 } = options;

        logger.debug('Fetching products by category from Catalog.Service', {
            categoryId,
            page,
            limit
        });

        const requestConfig = {
            method: 'GET',
            url: `${this.baseUrl}${config.services.catalog.endpoints.products}`,
            params: {
                categoryId,
                page,
                limit,
            },
        };

        const response = await this.client(addAuthToken(requestConfig, token));
        return response.data;
    }
}

module.exports = new CatalogService();
