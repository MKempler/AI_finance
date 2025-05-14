const { Pool } = require('pg');
const dotenv = require('dotenv'); // Ensure dotenv is used if not already globally configured
dotenv.config(); // Load .env variables

// Create a PostgreSQL connection pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // ssl: { rejectUnauthorized: false } // Add this if connecting to a cloud DB that requires SSL and you encounter SSL issues
});

pool.on('connect', () => {
    console.log('Connected to PostgreSQL database via pg Pool');
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client in pg Pool', err);
    process.exit(-1);
});

// Function to check database schema (PostgreSQL version)
async function checkDatabaseSchema() {
    console.log('Checking PostgreSQL database schema...');
    try {
        const res = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        `);
        const tables = res.rows.map(r => r.table_name);
        console.log('Existing tables in public schema:', tables);

        if (tables.includes('users')) {
            const userColsRes = await pool.query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_schema = 'public' AND table_name = 'users'
                ORDER BY ordinal_position;
            `);
            console.log('Users table columns:', userColsRes.rows.map(c => `${c.column_name} (${c.data_type})`));
        }
        return tables;
    } catch (err) {
        console.error('Error checking PostgreSQL schema:', err);
        throw err;
    }
}

// Initialize database tables (PostgreSQL version)
async function initializeDatabase() {
    console.log('Initializing/verifying PostgreSQL database tables...');
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                reset_token TEXT,
                reset_token_expires TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Users table created/verified');

        // TODO: PostgreSQL equivalent for SQLite trigger 'update_users_timestamp'
        // This typically involves creating a function and then a trigger.
        // For now, updated_at will need to be handled by application logic on updates.
        // Example of how it might be done (requires more setup):
        // CREATE OR REPLACE FUNCTION update_updated_at_column()
        // RETURNS TRIGGER AS $$
        // BEGIN
        //    NEW.updated_at = NOW();
        //    RETURN NEW;
        // END;
        // $$ language 'plpgsql';
        // CREATE TRIGGER update_users_updated_at
        // BEFORE UPDATE ON users
        // FOR EACH ROW
        // EXECUTE PROCEDURE update_updated_at_column();

        await pool.query(`
            CREATE TABLE IF NOT EXISTS transactions (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                date DATE NOT NULL, -- Consider DATE type for dates
                description TEXT NOT NULL,
                amount REAL NOT NULL, -- Or DECIMAL(10, 2) for more precision with money
                type TEXT NOT NULL,
                category TEXT NOT NULL,
                memo TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Transactions table created/verified');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS budgets (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                category TEXT NOT NULL,
                amount REAL NOT NULL, -- Or DECIMAL(10, 2)
                period TEXT NOT NULL DEFAULT 'monthly',
                start_date DATE NOT NULL, -- Consider DATE type
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Budgets table created/verified');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS goals (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                name TEXT NOT NULL,
                target_amount REAL NOT NULL, -- Or DECIMAL(10, 2)
                current_amount REAL NOT NULL DEFAULT 0, -- Or DECIMAL(10, 2)
                deadline DATE NOT NULL, -- Consider DATE type
                type TEXT NOT NULL,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Goals table created/verified');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS goal_contributions (
                id SERIAL PRIMARY KEY,
                goal_id INTEGER NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- Redundant if goal_id implies user_id, but good for direct queries
                amount REAL NOT NULL, -- Or DECIMAL(10, 2)
                date DATE NOT NULL, -- Consider DATE type
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Goal contributions table created/verified');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS insights (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                type TEXT NOT NULL,
                generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Insights table created/verified');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS sync_queue (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                operation TEXT NOT NULL,
                entity_type TEXT NOT NULL,
                entity_id TEXT NOT NULL, -- If this ID refers to other tables, consider its type. TEXT is flexible.
                data JSONB NOT NULL, -- Using JSONB for better performance and indexing capabilities with JSON
                status TEXT NOT NULL DEFAULT 'pending', -- e.g., pending, processing, synced, failed
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Sync queue table created/verified');

        console.log('Database tables initialized successfully for PostgreSQL.');
        await checkDatabaseSchema(); // Verify schema after creation/update

    } catch (err) {
        console.error('Error initializing PostgreSQL database tables:', err);
        // If running locally for the first time, the database in DATABASE_URL might not exist.
        // For cloud providers like Neon/Supabase, the database is usually pre-created.
        // For local PostgreSQL, you might need to run `createdb your_db_name`
        if (err.code === '3D000') { // 3D000: database "your_db_name" does not exist
             console.error(`Database specified in DATABASE_URL does not exist. Please create it first.`)
        }
        throw err; // Re-throw error to be caught by server startup
    }
}

// Export a function to run SQL queries (this will replace the direct db export)
// All parts of your app that used `db.run`, `db.get`, `db.all` will need to be updated
// to use this `query` function or interact with the pool directly.
async function query(text, params) {
    // const start = Date.now();
    try {
        const res = await pool.query(text, params);
        // const duration = Date.now() - start;
        // console.log('executed query', { text, duration, rows: res.rowCount });
        return res;
    } catch (err) {
        console.error('Error executing query:', { text, params });
        console.error(err);
        throw err;
    }
}

// Initialize the database (this will be called when this module is required)
(async () => {
    try {
        await initializeDatabase();
    } catch (err) {
        console.error('Failed to initialize database on startup:', err);
        // process.exit(1); // Consider whether to exit or let the app try to continue/handle this
    }
})();

module.exports = {
    query, // Export the query function
    pool,  // Export the pool directly for more complex needs if necessary
    checkDatabaseSchema, // For debugging or admin tasks
    initializeDatabase // Could be called manually if needed
}; 