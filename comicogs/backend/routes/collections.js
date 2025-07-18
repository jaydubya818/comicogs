const express = require('express');
const router = express.Router();
const db = require('../db');

// Middleware to authenticate user (assumes JWT middleware is applied in main app)
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token == null) return res.sendStatus(401);
    
    // In a real app, verify JWT token here
    // For now, assume user_id is passed in request or token
    req.user = req.user || { userId: 1 }; // Mock user for testing
    next();
};

// Get user's collection
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.user;
        const {
            page = 1,
            limit = 20,
            sort = 'acquired_date',
            order = 'DESC',
            reading_status,
            favorite,
            for_sale,
            publisher,
            series
        } = req.query;

        const offset = (page - 1) * limit;
        let whereConditions = ['col.user_id = $1'];
        let queryParams = [userId];
        let paramIndex = 2;

        // Build filters
        if (reading_status) {
            whereConditions.push(`col.reading_status = $${paramIndex}`);
            queryParams.push(reading_status);
            paramIndex++;
        }

        if (favorite !== undefined) {
            whereConditions.push(`col.favorite = $${paramIndex}`);
            queryParams.push(favorite === 'true');
            paramIndex++;
        }

        if (for_sale !== undefined) {
            whereConditions.push(`col.for_sale = $${paramIndex}`);
            queryParams.push(for_sale === 'true');
            paramIndex++;
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
                col.*,
                c.title,
                c.issue_number,
                c.variant_name,
                c.cover_image_url,
                c.key_issue_notes,
                c.publication_date,
                p.name as publisher_name,
                s.title as series_title,
                s.genre,
                -- Get latest market price
                (SELECT price FROM price_history ph 
                 WHERE ph.comic_id = c.id AND ph.condition = col.condition 
                 ORDER BY ph.sale_date DESC LIMIT 1) as market_price
            FROM collections col
            JOIN comics c ON col.comic_id = c.id
            LEFT JOIN publishers p ON c.publisher_id = p.id
            LEFT JOIN series s ON c.series_id = s.id
            WHERE ${whereConditions.join(' AND ')}
            ORDER BY col.${sort} ${order}
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;

        queryParams.push(limit, offset);

        const result = await db.query(query, queryParams);

        // Get collection statistics
        const statsQuery = `
            SELECT 
                COUNT(*) as total_comics,
                SUM(col.purchase_price) as total_purchase_price,
                SUM(col.current_value) as total_current_value,
                COUNT(CASE WHEN col.reading_status = 'read' THEN 1 END) as read_count,
                COUNT(CASE WHEN col.favorite = true THEN 1 END) as favorite_count,
                COUNT(CASE WHEN col.for_sale = true THEN 1 END) as for_sale_count
            FROM collections col
            WHERE col.user_id = $1
        `;

        const statsResult = await db.query(statsQuery, [userId]);
        const stats = statsResult.rows[0];

        // Calculate return on investment
        const roi = stats.total_purchase_price > 0 ? 
            ((stats.total_current_value - stats.total_purchase_price) / stats.total_purchase_price * 100).toFixed(2) : 0;

        res.json({
            collection: result.rows,
            stats: {
                ...stats,
                roi_percentage: parseFloat(roi)
            },
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: parseInt(stats.total_comics)
            }
        });
    } catch (error) {
        console.error('Error fetching collection:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Add comic to collection
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.user;
        const {
            comic_id,
            condition,
            purchase_price,
            current_value,
            purchase_date,
            notes,
            location,
            favorite = false
        } = req.body;

        // Validate required fields
        if (!comic_id || !condition) {
            return res.status(400).json({ error: 'comic_id and condition are required' });
        }

        // Check if comic exists
        const comicExists = await db.query('SELECT id FROM comics WHERE id = $1', [comic_id]);
        if (comicExists.rows.length === 0) {
            return res.status(404).json({ error: 'Comic not found' });
        }

        // Check if already in collection
        const existingEntry = await db.query(
            'SELECT id FROM collections WHERE user_id = $1 AND comic_id = $2',
            [userId, comic_id]
        );

        if (existingEntry.rows.length > 0) {
            return res.status(409).json({ error: 'Comic already in collection' });
        }

        const query = `
            INSERT INTO collections (
                user_id, comic_id, condition, purchase_price, current_value,
                purchase_date, notes, location, favorite
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *
        `;

        const result = await db.query(query, [
            userId, comic_id, condition, purchase_price, current_value,
            purchase_date, notes, location, favorite
        ]);

        // Get full comic details for response
        const detailsQuery = `
            SELECT 
                col.*,
                c.title,
                c.issue_number,
                c.cover_image_url,
                p.name as publisher_name,
                s.title as series_title
            FROM collections col
            JOIN comics c ON col.comic_id = c.id
            LEFT JOIN publishers p ON c.publisher_id = p.id
            LEFT JOIN series s ON c.series_id = s.id
            WHERE col.id = $1
        `;

        const detailsResult = await db.query(detailsQuery, [result.rows[0].id]);

        res.status(201).json({
            message: 'Comic added to collection',
            collection_item: detailsResult.rows[0]
        });
    } catch (error) {
        console.error('Error adding to collection:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update collection item
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.user;
        const { id } = req.params;
        const {
            condition,
            purchase_price,
            current_value,
            purchase_date,
            notes,
            location,
            reading_status,
            favorite,
            for_sale,
            sale_price
        } = req.body;

        // Check if item exists and belongs to user
        const existingItem = await db.query(
            'SELECT id FROM collections WHERE id = $1 AND user_id = $2',
            [id, userId]
        );

        if (existingItem.rows.length === 0) {
            return res.status(404).json({ error: 'Collection item not found' });
        }

        const updateFields = [];
        const queryParams = [];
        let paramIndex = 1;

        // Build dynamic update query
        if (condition !== undefined) {
            updateFields.push(`condition = $${paramIndex}`);
            queryParams.push(condition);
            paramIndex++;
        }

        if (purchase_price !== undefined) {
            updateFields.push(`purchase_price = $${paramIndex}`);
            queryParams.push(purchase_price);
            paramIndex++;
        }

        if (current_value !== undefined) {
            updateFields.push(`current_value = $${paramIndex}`);
            queryParams.push(current_value);
            paramIndex++;
        }

        if (purchase_date !== undefined) {
            updateFields.push(`purchase_date = $${paramIndex}`);
            queryParams.push(purchase_date);
            paramIndex++;
        }

        if (notes !== undefined) {
            updateFields.push(`notes = $${paramIndex}`);
            queryParams.push(notes);
            paramIndex++;
        }

        if (location !== undefined) {
            updateFields.push(`location = $${paramIndex}`);
            queryParams.push(location);
            paramIndex++;
        }

        if (reading_status !== undefined) {
            updateFields.push(`reading_status = $${paramIndex}`);
            queryParams.push(reading_status);
            paramIndex++;
        }

        if (favorite !== undefined) {
            updateFields.push(`favorite = $${paramIndex}`);
            queryParams.push(favorite);
            paramIndex++;
        }

        if (for_sale !== undefined) {
            updateFields.push(`for_sale = $${paramIndex}`);
            queryParams.push(for_sale);
            paramIndex++;
        }

        if (sale_price !== undefined) {
            updateFields.push(`sale_price = $${paramIndex}`);
            queryParams.push(sale_price);
            paramIndex++;
        }

        if (updateFields.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
        queryParams.push(id, userId);

        const query = `
            UPDATE collections 
            SET ${updateFields.join(', ')}
            WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
            RETURNING *
        `;

        const result = await db.query(query, queryParams);

        res.json({
            message: 'Collection item updated',
            collection_item: result.rows[0]
        });
    } catch (error) {
        console.error('Error updating collection item:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Remove comic from collection
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.user;
        const { id } = req.params;

        const result = await db.query(
            'DELETE FROM collections WHERE id = $1 AND user_id = $2 RETURNING *',
            [id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Collection item not found' });
        }

        res.json({ message: 'Comic removed from collection' });
    } catch (error) {
        console.error('Error removing from collection:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get collection value over time
router.get('/value-history', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.user;

        const query = `
            SELECT 
                DATE_TRUNC('month', col.acquired_date) as month,
                SUM(col.purchase_price) as total_purchase_price,
                SUM(col.current_value) as total_current_value,
                COUNT(*) as comics_added
            FROM collections col
            WHERE col.user_id = $1
            GROUP BY DATE_TRUNC('month', col.acquired_date)
            ORDER BY month
        `;

        const result = await db.query(query, [userId]);

        // Calculate cumulative values
        let cumulativePurchase = 0;
        let cumulativeValue = 0;

        const valueHistory = result.rows.map(row => {
            cumulativePurchase += parseFloat(row.total_purchase_price || 0);
            cumulativeValue += parseFloat(row.total_current_value || 0);

            return {
                month: row.month,
                monthly_purchase: parseFloat(row.total_purchase_price || 0),
                monthly_value: parseFloat(row.total_current_value || 0),
                cumulative_purchase: cumulativePurchase,
                cumulative_value: cumulativeValue,
                comics_added: parseInt(row.comics_added)
            };
        });

        res.json({ value_history: valueHistory });
    } catch (error) {
        console.error('Error fetching value history:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get user collection statistics for dashboard
router.get('/user/:userId/stats', async (req, res) => {
    try {
        const { userId } = req.params;

        // Get total collection count and estimated value
        const collectionStatsQuery = `
            SELECT 
                COUNT(DISTINCT co.comic_id) as total_comics,
                COUNT(DISTINCT co.id) as total_items,
                COALESCE(SUM(
                    CASE co.condition
                        WHEN 'MT' THEN COALESCE(c.latest_nm_price::numeric, 0) * 1.2
                        WHEN 'NM' THEN COALESCE(c.latest_nm_price::numeric, 0)
                        WHEN 'VF' THEN COALESCE(c.latest_vf_price::numeric, 0)
                        WHEN 'FN' THEN COALESCE(c.latest_vf_price::numeric, 0) * 0.7
                        WHEN 'VG' THEN COALESCE(c.latest_vf_price::numeric, 0) * 0.5
                        WHEN 'GD' THEN COALESCE(c.latest_vf_price::numeric, 0) * 0.3
                        WHEN 'FR' THEN COALESCE(c.latest_vf_price::numeric, 0) * 0.1
                        WHEN 'PR' THEN COALESCE(c.latest_vf_price::numeric, 0) * 0.05
                        ELSE COALESCE(c.latest_vf_price::numeric, 0) * 0.7
                    END
                ), 0) as estimated_value
            FROM collections co
            JOIN comics c ON co.comic_id = c.id
            WHERE co.user_id = $1
        `;

        // Get publisher breakdown
        const publisherBreakdownQuery = `
            SELECT 
                p.name as publisher,
                COUNT(*) as count,
                ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 1) as percentage
            FROM collections co
            JOIN comics c ON co.comic_id = c.id
            JOIN publishers p ON c.publisher_id = p.id
            WHERE co.user_id = $1
            GROUP BY p.name
            ORDER BY count DESC
            LIMIT 5
        `;

        // Get recent activity (last 10 additions)
        const recentActivityQuery = `
            SELECT 
                c.title,
                c.issue_number,
                p.name as publisher,
                co.condition,
                COALESCE(co.updated_at, CURRENT_TIMESTAMP) as created_at,
                'added' as activity_type
            FROM collections co
            JOIN comics c ON co.comic_id = c.id
            JOIN publishers p ON c.publisher_id = p.id
            WHERE co.user_id = $1
            ORDER BY COALESCE(co.updated_at, CURRENT_TIMESTAMP) DESC
            LIMIT 10
        `;

        // Get condition breakdown
        const conditionBreakdownQuery = `
            SELECT 
                COALESCE(co.condition, 'Unknown') as condition,
                COUNT(*) as count,
                ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 1) as percentage
            FROM collections co
            WHERE co.user_id = $1
            GROUP BY co.condition
            ORDER BY count DESC
        `;

        // Execute all queries in parallel
        const [statsResult, publisherResult, activityResult, conditionResult] = await Promise.all([
            db.query(collectionStatsQuery, [userId]),
            db.query(publisherBreakdownQuery, [userId]),
            db.query(recentActivityQuery, [userId]),
            db.query(conditionBreakdownQuery, [userId])
        ]);

        const stats = statsResult.rows[0] || {
            total_comics: 0,
            total_items: 0,
            estimated_value: 0
        };

        res.json({
            overview: {
                totalComics: parseInt(stats.total_comics) || 0,
                totalItems: parseInt(stats.total_items) || 0,
                estimatedValue: parseFloat(stats.estimated_value) || 0
            },
            publisherBreakdown: publisherResult.rows,
            conditionBreakdown: conditionResult.rows,
            recentActivity: activityResult.rows.map(activity => ({
                ...activity,
                created_at: activity.created_at.toISOString()
            }))
        });

    } catch (error) {
        console.error('Error fetching user collection stats:', error);
        res.status(500).json({ 
            error: 'Failed to fetch collection statistics',
            details: error.message 
        });
    }
});

module.exports = router; 