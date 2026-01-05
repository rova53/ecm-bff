const app = require('./app');
const config = require('./config');
const logger = require('./config/logger');
const cache = require('./services/cache');
const fs = require('fs');
const path = require('path');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir))
{
    fs.mkdirSync(logsDir, { recursive: true });
}

// Initialize Redis cache
const initializeCache = async () =>
{
    const redisEnabled = process.env.REDIS_ENABLED !== 'false';

    if (redisEnabled)
    {
        try
        {
            await cache.connect();
            logger.info('Redis cache connected successfully');
            console.log('✅ Redis cache enabled');
        } catch (error)
        {
            logger.warn('Redis cache connection failed, continuing without cache', {
                error: error.message,
            });
            console.log('⚠️  Redis cache disabled (connection failed)');
        }
    } else
    {
        logger.info('Redis cache is disabled');
        console.log('ℹ️  Redis cache disabled by configuration');
    }
};

// Start server
const startServer = async () =>
{
    // Initialize cache
    await initializeCache();

    // Start HTTP server
    const server = app.listen(config.port, () =>
    {
        logger.info(`BFF Server started`, {
            port: config.port,
            environment: config.nodeEnv,
            gatewayUrl: config.gateway.url,
        });
        console.log(`\n🚀 Ecom2Micro BFF Server is running`);
        console.log(`📍 Port: ${config.port}`);
        console.log(`🌍 Environment: ${config.nodeEnv}`);
        console.log(`🔗 Gateway URL: ${config.gateway.url}`);
        console.log(`📊 Health Check: http://localhost:${config.port}/api/health`);
        console.log(`\n Available endpoints:`);
        console.log(`   - GET  /api/catalog/products`);
        console.log(`   - POST /api/auth/login`);
        console.log(`   - GET  /api/cart`);
        console.log(`   - GET  /api/orders`);
        console.log(`   - POST /api/payment/process\n`);
    });

    return server;
};

// Graceful shutdown
const gracefulShutdown = async (signal) =>
{
    logger.info(`${signal} signal received: closing HTTP server`);

    // Disconnect Redis
    try
    {
        await cache.disconnect();
        logger.info('Redis cache disconnected');
    } catch (error)
    {
        logger.error('Error disconnecting Redis', { error: error.message });
    }

    server.close(() =>
    {
        logger.info('HTTP server closed');
        process.exit(0);
    });

    // Force shutdown after 30s
    setTimeout(() =>
    {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
    }, 30000);
};

// Start the server
let server;
startServer()
    .then(s =>
    {
        server = s;
    })
    .catch(error =>
    {
        logger.error('Failed to start server', { error: error.message });
        process.exit(1);
    });

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));// Handle uncaught exceptions
process.on('uncaughtException', (error) =>
{
    logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
    gracefulShutdown('UNCAUGHT_EXCEPTION');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) =>
{
    logger.error('Unhandled Rejection', { reason, promise });
});

module.exports = server;
