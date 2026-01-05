const { createHttpClient, addAuthToken } = require('./httpClient');
const config = require('../config');

class OrderService
{
    constructor()
    {
        this.client = createHttpClient();
        this.baseUrl = config.services.order.baseUrl;
    }

    /**
     * Create a new order
     */
    async createOrder(orderData, token)
    {
        const requestConfig = {
            method: 'POST',
            url: `${this.baseUrl}${config.services.order.endpoints.orders}`,
            data: orderData,
        };

        const response = await this.client(addAuthToken(requestConfig, token));
        return response.data;
    }

    /**
     * Get order by ID
     */
    async getOrderById(orderId, token)
    {
        const requestConfig = {
            method: 'GET',
            url: `${this.baseUrl}${config.services.order.endpoints.orders}/${orderId}`,
        };

        const response = await this.client(addAuthToken(requestConfig, token));
        return response.data;
    }

    /**
     * Get all orders for a user
     */
    async getOrders(query = {}, token)
    {
        const requestConfig = {
            method: 'GET',
            url: `${this.baseUrl}${config.services.order.endpoints.orders}`,
            params: query,
        };

        const response = await this.client(addAuthToken(requestConfig, token));
        return response.data;
    }

    /**
     * Get order history
     */
    async getOrderHistory(token)
    {
        const requestConfig = {
            method: 'GET',
            url: `${this.baseUrl}${config.services.order.endpoints.history}`,
        };

        const response = await this.client(addAuthToken(requestConfig, token));
        return response.data;
    }

    /**
     * Cancel an order
     */
    async cancelOrder(orderId, token)
    {
        const requestConfig = {
            method: 'PUT',
            url: `${this.baseUrl}${config.services.order.endpoints.orders}/${orderId}/cancel`,
        };

        const response = await this.client(addAuthToken(requestConfig, token));
        return response.data;
    }

    /**
     * Get order status
     */
    async getOrderStatus(orderId, token)
    {
        const requestConfig = {
            method: 'GET',
            url: `${this.baseUrl}${config.services.order.endpoints.orders}/${orderId}/status`,
        };

        const response = await this.client(addAuthToken(requestConfig, token));
        return response.data;
    }

    /**
     * Update order status (admin)
     */
    async updateOrderStatus(orderId, status, token)
    {
        const requestConfig = {
            method: 'PATCH',
            url: `${this.baseUrl}${config.services.order.endpoints.orders}/${orderId}/status`,
            data: { status },
        };

        const response = await this.client(addAuthToken(requestConfig, token));
        return response.data;
    }
}

module.exports = new OrderService();
