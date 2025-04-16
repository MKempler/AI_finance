// Dashboard functionality

// Initialize dashboard when the page loads
document.addEventListener('DOMContentLoaded', function() {
    initializeUserData();
    initializeDashboard();
    initializeCharts();
    bindEvents();
    populateUserGreeting();
    initializeTransactions();
    initializeBudgets();
    initializeGoals();
    initializeInsights();
    // Comment out this line since the function doesn't exist yet
    // initializeSettings();
    setupCSVImportModal();
});

// Initialize user data if it doesn't exist
function initializeUserData() {
    if (!localStorage.getItem('user')) {
        // Create default user data
        const defaultUser = {
            firstName: 'Testing',
            lastName: 'User',
            email: 'testing@example.com',
            phone: '+1 (555) 123-4567'
        };
        
        // Save to localStorage
        localStorage.setItem('user', JSON.stringify(defaultUser));
    }
}

// Initialize dashboard components
function initializeDashboard() {
    console.log('Initializing dashboard...');
    
    // Show the default tab (overview)
    const overviewTab = document.getElementById('overview');
    if (overviewTab) {
        overviewTab.classList.add('active');
    }
    
    // Activate the corresponding nav link
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        if (link.getAttribute('data-target') === 'overview') {
            link.classList.add('active');
        }
    });
}

// Bind event listeners
function bindEvents() {
    // Tab navigation
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('data-target');
            switchTab(targetId);
        });
    });
    
    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            auth.logout();
            return false;
        });
    }
    
    // Period selectors for charts
    const periodButtons = document.querySelectorAll('.period');
    periodButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all period buttons
            document.querySelectorAll('.period').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Update chart data based on selected period
            updateChartData(this.textContent.toLowerCase());
        });
    });
    
    // Refresh insights button
    const refreshButton = document.querySelector('.refresh-insights');
    if (refreshButton) {
        refreshButton.addEventListener('click', function() {
            this.classList.add('rotating');
            setTimeout(() => {
                this.classList.remove('rotating');
                // Here you would fetch new insights from the API
                // For now, we'll just log a message
                console.log('Refreshing insights...');
            }, 1000);
        });
    }
}

// Switch between tabs
function switchTab(tabId) {
    // Hide all tab contents
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Show the selected tab
    const selectedTab = document.getElementById(tabId);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }
    
    // Update active nav link
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        if (link.getAttribute('data-target') === tabId) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// Initialize charts
function initializeCharts() {
    initializeSpendingChart();
}

// Initialize spending breakdown chart
function initializeSpendingChart() {
    const ctx = document.getElementById('spendingChart');
    if (!ctx) return;
    
    // Get the Chart.js library
    if (typeof Chart === 'undefined') {
        loadScript('https://cdn.jsdelivr.net/npm/chart.js', () => {
            renderSpendingChart(ctx);
        });
    } else {
        renderSpendingChart(ctx);
    }
}

// Render spending breakdown chart
function renderSpendingChart(ctx) {
    const chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Housing', 'Food', 'Transportation', 'Entertainment', 'Utilities', 'Other'],
            datasets: [{
                data: [35, 25, 15, 10, 10, 5],
                backgroundColor: [
                    '#3b82f6', // Housing
                    '#10b981', // Food
                    '#f59e0b', // Transportation
                    '#8b5cf6', // Entertainment
                    '#ef4444', // Utilities
                    '#6b7280'  // Other
                ],
                borderWidth: 0,
                hoverOffset: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        boxWidth: 15,
                        padding: 15,
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            return `${label}: ${value}%`;
                        }
                    }
                }
            },
            cutout: '70%'
        }
    });
    
    // Store the chart instance for later updates
    window.spendingChart = chart;
}

// Update chart data based on selected period
function updateChartData(period) {
    if (!window.spendingChart) return;
    
    let newData;
    
    switch(period) {
        case 'week':
            newData = [30, 35, 10, 15, 5, 5];
            break;
        case 'month':
            newData = [35, 25, 15, 10, 10, 5];
            break;
        case 'year':
            newData = [40, 20, 15, 5, 15, 5];
            break;
        default:
            newData = [35, 25, 15, 10, 10, 5];
    }
    
    window.spendingChart.data.datasets[0].data = newData;
    window.spendingChart.update();
    console.log(`Updated chart data for period: ${period}`);
}

// Load external script
function loadScript(url, callback) {
    const script = document.createElement('script');
    script.src = url;
    script.onload = callback;
    document.head.appendChild(script);
}

// Populate user greeting and dashboard data
function populateUserGreeting() {
    // Get user data
    const userString = localStorage.getItem('user');
    let userData = {
        firstName: 'User'
    };
    
    if (userString) {
        try {
            userData = JSON.parse(userString);
        } catch (e) {
            console.error('Error parsing user data:', e);
        }
    }
    
    // Update user greeting
    const userGreetingElements = document.querySelectorAll('#userName, #user-greeting');
    userGreetingElements.forEach(element => {
        if (element) {
            element.textContent = userData.firstName;
        }
    });
    
    // Update user name in header
    const userNameElement = document.getElementById('user-name');
    if (userNameElement) {
        userNameElement.textContent = userData.firstName;
    }
    
    // Update user avatar
    const userAvatarElement = document.getElementById('user-avatar');
    if (userAvatarElement) {
        const firstLetter = userData.firstName.charAt(0).toUpperCase();
        userAvatarElement.textContent = firstLetter;
    }
}

// Load dashboard data from API
function loadDashboardData() {
    api.getDashboardOverview()
        .then(response => {
            if (response.status === 'success') {
                const data = response.data;
                updateDashboardStats(data.summary);
                updateSpendingChart(data.spendingByCategory);
                updateRecentTransactions(data.recentTransactions);
                updateBudgetProgress(data.activeBudgets);
                updateAIInsights(data.insights);
            }
        })
        .catch(error => {
            console.error('Error loading dashboard data:', error);
            showNotification('Failed to load dashboard data', 'error');
        });
}

// Update dashboard statistics
function updateDashboardStats(summary) {
    const balanceElement = document.querySelector('.stat-value:nth-of-type(1)');
    const incomeElement = document.querySelector('.stat-value:nth-of-type(2)');
    const expensesElement = document.querySelector('.stat-value:nth-of-type(3)');
    const savingsElement = document.querySelector('.stat-value:nth-of-type(4)');

    if (balanceElement && summary.totalBalance) {
        balanceElement.textContent = formatCurrency(summary.totalBalance);
    }

    if (incomeElement && summary.monthlyIncome) {
        incomeElement.textContent = formatCurrency(summary.monthlyIncome);
    }

    if (expensesElement && summary.monthlyExpenses) {
        expensesElement.textContent = formatCurrency(summary.monthlyExpenses);
    }

    if (savingsElement && summary.savingsRate) {
        savingsElement.textContent = `${summary.savingsRate.toFixed(1)}%`;
    }
}

// Update spending chart with real data
function updateSpendingChart(spendingByCategory) {
    if (!window.spendingChart || !spendingByCategory) return;
    
    const labels = Object.keys(spendingByCategory);
    const data = Object.values(spendingByCategory);
    
    window.spendingChart.data.labels = labels;
    window.spendingChart.data.datasets[0].data = data;
    window.spendingChart.update();
}

// Update recent transactions list with real data
function updateRecentTransactions(transactions) {
    const transactionsList = document.querySelector('.transactions-list');
    if (!transactionsList || !transactions) return;
    
    // Clear existing transactions
    transactionsList.innerHTML = '';
    
    // Add recent transactions
    transactions.forEach(transaction => {
        const transactionItem = document.createElement('div');
        transactionItem.className = 'transaction-item';
        
        const categoryIcon = getCategoryIcon(transaction.category);
        const formattedDate = formatDate(new Date(transaction.date));
        const isExpense = transaction.amount < 0;
        
        transactionItem.innerHTML = `
            <div class="transaction-icon ${transaction.category.toLowerCase()}">
                <i class="fas ${categoryIcon}"></i>
            </div>
            <div class="transaction-details">
                <div class="transaction-title">${transaction.description}</div>
                <div class="transaction-date">${formattedDate}</div>
            </div>
            <div class="transaction-amount ${isExpense ? 'expense' : 'income'}">
                ${formatCurrency(transaction.amount)}
            </div>
        `;
        
        transactionsList.appendChild(transactionItem);
    });
}

// Update budget progress with real data
function updateBudgetProgress(budgets) {
    const budgetCategories = document.querySelector('.budget-categories');
    if (!budgetCategories || !budgets) return;
    
    // Clear existing budget items
    budgetCategories.innerHTML = '';
    
    // Add budget items
    budgets.forEach(budget => {
        const percentage = (budget.total_spent / budget.amount) * 100;
        const isWarning = percentage >= 80 && percentage < 100;
        const isDanger = percentage >= 100;
        
        const budgetCategory = document.createElement('div');
        budgetCategory.className = 'budget-category';
        
        budgetCategory.innerHTML = `
            <div class="budget-info">
                <div class="budget-name">
                    <div class="category-icon ${budget.category.toLowerCase()}">
                        <i class="fas ${getCategoryIcon(budget.category)}"></i>
                    </div>
                    <span>${budget.category}</span>
                </div>
                <div class="budget-amount">
                    <span class="current">${formatCurrency(budget.total_spent)}</span>
                    <span class="separator">/</span>
                    <span class="total">${formatCurrency(budget.amount)}</span>
                </div>
            </div>
            <div class="progress-bar">
                <div class="progress-fill ${isWarning ? 'warning' : isDanger ? 'danger' : ''}" 
                     style="width: ${Math.min(percentage, 100)}%"></div>
            </div>
        `;
        
        budgetCategories.appendChild(budgetCategory);
    });
}

// Update AI insights with real data
function updateAIInsights(insights) {
    const insightsContent = document.querySelector('.insights-content');
    if (!insightsContent || !insights) return;
    
    // Clear existing insights
    insightsContent.innerHTML = '';
    
    // Add insights
    insights.slice(0, 3).forEach(insight => {
        const insightCard = document.createElement('div');
        insightCard.className = 'insight-card';
        
        const iconType = getInsightIconType(insight.type);
        
        insightCard.innerHTML = `
            <div class="insight-icon ${iconType}">
                <i class="fas ${getInsightIcon(insight.type)}"></i>
            </div>
            <div class="insight-text">
                <h4>${insight.title}</h4>
                <p>${insight.content}</p>
            </div>
        `;
        
        insightsContent.appendChild(insightCard);
    });
}

// Initialize transactions
function initializeTransactions() {
    loadTransactions();
    bindTransactionEvents();
    createTransactionModal();
}

// Load transactions from API
function loadTransactions() {
    api.getTransactions()
        .then(response => {
            if (response.status === 'success') {
                populateTransactionsTable(response.data);
                updateTransactionSummary(response.data);
            }
        })
        .catch(error => {
            console.error('Error loading transactions:', error);
            showNotification('Failed to load transactions', 'error');
        });
}

