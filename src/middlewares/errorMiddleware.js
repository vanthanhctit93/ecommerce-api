const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);

    // ========================================
    // MONGOOSE VALIDATION ERROR
    // ========================================
    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(e => e.message);
        return res.status(400).json({
            status_code: 0,
            data: {
                error_code: 1,
                message: 'Validation failed',
                errors
            }
        });
    }

    // ========================================
    // MONGOOSE DUPLICATE KEY ERROR
    // ========================================
    if (err.code === 11000) {
        const field = Object.keys(err.keyPattern)[0];
        const value = err.keyValue[field];
        return res.status(400).json({
            status_code: 0,
            data: {
                error_code: 2,
                message: `${field} '${value}' đã tồn tại`
            }
        });
    }

    // ========================================
    // JWT ERRORS
    // ========================================
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            status_code: 0,
            data: {
                error_code: 3,
                message: 'Token không hợp lệ'
            }
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            status_code: 0,
            data: {
                error_code: 3,
                message: 'Token đã hết hạn'
            }
        });
    }

    // ========================================
    // MONGOOSE CAST ERROR (Invalid ObjectId)
    // ========================================
    if (err.name === 'CastError') {
        return res.status(400).json({
            status_code: 0,
            data: {
                error_code: 4,
                message: `ID không hợp lệ: ${err.value}`
            }
        });
    }

    // ========================================
    // MULTER FILE UPLOAD ERROR
    // ========================================
    if (err.name === 'MulterError') {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                status_code: 0,
                data: {
                    error_code: 5,
                    message: 'File quá lớn. Tối đa 5MB'
                }
            });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                status_code: 0,
                data: {
                    error_code: 5,
                    message: 'Quá nhiều files. Tối đa 10 files'
                }
            });
        }
    }

    // ========================================
    // STRIPE ERRORS
    // ========================================
    if (err.type === 'StripeCardError') {
        return res.status(400).json({
            status_code: 0,
            data: {
                error_code: 6,
                message: 'Thanh toán thất bại: ' + err.message
            }
        });
    }

    if (err.type === 'StripeInvalidRequestError') {
        return res.status(400).json({
            status_code: 0,
            data: {
                error_code: 6,
                message: 'Yêu cầu thanh toán không hợp lệ'
            }
        });
    }

    // ========================================
    // TIMEOUT ERROR
    // ========================================
    if (err.code === 'ETIMEDOUT' || err.message.includes('timeout')) {
        return res.status(408).json({
            status_code: 0,
            data: {
                error_code: 7,
                message: 'Request timeout'
            }
        });
    }

    // ========================================
    // DEFAULT ERROR
    // ========================================
    res.status(err.statusCode || 500).json({
        status_code: 0,
        data: {
            error_code: 0,
            message: err.message || 'Internal server error',
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
        }
    });
};

export default errorHandler;