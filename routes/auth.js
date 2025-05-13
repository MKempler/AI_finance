const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { db } = require('../db/database');

// Authentication middleware
const authenticateToken = (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No token provided or invalid format');
      return res.status(401).json({ error: 'authentication_required', message: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];
    
    if (!token || token === 'null' || token === 'undefined') {
      console.log('Token is null or undefined');
      return res.status(401).json({ error: 'invalid_token', message: 'Invalid token' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    console.log('Token verified for user ID:', decoded.userId);
    
    // Set user info in request object
    req.user = { id: decoded.userId };
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'invalid_token', message: 'Invalid token' });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'expired_token', message: 'Token expired' });
    }
    
    res.status(401).json({ error: 'authentication_failed', message: 'Authentication failed' });
  }
};

// Validation middleware
const validateRegistration = [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long')
        .matches(/\d/)
        .withMessage('Password must contain at least one number')
        .matches(/[a-z]/)
        .withMessage('Password must contain at least one lowercase letter')
        .matches(/[A-Z]/)
        .withMessage('Password must contain at least one uppercase letter')
];

const validateLogin = [
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password').notEmpty().withMessage('Password is required')
];

// Register new user
router.post('/register', validateRegistration, async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: errors.array()[0].msg });
        }

        const { name, email, password } = req.body;
        console.log('Registration attempt:', { email, name });

        // Verify all required fields are present
        if (!name || !email || !password) {
            console.error('Registration failed: Missing required fields');
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Check if user already exists - with better error handling
        let existingUser = null;
        try {
            existingUser = await new Promise((resolve, reject) => {
                db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
                    if (err) reject(err);
                    resolve(row);
                });
            });
        } catch (dbError) {
            console.error('Database error checking for existing user:', dbError);
            return res.status(500).json({ message: 'Database error checking for existing user' });
        }

        console.log('Existing user check result:', existingUser);

        if (existingUser) {
            console.log('Registration failed: Email already exists');
            return res.status(400).json({ message: 'Email already registered' });
        }

        // Hash password
        let hashedPassword;
        try {
            const salt = await bcrypt.genSalt(10);
            hashedPassword = await bcrypt.hash(password, salt);
            console.log('Password hashed successfully, length:', hashedPassword.length);
        } catch (bcryptError) {
            console.error('Error hashing password:', bcryptError);
            return res.status(500).json({ message: 'Error processing password' });
        }

        // Insert new user with better error handling
        let result = null;
        try {
            // Use a parameterized query with explicit parameters
            result = await new Promise((resolve, reject) => {
                const stmt = db.prepare(
                    'INSERT INTO users (name, email, password) VALUES (?, ?, ?)'
                );
                
                stmt.run(name, email, hashedPassword, function(err) {
                    if (err) {
                        console.error('Error in insert statement:', err);
                        reject(err);
                        return;
                    }
                    resolve({lastID: this.lastID});
                });
                
                stmt.finalize();
            });
        } catch (dbError) {
            console.error('Database error inserting new user:', dbError);
            return res.status(500).json({ message: 'Database error creating new user' });
        }

        // Get the inserted user ID
        const userId = result.lastID;
        console.log('User created with ID:', userId);

        // Verify user was created successfully
        try {
            const createdUser = await new Promise((resolve, reject) => {
                db.get('SELECT id, name, email, password FROM users WHERE id = ?', [userId], (err, row) => {
                    if (err) reject(err);
                    resolve(row);
                });
            });
            
            console.log('Created user verification:', {
                id: createdUser.id,
                name: createdUser.name,
                email: createdUser.email,
                hasPassword: !!createdUser.password,
                passwordLength: createdUser.password ? createdUser.password.length : 0
            });
            
            if (!createdUser.password) {
                console.error('Warning: User created but password field is empty');
            }
        } catch (verifyError) {
            console.error('Error verifying created user:', verifyError);
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        console.log('Registration successful, token generated');

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: userId,
                name,
                email
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Error registering user' });
    }
});

