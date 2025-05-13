// Authentication handler
const auth = {
    // Store the token in localStorage
    setToken(token) {
        if (token) {
            localStorage.setItem('token', token);
            console.log('Token set:', token.substring(0, 15) + '...');
        }
    },

    // Get the token from localStorage
    getToken() {
        const token = localStorage.getItem('token');
        if (!token || token === 'null' || token === 'undefined') {
            console.log('No valid token found');
            return null;
        }
        console.log('Token retrieved:', token.substring(0, 15) + '...');
        return token;
    },

    // Remove the token from localStorage
    removeToken() {
        localStorage.removeItem('token');
    },

    // Check if user is authenticated
    isAuthenticated() {
        return this.getToken() !== null;
    },

    // Handle login
    async login(email, password) {
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok && data.token) {
                this.setToken(data.token);
                return { success: true, data };
            } else {
                return { success: false, error: data.message || 'Login failed' };
            }
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: 'An error occurred during login' };
        }
    },

    // Handle registration
    async register(name, email, password) {
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, email, password })
            });

            const data = await response.json();

            if (response.ok && data.token) {
                this.setToken(data.token);
                return { success: true, data };
            } else {
                return { success: false, error: data.message || 'Registration failed' };
            }
        } catch (error) {
            console.error('Registration error:', error);
            return { success: false, error: 'An error occurred during registration' };
        }
    },

    // Handle logout
    logout() {
        this.removeToken();
        localStorage.removeItem('user'); // Also remove user data
        window.location.href = 'login.html';
    },

    // Get current user data
    async getCurrentUser() {
        const token = this.getToken();
        if (!token) {
            return { success: false, error: 'Not authenticated' };
        }

        try {
            const response = await fetch('/api/auth/me', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                return { success: true, user: data.user };
            } else {
                const errorData = await response.json();
                if (errorData.error === 'invalid_token' || 
                    errorData.error === 'expired_token' ||
                    errorData.error === 'authentication_required') {
                    this.removeToken();
                }
                return { success: false, error: errorData.message || 'Authentication failed' };
            }
        } catch (error) {
            console.error('Get user error:', error);
            return { success: false, error: 'Failed to fetch user data' };
        }
    }
};

// Export the auth object
window.auth = auth; 