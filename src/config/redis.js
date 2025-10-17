import Redis from 'ioredis';

let redis = null;

try {
    redis = process.env.REDIS_URL 
        ? new Redis(process.env.REDIS_URL)
        : new Redis({
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT) || 6379,
            password: process.env.REDIS_PASSWORD || undefined,
            retryStrategy: (times) => {
                const delay = Math.min(times * 50, 2000);
                return delay;
            },
            maxRetriesPerRequest: 3,
            enableReadyCheck: true,
            lazyConnect: true
        });

    // Event listeners
    redis.on('connect', () => {
        console.log('Redis connecting...');
    });

    redis.on('ready', () => {
        console.log('Redis connected and ready!');
    });

    redis.on('error', (err) => {
        console.error('Redis error:', err.message);
    });

    redis.on('close', () => {
        console.log('Redis connection closed');
    });

    // Connect
    redis.connect().catch(err => {
        console.error('Redis connection failed:', err.message);
        redis = null;
    });

} catch (error) {
    console.error('Redis initialization failed:', error.message);
    redis = null;
}

/**
 * Helper: Get with fallback
 */
export async function getCache(key) {
    if (!redis) return null;
    
    try {
        const data = await redis.get(key);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error('Cache get error:', error.message);
        return null;
    }
}

/**
 * Helper: Set with TTL
 */
export async function setCache(key, value, ttl = 300) {
    if (!redis) return false;
    
    try {
        await redis.setex(key, ttl, JSON.stringify(value));
        return true;
    } catch (error) {
        console.error('Cache set error:', error.message);
        return false;
    }
}

/**
 * Helper: Delete cache
 */
export async function deleteCache(key) {
    if (!redis) return false;
    
    try {
        await redis.del(key);
        return true;
    } catch (error) {
        console.error('Cache delete error:', error.message);
        return false;
    }
}

/**
 * Helper: Delete pattern
 */
export async function deleteCachePattern(pattern) {
    if (!redis) return false;
    
    try {
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
            await redis.del(...keys);
        }
        return true;
    } catch (error) {
        console.error('Cache delete pattern error:', error.message);
        return false;
    }
}

/**
 * Helper: Check if Redis is available
 */
export function isRedisAvailable() {
    return redis !== null && redis.status === 'ready';
}

export default redis;