const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const aiService = require('../services/aiService');

// Validation middleware
const validateGoal = [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('targetAmount').isFloat().withMessage('Target amount must be a number'),
    body('currentAmount').isFloat().withMessage('Current amount must be a number'),
    body('deadline').isISO8601().withMessage('Invalid deadline date'),
    body('type').isIn(['savings', 'debt', 'investment']).withMessage('Invalid goal type'),
    body('description').optional().isString().withMessage('Description must be a string')
];

// Get all goals for the user
router.get('/', async (req, res) => {
    try {
        db.all(
            'SELECT * FROM goals WHERE user_id = ? ORDER BY deadline ASC',
            [req.user.id],
            (err, goals) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({
                        status: 'error',
                        message: 'Database error'
                    });
                }

                res.json({
                    status: 'success',
                    data: goals
                });
            }
        );
    } catch (error) {
        console.error('Error fetching goals:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error'
        });
    }
});

// Get goal progress
router.get('/:id/progress', async (req, res) => {
    try {
        const { id } = req.params;

        // Get goal details
        db.get(
            'SELECT * FROM goals WHERE id = ? AND user_id = ?',
            [id, req.user.id],
            async (err, goal) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({
                        status: 'error',
                        message: 'Database error'
                    });
                }

                if (!goal) {
                    return res.status(404).json({
                        status: 'error',
                        message: 'Goal not found'
                    });
                }

                // Calculate progress
                const progress = (goal.current_amount / goal.target_amount) * 100;
                const remaining = goal.target_amount - goal.current_amount;
                const daysLeft = Math.ceil((new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24));

                // Get AI recommendations if progress is low
                let recommendations = null;
                if (progress < 50 && daysLeft < 30) {
                    recommendations = await aiService.getGoalRecommendations(goal);
                }

                res.json({
                    status: 'success',
                    data: {
                        goal,
                        progress: Math.min(progress, 100),
                        remaining,
                        daysLeft: Math.max(daysLeft, 0),
                        recommendations
                    }
                });
            }
        );
    } catch (error) {
        console.error('Error fetching goal progress:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error'
        });
    }
});

// Add a new goal
router.post('/', validateGoal, async (req, res) => {
    try {
        // Validate request
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                status: 'error',
                errors: errors.array()
            });
        }

        const { name, targetAmount, currentAmount, deadline, type, description } = req.body;

        // Insert goal
        db.run(
            'INSERT INTO goals (user_id, name, target_amount, current_amount, deadline, type, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [req.user.id, name, targetAmount, currentAmount, deadline, type, description],
            function(err) {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({
                        status: 'error',
                        message: 'Database error'
                    });
                }

                // Get the newly created goal
                db.get(
                    'SELECT * FROM goals WHERE id = ?',
                    [this.lastID],
                    (err, goal) => {
                        if (err) {
                            console.error('Database error:', err);
                            return res.status(500).json({
                                status: 'error',
                                message: 'Database error'
                            });
                        }

                        res.status(201).json({
                            status: 'success',
                            data: goal
                        });
                    }
                );
            }
        );
    } catch (error) {
        console.error('Error adding goal:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error'
        });
    }
});

// Update a goal
router.put('/:id', validateGoal, async (req, res) => {
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
        const { name, targetAmount, currentAmount, deadline, type, description } = req.body;

        // Check if goal exists and belongs to user
        db.get(
            'SELECT * FROM goals WHERE id = ? AND user_id = ?',
            [id, req.user.id],
            (err, goal) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({
                        status: 'error',
                        message: 'Database error'
                    });
                }

                if (!goal) {
                    return res.status(404).json({
                        status: 'error',
                        message: 'Goal not found'
                    });
                }

                // Update goal
                db.run(
                    'UPDATE goals SET name = ?, target_amount = ?, current_amount = ?, deadline = ?, type = ?, description = ? WHERE id = ? AND user_id = ?',
                    [name, targetAmount, currentAmount, deadline, type, description, id, req.user.id],
                    function(err) {
                        if (err) {
                            console.error('Database error:', err);
                            return res.status(500).json({
                                status: 'error',
                                message: 'Database error'
                            });
                        }

                        // Get the updated goal
                        db.get(
                            'SELECT * FROM goals WHERE id = ?',
                            [id],
                            (err, updatedGoal) => {
                                if (err) {
                                    console.error('Database error:', err);
                                    return res.status(500).json({
                                        status: 'error',
                                        message: 'Database error'
                                    });
                                }

                                res.json({
                                    status: 'success',
                                    data: updatedGoal
                                });
                            }
                        );
                    }
                );
            }
        );
    } catch (error) {
        console.error('Error updating goal:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error'
        });
    }
});

// Delete a goal
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Check if goal exists and belongs to user
        db.get(
            'SELECT * FROM goals WHERE id = ? AND user_id = ?',
            [id, req.user.id],
            (err, goal) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({
                        status: 'error',
                        message: 'Database error'
                    });
                }

                if (!goal) {
                    return res.status(404).json({
                        status: 'error',
                        message: 'Goal not found'
                    });
                }

                // Delete goal
                db.run(
                    'DELETE FROM goals WHERE id = ? AND user_id = ?',
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
                            message: 'Goal deleted successfully'
                        });
                    }
                );
            }
        );
    } catch (error) {
        console.error('Error deleting goal:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error'
        });
    }
});

module.exports = router; 