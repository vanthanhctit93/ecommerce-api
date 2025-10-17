/**
 * Send success response
 * @param {Object} res - Express response object
 * @param {Object} data - Data to send
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code (default: 200)
 */
export const sendSuccess = (res, data, message = null, statusCode = 200) => {
    return res.status(statusCode).json({
        status_code: 1,
        data: {
            ...data,
            ...(message && { message })
        }
    });
};

/**
 * Send error response
 * @param {Object} res - Express response object
 * @param {number} errorCode - Application error code
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code (default: 400)
 */
export const sendError = (res, errorCode, message, statusCode = 400) => {
    return res.status(statusCode).json({
        status_code: 0,
        data: {
            error_code: errorCode,
            message
        }
    });
};

/**
 * Send not found response
 */
export const sendNotFound = (res, message = 'Resource not found') => {
    return sendError(res, 2, message, 404);
};

/**
 * Send unauthorized response
 */
export const sendUnauthorized = (res, message = 'Unauthorized') => {
    return sendError(res, 3, message, 403);
};

/**
 * Send validation error
 */
export const sendValidationError = (res, message) => {
    return sendError(res, 1, message, 400);
};

/**
 * Send server error
 */
export const sendServerError = (res, message = 'Internal server error') => {
    return sendError(res, 0, message, 500);
};