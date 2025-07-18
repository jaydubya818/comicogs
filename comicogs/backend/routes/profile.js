
const express = require('express');
const router = express.Router();
const db = require('../db');
const authenticateToken = require('../middleware/authenticateToken');

// Get user profile
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { rows } = await db.query('SELECT id, username, email, bio FROM users WHERE id = $1', [req.user.id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(rows[0]);
    } catch (error) {
        console.error('Error getting user profile:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Update user profile
router.put('/', authenticateToken, async (req, res) => {
    const { username, email, bio } = req.body;
    try {
        const { rows } = await db.query(
            'UPDATE users SET username = $1, email = $2, bio = $3 WHERE id = $4 RETURNING id, username, email, bio',
            [username, email, bio, req.user.id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(rows[0]);
    } catch (error) {
        console.error('Error updating user profile:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
