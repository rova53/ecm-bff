require('dotenv').config();

const config = {
    // Server Configuration
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',

    // Gateway Configuration
    gateway: {
        url: process.env.GATEWAY_URL || 'http://localhost:5000',
        timeout: parseInt(process.env.API_TIMEOUT) || 30000,
        retryAttempts: parseInt(process.env.API_RETRY_ATTEMPTS) || 3,
        retryDelay: parseInt(process.env.API_RETRY_DELAY) || 1000,
    },

    // Service Endpoints (via Gateway)
    services: {
        catalog: {
            baseUrl: '/catalog',
            endpoints: {
                products: '/products',
                categories: '/categories',
            },
        },
        cart: {
            baseUrl: '/cart',
            endpoints: {
                items: '/items',
                checkout: '/checkout',
            },
        },
        order: {
            baseUrl: '/order',
            endpoints: {
                orders: '/orders',
                history: '/history',
            },
        },
        identity: {
            baseUrl: '/identity',
            endpoints: {
                login: '/auth/login',
                register: '/auth/register',
                refresh: '/auth/refresh',
                profile: '/profile',
            },
        },
        payment: {
            baseUrl: '/payment',
            endpoints: {
                process: '/process',
                status: '/status',
            },
        },
    },

    // JWT Configuration
    jwt: {
        secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
        expiresIn: process.env.JWT_EXPIRES_IN || '24h',
        cookieName: 'auth_token',
    },

    // Cookie Configuration
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // HTTPS only in production
        sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },

    // CORS Configuration
    cors: {
        origin: (origin, callback) =>
        {
            // Allow requests with no origin (mobile apps, Postman, curl, etc.)
            if (!origin) return callback(null, true);

            // Liste des origines autorisées en développement
            const allowedOrigins = [
                process.env.CORS_ORIGIN || 'http://localhost:5173',
                'http://localhost:4200',
                'http://localhost:3000'
            ];

            if (process.env.NODE_ENV === 'development' || allowedOrigins.includes(origin))
            {
                callback(null, true);
            } else
            {
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true,
        optionsSuccessStatus: 200,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    },

    // Rate Limiting Configuration
    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
        max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
        message: 'Too many requests from this IP, please try again later.',
    },

    // Logging Configuration
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        format: process.env.NODE_ENV === 'production' ? 'json' : 'simple',
    },
};

module.exports = config;
