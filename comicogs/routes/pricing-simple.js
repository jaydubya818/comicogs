/**
 * Simplified Pricing Route for Basic Startup
 */

const express = require('express');
const router = express.Router();
const db = require('../db');

// Basic API endpoint for testing
router.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: 'Pricing API is running',
        timestamp: new Date().toISOString()
    });
});

// Get basic pricing data
router.get('/comics/:id/price', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Simple mock response for now
        res.json({
            comic_id: id,
            current_price: Math.floor(Math.random() * 100) + 10,
            price_range: {
                min: Math.floor(Math.random() * 50) + 5,
                max: Math.floor(Math.random() * 200) + 50
            },
            last_updated: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error fetching price data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router; 