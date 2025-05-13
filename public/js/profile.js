/**
 * Profile Page Functionality
 * Handles user profile data and interactions with the API
 */

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const avatarElements = document.querySelectorAll('#profile-avatar, #large-avatar');
    const profileName = document.getElementById('profile-name');
    const profileFullName = document.getElementById('profile-full-name');
    const profileEmail = document.getElementById('profile-email');
    const profileForm = document.getElementById('profile-form');
    const passwordForm = document.getElementById('password-form');
    const profileCancelBtn = document.getElementById('profile-cancel');
    const passwordCancelBtn = document.getElementById('password-cancel');
    const notification = document.getElementById('notification');
    
    // Store original user data from server
    let originalUserData = null;
    
    // Initialize profile data
    loadUserProfile();
    
    // Set up event listeners
    setupEventListeners();
    
    /**
     * Load user profile data from API
     */
    async function loadUserProfile() {
        try {
            showNotification('Loading profile...', 'info');
            
            const response = await api.getUserProfile();
            
            if (response.user) {
                // Store the original user data
                originalUserData = response.user;
                
                updateProfileDisplay(response.user);
                populateProfileForm(response.user);
                hideNotification();
            } else {
                showNotification('Failed to load profile data', 'error');
            }
        } catch (error) {
            console.error('Error loading profile:', error);
            showNotification('Error loading profile. Please try again.', 'error');
        }
    }
    
    /**
     * Update profile display with user data
     */
    function updateProfileDisplay(user) {
        // Update elements with user data
        if (profileName) profileName.textContent = user.name?.split(' ')[0] || 'User';
        if (profileFullName) profileFullName.textContent = user.name || 'User';
        if (profileEmail) profileEmail.textContent = user.email || '';
        
        // Update avatar with user initial
        const initial = user.name ? user.name.charAt(0).toUpperCase() : 'U';
        avatarElements.forEach(el => {
            if (el) el.textContent = initial;
        });
    }
        
    /**
     * Populate profile form with user data
     */
    function populateProfileForm(user) {
        if (profileForm) {
            document.getElementById('name').value = user.name || '';
            document.getElementById('email').value = user.email || '';
        }
    }
    
    /**
     * Set up all event listeners
     */
    function setupEventListeners() {
        // Profile form submission
        if (profileForm) {
            profileForm.addEventListener('submit', handleProfileFormSubmit);
        }
        
        // Password form submission
        if (passwordForm) {
            passwordForm.addEventListener('submit', handlePasswordFormSubmit);
        }
        
        // Cancel buttons
        if (profileCancelBtn) {
            profileCancelBtn.addEventListener('click', () => loadUserProfile());
        }
        
        if (passwordCancelBtn) {
            passwordCancelBtn.addEventListener('click', clearPasswordForm);
        }
    }
    
    /**
     * Handle profile form submission
     * @param {Event} e - Submit event
     */
    async function handleProfileFormSubmit(e) {
        e.preventDefault();
        
        // Get form data
        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        
        // Validate form data
        if (!name || !email) {
            showNotification('Please fill in all required fields', 'error');
            return;
        }
        
        // Email validation
        if (!validateEmail(email)) {
            showNotification('Please enter a valid email address', 'error');
            return;
        }
        
        // Only include fields that have changed
        const userData = {};
        
        if (name !== originalUserData.name) {
            userData.name = name;
        }
        
        if (email !== originalUserData.email) {
            userData.email = email;
        }
        
        // Don't make API call if nothing changed
        if (Object.keys(userData).length === 0) {
            showNotification('No changes detected', 'info');
            return;
        }
        
        try {
            showNotification('Updating profile...', 'info');
            
            const response = await api.updateUserProfile(userData);
            
            if (response.status === 'success' && response.data) {
                // Update original data with new values
                originalUserData = response.data;
                
                updateProfileDisplay(response.data);
                showNotification('Profile updated successfully', 'success');
            } else {
                showNotification(response.message || 'Failed to update profile', 'error');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            showNotification('Error updating profile. Please try again.', 'error');
        }
    }
    
    /**
     * Handle password form submission
     * @param {Event} e - Submit event
     */
    async function handlePasswordFormSubmit(e) {
        e.preventDefault();
        
        // Get form data
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        // Validate form data
        if (!currentPassword || !newPassword || !confirmPassword) {
            showNotification('Please fill in all password fields', 'error');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            showNotification('New passwords do not match', 'error');
            return;
        }
        
        // Password strength validation
        if (newPassword.length < 6) {
            showNotification('Password must be at least 6 characters long', 'error');
            return;
        }
        
        // Prepare data for API
        const passwordData = {
            currentPassword: currentPassword,
            newPassword: newPassword
        };
        
        try {
            showNotification('Updating password...', 'info');
            
            const response = await api.updatePassword(passwordData);
            
            if (response.status === 'success') {
                clearPasswordForm();
                showNotification('Password updated successfully', 'success');
            } else {
                showNotification(response.message || 'Failed to update password', 'error');
            }
        } catch (error) {
            console.error('Error updating password:', error);
            showNotification('Error updating password. Please try again.', 'error');
        }
    }
    
    /**
     * Clear password form
     */
    function clearPasswordForm() {
        if (passwordForm) {
            document.getElementById('currentPassword').value = '';
            document.getElementById('newPassword').value = '';
            document.getElementById('confirmPassword').value = '';
        }
    }
    
    /**
     * Show notification to user
     * @param {string} message - Message to display
     * @param {string} type - Type of notification (success, error, info)
     */
    function showNotification(message, type) {
        if (!notification) return;
        
        // Clear previous content
        notification.innerHTML = '';
        
        // Add appropriate icon
        const icon = document.createElement('i');
        switch (type) {
            case 'success':
                icon.className = 'fas fa-check-circle';
                break;
            case 'error':
                icon.className = 'fas fa-exclamation-circle';
                break;
            case 'info':
                icon.className = 'fas fa-info-circle';
                break;
            default:
                icon.className = 'fas fa-info-circle';
        }
        
        notification.appendChild(icon);
        
        // Add message
        const messageSpan = document.createElement('span');
        messageSpan.textContent = message;
        notification.appendChild(messageSpan);
        
        // Set the notification type class
        notification.className = `notification ${type}`;
        
        // Auto-hide success messages after delay
        if (type === 'success') {
            setTimeout(hideNotification, 3000);
        }
    }
    
    /**
     * Hide notification
     */
    function hideNotification() {
        if (notification) {
            notification.classList.add('hidden');
        }
    }
    
    /**
     * Validate email format
     * @param {string} email - Email to validate
     * @returns {boolean} Whether email is valid
     */
    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
}); 