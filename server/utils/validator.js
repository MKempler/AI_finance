const { body, validationResult } = require('express-validator');
const { isValidEmail, validatePassword } = require('./helpers');

// Validation middleware
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }
    next();
};

// Auth validation rules
const authValidation = {
    register: [
        body('name')
            .trim()
            .notEmpty()
            .withMessage('Name is required')
            .isLength({ min: 2, max: 50 })
            .withMessage('Name must be between 2 and 50 characters'),
        body('email')
            .trim()
            .notEmpty()
            .withMessage('Email is required')
            .isEmail()
            .withMessage('Invalid email format')
            .normalizeEmail(),
        body('password')
            .trim()
            .notEmpty()
            .withMessage('Password is required')
            .isLength({ min: 8 })
            .withMessage('Password must be at least 8 characters long')
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
            .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
        validate
    ],
    login: [
        body('email')
            .trim()
            .notEmpty()
            .withMessage('Email is required')
            .isEmail()
            .withMessage('Invalid email format')
            .normalizeEmail(),
        body('password')
            .trim()
            .notEmpty()
            .withMessage('Password is required'),
        validate
    ]
};

// Transaction validation rules
const transactionValidation = {
    create: [
        body('amount')
            .trim()
            .notEmpty()
            .withMessage('Amount is required')
            .isFloat({ min: 0 })
            .withMessage('Amount must be a positive number'),
        body('description')
            .trim()
            .notEmpty()
            .withMessage('Description is required')
            .isLength({ max: 200 })
            .withMessage('Description must not exceed 200 characters'),
        body('category')
            .trim()
            .notEmpty()
            .withMessage('Category is required')
            .isIn(['Food', 'Transportation', 'Housing', 'Utilities', 'Entertainment', 'Shopping', 'Healthcare', 'Education', 'Travel', 'Other'])
            .withMessage('Invalid category'),
        body('date')
            .trim()
            .notEmpty()
            .withMessage('Date is required')
            .isISO8601()
            .withMessage('Invalid date format'),
        validate
    ],
    update: [
        body('amount')
            .optional()
            .trim()
            .isFloat({ min: 0 })
            .withMessage('Amount must be a positive number'),
        body('description')
            .optional()
            .trim()
            .isLength({ max: 200 })
            .withMessage('Description must not exceed 200 characters'),
        body('category')
            .optional()
            .trim()
            .isIn(['Food', 'Transportation', 'Housing', 'Utilities', 'Entertainment', 'Shopping', 'Healthcare', 'Education', 'Travel', 'Other'])
            .withMessage('Invalid category'),
        body('date')
            .optional()
            .trim()
            .isISO8601()
            .withMessage('Invalid date format'),
        validate
    ]
};

// Budget validation rules
const budgetValidation = {
    create: [
        body('category')
            .trim()
            .notEmpty()
            .withMessage('Category is required')
            .isIn(['Food', 'Transportation', 'Housing', 'Utilities', 'Entertainment', 'Shopping', 'Healthcare', 'Education', 'Travel', 'Other'])
            .withMessage('Invalid category'),
        body('amount')
            .trim()
            .notEmpty()
            .withMessage('Amount is required')
            .isFloat({ min: 0 })
            .withMessage('Amount must be a positive number'),
        body('period')
            .trim()
            .notEmpty()
            .withMessage('Period is required')
            .isIn(['daily', 'weekly', 'monthly', 'yearly'])
            .withMessage('Invalid period'),
        validate
    ],
    update: [
        body('category')
            .optional()
            .trim()
            .isIn(['Food', 'Transportation', 'Housing', 'Utilities', 'Entertainment', 'Shopping', 'Healthcare', 'Education', 'Travel', 'Other'])
            .withMessage('Invalid category'),
        body('amount')
            .optional()
            .trim()
            .isFloat({ min: 0 })
            .withMessage('Amount must be a positive number'),
        body('period')
            .optional()
            .trim()
            .isIn(['daily', 'weekly', 'monthly', 'yearly'])
            .withMessage('Invalid period'),
        validate
    ]
};

// Goal validation rules
const goalValidation = {
    create: [
        body('name')
            .trim()
            .notEmpty()
            .withMessage('Name is required')
            .isLength({ max: 100 })
            .withMessage('Name must not exceed 100 characters'),
        body('target_amount')
            .trim()
            .notEmpty()
            .withMessage('Target amount is required')
            .isFloat({ min: 0 })
            .withMessage('Target amount must be a positive number'),
        body('current_amount')
            .trim()
            .notEmpty()
            .withMessage('Current amount is required')
            .isFloat({ min: 0 })
            .withMessage('Current amount must be a positive number'),
        body('deadline')
            .trim()
            .notEmpty()
            .withMessage('Deadline is required')
            .isISO8601()
            .withMessage('Invalid date format'),
        body('type')
            .trim()
            .notEmpty()
            .withMessage('Type is required')
            .isIn(['savings', 'debt', 'investment'])
            .withMessage('Invalid goal type'),
        validate
    ],
    update: [
        body('name')
            .optional()
            .trim()
            .isLength({ max: 100 })
            .withMessage('Name must not exceed 100 characters'),
        body('target_amount')
            .optional()
            .trim()
            .isFloat({ min: 0 })
            .withMessage('Target amount must be a positive number'),
        body('current_amount')
            .optional()
            .trim()
            .isFloat({ min: 0 })
            .withMessage('Current amount must be a positive number'),
        body('deadline')
            .optional()
            .trim()
            .isISO8601()
            .withMessage('Invalid date format'),
        body('type')
            .optional()
            .trim()
            .isIn(['savings', 'debt', 'investment'])
            .withMessage('Invalid goal type'),
        validate
    ]
};

// Export validation rules
module.exports = {
    authValidation,
    transactionValidation,
    budgetValidation,
    goalValidation
}; 