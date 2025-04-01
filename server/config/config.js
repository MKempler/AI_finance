require('dotenv').config();

module.exports = {
    // Server configuration
    server: {
        port: process.env.PORT || 3000,
        env: process.env.NODE_ENV || 'development'
    },

    // Database configuration
    database: {
        path: process.env.DB_PATH || './data/finance_tracker.db'
    },

    // JWT configuration
    jwt: {
        secret: process.env.JWT_SECRET || 'your-secret-key',
        expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    },

    // OpenAI configuration
    openai: {
        apiKey: process.env.OPENAI_API_KEY || '',
        model: process.env.OPENAI_MODEL || 'text-davinci-003',
        maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS) || 1000,
        temperature: parseFloat(process.env.OPENAI_TEMPERATURE) || 0.7
    },

    // Security configuration
    security: {
        bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 10,
        corsOrigin: process.env.CORS_ORIGIN || '*',
        rateLimit: {
            windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15 minutes
            max: parseInt(process.env.RATE_LIMIT_MAX) || 100 // limit each IP to 100 requests per windowMs
        }
    },

    // Logging configuration
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        format: process.env.LOG_FORMAT || 'combined'
    },

    // Feature flags
    features: {
        enableBiometricAuth: process.env.ENABLE_BIOMETRIC_AUTH === 'true',
        enableOfflineMode: process.env.ENABLE_OFFLINE_MODE === 'true',
        enablePushNotifications: process.env.ENABLE_PUSH_NOTIFICATIONS === 'true',
        enableAIFeatures: process.env.ENABLE_AI_FEATURES === 'true'
    },

    // Getter for AI features flag
    get enableAIFeatures() {
        return this.features.enableAIFeatures && this.openai.apiKey !== '';
    },

    // Cache configuration
    cache: {
        enabled: process.env.ENABLE_CACHE === 'true',
        ttl: parseInt(process.env.CACHE_TTL) || 3600 // 1 hour
    },

    // Notification configuration
    notifications: {
        email: {
            enabled: process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true',
            smtpHost: process.env.SMTP_HOST,
            smtpPort: parseInt(process.env.SMTP_PORT),
            smtpUser: process.env.SMTP_USER,
            smtpPass: process.env.SMTP_PASS
        },
        push: {
            enabled: process.env.ENABLE_PUSH_NOTIFICATIONS === 'true',
            vapidPublicKey: process.env.VAPID_PUBLIC_KEY,
            vapidPrivateKey: process.env.VAPID_PRIVATE_KEY
        }
    },

    // Analytics configuration
    analytics: {
        enabled: process.env.ENABLE_ANALYTICS === 'true',
        trackingId: process.env.ANALYTICS_TRACKING_ID
    },

    // Export configuration
    export: {
        maxTransactions: parseInt(process.env.EXPORT_MAX_TRANSACTIONS) || 1000,
        supportedFormats: ['csv', 'json', 'pdf']
    }
}; 