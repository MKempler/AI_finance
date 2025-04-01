const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const aiService = require('../services/aiService');
const db = require('../config/database');

// Validation middleware
const validateTransactionAnalysis = [
    body('transactions').isArray().withMessage('Transactions must be an array'),
    body('transactions.*.amount').isFloat().withMessage('Transaction amount must be a number'),
    body('transactions.*.description').isString().withMessage('Transaction description must be a string'),
    body('transactions.*.date').isISO8601().withMessage('Transaction date must be valid')
];

// Get spending insights
router.get('/insights', async (req, res) => {
    try {
        // Get user's recent transactions
        db.all(
            `SELECT * FROM transactions 
             WHERE user_id = ? 
             AND date >= date('now', '-3 months')
             ORDER BY date DESC`,
            [req.user.id],
            async (err, transactions) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({
                        status: 'error',
                        message: 'Database error'
                    });
                }

                // Get AI insights
                const insights = await aiService.generateSpendingInsights(transactions);

                // Store insights in database
                db.run(
                    'INSERT INTO insights (user_id, insights, created_at) VALUES (?, ?, ?)',
                    [req.user.id, JSON.stringify(insights), new Date().toISOString()],
                    function(err) {
                        if (err) {
                            console.error('Database error:', err);
                        }

                        res.json({
                            status: 'success',
                            data: insights
                        });
                    }
                );
            }
        );
    } catch (error) {
        console.error('Error generating insights:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error'
        });
    }
});

// Get budget recommendations
router.get('/budget-recommendations', async (req, res) => {
    try {
        // Get user's current budgets and spending
        db.all(
            `SELECT b.*, 
                    COALESCE(SUM(t.amount), 0) as total_spent
             FROM budgets b
             LEFT JOIN transactions t ON t.category = b.category 
             AND t.date BETWEEN b.start_date AND COALESCE(b.end_date, date('now'))
             WHERE b.user_id = ?
             GROUP BY b.id`,
            [req.user.id],
            async (err, budgets) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({
                        status: 'error',
                        message: 'Database error'
                    });
                }

                // Get AI recommendations
                const recommendations = await aiService.generateBudgetRecommendations(budgets);

                res.json({
                    status: 'success',
                    data: recommendations
                });
            }
        );
    } catch (error) {
        console.error('Error generating budget recommendations:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error'
        });
    }
});

// Get goal recommendations
router.get('/goal-recommendations', async (req, res) => {
    try {
        // Get user's current goals
        db.all(
            'SELECT * FROM goals WHERE user_id = ?',
            [req.user.id],
            async (err, goals) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({
                        status: 'error',
                        message: 'Database error'
                    });
                }

                // Get AI recommendations
                const recommendations = await aiService.generateGoalRecommendations(goals);

                res.json({
                    status: 'success',
                    data: recommendations
                });
            }
        );
    } catch (error) {
        console.error('Error generating goal recommendations:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error'
        });
    }
});

// Analyze transactions
router.post('/analyze-transactions', validateTransactionAnalysis, async (req, res) => {
    try {
        // Validate request
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                status: 'error',
                errors: errors.array()
            });
        }

        const { transactions } = req.body;

        // Get AI analysis
        const analysis = await aiService.analyzeTransactions(transactions);

        res.json({
            status: 'success',
            data: analysis
        });
    } catch (error) {
        console.error('Error analyzing transactions:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error'
        });
    }
});

// Get personalized financial advice
router.get('/advice', async (req, res) => {
    try {
        // Get user's financial data
        const [transactions, budgets, goals] = await Promise.all([
            new Promise((resolve, reject) => {
                db.all(
                    `SELECT * FROM transactions 
                     WHERE user_id = ? 
                     AND date >= date('now', '-6 months')`,
                    [req.user.id],
                    (err, rows) => {
                        if (err) reject(err);
                        else resolve(rows);
                    }
                );
            }),
            new Promise((resolve, reject) => {
                db.all(
                    'SELECT * FROM budgets WHERE user_id = ?',
                    [req.user.id],
                    (err, rows) => {
                        if (err) reject(err);
                        else resolve(rows);
                    }
                );
            }),
            new Promise((resolve, reject) => {
                db.all(
                    'SELECT * FROM goals WHERE user_id = ?',
                    [req.user.id],
                    (err, rows) => {
                        if (err) reject(err);
                        else resolve(rows);
                    }
                );
            })
        ]);

        // Get AI advice
        const advice = await aiService.generatePersonalizedAdvice({
            transactions,
            budgets,
            goals
        });

        res.json({
            status: 'success',
            data: advice
        });
    } catch (error) {
        console.error('Error generating financial advice:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error'
        });
    }
});

module.exports = router; 