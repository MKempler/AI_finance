// UI Service
const UI = {
    // Charts
    spendingChart: null,
    budgetChart: null,

    // Initialize UI
    async init() {
        this.initCharts();
        this.initEventListeners();
        await this.loadDashboardData();
    },

    // Initialize Charts
    initCharts() {
        // Spending Overview Chart
        const spendingCtx = document.getElementById('spendingChart').getContext('2d');
        this.spendingChart = new Chart(spendingCtx, {
            type: 'doughnut',
            data: {
                labels: ['Housing', 'Food', 'Transportation', 'Entertainment', 'Utilities', 'Other'],
                datasets: [{
                    data: [30, 20, 15, 10, 15, 10],
                    backgroundColor: [
                        '#2563eb',
                        '#22c55e',
                        '#f59e0b',
                        '#ef4444',
                        '#8b5cf6',
                        '#64748b'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });

        // Budget Progress Chart
        const budgetCtx = document.getElementById('budgetChart').getContext('2d');
        this.budgetChart = new Chart(budgetCtx, {
            type: 'bar',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'Budget',
                    data: [1000, 1200, 1100, 1300, 1250, 1400],
                    backgroundColor: '#2563eb'
                }, {
                    label: 'Actual',
                    data: [950, 1250, 1050, 1350, 1200, 1450],
                    backgroundColor: '#22c55e'
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    },

    // Initialize Event Listeners
    initEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleNavigation(e.currentTarget.getAttribute('href'));
            });
        });

        // Add Transaction Button
        document.querySelector('.btn-add').addEventListener('click', () => {
            this.showAddTransactionModal();
        });

        // Search Input
        const searchInput = document.querySelector('.search-bar input');
        searchInput.addEventListener('input', (e) => {
            this.handleSearch(e.target.value);
        });
    },

    // Load Dashboard Data
    async loadDashboardData() {
        try {
            // Load transactions
            const transactions = await API.getTransactions();
            this.updateTransactionsList(transactions);

            // Load budgets
            const budgets = await API.getBudgets();
            this.updateBudgetCharts(budgets);

            // Load insights
            const insights = await API.getInsights();
            this.updateInsights(insights);

            // Update stats
            this.updateStats(transactions, budgets);
        } catch (error) {
            API.handleError(error);
        }
    },

    // Update Transactions List
    updateTransactionsList(transactions) {
        const container = document.querySelector('.transactions-list');
        container.innerHTML = transactions.slice(0, 5).map(transaction => `
            <div class="transaction-item">
                <div class="transaction-icon ${transaction.type === 'income' ? 'income' : 'expense'}">
                    <i class="fas fa-${transaction.type === 'income' ? 'arrow-up' : 'arrow-down'}"></i>
                </div>
                <div class="transaction-info">
                    <h4>${transaction.description}</h4>
                    <span class="transaction-category">${transaction.category}</span>
                </div>
                <div class="transaction-amount ${transaction.type === 'income' ? 'income' : 'expense'}">
                    ${transaction.type === 'income' ? '+' : '-'}$${transaction.amount.toFixed(2)}
                </div>
            </div>
        `).join('');
    },

    // Update Budget Charts
    updateBudgetCharts(budgets) {
        // Update spending chart data
        const spendingData = this.calculateSpendingByCategory(budgets);
        this.spendingChart.data.datasets[0].data = Object.values(spendingData);
        this.spendingChart.data.labels = Object.keys(spendingData);
        this.spendingChart.update();

        // Update budget progress chart
        const budgetData = this.calculateBudgetProgress(budgets);
        this.budgetChart.data.datasets[0].data = budgetData.budget;
        this.budgetChart.data.datasets[1].data = budgetData.actual;
        this.budgetChart.update();
    },

    // Update Insights
    updateInsights(insights) {
        const container = document.querySelector('.insights-container');
        container.innerHTML = insights.map(insight => `
            <div class="insight-card">
                <i class="fas fa-${this.getInsightIcon(insight.type)}"></i>
                <p>${insight.message}</p>
            </div>
        `).join('');
    },

    // Update Stats
    updateStats(transactions, budgets) {
        const stats = this.calculateStats(transactions, budgets);
        
        // Update balance
        document.querySelector('.stat-value').textContent = `$${stats.balance.toFixed(2)}`;
        
        // Update income
        document.querySelector('.stat-icon.income + .stat-info .stat-value').textContent = 
            `$${stats.income.toFixed(2)}`;
        
        // Update expenses
        document.querySelector('.stat-icon.expenses + .stat-info .stat-value').textContent = 
            `$${stats.expenses.toFixed(2)}`;
        
        // Update savings
        document.querySelector('.stat-icon.savings + .stat-info .stat-value').textContent = 
            `${stats.savingsPercentage}%`;
    },

    // Helper Methods
    calculateSpendingByCategory(budgets) {
        // Implementation for calculating spending by category
        return {
            'Housing': 30,
            'Food': 20,
            'Transportation': 15,
            'Entertainment': 10,
            'Utilities': 15,
            'Other': 10
        };
    },

    calculateBudgetProgress(budgets) {
        // Implementation for calculating budget progress
        return {
            budget: [1000, 1200, 1100, 1300, 1250, 1400],
            actual: [950, 1250, 1050, 1350, 1200, 1450]
        };
    },

    calculateStats(transactions, budgets) {
        // Implementation for calculating overall stats
        return {
            balance: 12345.67,
            income: 5678.90,
            expenses: 3456.78,
            savingsPercentage: 75
        };
    },

    getInsightIcon(type) {
        const icons = {
            'spending': 'chart-line',
            'savings': 'piggy-bank',
            'bill': 'calendar-check'
        };
        return icons[type] || 'lightbulb';
    },

    // Navigation
    handleNavigation(route) {
        // Implementation for handling navigation
        console.log('Navigating to:', route);
    },

    // Search
    handleSearch(query) {
        // Implementation for handling search
        console.log('Searching for:', query);
    },

    // Modal
    showAddTransactionModal() {
        // Implementation for showing add transaction modal
        console.log('Showing add transaction modal');
    }
}; 