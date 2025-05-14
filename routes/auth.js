const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { query } = require('../db/database');

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

        // Check if user already exists
        const existingUserResult = await query('SELECT id FROM users WHERE email = $1', [email]);
        if (existingUserResult.rows.length > 0) {
            console.log('Registration failed: Email already exists');
            return res.status(400).json({ message: 'Email already registered' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        console.log('Password hashed successfully, length:', hashedPassword.length);

        // Insert new user
        const insertResult = await query(
            'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email',
            [name, email, hashedPassword]
        );
        
        if (insertResult.rows.length === 0) {
            console.error('Database error inserting new user: No rows returned');
            return res.status(500).json({ message: 'Database error creating new user' });
        }
        
        const newUser = insertResult.rows[0];
        console.log('User created with ID:', newUser.id);

        // Generate JWT token
        const token = jwt.sign(
            { userId: newUser.id },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        console.log('Registration successful, token generated');

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        // Check for unique constraint violation (PostgreSQL specific error code)
        if (error.code === '23505') { // Unique violation
             return res.status(400).json({ message: 'Email already registered.' });
        }
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

        // Find user
        const userResult = await query('SELECT id, email, password, name FROM users WHERE email = $1', [email]);
        if (userResult.rows.length === 0) {
            console.log('Login failed: User not found');
            return res.status(401).json({ message: 'Invalid email or password' });
        }
        const user = userResult.rows[0];

        // Verify password
        if (!user.password) {
            console.error('Login failed: User has no password stored');
            return res.status(500).json({ message: 'Account error - please contact support' });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            console.log('Login failed: Invalid password');
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        console.log('Login successful for user ID:', user.id);
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

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
    console.log('GET /me endpoint accessed');
    try {
        // req.user is set by authenticateToken middleware
        if (!req.user || !req.user.id) {
            console.log('No user ID in token payload');
            return res.status(404).json({ error: 'user_not_found', message: 'User not found' });
        }

        const userId = req.user.id;
        console.log('Getting user data for ID:', userId);

        // Select all relevant user fields you want on the profile page
        const userResult = await query('SELECT id, name, email, created_at FROM users WHERE id = $1', [userId]);
        if (userResult.rows.length === 0) {
            console.log('User not found in database for ID:', userId);
            return res.status(404).json({ error: 'user_not_found', message: 'User not found' });
        }
        
        const user = userResult.rows[0];
        console.log('User found:', user.id);
        // Return the user data nested under a 'user' key
        res.json({ user: user });
    } catch (error) {
        console.error('Error in /me endpoint:', error);
        res.status(500).json({ error: 'server_error', message: 'Server error' });
    }
});

// Test endpoint to check existing users (FOR DEVELOPMENT ONLY)
router.get('/check-users', async (req, res) => {
    try {
        const usersResult = await query('SELECT id, email, name FROM users');
        const users = usersResult.rows.map(row => ({
            id: row.id,
            email: row.email,
            name: row.name
        }));
        res.json({ users });
    } catch (error) {
        console.error('Error checking users:', error);
        res.status(500).json({ message: 'Error fetching users' });
    }
});

// Test endpoint to clear users table (FOR DEVELOPMENT ONLY - REMOVE IN PRODUCTION)
router.get('/reset-db', async (req, res) => {
    try {
        await query('DELETE FROM users');
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
        const { query } = require('../db/database');
        
        // Drop and recreate users table
        await query('DROP TABLE IF EXISTS users');
        
        await query(`
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
        `);
        
        // Recreate trigger
        await query('DROP TRIGGER IF EXISTS update_users_timestamp');
        
        await query(`
            CREATE TRIGGER update_users_timestamp 
            AFTER UPDATE ON users
            BEGIN
                UPDATE users SET updated_at = CURRENT_TIMESTAMP
                WHERE id = NEW.id;
            END
        `);
        
        res.json({ message: 'Database recreated successfully' });
    } catch (error) {
        console.error('Error recreating database:', error);
        res.status(500).json({ message: 'Error recreating database', error: error.message });
    }
});

// Validation middleware for profile update
const validateProfileUpdate = [
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('email').optional().isEmail().withMessage('Please enter a valid email')
    // Add other fields like phone if you want to support them
    // body('phone').optional().trim().matches(/^\+?[1-9]\d{1,14}$/).withMessage('Invalid phone number format') 
];

// Update user profile
router.put('/profile', authenticateToken, validateProfileUpdate, async (req, res) => {
    console.log('PUT /profile endpoint accessed for user ID:', req.user.id);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ status: 'error', message: errors.array()[0].msg });
    }

    const userId = req.user.id;
    const { name, email } = req.body; // Add other fields like phone here if needed

    if (Object.keys(req.body).length === 0) {
        return res.status(400).json({ status: 'error', message: 'No fields provided for update.' });
    }

    try {
        // Fetch current user data to compare
        const currentUserResult = await query('SELECT name, email FROM users WHERE id = $1', [userId]);
        if (currentUserResult.rows.length === 0) {
            return res.status(404).json({ status: 'error', message: 'User not found' });
        }
        const currentUser = currentUserResult.rows[0];

        // Build the update query dynamically based on provided fields
        const updateFields = [];
        const values = [];
        let placeholderIndex = 1;

        if (name !== undefined && name !== currentUser.name) {
            updateFields.push(`name = $${placeholderIndex++}`);
            values.push(name);
        }
        if (email !== undefined && email !== currentUser.email) {
            // Optional: Check if new email is already taken by another user
            const existingEmailResult = await query('SELECT id FROM users WHERE email = $1 AND id != $2', [email, userId]);
            if (existingEmailResult.rows.length > 0) {
                return res.status(400).json({ status: 'error', message: 'Email already in use by another account.' });
            }
            updateFields.push(`email = $${placeholderIndex++}`);
            values.push(email);
        }
        // Add other fields here, e.g., phone
        // if (phone !== undefined && phone !== currentUser.phone) {
        //     updateFields.push(`phone = $${placeholderIndex++}`);
        //     values.push(phone);
        // }

        if (updateFields.length === 0) {
            return res.status(200).json({ status: 'success', message: 'No changes to update.', user: currentUser });
        }

        values.push(userId); // For the WHERE clause
        const updateUserQuery = `UPDATE users SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${placeholderIndex} RETURNING id, name, email, created_at`;
        
        console.log('Executing update query:', updateUserQuery, 'with values:', values);
        const updatedUserResult = await query(updateUserQuery, values);

        if (updatedUserResult.rows.length === 0) {
            return res.status(500).json({ status: 'error', message: 'Failed to update profile' });
        }

        res.json({ status: 'success', message: 'Profile updated successfully', user: updatedUserResult.rows[0] });

    } catch (error) {
        console.error('Error updating profile:', error);
        if (error.code === '23505') { // Unique constraint violation (e.g. email)
            return res.status(400).json({ status: 'error', message: 'Email already in use.' });
        }
        res.status(500).json({ status: 'error', message: 'Server error while updating profile' });
    }
});

