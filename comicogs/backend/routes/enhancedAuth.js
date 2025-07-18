const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');
const { rateLimit } = require('express-rate-limit');
const helmet = require('helmet');

// Security middleware
router.use(helmet());

// Rate limiting
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // limit each IP to 10 requests per windowMs
    message: 'Too many authentication attempts, please try again later.'
});

// JWT Secrets
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'access-secret';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'refresh-secret';

// Generate tokens
const generateAccessToken = (user) => {
    return jwt.sign({ userId: user.id, email: user.email, role: user.role }, ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
};

const generateRefreshToken = (user) => {
    return jwt.sign({ userId: user.id, email: user.email, role: user.role }, REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
};

// Register a new user
router.post('/register', authLimiter, async (req, res) => {
    const { username, email, password } = req.body;

    if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 12);
        const result = await db.query(
            'INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, username, email, role',
            [username, email, hashedPassword, 'user']
        );
        const user = result.rows[0];
        res.status(201).json({ message: 'User registered successfully', user });
    } catch (error) {
        res.status(500).json({ error: 'Error registering user' });
    }
});

// Login
router.post('/login', authLimiter, async (req, res) => {
    const { email, password } = req.body;

    try {
        const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];

        if (!user || !await bcrypt.compare(password, user.password_hash)) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        // Store refresh token in DB
        await db.query('UPDATE users SET refresh_token = $1 WHERE id = $2', [refreshToken, user.id]);

        res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', path: '/api/auth/refresh' });
        res.json({ accessToken });
    } catch (error) {
        res.status(500).json({ error: 'Error logging in' });
    }
});

// Refresh token
router.post('/refresh', (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) return res.sendStatus(401);

    jwt.verify(refreshToken, REFRESH_TOKEN_SECRET, async (err, decoded) => {
        if (err) return res.sendStatus(403);

        const result = await db.query('SELECT * FROM users WHERE id = $1 AND refresh_token = $2', [decoded.userId, refreshToken]);
        const user = result.rows[0];

        if (!user) return res.sendStatus(403);

        const accessToken = generateAccessToken(user);
        res.json({ accessToken });
    });
});

// Logout
router.post('/logout', authenticateToken, async (req, res) => {
    try {
        await db.query('UPDATE users SET refresh_token = NULL WHERE id = $1', [req.user.userId]);
        res.clearCookie('refreshToken', { path: '/api/auth/refresh' });
        res.sendStatus(204);
    } catch (error) {
        res.status(500).json({ error: 'Error logging out' });
    }
});

// GDPR Data Request
router.get('/me/data', authenticateToken, async (req, res) => {
    try {
        const userData = await db.query('SELECT id, username, email, created_at FROM users WHERE id = $1', [req.user.userId]);
        // Add other user data queries as needed
        res.json(userData.rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching user data' });
    }
});

// GDPR Data Deletion
router.delete('/me', authenticateToken, async (req, res) => {
    try {
        await db.query('DELETE FROM users WHERE id = $1', [req.user.userId]);
        res.sendStatus(204);
    } catch (error) {
        res.status(500).json({ error: 'Error deleting user data' });
    }
});

module.exports = router;
