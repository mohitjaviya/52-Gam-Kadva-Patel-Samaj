// Load environment variables
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const session = require('express-session');
const path = require('path');
const { initDatabase, getDb } = require('./database/init');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize database (async)
let dbReady = false;
initDatabase().then(() => {
    dbReady = true;
    console.log('Database ready!');
}).catch(err => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Trust proxy for Render/Heroku (needed for secure cookies behind HTTPS)
app.set('trust proxy', 1);

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'dev-only-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');
const dataRoutes = require('./routes/data');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/data', dataRoutes);

// Authentication middleware - require login for protected pages
const requireAuth = (req, res, next) => {
    if (req.session && req.session.userId) {
        next();
    } else {
        res.redirect('/login');
    }
};

// Admin authentication middleware
const requireAdmin = (req, res, next) => {
    if (req.session && req.session.userId && req.session.isAdmin) {
        next();
    } else {
        res.redirect('/login');
    }
};

// Middleware to require registration completed
const requireRegistration = (req, res, next) => {
    if (req.session && req.session.userId && req.session.registrationCompleted) {
        next();
    } else if (req.session && req.session.userId) {
        res.redirect('/register'); // Logged in but registration not complete
    } else {
        res.redirect('/login');
    }
};

// Public pages (no login required)
app.get('/login', (req, res) => {
    if (req.session && req.session.userId) {
        if (!req.session.registrationCompleted) {
            return res.redirect('/register'); // Need to complete registration
        }
        return res.redirect('/'); // Already logged in, go to home
    }
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/signup', (req, res) => {
    if (req.session && req.session.userId) {
        if (!req.session.registrationCompleted) {
            return res.redirect('/register'); // Need to complete registration
        }
        return res.redirect('/'); // Already logged in, go to home
    }
    res.sendFile(path.join(__dirname, 'public', 'signup.html'));
});

// Protected - requires login but NOT completed registration
app.get('/register', (req, res) => {
    if (!req.session || !req.session.userId) {
        return res.redirect('/login'); // Must login first
    }
    if (req.session.registrationCompleted) {
        return res.redirect('/'); // Already registered, go to home
    }
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

// Protected pages (login + registration required)
app.get('/', requireRegistration, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/search', requireRegistration, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'search.html'));
});

app.get('/profile', requireRegistration, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'profile.html'));
});

app.get('/admin', requireAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 52 ગામ કડવા પટેલ સમાજ Server running on http://localhost:${PORT}`);
    console.log(`📝 Sign Up at: http://localhost:${PORT}/signup`);
    console.log(`🔐 Login at: http://localhost:${PORT}/login`);
    console.log(`👤 Admin at: http://localhost:${PORT}/admin`);
});

module.exports = app;