// Save transaction
function saveTransaction() {
    const form = document.getElementById('transaction-form');
    if (!form) return;
    
    const transactionId = form.getAttribute('data-id');
    const isEdit = !!transactionId;
    
    const transaction = {
        amount: parseFloat(form.amount.value),
        description: form.description.value,
        category: form.category.value,
        date: form.date.value
    };
    
    // Validate form
    if (!transaction.amount || !transaction.description || !transaction.category || !transaction.date) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    // Save transaction
    const savePromise = isEdit
        ? api.updateTransaction(transactionId, transaction)
        : api.createTransaction(transaction);
    
    savePromise
        .then(response => {
            if (response.status === 'success') {
                closeTransactionModal();
                showNotification(
                    isEdit ? 'Transaction updated successfully' : 'Transaction added successfully',
                    'success'
                );
                loadTransactions(); // Refresh transactions
            }
        })
        .catch(error => {
            console.error('Error saving transaction:', error);
            showNotification('Failed to save transaction', 'error');
        });
}

// Delete transaction
function deleteTransaction(id) {
    if (!confirm('Are you sure you want to delete this transaction?')) {
        return;
    }
    
    api.deleteTransaction(id)
        .then(response => {
            if (response.status === 'success') {
                showNotification('Transaction deleted successfully', 'success');
                loadTransactions(); // Refresh transactions
            }
        })
        .catch(error => {
            console.error('Error deleting transaction:', error);
            showNotification('Failed to delete transaction', 'error');
        });
}

// Initialize budgets
function initializeBudgets() {
    loadBudgets();
    bindBudgetEvents();
    createBudgetModal();
}

// Load budgets from API
function loadBudgets() {
    api.getBudgets()
        .then(response => {
            if (response.status === 'success') {
                populateBudgetsContainer(response.data);
                updateBudgetSummary(response.data);
            }
        })
        .catch(error => {
            console.error('Error loading budgets:', error);
            showNotification('Failed to load budgets', 'error');
        });
}

// Save budget
function saveBudget() {
    const form = document.getElementById('budget-form');
    if (!form) return;
    
    const budgetId = form.getAttribute('data-id');
    const isEdit = !!budgetId;
    
    const budget = {
        category: form.category.value,
        amount: parseFloat(form.amount.value),
        period: form.period.value,
        startDate: form.startDate.value,
        endDate: form.endDate.value || null
    };
    
    // Validate form
    if (!budget.category || !budget.amount || !budget.period || !budget.startDate) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    // Save budget
    const savePromise = isEdit
        ? api.updateBudget(budgetId, budget)
        : api.createBudget(budget);
    
    savePromise
        .then(response => {
            if (response.status === 'success') {
                closeBudgetModal();
                showNotification(
                    isEdit ? 'Budget updated successfully' : 'Budget added successfully',
                    'success'
                );
                loadBudgets(); // Refresh budgets
            }
        })
        .catch(error => {
            console.error('Error saving budget:', error);
            showNotification('Failed to save budget', 'error');
        });
}

// Initialize goals
function initializeGoals() {
    loadGoals();
    bindGoalEvents();
    createGoalModal();
}

// Load goals from API
function loadGoals() {
    api.getGoals()
        .then(response => {
            if (response.status === 'success') {
                populateGoalsList(response.data);
                updateGoalSummary(response.data);
            }
        })
        .catch(error => {
            console.error('Error loading goals:', error);
            showNotification('Failed to load goals', 'error');
        });
}

// Save goal
function saveGoal() {
    const form = document.getElementById('goal-form');
    if (!form) return;
    
    const goalId = form.getAttribute('data-id');
    const isEdit = !!goalId;
    
    const goal = {
        name: form.name.value,
        targetAmount: parseFloat(form.targetAmount.value),
        currentAmount: parseFloat(form.currentAmount.value || 0),
        deadline: form.deadline.value,
        type: form.type.value,
        description: form.description.value || ''
    };
    
    // Validate form
    if (!goal.name || !goal.targetAmount || !goal.deadline || !goal.type) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    // Save goal
    const savePromise = isEdit
        ? api.updateGoal(goalId, goal)
        : api.createGoal(goal);
    
    savePromise
        .then(response => {
            if (response.status === 'success') {
                closeGoalModal();
                showNotification(
                    isEdit ? 'Goal updated successfully' : 'Goal added successfully',
                    'success'
                );
                loadGoals(); // Refresh goals
            }
        })
        .catch(error => {
            console.error('Error saving goal:', error);
            showNotification('Failed to save goal', 'error');
        });
}

// Save goal contribution
function saveContribution() {
    const form = document.getElementById('contribution-form');
    if (!form) return;
    
    const goalId = form.getAttribute('data-goal-id');
    const contribution = {
        amount: parseFloat(form.amount.value),
        date: form.date.value,
        notes: form.notes.value || ''
    };
    
    // Validate form
    if (!contribution.amount || !contribution.date) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    // Save contribution
    api.addGoalContribution(goalId, contribution)
        .then(response => {
            if (response.status === 'success') {
                closeContributionModal();
                showNotification('Contribution added successfully', 'success');
                loadGoals(); // Refresh goals
            }
        })
        .catch(error => {
            console.error('Error saving contribution:', error);
            showNotification('Failed to save contribution', 'error');
        });
}

// Initialize insights
function initializeInsights() {
    loadInsights();
    bindInsightEvents();
}

// Load insights from API
function loadInsights() {
    api.getInsights()
        .then(response => {
            if (response.status === 'success') {
                populateInsightsContainer(response.data);
            }
        })
        .catch(error => {
            console.error('Error loading insights:', error);
            showNotification('Failed to load insights', 'error');
        });
}

// Refresh insights
function refreshInsights() {
    const refreshBtn = document.getElementById('refresh-insights-btn');
    if (refreshBtn) {
        refreshBtn.classList.add('loading');
    }
    
    api.getInsights()
        .then(response => {
            if (response.status === 'success') {
                populateInsightsContainer(response.data);
                showNotification('Insights refreshed successfully', 'success');
            }
        })
        .catch(error => {
            console.error('Error refreshing insights:', error);
            showNotification('Failed to refresh insights', 'error');
        })
        .finally(() => {
            if (refreshBtn) {
                refreshBtn.classList.remove('loading');
            }
        });
}

// Helper function to format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2
    }).format(amount);
}

// Get icon class for transaction category
function getCategoryIcon(category) {
    const icons = {
        'Housing': 'fa-home',
        'Groceries': 'fa-shopping-basket',
        'Dining': 'fa-utensils',
        'Transportation': 'fa-car',
        'Entertainment': 'fa-film',
        'Utilities': 'fa-bolt',
        'Shopping': 'fa-shopping-bag',
        'Health': 'fa-heartbeat',
        'Income': 'fa-briefcase',
        'Salary': 'fa-briefcase',
        'Transfer': 'fa-exchange-alt',
        'Bills': 'fa-file-invoice-dollar',
        'default': 'fa-money-bill'
    };
    
    return icons[category] || icons.default;
}

// Get icon class for insight type
function getInsightIcon(type) {
    const icons = {
        'saving': 'fa-piggy-bank',
        'warning': 'fa-exclamation-triangle',
        'goal': 'fa-bullseye',
        'tip': 'fa-lightbulb',
        'spending': 'fa-chart-pie',
        'income': 'fa-chart-line',
        'default': 'fa-lightbulb'
    };
    
    return icons[type] || icons.default;
}

// Get insight icon type class
function getInsightIconType(type) {
    const types = {
        'saving': 'saving',
        'warning': 'warning',
        'goal': 'goal',
        'tip': 'tip',
        'spending': 'warning',
        'income': 'saving',
        'default': 'tip'
    };
    
    return types[type] || types.default;
}

// Add CSS animation for the refresh button
// Only one style declaration should exist
const refreshAnimation = document.createElement('style');
refreshAnimation.textContent = `
.rotating {
    animation: rotate 1s linear;
}

@keyframes rotate {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

.loading {
    position: relative;
    pointer-events: none;
    opacity: 0.7;
}

.loading::after {
    content: '';
    position: absolute;
    top: calc(50% - 0.5em);
    left: calc(50% - 0.5em);
    width: 1em;
    height: 1em;
    border: 2px solid rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    border-top-color: white;
    animation: spin 0.6s linear infinite;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}
`;
document.head.appendChild(refreshAnimation);

// Transaction functionality
function bindTransactionEvents() {
    // Add transaction button
    const addTransactionBtn = document.getElementById('add-transaction-btn');
    if (addTransactionBtn) {
        addTransactionBtn.addEventListener('click', function() {
            showTransactionModal();
        });
    }
    
    // Edit transaction buttons
    const editButtons = document.querySelectorAll('.edit-transaction');
    editButtons.forEach(button => {
        button.addEventListener('click', function() {
            const transactionId = this.getAttribute('data-id');
            editTransaction(transactionId);
        });
    });
    
    // Delete transaction buttons
    const deleteButtons = document.querySelectorAll('.delete-transaction');
    deleteButtons.forEach(button => {
        button.addEventListener('click', function() {
            const transactionId = this.getAttribute('data-id');
            deleteTransaction(transactionId);
        });
    });
    
    // Apply filters button
    const applyFiltersBtn = document.getElementById('apply-filters');
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', function() {
            applyTransactionFilters();
        });
    }
    
    // Pagination
    const paginationButtons = document.querySelectorAll('.pagination-page');
    paginationButtons.forEach(button => {
        button.addEventListener('click', function() {
            const page = this.textContent;
            goToPage(page);
        });
    });
    
    // Previous/Next page buttons
    const prevPageBtn = document.querySelector('.pagination-btn:first-child');
    const nextPageBtn = document.querySelector('.pagination-btn:last-child');
    
    if (prevPageBtn) {
        prevPageBtn.addEventListener('click', function() {
            if (!this.hasAttribute('disabled')) {
                const activePage = document.querySelector('.pagination-page.active');
                const prevPage = parseInt(activePage.textContent) - 1;
                goToPage(prevPage);
            }
        });
    }
    
    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', function() {
            if (!this.hasAttribute('disabled')) {
                const activePage = document.querySelector('.pagination-page.active');
                const nextPage = parseInt(activePage.textContent) + 1;
                goToPage(nextPage);
            }
        });
    }
}

