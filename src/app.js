const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const config = require('./config');
const logger = require('./config/logger');
const routes = require('./routes');
const mockRoutes = require('./routes/mock');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { generalLimiter } = require('./middleware/rateLimiter');
const requestLogger = require('./middleware/logger');

// Create Express app
const app = express();

// Vérifier si le mode mock est activé
const USE_MOCK_DATA = process.env.USE_MOCK_DATA === 'true';

// Trust proxy (for rate limiting and IP detection behind reverse proxy)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors(config.cors));

// Cookie parser middleware
app.use(cookieParser());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// HTTP request logging (Morgan)
if (config.nodeEnv === 'development')
{
    app.use(morgan('dev'));
} else
{
    app.use(morgan('combined'));
}

// Custom request logger
app.use(requestLogger);

// Rate limiting
app.use(generalLimiter);

// API routes - utiliser mock si activé, sinon routes normales
if (USE_MOCK_DATA)
{
    logger.info('🧪 Mock mode enabled - Using mock data instead of backend services');
    console.log('🧪 Mock mode enabled - Using mock data instead of backend services');
    app.use('/api', mockRoutes);
} else
{
    app.use('/api', routes);
}

// Root endpoint
app.get('/', (req, res) =>
{
    res.json({
        message: 'Ecom2Micro BFF API',
        version: '1.0.0',
        environment: config.nodeEnv,
        endpoints: {
            health: '/api/health',
            catalog: '/api/catalog',
            cart: '/api/cart',
            orders: '/api/orders',
            auth: '/api/auth',
            payment: '/api/payment',
        },
    });
});

// 404 handler (must be after all routes)
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

module.exports = app;
