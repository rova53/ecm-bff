const logger = require('../config/logger');

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) =>
{
    // Log the error
    logger.error('Error occurred', {
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        ip: req.ip,
    });

    // Handle specific error types
    if (err.name === 'ValidationError')
    {
        return res.status(400).json({
            error: 'Validation Error',
            message: err.message,
            details: err.errors,
        });
    }

    if (err.name === 'UnauthorizedError')
    {
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'Invalid authentication credentials',
        });
    }

    // Axios errors (API calls to microservices)
    if (err.isAxiosError)
    {
        const status = err.response?.status || 500;
        const message = err.response?.data?.message || err.message;

        return res.status(status).json({
            error: 'Service Error',
            message: message,
            service: err.config?.url,
        });
    }

    // Default error response
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal server error';

    res.status(statusCode).json({
        error: 'Error',
        message: message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
};

/**
 * 404 Not Found handler
 */
const notFoundHandler = (req, res) =>
{
    logger.warn('Route not found', {
        path: req.path,
        method: req.method,
        ip: req.ip,
    });

    res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.path} not found`,
    });
};

module.exports = {
    errorHandler,
    notFoundHandler,
};