// Create a transaction modal HTML
function createTransactionModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'transaction-modal';
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3 id="modal-title">Add Transaction</h3>
                <button class="close-modal">&times;</button>
            </div>
            <div class="modal-body">
                <form id="transaction-form">
                    <input type="hidden" id="transaction-id">
                    <div class="form-group">
                        <label for="transaction-date">Date</label>
                        <input type="date" id="transaction-date" required>
                    </div>
                    <div class="form-group">
                        <label for="transaction-description">Description</label>
                        <input type="text" id="transaction-description" placeholder="Enter description" required>
                    </div>
                    <div class="form-group">
                        <label for="transaction-amount">Amount</label>
                        <input type="number" id="transaction-amount" step="0.01" placeholder="0.00" required>
                    </div>
                    <div class="form-group">
                        <label for="transaction-type">Type</label>
                        <select id="transaction-type" required>
                            <option value="expense">Expense</option>
                            <option value="income">Income</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="transaction-category">Category</label>
                        <select id="transaction-category" required>
                            <option value="">Select Category</option>
                            <option value="income">Income</option>
                            <option value="groceries">Groceries</option>
                            <option value="dining">Dining Out</option>
                            <option value="transportation">Transportation</option>
                            <option value="entertainment">Entertainment</option>
                            <option value="utilities">Utilities</option>
                            <option value="shopping">Shopping</option>
                            <option value="health">Health</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="transaction-memo">Memo (Optional)</label>
                        <textarea id="transaction-memo" placeholder="Add notes"></textarea>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary" id="cancel-transaction">Cancel</button>
                <button class="btn-primary" id="save-transaction">Save Transaction</button>
            </div>
        </div>
    `;
    
    return modal;
}

// Show the transaction modal
function showTransactionModal(transactionData = null) {
    // Check if modal already exists
    let modal = document.getElementById('transaction-modal');
    
    // If not, create it
    if (!modal) {
        modal = createTransactionModal();
        document.body.appendChild(modal);
        
        // Add event listeners
        const closeBtn = modal.querySelector('.close-modal');
        const cancelBtn = modal.querySelector('#cancel-transaction');
        const saveBtn = modal.querySelector('#save-transaction');
        
        closeBtn.addEventListener('click', closeTransactionModal);
        cancelBtn.addEventListener('click', closeTransactionModal);
        
        saveBtn.addEventListener('click', function() {
            saveTransaction();
        });
        
        // Type change affects category options
        const typeSelect = modal.querySelector('#transaction-type');
        typeSelect.addEventListener('change', updateCategoryOptions);
    }
    
    // Update modal content if editing
    if (transactionData) {
        modal.querySelector('#modal-title').textContent = 'Edit Transaction';
        modal.querySelector('#transaction-id').value = transactionData.id;
        modal.querySelector('#transaction-date').value = transactionData.date;
        modal.querySelector('#transaction-description').value = transactionData.description;
        modal.querySelector('#transaction-amount').value = transactionData.amount;
        modal.querySelector('#transaction-type').value = transactionData.type;
        updateCategoryOptions(); // Update category options based on type
        modal.querySelector('#transaction-category').value = transactionData.category;
        modal.querySelector('#transaction-memo').value = transactionData.memo || '';
    } else {
        // Set default values for new transaction
        modal.querySelector('#modal-title').textContent = 'Add Transaction';
        modal.querySelector('#transaction-id').value = '';
        modal.querySelector('#transaction-date').value = formatDate(new Date());
        modal.querySelector('#transaction-description').value = '';
        modal.querySelector('#transaction-amount').value = '';
        modal.querySelector('#transaction-type').value = 'expense';
        updateCategoryOptions(); // Update category options based on type
        modal.querySelector('#transaction-category').value = '';
        modal.querySelector('#transaction-memo').value = '';
    }
    
    // Show the modal
    modal.style.display = 'flex';
}

// Close the transaction modal
function closeTransactionModal() {
    const modal = document.getElementById('transaction-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Update category options based on transaction type
function updateCategoryOptions() {
    const typeSelect = document.getElementById('transaction-type');
    const categorySelect = document.getElementById('transaction-category');
    
    if (!typeSelect || !categorySelect) return;
    
    const type = typeSelect.value;
    
    // Clear current options
    categorySelect.innerHTML = '';
    
    // Add placeholder
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Select Category';
    categorySelect.appendChild(placeholder);
    
    if (type === 'income') {
        // Income categories
        const incomeOption = document.createElement('option');
        incomeOption.value = 'income';
        incomeOption.textContent = 'Income';
        categorySelect.appendChild(incomeOption);
        
        const salaryOption = document.createElement('option');
        salaryOption.value = 'salary';
        salaryOption.textContent = 'Salary';
        categorySelect.appendChild(salaryOption);
        
        const investmentOption = document.createElement('option');
        investmentOption.value = 'investment';
        investmentOption.textContent = 'Investment';
        categorySelect.appendChild(investmentOption);
        
        const otherOption = document.createElement('option');
        otherOption.value = 'other';
        otherOption.textContent = 'Other';
        categorySelect.appendChild(otherOption);
    } else {
        // Expense categories
        const categories = [
            { value: 'groceries', text: 'Groceries' },
            { value: 'dining', text: 'Dining Out' },
            { value: 'transportation', text: 'Transportation' },
            { value: 'entertainment', text: 'Entertainment' },
            { value: 'utilities', text: 'Utilities' },
            { value: 'shopping', text: 'Shopping' },
            { value: 'health', text: 'Health' },
            { value: 'housing', text: 'Housing' },
            { value: 'travel', text: 'Travel' },
            { value: 'education', text: 'Education' },
            { value: 'other', text: 'Other' }
        ];
        
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.value;
            option.textContent = category.text;
            categorySelect.appendChild(option);
        });
    }
}

// Show notification
function showNotification(message, type = 'success') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Add to DOM
    document.body.appendChild(notification);
    
    // Trigger animation
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 5000);
}

// Helper function to format date as YYYY-MM-DD
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Add styles for the transaction modal
const modalStyle = document.createElement('style');
modalStyle.textContent = `
.modal {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 1000;
    justify-content: center;
    align-items: center;
}

.modal-content {
    background-color: white;
    border-radius: 0.5rem;
    width: 100%;
    max-width: 500px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    animation: modalAnimation 0.3s;
}

@keyframes modalAnimation {
    from { opacity: 0; transform: translateY(-20px); }
    to { opacity: 1; transform: translateY(0); }
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.5rem;
    border-bottom: 1px solid var(--border-color);
}

.modal-header h3 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
}

.close-modal {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: var(--text-secondary);
    transition: color 0.2s;
}

.close-modal:hover {
    color: var(--danger-color);
}

.modal-body {
    padding: 1.5rem;
    max-height: 70vh;
    overflow-y: auto;
}

.modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    padding: 1rem 1.5rem;
    border-top: 1px solid var(--border-color);
}

.form-group {
    margin-bottom: 1rem;
}

.form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: var(--text-primary);
}

.form-group input,
.form-group select,
.form-group textarea {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid var(--border-color);
    border-radius: 0.375rem;
    font-size: 1rem;
}

.form-group textarea {
    resize: vertical;
    min-height: 100px;
}

.btn-secondary {
    background-color: var(--background-color);
    color: var(--text-primary);
    border: 1px solid var(--border-color);
    border-radius: 0.375rem;
    padding: 0.625rem 1.25rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
}

.btn-secondary:hover {
    background-color: var(--border-color);
}
`;
document.head.appendChild(modalStyle);

// Budget functionality
function bindBudgetEvents() {
    // Create budget button
    const addBudgetBtn = document.getElementById('add-budget-btn');
    if (addBudgetBtn) {
        addBudgetBtn.addEventListener('click', function() {
            showBudgetModal();
        });
    }

    // Period navigation
    const prevPeriodBtn = document.getElementById('prev-period');
    const nextPeriodBtn = document.getElementById('next-period');
    const currentPeriodEl = document.querySelector('.current-period');
    
    if (prevPeriodBtn && nextPeriodBtn && currentPeriodEl) {
        prevPeriodBtn.addEventListener('click', function() {
            changeBudgetPeriod('prev');
        });
        
        nextPeriodBtn.addEventListener('click', function() {
            changeBudgetPeriod('next');
        });
    }
    
    // Budget category filtering
    const viewOptions = document.querySelectorAll('.view-option');
    viewOptions.forEach(option => {
        option.addEventListener('click', function() {
            const view = this.getAttribute('data-view');
            filterBudgetCategories(view);
            
            // Update active state
            viewOptions.forEach(opt => opt.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // Edit budget buttons
    const editBudgetBtns = document.querySelectorAll('.edit-budget');
    editBudgetBtns.forEach(button => {
        button.addEventListener('click', function() {
            const budgetId = this.getAttribute('data-id');
            editBudget(budgetId);
        });
    });
}

// Create budget modal HTML
function createBudgetModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'budget-modal';
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3 id="budget-modal-title">Create Budget</h3>
                <button class="close-modal">&times;</button>
            </div>
            <div class="modal-body">
                <form id="budget-form">
                    <input type="hidden" id="budget-id">
                    <div class="form-group">
                        <label for="budget-category">Category</label>
                        <select id="budget-category" required>
                            <option value="">Select Category</option>
                            <option value="housing">Housing</option>
                            <option value="groceries">Groceries</option>
                            <option value="dining">Dining Out</option>
                            <option value="transportation">Transportation</option>
                            <option value="entertainment">Entertainment</option>
                            <option value="utilities">Utilities</option>
                            <option value="health">Health & Wellness</option>
                            <option value="shopping">Shopping</option>
                            <option value="savings">Savings</option>
                            <option value="debt">Debt Payments</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="budget-amount">Monthly Budget Amount</label>
                        <input type="number" id="budget-amount" step="0.01" min="0" placeholder="0.00" required>
                    </div>
                    <div class="form-group">
                        <label for="budget-start-date">Start Date</label>
                        <input type="date" id="budget-start-date" required>
                    </div>
                    <div class="form-group">
                        <label for="budget-period">Budget Period</label>
                        <select id="budget-period" required>
                            <option value="monthly">Monthly</option>
                            <option value="quarterly">Quarterly</option>
                            <option value="yearly">Yearly</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="budget-notes">Notes (Optional)</label>
                        <textarea id="budget-notes" placeholder="Add notes"></textarea>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary" id="cancel-budget">Cancel</button>
                <button class="btn-primary" id="save-budget">Save Budget</button>
            </div>
        </div>
    `;
    
    return modal;
}

// Show the budget modal
function showBudgetModal(budgetData = null) {
    // Check if modal already exists
    let modal = document.getElementById('budget-modal');
    
    // If not, create it
    if (!modal) {
        modal = createBudgetModal();
        document.body.appendChild(modal);
        
        // Add event listeners
        const closeBtn = modal.querySelector('.close-modal');
        const cancelBtn = modal.querySelector('#cancel-budget');
        const saveBtn = modal.querySelector('#save-budget');
        
        closeBtn.addEventListener('click', closeBudgetModal);
        cancelBtn.addEventListener('click', closeBudgetModal);
        
        saveBtn.addEventListener('click', function() {
            saveBudget();
        });
    }
    
    // Update modal content if editing
    if (budgetData) {
        modal.querySelector('#budget-modal-title').textContent = 'Edit Budget';
        modal.querySelector('#budget-id').value = budgetData.id;
        modal.querySelector('#budget-category').value = budgetData.category;
        modal.querySelector('#budget-amount').value = budgetData.amount;
        modal.querySelector('#budget-start-date').value = budgetData.startDate;
        modal.querySelector('#budget-period').value = budgetData.period;
        modal.querySelector('#budget-notes').value = budgetData.notes || '';
    } else {
        // Set default values for new budget
        modal.querySelector('#budget-modal-title').textContent = 'Create Budget';
        modal.querySelector('#budget-id').value = '';
        modal.querySelector('#budget-category').value = '';
        modal.querySelector('#budget-amount').value = '';
        modal.querySelector('#budget-start-date').value = formatDate(new Date());
        modal.querySelector('#budget-period').value = 'monthly';
        modal.querySelector('#budget-notes').value = '';
    }
    
    // Show the modal
    modal.style.display = 'flex';
}

