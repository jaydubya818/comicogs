const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/authMiddleware');

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

// Get a user's public store listings
router.get('/:userId/store', async (req, res) => {
    const { userId } = req.params;
    try {
        // First, verify the user exists and is public (or if we want to show all listings)
        const userResult = await db.query('SELECT id, username, bio FROM users WHERE id = $1', [userId]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        const user = userResult.rows[0];

        // Fetch listings for this user from the marketplace
        const listingsResult = await db.query(
            `SELECT 
                ml.id, ml.comic_id, ml.price, ml.condition, ml.created_at, 
                c.title, c.issue_number, c.series_title, c.publisher_name, c.cover_image_url
             FROM marketplace_listings ml
             JOIN comics c ON ml.comic_id = c.id
             WHERE ml.seller_id = $1 AND ml.status = 'active'`,
            [userId]
        );

        res.json({
            user: { id: user.id, username: user.username, bio: user.bio },
            listings: listingsResult.rows
        });

    } catch (error) {
        console.error('Error fetching user store:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;