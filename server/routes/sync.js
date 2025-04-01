const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const aiService = require('../services/aiService');

// Validation middleware
const validateSyncData = [
    body('transactions').isArray().withMessage('Transactions must be an array'),
    body('transactions.*.id').optional().isString().withMessage('Transaction ID must be a string'),
    body('transactions.*.amount').isFloat().withMessage('Transaction amount must be a number'),
    body('transactions.*.description').isString().withMessage('Transaction description must be a string'),
    body('transactions.*.category').isString().withMessage('Transaction category must be a string'),
    body('transactions.*.date').isISO8601().withMessage('Transaction date must be valid'),
    body('transactions.*.syncStatus').isIn(['pending', 'synced', 'failed']).withMessage('Invalid sync status')
];

// Sync offline transactions
router.post('/transactions', validateSyncData, async (req, res) => {
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
        const results = {
            success: [],
            failed: []
        };

        // Process each transaction
        for (const transaction of transactions) {
            try {
                // Check if transaction already exists
                db.get(
                    'SELECT id FROM transactions WHERE id = ? AND user_id = ?',
                    [transaction.id, req.user.id],
                    async (err, existing) => {
                        if (err) {
                            console.error('Database error:', err);
                            results.failed.push({
                                id: transaction.id,
                                error: 'Database error'
                            });
                            return;
                        }

                        if (existing) {
                            // Update existing transaction
                            db.run(
                                'UPDATE transactions SET amount = ?, description = ?, category = ?, date = ? WHERE id = ? AND user_id = ?',
                                [transaction.amount, transaction.description, transaction.category, transaction.date, transaction.id, req.user.id],
                                function(err) {
                                    if (err) {
                                        console.error('Database error:', err);
                                        results.failed.push({
                                            id: transaction.id,
                                            error: 'Update failed'
                                        });
                                    } else {
                                        results.success.push(transaction.id);
                                    }
                                }
                            );
                        } else {
                            // Insert new transaction
                            db.run(
                                'INSERT INTO transactions (id, user_id, amount, description, category, date) VALUES (?, ?, ?, ?, ?, ?)',
                                [transaction.id, req.user.id, transaction.amount, transaction.description, transaction.category, transaction.date],
                                function(err) {
                                    if (err) {
                                        console.error('Database error:', err);
                                        results.failed.push({
                                            id: transaction.id,
                                            error: 'Insert failed'
                                        });
                                    } else {
                                        results.success.push(transaction.id);
                                    }
                                }
                            );
                        }
                    }
                );
            } catch (error) {
                console.error('Error processing transaction:', error);
                results.failed.push({
                    id: transaction.id,
                    error: error.message
                });
            }
        }

        // Wait for all database operations to complete
        await new Promise(resolve => setTimeout(resolve, 1000));

        res.json({
            status: 'success',
            data: results
        });
    } catch (error) {
        console.error('Error syncing transactions:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error'
        });
    }
});

// Get sync status
router.get('/status', async (req, res) => {
    try {
        // Get pending transactions count
        db.get(
            'SELECT COUNT(*) as count FROM transactions WHERE user_id = ? AND sync_status = ?',
            [req.user.id, 'pending'],
            (err, result) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({
                        status: 'error',
                        message: 'Database error'
                    });
                }

                // Get last sync timestamp
                db.get(
                    'SELECT MAX(updated_at) as last_sync FROM transactions WHERE user_id = ?',
                    [req.user.id],
                    (err, syncResult) => {
                        if (err) {
                            console.error('Database error:', err);
                            return res.status(500).json({
                                status: 'error',
                                message: 'Database error'
                            });
                        }

                        res.json({
                            status: 'success',
                            data: {
                                pendingTransactions: result.count,
                                lastSync: syncResult.last_sync,
                                syncStatus: result.count > 0 ? 'pending' : 'synced'
                            }
                        });
                    }
                );
            }
        );
    } catch (error) {
        console.error('Error getting sync status:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error'
        });
    }
});

// Resolve sync conflicts
router.post('/resolve-conflicts', async (req, res) => {
    try {
        const { conflicts } = req.body;

        if (!Array.isArray(conflicts)) {
            return res.status(400).json({
                status: 'error',
                message: 'Conflicts must be an array'
            });
        }

        const results = {
            resolved: [],
            failed: []
        };

        for (const conflict of conflicts) {
            try {
                const { id, resolution } = conflict;

                // Validate resolution
                if (!['server', 'client', 'merge'].includes(resolution)) {
                    results.failed.push({
                        id,
                        error: 'Invalid resolution type'
                    });
                    continue;
                }

                // Get server and client versions
                db.get(
                    'SELECT * FROM transactions WHERE id = ? AND user_id = ?',
                    [id, req.user.id],
                    async (err, serverVersion) => {
                        if (err) {
                            console.error('Database error:', err);
                            results.failed.push({
                                id,
                                error: 'Database error'
                            });
                            return;
                        }

                        if (!serverVersion) {
                            results.failed.push({
                                id,
                                error: 'Transaction not found'
                            });
                            return;
                        }

                        // Apply resolution
                        switch (resolution) {
                            case 'server':
                                // Keep server version
                                results.resolved.push(id);
                                break;

                            case 'client':
                                // Update with client version
                                db.run(
                                    'UPDATE transactions SET amount = ?, description = ?, category = ?, date = ?, sync_status = ? WHERE id = ? AND user_id = ?',
                                    [conflict.amount, conflict.description, conflict.category, conflict.date, 'synced', id, req.user.id],
                                    function(err) {
                                        if (err) {
                                            console.error('Database error:', err);
                                            results.failed.push({
                                                id,
                                                error: 'Update failed'
                                            });
                                        } else {
                                            results.resolved.push(id);
                                        }
                                    }
                                );
                                break;

                            case 'merge':
                                // Merge both versions
                                const mergedData = {
                                    amount: Math.max(serverVersion.amount, conflict.amount),
                                    description: conflict.description || serverVersion.description,
                                    category: conflict.category || serverVersion.category,
                                    date: new Date(Math.max(new Date(serverVersion.date), new Date(conflict.date))).toISOString()
                                };

                                db.run(
                                    'UPDATE transactions SET amount = ?, description = ?, category = ?, date = ?, sync_status = ? WHERE id = ? AND user_id = ?',
                                    [mergedData.amount, mergedData.description, mergedData.category, mergedData.date, 'synced', id, req.user.id],
                                    function(err) {
                                        if (err) {
                                            console.error('Database error:', err);
                                            results.failed.push({
                                                id,
                                                error: 'Merge failed'
                                            });
                                        } else {
                                            results.resolved.push(id);
                                        }
                                    }
                                );
                                break;
                        }
                    }
                );
            } catch (error) {
                console.error('Error resolving conflict:', error);
                results.failed.push({
                    id: conflict.id,
                    error: error.message
                });
            }
        }

        // Wait for all database operations to complete
        await new Promise(resolve => setTimeout(resolve, 1000));

        res.json({
            status: 'success',
            data: results
        });
    } catch (error) {
        console.error('Error resolving conflicts:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error'
        });
    }
});

module.exports = router; 