// Close the budget modal
function closeBudgetModal() {
    const modal = document.getElementById('budget-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Goals functionality
function bindGoalEvents() {
    // Add goal button
    const addGoalBtn = document.getElementById('add-goal-btn');
    if (addGoalBtn) {
        addGoalBtn.addEventListener('click', function() {
            showGoalModal();
        });
    }
    
    // Goal filtering
    const filterButtons = document.querySelectorAll('.goal-filter-btn');
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            const filter = this.getAttribute('data-filter');
            filterGoals(filter);
            
            // Update active button
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // Edit goal buttons
    const editButtons = document.querySelectorAll('.edit-goal');
    editButtons.forEach(button => {
        button.addEventListener('click', function() {
            const goalId = this.getAttribute('data-id');
            editGoal(goalId);
        });
    });
    
    // Delete goal buttons
    const deleteButtons = document.querySelectorAll('.delete-goal');
    deleteButtons.forEach(button => {
        button.addEventListener('click', function() {
            const goalId = this.getAttribute('data-id');
            deleteGoal(goalId);
        });
    });
    
    // Contribute buttons
    const contributeButtons = document.querySelectorAll('.contribute-btn');
    contributeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const goalId = this.getAttribute('data-id');
            showContributionModal(goalId);
        });
    });
    
    // View history buttons
    const historyButtons = document.querySelectorAll('.view-history-btn');
    historyButtons.forEach(button => {
        button.addEventListener('click', function() {
            const goalId = this.getAttribute('data-id');
            showGoalHistory(goalId);
        });
    });
    
    // Dropdown toggle
    const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
    dropdownToggles.forEach(toggle => {
        toggle.addEventListener('click', function(e) {
            e.stopPropagation();
            const dropdown = this.nextElementSibling;
            dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
        });
    });
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', function() {
        const dropdowns = document.querySelectorAll('.dropdown-menu');
        dropdowns.forEach(dropdown => {
            dropdown.style.display = 'none';
        });
    });
}

// Create goal modal HTML
function createGoalModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'goal-modal';
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3 id="goal-modal-title">Create Financial Goal</h3>
                <button class="close-modal">&times;</button>
            </div>
            <div class="modal-body">
                <form id="goal-form">
                    <input type="hidden" id="goal-id">
                    <div class="form-group">
                        <label for="goal-title">Goal Title</label>
                        <input type="text" id="goal-title" placeholder="Enter goal title" required>
                    </div>
                    <div class="form-group">
                        <label for="goal-category">Category</label>
                        <select id="goal-category" required>
                            <option value="">Select Category</option>
                            <option value="savings">Savings</option>
                            <option value="housing">Housing</option>
                            <option value="travel">Travel</option>
                            <option value="education">Education</option>
                            <option value="retirement">Retirement</option>
                            <option value="automobile">Automobile</option>
                            <option value="debt">Debt Payoff</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="goal-target-amount">Target Amount</label>
                        <input type="number" id="goal-target-amount" step="0.01" min="0" placeholder="0.00" required>
                    </div>
                    <div class="form-group">
                        <label for="goal-current-amount">Current Amount (optional)</label>
                        <input type="number" id="goal-current-amount" step="0.01" min="0" placeholder="0.00">
                    </div>
                    <div class="form-group">
                        <label for="goal-target-date">Target Date</label>
                        <input type="date" id="goal-target-date" required>
                    </div>
                    <div class="form-group">
                        <label for="goal-description">Description (Optional)</label>
                        <textarea id="goal-description" placeholder="Add additional details about your goal"></textarea>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary" id="cancel-goal">Cancel</button>
                <button class="btn-primary" id="save-goal">Save Goal</button>
            </div>
        </div>
    `;
    
    return modal;
}

// Show the goal modal
function showGoalModal(goalData = null) {
    // Check if modal already exists
    let modal = document.getElementById('goal-modal');
    
    // If not, create it
    if (!modal) {
        modal = createGoalModal();
        document.body.appendChild(modal);
        
        // Add event listeners
        const closeBtn = modal.querySelector('.close-modal');
        const cancelBtn = modal.querySelector('#cancel-goal');
        const saveBtn = modal.querySelector('#save-goal');
        
        closeBtn.addEventListener('click', closeGoalModal);
        cancelBtn.addEventListener('click', closeGoalModal);
        
        saveBtn.addEventListener('click', function() {
            saveGoal();
        });
    }
    
    // Update modal content if editing
    if (goalData) {
        modal.querySelector('#goal-modal-title').textContent = 'Edit Financial Goal';
        modal.querySelector('#goal-id').value = goalData.id;
        modal.querySelector('#goal-title').value = goalData.title;
        modal.querySelector('#goal-category').value = goalData.category;
        modal.querySelector('#goal-target-amount').value = goalData.targetAmount;
        modal.querySelector('#goal-current-amount').value = goalData.currentAmount;
        modal.querySelector('#goal-target-date').value = goalData.targetDate;
        modal.querySelector('#goal-description').value = goalData.description || '';
    } else {
        // Set default values for new goal
        modal.querySelector('#goal-modal-title').textContent = 'Create Financial Goal';
        modal.querySelector('#goal-id').value = '';
        modal.querySelector('#goal-title').value = '';
        modal.querySelector('#goal-category').value = '';
        modal.querySelector('#goal-target-amount').value = '';
        modal.querySelector('#goal-current-amount').value = '';
        
        // Set default target date to 1 year from now
        const oneYearFromNow = new Date();
        oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
        modal.querySelector('#goal-target-date').value = formatDate(oneYearFromNow);
        
        modal.querySelector('#goal-description').value = '';
    }
    
    // Show the modal
    modal.style.display = 'flex';
}

// Close the goal modal
function closeGoalModal() {
    const modal = document.getElementById('goal-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Save goal
function saveGoal() {
    const form = document.getElementById('goal-form');
    
    if (form.checkValidity()) {
        const goalId = document.getElementById('goal-id').value;
        const title = document.getElementById('goal-title').value;
        const category = document.getElementById('goal-category').value;
        const targetAmount = document.getElementById('goal-target-amount').value;
        const currentAmount = document.getElementById('goal-current-amount').value || '0';
        const targetDate = document.getElementById('goal-target-date').value;
        const description = document.getElementById('goal-description').value;
        
        const goalData = {
            id: goalId || Date.now().toString(),
            title,
            category,
            targetAmount,
            currentAmount,
            targetDate,
            description
        };
        
        // Here you would send the data to your API
        console.log('Saving goal:', goalData);
        
        // For demo purposes, let's simulate a successful save
        closeGoalModal();
        
        // Show success message
        showNotification('Goal saved successfully', 'success');
        
        // Refresh goals (in a real app, this would fetch from API)
        // For now, just reload the page after a short delay
        setTimeout(() => {
            switchTab('goals');
        }, 1000);
    } else {
        // Trigger form validation
        form.reportValidity();
    }
}

// Edit goal
function editGoal(id) {
    console.log('Edit goal:', id);
    
    // In a real app, you would fetch the goal data from your API
    // For demo purposes, let's use mock data
    const mockGoals = {
        "1": {
            id: "1",
            title: "Emergency Fund",
            category: "savings",
            targetAmount: "10000",
            currentAmount: "6500",
            targetDate: "2025-12-31",
            description: "Build an emergency fund to cover 6 months of expenses."
        },
        "2": {
            id: "2",
            title: "New Car",
            category: "automobile",
            targetAmount: "25000",
            currentAmount: "8200",
            targetDate: "2026-06-30",
            description: "Save for down payment on a new electric vehicle."
        },
        "3": {
            id: "3",
            title: "Vacation Fund",
            category: "travel",
            targetAmount: "3500",
            currentAmount: "3500",
            targetDate: "2025-05-15",
            description: "Fund for summer vacation to Europe."
        },
        "4": {
            id: "4",
            title: "Home Down Payment",
            category: "housing",
            targetAmount: "80000",
            currentAmount: "35000",
            targetDate: "2028-07-31",
            description: "Save for 20% down payment on first home."
        },
        "5": {
            id: "5",
            title: "Education Fund",
            category: "education",
            targetAmount: "15000",
            currentAmount: "4200",
            targetDate: "2026-12-31",
            description: "Fund for professional certificate program."
        }
    };
    
    const goal = mockGoals[id];
    if (goal) {
        showGoalModal(goal);
    } else {
        showNotification('Goal not found', 'error');
    }
}

// Delete goal
function deleteGoal(id) {
    console.log('Delete goal:', id);
    
    if (confirm('Are you sure you want to delete this goal?')) {
        // In a real app, you would send a delete request to your API
        // For demo purposes, let's simulate a successful delete
        showNotification('Goal deleted successfully', 'success');
        
        // Refresh goals (in a real app, this would fetch from API)
        // For now, just reload the page after a short delay
        setTimeout(() => {
            switchTab('goals');
        }, 1000);
    }
}

// Filter goals
function filterGoals(filter) {
    console.log('Filtering goals:', filter);
    
    const goalItems = document.querySelectorAll('.goal-item');
    
    goalItems.forEach(item => {
        const badge = item.querySelector('.goal-badge');
        
        switch (filter) {
            case 'in-progress':
                item.style.display = badge && badge.classList.contains('in-progress') ? 'block' : 'none';
                break;
            case 'completed':
                item.style.display = badge && badge.classList.contains('completed') ? 'block' : 'none';
                break;
            default: // 'all'
                item.style.display = 'block';
        }
    });
    
    // If no goals visible after filter, show message
    let visibleItems = 0;
    goalItems.forEach(item => {
        if (item.style.display !== 'none') {
            visibleItems++;
        }
    });
    
    const goalsList = document.querySelector('.goals-list');
    let noResultsMsg = document.getElementById('no-goals-results');
    
    if (visibleItems === 0) {
        if (!noResultsMsg) {
            noResultsMsg = document.createElement('div');
            noResultsMsg.id = 'no-goals-results';
            noResultsMsg.className = 'no-results-message';
            noResultsMsg.textContent = 'No goals match the selected filter.';
            goalsList.appendChild(noResultsMsg);
        }
    } else if (noResultsMsg) {
        noResultsMsg.remove();
    }
}

// Create the contribution modal HTML
function createContributionModal(goalId) {
    const modal = document.createElement('div');
    modal.className = 'modal contribution-modal';
    modal.id = 'contribution-modal';
    
    // Get goal data (in a real app, you would fetch this from your API)
    const mockGoals = {
        "1": {
            id: "1",
            title: "Emergency Fund",
            category: "savings",
            targetAmount: "10000",
            currentAmount: "6500",
            targetDate: "2025-12-31",
            description: "Build an emergency fund to cover 6 months of expenses."
        },
        "2": {
            id: "2",
            title: "New Car",
            category: "automobile",
            targetAmount: "25000",
            currentAmount: "8200",
            targetDate: "2026-06-30",
            description: "Save for down payment on a new electric vehicle."
        },
        "3": {
            id: "3",
            title: "Vacation Fund",
            category: "travel",
            targetAmount: "3500",
            currentAmount: "3500",
            targetDate: "2025-05-15",
            description: "Fund for summer vacation to Europe."
        },
        "4": {
            id: "4",
            title: "Home Down Payment",
            category: "housing",
            targetAmount: "80000",
            currentAmount: "35000",
            targetDate: "2028-07-31",
            description: "Save for 20% down payment on first home."
        },
        "5": {
            id: "5",
            title: "Education Fund",
            category: "education",
            targetAmount: "15000",
            currentAmount: "4200",
            targetDate: "2026-12-31",
            description: "Fund for professional certificate program."
        }
    };
    
    const goal = mockGoals[goalId];
    
    if (!goal) {
        showNotification('Goal not found', 'error');
        return null;
    }
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Add Contribution</h3>
                <button class="close-modal">&times;</button>
            </div>
            <div class="modal-body">
                <div class="contribution-details">
                    <span><strong>Goal:</strong> ${goal.title}</span>
                    <span><strong>Current:</strong> $${parseFloat(goal.currentAmount).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                    <span><strong>Target:</strong> $${parseFloat(goal.targetAmount).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                    <span><strong>Remaining:</strong> $${(parseFloat(goal.targetAmount) - parseFloat(goal.currentAmount)).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                </div>
                <form id="contribution-form">
                    <input type="hidden" id="contribution-goal-id" value="${goalId}">
                    <div class="form-group">
                        <label for="contribution-amount">Contribution Amount</label>
                        <input type="number" id="contribution-amount" step="0.01" min="0.01" placeholder="0.00" required>
                    </div>
                    <div class="form-group">
                        <label for="contribution-date">Date</label>
                        <input type="date" id="contribution-date" value="${formatDate(new Date())}" required>
                    </div>
                    <div class="form-group">
                        <label for="contribution-notes">Notes (Optional)</label>
                        <textarea id="contribution-notes" placeholder="Add notes about this contribution"></textarea>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary" id="cancel-contribution">Cancel</button>
                <button class="btn-primary" id="save-contribution">Add Contribution</button>
            </div>
        </div>
    `;
    
    return modal;
}

