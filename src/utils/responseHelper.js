/**
 * Send success response
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
 */
export const sendError = (res, errorCode, message, statusCode = 400, extraData = {}) => {
    return res.status(statusCode).json({
        status_code: 0,
        data: {
            error_code: errorCode,
            message,
            ...extraData
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
export const sendValidationError = (res, message, errors = null) => {
    return res.status(400).json({
        status_code: 0,
        data: {
            error_code: 1,
            message,
            ...(errors && { errors })
        }
    });
};

/**
 * Send server error
 */
export const sendServerError = (res, message = 'Internal server error') => {
    return sendError(res, 0, message, 500);
};