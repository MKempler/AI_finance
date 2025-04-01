// Response utility class
class Response {
    // Success response
    static success(data = null, message = 'Success', statusCode = 200) {
        return {
            success: true,
            message,
            data,
            statusCode
        };
    }

    // Error response
    static error(message = 'Error occurred', errors = null, statusCode = 500) {
        return {
            success: false,
            message,
            errors,
            statusCode
        };
    }

    // Pagination response
    static paginate(data, pagination, message = 'Success') {
        return {
            success: true,
            message,
            data,
            pagination,
            statusCode: 200
        };
    }

    // Validation error response
    static validationError(errors) {
        return {
            success: false,
            message: 'Validation failed',
            errors,
            statusCode: 400
        };
    }

    // Authentication error response
    static authError(message = 'Authentication failed') {
        return {
            success: false,
            message,
            statusCode: 401
        };
    }

    // Authorization error response
    static forbiddenError(message = 'Access forbidden') {
        return {
            success: false,
            message,
            statusCode: 403
        };
    }

    // Not found error response
    static notFoundError(message = 'Resource not found') {
        return {
            success: false,
            message,
            statusCode: 404
        };
    }

    // Conflict error response
    static conflictError(message = 'Resource already exists') {
        return {
            success: false,
            message,
            statusCode: 409
        };
    }

    // Rate limit error response
    static rateLimitError(message = 'Too many requests') {
        return {
            success: false,
            message,
            statusCode: 429
        };
    }

    // Server error response
    static serverError(message = 'Internal server error') {
        return {
            success: false,
            message,
            statusCode: 500
        };
    }

    // Service unavailable error response
    static serviceUnavailableError(message = 'Service temporarily unavailable') {
        return {
            success: false,
            message,
            statusCode: 503
        };
    }

    // Bad gateway error response
    static badGatewayError(message = 'Bad gateway') {
        return {
            success: false,
            message,
            statusCode: 502
        };
    }

    // Gateway timeout error response
    static gatewayTimeoutError(message = 'Gateway timeout') {
        return {
            success: false,
            message,
            statusCode: 504
        };
    }

    // Network error response
    static networkError(message = 'Network error') {
        return {
            success: false,
            message,
            statusCode: 503
        };
    }

    // Offline error response
    static offlineError(message = 'You are offline') {
        return {
            success: false,
            message,
            statusCode: 503
        };
    }

    // Sync error response
    static syncError(message = 'Sync failed', errors = null) {
        return {
            success: false,
            message,
            errors,
            statusCode: 503
        };
    }

    // AI service error response
    static aiServiceError(message = 'AI service error', errors = null) {
        return {
            success: false,
            message,
            errors,
            statusCode: 503
        };
    }

    // Database error response
    static databaseError(message = 'Database error', errors = null) {
        return {
            success: false,
            message,
            errors,
            statusCode: 500
        };
    }

    // File upload error response
    static fileUploadError(message = 'File upload failed', errors = null) {
        return {
            success: false,
            message,
            errors,
            statusCode: 400
        };
    }

    // Export error response
    static exportError(message = 'Export failed', errors = null) {
        return {
            success: false,
            message,
            errors,
            statusCode: 500
        };
    }

    // Notification error response
    static notificationError(message = 'Notification failed', errors = null) {
        return {
            success: false,
            message,
            errors,
            statusCode: 500
        };
    }

    // Cache error response
    static cacheError(message = 'Cache error', errors = null) {
        return {
            success: false,
            message,
            errors,
            statusCode: 500
        };
    }

    // Analytics error response
    static analyticsError(message = 'Analytics error', errors = null) {
        return {
            success: false,
            message,
            errors,
            statusCode: 500
        };
    }
}

// Export Response class
module.exports = Response; 