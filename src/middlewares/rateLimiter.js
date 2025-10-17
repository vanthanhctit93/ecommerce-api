import rateLimit from 'express-rate-limit';

/**
 * Standard rate limiter (cho các endpoints thông thường)
 */
export const standardLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: {
        status_code: 0,
        data: {
            error_code: 429,
            message: 'Quá nhiều requests, vui lòng thử lại sau'
        }
    },
    standardHeaders: true,
    legacyHeaders: false
});

/**
 * Auth limiter (nghiêm ngặt hơn cho login/register)
 */
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Only 5 attempts
    skipSuccessfulRequests: true, // Don't count successful requests
    message: {
        status_code: 0,
        data: {
            error_code: 429,
            message: 'Quá nhiều lần đăng nhập thất bại. Vui lòng thử lại sau 15 phút.'
        }
    }
});

/**
 * Payment limiter (rất nghiêm ngặt)
 */
export const paymentLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // Only 10 payment attempts per hour
    message: {
        status_code: 0,
        data: {
            error_code: 429,
            message: 'Quá nhiều lần thanh toán. Vui lòng thử lại sau 1 giờ.'
        }
    }
});

/**
 * API limiter (cho external APIs)
 */
export const apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 30, // 30 requests per minute
    message: {
        status_code: 0,
        data: {
            error_code: 429,
            message: 'Rate limit exceeded'
        }
    }
});