// Show contribution modal
function showContributionModal(goalId) {
    // Create modal
    const modal = createContributionModal(goalId);
    if (!modal) return;
    
    document.body.appendChild(modal);
    
    // Add event listeners
    const closeBtn = modal.querySelector('.close-modal');
    const cancelBtn = modal.querySelector('#cancel-contribution');
    const saveBtn = modal.querySelector('#save-contribution');
    
    closeBtn.addEventListener('click', closeContributionModal);
    cancelBtn.addEventListener('click', closeContributionModal);
    
    saveBtn.addEventListener('click', function() {
        saveContribution();
    });
    
    // Show the modal
    modal.style.display = 'flex';
}

// Close contribution modal
function closeContributionModal() {
    const modal = document.getElementById('contribution-modal');
    if (modal) {
        modal.remove();
    }
}

// Save contribution
function saveContribution() {
    const form = document.getElementById('contribution-form');
    
    if (form.checkValidity()) {
        const goalId = document.getElementById('contribution-goal-id').value;
        const amount = document.getElementById('contribution-amount').value;
        const date = document.getElementById('contribution-date').value;
        const notes = document.getElementById('contribution-notes').value;
        
        const contributionData = {
            id: Date.now().toString(),
            goalId,
            amount,
            date,
            notes
        };
        
        // Here you would send the data to your API
        console.log('Saving contribution:', contributionData);
        
        // For demo purposes, let's simulate a successful save
        closeContributionModal();
        
        // Show success message
        showNotification('Contribution added successfully', 'success');
        
        // Refresh goals (in a real app, this would fetch from API)
        // For now, just reload the page after a short delay
        setTimeout(() => {
            switchTab('goals');
        }, 1000);
    } else {
        // Trigger form validation
        form.reportValidity();
    }
}

// Show goal history
function showGoalHistory(goalId) {
    console.log('Show history for goal:', goalId);
    
    // In a real app, you would fetch the goal history from your API
    // For demo purposes, let's use mock data
    const mockHistory = [
        { date: '2025-01-15', amount: 1000, notes: 'Initial deposit' },
        { date: '2025-02-10', amount: 500, notes: 'Monthly contribution' },
        { date: '2025-03-12', amount: 500, notes: 'Monthly contribution' },
        { date: '2025-04-09', amount: 750, notes: 'Bonus contribution' },
        { date: '2025-05-11', amount: 750, notes: 'Final contribution' }
    ];
    
    // Create and show a modal with the history
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'history-modal';
    
    let historyHTML = '';
    mockHistory.forEach(item => {
        const date = new Date(item.date);
        historyHTML += `
            <tr>
                <td>${date.toLocaleDateString()}</td>
                <td>$${parseFloat(item.amount).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                <td>${item.notes}</td>
            </tr>
        `;
    });
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Contribution History</h3>
                <button class="close-modal">&times;</button>
            </div>
            <div class="modal-body">
                <table class="history-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Amount</th>
                            <th>Notes</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${historyHTML}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td><strong>Total</strong></td>
                            <td><strong>$${mockHistory.reduce((sum, item) => sum + parseFloat(item.amount), 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</strong></td>
                            <td></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
            <div class="modal-footer">
                <button class="btn-primary" id="close-history">Close</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add event listeners
    const closeBtn = modal.querySelector('.close-modal');
    const closeHistoryBtn = modal.querySelector('#close-history');
    
    closeBtn.addEventListener('click', function() {
        modal.remove();
    });
    
    closeHistoryBtn.addEventListener('click', function() {
        modal.remove();
    });
    
    // Show the modal
    modal.style.display = 'flex';
}

// AI Insights functionality
function bindInsightEvents() {
    // Refresh insights button
    const refreshBtn = document.getElementById('refresh-insights-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            refreshInsights();
        });
    }
    
    // Insight filtering
    const filterButtons = document.querySelectorAll('.insight-filter-btn');
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            const filter = this.getAttribute('data-filter');
            filterInsights(filter);
            
            // Update active button
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // View details buttons
    const detailButtons = document.querySelectorAll('.view-details-btn');
    detailButtons.forEach(button => {
        button.addEventListener('click', function() {
            const insightCard = this.closest('.insight-card');
            const insightType = insightCard.getAttribute('data-type');
            const insightTitle = insightCard.querySelector('.insight-header h3').textContent;
            const insightContent = insightCard.querySelector('.insight-content p').textContent;
            
            showInsightDetails(insightTitle, insightContent, insightType);
        });
    });
    
    // Close detail modal
    const closeDetailBtn = document.getElementById('close-detail-modal');
    const closeModalBtn = document.querySelector('#insight-detail-modal .close-modal');
    
    if (closeDetailBtn) {
        closeDetailBtn.addEventListener('click', closeInsightDetails);
    }
    
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeInsightDetails);
    }
}

// Show insight details
function showInsightDetails(title, content, type) {
    const modal = document.getElementById('insight-detail-modal');
    const modalTitle = document.getElementById('detail-modal-title');
    const modalContent = document.getElementById('detail-modal-content');
    
    if (!modal || !modalTitle || !modalContent) return;
    
    modalTitle.textContent = title;
    
    // Generate detailed content based on insight type
    let detailedContent = '';
    
    switch (type) {
        case 'spending':
            detailedContent = getSpendingInsightDetails(title, content);
            break;
        case 'saving':
            detailedContent = getSavingInsightDetails(title, content);
            break;
        case 'budget':
            detailedContent = getBudgetInsightDetails(title, content);
            break;
        case 'goals':
            detailedContent = getGoalInsightDetails(title, content);
            break;
        default:
            detailedContent = `<div class="detail-section"><p>${content}</p></div>`;
    }
    
    modalContent.innerHTML = detailedContent;
    
    // Show the modal
    modal.style.display = 'flex';
    
    // If there's a chart in the details, initialize it
    if (document.getElementById('insightDetailChart')) {
        initializeInsightDetailChart(type);
    }
}

