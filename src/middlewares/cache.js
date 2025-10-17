import { getCache, setCache, isRedisAvailable } from '../config/redis.js';

/**
 * Cache middleware for GET requests
 * @param {number} duration - Cache duration in seconds (default: 5 minutes)
 */
export const cacheMiddleware = (duration = 300) => {
    return async (req, res, next) => {
        // Only cache GET requests
        if (req.method !== 'GET') {
            return next();
        }

        // Skip if Redis not available
        if (!isRedisAvailable()) {
            console.warn('⚠️  Redis not available, skipping cache');
            return next();
        }

        // Generate cache key from URL and query params
        const cacheKey = `cache:${req.originalUrl}`;

        try {
            // Try to get from cache
            const cachedData = await getCache(cacheKey);
            
            if (cachedData) {
                console.log(`✅ Cache HIT: ${cacheKey}`);
                return res.json(cachedData);
            }

            console.log(`❌ Cache MISS: ${cacheKey}`);

            // Override res.json to cache the response
            const originalJson = res.json.bind(res);
            res.json = (body) => {
                // Only cache successful responses
                if (res.statusCode === 200 && body.status_code === 1) {
                    setCache(cacheKey, body, duration).catch(err => {
                        console.error('Failed to cache response:', err.message);
                    });
                }
                return originalJson(body);
            };

            next();
        } catch (error) {
            console.error('Cache middleware error:', error.message);
            next();
        }
    };
};

/**
 * Cache middleware for specific user
 */
export const userCacheMiddleware = (duration = 300) => {
    return async (req, res, next) => {
        if (req.method !== 'GET' || !req.user) {
            return next();
        }

        if (!isRedisAvailable()) {
            return next();
        }

        const cacheKey = `cache:user:${req.user._id}:${req.originalUrl}`;

        try {
            const cachedData = await getCache(cacheKey);
            
            if (cachedData) {
                console.log(`✅ User cache HIT: ${cacheKey}`);
                return res.json(cachedData);
            }

            const originalJson = res.json.bind(res);
            res.json = (body) => {
                if (res.statusCode === 200 && body.status_code === 1) {
                    setCache(cacheKey, body, duration);
                }
                return originalJson(body);
            };

            next();
        } catch (error) {
            console.error('User cache middleware error:', error.message);
            next();
        }
    };
};