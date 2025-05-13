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
    loadDashboardData(); // <-- Ensure dashboard stats are loaded on page load
    // Hash-based tab navigation
    function showTabFromHash() {
        const hash = window.location.hash.replace('#', '');
        const validTabs = ['overview', 'transactions', 'budgets', 'goals', 'insights', 'settings'];
        if (validTabs.includes(hash)) {
            switchTab(hash);
        } else {
            switchTab('overview');
        }
    }
    window.addEventListener('hashchange', showTabFromHash);
    showTabFromHash();
    console.log('Root DOMContentLoaded finished.'); // Log 1: End of DOMContentLoaded
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
    // Update the URL hash
    window.location.hash = '#' + tabId;
}

// Initialize charts
function initializeCharts() {
    initializeSpendingChart();
}

// Initialize spending breakdown chart
function initializeSpendingChart() {
    const ctx = document.getElementById('spendingChart');
    if (!ctx) return;
    // Initialize with empty data
    if (typeof Chart === 'undefined') {
        loadScript('https://cdn.jsdelivr.net/npm/chart.js', () => {
            renderSpendingChart(ctx, [], []);
        });
    } else {
        renderSpendingChart(ctx, [], []);
    }
}

// Render spending breakdown chart with dynamic data and fixed colors
function renderSpendingChart(ctx, labels, data) {
    // Fixed color palette for common categories
    const categoryColors = {
        'groceries': '#10b981',      // Green
        'dining': '#f59e0b',         // Orange
        'dining out': '#f59e0b',     // Orange (alt)
        'savings': '#3b82f6',        // Blue
        'housing': '#6366f1',        // Indigo
        'utilities': '#ef4444',      // Red
        'entertainment': '#8b5cf6',  // Purple
        'shopping': '#a3e635',       // Light Green
        'health': '#f43f5e',         // Pink
        'transportation': '#64748b', // Slate
        'salary': '#22d3ee',         // Cyan
        'investment': '#fbbf24',     // Amber
        'travel': '#0ea5e9',         // Sky
        'education': '#eab308',      // Yellow
        'other': '#6b7280',          // Gray
        'income': '#22d3ee',         // Cyan
    };
    const defaultColor = '#d1d5db'; // Light gray for unknowns
    const backgroundColors = labels.map(label => {
        const key = label.toLowerCase();
        return categoryColors[key] || defaultColor;
    });
    const chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: backgroundColors,
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
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percent = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                            return `${label}: $${value.toLocaleString()} (${percent}%)`;
                        }
                    }
                }
            },
            cutout: '70%'
        }
    });
    window.spendingChart = chart;
}

// Update spending chart with real data and period filtering
function updateSpendingChartFromTransactions(transactions, period = spendingChartPeriod) {
    // Determine date range based on period
    const now = new Date();
    let startDate, endDate;
    endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    if (period === 'week') {
        // Start from the most recent Sunday
        const dayOfWeek = now.getDay();
        startDate = new Date(now);
        startDate.setDate(now.getDate() - dayOfWeek);
        startDate.setHours(0, 0, 0, 0);
    } else if (period === 'month') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (period === 'year') {
        startDate = new Date(now.getFullYear(), 0, 1);
    } else {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }
    // Only consider expenses in the selected period
    const categoryTotals = {};
    transactions.forEach(tx => {
        const txDate = new Date(tx.date);
        if (
            tx.type === 'expense' &&
            txDate >= startDate &&
            txDate <= endDate
        ) {
            const cat = tx.category || 'Other';
            categoryTotals[cat] = (categoryTotals[cat] || 0) + Math.abs(parseFloat(tx.amount));
        }
    });
    const labels = Object.keys(categoryTotals);
    const data = Object.values(categoryTotals);
    if (window.spendingChart) {
        // Rebuild the chart with new labels and data for color/legend consistency
        const ctx = window.spendingChart.ctx;
        window.spendingChart.destroy();
        renderSpendingChart(ctx, labels, data);
    }
}

// Bind period selector buttons for the spending chart
function bindSpendingChartPeriodButtons(transactions) {
    const periodButtons = document.querySelectorAll('.period');
    periodButtons.forEach(button => {
        button.addEventListener('click', function() {
            periodButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            spendingChartPeriod = this.textContent.trim().toLowerCase();
            updateSpendingChartFromTransactions(transactions, spendingChartPeriod);
        });
    });
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
    api.getTransactions()
        .then(response => {
            if (response.status === 'success') {
                updateDashboardStatsFromTransactions(response.data);
                updateSpendingChartFromTransactions(response.data, spendingChartPeriod);
                updateRecentTransactionsFromDashboard(response.data);
                bindSpendingChartPeriodButtons(response.data); // Bind after data load
            }
        })
        .catch(error => {
            console.error('Error loading dashboard data:', error);
            showNotification('Failed to load dashboard data', 'error');
        });
}

