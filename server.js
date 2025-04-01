require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
const db = require('./server/config/database');
const config = require('./server/config/config');
const authRoutes = require('./server/routes/auth');
const transactionRoutes = require('./server/routes/transactions');
const budgetRoutes = require('./server/routes/budgets');
const goalRoutes = require('./server/routes/goals');
const aiRoutes = require('./server/routes/ai');
const dashboardRoutes = require('./server/routes/dashboard');
const syncRoutes = require('./server/routes/sync');
const { authenticateToken } = require('./server/middleware/auth');
const jwt = require('jsonwebtoken');

// Set JWT secret in process.env
process.env.JWT_SECRET = config.jwt.secret;

const app = express();

// Middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:", "blob:", "*"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
            fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
        },
    },
}));

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Debug middleware for static files
app.use((req, res, next) => {
    console.log('Request URL:', req.url);
    next();
});

// API Routes first
app.use('/api/auth', authRoutes);
app.use('/api/transactions', authenticateToken, transactionRoutes);
app.use('/api/budgets', authenticateToken, budgetRoutes);
app.use('/api/goals', authenticateToken, goalRoutes);
app.use('/api/ai', authenticateToken, aiRoutes);
app.use('/api/dashboard', authenticateToken, dashboardRoutes);
app.use('/api/sync', authenticateToken, syncRoutes);

// Serve static files for login and register pages
app.use('/css', express.static(path.join(__dirname, 'public/css')));
app.use('/js', express.static(path.join(__dirname, 'public/js')));
app.use('/images', express.static(path.join(__dirname, 'public/images'), {
    setHeaders: (res, path) => {
        res.set('Content-Type', 'image/png');
        res.set('Cache-Control', 'no-cache');
    }
}));

// Login and Register routes
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

// Main route handler
app.get('/', (req, res) => {
    // Always redirect to login page if no valid token
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        res.redirect('/login');
    } else {
        try {
            jwt.verify(token, process.env.JWT_SECRET);
            res.sendFile(path.join(__dirname, 'public', 'index.html'));
        } catch (err) {
            res.redirect('/login');
        }
    }
});

// Catch-all route for other pages
app.get('*', (req, res) => {
    // Don't serve index.html for API routes
    if (req.url.startsWith('/api/')) {
        return res.status(404).json({
            status: 'error',
            message: 'API endpoint not found'
        });
    }

    // For all other routes, check if user is authenticated
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        res.redirect('/login');
    } else {
        try {
            jwt.verify(token, process.env.JWT_SECRET);
            res.sendFile(path.join(__dirname, 'public', 'index.html'));
        } catch (err) {
            res.redirect('/login');
        }
    }
});

// Serve remaining static files last
app.use(express.static(path.join(__dirname, 'public')));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 