// Validation middleware for password update
const validatePasswordUpdate = [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword')
        .isLength({ min: 6 })
        .withMessage('New password must be at least 6 characters long')
        .matches(/\d/)
        .withMessage('New password must contain at least one number')
        .matches(/[a-z]/)
        .withMessage('New password must contain at least one lowercase letter')
        .matches(/[A-Z]/)
        .withMessage('New password must contain at least one uppercase letter')
];

// Update user password
router.put('/password', authenticateToken, validatePasswordUpdate, async (req, res) => {
    console.log('PUT /password endpoint accessed for user ID:', req.user.id);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ status: 'error', message: errors.array()[0].msg });
    }

    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    try {
        // Get current user's hashed password
        const userResult = await query('SELECT password FROM users WHERE id = $1', [userId]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ status: 'error', message: 'User not found' });
        }
        const storedHashedPassword = userResult.rows[0].password;

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, storedHashedPassword);
        if (!isMatch) {
            return res.status(401).json({ status: 'error', message: 'Incorrect current password' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const newHashedPassword = await bcrypt.hash(newPassword, salt);

        // Update password in database
        await query('UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [newHashedPassword, userId]);

        res.json({ status: 'success', message: 'Password updated successfully' });

    } catch (error) {
        console.error('Error updating password:', error);
        res.status(500).json({ status: 'error', message: 'Server error while updating password' });
    }
});

// Forgot password
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        // Find user
        const userResult = await query('SELECT * FROM users WHERE email = $1', [email]);
        if (userResult.rows.length === 0) {
            // Return success even if user doesn't exist to prevent email enumeration
            return res.json({ message: 'If an account exists with this email, you will receive password reset instructions.' });
        }

        // Generate reset token
        const resetToken = jwt.sign(
            { userId: userResult.rows[0].id },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '1h' }
        );

        // Store reset token in database
        await query('UPDATE users SET reset_token = $1, reset_token_expires = CURRENT_TIMESTAMP + INTERVAL \'1 hour\' WHERE id = $2', [resetToken, userResult.rows[0].id]);

        // TODO: Send reset email with token
        // For now, just return success
        res.json({ message: 'If an account exists with this email, you will receive password reset instructions.' });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ message: 'Error processing request' });
    }
});

// Logout (conceptually - JWT is stateless, client just deletes token)
// No explicit DB operation needed for basic JWT logout, but you might want to blacklist tokens for immediate effect.
router.post('/logout', (req, res) => {
    // For client-side, the token should be cleared from storage (localStorage/sessionStorage/cookies)
    // For server-side token blacklisting (more advanced), you would store the token in a temporary blacklist (e.g., Redis)
    // until it expires naturally.
    console.log('User logout request received');
    res.json({ message: 'Logout successful. Please clear your token.' });
});

module.exports = router; 