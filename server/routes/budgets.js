const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const aiService = require('../services/aiService');

// Validation middleware
const validateBudget = [
    body('category').trim().notEmpty().withMessage('Category is required'),
    body('amount').isFloat().withMessage('Amount must be a number'),
    body('period').isIn(['daily', 'weekly', 'monthly', 'yearly']).withMessage('Invalid period'),
    body('startDate').isISO8601().withMessage('Invalid start date'),
    body('endDate').optional().isISO8601().withMessage('Invalid end date')
];

// Get all budgets for the user
router.get('/', async (req, res) => {
    try {
        db.all(
            'SELECT * FROM budgets WHERE user_id = ? ORDER BY start_date DESC',
            [req.user.id],
            (err, budgets) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({
                        status: 'error',
                        message: 'Database error'
                    });
                }

                res.json({
                    status: 'success',
                    data: budgets
                });
            }
        );
    } catch (error) {
        console.error('Error fetching budgets:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error'
        });
    }
});

// Get budget progress
router.get('/:id/progress', async (req, res) => {
    try {
        const { id } = req.params;

        // Get budget details
        db.get(
            'SELECT * FROM budgets WHERE id = ? AND user_id = ?',
            [id, req.user.id],
            async (err, budget) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({
                        status: 'error',
                        message: 'Database error'
                    });
                }

                if (!budget) {
                    return res.status(404).json({
                        status: 'error',
                        message: 'Budget not found'
                    });
                }

                // Get transactions for this budget category within the period
                db.all(
                    `SELECT SUM(amount) as total_spent 
                     FROM transactions 
                     WHERE user_id = ? 
                     AND category = ? 
                     AND date BETWEEN ? AND ?`,
                    [req.user.id, budget.category, budget.start_date, budget.end_date || new Date().toISOString()],
                    (err, result) => {
                        if (err) {
                            console.error('Database error:', err);
                            return res.status(500).json({
                                status: 'error',
                                message: 'Database error'
                            });
                        }

                        const totalSpent = result[0].total_spent || 0;
                        const progress = (totalSpent / budget.amount) * 100;

                        res.json({
                            status: 'success',
                            data: {
                                budget,
                                total_spent: totalSpent,
                                progress: Math.min(progress, 100),
                                remaining: Math.max(budget.amount - totalSpent, 0)
                            }
                        });
                    }
                );
            }
        );
    } catch (error) {
        console.error('Error fetching budget progress:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error'
        });
    }
});

// Add a new budget
router.post('/', validateBudget, async (req, res) => {
    try {
        // Validate request
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                status: 'error',
                errors: errors.array()
            });
        }

        const { category, amount, period, startDate, endDate } = req.body;

        // Insert budget
        db.run(
            'INSERT INTO budgets (user_id, category, amount, period, start_date, end_date) VALUES (?, ?, ?, ?, ?, ?)',
            [req.user.id, category, amount, period, startDate, endDate],
            function(err) {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({
                        status: 'error',
                        message: 'Database error'
                    });
                }

                // Get the newly created budget
                db.get(
                    'SELECT * FROM budgets WHERE id = ?',
                    [this.lastID],
                    (err, budget) => {
                        if (err) {
                            console.error('Database error:', err);
                            return res.status(500).json({
                                status: 'error',
                                message: 'Database error'
                            });
                        }

                        res.status(201).json({
                            status: 'success',
                            data: budget
                        });
                    }
                );
            }
        );
    } catch (error) {
        console.error('Error adding budget:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error'
        });
    }
});

// Update a budget
router.put('/:id', validateBudget, async (req, res) => {
    try {
        // Validate request
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                status: 'error',
                errors: errors.array()
            });
        }

        const { id } = req.params;
        const { category, amount, period, startDate, endDate } = req.body;

        // Check if budget exists and belongs to user
        db.get(
            'SELECT * FROM budgets WHERE id = ? AND user_id = ?',
            [id, req.user.id],
            (err, budget) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({
                        status: 'error',
                        message: 'Database error'
                    });
                }

                if (!budget) {
                    return res.status(404).json({
                        status: 'error',
                        message: 'Budget not found'
                    });
                }

                // Update budget
                db.run(
                    'UPDATE budgets SET category = ?, amount = ?, period = ?, start_date = ?, end_date = ? WHERE id = ? AND user_id = ?',
                    [category, amount, period, startDate, endDate, id, req.user.id],
                    function(err) {
                        if (err) {
                            console.error('Database error:', err);
                            return res.status(500).json({
                                status: 'error',
                                message: 'Database error'
                            });
                        }

                        // Get the updated budget
                        db.get(
                            'SELECT * FROM budgets WHERE id = ?',
                            [id],
                            (err, updatedBudget) => {
                                if (err) {
                                    console.error('Database error:', err);
                                    return res.status(500).json({
                                        status: 'error',
                                        message: 'Database error'
                                    });
                                }

                                res.json({
                                    status: 'success',
                                    data: updatedBudget
                                });
                            }
                        );
                    }
                );
            }
        );
    } catch (error) {
        console.error('Error updating budget:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error'
        });
    }
});

// Delete a budget
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Check if budget exists and belongs to user
        db.get(
            'SELECT * FROM budgets WHERE id = ? AND user_id = ?',
            [id, req.user.id],
            (err, budget) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({
                        status: 'error',
                        message: 'Database error'
                    });
                }

                if (!budget) {
                    return res.status(404).json({
                        status: 'error',
                        message: 'Budget not found'
                    });
                }

                // Delete budget
                db.run(
                    'DELETE FROM budgets WHERE id = ? AND user_id = ?',
                    [id, req.user.id],
                    function(err) {
                        if (err) {
                            console.error('Database error:', err);
                            return res.status(500).json({
                                status: 'error',
                                message: 'Database error'
                            });
                        }

                        res.json({
                            status: 'success',
                            message: 'Budget deleted successfully'
                        });
                    }
                );
            }
        );
    } catch (error) {
        console.error('Error deleting budget:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error'
        });
    }
});

module.exports = router; 