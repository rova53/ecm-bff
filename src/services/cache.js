const redis = require('redis');
const logger = require('../config/logger');

class RedisCache
{
    constructor()
    {
        this.client = null;
        this.isConnected = false;
        this.defaultTTL = 300; // 5 minutes en secondes
    }

    /**
     * Initialize Redis connection
     */
    async connect()
    {
        try
        {
            this.client = redis.createClient({
                socket: {
                    host: process.env.REDIS_HOST || 'localhost',
                    port: process.env.REDIS_PORT || 6379,
                },
                password: process.env.REDIS_PASSWORD || undefined,
                database: process.env.REDIS_DB || 0,
            });

            this.client.on('error', (err) =>
            {
                logger.error('Redis Client Error', { error: err.message });
                this.isConnected = false;
            });

            this.client.on('connect', () =>
            {
                logger.info('Redis Client Connected');
                this.isConnected = true;
            });

            this.client.on('ready', () =>
            {
                logger.info('Redis Client Ready');
                this.isConnected = true;
            });

            this.client.on('reconnecting', () =>
            {
                logger.warn('Redis Client Reconnecting');
            });

            await this.client.connect();

            logger.info('Redis cache initialized successfully');
        } catch (error)
        {
            logger.error('Failed to connect to Redis', { error: error.message });
            this.isConnected = false;
            // Don't throw - allow app to continue without cache
        }
    }

    /**
     * Disconnect Redis
     */
    async disconnect()
    {
        if (this.client)
        {
            await this.client.quit();
            this.isConnected = false;
            logger.info('Redis client disconnected');
        }
    }

    /**
     * Get value from cache
     */
    async get(key)
    {
        if (!this.isConnected || !this.client)
        {
            return null;
        }

        try
        {
            const value = await this.client.get(key);
            if (value)
            {
                logger.debug('Cache HIT', { key });
                return JSON.parse(value);
            }
            logger.debug('Cache MISS', { key });
            return null;
        } catch (error)
        {
            logger.error('Redis GET error', { key, error: error.message });
            return null;
        }
    }

    /**
     * Set value in cache
     */
    async set(key, value, ttl = null)
    {
        if (!this.isConnected || !this.client)
        {
            return false;
        }

        try
        {
            const serialized = JSON.stringify(value);
            const expiration = ttl || this.defaultTTL;

            await this.client.setEx(key, expiration, serialized);
            logger.debug('Cache SET', { key, ttl: expiration });
            return true;
        } catch (error)
        {
            logger.error('Redis SET error', { key, error: error.message });
            return false;
        }
    }

    /**
     * Delete value from cache
     */
    async del(key)
    {
        if (!this.isConnected || !this.client)
        {
            return false;
        }

        try
        {
            await this.client.del(key);
            logger.debug('Cache DELETE', { key });
            return true;
        } catch (error)
        {
            logger.error('Redis DELETE error', { key, error: error.message });
            return false;
        }
    }

    /**
     * Delete multiple keys by pattern
     */
    async delPattern(pattern)
    {
        if (!this.isConnected || !this.client)
        {
            return false;
        }

        try
        {
            const keys = await this.client.keys(pattern);
            if (keys.length > 0)
            {
                await this.client.del(keys);
                logger.debug('Cache DELETE pattern', { pattern, count: keys.length });
            }
            return true;
        } catch (error)
        {
            logger.error('Redis DELETE pattern error', { pattern, error: error.message });
            return false;
        }
    }

    /**
     * Clear all cache
     */
    async flush()
    {
        if (!this.isConnected || !this.client)
        {
            return false;
        }

        try
        {
            await this.client.flushDb();
            logger.info('Cache FLUSHED');
            return true;
        } catch (error)
        {
            logger.error('Redis FLUSH error', { error: error.message });
            return false;
        }
    }

    /**
     * Generate cache key
     */
    generateKey(prefix, ...parts)
    {
        return `${prefix}:${parts.filter(p => p).join(':')}`;
    }

    /**
     * Cache wrapper for async functions
     */
    async wrap(key, fn, ttl = null)
    {
        // Try to get from cache
        const cached = await this.get(key);
        if (cached !== null)
        {
            return cached;
        }

        // Execute function and cache result
        const result = await fn();
        await this.set(key, result, ttl);
        return result;
    }
}

// Export singleton instance
const cacheInstance = new RedisCache();

module.exports = cacheInstance;
