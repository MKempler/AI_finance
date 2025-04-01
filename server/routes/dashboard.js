const express = require('express');
const router = express.Router();
const db = require('../config/database');
const aiService = require('../services/aiService');

// Get dashboard overview
router.get('/overview', async (req, res) => {
    try {
        // Get user's financial data
        const [transactions, budgets, goals] = await Promise.all([
            new Promise((resolve, reject) => {
                db.all(
                    `SELECT * FROM transactions 
                     WHERE user_id = ? 
                     AND date >= date('now', '-30 days')`,
                    [req.user.id],
                    (err, rows) => {
                        if (err) reject(err);
                        else resolve(rows);
                    }
                );
            }),
            new Promise((resolve, reject) => {
                db.all(
                    'SELECT * FROM budgets WHERE user_id = ?',
                    [req.user.id],
                    (err, rows) => {
                        if (err) reject(err);
                        else resolve(rows);
                    }
                );
            }),
            new Promise((resolve, reject) => {
                db.all(
                    'SELECT * FROM goals WHERE user_id = ?',
                    [req.user.id],
                    (err, rows) => {
                        if (err) reject(err);
                        else resolve(rows);
                    }
                );
            })
        ]);

        // Calculate overview statistics
        const totalSpent = transactions.reduce((sum, t) => sum + t.amount, 0);
        const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
        const totalGoals = goals.reduce((sum, g) => sum + g.target_amount, 0);
        const totalProgress = goals.reduce((sum, g) => sum + g.current_amount, 0);

        // Get spending by category
        const spendingByCategory = transactions.reduce((acc, t) => {
            acc[t.category] = (acc[t.category] || 0) + t.amount;
            return acc;
        }, {});

        // Get recent insights
        db.get(
            `SELECT insights FROM insights 
             WHERE user_id = ? 
             ORDER BY created_at DESC 
             LIMIT 1`,
            [req.user.id],
            async (err, result) => {
                if (err) {
                    console.error('Database error:', err);
                }

                const insights = result ? JSON.parse(result.insights) : null;

                // Get AI recommendations if needed
                let recommendations = null;
                if (totalSpent > totalBudget * 0.8) {
                    recommendations = await aiService.generateBudgetRecommendations(budgets);
                }

                res.json({
                    status: 'success',
                    data: {
                        summary: {
                            totalSpent,
                            totalBudget,
                            totalGoals,
                            totalProgress,
                            budgetUtilization: (totalSpent / totalBudget) * 100,
                            goalProgress: (totalProgress / totalGoals) * 100
                        },
                        spendingByCategory,
                        recentTransactions: transactions.slice(0, 5),
                        activeBudgets: budgets.filter(b => !b.end_date || new Date(b.end_date) > new Date()),
                        activeGoals: goals.filter(g => new Date(g.deadline) > new Date()),
                        insights,
                        recommendations
                    }
                });
            }
        );
    } catch (error) {
        console.error('Error fetching dashboard overview:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error'
        });
    }
});

// Get spending trends
router.get('/trends', async (req, res) => {
    try {
        // Get monthly spending for the last 6 months
        db.all(
            `SELECT strftime('%Y-%m', date) as month,
                    SUM(amount) as total_spent,
                    COUNT(*) as transaction_count
             FROM transactions
             WHERE user_id = ?
             AND date >= date('now', '-6 months')
             GROUP BY month
             ORDER BY month DESC`,
            [req.user.id],
            (err, monthlyTrends) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({
                        status: 'error',
                        message: 'Database error'
                    });
                }

                // Get category trends
                db.all(
                    `SELECT category,
                            strftime('%Y-%m', date) as month,
                            SUM(amount) as total_spent
                     FROM transactions
                     WHERE user_id = ?
                     AND date >= date('now', '-6 months')
                     GROUP BY category, month
                     ORDER BY month DESC, total_spent DESC`,
                    [req.user.id],
                    (err, categoryTrends) => {
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
                                monthlyTrends,
                                categoryTrends
                            }
                        });
                    }
                );
            }
        );
    } catch (error) {
        console.error('Error fetching spending trends:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error'
        });
    }
});

// Get budget status
router.get('/budget-status', async (req, res) => {
    try {
        // Get budgets with current spending
        db.all(
            `SELECT b.*,
                    COALESCE(SUM(t.amount), 0) as total_spent,
                    COUNT(t.id) as transaction_count
             FROM budgets b
             LEFT JOIN transactions t ON t.category = b.category 
             AND t.date BETWEEN b.start_date AND COALESCE(b.end_date, date('now'))
             WHERE b.user_id = ?
             GROUP BY b.id`,
            [req.user.id],
            (err, budgets) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({
                        status: 'error',
                        message: 'Database error'
                    });
                }

                // Calculate budget status
                const budgetStatus = budgets.map(budget => ({
                    ...budget,
                    progress: (budget.total_spent / budget.amount) * 100,
                    remaining: budget.amount - budget.total_spent,
                    status: budget.total_spent > budget.amount ? 'over' : 
                           budget.total_spent > budget.amount * 0.8 ? 'warning' : 'good'
                }));

                res.json({
                    status: 'success',
                    data: budgetStatus
                });
            }
        );
    } catch (error) {
        console.error('Error fetching budget status:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error'
        });
    }
});

// Get goal progress
router.get('/goal-progress', async (req, res) => {
    try {
        // Get all goals
        db.all(
            'SELECT * FROM goals WHERE user_id = ?',
            [req.user.id],
            async (err, goals) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({
                        status: 'error',
                        message: 'Database error'
                    });
                }

                // Calculate goal progress
                const goalProgress = goals.map(goal => ({
                    ...goal,
                    progress: (goal.current_amount / goal.target_amount) * 100,
                    remaining: goal.target_amount - goal.current_amount,
                    daysLeft: Math.ceil((new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24)),
                    status: goal.current_amount >= goal.target_amount ? 'completed' :
                           new Date(goal.deadline) < new Date() ? 'overdue' :
                           goal.current_amount / goal.target_amount > 0.8 ? 'on-track' : 'in-progress'
                }));

                // Get AI recommendations for goals that need attention
                const goalsNeedingAttention = goalProgress.filter(g => 
                    g.status === 'overdue' || 
                    (g.status === 'in-progress' && g.daysLeft < 30)
                );

                let recommendations = null;
                if (goalsNeedingAttention.length > 0) {
                    recommendations = await aiService.generateGoalRecommendations(goalsNeedingAttention);
                }

                res.json({
                    status: 'success',
                    data: {
                        goals: goalProgress,
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

module.exports = router; 