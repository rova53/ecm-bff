const { createHttpClient, addAuthToken } = require('./httpClient');
const config = require('../config');

class PaymentService
{
    constructor()
    {
        this.client = createHttpClient();
        this.baseUrl = config.services.payment.baseUrl;
    }

    /**
     * Process a payment
     */
    async processPayment(paymentData, token)
    {
        const requestConfig = {
            method: 'POST',
            url: `${this.baseUrl}${config.services.payment.endpoints.process}`,
            data: paymentData,
        };

        const response = await this.client(addAuthToken(requestConfig, token));
        return response.data;
    }

    /**
     * Get payment status
     */
    async getPaymentStatus(paymentId, token)
    {
        const requestConfig = {
            method: 'GET',
            url: `${this.baseUrl}${config.services.payment.endpoints.status}/${paymentId}`,
        };

        const response = await this.client(addAuthToken(requestConfig, token));
        return response.data;
    }

    /**
     * Get payment history
     */
    async getPaymentHistory(query = {}, token)
    {
        const requestConfig = {
            method: 'GET',
            url: `${this.baseUrl}/payments`,
            params: query,
        };

        const response = await this.client(addAuthToken(requestConfig, token));
        return response.data;
    }

    /**
     * Refund a payment
     */
    async refundPayment(paymentId, refundData, token)
    {
        const requestConfig = {
            method: 'POST',
            url: `${this.baseUrl}/payments/${paymentId}/refund`,
            data: refundData,
        };

        const response = await this.client(addAuthToken(requestConfig, token));
        return response.data;
    }
}

module.exports = new PaymentService();
