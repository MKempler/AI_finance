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
        console.log('API Response:', response.status, response.url);
        
        try {
        const data = await response.json();
            console.log('API Response data:', data);
        
        if (!response.ok) {
            // Handle authentication errors
            if (response.status === 401) {
                    console.log('Authentication error detected');
                // If token is invalid or expired, redirect to login
                if (location.pathname !== '/login.html') {
                        console.log('Redirecting to login due to auth error');
                    auth.removeToken();
                    location.href = '/login.html';
                }
            }
            
                // Extract the most specific error message
                const errorMessage = data.message || 
                                    (data.status === 'error' && data.message) || 
                                    'API request failed';
                const error = new Error(errorMessage);
                error.status = response.status;
                error.data = data;
                throw error;
        }
        
        return data;
        } catch (error) {
            console.error('Error handling API response:', error);
            throw error;
        }
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

    async createBudget(budgetData) {
        try {
            const response = await fetch('/api/budgets', {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(budgetData)
            });
            return this.handleResponse(response);
        } catch (error) {
            console.error('Error creating budget:', error);
            throw error;
        }
    },

    async updateBudget(budgetId, budgetData) {
        try {
            const response = await fetch(`/api/budgets/${budgetId}`, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify(budgetData)
            });
            return this.handleResponse(response);
        } catch (error) {
            console.error('Error updating budget:', error);
            throw error;
        }
    },

    async deleteBudget(budgetId) {
        try {
            const response = await fetch(`/api/budgets/${budgetId}`, {
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

    async getGoal(id) {
        try {
            const response = await fetch(`/api/goals/${id}`, {
                headers: this.getHeaders()
            });
            return this.handleResponse(response);
        } catch (error) {
            console.error('Error fetching goal:', error);
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

    async getGoalContributions(id) {
        try {
            const response = await fetch(`/api/goals/${id}/contributions`, {
                headers: this.getHeaders()
            });
            return this.handleResponse(response);
        } catch (error) {
            console.error('Error fetching goal contributions:', error);
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

    async generateInsights() {
        try {
            // No body is needed for the POST request yet, as the backend will use the authenticated user ID
            // Later, we might pass specific parameters if needed (e.g., date range, specific areas of focus)
            const response = await fetch('/api/ai/generate-insights', {
                method: 'POST', // Important: This is a POST request
                headers: this.getHeaders()
            });
            return this.handleResponse(response);
        } catch (error) {
            console.error('Error generating AI insights:', error);
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
    },

    // User Profile
    async getUserProfile() {
        try {
            const response = await fetch('/api/auth/me', {
                headers: this.getHeaders()
            });
            return this.handleResponse(response);
        } catch (error) {
            console.error('Error fetching user profile:', error);
            throw error;
        }
    },

    async updateUserProfile(userData) {
        try {
            const response = await fetch('/api/auth/update-profile', {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify(userData)
            });
            return this.handleResponse(response);
        } catch (error) {
            console.error('Error updating user profile:', error);
            throw error;
        }
    },

    async updatePassword(passwordData) {
        try {
            const response = await fetch('/api/auth/update-password', {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify(passwordData)
            });
            return this.handleResponse(response);
        } catch (error) {
            console.error('Error updating password:', error);
            throw error;
        }
    },

    async getStoredInsights() {
        try {
            const response = await fetch('/api/ai/insights', { // GET request
                headers: this.getHeaders()
            });
            return this.handleResponse(response);
        } catch (error) {
            console.error('Error fetching stored AI insights:', error);
            throw error;
        }
    }
};

// Export the API object
window.api = api; 