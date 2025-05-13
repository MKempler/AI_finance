const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Create database connection
const dbPath = path.join(__dirname, '../data/finance_tracker.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err);
        process.exit(1);
    }
    console.log('Connected to SQLite database');
});

// Function to check database schema
function checkDatabaseSchema() {
    return new Promise((resolve, reject) => {
        // List all tables
        db.all("SELECT name FROM sqlite_master WHERE type='table';", (err, tables) => {
            if (err) {
                console.error('Error checking tables:', err);
                reject(err);
                return;
            }
            
            console.log('Existing tables:', tables.map(t => t.name));
            
            // Check users table specifically
            if (tables.some(t => t.name === 'users')) {
                db.all("PRAGMA table_info(users);", (err, columns) => {
                    if (err) {
                        console.error('Error checking users table structure:', err);
                        reject(err);
                        return;
                    }
                    
                    console.log('Users table columns:', columns.map(c => `${c.name} (${c.type})`));
                    resolve(tables);
                });
            } else {
                console.log('Users table not found');
                resolve(tables);
            }
        });
    });
}

// Initialize database tables
function initializeDatabase() {
    return new Promise((resolve, reject) => {
        // First check the current schema
        checkDatabaseSchema()
            .then(() => {
                console.log('Creating/updating database tables...');
                db.serialize(() => {
                    // Create users table
                    db.run(`
                        CREATE TABLE IF NOT EXISTS users (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            name TEXT NOT NULL,
                            email TEXT UNIQUE NOT NULL,
                            password TEXT NOT NULL,
                            reset_token TEXT,
                            reset_token_expires DATETIME,
                            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                        )
                    `, (err) => {
                        if (err) {
                            console.error('Error creating users table:', err);
                            reject(err);
                            return;
                        }
                        console.log('Users table created/verified');
                    });

                    // Create trigger to update updated_at timestamp
                    db.run(`
                        CREATE TRIGGER IF NOT EXISTS update_users_timestamp 
                        AFTER UPDATE ON users
                        BEGIN
                            UPDATE users SET updated_at = CURRENT_TIMESTAMP
                            WHERE id = NEW.id;
                        END
                    `, (err) => {
                        if (err) {
                            console.error('Error creating trigger:', err);
                            reject(err);
                            return;
                        }
                        console.log('Update timestamp trigger created/verified');
                        
                        // Create transactions table
                        db.run(`
                            CREATE TABLE IF NOT EXISTS transactions (
                                id INTEGER PRIMARY KEY AUTOINCREMENT,
                                user_id INTEGER NOT NULL,
                                date TEXT NOT NULL,
                                description TEXT NOT NULL,
                                amount REAL NOT NULL,
                                type TEXT NOT NULL,
                                category TEXT NOT NULL,
                                memo TEXT,
                                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                            )
                        `, (err) => {
                            if (err) {
                                console.error('Error creating transactions table:', err);
                                reject(err);
                                return;
                            }
                            console.log('Transactions table created/verified');
                        });

                        // Create budgets table
                        db.run(`
                            CREATE TABLE IF NOT EXISTS budgets (
                                id INTEGER PRIMARY KEY AUTOINCREMENT,
                                user_id INTEGER NOT NULL,
                                category TEXT NOT NULL,
                                amount REAL NOT NULL,
                                period TEXT NOT NULL DEFAULT 'monthly',
                                start_date TEXT NOT NULL,
                                notes TEXT,
                                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                            )
                        `, (err) => {
                            if (err) {
                                console.error('Error creating budgets table:', err);
                                reject(err);
                                return;
                            }
                            console.log('Budgets table created/verified');
                            
                            // Now resolve after all tables are potentially created
                        checkDatabaseSchema()
                            .then(() => {
                                console.log('Database tables initialized successfully');
                                resolve();
                            })
                            .catch(reject);
                        });
                    });
                });
            })
            .catch(reject);
    });
}

// Export a function to run SQL queries for debugging
function runDebugQuery(query, params = []) {
    return new Promise((resolve, reject) => {
        db.all(query, params, (err, rows) => {
            if (err) {
                console.error('Debug query error:', err);
                reject(err);
                return;
            }
            resolve(rows);
        });
    });
}

// Initialize the database
initializeDatabase().catch(err => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
});

module.exports = {
    db,
    dbPath,
    checkDatabaseSchema,
    runDebugQuery
}; 