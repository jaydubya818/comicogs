const express = require('express');
const router = express.Router();
const db = require('../db');

// Middleware to authenticate user
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token == null) return res.sendStatus(401);
    
    // Mock user for testing
    req.user = req.user || { userId: 1 };
    next();
};

// Get user's wantlist
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.user;
        const {
            page = 1,
            limit = 20,
            sort = 'priority',
            order = 'DESC',
            priority,
            max_price_range,
            publisher,
            series
        } = req.query;

        const offset = (page - 1) * limit;
        let whereConditions = ['w.user_id = $1'];
        let queryParams = [userId];
        let paramIndex = 2;

        // Build filters
        if (priority) {
            whereConditions.push(`w.priority = $${paramIndex}`);
            queryParams.push(priority);
            paramIndex++;
        }

        if (max_price_range) {
            const [min, max] = max_price_range.split('-').map(parseFloat);
            if (min !== undefined) {
                whereConditions.push(`w.max_price >= $${paramIndex}`);
                queryParams.push(min);
                paramIndex++;
            }
            if (max !== undefined) {
                whereConditions.push(`w.max_price <= $${paramIndex}`);
                queryParams.push(max);
                paramIndex++;
            }
        }

        if (publisher) {
            whereConditions.push(`p.name ILIKE $${paramIndex}`);
            queryParams.push(`%${publisher}%`);
            paramIndex++;
        }

        if (series) {
            whereConditions.push(`s.title ILIKE $${paramIndex}`);
            queryParams.push(`%${series}%`);
            paramIndex++;
        }

        const query = `
            SELECT 
                w.*,
                c.title,
                c.issue_number,
                c.variant_name,
                c.cover_image_url,
                c.key_issue_notes,
                c.publication_date,
                p.name as publisher_name,
                s.title as series_title,
                s.genre,
                -- Get current market prices
                (SELECT price FROM price_history ph 
                 WHERE ph.comic_id = c.id AND ph.condition = COALESCE(w.min_condition, 'VF')
                 ORDER BY ph.sale_date DESC LIMIT 1) as current_market_price,
                -- Check if there are active listings within price range
                (SELECT COUNT(*) FROM marketplace_listings ml
                 WHERE ml.comic_id = c.id 
                 AND ml.status = 'active' 
                 AND ml.price <= COALESCE(w.max_price, 999999)
                 AND ml.condition >= COALESCE(w.min_condition, 'FN')) as available_listings,
                -- Check if already in collection
                (SELECT COUNT(*) FROM collections col
                 WHERE col.user_id = w.user_id AND col.comic_id = w.comic_id) as in_collection
            FROM wantlists w
            JOIN comics c ON w.comic_id = c.id
            LEFT JOIN publishers p ON c.publisher_id = p.id
            LEFT JOIN series s ON c.series_id = s.id
            WHERE ${whereConditions.join(' AND ')}
            ORDER BY w.${sort} ${order}, w.created_at DESC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;

        queryParams.push(limit, offset);

        const result = await db.query(query, queryParams);

        // Get wantlist statistics
        const statsQuery = `
            SELECT 
                COUNT(*) as total_items,
                COUNT(CASE WHEN w.priority = 5 THEN 1 END) as high_priority_count,
                AVG(w.max_price) as avg_max_price,
                SUM(w.max_price) as total_max_budget,
                COUNT(CASE WHEN w.notifications_enabled = true THEN 1 END) as notifications_enabled_count
            FROM wantlists w
            WHERE w.user_id = $1
        `;

        const statsResult = await db.query(statsQuery, [userId]);
        const stats = statsResult.rows[0];

        res.json({
            wantlist: result.rows,
            stats,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: parseInt(stats.total_items)
            }
        });
    } catch (error) {
        console.error('Error fetching wantlist:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Add comic to wantlist
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.user;
        const {
            comic_id,
            max_price,
            min_condition = 'FN',
            priority = 1,
            notes,
            notifications_enabled = true
        } = req.body;

        // Validate required fields
        if (!comic_id) {
            return res.status(400).json({ error: 'comic_id is required' });
        }

        // Check if comic exists
        const comicExists = await db.query('SELECT id FROM comics WHERE id = $1', [comic_id]);
        if (comicExists.rows.length === 0) {
            return res.status(404).json({ error: 'Comic not found' });
        }

        // Check if already in wantlist
        const existingEntry = await db.query(
            'SELECT id FROM wantlists WHERE user_id = $1 AND comic_id = $2',
            [userId, comic_id]
        );

        if (existingEntry.rows.length > 0) {
            return res.status(409).json({ error: 'Comic already in wantlist' });
        }

        // Check if already in collection
        const inCollection = await db.query(
            'SELECT id FROM collections WHERE user_id = $1 AND comic_id = $2',
            [userId, comic_id]
        );

        if (inCollection.rows.length > 0) {
            return res.status(409).json({ error: 'Comic already in your collection' });
        }

        const query = `
            INSERT INTO wantlists (
                user_id, comic_id, max_price, min_condition, priority, notes, notifications_enabled
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `;

        const result = await db.query(query, [
            userId, comic_id, max_price, min_condition, priority, notes, notifications_enabled
        ]);

        // Get full comic details for response
        const detailsQuery = `
            SELECT 
                w.*,
                c.title,
                c.issue_number,
                c.cover_image_url,
                p.name as publisher_name,
                s.title as series_title
            FROM wantlists w
            JOIN comics c ON w.comic_id = c.id
            LEFT JOIN publishers p ON c.publisher_id = p.id
            LEFT JOIN series s ON c.series_id = s.id
            WHERE w.id = $1
        `;

        const detailsResult = await db.query(detailsQuery, [result.rows[0].id]);

        res.status(201).json({
            message: 'Comic added to wantlist',
            wantlist_item: detailsResult.rows[0]
        });
    } catch (error) {
        console.error('Error adding to wantlist:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update wantlist item
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.user;
        const { id } = req.params;
        const {
            max_price,
            min_condition,
            priority,
            notes,
            notifications_enabled
        } = req.body;

        // Check if item exists and belongs to user
        const existingItem = await db.query(
            'SELECT id FROM wantlists WHERE id = $1 AND user_id = $2',
            [id, userId]
        );

        if (existingItem.rows.length === 0) {
            return res.status(404).json({ error: 'Wantlist item not found' });
        }

        const updateFields = [];
        const queryParams = [];
        let paramIndex = 1;

        // Build dynamic update query
        if (max_price !== undefined) {
            updateFields.push(`max_price = $${paramIndex}`);
            queryParams.push(max_price);
            paramIndex++;
        }

        if (min_condition !== undefined) {
            updateFields.push(`min_condition = $${paramIndex}`);
            queryParams.push(min_condition);
            paramIndex++;
        }

        if (priority !== undefined) {
            updateFields.push(`priority = $${paramIndex}`);
            queryParams.push(priority);
            paramIndex++;
        }

        if (notes !== undefined) {
            updateFields.push(`notes = $${paramIndex}`);
            queryParams.push(notes);
            paramIndex++;
        }

        if (notifications_enabled !== undefined) {
            updateFields.push(`notifications_enabled = $${paramIndex}`);
            queryParams.push(notifications_enabled);
            paramIndex++;
        }

        if (updateFields.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        queryParams.push(id, userId);

        const query = `
            UPDATE wantlists 
            SET ${updateFields.join(', ')}
            WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
            RETURNING *
        `;

        const result = await db.query(query, queryParams);

        res.json({
            message: 'Wantlist item updated',
            wantlist_item: result.rows[0]
        });
    } catch (error) {
        console.error('Error updating wantlist item:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Remove comic from wantlist
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.user;
        const { id } = req.params;

        const result = await db.query(
            'DELETE FROM wantlists WHERE id = $1 AND user_id = $2 RETURNING *',
            [id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Wantlist item not found' });
        }

        res.json({ message: 'Comic removed from wantlist' });
    } catch (error) {
        console.error('Error removing from wantlist:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get wantlist matches (available comics within price/condition range)
router.get('/matches', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.user;

        const query = `
            SELECT 
                w.id as wantlist_id,
                w.max_price,
                w.min_condition,
                w.priority,
                c.title,
                c.issue_number,
                c.cover_image_url,
                p.name as publisher_name,
                s.title as series_title,
                ml.id as listing_id,
                ml.price,
                ml.condition,
                ml.description as listing_description,
                ml.user_id as seller_id,
                u.username as seller_username,
                -- Calculate how good this match is
                CASE 
                    WHEN ml.price <= w.max_price * 0.8 THEN 'excellent'
                    WHEN ml.price <= w.max_price * 0.9 THEN 'good'
                    WHEN ml.price <= w.max_price THEN 'fair'
                    ELSE 'above_budget'
                END as deal_quality
            FROM wantlists w
            JOIN comics c ON w.comic_id = c.id
            LEFT JOIN publishers p ON c.publisher_id = p.id
            LEFT JOIN series s ON c.series_id = s.id
            JOIN marketplace_listings ml ON c.id = ml.comic_id
            JOIN users u ON ml.user_id = u.id
            WHERE w.user_id = $1
            AND ml.status = 'active'
            AND ml.price <= COALESCE(w.max_price, 999999)
            AND ml.user_id != $1  -- Don't match user's own listings
            ORDER BY w.priority DESC, ml.price ASC
        `;

        const result = await db.query(query, [userId]);

        // Group by wantlist item
        const matches = {};
        result.rows.forEach(row => {
            if (!matches[row.wantlist_id]) {
                matches[row.wantlist_id] = {
                    wantlist_id: row.wantlist_id,
                    comic: {
                        title: row.title,
                        issue_number: row.issue_number,
                        cover_image_url: row.cover_image_url,
                        publisher_name: row.publisher_name,
                        series_title: row.series_title
                    },
                    wantlist_criteria: {
                        max_price: row.max_price,
                        min_condition: row.min_condition,
                        priority: row.priority
                    },
                    available_listings: []
                };
            }

            matches[row.wantlist_id].available_listings.push({
                listing_id: row.listing_id,
                price: row.price,
                condition: row.condition,
                description: row.listing_description,
                seller: {
                    id: row.seller_id,
                    username: row.seller_username
                },
                deal_quality: row.deal_quality
            });
        });

        res.json({ matches: Object.values(matches) });
    } catch (error) {
        console.error('Error fetching wantlist matches:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get wantlist notifications/alerts
router.get('/notifications', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.user;

        const query = `
            SELECT 
                w.id as wantlist_id,
                c.title,
                c.issue_number,
                p.name as publisher_name,
                pa.target_price,
                pa.alert_type,
                pa.last_triggered,
                pa.active,
                -- Get latest price for comparison
                (SELECT price FROM price_history ph 
                 WHERE ph.comic_id = c.id AND ph.condition = COALESCE(w.min_condition, 'VF')
                 ORDER BY ph.sale_date DESC LIMIT 1) as current_price
            FROM wantlists w
            JOIN comics c ON w.comic_id = c.id
            LEFT JOIN publishers p ON c.publisher_id = p.id
            LEFT JOIN price_alerts pa ON w.user_id = pa.user_id AND w.comic_id = pa.comic_id
            WHERE w.user_id = $1
            AND w.notifications_enabled = true
            ORDER BY w.priority DESC, pa.last_triggered DESC NULLS LAST
        `;

        const result = await db.query(query, [userId]);

        const notifications = result.rows.map(row => ({
            wantlist_id: row.wantlist_id,
            comic: {
                title: row.title,
                issue_number: row.issue_number,
                publisher_name: row.publisher_name
            },
            alert: {
                target_price: row.target_price,
                alert_type: row.alert_type,
                last_triggered: row.last_triggered,
                active: row.active
            },
            current_price: row.current_price,
            should_trigger: row.alert_type === 'below' && row.current_price && row.current_price <= row.target_price
        }));

        res.json({ notifications });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router; 