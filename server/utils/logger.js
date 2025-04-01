const winston = require('winston');
const path = require('path');
const config = require('../config/config');

// Define log format
const logFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
);

// Create logger instance
const logger = winston.createLogger({
    level: config.logging.level,
    format: logFormat,
    transports: [
        // Write logs to console
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        }),
        // Write all logs to combined.log
        new winston.transports.File({
            filename: path.join(__dirname, '../../logs/combined.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 5
        }),
        // Write all logs error (and above) to error.log
        new winston.transports.File({
            filename: path.join(__dirname, '../../logs/error.log'),
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5
        })
    ]
});

// Create a stream object for Morgan integration
const stream = {
    write: (message) => {
        logger.info(message.trim());
    }
};

// Log levels
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4
};

// Log level colors
const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'white'
};

// Add colors to winston
winston.addColors(colors);

// Custom format for console output
const consoleFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
    winston.format.colorize({ all: true }),
    winston.format.printf(
        (info) => `${info.timestamp} ${info.level}: ${info.message}`
    )
);

// Create console transport with custom format
const consoleTransport = new winston.transports.Console({
    format: consoleFormat
});

// Add console transport to logger
logger.add(consoleTransport);

// Logging functions
const log = {
    // Error logging
    error: (message, meta = {}) => {
        logger.error(message, meta);
    },

    // Warning logging
    warn: (message, meta = {}) => {
        logger.warn(message, meta);
    },

    // Info logging
    info: (message, meta = {}) => {
        logger.info(message, meta);
    },

    // HTTP request logging
    http: (message, meta = {}) => {
        logger.http(message, meta);
    },

    // Debug logging
    debug: (message, meta = {}) => {
        logger.debug(message, meta);
    },

    // Request logging middleware
    requestLogger: (req, res, next) => {
        const start = Date.now();
        res.on('finish', () => {
            const duration = Date.now() - start;
            logger.http(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
        });
        next();
    },

    // Error logging middleware
    errorLogger: (err, req, res, next) => {
        logger.error(err.stack);
        next(err);
    },

    // Uncaught exception handler
    uncaughtException: (error) => {
        logger.error('Uncaught Exception:', error);
        process.exit(1);
    },

    // Unhandled rejection handler
    unhandledRejection: (reason, promise) => {
        logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
        process.exit(1);
    }
};

// Export logger and stream
module.exports = {
    logger,
    stream,
    log
}; 