// Close insight details
function closeInsightDetails() {
    const modal = document.getElementById('insight-detail-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Get detailed content for spending insights
function getSpendingInsightDetails(title, content) {
    if (title.includes('Unusual Spending')) {
        return `
            <div class="detail-section">
                <h4>What We Found</h4>
                <p>${content}</p>
                <p>Your dining expenses this month are $425, compared to an average of $293 over the past three months. This represents a 45% increase.</p>
            </div>
            <div class="detail-section">
                <h4>Spending Trend</h4>
                <canvas id="insightDetailChart" class="detail-chart"></canvas>
            </div>
            <div class="detail-section">
                <h4>Top Dining Transactions</h4>
                <p>1. Cheesecake Factory - $85.43 (July 18)</p>
                <p>2. Local Steakhouse - $112.87 (July 12)</p>
                <p>3. Sushi Restaurant - $79.24 (July 5)</p>
                <p>4. Italian Bistro - $64.92 (July 22)</p>
            </div>
            <div class="detail-section">
                <h4>Recommendation</h4>
                <p>Consider setting a dining budget for the rest of the month to control spending in this category.</p>
            </div>
        `;
    } else if (title.includes('Income Analysis')) {
        return `
            <div class="detail-section">
                <h4>Income Growth</h4>
                <p>${content}</p>
                <p>Your average monthly income has increased from $3,850 to $4,158 compared to the same quarter last year.</p>
            </div>
            <div class="detail-section">
                <h4>Income Trend</h4>
                <canvas id="insightDetailChart" class="detail-chart"></canvas>
            </div>
            <div class="detail-section">
                <h4>Recommendation</h4>
                <p>Based on your financial goals, we recommend allocating this additional income as follows:</p>
                <p>• $200/month to your Home Down Payment goal</p>
                <p>• $60/month to your Emergency Fund</p>
                <p>• $48/month to your retirement contributions</p>
            </div>
        `;
    } else {
        return `<div class="detail-section"><p>${content}</p></div>`;
    }
}

// Get detailed content for saving insights
function getSavingInsightDetails(title, content) {
    if (title.includes('Savings Opportunity')) {
        return `
            <div class="detail-section">
                <h4>Subscription Analysis</h4>
                <p>${content}</p>
                <p>We analyzed your recurring subscriptions and found opportunities to save by switching to annual plans.</p>
            </div>
            <div class="detail-section">
                <h4>Subscription Breakdown</h4>
                <canvas id="insightDetailChart" class="detail-chart"></canvas>
            </div>
            <div class="detail-section">
                <h4>Potential Savings</h4>
                <p>• Streaming Service A: $8.99/month → $89.99/year (Save $17.89)</p>
                <p>• Streaming Service B: $12.99/month → $119.99/year (Save $35.89)</p>
                <p>• Cloud Storage: $9.99/month → $99.99/year (Save $19.89)</p>
                <p>• Music Subscription: $9.99/month → $99.99/year (Save $19.89)</p>
            </div>
            <div class="detail-section">
                <h4>Action Steps</h4>
                <p>1. Review each subscription to ensure you still use the service</p>
                <p>2. For services you plan to keep, consider switching to annual plans</p>
                <p>3. Set a reminder to review all subscriptions quarterly</p>
            </div>
        `;
    } else if (title.includes('Smart Recommendation')) {
        return `
            <div class="detail-section">
                <h4>Cash Allocation</h4>
                <p>${content}</p>
                <p>Your checking account currently has a balance of $2,800, which is $1,800 above your average monthly expenses.</p>
            </div>
            <div class="detail-section">
                <h4>Interest Comparison</h4>
                <canvas id="insightDetailChart" class="detail-chart"></canvas>
            </div>
            <div class="detail-section">
                <h4>Potential Earnings</h4>
                <p>Current checking interest rate: 0.01% APY</p>
                <p>High-yield savings account: 4.5% APY</p>
                <p>Annual earnings on $2,000:</p>
                <p>• Checking account: $0.20</p>
                <p>• High-yield savings: $90.00</p>
            </div>
            <div class="detail-section">
                <h4>Recommendation</h4>
                <p>Transfer $2,000 to your high-yield savings account while keeping $800 in checking as a buffer for unexpected expenses.</p>
            </div>
        `;
    } else {
        return `<div class="detail-section"><p>${content}</p></div>`;
    }
}

// Get detailed content for budget insights
function getBudgetInsightDetails(title, content) {
    return `
        <div class="detail-section">
            <h4>Budget Alert</h4>
            <p>${content}</p>
            <p>Your Entertainment budget is $150 per month, and you've already spent $135 with 10 days remaining.</p>
        </div>
        <div class="detail-section">
            <h4>Entertainment Spending</h4>
            <canvas id="insightDetailChart" class="detail-chart"></canvas>
        </div>
        <div class="detail-section">
            <h4>Recent Transactions</h4>
            <p>1. Movie Tickets - $32.50 (July 18)</p>
            <p>2. Streaming Service - $14.99 (July 15)</p>
            <p>3. Concert Tickets - $85.00 (July 9)</p>
            <p>4. Online Game Purchase - $22.99 (July 5)</p>
        </div>
        <div class="detail-section">
            <h4>Recommendations</h4>
            <p>1. Limit entertainment spending to $15 for the remainder of the month</p>
            <p>2. Look for free entertainment options in your area</p>
            <p>3. Consider adjusting your Entertainment budget for next month if needed</p>
        </div>
    `;
}

// Get detailed content for goal insights
function getGoalInsightDetails(title, content) {
    return `
        <div class="detail-section">
            <h4>Goal Progress</h4>
            <p>${content}</p>
            <p>You've been consistently contributing $400/month to your Emergency Fund goal, which is $50 above your target contribution.</p>
        </div>
        <div class="detail-section">
            <h4>Progress Timeline</h4>
            <canvas id="insightDetailChart" class="detail-chart"></canvas>
        </div>
        <div class="detail-section">
            <h4>Contribution History</h4>
            <p>• January 2025: $400</p>
            <p>• February 2025: $400</p>
            <p>• March 2025: $400</p>
            <p>• April 2025: $400</p>
            <p>• May 2025: $400</p>
            <p>• June 2025: $400</p>
            <p>• July 2025: $400</p>
        </div>
        <div class="detail-section">
            <h4>Projected Completion</h4>
            <p>At your current contribution rate, you'll reach your target of $10,000 by October 2025, which is 2 months ahead of your December 2025 goal.</p>
        </div>
    `;
}

// Initialize insight detail chart
function initializeInsightDetailChart(type) {
    const ctx = document.getElementById('insightDetailChart');
    if (!ctx) return;
    
    // Get the Chart.js library
    if (typeof Chart === 'undefined') {
        loadScript('https://cdn.jsdelivr.net/npm/chart.js', () => {
            renderInsightDetailChart(ctx, type);
        });
    } else {
        renderInsightDetailChart(ctx, type);
    }
}

// Render insight detail chart
function renderInsightDetailChart(ctx, type) {
    let chartConfig;
    
    switch (type) {
        case 'spending':
            chartConfig = {
                type: 'bar',
                data: {
                    labels: ['April', 'May', 'June', 'July'],
                    datasets: [{
                        label: 'Dining Expenses',
                        data: [278, 310, 292, 425],
                        backgroundColor: '#3b82f6',
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Amount ($)'
                            }
                        }
                    }
                }
            };
            break;
        
        case 'saving':
            chartConfig = {
                type: 'bar',
                data: {
                    labels: ['Monthly Plans', 'Annual Plans'],
                    datasets: [{
                        label: 'Cost Over 12 Months',
                        data: [503.76, 409.96],
                        backgroundColor: ['#ef4444', '#10b981'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Cost ($)'
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            display: false
                        }
                    }
                }
            };
            break;
        
        case 'budget':
            chartConfig = {
                type: 'line',
                data: {
                    labels: ['1', '5', '10', '15', '20', '25', '30'],
                    datasets: [{
                        label: 'Spending',
                        data: [0, 22.99, 107.99, 122.98, 135.48, null, null],
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Budget Limit',
                        data: [5, 25, 50, 75, 100, 125, 150],
                        borderColor: '#ef4444',
                        borderDash: [5, 5],
                        fill: false,
                        pointRadius: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Amount ($)'
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: 'Day of Month'
                            }
                        }
                    }
                }
            };
            break;
        
        case 'goals':
            chartConfig = {
                type: 'line',
                data: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                    datasets: [{
                        label: 'Actual Progress',
                        data: [4300, 4700, 5100, 5500, 5900, 6300, 6700, null, null, null, null, null],
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Projected Progress',
                        data: [null, null, null, null, null, null, 6700, 7100, 7500, 7900, 8300, 8700],
                        borderColor: '#10b981',
                        borderDash: [5, 5],
                        backgroundColor: 'rgba(16, 185, 129, 0.05)',
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Original Target',
                        data: [4300, 4650, 5000, 5350, 5700, 6050, 6400, 6750, 7100, 7450, 7800, 8150],
                        borderColor: '#3b82f6',
                        borderDash: [5, 5],
                        fill: false,
                        pointRadius: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            title: {
                                display: true,
                                text: 'Amount ($)'
                            }
                        }
                    }
                }
            };
            break;
        
        default:
            // Default chart if type doesn't match
            chartConfig = {
                type: 'bar',
                data: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                    datasets: [{
                        label: 'Data',
                        data: [12, 19, 3, 5, 2, 3],
                        backgroundColor: '#3b82f6',
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            };
    }
    
    new Chart(ctx, chartConfig);
}

// Settings functionality
function bindSettingsEvents() {
    // Profile settings
    const saveProfileBtn = document.getElementById('save-profile');
    if (saveProfileBtn) {
        saveProfileBtn.addEventListener('click', saveProfileSettings);
    }
    
    // Appearance settings
    const themeOptions = document.querySelectorAll('.theme-option');
    themeOptions.forEach(option => {
        option.addEventListener('click', function() {
            const theme = this.getAttribute('data-theme');
            selectTheme(theme);
        });
    });
    
    const saveAppearanceBtn = document.getElementById('save-appearance');
    if (saveAppearanceBtn) {
        saveAppearanceBtn.addEventListener('click', saveAppearanceSettings);
    }
    
    // Notification settings
    const saveNotificationsBtn = document.getElementById('save-notifications');
    if (saveNotificationsBtn) {
        saveNotificationsBtn.addEventListener('click', saveNotificationSettings);
    }
    
    // Security settings
    const changePasswordBtn = document.getElementById('change-password');
    if (changePasswordBtn) {
        changePasswordBtn.addEventListener('click', changePassword);
    }
    
    // Connected accounts
    const disconnectBtns = document.querySelectorAll('.disconnect-btn');
    disconnectBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const accountItem = this.closest('.account-item');
            const accountName = accountItem.querySelector('h4').textContent;
            disconnectAccount(accountName, accountItem);
        });
    });
    
    const connectBtn = document.querySelector('.connect-btn');
    if (connectBtn) {
        connectBtn.addEventListener('click', showConnectAccountModal);
    }
    
    // Data management
    const exportBtn = document.querySelector('.export-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportData);
    }
    
    const importBtn = document.querySelector('.import-btn');
    if (importBtn) {
        importBtn.addEventListener('click', importData);
    }
    
    const deleteAccountBtn = document.querySelector('.delete-account-btn');
    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener('click', confirmDeleteAccount);
    }
}

// Populate user settings
function populateUserSettings() {
    // In a real app, you would fetch the user's settings from your API
    // For demo purposes, we'll use mock data
    const mockUser = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '(555) 123-4567',
        theme: 'light',
        currency: 'USD',
        dateFormat: 'MM/DD/YYYY',
        notifications: {
            weeklySummary: true,
            budgetAlerts: true,
            goalAchievement: true,
            aiInsights: false,
            marketing: false
        }
    };
    
    // Populate profile fields
    const nameInput = document.getElementById('settings-name');
    const emailInput = document.getElementById('settings-email');
    const phoneInput = document.getElementById('settings-phone');
    
    if (nameInput) nameInput.value = mockUser.name;
    if (emailInput) emailInput.value = mockUser.email;
    if (phoneInput) phoneInput.value = mockUser.phone;
    
    // Set theme
    selectTheme(mockUser.theme, false);
    
    // Set currency
    const currencySelect = document.getElementById('settings-currency');
    if (currencySelect) currencySelect.value = mockUser.currency;
    
    // Set date format
    const dateFormatSelect = document.getElementById('settings-date-format');
    if (dateFormatSelect) dateFormatSelect.value = mockUser.dateFormat;
    
    // Set notification preferences
    const notificationToggles = document.querySelectorAll('.toggle-option input[type="checkbox"]');
    if (notificationToggles.length > 0) {
        notificationToggles[0].checked = mockUser.notifications.weeklySummary;
        notificationToggles[1].checked = mockUser.notifications.budgetAlerts;
        notificationToggles[2].checked = mockUser.notifications.goalAchievement;
        notificationToggles[3].checked = mockUser.notifications.aiInsights;
        notificationToggles[4].checked = mockUser.notifications.marketing;
    }
}

