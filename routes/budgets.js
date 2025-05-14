const express = require('express');
const router = express.Router();
// const { db } = require('../db/database'); // Old SQLite import
const { query } = require('../db/database'); // New PostgreSQL query function
const { body, validationResult } = require('express-validator');
const authenticateToken = require('../middleware/auth');
const moment = require('moment'); // Using moment for easier date calculations

// Middleware to ensure authentication
router.use(authenticateToken);

// --- GET /api/budgets - Get all budgets for the user with spent calculation ---
router.get('/', async (req, res) => {
    const userId = req.user.id;
    try {
        // 1. Get all budgets for the user
        const budgetResult = await query('SELECT * FROM budgets WHERE user_id = $1 ORDER BY category', [userId]);
        const budgets = budgetResult.rows;

        // 2. For each budget, calculate the spent amount for the current period
        const budgetsWithSpent = await Promise.all(budgets.map(async (budget) => {
            // Determine start and end of the current month for simplicity in this refactor.
            // TODO: Enhance to handle budget.period (monthly, quarterly, yearly) and budget.start_date accurately.
            const startOfMonth = moment(budget.start_date).startOf('month').format('YYYY-MM-DD');
            const endOfMonth = moment(budget.start_date).endOf('month').format('YYYY-MM-DD');

            const spentResult = await query(
                `SELECT SUM(amount) as totalSpent 
                 FROM transactions 
                 WHERE user_id = $1 
                   AND category = $2 
                   AND type = 'expense' 
                   AND date BETWEEN $3 AND $4`,
                [userId, budget.category, startOfMonth, endOfMonth]
            );
            
            return {
                ...budget,
                spent: parseFloat(spentResult.rows[0]?.totalspent) || 0 // totalspent is lowercase from pg
            };
        }));

        res.json({ status: 'success', data: budgetsWithSpent });
    } catch (err) {
        console.error('Error fetching budgets:', err);
        res.status(500).json({ status: 'error', message: 'Failed to fetch budgets' });
    }
});

// --- POST /api/budgets - Create a new budget ---
router.post('/', [
    body('category').notEmpty().withMessage('Category is required'),
    body('amount').isFloat({ gt: 0 }).withMessage('Amount must be a positive number'),
    body('period').isIn(['monthly', 'quarterly', 'yearly']).withMessage('Invalid period'),
    body('start_date').isISO8601().toDate().withMessage('Invalid start date format')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ status: 'error', errors: errors.array() });
    }

    const userId = req.user.id;
    const { category, amount, period, start_date, notes } = req.body;

    try {
        const result = await query(
            `INSERT INTO budgets (user_id, category, amount, period, start_date, notes) 
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [userId, category, amount, period, start_date, notes || null]
        );
        if (result.rows.length > 0) {
            res.status(201).json({ status: 'success', data: result.rows[0] });
        } else {
            console.error('Error creating budget: No rows returned');
            res.status(500).json({ status: 'error', message: 'Failed to create budget' });
        }
    } catch (err) {
        console.error('Error creating budget:', err);
        res.status(500).json({ status: 'error', message: 'Failed to create budget' });
    }
});

// --- PUT /api/budgets/:id - Update an existing budget ---
router.put('/:id', [
    body('category').notEmpty().withMessage('Category is required'),
    body('amount').isFloat({ gt: 0 }).withMessage('Amount must be a positive number'),
    body('period').isIn(['monthly', 'quarterly', 'yearly']).withMessage('Invalid period'),
    body('start_date').isISO8601().toDate().withMessage('Invalid start date format')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ status: 'error', errors: errors.array() });
    }

    const userId = req.user.id;
    const budgetId = req.params.id;
    const { category, amount, period, start_date, notes } = req.body;
    // updated_at will be handled by CURRENT_TIMESTAMP in SQL or DB default

    try {
        const result = await query(
            `UPDATE budgets 
             SET category = $1, amount = $2, period = $3, start_date = $4, notes = $5, updated_at = CURRENT_TIMESTAMP
             WHERE id = $6 AND user_id = $7 RETURNING *`,
            [category, amount, period, start_date, notes || null, budgetId, userId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ status: 'error', message: 'Budget not found or user unauthorized' });
        }
        res.json({ status: 'success', data: result.rows[0] });
    } catch (err) {
        console.error('Error updating budget:', err);
        res.status(500).json({ status: 'error', message: 'Failed to update budget' });
    }
});

// --- DELETE /api/budgets/:id - Delete a budget ---
router.delete('/:id', async (req, res) => {
    const userId = req.user.id;
    const budgetId = req.params.id;

    try {
        const result = await query('DELETE FROM budgets WHERE id = $1 AND user_id = $2', [budgetId, userId]);
        if (result.rowCount === 0) {
            return res.status(404).json({ status: 'error', message: 'Budget not found or user unauthorized' });
        }
        res.json({ status: 'success', message: 'Budget deleted successfully' });
    } catch (err) {
        console.error('Error deleting budget:', err);
        res.status(500).json({ status: 'error', message: 'Failed to delete budget' });
    }
});

module.exports = router; 