// Main Application
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Initialize services
        await Sync.init();
        Sync.initEventListeners();
        await Sync.registerServiceWorker();

        // Initialize UI
        await UI.init();

        // Check authentication
        if (!API.token) {
            window.location.href = '/login.html';
        }
    } catch (error) {
        console.error('Application initialization failed:', error);
        // Show error notification to user
        showErrorNotification('Failed to initialize application. Please try again.');
    }
});

// Error notification helper
function showErrorNotification(message) {
    // Implementation for showing error notification
    console.error(message);
}

// Success notification helper
function showSuccessNotification(message) {
    // Implementation for showing success notification
    console.log(message);
} 