// Login user
router.post('/login', validateLogin, async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: errors.array()[0].msg });
        }

        const { email, password } = req.body;
        console.log('Login attempt:', { email });

        // Find user with better error handling
        let user = null;
        try {
            user = await new Promise((resolve, reject) => {
                db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
                    if (err) reject(err);
                    resolve(row);
                });
            });
        } catch (dbError) {
            console.error('Database error finding user:', dbError);
            return res.status(500).json({ message: 'Database error finding user' });
        }

        console.log('User found:', user ? `ID: ${user.id}, Has Password: ${!!user.password}` : 'No user found');

        if (!user) {
            console.log('Login failed: User not found');
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Verify password exists before comparing
        if (!user.password) {
            console.error('Login failed: User has no password stored');
            return res.status(500).json({ message: 'Account error - please contact support' });
        }

        // Verify password
        try {
            const isValidPassword = await bcrypt.compare(password, user.password);
            if (!isValidPassword) {
                console.log('Login failed: Invalid password');
                return res.status(401).json({ message: 'Invalid email or password' });
            }
        } catch (bcryptError) {
            console.error('Password verification error:', bcryptError);
            return res.status(500).json({ message: 'Error verifying password' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        console.log('Login successful, token generated');

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Error logging in' });
    }
});

// Forgot password
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        // Find user
        const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
        if (!user) {
            // Return success even if user doesn't exist to prevent email enumeration
            return res.json({ message: 'If an account exists with this email, you will receive password reset instructions.' });
        }

        // Generate reset token
        const resetToken = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '1h' }
        );

        // Store reset token in database
        await db.run(
            'UPDATE users SET reset_token = ?, reset_token_expires = datetime("now", "+1 hour") WHERE id = ?',
            [resetToken, user.id]
        );

        // TODO: Send reset email with token
        // For now, just return success
        res.json({ message: 'If an account exists with this email, you will receive password reset instructions.' });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ message: 'Error processing request' });
    }
});

// Get current user
router.get('/me', authenticateToken, (req, res) => {
    console.log('GET /me endpoint accessed');
    try {
        // req.user is set by authenticateToken middleware
        if (!req.user || !req.user.id) {
            console.log('No user ID in token payload');
            return res.status(404).json({ error: 'user_not_found', message: 'User not found' });
        }

        const userId = req.user.id;
        console.log('Getting user data for ID:', userId);

        db.get('SELECT id, name, email, created_at FROM users WHERE id = ?', [userId], (err, user) => {
            if (err) {
                console.error('Database error fetching user:', err);
                return res.status(500).json({ error: 'server_error', message: 'Server error' });
            }
            
            if (!user) {
                console.log('User not found in database for ID:', userId);
                return res.status(404).json({ error: 'user_not_found', message: 'User not found' });
            }
            
            console.log('User found:', user.id);
            res.json({ user });
        });
    } catch (error) {
        console.error('Error in /me endpoint:', error);
        res.status(500).json({ error: 'server_error', message: 'Server error' });
    }
});

// Test endpoint to check existing users (FOR DEVELOPMENT ONLY)
router.get('/check-users', async (req, res) => {
    try {
        const users = await db.all('SELECT id, email, name FROM users');
        res.json({ users });
    } catch (error) {
        console.error('Error checking users:', error);
        res.status(500).json({ message: 'Error fetching users' });
    }
});

// Test endpoint to clear users table (FOR DEVELOPMENT ONLY - REMOVE IN PRODUCTION)
router.get('/reset-db', async (req, res) => {
    try {
        await db.run('DELETE FROM users');
        res.json({ message: 'All users deleted successfully' });
    } catch (error) {
        console.error('Error resetting database:', error);
        res.status(500).json({ message: 'Error resetting database' });
    }
});