// Save profile settings
function saveProfileSettings() {
    const nameInput = document.getElementById('settings-name');
    const phoneInput = document.getElementById('settings-phone');
    
    // Validate inputs
    if (!nameInput.value.trim()) {
        showNotification('Please enter your name', 'error');
        return;
    }
    
    // In a real app, you would send the updated profile to your API
    const profileData = {
        name: nameInput.value,
        phone: phoneInput.value
    };
    
    console.log('Saving profile settings:', profileData);
    
    // Simulate API call delay
    setTimeout(() => {
        showNotification('Profile settings saved successfully', 'success');
        
        // Update user name display in header
        const userNameElements = document.querySelectorAll('#userName, #user-name, #user-greeting');
        userNameElements.forEach(el => {
            if (el) el.textContent = nameInput.value;
        });
        
        // Update user avatar initial
        const userAvatar = document.getElementById('user-avatar');
        if (userAvatar) {
            userAvatar.textContent = nameInput.value.charAt(0).toUpperCase();
        }
    }, 500);
}

// Select theme
function selectTheme(theme, save = true) {
    const themeOptions = document.querySelectorAll('.theme-option');
    themeOptions.forEach(option => {
        if (option.getAttribute('data-theme') === theme) {
            option.classList.add('active');
        } else {
            option.classList.remove('active');
        }
    });
    
    // In a real app, you would apply the theme to the entire app
    console.log('Theme selected:', theme);
    
    if (save) {
        // Save theme preference (in a real app, this would be saved to user preferences)
        localStorage.setItem('theme', theme);
    }
}

// Save appearance settings
function saveAppearanceSettings() {
    const activeTheme = document.querySelector('.theme-option.active').getAttribute('data-theme');
    const currencySelect = document.getElementById('settings-currency');
    const dateFormatSelect = document.getElementById('settings-date-format');
    
    // In a real app, you would send the updated settings to your API
    const appearanceData = {
        theme: activeTheme,
        currency: currencySelect.value,
        dateFormat: dateFormatSelect.value
    };
    
    console.log('Saving appearance settings:', appearanceData);
    
    // Simulate API call delay
    setTimeout(() => {
        showNotification('Appearance settings saved successfully', 'success');
    }, 500);
}

// Save notification settings
function saveNotificationSettings() {
    const notificationToggles = document.querySelectorAll('.toggle-option input[type="checkbox"]');
    
    // In a real app, you would send the updated settings to your API
    const notificationData = {
        weeklySummary: notificationToggles[0].checked,
        budgetAlerts: notificationToggles[1].checked,
        goalAchievement: notificationToggles[2].checked,
        aiInsights: notificationToggles[3].checked,
        marketing: notificationToggles[4].checked
    };
    
    console.log('Saving notification settings:', notificationData);
    
    // Simulate API call delay
    setTimeout(() => {
        showNotification('Notification settings saved successfully', 'success');
    }, 500);
}

// Change password
function changePassword() {
    const currentPassword = document.getElementById('current-password');
    const newPassword = document.getElementById('new-password');
    const confirmPassword = document.getElementById('confirm-password');
    
    // Validate inputs
    if (!currentPassword.value) {
        showNotification('Please enter your current password', 'error');
        return;
    }
    
    if (!newPassword.value) {
        showNotification('Please enter a new password', 'error');
        return;
    }
    
    if (newPassword.value !== confirmPassword.value) {
        showNotification('New passwords do not match', 'error');
        return;
    }
    
    // Validate password strength (simple check)
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
    if (!passwordRegex.test(newPassword.value)) {
        showNotification('New password does not meet the requirements', 'error');
        return;
    }
    
    // In a real app, you would send the password change request to your API
    const passwordData = {
        currentPassword: currentPassword.value,
        newPassword: newPassword.value
    };
    
    console.log('Changing password');
    
    // Simulate API call delay
    setTimeout(() => {
        showNotification('Password changed successfully', 'success');
        
        // Clear password fields
        currentPassword.value = '';
        newPassword.value = '';
        confirmPassword.value = '';
    }, 500);
}

// Disconnect account
function disconnectAccount(accountName, accountItem) {
    // Confirm before disconnecting
    if (confirm(`Are you sure you want to disconnect ${accountName}?`)) {
        // In a real app, you would send the disconnection request to your API
        console.log('Disconnecting account:', accountName);
        
        // Simulate API call delay
        setTimeout(() => {
            // Visual feedback: fade out the item
            accountItem.style.opacity = '0.5';
            accountItem.style.pointerEvents = 'none';
            
            showNotification(`${accountName} disconnected successfully`, 'success');
            
            // In a real app, you might want to remove the item or update its status
        }, 500);
    }
}

// Show connect account modal
function showConnectAccountModal() {
    // In a real app, you would show a modal with a list of banks/services to connect to
    alert('This would open a modal to connect a new financial account. In a real app, this would integrate with services like Plaid or similar.');
}

