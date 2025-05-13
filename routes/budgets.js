const express = require('express');
const router = express.Router();
const { db } = require('../db/database');
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
        const budgets = await new Promise((resolve, reject) => {
            db.all('SELECT * FROM budgets WHERE user_id = ? ORDER BY category', [userId], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });

        // 2. For each budget, calculate the spent amount for the current period (assuming monthly for now)
        const budgetsWithSpent = await Promise.all(budgets.map(async (budget) => {
            // Determine start and end of the current month
            // TODO: Enhance this to handle different budget periods (yearly, quarterly) based on budget.period and budget.start_date
            const startOfMonth = moment().startOf('month').format('YYYY-MM-DD HH:mm:ss');
            const endOfMonth = moment().endOf('month').format('YYYY-MM-DD HH:mm:ss');

            const spentResult = await new Promise((resolve, reject) => {
                const sql = `
                    SELECT SUM(amount) as totalSpent 
                    FROM transactions 
                    WHERE user_id = ? 
                      AND category = ? 
                      AND type = 'expense' 
                      AND date BETWEEN ? AND ?`;
                db.get(sql, [userId, budget.category, startOfMonth, endOfMonth], (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });
            
            return {
                ...budget,
                spent: spentResult?.totalSpent || 0 // Add the spent amount
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
    // Basic Validations - adjust as needed
    body('category').notEmpty().withMessage('Category is required'),
    body('amount').isFloat({ gt: 0 }).withMessage('Amount must be a positive number'),
    body('period').isIn(['monthly', 'quarterly', 'yearly']).withMessage('Invalid period'),
    body('start_date').isISO8601().toDate().withMessage('Invalid start date')
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ status: 'error', errors: errors.array() });
    }

    const userId = req.user.id;
    const { category, amount, period, start_date, notes } = req.body;

    const sql = `INSERT INTO budgets (user_id, category, amount, period, start_date, notes) 
                 VALUES (?, ?, ?, ?, ?, ?)`;
    const params = [userId, category, amount, period, start_date, notes || null];

    db.run(sql, params, function (err) {
        if (err) {
            console.error('Error creating budget:', err);
            return res.status(500).json({ status: 'error', message: 'Failed to create budget' });
        }
        // Get the newly created budget and return it
        db.get('SELECT * FROM budgets WHERE id = ?', [this.lastID], (err, row) => {
             if (err) {
                 console.error('Error fetching created budget:', err);
                 // Still return success, but maybe without the full object
                 return res.status(201).json({ status: 'success', message: 'Budget created', id: this.lastID });
             }
             res.status(201).json({ status: 'success', data: row });
        });
    });
});

// --- PUT /api/budgets/:id - Update an existing budget ---
router.put('/:id', [
    // Similar validations as POST
    body('category').notEmpty().withMessage('Category is required'),
    body('amount').isFloat({ gt: 0 }).withMessage('Amount must be a positive number'),
    body('period').isIn(['monthly', 'quarterly', 'yearly']).withMessage('Invalid period'),
    body('start_date').isISO8601().toDate().withMessage('Invalid start date')
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ status: 'error', errors: errors.array() });
    }

    const userId = req.user.id;
    const budgetId = req.params.id;
    const { category, amount, period, start_date, notes } = req.body;
    const updatedAt = moment().format('YYYY-MM-DD HH:mm:ss'); // Update timestamp

    const sql = `UPDATE budgets 
                 SET category = ?, amount = ?, period = ?, start_date = ?, notes = ?, updated_at = ?
                 WHERE id = ? AND user_id = ?`;
    const params = [category, amount, period, start_date, notes || null, updatedAt, budgetId, userId];

    db.run(sql, params, function (err) {
        if (err) {
            console.error('Error updating budget:', err);
            return res.status(500).json({ status: 'error', message: 'Failed to update budget' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ status: 'error', message: 'Budget not found or user unauthorized' });
        }
         // Get the updated budget and return it
        db.get('SELECT * FROM budgets WHERE id = ?', [budgetId], (err, row) => {
             if (err) {
                 console.error('Error fetching updated budget:', err);
                 return res.status(200).json({ status: 'success', message: 'Budget updated', id: budgetId });
             }
             res.json({ status: 'success', data: row });
        });
    });
});

// --- DELETE /api/budgets/:id - Delete a budget ---
router.delete('/:id', (req, res) => {
    const userId = req.user.id;
    const budgetId = req.params.id;

    const sql = 'DELETE FROM budgets WHERE id = ? AND user_id = ?';
    
    db.run(sql, [budgetId, userId], function (err) {
        if (err) {
            console.error('Error deleting budget:', err);
            return res.status(500).json({ status: 'error', message: 'Failed to delete budget' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ status: 'error', message: 'Budget not found or user unauthorized' });
        }
        res.json({ status: 'success', message: 'Budget deleted successfully' });
    });
});


module.exports = router; 