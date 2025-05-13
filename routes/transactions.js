const express = require('express');
const router = express.Router();
const { db } = require('../db/database');
const { body, validationResult } = require('express-validator');
const authenticateToken = require('../middleware/auth');

// Middleware to ensure authentication
router.use(authenticateToken);

// GET all transactions for the logged-in user
router.get('/', (req, res) => {
    const userId = req.user.id;
    db.all('SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC', [userId], (err, rows) => {
        if (err) {
            console.error('Error fetching transactions:', err);
            return res.status(500).json({ status: 'error', message: 'Failed to fetch transactions' });
        }
        res.json({ status: 'success', data: rows });
    });
});

// POST create a new transaction
router.post('/',
    [
        body('date').notEmpty().withMessage('Date is required'),
        body('description').notEmpty().withMessage('Description is required'),
        body('amount').isNumeric().withMessage('Amount must be a number'),
        body('type').isIn(['income', 'expense']).withMessage('Type must be income or expense'),
        body('category').notEmpty().withMessage('Category is required')
    ],
    (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ status: 'error', message: errors.array()[0].msg });
        }
        const userId = req.user.id;
        const { date, description, amount, type, category, memo } = req.body;
        db.run(
            `INSERT INTO transactions (user_id, date, description, amount, type, category, memo) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [userId, date, description, amount, type, category, memo || null],
            function (err) {
                if (err) {
                    console.error('Error creating transaction:', err);
                    return res.status(500).json({ status: 'error', message: 'Failed to create transaction' });
                }
                db.get('SELECT * FROM transactions WHERE id = ?', [this.lastID], (err, row) => {
                    if (err) {
                        return res.status(201).json({ status: 'success', id: this.lastID });
                    }
                    res.status(201).json({ status: 'success', data: row });
                });
            }
        );
    }
);

// PUT update a transaction by id
router.put('/:id',
    [
        body('date').notEmpty().withMessage('Date is required'),
        body('description').notEmpty().withMessage('Description is required'),
        body('amount').isNumeric().withMessage('Amount must be a number'),
        body('type').isIn(['income', 'expense']).withMessage('Type must be income or expense'),
        body('category').notEmpty().withMessage('Category is required')
    ],
    (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ status: 'error', message: errors.array()[0].msg });
        }
        const userId = req.user.id;
        const { id } = req.params;
        const { date, description, amount, type, category, memo } = req.body;
        db.run(
            `UPDATE transactions SET date = ?, description = ?, amount = ?, type = ?, category = ?, memo = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?`,
            [date, description, amount, type, category, memo || null, id, userId],
            function (err) {
                if (err) {
                    console.error('Error updating transaction:', err);
                    return res.status(500).json({ status: 'error', message: 'Failed to update transaction' });
                }
                if (this.changes === 0) {
                    return res.status(404).json({ status: 'error', message: 'Transaction not found' });
                }
                db.get('SELECT * FROM transactions WHERE id = ?', [id], (err, row) => {
                    if (err) {
                        return res.json({ status: 'success' });
                    }
                    res.json({ status: 'success', data: row });
                });
            }
        );
    }
);

// DELETE a transaction by id
router.delete('/:id', (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;
    db.run('DELETE FROM transactions WHERE id = ? AND user_id = ?', [id, userId], function (err) {
        if (err) {
            console.error('Error deleting transaction:', err);
            return res.status(500).json({ status: 'error', message: 'Failed to delete transaction' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ status: 'error', message: 'Transaction not found' });
        }
        res.json({ status: 'success', message: 'Transaction deleted' });
    });
});

module.exports = router; 