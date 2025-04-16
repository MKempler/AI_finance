/**
 * Profile Page Functionality
 * Handles user profile data and interactions
 */

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const avatarElements = document.querySelectorAll('#profile-avatar, #large-avatar');
    const profileName = document.getElementById('profile-name');
    const profileFullName = document.getElementById('profile-full-name');
    const profileEmail = document.getElementById('profile-email');
    const profileForm = document.getElementById('profile-form');
    const logoutBtn = document.getElementById('logout-btn');
    const cancelButtons = document.querySelectorAll('.btn-cancel');
    const avatarUpload = document.querySelector('.avatar-upload');
    const toggleSwitches = document.querySelectorAll('.toggle-switch input');
    const connectButton = document.querySelector('.connected-accounts button[style="color: var(--primary-color);"]');
    const disconnectButtons = document.querySelectorAll('.btn-disconnect');
    const editProfileBtn = document.querySelector('.btn-edit-profile');
    
    // Initialize profile data
    initializeProfile();
    
    // Set up event listeners
    setupEventListeners();
    
    /**
     * Initialize profile with user data
     */
    function initializeProfile() {
        const user = getUser();
        
        // Update elements with user data
        if (profileName) profileName.textContent = user.firstName;
        if (profileFullName) profileFullName.textContent = `${user.firstName} ${user.lastName}`;
        if (profileEmail) profileEmail.textContent = user.email;
        
        // Update avatar with user initial
        avatarElements.forEach(el => {
            if (el) el.textContent = user.firstName.charAt(0).toUpperCase();
        });
        
        // Set form field values
        if (profileForm) {
            document.getElementById('firstName').value = user.firstName;
            document.getElementById('lastName').value = user.lastName;
            document.getElementById('email').value = user.email;
            document.getElementById('phone').value = user.phone || '';
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
        
        // Logout button
        if (logoutBtn) {
            logoutBtn.addEventListener('click', handleLogout);
        }
        
        // Edit profile button
        if (editProfileBtn) {
            editProfileBtn.addEventListener('click', function() {
                // Scroll to the profile form
                const profileSection = document.querySelector('.profile-section');
                if (profileSection) {
                    profileSection.scrollIntoView({ behavior: 'smooth' });
                }
                
                // Focus on first name field
                const firstNameInput = document.getElementById('firstName');
                if (firstNameInput) {
                    setTimeout(() => firstNameInput.focus(), 500);
                }
            });
        }
        
        // Cancel buttons
        cancelButtons.forEach(button => {
            button.addEventListener('click', handleCancel);
        });
        
        // Avatar upload
        if (avatarUpload) {
            avatarUpload.addEventListener('click', function() {
                alert('Profile picture upload feature will be available soon!');
            });
        }
        
        // Toggle switches
        toggleSwitches.forEach(toggle => {
            toggle.addEventListener('change', handleToggleChange);
        });
        
        // Connect account button
        if (connectButton) {
            connectButton.addEventListener('click', function() {
                alert('Account connection feature will be available soon!');
            });
        }
        
        // Disconnect account buttons
        disconnectButtons.forEach(button => {
            button.addEventListener('click', handleDisconnectAccount);
        });
    }
    
    /**
     * Get user data from local storage
     * @returns {Object} User data
     */
    function getUser() {
        const userString = localStorage.getItem('user');
        if (userString) {
            try {
                return JSON.parse(userString);
            } catch (e) {
                console.error('Error parsing user data:', e);
            }
        }
        
        // Default user data if none is found
        return {
            firstName: 'Testing',
            lastName: 'User',
            email: 'testing@example.com',
            phone: '+1 (555) 123-4567',
            initial: 'T'
        };
    }
    
    /**
     * Handle profile form submission
     * @param {Event} e - Submit event
     */
    function handleProfileFormSubmit(e) {
        e.preventDefault();
        
        // Get form data
        const firstName = document.getElementById('firstName').value;
        const lastName = document.getElementById('lastName').value;
        const email = document.getElementById('email').value;
        const phone = document.getElementById('phone').value;
        
        // Validate form data
        if (!firstName.trim() || !lastName.trim() || !email.trim()) {
            alert('Please fill in all required fields.');
            return;
        }
        
        // Email validation
        if (!validateEmail(email)) {
            alert('Please enter a valid email address.');
            return;
        }
        
        // Get current user data
        const user = getUser();
        
        // Update user object
        user.firstName = firstName;
        user.lastName = lastName;
        user.email = email;
        user.phone = phone;
        
        // Save to local storage
        localStorage.setItem('user', JSON.stringify(user));
        
        // Update displayed information
        if (profileName) profileName.textContent = firstName;
        if (profileFullName) profileFullName.textContent = `${firstName} ${lastName}`;
        if (profileEmail) profileEmail.textContent = email;
        
        // Update avatar with new initial
        avatarElements.forEach(el => {
            if (el) el.textContent = firstName.charAt(0).toUpperCase();
        });
        
        // Show confirmation message
        alert('Profile updated successfully!');
    }
    
    /**
     * Handle logout button click
     */
    function handleLogout() {
        // Confirm logout
        if (confirm('Are you sure you want to log out?')) {
            // In a real app, we would clear the session and token
            // For this prototype, we'll just redirect to login
            window.location.href = 'login.html';
        }
    }
    
    /**
     * Handle cancel button click
     */
    function handleCancel() {
        // Reset form fields to original values
        if (this.closest('form') === profileForm) {
            const user = getUser();
            document.getElementById('firstName').value = user.firstName;
            document.getElementById('lastName').value = user.lastName;
            document.getElementById('email').value = user.email;
            document.getElementById('phone').value = user.phone || '';
        } else {
            // For password form, just clear the fields
            const passwordFields = this.closest('.profile-section').querySelectorAll('input[type="password"]');
            passwordFields.forEach(field => field.value = '');
        }
    }
    
    /**
     * Handle toggle switch change
     */
    function handleToggleChange() {
        const label = this.closest('.security-option').querySelector('.option-label').textContent;
        alert(`${label} has been ${this.checked ? 'enabled' : 'disabled'}.`);
        
        // In a real app, we would save this setting to the user's profile
    }
    
    /**
     * Handle disconnect account button click
     */
    function handleDisconnectAccount() {
        const accountName = this.closest('.account-item').querySelector('h4').textContent;
        if (confirm(`Are you sure you want to disconnect ${accountName}?`)) {
            alert(`${accountName} has been disconnected.`);
            this.closest('.account-item').remove();
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