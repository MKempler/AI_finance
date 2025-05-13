const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { db } = require('../db/database');
const aiService = require('../server/services/aiService');

// Validation middleware
const validateGoal = [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('target_amount').isFloat().withMessage('Target amount must be a number'),
    body('current_amount').isFloat().withMessage('Current amount must be a number'),
    body('deadline').isISO8601().withMessage('Invalid deadline date'),
    body('type').isIn(['savings', 'housing', 'travel', 'education', 'retirement', 'automobile', 'debt', 'other', 'investment']).withMessage('Invalid goal type'),
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

// Get a single goal by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`--- GET /api/goals/:id ---`);
        console.log(`Requested Goal ID (req.params.id):`, id, typeof id);
        console.log(`Authenticated User ID (req.user.id):`, req.user.id, typeof req.user.id);

        db.get(
            'SELECT * FROM goals WHERE id = ? AND user_id = ?',
            [id, req.user.id],
            (err, goal) => {
                if (err) {
                    console.error('Database error getting single goal:', err);
                    return res.status(500).json({
                        status: 'error',
                        message: 'Database error'
                    });
                }

                if (!goal) {
                    console.log(`Goal not found for ID: ${id} and User ID: ${req.user.id}`);
                    return res.status(404).json({
                        status: 'error',
                        message: 'Goal not found'
                    });
                }

                res.json({
                    status: 'success',
                    data: goal
                });
            }
        );
    } catch (error) {
        console.error('Error fetching single goal:', error);
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
        console.log(`--- GET /api/goals/:id/progress ---`);
        console.log(`Requested Goal ID (req.params.id):`, id, typeof id);
        console.log(`Authenticated User ID (req.user.id):`, req.user.id, typeof req.user.id);

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

        const { name, target_amount, current_amount, deadline, type, description } = req.body;

        // Insert goal
        db.run(
            'INSERT INTO goals (user_id, name, target_amount, current_amount, deadline, type, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [req.user.id, name, target_amount, current_amount, deadline, type, description],
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
        const { name, target_amount, current_amount, deadline, type, description } = req.body;

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
                    [name, target_amount, current_amount, deadline, type, description, id, req.user.id],
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

// Add a contribution to a goal
router.post('/:id/contributions', async (req, res) => {
    try {
        const { id } = req.params;
        const { amount, date, notes } = req.body;

        // Validate input
        if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
            return res.status(400).json({
                status: 'error',
                message: 'Valid contribution amount is required'
            });
        }

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

                // Insert contribution into contributions table 
                db.run(
                    'INSERT INTO goal_contributions (goal_id, user_id, amount, date, notes) VALUES (?, ?, ?, ?, ?)',
                    [id, req.user.id, parseFloat(amount), date || new Date().toISOString().split('T')[0], notes || ''],
                    function(err) {
                        if (err) {
                            console.error('Database error:', err);
                            return res.status(500).json({
                                status: 'error',
                                message: 'Database error'
                            });
                        }

                        // Update goal current amount
                        const newAmount = parseFloat(goal.current_amount) + parseFloat(amount);
                        
                        db.run(
                            'UPDATE goals SET current_amount = ? WHERE id = ?',
                            [newAmount, id],
                            function(err) {
                                if (err) {
                                    console.error('Database error:', err);
                                    return res.status(500).json({
                                        status: 'error',
                                        message: 'Database error'
                                    });
                                }

                                res.status(201).json({
                                    status: 'success',
                                    data: {
                                        id: this.lastID,
                                        goal_id: id,
                                        amount: parseFloat(amount),
                                        date: date || new Date().toISOString().split('T')[0],
                                        notes: notes || '',
                                        new_balance: newAmount
                                    }
                                });
                            }
                        );
                    }
                );
            }
        );
    } catch (error) {
        console.error('Error adding contribution:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error'
        });
    }
});

// Get contributions for a specific goal
router.get('/:id/contributions', async (req, res) => {
    try {
        const { id } = req.params;

        // First, check if the goal exists and belongs to the user
        db.get(
            'SELECT id FROM goals WHERE id = ? AND user_id = ?',
            [id, req.user.id],
            (err, goal) => {
                if (err) {
                    console.error('Database error checking goal existence:', err);
                    return res.status(500).json({
                        status: 'error',
                        message: 'Database error checking goal'
                    });
                }

                if (!goal) {
                    return res.status(404).json({
                        status: 'error',
                        message: 'Goal not found or does not belong to user'
                    });
                }

                // Goal exists, now fetch contributions
                db.all(
                    'SELECT * FROM goal_contributions WHERE goal_id = ? AND user_id = ? ORDER BY date DESC',
                    [id, req.user.id],
                    (err, contributions) => {
                        if (err) {
                            console.error('Database error fetching contributions:', err);
                            return res.status(500).json({
                                status: 'error',
                                message: 'Database error fetching contributions'
                            });
                        }

                        res.json({
                            status: 'success',
                            data: contributions
                        });
                    }
                );
            }
        );
    } catch (error) {
        console.error('Error fetching goal contributions:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error'
        });
    }
});

module.exports = router; 