// Update dashboard statistics
function updateDashboardStatsFromTransactions(transactions) {
    // Calculate totals for current and previous month
    let income = 0, prevIncome = 0;
    let expenses = 0, prevExpenses = 0;
    let savings = 0, prevSavings = 0;
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    transactions.forEach(transaction => {
        const txDate = new Date(transaction.date);
        const month = txDate.getMonth();
        const year = txDate.getFullYear();
        // Only count current month for main numbers
        if (month === currentMonth && year === currentYear) {
            if (transaction.type === 'income') income += parseFloat(transaction.amount);
            else if (transaction.type === 'expense') expenses += Math.abs(parseFloat(transaction.amount));
            if (transaction.category && transaction.category.toLowerCase().includes('savings')) {
                savings += parseFloat(transaction.amount);
            }
        }
        // Only count previous month for percent change
        else if (month === prevMonth && year === prevMonthYear) {
            if (transaction.type === 'income') prevIncome += parseFloat(transaction.amount);
            else if (transaction.type === 'expense') prevExpenses += Math.abs(parseFloat(transaction.amount));
            if (transaction.category && transaction.category.toLowerCase().includes('savings')) {
                prevSavings += parseFloat(transaction.amount);
            }
        }
    });
    const balance = income - expenses;
    const prevBalance = prevIncome - prevExpenses;

    // Helper to calculate percent change
    function percentChange(current, prev) {
        if (prev === 0) return current === 0 ? 0 : 100;
        return ((current - prev) / Math.abs(prev)) * 100;
    }

    // Update the summary elements in the Overview tab robustly
    document.querySelectorAll('.stat-card').forEach(card => {
        const title = card.querySelector('h3')?.textContent?.toLowerCase();
        const valueEl = card.querySelector('.stat-value');
        const changeEl = card.querySelector('.stat-change');
        if (!title || !valueEl || !changeEl) return;
        let value = 0, prev = 0, pct = 0;
        if (title.includes('balance')) {
            value = balance; prev = prevBalance; pct = percentChange(balance, prev);
        } else if (title.includes('income')) {
            value = income; prev = prevIncome; pct = percentChange(income, prev);
        } else if (title.includes('expenses')) {
            value = expenses; prev = prevExpenses; pct = percentChange(expenses, prev);
        } else if (title.includes('savings')) {
            value = savings; prev = prevSavings; pct = percentChange(savings, prev);
        }
        valueEl.textContent = formatCurrency(value);
        // Format change string and color
        let sign = pct > 0 ? '+' : pct < 0 ? '-' : '';
        let absPct = Math.abs(pct).toFixed(1);
        let colorClass = pct >= 0 ? 'positive' : 'negative';
        // For expenses, a positive change is bad (red), negative is good (green)
        if (title.includes('expenses')) colorClass = pct >= 0 ? 'negative' : 'positive';
        changeEl.className = 'stat-change ' + colorClass;
        changeEl.textContent = `${sign}${absPct}% from last month`;
    });
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
    
    // Use correct field IDs for all fields
    const transaction = {
        amount: parseFloat(document.getElementById('transaction-amount').value),
        description: document.getElementById('transaction-description').value,
        category: document.getElementById('transaction-category').value,
        date: document.getElementById('transaction-date').value,
        type: document.getElementById('transaction-type').value,
        memo: document.getElementById('transaction-memo').value || null
    };
    
    // Validate form
    if (!transaction.amount || !transaction.description || !transaction.category || !transaction.date || !transaction.type) {
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

    const categorySelect = document.getElementById('budget-category-select');
    let categoryValue = categorySelect.value;
    if (categoryValue === '__custom__') {
        categoryValue = document.getElementById('budget-custom-category').value.trim();
        if (!categoryValue) {
            showNotification('Please enter a custom category name.', 'error');
            return;
        }
    }
    
    const budget = {
        category: categoryValue,
        amount: parseFloat(document.getElementById('budget-amount').value),
        period: document.getElementById('budget-period').value,
        start_date: document.getElementById('budget-start-date').value,
        notes: document.getElementById('budget-notes').value || null
    };
    
    // Validate form (amount, period, start_date are already handled)
    if (!budget.category) { // Category is now the main validation here
        showNotification('Please select or enter a category.', 'error');
        return;
    }
    if (!budget.amount || !budget.period || !budget.start_date) {
        showNotification('Please fill in amount, period, and start date.', 'error');
        return;
    }
    
    // Save budget via API
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

// Delete budget
function deleteBudget(id) {
    if (!confirm('Are you sure you want to delete this budget?')) {
        return;
    }
    
    api.deleteBudget(id)
        .then(response => {
            if (response.status === 'success') {
                showNotification('Budget deleted successfully', 'success');
                loadBudgets(); // Refresh budgets
            }
        })
        .catch(error => {
            console.error('Error deleting budget:', error);
            showNotification('Failed to delete budget', 'error');
        });
}

// Edit Budget - fetch data first (simplified)
async function editBudget(budgetId) {
    console.log('Editing budget:', budgetId);
    try {
        // In a more robust app, you might fetch just this one budget
        // For simplicity here, we find it in the locally stored list (if available)
        // Or ideally, fetch the specific budget data from the API
        // Let's assume we refetch all for now to get the data
        const response = await api.getBudgets(); 
        if (response.status === 'success') {
            const budgetData = response.data.find(b => b.id == budgetId);
            if (budgetData) {
                 // Format date correctly for the input field if needed
                 if (budgetData.start_date) {
                     budgetData.start_date = moment(budgetData.start_date).format('YYYY-MM-DD');
                 }
                 showBudgetModal(budgetData); // Show modal with real data
            } else {
                 showNotification('Budget not found.', 'error');
            }
        } else {
            showNotification('Could not load budget data for editing.', 'error');
        }
    } catch (error) {
        console.error('Error fetching budget for edit:', error);
        showNotification('Error fetching budget data.', 'error');
    }
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
    
    if (form.checkValidity()) {
        const goalId = document.getElementById('goal-id').value;
        const title = document.getElementById('goal-title').value;
        const category = document.getElementById('goal-category').value;
        const targetAmount = document.getElementById('goal-target-amount').value;
        const currentAmount = document.getElementById('goal-current-amount').value || '0';
        const targetDate = document.getElementById('goal-target-date').value;
        const description = document.getElementById('goal-description').value;
    
        // Format the goal data for the API with snake_case property names to match server validation
        const goalData = {
            name: title,
            type: category,
            target_amount: parseFloat(targetAmount),
            current_amount: parseFloat(currentAmount),
            deadline: targetDate,
            description: description
        };
        
        console.log('Saving goal with data:', goalData);
        console.log('Auth token exists:', !!localStorage.getItem('token'));
        
        const isEdit = !!goalId;
    
    // Save goal
    const savePromise = isEdit
            ? api.updateGoal(goalId, goalData)
            : api.createGoal(goalData);
    
    savePromise
        .then(response => {
                console.log('Goal save response:', response);
            if (response.status === 'success') {
                closeGoalModal();
                showNotification(
                    isEdit ? 'Goal updated successfully' : 'Goal added successfully',
                    'success'
                );
                    loadGoals(); // Refresh goals list
                } else {
                    showNotification('Failed to save goal: ' + (response.message || 'Unknown error'), 'error');
            }
        })
        .catch(error => {
            console.error('Error saving goal:', error);
                showNotification('Failed to save goal: ' + error.message, 'error');
        });
    } else {
        // Trigger form validation
        form.reportValidity();
    }
}

// Save goal contribution
function saveContribution() {
    const form = document.getElementById('contribution-form');
    
    if (form.checkValidity()) {
        const goalId = document.getElementById('contribution-goal-id').value;
        const amount = document.getElementById('contribution-amount').value;
        const date = document.getElementById('contribution-date').value;
        const notes = document.getElementById('contribution-notes').value;
        
        const contribution = {
            amount: parseFloat(amount),
            date,
            notes
        };
        
        // Show loading notification
        showNotification('Saving contribution...', 'info');
        
        // Send data to API
        api.addGoalContribution(goalId, contribution)
            .then(response => {
                if (response.status === 'success') {
                    closeContributionModal();
                    
                    // Show success message
                    showNotification('Contribution added successfully', 'success');
                    
                    // Refresh goals
                    loadGoals();
                } else {
                    showNotification(response.message || 'Failed to save contribution', 'error');
                }
            })
            .catch(error => {
                console.error('Error saving contribution:', error);
                showNotification('Error saving contribution: ' + (error.message || 'Unknown error'), 'error');
            });
    } else {
        // Trigger form validation
        form.reportValidity();
    }
}

// Initialize insights
function initializeInsights() {
    console.log('initializeInsights CALLED'); // Log 2: Inside initializeInsights
    loadStoredInsights(); // Load stored insights on initial load
    bindInsightEvents();
}

// Load stored insights from API
async function loadStoredInsights() {
    const insightsContainer = document.querySelector('#insights .insights-container');
    if (!insightsContainer) {
        console.error('Insights container not found for loading stored insights.');
        return;
    }

    insightsContainer.innerHTML = '<div class="loading-spinner" style="display: flex; justify-content: center; align-items: center; padding: 40px;"><i class="fas fa-spinner fa-spin fa-2x"></i><span style="margin-left: 15px;">Loading insights...</span></div>';

    try {
        const response = await api.getStoredInsights();
        if (response.status === 'success') {
            if (response.data && response.data.length > 0) {
                populateInsightsContainer(response.data);
            } else {
                insightsContainer.innerHTML = '<div class="insights-empty"><div class="empty-icon"><i class="fas fa-lightbulb"></i></div><h3>No insights yet</h3><p>Click \'Refresh Insights\' to generate personalized recommendations.</p></div>';
            }
        } else {
            insightsContainer.innerHTML = '<div class="insights-empty"><p>Could not load stored insights. Try refreshing.</p></div>';
            showNotification(response.message || 'Failed to load stored insights', 'error');
        }
    } catch (error) {
        console.error('Error loading stored insights:', error);
        insightsContainer.innerHTML = '<div class="insights-empty"><p>Error loading stored insights. Please try again.</p></div>';
        showNotification('Failed to load stored insights: ' + error.message, 'error');
    }
}

// Refresh insights
function refreshInsights() {
    console.log('refreshInsights CALLED'); // Log 7: Inside refreshInsights
    const refreshBtn = document.getElementById('refresh-insights-btn');
    const insightsContainer = document.querySelector('#insights .insights-container'); // Target the correct container

    if (!insightsContainer) {
        console.error('Insights container not found for refresh.');
        return;
    }

    if (refreshBtn) {
        refreshBtn.disabled = true;
        refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Refreshing...'; // Add loading state
    }

    // Clear current insights and show loading placeholder (optional)
    insightsContainer.innerHTML = '<div class="loading-spinner" style="display: flex; justify-content: center; align-items: center; padding: 40px;"><i class="fas fa-spinner fa-spin fa-2x"></i><span style="margin-left: 15px;">Generating new insights...</span></div>';

    api.generateInsights() // Call the new API function
        .then(response => {
            if (response.status === 'success') {
                console.log('SUCCESS from api.generateInsights. Data:', response.data); // Log 1
                populateInsightsContainer(response.data); // Populate with new data
                showNotification('Insights refreshed successfully', 'success');
            } else {
                // Handle specific errors if needed, handleResponse in api.js might already do this
                showNotification(response.message || 'Failed to refresh insights', 'error');
                insightsContainer.innerHTML = '<div class="insights-empty"><p>Could not load insights.</p></div>'; // Show error state
            }
        })
        .catch(error => {
            console.error('Error refreshing insights:', error);
            showNotification('Failed to refresh insights: ' + error.message, 'error');
            insightsContainer.innerHTML = '<div class="insights-empty"><p>Error loading insights. Please try again.</p></div>'; // Show error state
        })
        .finally(() => {
            if (refreshBtn) {
                refreshBtn.disabled = false;
                refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh Insights'; // Restore button text
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
    animation: spin 1s linear infinite;
}

@keyframes spin {
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
            { value: 'savings', text: 'Savings' }, // <-- Added this line
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

    // Add event listeners for dynamically created edit/delete buttons
    document.querySelector('.budget-categories-list').addEventListener('click', (event) => {
        const editButton = event.target.closest('.edit-budget');
        const deleteButton = event.target.closest('.delete-budget'); // Add delete button class

        if (editButton) {
            const budgetId = editButton.getAttribute('data-id');
            editBudget(budgetId);
        }
        
        if (deleteButton) {
            const budgetId = deleteButton.getAttribute('data-id');
            deleteBudget(budgetId);
        }
    });
}

// Placeholder: Implement budget period change logic
function changeBudgetPeriod(direction) {
    console.warn('changeBudgetPeriod not fully implemented. Direction:', direction);
    // TODO: Update the displayed period text (e.g., "August 2025")
    // TODO: Potentially call loadBudgets() if backend supports filtering by period
}

// Placeholder: Implement budget filtering logic
function filterBudgetCategories(view) {
    console.warn('filterBudgetCategories not fully implemented. View:', view);
    const budgetItems = document.querySelectorAll('.budget-category-item');
    budgetItems.forEach(item => {
        item.style.display = 'flex'; // Show all for now
        // TODO: Implement filtering logic based on 'spent' vs 'amount'
        // if (view === 'over') { ... }
        // if (view === 'under') { ... }
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
                        <label for="budget-category-select">Category</label>
                        <select id="budget-category-select" required>
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
                            <option value="__custom__">Create New Category...</option> 
                        </select>
                    </div>
                    <div class="form-group" id="custom-category-group" style="display: none;">
                        <label for="budget-custom-category">Custom Category Name</label>
                        <input type="text" id="budget-custom-category" placeholder="Enter custom category">
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
    
    // Add event listener to toggle custom category input
    const categorySelect = modal.querySelector('#budget-category-select');
    const customCategoryGroup = modal.querySelector('#custom-category-group');
    categorySelect.addEventListener('change', function() {
        if (this.value === '__custom__') {
            customCategoryGroup.style.display = 'block';
            modal.querySelector('#budget-custom-category').focus();
        } else {
            customCategoryGroup.style.display = 'none';
        }
    });
    
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
    if (modal) { // If modal exists when showing
        const categorySelect = modal.querySelector('#budget-category-select');
        const customCategoryGroup = modal.querySelector('#custom-category-group');
        const customCategoryInput = modal.querySelector('#budget-custom-category');

        // Reset custom category field when opening modal
        customCategoryInput.value = ''; 
        customCategoryGroup.style.display = 'none';

    if (budgetData) {
        modal.querySelector('#budget-modal-title').textContent = 'Edit Budget';
        modal.querySelector('#budget-id').value = budgetData.id;
            
            // Check if the budgetData.category is one of the predefined options
            const isPredefined = Array.from(categorySelect.options).some(opt => opt.value === budgetData.category && opt.value !== '__custom__');
            if (isPredefined) {
                categorySelect.value = budgetData.category;
            } else {
                // It's a custom category
                categorySelect.value = '__custom__';
                customCategoryInput.value = budgetData.category;
                customCategoryGroup.style.display = 'block';
            }
            
        modal.querySelector('#budget-amount').value = budgetData.amount;
            modal.querySelector('#budget-start-date').value = budgetData.start_date; // Ensure this is formatted YYYY-MM-DD
        modal.querySelector('#budget-period').value = budgetData.period;
        modal.querySelector('#budget-notes').value = budgetData.notes || '';
    } else {
        // Set default values for new budget
        modal.querySelector('#budget-modal-title').textContent = 'Create Budget';
        modal.querySelector('#budget-id').value = '';
             categorySelect.value = ''; // Default to "Select Category"
             customCategoryInput.value = '';
             customCategoryGroup.style.display = 'none';
        modal.querySelector('#budget-amount').value = '';
        modal.querySelector('#budget-start-date').value = formatDate(new Date());
        modal.querySelector('#budget-period').value = 'monthly';
        modal.querySelector('#budget-notes').value = '';
        }
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

    // Event delegation for dynamically created elements within goals list
    const goalsListContainer = document.querySelector('.goals-list'); 
    if (goalsListContainer) {
        goalsListContainer.addEventListener('click', function(event) {
            const target = event.target;

            // Dropdown toggle
            if (target.closest('.dropdown-toggle')) {
                event.stopPropagation();
                const dropdownToggle = target.closest('.dropdown-toggle');
                const dropdownMenu = dropdownToggle.nextElementSibling;
                // Close other open dropdowns first
                document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
                    if (menu !== dropdownMenu) {
                        menu.classList.remove('show');
                    }
                });
                dropdownMenu.classList.toggle('show');
                return; // Prevent document click listener from firing immediately
            }

            // Edit goal
            if (target.closest('.edit-goal')) {
                const goalId = target.closest('.edit-goal').getAttribute('data-id');
                editGoal(goalId);
                return;
            }

            // Delete goal
            if (target.closest('.delete-goal')) {
                const goalId = target.closest('.delete-goal').getAttribute('data-id');
                deleteGoal(goalId);
                return;
            }

            // Contribute button
            if (target.closest('.contribute-btn')) {
                const goalId = target.closest('.contribute-btn').getAttribute('data-id');
                showContributionModal(goalId);
                return;
            }

            // View history button
            if (target.closest('.view-history-btn')) {
                const goalId = target.closest('.view-history-btn').getAttribute('data-id');
                showGoalHistory(goalId);
                return;
            }
        });
    }

    // Close dropdowns when clicking outside
    document.addEventListener('click', function(event) {
        // Check if the click is outside of any dropdown menu or toggle
        if (!event.target.closest('.goal-actions-dropdown')) {
            document.querySelectorAll('.dropdown-menu.show').forEach(dropdown => {
                dropdown.style.display = 'none'; // Hide using style.display for consistency if that was used before
                                             // Or better, use classList.remove if 'show' controls display via CSS
                dropdown.classList.remove('show'); 
            });
        }
    });

    // REMOVE event listeners for edit, delete, contribute, view history that were previously set with querySelectorAll
    // as they are now handled by delegation.
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
        modal.querySelector('#goal-title').value = goalData.title || goalData.name || '';
        modal.querySelector('#goal-category').value = goalData.category || goalData.type || '';
        modal.querySelector('#goal-target-amount').value = goalData.targetAmount || goalData.target_amount || '';
        modal.querySelector('#goal-current-amount').value = goalData.currentAmount || goalData.current_amount || '';
        modal.querySelector('#goal-target-date').value = formatDate(new Date(goalData.targetDate || goalData.deadline));
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

// Edit goal
function editGoal(id) {
    console.log('Edit goal:', id);
    
    // Fetch the goal data from the API
    api.getGoal(id)
        .then(response => {
            if (response.status === 'success') {
                // Normalize the goal data for the modal
                const goalData = {
                    id: response.data.id,
                    title: response.data.name,
                    category: response.data.type,
                    targetAmount: response.data.target_amount,
                    currentAmount: response.data.current_amount,
                    targetDate: response.data.deadline,
                    description: response.data.description
                };
                
                showGoalModal(goalData);
    } else {
                showNotification('Failed to fetch goal details', 'error');
    }
        })
        .catch(error => {
            console.error('Error fetching goal:', error);
            showNotification('Error fetching goal details', 'error');
        });
}

// Delete goal
function deleteGoal(id) {
    console.log('Delete goal:', id);
    
    if (confirm('Are you sure you want to delete this goal?')) {
        api.deleteGoal(id)
            .then(response => {
                if (response.status === 'success') {
        showNotification('Goal deleted successfully', 'success');
                    loadGoals(); // Refresh the goals list
                } else {
                    showNotification('Failed to delete goal', 'error');
                }
            })
            .catch(error => {
                console.error('Error deleting goal:', error);
                showNotification('Error deleting goal', 'error');
            });
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
async function createContributionModal(goalId) {
    const modal = document.createElement('div');
    modal.className = 'modal contribution-modal';
    modal.id = 'contribution-modal';
    
    // Show loading message
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Add Contribution</h3>
                <button class="close-modal">&times;</button>
            </div>
            <div class="modal-body">
                <div class="loading-spinner">
                    <i class="fas fa-spinner fa-spin"></i>
                    <span>Loading goal details...</span>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'flex';
    
    try {
        // Fetch goal data from API
        const response = await api.getGoal(goalId);
        
        if (!response.data || response.status !== 'success') {
            throw new Error(response.message || 'Failed to load goal');
        }
        
        const goal = response.data;
        
        // Update modal with goal data
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Add Contribution</h3>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="contribution-details">
                        <span><strong>Goal:</strong> ${goal.name}</span>
                        <span><strong>Current:</strong> $${parseFloat(goal.current_amount).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                        <span><strong>Target:</strong> $${parseFloat(goal.target_amount).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                        <span><strong>Remaining:</strong> $${(parseFloat(goal.target_amount) - parseFloat(goal.current_amount)).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
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
        
        // Re-attach event listeners
        const closeBtn = modal.querySelector('.close-modal');
        const cancelBtn = modal.querySelector('#cancel-contribution');
        const saveBtn = modal.querySelector('#save-contribution');
        
        closeBtn.addEventListener('click', closeContributionModal);
        cancelBtn.addEventListener('click', closeContributionModal);
        
        saveBtn.addEventListener('click', function() {
            saveContribution();
        });
        
        return modal;
    } catch (error) {
        console.error('Error fetching goal details:', error);
        showNotification('Error loading goal details: ' + (error.message || 'Unknown error'), 'error');
        closeContributionModal();
        return null;
    }
}

// Show contribution modal
async function showContributionModal(goalId) {
    // Create and show modal with loading state
    await createContributionModal(goalId);
}

// Close contribution modal
function closeContributionModal() {
    const modal = document.getElementById('contribution-modal');
    if (modal) {
        modal.remove();
    }
}

// Show goal history
async function showGoalHistory(goalId) { // Make it async
    console.log('Show history for goal:', goalId);

    // Create and show a modal with a loading state first
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'history-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Contribution History</h3>
                <button class="close-modal">&times;</button>
            </div>
            <div class="modal-body">
                <div class="loading-spinner" style="display: flex; justify-content: center; align-items: center; min-height: 100px;">
                    <i class="fas fa-spinner fa-spin fa-2x"></i>
                    <span style="margin-left: 10px;">Loading history...</span>
                </div>
                <table class="history-table" style="display: none;">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Amount</th>
                            <th>Notes</th>
                        </tr>
                    </thead>
                    <tbody>
                        <!-- History will be populated here -->
                    </tbody>
                    <tfoot>
                        <tr>
                            <td><strong>Total Contributions</strong></td>
                            <td id="history-total-amount"><strong></strong></td>
                            <td></td>
                        </tr>
                    </tfoot>
                </table>
                <div class="no-history-message" style="display: none; text-align: center; padding: 20px;">No contributions found for this goal.</div>
            </div>
            <div class="modal-footer">
                <button class="btn-primary" id="close-history">Close</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    modal.style.display = 'flex';

    const closeBtn = modal.querySelector('.close-modal');
    const closeHistoryBtn = modal.querySelector('#close-history');
    const tableBody = modal.querySelector('.history-table tbody');
    const totalAmountEl = modal.querySelector('#history-total-amount strong');
    const historyTable = modal.querySelector('.history-table');
    const loadingSpinner = modal.querySelector('.loading-spinner');
    const noHistoryMessage = modal.querySelector('.no-history-message');

    closeBtn.addEventListener('click', () => modal.remove());
    closeHistoryBtn.addEventListener('click', () => modal.remove());

    try {
        const response = await api.getGoalContributions(goalId);
        loadingSpinner.style.display = 'none'; // Hide spinner

        if (response.status === 'success' && response.data && response.data.length > 0) {
            const contributions = response.data;
            let historyHTML = '';
            let totalContributed = 0;

            contributions.forEach(item => {
                const date = new Date(item.date);
                // Ensure date is correctly parsed. If item.date is already YYYY-MM-DD, new Date() might misinterpret it depending on timezone.
                // It's safer to split and construct if the format is fixed, or rely on toLocaleDateString if the date object is valid.
                const displayDate = date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
                historyHTML += `
                    <tr>
                        <td>${displayDate}</td>
                        <td>${formatCurrency(item.amount)}</td>
                        <td>${item.notes || '-'}</td>
                    </tr>
                `;
                totalContributed += parseFloat(item.amount);
            });

            tableBody.innerHTML = historyHTML;
            totalAmountEl.textContent = formatCurrency(totalContributed);
            historyTable.style.display = 'table'; // Show table
        } else {
            // No contributions or error in fetching data (though api.js should throw for actual errors)
            noHistoryMessage.style.display = 'block'; // Show no history message
            totalAmountEl.textContent = formatCurrency(0);
        }
    } catch (error) {
        console.error('Error fetching goal history:', error);
        loadingSpinner.style.display = 'none';
        noHistoryMessage.textContent = 'Error loading contribution history.';
        noHistoryMessage.style.display = 'block';
        showNotification('Failed to load contribution history', 'error');
        totalAmountEl.textContent = formatCurrency(0);
    }
}

// AI Insights functionality
function bindInsightEvents() {
    console.log('bindInsightEvents CALLED'); // Log 3: Inside bindInsightEvents
    
    // Get the parent container for the insights tab once
    const insightsTabContent = document.getElementById('insights');
    if (!insightsTabContent) {
        console.error('Insights tab content container NOT FOUND');
        return; // Exit if the main container isn't there
    }

    // Event delegation for the Refresh Insights button
    insightsTabContent.addEventListener('click', function(event) {
        const refreshBtn = event.target.closest('#refresh-insights-btn');
        if (refreshBtn) {
            console.log('Refresh Insights button CLICKED (delegated)'); // Log 5: Click event triggered
            refreshInsights();
        }

        // Event delegation for View Details buttons (if needed for dynamic content)
        const viewDetailsBtn = event.target.closest('.view-details-btn');
        if (viewDetailsBtn) {
            const insightCard = viewDetailsBtn.closest('.insight-card');
            // ... (rest of view details logic remains the same)
            const insightType = insightCard.getAttribute('data-type'); 
            const insightTitle = insightCard.querySelector('.insight-header h3').textContent;
            const insightContent = insightCard.querySelector('.insight-content p').textContent;
            const insightId = viewDetailsBtn.getAttribute('data-id');
            showInsightDetails(insightTitle, insightContent, insightType, insightId); 
        }
    });
    console.log('Delegated event listener ADDED to insights tab container'); // Log 6: Delegated listener added

    // Insight filtering (can remain as is, or also be delegated if issues arise)
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

    // Close detail modal listeners (assuming they are static)
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
function showInsightDetails(title, content, type, id) {
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
        // Correctly determine if it's an expense based on the 'type' field
        const isExpense = transaction.type === 'expense';
        
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
        if (transaction.type === 'income') {
            income += parseFloat(transaction.amount);
        } else if (transaction.type === 'expense') {
            expenses += Math.abs(parseFloat(transaction.amount));
        }
    });
    
    const balance = income - expenses;
    
    // Update the summary elements in the Transactions tab
    const incomeEl = document.querySelector('.transactions-summary .summary-card.income .summary-value');
    const expensesEl = document.querySelector('.transactions-summary .summary-card.expenses .summary-value');
    const balanceEl = document.querySelector('.transactions-summary .summary-card.balance .summary-value');
    
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
        budgetsContainer.innerHTML = '<div class="no-data">No budgets found. Create one!</div>';
        return;
    }
    
    budgets.forEach(budget => {
        const spent = parseFloat(budget.spent || 0);
        const amount = parseFloat(budget.amount);
        const percentage = amount > 0 ? (spent / amount) * 100 : 0;
        const isOver = spent > amount;
        const isWarning = percentage >= 80 && percentage <= 100;
        
        const budgetItem = document.createElement('div');
        budgetItem.className = 'budget-category-item';
        budgetItem.dataset.category = budget.category.toLowerCase();
        if (isOver) budgetItem.classList.add('danger');
        else if (isWarning) budgetItem.classList.add('warning');
        
        budgetItem.innerHTML = `
            <div class="category-details">
                 <div class="category-icon ${budget.category.toLowerCase()}">
                    <i class="fas ${getCategoryIcon(budget.category)}"></i>
                </div>
                 <div class="category-info">
                     <div class="category-name">${budget.category}</div>
                     <div class="category-progress-bar">
                         <div class="progress-fill" 
                              style="width: ${Math.min(percentage, 100)}%; background-color: ${isOver ? 'var(--danger-color)' : isWarning ? 'var(--warning-color)' : 'var(--primary-color)'};">
                    </div>
                     </div>
                     <div class="category-amounts">
                         <span class="amount-spent">${formatCurrency(spent)}</span>
                         <span class="amount-separator">/</span>
                         <span class="amount-total">${formatCurrency(amount)}</span>
                    </div>
                </div>
            </div>
            <div class="category-actions">
                <button class="btn-icon edit-budget" data-id="${budget.id}" title="Edit Budget">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon delete-budget" data-id="${budget.id}" title="Delete Budget">
                    <i class="fas fa-trash-alt"></i> 
                </button>
            </div>
        `;
        
        budgetsContainer.appendChild(budgetItem);
    });
    // Note: Event listeners are now handled by delegation in bindBudgetEvents
}

// Update updateBudgetSummary to use the 'spent' field
function updateBudgetSummary(budgets) {
    console.log('Updating budget summary with:', budgets);
    
    let totalBudget = 0;
    let totalSpent = 0;
    
    budgets.forEach(budget => {
        totalBudget += parseFloat(budget.amount);
        totalSpent += parseFloat(budget.spent || 0);
    });
    
    const remaining = totalBudget - totalSpent;
    const percentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
    
    // Update the summary elements
    const totalEl = document.querySelector('.budget-summary .summary-card.total-budget .summary-value'); // Adjust selector if needed
    const spentEl = document.querySelector('.budget-summary .summary-card.spent .summary-value');       // Adjust selector if needed
    const remainingEl = document.querySelector('.budget-summary .summary-card.remaining .summary-value'); // Adjust selector if needed
    const progressFill = document.querySelector('.budget-total-progress .progress-fill'); // Adjust selector if needed
    const progressPercentageEl = document.querySelector('.budget-status .progress-percentage'); // Adjust selector if needed
    const spentOverviewEl = document.querySelector('.budget-progress-overview .spent'); // Adjust selector if needed
    const remainingOverviewEl = document.querySelector('.budget-progress-overview .remaining'); // Adjust selector if needed
    
    if (totalEl) totalEl.textContent = formatCurrency(totalBudget);
    if (spentEl) spentEl.textContent = formatCurrency(totalSpent);
    if (remainingEl) remainingEl.textContent = formatCurrency(remaining);
    if (spentOverviewEl) spentOverviewEl.textContent = `Spent: ${formatCurrency(totalSpent)}`;
    if (remainingOverviewEl) remainingOverviewEl.textContent = `Remaining: ${formatCurrency(remaining)}`;
    if (progressPercentageEl) progressPercentageEl.textContent = `${percentage.toFixed(0)}%`;

    if (progressFill) {
        progressFill.style.width = `${Math.min(percentage, 100)}%`;
        progressFill.classList.remove('warning', 'danger');
        if (percentage > 100) {
            progressFill.classList.add('danger');
             progressFill.style.backgroundColor = 'var(--danger-color)';
        } else if (percentage >= 80) {
            progressFill.classList.add('warning');
            progressFill.style.backgroundColor = 'var(--warning-color)';
        } else {
             progressFill.style.backgroundColor = 'var(--primary-color)';
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
        // Handle both camelCase and snake_case property names
        const currentAmount = goal.currentAmount || goal.current_amount || 0;
        const targetAmount = goal.targetAmount || goal.target_amount || 0;
        const deadline = new Date(goal.deadline);
        const percentage = (currentAmount / targetAmount) * 100 || 0;
        const formattedDeadline = deadline.toLocaleDateString();
        const goalName = goal.name;
        const goalType = goal.type;
        const goalId = goal.id;
        
        const goalItem = document.createElement('div');
        goalItem.className = 'goal-item';
        goalItem.dataset.id = goalId;
        
        const status = currentAmount >= targetAmount ? 'completed' : 'in-progress';
        
        goalItem.innerHTML = `
            <div class="goal-header">
                <div class="goal-title-section">
                    <h3 class="goal-title">${goalName}</h3>
                    <span class="goal-badge ${status}">${status === 'completed' ? 'Completed' : 'In Progress'}</span>
                </div>
                <div class="goal-actions-dropdown">
                    <button class="btn-icon dropdown-toggle">
                        <i class="fas fa-ellipsis-v"></i>
                    </button>
                    <div class="dropdown-menu">
                        <button class="dropdown-item edit-goal" data-id="${goalId}">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="dropdown-item delete-goal" data-id="${goalId}">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            </div>

            <div class="goal-details">
                <div class="goal-amount">
                    <span class="current">${formatCurrency(currentAmount)}</span>
                    <span class="separator">of</span>
                    <span class="target">${formatCurrency(targetAmount)}</span>
                </div>
                <div class="goal-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${percentage}%"></div>
                    </div>
                    <span class="progress-text">${Math.round(percentage)}% Complete</span>
                </div>
                <div class="goal-info">
                    <div class="goal-date">
                        <i class="fas fa-calendar"></i>
                        <span>${status === 'completed' ? 'Completed' : 'Target'}: ${formattedDeadline}</span>
                    </div>
                    <div class="goal-category">
                        <i class="fas ${getGoalTypeIcon(goalType)}"></i>
                        <span>${goalType}</span>
                    </div>
                </div>
                ${goal.description ? `<p class="goal-description">${goal.description}</p>` : ''}
                <div class="goal-main-actions">
                    ${status === 'completed' ?
                        `<button class="btn-secondary view-history-btn" data-id="${goalId}">
                            <i class="fas fa-history"></i> View History
                        </button>` :
                        `<button class="btn-primary contribute-btn" data-id="${goalId}">
                            <i class="fas fa-plus"></i> Add Contribution
                        </button>`
                    }
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
    
    document.querySelectorAll('.delete-goal').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            deleteGoal(id);
        });
    });
    
    document.querySelectorAll('.contribute-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id'); // ID is retrieved here
            console.log('CONTRIBUTE BTN CLICKED - Goal ID:', id); // <-- Add this line
            showContributionModal(id); // And passed to showContributionModal
        });
    });
    
    document.querySelectorAll('.view-history-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            showGoalHistory(id);
        });
    });
}

// Update goal summary with proper handling of camelCase and snake_case
function updateGoalSummary(goals) {
    console.log('Updating goal summary with:', goals);
    
    // Calculate totals
    let totalTarget = 0;
    let totalCurrent = 0;
    let inProgressCount = 0;
    let completedCount = 0;
    
    goals.forEach(goal => {
        const targetAmount = goal.targetAmount || goal.target_amount || 0;
        const currentAmount = goal.currentAmount || goal.current_amount || 0;
        
        totalTarget += parseFloat(targetAmount);
        totalCurrent += parseFloat(currentAmount);
        
        if (parseFloat(currentAmount) >= parseFloat(targetAmount)) {
            completedCount++;
        } else {
            inProgressCount++;
        }
    });
    
    // Update summary boxes in the UI
    const totalGoalsEl = document.querySelector('.total-goals .summary-value');
    const inProgressEl = document.querySelector('.in-progress .summary-value');
    const completedEl = document.querySelector('.completed .summary-value');
    
    if (totalGoalsEl) totalGoalsEl.textContent = goals.length;
    if (inProgressEl) inProgressEl.textContent = inProgressCount;
    if (completedEl) completedEl.textContent = completedCount;
}

// Add placeholder implementation for populateInsightsContainer
function populateInsightsContainer(insights) {
    console.log('populateInsightsContainer CALLED with:', insights); // Log 2
    
    const insightsContainer = document.querySelector('#insights .insights-container');
    if (!insightsContainer) {
        console.error('Insights container not found in populateInsightsContainer'); // Log 3
        return;
    }
    
    insightsContainer.innerHTML = ''; // Clear existing
    console.log('Insights container CLEARED'); // Log 4

    if (!insights || !Array.isArray(insights) || insights.length === 0) { // Added Array.isArray check
        console.warn('No insights to populate or not an array. Insights:', insights); // Log 5
        const emptyState = document.createElement('div');
        emptyState.className = 'insights-empty';
        emptyState.innerHTML = `
            <div class="empty-icon">
                <i class="fas fa-lightbulb"></i>
            </div>
            <h3>No insights yet</h3>
            <p>As you use the app more, or after refreshing, we'll provide personalized financial insights here.</p>
        `;
        insightsContainer.appendChild(emptyState);
        return;
    }
    
    // Add each insight to the container
    insights.forEach((insight, index) => {
        console.log(`Processing insight #${index}:`, insight);
        if (!insight || typeof insight.title === 'undefined' || typeof insight.content === 'undefined' || typeof insight.type === 'undefined') {
            console.error('Malformed insight object at index:', index, insight);
            return; // Skip this iteration
        }

        const insightCard = document.createElement('div');
        insightCard.className = `insight-card ${insight.type}-insight`;
        insightCard.dataset.type = insight.type;
        // insightCard.dataset.id = insight.id; // Uncomment if insights have IDs
        
        // Ensure all formattedDate logic is GONE from here
        
        insightCard.innerHTML = `
            <div class="insight-header">
                <div class="insight-icon ${getInsightIconType(insight.type)}"> 
                    <i class="fas ${getInsightIcon(insight.type)}"></i>
                </div>
                <h3>${insight.title}</h3>
            </div>
            <div class="insight-content">
                <p>${insight.content}</p>
                <div class="insight-actions">
                    <button class="btn-link view-details-btn" data-id="${'temp-' + Math.random().toString(36).substr(2, 9)}">View Details</button> 
                    
                </div>
            </div>
        `;
        
        insightsContainer.appendChild(insightCard);
    });

    // Note: Event listeners for view-details-btn are now handled by delegation in bindInsightEvents
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

// Initialize CSV Import
document.addEventListener('DOMContentLoaded', function() {
    // ... existing code ...
    setupCSVImportModal();
});

// ... existing code ...
function updateRecentTransactionsFromDashboard(transactions) {
    // Sort by date descending
    const sorted = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
    const recent = sorted.slice(0, 3);
    const container = document.querySelector('#overview .transactions-list');
    if (!container) return;
    container.innerHTML = '';
    if (recent.length === 0) {
        container.innerHTML = '<div class="no-data">No recent transactions</div>';
        return;
    }
    recent.forEach(tx => {
        const item = document.createElement('div');
        item.className = 'recent-transaction-item';
        const icon = getCategoryIcon(tx.category);
        const isExpense = tx.type === 'expense' || parseFloat(tx.amount) < 0;
        const formattedDate = new Date(tx.date).toLocaleDateString();
        item.innerHTML = `
            <div class="transaction-icon ${tx.category}"><i class="fas ${icon}"></i></div>
            <div class="transaction-details">
                <div class="transaction-title">${tx.description}</div>
                <div class="transaction-date">${formattedDate}</div>
            </div>
            <div class="transaction-amount ${isExpense ? 'expense' : 'income'}">${formatCurrency(tx.amount)}</div>
        `;
        container.appendChild(item);
    });
}

// Update View All Transactions button to use hash link
document.addEventListener('DOMContentLoaded', function() {
    const viewAllLink = document.querySelector('.view-all-link');
    if (viewAllLink) {
        viewAllLink.setAttribute('href', '#transactions');
        viewAllLink.addEventListener('click', function(e) {
            e.preventDefault();
            switchTab('transactions');
        });
    }
}); 

function filterInsights(filter) {
    console.log('Filtering insights by:', filter);
    const insightsContainer = document.querySelector('#insights .insights-container');
    if (!insightsContainer) {
        console.error('Insights container not found for filtering.');
        return;
    }

    const allInsightCards = insightsContainer.querySelectorAll('.insight-card');
    const noResultsMessage = document.querySelector('#insights .insights-empty .empty-state'); // Target the specific empty state for filtering

    let visibleCount = 0;

    allInsightCards.forEach(card => {
        const cardType = card.getAttribute('data-type');
        if (filter === 'all' || cardType === filter) {
            card.style.display = 'flex'; // Assuming insight cards use flex
            visibleCount++;
        } else {
            card.style.display = 'none';
        }
    });

    // Show or hide the "no results" message for filtering
    if (noResultsMessage) {
        if (visibleCount === 0 && allInsightCards.length > 0) { // Only show if there were cards to filter but none matched
            noResultsMessage.parentElement.style.display = 'block'; // Show the parent .insights-empty
        } else {
            noResultsMessage.parentElement.style.display = 'none'; // Hide the parent .insights-empty
        }
    }
    
    // If the main insightsContainer itself becomes completely empty of direct .insight-card children
    // (e.g. initial load before populateInsightsContainer runs, or if populate clears it and finds nothing),
    // that's handled by populateInsightsContainer showing its own general empty message.
    // This filter-specific message only appears if cards *were* populated, but the filter hid them all.
} 

// Store last loaded insights in memory for reuse
let lastLoadedInsights = [];

// Patch switchTab to also update goal/budget insights
const originalSwitchTab = switchTab;
switchTab = function(tabId) {
    originalSwitchTab(tabId);
    if (tabId === 'goals') {
        renderFilteredInsights('goal', 'goal-insights-container');
    } else if (tabId === 'budgets') {
        renderFilteredInsights('budget', 'budget-insights-container');
    }
};

// Patch populateInsightsContainer to update lastLoadedInsights
const originalPopulateInsightsContainer = populateInsightsContainer;
populateInsightsContainer = function(insights) {
    lastLoadedInsights = Array.isArray(insights) ? insights : [];
    originalPopulateInsightsContainer(insights);
    // Also update goal/budget insights if on those tabs
    const activeTab = document.querySelector('.tab-content.active');
    if (activeTab && activeTab.id === 'goals') {
        renderFilteredInsights('goal', 'goal-insights-container');
    } else if (activeTab && activeTab.id === 'budgets') {
        renderFilteredInsights('budget', 'budget-insights-container');
    }
};

// Render filtered insights into a given container by type
function renderFilteredInsights(type, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    const filtered = lastLoadedInsights.filter(insight => insight.type === type);
    if (filtered.length === 0) {
        container.innerHTML = `<div class="insights-empty"><div class="empty-icon"><i class="fas fa-lightbulb"></i></div><h3>No ${type} insights yet</h3><p>Click 'Refresh Insights' to generate personalized recommendations.</p></div>`;
        return;
    }
    filtered.forEach(insight => {
        const card = document.createElement('div');
        card.className = `insight-card ${insight.type}-insight`;
        card.dataset.type = insight.type;
        card.innerHTML = `
            <div class="insight-header">
                <div class="insight-icon ${getInsightIconType(insight.type)}">
                    <i class="fas ${getInsightIcon(insight.type)}"></i>
                </div>
                <h3>${insight.title}</h3>
            </div>
            <div class="insight-content">
                <p>${insight.content}</p>
                <div class="insight-actions">
                    <button class="btn-link view-details-btn" data-id="${'temp-' + Math.random().toString(36).substr(2, 9)}">View Details</button>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
} 

// Edit transaction by ID
function editTransaction(id) {
    // Find the transaction in the current table (or fetch from API if needed)
    api.getTransactions().then(response => {
        if (response.status === 'success') {
            const transaction = response.data.find(tx => String(tx.id) === String(id));
            if (transaction) {
                showTransactionModal(transaction);
            } else {
                showNotification('Transaction not found', 'error');
            }
        } else {
            showNotification('Failed to fetch transactions', 'error');
        }
    }).catch(error => {
        console.error('Error fetching transactions for edit:', error);
        showNotification('Error fetching transaction', 'error');
    });
}

// ... existing code ...
function applyTransactionFilters() {
    // Get filter values
    const dateFrom = document.getElementById('date-from').value;
    const dateTo = document.getElementById('date-to').value;
    const category = document.getElementById('category-filter').value;
    const type = document.getElementById('type-filter').value;

    api.getTransactions().then(response => {
        if (response.status === 'success') {
            let filtered = response.data;
            // Filter by date range
            if (dateFrom) {
                filtered = filtered.filter(tx => new Date(tx.date) >= new Date(dateFrom));
            }
            if (dateTo) {
                filtered = filtered.filter(tx => new Date(tx.date) <= new Date(dateTo));
            }
            // Filter by category
            if (category) {
                filtered = filtered.filter(tx => tx.category && tx.category.toLowerCase() === category.toLowerCase());
            }
            // Filter by type
            if (type) {
                filtered = filtered.filter(tx => tx.type === type);
            }
            populateTransactionsTable(filtered);
            updateTransactionSummary(filtered);
        } else {
            showNotification('Failed to load transactions for filtering', 'error');
        }
    }).catch(error => {
        console.error('Error filtering transactions:', error);
        showNotification('Error filtering transactions', 'error');
    });
}

let spendingChartPeriod = 'month'; // Default period

// --- Transactions Page Period & Filter Logic ---
function setDefaultTransactionDateRange() {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    document.getElementById('date-from').value = firstDay.toISOString().slice(0, 10);
    document.getElementById('date-to').value = lastDay.toISOString().slice(0, 10);
}

function getActiveTransactionRangeText() {
    const from = document.getElementById('date-from').value;
    const to = document.getElementById('date-to').value;
    if (!from && !to) return 'Showing: All Transactions';
    const fromDate = from ? new Date(from) : null;
    const toDate = to ? new Date(to) : null;
    const opts = { year: 'numeric', month: 'short', day: 'numeric' };
    if (fromDate && toDate) {
        return `Showing: ${fromDate.toLocaleDateString(undefined, opts)} – ${toDate.toLocaleDateString(undefined, opts)}`;
    } else if (fromDate) {
        return `Showing: From ${fromDate.toLocaleDateString(undefined, opts)}`;
    } else if (toDate) {
        return `Showing: Up to ${toDate.toLocaleDateString(undefined, opts)}`;
    }
    return 'Showing: All Transactions';
}

function highlightActiveFilters() {
    const filtersSection = document.querySelector('.transactions-filters');
    const from = document.getElementById('date-from').value;
    const to = document.getElementById('date-to').value;
    const category = document.getElementById('category-filter').value;
    const type = document.getElementById('type-filter').value;
    if (from || to || category || type) {
        filtersSection.classList.add('filters-active');
    } else {
        filtersSection.classList.remove('filters-active');
    }
}

function bindTransactionPeriodButtons() {
    const periodBtns = document.querySelectorAll('.period-btn');
    periodBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            periodBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            const now = new Date();
            let from, to;
            if (this.dataset.period === 'week') {
                const dayOfWeek = now.getDay();
                const start = new Date(now);
                start.setDate(now.getDate() - dayOfWeek);
                from = start.toISOString().slice(0, 10);
                to = now.toISOString().slice(0, 10);
            } else if (this.dataset.period === 'month') {
                const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
                const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                from = firstDay.toISOString().slice(0, 10);
                to = lastDay.toISOString().slice(0, 10);
            } else if (this.dataset.period === 'year') {
                const firstDay = new Date(now.getFullYear(), 0, 1);
                const lastDay = new Date(now.getFullYear(), 11, 31);
                from = firstDay.toISOString().slice(0, 10);
                to = lastDay.toISOString().slice(0, 10);
            } else {
                from = '';
                to = '';
            }
            document.getElementById('date-from').value = from;
            document.getElementById('date-to').value = to;
            applyTransactionFilters();
        });
    });
}

function bindClearFiltersButton() {
    const clearBtn = document.getElementById('clear-filters');
    if (clearBtn) {
        clearBtn.addEventListener('click', function() {
            document.getElementById('date-from').value = '';
            document.getElementById('date-to').value = '';
            document.getElementById('category-filter').value = '';
            document.getElementById('type-filter').value = '';
            document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
            document.querySelector('.period-btn[data-period="all"]').classList.add('active');
            applyTransactionFilters();
        });
    }
}

// Patch applyTransactionFilters to update range text and highlight
const originalApplyTransactionFilters = applyTransactionFilters;
applyTransactionFilters = function() {
    originalApplyTransactionFilters();
    // Update active range text
    const rangeText = getActiveTransactionRangeText();
    const rangeEl = document.getElementById('transactions-active-range');
    if (rangeEl) rangeEl.textContent = rangeText;
    // Highlight active filters
    highlightActiveFilters();
};

// On DOMContentLoaded, set up default and bind events
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupTransactionsFiltersUI);
} else {
    setupTransactionsFiltersUI();
}
function setupTransactionsFiltersUI() {
    if (document.getElementById('transactions')) {
        setDefaultTransactionDateRange();
        bindTransactionPeriodButtons();
        bindClearFiltersButton();
        applyTransactionFilters(); // Auto-apply on load
    }
    // Add event listener for type filter change
    const typeFilterElement = document.getElementById('type-filter');
    if (typeFilterElement) {
        typeFilterElement.addEventListener('change', updateFilterCategoryOptions);
        // Also call it once on load to populate categories based on default type
        updateFilterCategoryOptions(); 
    }
}

// Update category options for the transaction filter based on transaction type
function updateFilterCategoryOptions() {
    const typeFilterSelect = document.getElementById('type-filter');
    const categoryFilterSelect = document.getElementById('category-filter');

    if (!typeFilterSelect || !categoryFilterSelect) return;

    const selectedType = typeFilterSelect.value;
    const currentCategoryValue = categoryFilterSelect.value; // Preserve selection if possible

    // Clear current options
    categoryFilterSelect.innerHTML = '';

    // Add 'All Categories' option first
    const allCategoriesOption = document.createElement('option');
    allCategoriesOption.value = '';
    allCategoriesOption.textContent = 'All Categories';
    categoryFilterSelect.appendChild(allCategoriesOption);

    let categoriesToShow = [];

    if (selectedType === 'income') {
        categoriesToShow = [
            { value: 'income', text: 'Income' },
            { value: 'salary', text: 'Salary' },
            { value: 'investment', text: 'Investment' },
            { value: 'other', text: 'Other (Income)' }
        ];
    } else if (selectedType === 'expense') {
        categoriesToShow = [
            { value: 'groceries', text: 'Groceries' },
            { value: 'dining', text: 'Dining Out' },
            { value: 'transportation', text: 'Transportation' },
            { value: 'entertainment', text: 'Entertainment' },
            { value: 'utilities', text: 'Utilities' },
            { value: 'shopping', text: 'Shopping' },
            { value: 'health', text: 'Health' },
            { value: 'housing', text: 'Housing' },
            { value: 'savings', text: 'Savings' },
            { value: 'travel', text: 'Travel' },
            { value: 'education', text: 'Education' },
            { value: 'other', text: 'Other (Expense)' }
        ];
    } else { // 'All Types' or empty
        // Show all possible categories (could be a combined list or default to all expense + all income)
        categoriesToShow = [
            // Income first
            { value: 'income', text: 'Income' },
            { value: 'salary', text: 'Salary' },
            { value: 'investment', text: 'Investment' },
             // Expenses next
            { value: 'groceries', text: 'Groceries' },
            { value: 'dining', text: 'Dining Out' },
            { value: 'transportation', text: 'Transportation' },
            { value: 'entertainment', text: 'Entertainment' },
            { value: 'utilities', text: 'Utilities' },
            { value: 'shopping', text: 'Shopping' },
            { value: 'health', text: 'Health' },
            { value: 'housing', text: 'Housing' },
            { value: 'savings', text: 'Savings' },
            { value: 'travel', text: 'Travel' },
            { value: 'education', text: 'Education' },
            // General 'Other'
            { value: 'other', text: 'Other' }
        ];
    }

    categoriesToShow.forEach(category => {
        const option = document.createElement('option');
        option.value = category.value;
        option.textContent = category.text;
        categoryFilterSelect.appendChild(option);
    });
    
    // Try to reselect previous value if it still exists
    if (Array.from(categoryFilterSelect.options).some(opt => opt.value === currentCategoryValue)) {
        categoryFilterSelect.value = currentCategoryValue;
    } else {
        categoryFilterSelect.value = ''; // Default to 'All Categories'
    }
}