const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { query } = require('../db/database');
const aiService = require('../server/services/aiService');
const authenticateToken = require('../middleware/auth');

// Middleware to ensure authentication for all goal routes
router.use(authenticateToken);

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
        const result = await query('SELECT * FROM goals WHERE user_id = $1 ORDER BY deadline ASC', [req.user.id]);
        res.json({
            status: 'success',
            data: result.rows
        });
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

        const result = await query('SELECT * FROM goals WHERE id = $1 AND user_id = $2', [id, req.user.id]);

        if (result.rows.length === 0) {
            console.log(`Goal not found for ID: ${id} and User ID: ${req.user.id}`);
            return res.status(404).json({
                status: 'error',
                message: 'Goal not found'
            });
        }

        res.json({
            status: 'success',
            data: result.rows[0]
        });
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

        const goalResult = await query('SELECT * FROM goals WHERE id = $1 AND user_id = $2', [id, req.user.id]);

        if (goalResult.rows.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'Goal not found'
            });
        }
        const goal = goalResult.rows[0];

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
        const result = await query(
            'INSERT INTO goals (user_id, name, target_amount, current_amount, deadline, type, description) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [req.user.id, name, target_amount, current_amount, deadline, type, description]
        );

        if (result.rows.length > 0) {
            res.status(201).json({
                status: 'success',
                data: result.rows[0]
            });
        } else {
            console.error('Error creating goal: No rows returned');
            res.status(500).json({ status: 'error', message: 'Failed to create goal' });
        }
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
        const result = await query('SELECT * FROM goals WHERE id = $1 AND user_id = $2', [id, req.user.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ status: 'error', message: 'Goal not found or user unauthorized' });
        }

        // Update goal
        const updateResult = await query(
            'UPDATE goals SET name = $1, target_amount = $2, current_amount = $3, deadline = $4, type = $5, description = $6, updated_at = CURRENT_TIMESTAMP WHERE id = $7 AND user_id = $8 RETURNING *',
            [name, target_amount, current_amount, deadline, type, description, id, req.user.id]
        );

        if (updateResult.rowCount === 0) {
            return res.status(404).json({ status: 'error', message: 'Goal not found or user unauthorized' });
        }
        res.json({ status: 'success', data: updateResult.rows[0] });
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
        const result = await query('DELETE FROM goals WHERE id = $1 AND user_id = $2', [id, req.user.id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ status: 'error', message: 'Goal not found or user unauthorized' });
        }
        res.json({ status: 'success', message: 'Goal deleted successfully' });
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
        const goalResult = await query('SELECT * FROM goals WHERE id = $1 AND user_id = $2', [id, req.user.id]);
        if (goalResult.rows.length === 0) {
            return res.status(404).json({ status: 'error', message: 'Goal not found' });
        }
        const goal = goalResult.rows[0];

        // Insert contribution
        const contributionDate = date || new Date().toISOString().split('T')[0];
        const contributionNotes = notes || '';
        const contributionResult = await query(
            'INSERT INTO goal_contributions (goal_id, user_id, amount, date, notes) VALUES ($1, $2, $3, $4, $5) RETURNING id, amount, date, notes',
            [id, req.user.id, parseFloat(amount), contributionDate, contributionNotes]
        );

        if (contributionResult.rows.length === 0) {
            console.error('Error adding contribution: No rows returned from insert');
            return res.status(500).json({ status: 'error', message: 'Failed to add contribution' });
        }
        const newContribution = contributionResult.rows[0];

        // Update goal's current amount
        const newGoalAmount = parseFloat(goal.current_amount) + parseFloat(amount);
        const updateGoalResult = await query(
            'UPDATE goals SET current_amount = $1 WHERE id = $2 AND user_id = $3',
            [newGoalAmount, id, req.user.id]
        );

        if (updateGoalResult.rowCount === 0) {
            // This case should ideally be handled with a transaction to rollback the contribution
            console.error('Error updating goal amount after contribution. Contribution was made but goal not updated.');
            return res.status(500).json({ status: 'error', message: 'Failed to update goal amount. Contribution might be orphaned.' });
        }

        res.status(201).json({
            status: 'success',
            data: {
                id: newContribution.id,
                goal_id: id,
                amount: newContribution.amount,
                date: newContribution.date,
                notes: newContribution.notes,
                new_balance: newGoalAmount
            }
        });
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
        const goalCheckResult = await query('SELECT id FROM goals WHERE id = $1 AND user_id = $2', [id, req.user.id]);
        if (goalCheckResult.rows.length === 0) {
            return res.status(404).json({ status: 'error', message: 'Goal not found or does not belong to user' });
        }

        // Goal exists, now fetch contributions
        const contributionsResult = await query(
            'SELECT * FROM goal_contributions WHERE goal_id = $1 AND user_id = $2 ORDER BY date DESC',
            [id, req.user.id]
        );

        res.json({
            status: 'success',
            data: contributionsResult.rows
        });
    } catch (error) {
        console.error('Error fetching goal contributions:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error'
        });
    }
});

module.exports = router; 