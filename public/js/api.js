// API Service for Finance Dashboard
const api = {
    // Base headers for API requests
    getHeaders() {
        const token = localStorage.getItem('token');
        return {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
        };
    },

    // Helper method to handle API responses
    async handleResponse(response) {
        const data = await response.json();
        
        if (!response.ok) {
            // Handle authentication errors
            if (response.status === 401) {
                // If token is invalid or expired, redirect to login
                if (location.pathname !== '/login.html') {
                    auth.removeToken();
                    location.href = '/login.html';
                }
            }
            
            throw new Error(data.message || 'API request failed');
        }
        
        return data;
    },

    // Dashboard
    async getDashboardOverview() {
        try {
            const response = await fetch('/api/dashboard/overview', {
                headers: this.getHeaders()
            });
            return this.handleResponse(response);
        } catch (error) {
            console.error('Error fetching dashboard overview:', error);
            throw error;
        }
    },

    async getBudgetStatus() {
        try {
            const response = await fetch('/api/dashboard/budget-status', {
                headers: this.getHeaders()
            });
            return this.handleResponse(response);
        } catch (error) {
            console.error('Error fetching budget status:', error);
            throw error;
        }
    },

    // Transactions
    async getTransactions() {
        try {
            const response = await fetch('/api/transactions', {
                headers: this.getHeaders()
            });
            return this.handleResponse(response);
        } catch (error) {
            console.error('Error fetching transactions:', error);
            throw error;
        }
    },

    async createTransaction(transaction) {
        try {
            const response = await fetch('/api/transactions', {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(transaction)
            });
            return this.handleResponse(response);
        } catch (error) {
            console.error('Error creating transaction:', error);
            throw error;
        }
    },

    async updateTransaction(id, transaction) {
        try {
            const response = await fetch(`/api/transactions/${id}`, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify(transaction)
            });
            return this.handleResponse(response);
        } catch (error) {
            console.error('Error updating transaction:', error);
            throw error;
        }
    },

    async deleteTransaction(id) {
        try {
            const response = await fetch(`/api/transactions/${id}`, {
                method: 'DELETE',
                headers: this.getHeaders()
            });
            return this.handleResponse(response);
        } catch (error) {
            console.error('Error deleting transaction:', error);
            throw error;
        }
    },

    // Budgets
    async getBudgets() {
        try {
            const response = await fetch('/api/budgets', {
                headers: this.getHeaders()
            });
            return this.handleResponse(response);
        } catch (error) {
            console.error('Error fetching budgets:', error);
            throw error;
        }
    },

    async getBudgetProgress(id) {
        try {
            const response = await fetch(`/api/budgets/${id}/progress`, {
                headers: this.getHeaders()
            });
            return this.handleResponse(response);
        } catch (error) {
            console.error('Error fetching budget progress:', error);
            throw error;
        }
    },

    async createBudget(budget) {
        try {
            const response = await fetch('/api/budgets', {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(budget)
            });
            return this.handleResponse(response);
        } catch (error) {
            console.error('Error creating budget:', error);
            throw error;
        }
    },

    async updateBudget(id, budget) {
        try {
            const response = await fetch(`/api/budgets/${id}`, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify(budget)
            });
            return this.handleResponse(response);
        } catch (error) {
            console.error('Error updating budget:', error);
            throw error;
        }
    },

    async deleteBudget(id) {
        try {
            const response = await fetch(`/api/budgets/${id}`, {
                method: 'DELETE',
                headers: this.getHeaders()
            });
            return this.handleResponse(response);
        } catch (error) {
            console.error('Error deleting budget:', error);
            throw error;
        }
    },

    // Goals
    async getGoals() {
        try {
            const response = await fetch('/api/goals', {
                headers: this.getHeaders()
            });
            return this.handleResponse(response);
        } catch (error) {
            console.error('Error fetching goals:', error);
            throw error;
        }
    },

    async createGoal(goal) {
        try {
            const response = await fetch('/api/goals', {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(goal)
            });
            return this.handleResponse(response);
        } catch (error) {
            console.error('Error creating goal:', error);
            throw error;
        }
    },

    async updateGoal(id, goal) {
        try {
            const response = await fetch(`/api/goals/${id}`, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify(goal)
            });
            return this.handleResponse(response);
        } catch (error) {
            console.error('Error updating goal:', error);
            throw error;
        }
    },

    async deleteGoal(id) {
        try {
            const response = await fetch(`/api/goals/${id}`, {
                method: 'DELETE',
                headers: this.getHeaders()
            });
            return this.handleResponse(response);
        } catch (error) {
            console.error('Error deleting goal:', error);
            throw error;
        }
    },

    async addGoalContribution(id, contribution) {
        try {
            const response = await fetch(`/api/goals/${id}/contributions`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(contribution)
            });
            return this.handleResponse(response);
        } catch (error) {
            console.error('Error adding goal contribution:', error);
            throw error;
        }
    },

    // AI Features
    async getInsights() {
        try {
            const response = await fetch('/api/ai/insights', {
                headers: this.getHeaders()
            });
            return this.handleResponse(response);
        } catch (error) {
            console.error('Error fetching AI insights:', error);
            throw error;
        }
    },

    async getFinancialAdvice() {
        try {
            const response = await fetch('/api/ai/advice', {
                headers: this.getHeaders()
            });
            return this.handleResponse(response);
        } catch (error) {
            console.error('Error fetching financial advice:', error);
            throw error;
        }
    },

    // Sync
    async syncTransactions(transactions) {
        try {
            const response = await fetch('/api/sync', {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({ transactions })
            });
            return this.handleResponse(response);
        } catch (error) {
            console.error('Error syncing transactions:', error);
            throw error;
        }
    }
};

// Export the API object
window.api = api; 