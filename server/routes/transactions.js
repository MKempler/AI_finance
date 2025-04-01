const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const aiService = require('../services/aiService');

// Validation middleware
const validateTransaction = [
    body('amount').isFloat().withMessage('Amount must be a number'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('category').optional().isString().withMessage('Category must be a string'),
    body('date').optional().isISO8601().withMessage('Invalid date format')
];

// Get all transactions for the user
router.get('/', async (req, res) => {
    try {
        const transactions = await db.all(
            'SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC',
            [req.user.id]
        );

        res.json({
            status: 'success',
            data: transactions
        });
    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error'
        });
    }
});

// Add a new transaction
router.post('/', validateTransaction, async (req, res) => {
    try {
        // Validate request
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log('Validation errors:', errors.array());
            return res.status(400).json({
                status: 'error',
                errors: errors.array()
            });
        }

        const { amount, description, category, date } = req.body;
        console.log('Adding transaction:', { amount, description, category, date });

        // If category is not provided, use AI to categorize
        let finalCategory = category;
        if (!category) {
            finalCategory = await aiService.categorizeTransaction(description);
        }

        // Insert transaction
        const result = await db.run(
            'INSERT INTO transactions (user_id, amount, description, category, date) VALUES (?, ?, ?, ?, ?)',
            [req.user.id, amount, description, finalCategory, date]
        );

        // Get the newly created transaction
        const transaction = await db.get(
            'SELECT * FROM transactions WHERE id = ?',
            [result.lastID]
        );

        console.log('Transaction added successfully:', transaction);
        res.status(201).json({
            status: 'success',
            data: transaction
        });
    } catch (error) {
        console.error('Error adding transaction:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error'
        });
    }
});

// Update a transaction
router.put('/:id', validateTransaction, async (req, res) => {
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
        const { amount, description, category, date } = req.body;

        // Check if transaction exists and belongs to user
        const transaction = await db.get(
            'SELECT * FROM transactions WHERE id = ? AND user_id = ?',
            [id, req.user.id]
        );

        if (!transaction) {
            return res.status(404).json({
                status: 'error',
                message: 'Transaction not found'
            });
        }

        // If category is not provided, use AI to categorize
        let finalCategory = category;
        if (!category) {
            finalCategory = await aiService.categorizeTransaction(description);
        }

        // Update transaction
        await db.run(
            'UPDATE transactions SET amount = ?, description = ?, category = ?, date = ? WHERE id = ? AND user_id = ?',
            [amount, description, finalCategory, date, id, req.user.id]
        );

        // Get the updated transaction
        const updatedTransaction = await db.get(
            'SELECT * FROM transactions WHERE id = ?',
            [id]
        );

        res.json({
            status: 'success',
            data: updatedTransaction
        });
    } catch (error) {
        console.error('Error updating transaction:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error'
        });
    }
});

// Delete a transaction
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Check if transaction exists and belongs to user
        const transaction = await db.get(
            'SELECT * FROM transactions WHERE id = ? AND user_id = ?',
            [id, req.user.id]
        );

        if (!transaction) {
            return res.status(404).json({
                status: 'error',
                message: 'Transaction not found'
            });
        }

        // Delete transaction
        await db.run(
            'DELETE FROM transactions WHERE id = ? AND user_id = ?',
            [id, req.user.id]
        );

        res.json({
            status: 'success',
            message: 'Transaction deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting transaction:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error'
        });
    }
});

module.exports = router; 