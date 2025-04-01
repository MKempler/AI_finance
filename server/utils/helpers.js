const crypto = require('crypto');
const config = require('../config/config');

// Generate a random string of specified length
const generateRandomString = (length = 32) => {
    return crypto.randomBytes(length).toString('hex');
};

// Format currency amount
const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency
    }).format(amount);
};

// Format date
const formatDate = (date, format = 'YYYY-MM-DD') => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');

    return format
        .replace('YYYY', year)
        .replace('MM', month)
        .replace('DD', day)
        .replace('HH', hours)
        .replace('mm', minutes)
        .replace('ss', seconds);
};

// Calculate percentage
const calculatePercentage = (value, total) => {
    if (total === 0) return 0;
    return ((value / total) * 100).toFixed(2);
};

// Validate email format
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// Validate password strength
const validatePassword = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return (
        password.length >= minLength &&
        hasUpperCase &&
        hasLowerCase &&
        hasNumbers &&
        hasSpecialChar
    );
};

// Sanitize input string
const sanitizeInput = (input) => {
    if (typeof input !== 'string') return input;
    return input
        .trim()
        .replace(/[<>]/g, '')
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
};

// Generate pagination metadata
const generatePagination = (page, limit, total) => {
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
        page,
        limit,
        total,
        totalPages,
        hasNextPage,
        hasPrevPage,
        nextPage: hasNextPage ? page + 1 : null,
        prevPage: hasPrevPage ? page - 1 : null
    };
};

// Calculate date range
const calculateDateRange = (period = 'month') => {
    const now = new Date();
    let startDate = new Date();

    switch (period) {
        case 'week':
            startDate.setDate(now.getDate() - 7);
            break;
        case 'month':
            startDate.setMonth(now.getMonth() - 1);
            break;
        case 'year':
            startDate.setFullYear(now.getFullYear() - 1);
            break;
        case 'custom':
            // For custom range, return null to handle separately
            return null;
        default:
            startDate.setMonth(now.getMonth() - 1);
    }

    return {
        startDate: formatDate(startDate),
        endDate: formatDate(now)
    };
};

// Group transactions by category
const groupTransactionsByCategory = (transactions) => {
    return transactions.reduce((acc, transaction) => {
        const category = transaction.category || 'Uncategorized';
        if (!acc[category]) {
            acc[category] = {
                total: 0,
                count: 0,
                transactions: []
            };
        }
        acc[category].total += transaction.amount;
        acc[category].count += 1;
        acc[category].transactions.push(transaction);
        return acc;
    }, {});
};

// Calculate spending trends
const calculateSpendingTrends = (transactions) => {
    const groupedByMonth = transactions.reduce((acc, transaction) => {
        const month = formatDate(transaction.date, 'YYYY-MM');
        if (!acc[month]) {
            acc[month] = 0;
        }
        acc[month] += transaction.amount;
        return acc;
    }, {});

    const months = Object.keys(groupedByMonth).sort();
    const amounts = months.map(month => groupedByMonth[month]);

    return {
        months,
        amounts,
        trend: calculateTrend(amounts)
    };
};

// Calculate trend (positive/negative/neutral)
const calculateTrend = (values) => {
    if (values.length < 2) return 'neutral';
    
    const firstValue = values[0];
    const lastValue = values[values.length - 1];
    const difference = lastValue - firstValue;
    const percentageChange = (difference / firstValue) * 100;

    if (percentageChange > 5) return 'positive';
    if (percentageChange < -5) return 'negative';
    return 'neutral';
};

// Export helper functions
module.exports = {
    generateRandomString,
    formatCurrency,
    formatDate,
    calculatePercentage,
    isValidEmail,
    validatePassword,
    sanitizeInput,
    generatePagination,
    calculateDateRange,
    groupTransactionsByCategory,
    calculateSpendingTrends,
    calculateTrend
}; 