// Export data
function exportData() {
    // In a real app, you would generate and download a CSV/JSON file
    console.log('Exporting data');
    
    // Simulate delay
    setTimeout(() => {
        showNotification('Your data is being exported. You will receive a download link shortly.', 'info');
        
        // Simulate download starting after a delay
        setTimeout(() => {
            // Create a dummy CSV file for download
            const dummyData = 'Date,Description,Category,Amount\n2025-07-20,Salary Deposit,Income,2920.00\n2025-07-19,Whole Foods Market,Groceries,-84.32\n2025-07-18,Electricity Bill,Utilities,-145.86';
            const blob = new Blob([dummyData], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = 'finance_data_export.csv';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            showNotification('Data exported successfully', 'success');
        }, 1500);
    }, 500);
}

// Import data
function importData() {
    // In a real app, you would show a file picker and parse the uploaded file
    // For this demo, we'll simulate the file picker dialog
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,.json';
    
    input.onchange = function(event) {
        const file = event.target.files[0];
        if (file) {
            console.log('File selected for import:', file.name);
            
            // Simulate processing
            showNotification(`Processing ${file.name}...`, 'info');
            
            // Simulate import completion after a delay
            setTimeout(() => {
                showNotification('Data imported successfully', 'success');
            }, 1500);
        }
    };
    
    input.click();
}

// Confirm delete account
function confirmDeleteAccount() {
    // Show confirmation dialog
    const result = confirm('WARNING: This will permanently delete your account and all associated data. This action cannot be undone. Are you sure you want to proceed?');
    
    if (result) {
        // Double-check with another confirmation
        const confirmText = prompt('Please type "DELETE" to confirm that you want to permanently delete your account:');
        
        if (confirmText === 'DELETE') {
            // In a real app, you would send the account deletion request to your API
            console.log('Deleting account');
            
            // Simulate API call delay
            setTimeout(() => {
                showNotification('Your account has been scheduled for deletion. You will be logged out shortly.', 'info');
                
                // Simulate logout after a delay
                setTimeout(() => {
                    // In a real app, you would redirect to a logout endpoint
                    window.location.href = 'login.html';
                }, 3000);
            }, 500);
        } else {
            showNotification('Account deletion cancelled', 'info');
        }
    }
}

// Add placeholder implementation for populateTransactionsTable
function populateTransactionsTable(transactions) {
    console.log('Populating transactions table with:', transactions);
    
    const tableBody = document.querySelector('.transactions-table tbody');
    if (!tableBody) {
        console.error('Transactions table body not found');
        return;
    }
    
    // Clear the table
    tableBody.innerHTML = '';
    
    // Check if we have transactions
    if (!transactions || transactions.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="5" class="no-data">No transactions found</td>';
        tableBody.appendChild(row);
        return;
    }
    
    // Add each transaction to the table
    transactions.forEach(transaction => {
        const row = document.createElement('tr');
        const date = new Date(transaction.date);
        const formattedDate = date.toLocaleDateString();
        const isExpense = transaction.amount < 0;
        
        row.innerHTML = `
            <td>${formattedDate}</td>
            <td>${transaction.description}</td>
            <td>${transaction.category}</td>
            <td class="${isExpense ? 'expense' : 'income'}">${formatCurrency(transaction.amount)}</td>
            <td>
                <button class="btn-icon edit-transaction" data-id="${transaction.id}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon delete-transaction" data-id="${transaction.id}">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // Add event listeners for edit and delete buttons
    document.querySelectorAll('.edit-transaction').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            editTransaction(id);
        });
    });
    
    document.querySelectorAll('.delete-transaction').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            deleteTransaction(id);
        });
    });
}

// Add placeholder implementation for updateTransactionSummary
function updateTransactionSummary(transactions) {
    console.log('Updating transaction summary with:', transactions);
    
    // Calculate totals
    let income = 0;
    let expenses = 0;
    
    transactions.forEach(transaction => {
        if (transaction.amount > 0) {
            income += transaction.amount;
        } else {
            expenses += Math.abs(transaction.amount);
        }
    });
    
    const balance = income - expenses;
    
    // Update the summary elements if they exist
    const incomeEl = document.querySelector('.summary-income .amount');
    const expensesEl = document.querySelector('.summary-expenses .amount');
    const balanceEl = document.querySelector('.summary-balance .amount');
    
    if (incomeEl) incomeEl.textContent = formatCurrency(income);
    if (expensesEl) expensesEl.textContent = formatCurrency(expenses);
    if (balanceEl) balanceEl.textContent = formatCurrency(balance);
}

// Add placeholder implementation for populateBudgetsContainer
function populateBudgetsContainer(budgets) {
    console.log('Populating budgets container with:', budgets);
    
    const budgetsContainer = document.querySelector('.budget-categories-list');
    if (!budgetsContainer) {
        console.error('Budgets container not found');
        return;
    }
    
    // Clear the container
    budgetsContainer.innerHTML = '';
    
    // Check if we have budgets
    if (!budgets || budgets.length === 0) {
        budgetsContainer.innerHTML = '<div class="no-data">No budgets found</div>';
        return;
    }
    
    // Add each budget to the container
    budgets.forEach(budget => {
        const spent = budget.spent || 0;
        const percentage = (spent / budget.amount) * 100;
        
        const budgetItem = document.createElement('div');
        budgetItem.className = 'budget-category-item';
        budgetItem.dataset.category = budget.category.toLowerCase();
        
        budgetItem.innerHTML = `
            <div class="category-info">
                <div class="category-name">
                    <i class="fas ${getCategoryIcon(budget.category)}"></i>
                    <span>${budget.category}</span>
                </div>
                <div class="budget-progress">
                    <div class="progress-bar">
                        <div class="progress-fill ${percentage > 100 ? 'over' : percentage > 80 ? 'warning' : ''}" 
                             style="width: ${Math.min(percentage, 100)}%"></div>
                    </div>
                    <div class="progress-numbers">
                        <span class="spent">${formatCurrency(spent)}</span>
                        <span class="separator">/</span>
                        <span class="total">${formatCurrency(budget.amount)}</span>
                    </div>
                </div>
            </div>
            <div class="category-actions">
                <button class="btn-icon edit-budget" data-id="${budget.id}">
                    <i class="fas fa-edit"></i>
                </button>
            </div>
        `;
        
        budgetsContainer.appendChild(budgetItem);
    });
    
    // Add event listeners
    document.querySelectorAll('.edit-budget').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            editBudget(id);
        });
    });
}

// Add placeholder implementation for updateBudgetSummary
function updateBudgetSummary(budgets) {
    console.log('Updating budget summary with:', budgets);
    
    // Calculate totals
    let totalBudget = 0;
    let totalSpent = 0;
    
    budgets.forEach(budget => {
        totalBudget += budget.amount;
        totalSpent += (budget.spent || 0);
    });
    
    const remaining = totalBudget - totalSpent;
    const percentage = (totalSpent / totalBudget) * 100;
    
    // Update the summary elements if they exist
    const totalEl = document.querySelector('.budget-total .amount');
    const spentEl = document.querySelector('.budget-spent .amount');
    const remainingEl = document.querySelector('.budget-remaining .amount');
    const progressFill = document.querySelector('.budget-progress-fill');
    
    if (totalEl) totalEl.textContent = formatCurrency(totalBudget);
    if (spentEl) spentEl.textContent = formatCurrency(totalSpent);
    if (remainingEl) remainingEl.textContent = formatCurrency(remaining);
    if (progressFill) {
        progressFill.style.width = `${Math.min(percentage, 100)}%`;
        if (percentage > 100) {
            progressFill.classList.add('over');
        } else if (percentage > 80) {
            progressFill.classList.add('warning');
        }
    }
}

// Add placeholder implementation for populateGoalsList
function populateGoalsList(goals) {
    console.log('Populating goals list with:', goals);
    
    const goalsList = document.querySelector('.goals-list');
    if (!goalsList) {
        console.error('Goals list not found');
        return;
    }
    
    // Clear the list
    goalsList.innerHTML = '';
    
    // Check if we have goals
    if (!goals || goals.length === 0) {
        goalsList.innerHTML = '<div class="no-data">No goals found</div>';
        return;
    }
    
    // Add each goal to the list
    goals.forEach(goal => {
        const percentage = (goal.currentAmount / goal.targetAmount) * 100;
        const deadline = new Date(goal.deadline);
        const formattedDeadline = deadline.toLocaleDateString();
        
        const goalItem = document.createElement('div');
        goalItem.className = 'goal-card';
        
        goalItem.innerHTML = `
            <div class="goal-header">
                <div class="goal-title">${goal.name}</div>
                <div class="goal-actions">
                    <button class="btn-icon edit-goal" data-id="${goal.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon add-contribution" data-id="${goal.id}">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
            </div>
            <div class="goal-progress">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${percentage}%"></div>
                </div>
                <div class="progress-numbers">
                    <span class="current">${formatCurrency(goal.currentAmount)}</span>
                    <span class="separator">/</span>
                    <span class="target">${formatCurrency(goal.targetAmount)}</span>
                </div>
            </div>
            <div class="goal-info">
                <div class="goal-deadline">
                    <i class="fas fa-calendar"></i>
                    <span>${formattedDeadline}</span>
                </div>
                <div class="goal-type">
                    <i class="fas ${getGoalTypeIcon(goal.type)}"></i>
                    <span>${goal.type}</span>
                </div>
            </div>
        `;
        
        goalsList.appendChild(goalItem);
    });
    
    // Add event listeners
    document.querySelectorAll('.edit-goal').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            editGoal(id);
        });
    });
    
    document.querySelectorAll('.add-contribution').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            showContributionModal(id);
        });
    });
}

// Add placeholder implementation for updateGoalSummary
function updateGoalSummary(goals) {
    console.log('Updating goal summary with:', goals);
    
    // Calculate totals
    let totalTarget = 0;
    let totalCurrent = 0;
    
    goals.forEach(goal => {
        totalTarget += goal.targetAmount;
        totalCurrent += goal.currentAmount;
    });
    
    const remaining = totalTarget - totalCurrent;
    const percentage = (totalCurrent / totalTarget) * 100;
    
    // Update the summary elements if they exist
    const targetEl = document.querySelector('.goals-target .amount');
    const currentEl = document.querySelector('.goals-current .amount');
    const remainingEl = document.querySelector('.goals-remaining .amount');
    const progressFill = document.querySelector('.goals-progress-fill');
    
    if (targetEl) targetEl.textContent = formatCurrency(totalTarget);
    if (currentEl) currentEl.textContent = formatCurrency(totalCurrent);
    if (remainingEl) remainingEl.textContent = formatCurrency(remaining);
    if (progressFill) progressFill.style.width = `${percentage}%`;
}

// Add placeholder implementation for populateInsightsContainer
function populateInsightsContainer(insights) {
    console.log('Populating insights container with:', insights);
    
    const insightsContainer = document.querySelector('.insights-container');
    if (!insightsContainer) {
        console.error('Insights container not found');
        return;
    }
    
    // Clear the container
    insightsContainer.innerHTML = '';
    
    // Check if we have insights
    if (!insights || insights.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'insights-empty';
        emptyState.innerHTML = `
            <div class="empty-icon">
                <i class="fas fa-lightbulb"></i>
            </div>
            <h3>No insights yet</h3>
            <p>As you use the app more, we'll provide personalized financial insights here.</p>
        `;
        insightsContainer.appendChild(emptyState);
        return;
    }
    
    // Add each insight to the container
    insights.forEach(insight => {
        const insightCard = document.createElement('div');
        insightCard.className = 'insight-card';
        insightCard.dataset.type = insight.type;
        
        const date = new Date(insight.date);
        const formattedDate = date.toLocaleDateString();
        
        insightCard.innerHTML = `
            <div class="insight-header">
                <div class="insight-icon ${insight.type}">
                    <i class="fas ${getInsightIcon(insight.type)}"></i>
                </div>
                <h3>${insight.title}</h3>
            </div>
            <div class="insight-content">
                <p>${insight.content}</p>
                <div class="insight-actions">
                    <button class="btn-link view-details-btn" data-id="${insight.id}">View Details</button>
                    <span class="insight-date">${formattedDate}</span>
                </div>
            </div>
        `;
        
        insightsContainer.appendChild(insightCard);
    });
    
    // Add event listeners
    document.querySelectorAll('.view-details-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            showInsightDetails(id);
        });
    });
}

// Helper function for goal type icons
function getGoalTypeIcon(type) {
    const icons = {
        'savings': 'fa-piggy-bank',
        'debt': 'fa-credit-card',
        'investment': 'fa-chart-line',
        'emergency': 'fa-shield-alt',
        'retirement': 'fa-umbrella-beach',
        'education': 'fa-graduation-cap',
        'house': 'fa-home',
        'car': 'fa-car',
        'default': 'fa-bullseye'
    };
    
    return icons[type] || icons.default;
}

// Helper function for date formatting
function formatDate(date) {
    if (!date) return '';
    
    return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// CSV Import Modal functionality
function setupCSVImportModal() {
    const openModalBtn = document.getElementById('import-csv-btn');
    const csvModal = document.getElementById('csv-import-modal');
    const closeModalBtn = document.querySelector('.close-modal');
    const cancelBtn = document.getElementById('cancel-import');
    const importBtn = document.getElementById('confirm-import');
    const fileInput = document.getElementById('csv-file-input');
    const uploadArea = document.querySelector('.csv-upload-area');
    const selectedFileName = document.getElementById('selected-file-name');
    
    // Show the modal when Import CSV button is clicked
    if (openModalBtn) {
        openModalBtn.addEventListener('click', () => {
            csvModal.style.display = 'flex';
        });
    }
    
    // Hide the modal
    function closeModal() {
        csvModal.style.display = 'none';
        fileInput.value = '';
        selectedFileName.textContent = 'No file selected';
    }
    
    // Close modal when clicking the close button
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeModal);
    }
    
    // Close modal when clicking cancel button
    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeModal);
    }
    
    // Handle file selection
    if (fileInput) {
        fileInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                selectedFileName.textContent = file.name;
            } else {
                selectedFileName.textContent = 'No file selected';
            }
        });
    }
    
    // Make the upload area clickable to trigger file input
    if (uploadArea) {
        uploadArea.addEventListener('click', () => {
            fileInput.click();
        });
    }
    
    // Handle drag and drop
    if (uploadArea) {
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('drag-over');
        });
        
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('drag-over');
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('drag-over');
            
            if (e.dataTransfer.files.length) {
                fileInput.files = e.dataTransfer.files;
                const file = e.dataTransfer.files[0];
                if (file) {
                    selectedFileName.textContent = file.name;
                }
            }
        });
    }
    
    // Handle import button click
    if (importBtn) {
        importBtn.addEventListener('click', () => {
            if (fileInput.files.length === 0) {
                alert('Please select a CSV file first');
                return;
            }
            
            const file = fileInput.files[0];
            if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
                alert('Please select a valid CSV file');
                return;
            }
            
            processCSVFile(file);
            closeModal();
        });
    }
}

// Process the uploaded CSV file
function processCSVFile(file) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
        const contents = e.target.result;
        const transactions = parseCSV(contents);
        saveTransactions(transactions);
        updateDashboardWithNewTransactions();
    };
    
    reader.onerror = function() {
        alert('Error reading the CSV file');
    };
    
    reader.readAsText(file);
}

// Parse CSV string into array of transaction objects
function parseCSV(csvString) {
    const lines = csvString.split('\n');
    const transactions = [];
    
    // Skip header line
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const values = line.split(',');
        if (values.length < 4) continue;
        
        const transaction = {
            date: values[0],
            description: values[1],
            amount: parseFloat(values[2]),
            category: values[3],
            type: parseFloat(values[2]) >= 0 ? 'income' : 'expense'
        };
        
        transactions.push(transaction);
    }
    
    return transactions;
}

// Save transactions to localStorage
function saveTransactions(newTransactions) {
    let existingTransactions = [];
    const storedTransactions = localStorage.getItem('transactions');
    
    if (storedTransactions) {
        existingTransactions = JSON.parse(storedTransactions);
    }
    
    // Combine existing and new transactions
    const updatedTransactions = [...existingTransactions, ...newTransactions];
    
    // Sort transactions by date (newest first)
    updatedTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    localStorage.setItem('transactions', JSON.stringify(updatedTransactions));
}

// Update dashboard with new transaction data
function updateDashboardWithNewTransactions() {
    // Refresh transaction list
    const transactionList = document.querySelector('.transactions-list');
    if (transactionList) {
        populateTransactionsList();
    }
    
    // Refresh charts
    updateChartData();
    
    // Update summary cards
    updateFinancialSummary();
    
    // Show success notification
    showNotification('Transactions imported successfully!', 'success');
}

// Initialize CSV Import
document.addEventListener('DOMContentLoaded', function() {
    // ... existing code ...
    setupCSVImportModal();
}); 