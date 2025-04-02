// Sync Service
const Sync = {
    db: null,
    isOnline: navigator.onLine,
    pendingTransactions: [],

    // Initialize IndexedDB
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('FinanceTrackerDB', 1);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Create stores
                if (!db.objectStoreNames.contains('transactions')) {
                    db.createObjectStore('transactions', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('budgets')) {
                    db.createObjectStore('budgets', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('goals')) {
                    db.createObjectStore('goals', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('syncQueue')) {
                    db.createObjectStore('syncQueue', { keyPath: 'id' });
                }
            };
        });
    },

    // Initialize event listeners
    initEventListeners() {
        window.addEventListener('online', () => this.handleOnline());
        window.addEventListener('offline', () => this.handleOffline());
    },

    // Handle online status
    async handleOnline() {
        this.isOnline = true;
        await this.syncPendingChanges();
    },

    // Handle offline status
    handleOffline() {
        this.isOnline = false;
        // Show offline notification
        this.showOfflineNotification();
    },

    // Show offline notification
    showOfflineNotification() {
        // Implementation for showing offline notification
        console.log('App is offline');
    },

    // Add transaction to sync queue
    async addToSyncQueue(transaction) {
        const syncItem = {
            id: Date.now().toString(),
            type: 'transaction',
            data: transaction,
            timestamp: new Date().toISOString()
        };

        await this.addToStore('syncQueue', syncItem);
        this.pendingTransactions.push(syncItem);

        if (this.isOnline) {
            await this.syncPendingChanges();
        }
    },

    // Sync pending changes
    async syncPendingChanges() {
        if (!this.isOnline) return;

        try {
            const syncQueue = await this.getAllFromStore('syncQueue');
            
            for (const item of syncQueue) {
                switch (item.type) {
                    case 'transaction':
                        await API.syncTransactions([item.data]);
                        break;
                    // Add other sync types here
                }
                
                // Remove synced item from queue
                await this.removeFromStore('syncQueue', item.id);
            }

            // Update UI after successful sync
            UI.loadDashboardData();
        } catch (error) {
            console.error('Sync failed:', error);
        }
    },

    // IndexedDB operations
    async addToStore(storeName, item) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.add(item);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    },

    async getFromStore(storeName, id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    async getAllFromStore(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    async removeFromStore(storeName, id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    },

    // Cache management
    async cacheData(storeName, data) {
        // Clear existing data
        const transaction = this.db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        await store.clear();

        // Add new data
        for (const item of data) {
            await this.addToStore(storeName, item);
        }
    },

    // Service Worker registration
    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('ServiceWorker registration successful');
                return registration;
            } catch (error) {
                console.error('ServiceWorker registration failed:', error);
            }
        }
    }
}; 