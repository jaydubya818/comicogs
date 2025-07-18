const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all marketplace listings with filtering and pagination
router.get('/listings', async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            condition,
            min_price,
            max_price,
            search,
            sort = 'created_at',
            order = 'DESC',
            status = 'active'
        } = req.query;

        const offset = (page - 1) * limit;
        let whereConditions = ['ml.status = $1'];
        let queryParams = [status];
        let paramIndex = 2;

        // Build dynamic WHERE clause
        if (condition) {
            whereConditions.push(`ml.condition = $${paramIndex}`);
            queryParams.push(condition);
            paramIndex++;
        }

        if (min_price) {
            whereConditions.push(`ml.price >= $${paramIndex}`);
            queryParams.push(parseFloat(min_price));
            paramIndex++;
        }

        if (max_price) {
            whereConditions.push(`ml.price <= $${paramIndex}`);
            queryParams.push(parseFloat(max_price));
            paramIndex++;
        }

        if (search) {
            whereConditions.push(`(c.title ILIKE $${paramIndex} OR c.description ILIKE $${paramIndex})`);
            queryParams.push(`%${search}%`);
            paramIndex++;
        }

        const whereClause = whereConditions.join(' AND ');

        const query = `
            SELECT 
                ml.id,
                ml.price,
                ml.condition,
                ml.grade,
                ml.description as listing_description,
                ml.images,
                ml.status,
                ml.created_at,
                ml.updated_at,
                c.id as comic_id,
                c.title,
                c.issue_number,
                c.variant_name,
                c.cover_image_url,
                c.publication_date,
                p.name as publisher_name,
                s.title as series_title,
                u.username as seller_username,
                u.id as seller_id,
                -- Calculate average price for comparison
                (SELECT AVG(price) FROM price_history ph 
                 WHERE ph.comic_id = c.id AND ph.condition = ml.condition) as avg_market_price,
                -- Seller rating
                (SELECT AVG(rating::float) FROM transactions t 
                 WHERE t.seller_id = ml.seller_id AND t.status = 'completed') as seller_rating,
                (SELECT COUNT(*) FROM transactions t 
                 WHERE t.seller_id = ml.seller_id AND t.status = 'completed') as seller_sales_count
            FROM marketplace_listings ml
            JOIN comics c ON ml.comic_id = c.id
            LEFT JOIN publishers p ON c.publisher_id = p.id
            LEFT JOIN series s ON c.series_id = s.id
            LEFT JOIN users u ON ml.seller_id = u.id
            WHERE ${whereClause}
            ORDER BY ml.${sort} ${order}
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;

        queryParams.push(limit, offset);

        const result = await db.query(query, queryParams);

        // Get total count for pagination
        const countQuery = `
            SELECT COUNT(*) as total
            FROM marketplace_listings ml
            JOIN comics c ON ml.comic_id = c.id
            WHERE ${whereClause}
        `;
        const countParams = queryParams.slice(0, -2); // Remove limit and offset
        const countResult = await db.query(countQuery, countParams);
        const total = parseInt(countResult.rows[0].total);

        res.json({
            listings: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching marketplace listings:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get a specific listing by ID
router.get('/listings/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const query = `
            SELECT 
                ml.*,
                c.id as comic_id,
                c.title,
                c.issue_number,
                c.variant_name,
                c.cover_image_url,
                c.publication_date,
                c.description as comic_description,
                c.key_issue_notes,
                p.name as publisher_name,
                s.title as series_title,
                s.genre,
                u.username as seller_username,
                u.id as seller_id,
                u.created_at as seller_since,
                -- Seller statistics
                (SELECT AVG(rating::float) FROM transactions t 
                 WHERE t.seller_id = ml.seller_id AND t.status = 'completed') as seller_rating,
                (SELECT COUNT(*) FROM transactions t 
                 WHERE t.seller_id = ml.seller_id AND t.status = 'completed') as seller_sales_count,
                -- Price comparison
                (SELECT AVG(price) FROM price_history ph 
                 WHERE ph.comic_id = c.id AND ph.condition = ml.condition) as avg_market_price,
                                 (SELECT price FROM price_history ph 
                  WHERE ph.comic_id = c.id AND ph.condition = ml.condition 
                  ORDER BY ph.sale_date DESC LIMIT 1) as last_sale_price
            FROM marketplace_listings ml
            JOIN comics c ON ml.comic_id = c.id
            LEFT JOIN publishers p ON c.publisher_id = p.id
            LEFT JOIN series s ON c.series_id = s.id
            LEFT JOIN users u ON ml.seller_id = u.id
            WHERE ml.id = $1
        `;

        const result = await db.query(query, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Listing not found' });
        }

        const listing = result.rows[0];

        // Get recent sales for this comic in similar condition
        const recentSalesQuery = `
            SELECT price, sale_date, source, condition
            FROM price_history
            WHERE comic_id = $1 AND condition = $2
            ORDER BY sale_date DESC
            LIMIT 5
        `;

        const salesResult = await db.query(recentSalesQuery, [listing.comic_id, listing.condition]);
        listing.recent_sales = salesResult.rows;

        res.json(listing);
    } catch (error) {
        console.error('Error fetching listing details:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create a new marketplace listing (requires authentication)
router.post('/listings', async (req, res) => {
    try {
        const {
            comic_id,
            price,
            condition,
            grade,
            description,
            images
        } = req.body;

        // Validate required fields
        if (!comic_id || !price || !condition) {
            return res.status(400).json({ 
                error: 'Missing required fields: comic_id, price, condition' 
            });
        }

        // For now, use a default user ID (in real app, get from JWT token)
        const seller_id = 1;

        // Check if user already has an active listing for this comic
        const existingListingQuery = `
            SELECT id FROM marketplace_listings 
            WHERE seller_id = $1 AND comic_id = $2 AND status = 'active'
        `;
        const existingResult = await db.query(existingListingQuery, [seller_id, comic_id]);

        if (existingResult.rows.length > 0) {
            return res.status(400).json({ 
                error: 'You already have an active listing for this comic' 
            });
        }

        const insertQuery = `
            INSERT INTO marketplace_listings 
            (seller_id, comic_id, price, condition, grade, description, images, status, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, 'active', NOW(), NOW())
            RETURNING *
        `;

        const result = await db.query(insertQuery, [
            seller_id,
            comic_id,
            price,
            condition,
            grade || null,
            description || null,
            images ? JSON.stringify(images) : null
        ]);

        res.status(201).json({
            message: 'Listing created successfully',
            listing: result.rows[0]
        });
    } catch (error) {
        console.error('Error creating marketplace listing:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update a marketplace listing (requires authentication and ownership)
router.put('/listings/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { price, condition, grade, description, images, status } = req.body;
        
        // For now, use a default user ID (in real app, get from JWT token)
        const seller_id = 1;

        // Verify ownership
        const ownershipQuery = `
            SELECT seller_id FROM marketplace_listings WHERE id = $1
        `;
        const ownershipResult = await db.query(ownershipQuery, [id]);

        if (ownershipResult.rows.length === 0) {
            return res.status(404).json({ error: 'Listing not found' });
        }

        if (ownershipResult.rows[0].seller_id !== seller_id) {
            return res.status(403).json({ error: 'Unauthorized to modify this listing' });
        }

        const updateQuery = `
            UPDATE marketplace_listings 
            SET price = COALESCE($1, price),
                condition = COALESCE($2, condition),
                grade = COALESCE($3, grade),
                description = COALESCE($4, description),
                images = COALESCE($5, images),
                status = COALESCE($6, status),
                updated_at = NOW()
            WHERE id = $7
            RETURNING *
        `;

        const result = await db.query(updateQuery, [
            price,
            condition,
            grade,
            description,
            images ? JSON.stringify(images) : null,
            status,
            id
        ]);

        res.json({
            message: 'Listing updated successfully',
            listing: result.rows[0]
        });
    } catch (error) {
        console.error('Error updating marketplace listing:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete/deactivate a marketplace listing
router.delete('/listings/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // For now, use a default user ID (in real app, get from JWT token)
        const seller_id = 1;

        // Verify ownership
        const ownershipQuery = `
            SELECT seller_id FROM marketplace_listings WHERE id = $1
        `;
        const ownershipResult = await db.query(ownershipQuery, [id]);

        if (ownershipResult.rows.length === 0) {
            return res.status(404).json({ error: 'Listing not found' });
        }

        if (ownershipResult.rows[0].seller_id !== seller_id) {
            return res.status(403).json({ error: 'Unauthorized to delete this listing' });
        }

        // Soft delete by updating status
        const deleteQuery = `
            UPDATE marketplace_listings 
            SET status = 'deleted', updated_at = NOW()
            WHERE id = $1
            RETURNING *
        `;

        const result = await db.query(deleteQuery, [id]);

        res.json({
            message: 'Listing deleted successfully',
            listing: result.rows[0]
        });
    } catch (error) {
        console.error('Error deleting marketplace listing:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Purchase a comic (create transaction)
router.post('/purchase', async (req, res) => {
    try {
        const { listing_id, payment_method = 'credit_card' } = req.body;

        if (!listing_id) {
            return res.status(400).json({ error: 'Listing ID is required' });
        }

        // For now, use a default user ID (in real app, get from JWT token)
        const buyer_id = 2; // Different from seller

        // Get listing details
        const listingQuery = `
            SELECT ml.*, c.title, c.issue_number, u.username as seller_username
            FROM marketplace_listings ml
            JOIN comics c ON ml.comic_id = c.id
            JOIN users u ON ml.seller_id = u.id
            WHERE ml.id = $1 AND ml.status = 'active'
        `;

        const listingResult = await db.query(listingQuery, [listing_id]);

        if (listingResult.rows.length === 0) {
            return res.status(404).json({ error: 'Active listing not found' });
        }

        const listing = listingResult.rows[0];

        // Prevent self-purchase
        if (listing.seller_id === buyer_id) {
            return res.status(400).json({ error: 'Cannot purchase your own listing' });
        }

        // Calculate fees (platform takes 10%)
        const platform_fee = listing.price * 0.10;
        const seller_amount = listing.price - platform_fee;

        // Create transaction
        const transactionQuery = `
            INSERT INTO transactions 
            (listing_id, buyer_id, seller_id, comic_id, amount, platform_fee, seller_amount, 
             payment_method, status, escrow_status, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', 'holding', NOW(), NOW())
            RETURNING *
        `;

        const transactionResult = await db.query(transactionQuery, [
            listing_id,
            buyer_id,
            listing.seller_id,
            listing.comic_id,
            listing.price,
            platform_fee,
            seller_amount,
            payment_method
        ]);

        // Update listing status to sold
        await db.query(
            'UPDATE marketplace_listings SET status = $1, updated_at = NOW() WHERE id = $2',
            ['sold', listing_id]
        );

        const transaction = transactionResult.rows[0];

        res.status(201).json({
            message: 'Purchase initiated successfully',
            transaction: {
                ...transaction,
                comic_title: listing.title,
                comic_issue: listing.issue_number,
                seller_username: listing.seller_username
            },
            next_steps: [
                'Payment processing initiated',
                'Funds held in escrow',
                'Seller will be notified to ship the item',
                'Release funds after delivery confirmation'
            ]
        });
    } catch (error) {
        console.error('Error processing purchase:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get transaction details
router.get('/transactions/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const query = `
            SELECT 
                t.*,
                c.title as comic_title,
                c.issue_number,
                c.cover_image_url,
                buyer.username as buyer_username,
                seller.username as seller_username,
                ml.condition,
                ml.grade,
                ml.description as listing_description
            FROM transactions t
            JOIN comics c ON t.comic_id = c.id
            JOIN users buyer ON t.buyer_id = buyer.id
            JOIN users seller ON t.seller_id = seller.id
            LEFT JOIN marketplace_listings ml ON t.listing_id = ml.id
            WHERE t.id = $1
        `;

        const result = await db.query(query, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching transaction:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update transaction status (for escrow/shipping)
router.put('/transactions/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, escrow_status, tracking_number, shipping_carrier } = req.body;

        if (!status && !escrow_status) {
            return res.status(400).json({ error: 'Status or escrow_status is required' });
        }

        let updateFields = [];
        let queryParams = [];
        let paramIndex = 1;

        if (status) {
            updateFields.push(`status = $${paramIndex}`);
            queryParams.push(status);
            paramIndex++;
        }

        if (escrow_status) {
            updateFields.push(`escrow_status = $${paramIndex}`);
            queryParams.push(escrow_status);
            paramIndex++;
        }

        if (tracking_number) {
            updateFields.push(`tracking_number = $${paramIndex}`);
            queryParams.push(tracking_number);
            paramIndex++;
        }

        if (shipping_carrier) {
            updateFields.push(`shipping_carrier = $${paramIndex}`);
            queryParams.push(shipping_carrier);
            paramIndex++;
        }

        updateFields.push('updated_at = NOW()');
        queryParams.push(id);

        const updateQuery = `
            UPDATE transactions 
            SET ${updateFields.join(', ')}
            WHERE id = $${paramIndex}
            RETURNING *
        `;

        const result = await db.query(updateQuery, queryParams);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        res.json({
            message: 'Transaction updated successfully',
            transaction: result.rows[0]
        });
    } catch (error) {
        console.error('Error updating transaction:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get marketplace statistics
router.get('/stats', async (req, res) => {
    try {
        const stats = {};

        // Active listings count
        const activeListingsQuery = `
            SELECT COUNT(*) as count FROM marketplace_listings WHERE status = 'active'
        `;
        const activeListingsResult = await db.query(activeListingsQuery);
        stats.active_listings = parseInt(activeListingsResult.rows[0].count);

        // Total transactions
        const transactionsQuery = `
            SELECT COUNT(*) as count, SUM(amount) as total_volume 
            FROM transactions WHERE status = 'completed'
        `;
        const transactionsResult = await db.query(transactionsQuery);
        stats.completed_transactions = parseInt(transactionsResult.rows[0].count);
        stats.total_volume = parseFloat(transactionsResult.rows[0].total_volume) || 0;

        // Average listing price
        const avgPriceQuery = `
            SELECT AVG(price) as avg_price FROM marketplace_listings WHERE status = 'active'
        `;
        const avgPriceResult = await db.query(avgPriceQuery);
        stats.average_listing_price = parseFloat(avgPriceResult.rows[0].avg_price) || 0;

        // Most popular conditions
        const conditionsQuery = `
            SELECT condition, COUNT(*) as count 
            FROM marketplace_listings 
            WHERE status = 'active' 
            GROUP BY condition 
            ORDER BY count DESC
        `;
        const conditionsResult = await db.query(conditionsQuery);
        stats.popular_conditions = conditionsResult.rows;

        // Recent sales
        const recentSalesQuery = `
            SELECT 
                t.amount,
                t.created_at,
                c.title,
                c.issue_number,
                ml.condition
            FROM transactions t
            JOIN comics c ON t.comic_id = c.id
            LEFT JOIN marketplace_listings ml ON t.listing_id = ml.id
            WHERE t.status = 'completed'
            ORDER BY t.created_at DESC
            LIMIT 10
        `;
        const recentSalesResult = await db.query(recentSalesQuery);
        stats.recent_sales = recentSalesResult.rows;

        res.json(stats);
    } catch (error) {
        console.error('Error fetching marketplace stats:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router; 