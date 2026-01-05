const { createHttpClient, addAuthToken } = require('./httpClient');
const config = require('../config');

class CartService
{
    constructor()
    {
        this.client = createHttpClient();
        this.baseUrl = config.services.cart.baseUrl;
    }

    /**
     * Get cart items for a user
     */
    async getCart(token)
    {
        const requestConfig = {
            method: 'GET',
            url: `${this.baseUrl}${config.services.cart.endpoints.items}`,
        };

        const response = await this.client(addAuthToken(requestConfig, token));
        return response.data;
    }

    /**
     * Add item to cart
     */
    async addItem(itemData, token)
    {
        const requestConfig = {
            method: 'POST',
            url: `${this.baseUrl}${config.services.cart.endpoints.items}`,
            data: itemData,
        };

        const response = await this.client(addAuthToken(requestConfig, token));
        return response.data;
    }

    /**
     * Update cart item quantity
     */
    async updateItem(itemId, quantity, token)
    {
        const requestConfig = {
            method: 'PUT',
            url: `${this.baseUrl}${config.services.cart.endpoints.items}/${itemId}`,
            data: { quantity },
        };

        const response = await this.client(addAuthToken(requestConfig, token));
        return response.data;
    }

    /**
     * Remove item from cart
     */
    async removeItem(itemId, token)
    {
        const requestConfig = {
            method: 'DELETE',
            url: `${this.baseUrl}${config.services.cart.endpoints.items}/${itemId}`,
        };

        const response = await this.client(addAuthToken(requestConfig, token));
        return response.data;
    }

    /**
     * Clear cart
     */
    async clearCart(token)
    {
        const requestConfig = {
            method: 'DELETE',
            url: `${this.baseUrl}${config.services.cart.endpoints.items}`,
        };

        const response = await this.client(addAuthToken(requestConfig, token));
        return response.data;
    }

    /**
     * Checkout cart
     */
    async checkout(checkoutData, token)
    {
        const requestConfig = {
            method: 'POST',
            url: `${this.baseUrl}${config.services.cart.endpoints.checkout}`,
            data: checkoutData,
        };

        const response = await this.client(addAuthToken(requestConfig, token));
        return response.data;
    }
}

module.exports = new CartService();
