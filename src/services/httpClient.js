const axios = require('axios');
const axiosRetry = require('axios-retry').default || require('axios-retry');
const config = require('../config');
const logger = require('../config/logger');

/**
 * Create a base HTTP client with retry logic
 */
const createHttpClient = () =>
{
    const client = axios.create({
        baseURL: config.gateway.url,
        timeout: config.gateway.timeout,
        headers: {
            'Content-Type': 'application/json',
        },
    });

    // Configure retry logic
    axiosRetry(client, {
        retries: config.gateway.retryAttempts,
        retryDelay: (retryCount) =>
        {
            logger.warn(`Retry attempt ${retryCount} for request`);
            return retryCount * config.gateway.retryDelay;
        },
        retryCondition: (error) =>
        {
            // Retry on network errors or 5xx status codes
            return (
                axiosRetry.isNetworkOrIdempotentRequestError(error) ||
                (error.response && error.response.status >= 500)
            );
        },
    });

    // Request interceptor
    client.interceptors.request.use(
        (config) =>
        {
            logger.debug('HTTP Request', {
                method: config.method,
                url: config.url,
                baseURL: config.baseURL,
            });
            return config;
        },
        (error) =>
        {
            logger.error('HTTP Request Error', { error: error.message });
            return Promise.reject(error);
        }
    );

    // Response interceptor
    client.interceptors.response.use(
        (response) =>
        {
            logger.debug('HTTP Response', {
                status: response.status,
                url: response.config.url,
            });
            return response;
        },
        (error) =>
        {
            logger.error('HTTP Response Error', {
                status: error.response?.status,
                url: error.config?.url,
                message: error.message,
                data: error.response?.data,
            });
            return Promise.reject(error);
        }
    );

    return client;
};

/**
 * Add authentication token to request
 */
const addAuthToken = (config, token) =>
{
    if (token)
    {
        config.headers = {
            ...config.headers,
            Authorization: `Bearer ${token}`,
        };
    }
    return config;
};

module.exports = {
    createHttpClient,
    addAuthToken,
};
