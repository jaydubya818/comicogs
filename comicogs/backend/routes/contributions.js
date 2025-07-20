const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/authMiddleware');

// Endpoint to suggest an edit for a comic
router.post('/suggest-edit', authenticateToken, async (req, res) => {
    const { comic_id, field, old_value, new_value, reason } = req.body;
    const user_id = req.user.userId; // Get user ID from authenticated token

    if (!comic_id || !field || !new_value || !reason) {
        return res.status(400).json({ error: 'Missing required fields: comic_id, field, new_value, reason' });
    }

    try {
        // Insert the suggestion into a 'suggestions' table (needs to be created in DB schema)
        // For now, we'll just log it and return success.
        console.log(`User ${user_id} suggested edit for comic ${comic_id}: `,
                    `Field: ${field}, Old: ${old_value}, New: ${new_value}, Reason: ${reason}`);

        // In a real application, you would insert this into a database table like:
        /*
        await db.query(
            `INSERT INTO comic_suggestions (comic_id, user_id, field, old_value, new_value, reason, status)
             VALUES ($1, $2, $3, $4, $5, $6, 'pending')`,
            [comic_id, user_id, field, old_value, new_value, reason]
        );
        */

        res.status(200).json({ message: 'Edit suggestion submitted successfully. Thank you for your contribution!' });
    } catch (error) {
        console.error('Error submitting edit suggestion:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Endpoint to suggest a new comic (more complex, placeholder for now)
router.post('/suggest-new-comic', authenticateToken, async (req, res) => {
    const { title, issue_number, publisher, publication_date, description } = req.body;
    const user_id = req.user.userId;

    if (!title || !issue_number || !publisher) {
        return res.status(400).json({ error: 'Missing required fields: title, issue_number, publisher' });
    }

    console.log(`User ${user_id} suggested new comic: ${title} #${issue_number} by ${publisher}`);

    res.status(200).json({ message: 'New comic suggestion submitted successfully. It will be reviewed by our team.' });
});

module.exports = router;