// Debug endpoint to directly run a SQL query (DEVELOPMENT ONLY)
router.post('/debug', async (req, res) => {
    try {
        const { query, params = [] } = req.body;
        
        if (!query) {
            return res.status(400).json({ message: 'Query is required' });
        }
        
        console.log('Running debug query:', query, params);
        
        // Import the debug function
        const { runDebugQuery } = require('../db/database');
        
        const result = await runDebugQuery(query, params);
        res.json({ result });
    } catch (error) {
        console.error('Debug query error:', error);
        res.status(500).json({ message: 'Error running debug query', error: error.message });
    }
});

// Test endpoint to completely recreate database (DEVELOPMENT ONLY)
router.get('/recreate-db', async (req, res) => {
    try {
        const { db } = require('../db/database');
        
        // Drop and recreate users table
        await new Promise((resolve, reject) => {
            db.run('DROP TABLE IF EXISTS users', (err) => {
                if (err) reject(err);
                
                db.run(`
                    CREATE TABLE users (
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
                    if (err) reject(err);
                    resolve();
                });
            });
        });
        
        // Recreate trigger
        await new Promise((resolve, reject) => {
            db.run('DROP TRIGGER IF EXISTS update_users_timestamp', (err) => {
                if (err) reject(err);
                
                db.run(`
                    CREATE TRIGGER update_users_timestamp 
                    AFTER UPDATE ON users
                    BEGIN
                        UPDATE users SET updated_at = CURRENT_TIMESTAMP
                        WHERE id = NEW.id;
                    END
                `, (err) => {
                    if (err) reject(err);
                    resolve();
                });
            });
        });
        
        res.json({ message: 'Database recreated successfully' });
    } catch (error) {
        console.error('Error recreating database:', error);
        res.status(500).json({ message: 'Error recreating database', error: error.message });
    }
});

// Update user profile
router.put('/update-profile', authenticateToken, [
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('email').optional().isEmail().withMessage('Please enter a valid email')
], async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ status: 'error', message: errors.array()[0].msg });
        }

        const userId = req.user.id;
        const { name, email } = req.body;

        // Build update query
        let updateFields = [];
        let params = [];

        if (name) {
            updateFields.push('name = ?');
            params.push(name);
        }

        if (email) {
            // Check if email already exists (but is not the user's current email)
            const existingUser = await db.get('SELECT id FROM users WHERE email = ? AND id != ?', [email, userId]);
            if (existingUser) {
                return res.status(400).json({ status: 'error', message: 'Email already in use' });
            }
            
            updateFields.push('email = ?');
            params.push(email);
        }

        // Don't proceed if no fields to update
        if (updateFields.length === 0) {
            return res.status(400).json({ status: 'error', message: 'No fields to update' });
        }

        // Add userId to params
        params.push(userId);

        // Update user
        await db.run(
            `UPDATE users SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            params
        );

        // Get updated user
        const updatedUser = await db.get(
            'SELECT id, name, email, created_at FROM users WHERE id = ?',
            [userId]
        );

        res.json({
            status: 'success',
            data: updatedUser
        });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ status: 'error', message: 'Server error' });
    }
});

// Update user password
router.put('/update-password', authenticateToken, [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long')
        .matches(/\d/)
        .withMessage('Password must contain at least one number')
        .matches(/[a-z]/)
        .withMessage('Password must contain at least one lowercase letter')
        .matches(/[A-Z]/)
        .withMessage('Password must contain at least one uppercase letter')
], async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ status: 'error', message: errors.array()[0].msg });
        }

        const userId = req.user.id;
        const { currentPassword, newPassword } = req.body;

        // Get user with password
        const user = await db.get('SELECT * FROM users WHERE id = ?', [userId]);

        // Verify current password
        const isValidPassword = await bcrypt.compare(currentPassword, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ status: 'error', message: 'Current password is incorrect' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update password
        await db.run(
            'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [hashedPassword, userId]
        );

        res.json({
            status: 'success',
            message: 'Password updated successfully'
        });
    } catch (error) {
        console.error('Error updating password:', error);
        res.status(500).json({ status: 'error', message: 'Server error' });
    }
});

module.exports = router; 