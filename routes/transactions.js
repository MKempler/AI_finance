const express = require('express');
const router = express.Router();
// const { db } = require('../db/database'); // Old SQLite import
const { query } = require('../db/database'); // New PostgreSQL query function
const { body, validationResult } = require('express-validator');
const authenticateToken = require('../middleware/auth');

// Middleware to ensure authentication
router.use(authenticateToken);

// GET all transactions for the logged-in user
router.get('/', async (req, res) => {
    const userId = req.user.id;
    try {
        const result = await query('SELECT * FROM transactions WHERE user_id = $1 ORDER BY date DESC', [userId]);
        res.json({ status: 'success', data: result.rows });
    } catch (err) {
        console.error('Error fetching transactions:', err);
        res.status(500).json({ status: 'error', message: 'Failed to fetch transactions' });
    }
});

// POST create a new transaction
router.post('/',
    [
        body('date').notEmpty().withMessage('Date is required').isISO8601().toDate().withMessage('Invalid date format'),
        body('description').notEmpty().withMessage('Description is required'),
        body('amount').isNumeric().withMessage('Amount must be a number'),
        body('type').isIn(['income', 'expense']).withMessage('Type must be income or expense'),
        body('category').notEmpty().withMessage('Category is required')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ status: 'error', message: errors.array()[0].msg });
        }
        const userId = req.user.id;
        const { date, description, amount, type, category, memo } = req.body;
        try {
            const result = await query(
                `INSERT INTO transactions (user_id, date, description, amount, type, category, memo)
                 VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
                [userId, date, description, amount, type, category, memo || null]
            );
            if (result.rows.length > 0) {
                res.status(201).json({ status: 'success', data: result.rows[0] });
            } else {
                console.error('Error creating transaction: No rows returned');
                res.status(500).json({ status: 'error', message: 'Failed to create transaction' });
            }
        } catch (err) {
            console.error('Error creating transaction:', err);
            res.status(500).json({ status: 'error', message: 'Failed to create transaction' });
        }
    }
);

// PUT update a transaction by id
router.put('/:id',
    [
        body('date').notEmpty().withMessage('Date is required').isISO8601().toDate().withMessage('Invalid date format'),
        body('description').notEmpty().withMessage('Description is required'),
        body('amount').isNumeric().withMessage('Amount must be a number'),
        body('type').isIn(['income', 'expense']).withMessage('Type must be income or expense'),
        body('category').notEmpty().withMessage('Category is required')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ status: 'error', message: errors.array()[0].msg });
        }
        const userId = req.user.id;
        const { id } = req.params;
        const { date, description, amount, type, category, memo } = req.body;
        try {
            const result = await query(
                `UPDATE transactions 
                 SET date = $1, description = $2, amount = $3, type = $4, category = $5, memo = $6, updated_at = CURRENT_TIMESTAMP 
                 WHERE id = $7 AND user_id = $8 RETURNING *`,
                [date, description, amount, type, category, memo || null, id, userId]
            );
            if (result.rowCount === 0) {
                return res.status(404).json({ status: 'error', message: 'Transaction not found or not authorized to update' });
            }
            res.json({ status: 'success', data: result.rows[0] });
        } catch (err) {
            console.error('Error updating transaction:', err);
            res.status(500).json({ status: 'error', message: 'Failed to update transaction' });
        }
    }
);

// DELETE a transaction by id
router.delete('/:id', async (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;
    try {
        const result = await query('DELETE FROM transactions WHERE id = $1 AND user_id = $2', [id, userId]);
        if (result.rowCount === 0) {
            return res.status(404).json({ status: 'error', message: 'Transaction not found or not authorized to delete' });
        }
        res.json({ status: 'success', message: 'Transaction deleted' });
    } catch (err) {
        console.error('Error deleting transaction:', err);
        res.status(500).json({ status: 'error', message: 'Failed to delete transaction' });
    }
});

module.exports = router; 