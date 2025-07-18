const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all comics with filtering and pagination
router.get('/', async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            search,
            publisher,
            series,
            year_from,
            year_to,
            format,
            sort = 'publication_date',
            order = 'DESC'
        } = req.query;

        const offset = (page - 1) * limit;
        let whereConditions = [];
        let queryParams = [];
        let paramIndex = 1;

        // Build dynamic WHERE clause
        if (search) {
            whereConditions.push(`(c.title ILIKE $${paramIndex} OR c.description ILIKE $${paramIndex})`);
            queryParams.push(`%${search}%`);
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

        if (year_from) {
            whereConditions.push(`EXTRACT(YEAR FROM c.publication_date) >= $${paramIndex}`);
            queryParams.push(year_from);
            paramIndex++;
        }

        if (year_to) {
            whereConditions.push(`EXTRACT(YEAR FROM c.publication_date) <= $${paramIndex}`);
            queryParams.push(year_to);
            paramIndex++;
        }

        if (format) {
            whereConditions.push(`c.format = $${paramIndex}`);
            queryParams.push(format);
            paramIndex++;
        }

        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

        const query = `
            SELECT 
                c.id,
                c.title,
                c.issue_number,
                c.variant_name,
                c.publication_date,
                c.cover_date,
                c.description,
                c.cover_image_url,
                c.key_issue_notes,
                c.format,
                c.characters,
                c.creators,
                p.name as publisher_name,
                s.title as series_title,
                s.genre,
                -- Get latest price data
                (SELECT price FROM price_history ph 
                 WHERE ph.comic_id = c.id AND ph.condition = 'NM' 
                 ORDER BY ph.sale_date DESC LIMIT 1) as latest_nm_price,
                (SELECT price FROM price_history ph 
                 WHERE ph.comic_id = c.id AND ph.condition = 'VF' 
                 ORDER BY ph.sale_date DESC LIMIT 1) as latest_vf_price
            FROM comics c
            LEFT JOIN publishers p ON c.publisher_id = p.id
            LEFT JOIN series s ON c.series_id = s.id
            ${whereClause}
            ORDER BY c.${sort} ${order}
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;

        queryParams.push(limit, offset);

        const result = await db.query(query, queryParams);

        // Get total count for pagination
        const countQuery = `
            SELECT COUNT(*) as total
            FROM comics c
            LEFT JOIN publishers p ON c.publisher_id = p.id
            LEFT JOIN series s ON c.series_id = s.id
            ${whereClause}
        `;
        const countParams = queryParams.slice(0, -2); // Remove limit and offset
        const countResult = await db.query(countQuery, countParams);
        const total = parseInt(countResult.rows[0].total);

        res.json({
            comics: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching comics:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get comic by ID with full details
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const comicQuery = `
            SELECT 
                c.*,
                p.name as publisher_name,
                p.founded_year as publisher_founded_year,
                p.website_url as publisher_website,
                s.title as series_title,
                s.genre,
                s.start_year,
                s.end_year,
                s.status as series_status
            FROM comics c
            LEFT JOIN publishers p ON c.publisher_id = p.id
            LEFT JOIN series s ON c.series_id = s.id
            WHERE c.id = $1
        `;

        const priceHistoryQuery = `
            SELECT condition, price, source, sale_date, grade, graded_by
            FROM price_history
            WHERE comic_id = $1
            ORDER BY sale_date DESC
        `;

        const [comicResult, priceResult] = await Promise.all([
            db.query(comicQuery, [id]),
            db.query(priceHistoryQuery, [id])
        ]);

        if (comicResult.rows.length === 0) {
            return res.status(404).json({ error: 'Comic not found' });
        }

        const comic = comicResult.rows[0];
        comic.price_history = priceResult.rows;

        // Calculate price statistics
        const nmPrices = priceResult.rows.filter(p => p.condition === 'NM').map(p => p.price);
        const vfPrices = priceResult.rows.filter(p => p.condition === 'VF').map(p => p.price);

        comic.price_stats = {
            nm: nmPrices.length > 0 ? {
                current: Math.max(...nmPrices),
                average: nmPrices.reduce((a, b) => a + b, 0) / nmPrices.length,
                min: Math.min(...nmPrices),
                max: Math.max(...nmPrices)
            } : null,
            vf: vfPrices.length > 0 ? {
                current: Math.max(...vfPrices),
                average: vfPrices.reduce((a, b) => a + b, 0) / vfPrices.length,
                min: Math.min(...vfPrices),
                max: Math.max(...vfPrices)
            } : null
        };

        res.json(comic);
    } catch (error) {
        console.error('Error fetching comic details:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Search comics by character or creator
router.get('/search/advanced', async (req, res) => {
    try {
        const { character, creator, story_arc } = req.query;

        let whereConditions = [];
        let queryParams = [];
        let paramIndex = 1;

        if (character) {
            whereConditions.push(`c.characters @> $${paramIndex}`);
            queryParams.push(JSON.stringify([character]));
            paramIndex++;
        }

        if (creator) {
            whereConditions.push(`c.creators @> $${paramIndex}`);
            queryParams.push(JSON.stringify([{ name: creator }]));
            paramIndex++;
        }

        if (story_arc) {
            whereConditions.push(`c.story_arcs @> $${paramIndex}`);
            queryParams.push(JSON.stringify([story_arc]));
            paramIndex++;
        }

        if (whereConditions.length === 0) {
            return res.status(400).json({ error: 'At least one search parameter is required' });
        }

        const query = `
            SELECT 
                c.id,
                c.title,
                c.issue_number,
                c.publication_date,
                c.cover_image_url,
                c.key_issue_notes,
                c.characters,
                c.creators,
                p.name as publisher_name,
                s.title as series_title
            FROM comics c
            LEFT JOIN publishers p ON c.publisher_id = p.id
            LEFT JOIN series s ON c.series_id = s.id
            WHERE ${whereConditions.join(' AND ')}
            ORDER BY c.publication_date DESC
        `;

        const result = await db.query(query, queryParams);
        res.json({ comics: result.rows });
    } catch (error) {
        console.error('Error in advanced search:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Enhanced full-text search with ranking
router.get('/search/fulltext', async (req, res) => {
    try {
        const { query: searchQuery, limit = 20 } = req.query;
        
        if (!searchQuery) {
            return res.status(400).json({ error: 'Search query is required' });
        }

        const query = `
            SELECT 
                c.id,
                c.title,
                c.issue_number,
                c.variant_name,
                c.publication_date,
                c.cover_image_url,
                c.key_issue_notes,
                c.description,
                c.characters,
                c.creators,
                p.name as publisher_name,
                s.title as series_title,
                s.genre,
                -- Full-text search ranking
                ts_rank(
                    to_tsvector('english', COALESCE(c.title, '') || ' ' || 
                                         COALESCE(c.description, '') || ' ' ||
                                         COALESCE(c.key_issue_notes, '') || ' ' ||
                                         COALESCE(p.name, '') || ' ' ||
                                         COALESCE(s.title, '') || ' ' ||
                                         COALESCE(array_to_string(c.characters, ' '), '')),
                    plainto_tsquery('english', $1)
                ) as search_rank,
                -- Latest prices
                (SELECT price FROM price_history ph 
                 WHERE ph.comic_id = c.id AND ph.condition = 'NM' 
                 ORDER BY ph.sale_date DESC LIMIT 1) as latest_nm_price
            FROM comics c
            LEFT JOIN publishers p ON c.publisher_id = p.id
            LEFT JOIN series s ON c.series_id = s.id
            WHERE to_tsvector('english', COALESCE(c.title, '') || ' ' || 
                                       COALESCE(c.description, '') || ' ' ||
                                       COALESCE(c.key_issue_notes, '') || ' ' ||
                                       COALESCE(p.name, '') || ' ' ||
                                       COALESCE(s.title, '') || ' ' ||
                                       COALESCE(array_to_string(c.characters, ' '), ''))
                  @@ plainto_tsquery('english', $1)
            ORDER BY search_rank DESC, c.publication_date DESC
            LIMIT $2
        `;

        const result = await db.query(query, [searchQuery, limit]);
        res.json({ 
            comics: result.rows,
            query: searchQuery,
            total_results: result.rows.length 
        });
    } catch (error) {
        console.error('Error in full-text search:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Search suggestions/autocomplete
router.get('/search/suggestions', async (req, res) => {
    try {
        const { q, type = 'all' } = req.query;
        
        if (!q || q.length < 2) {
            return res.json({ suggestions: [] });
        }

        const suggestions = [];

        // Comic titles
        if (type === 'all' || type === 'titles') {
            const titleQuery = `
                SELECT DISTINCT c.title, 'comic' as type, COUNT(*) as relevance
                FROM comics c
                WHERE c.title ILIKE $1
                GROUP BY c.title
                ORDER BY relevance DESC, c.title
                LIMIT 5
            `;
            const titleResult = await db.query(titleQuery, [`%${q}%`]);
            suggestions.push(...titleResult.rows);
        }

        // Series
        if (type === 'all' || type === 'series') {
            const seriesQuery = `
                SELECT DISTINCT s.title as title, 'series' as type, COUNT(*) as relevance
                FROM series s
                WHERE s.title ILIKE $1
                GROUP BY s.title
                ORDER BY relevance DESC, s.title
                LIMIT 5
            `;
            const seriesResult = await db.query(seriesQuery, [`%${q}%`]);
            suggestions.push(...seriesResult.rows);
        }

        // Publishers
        if (type === 'all' || type === 'publishers') {
            const publisherQuery = `
                SELECT DISTINCT p.name as title, 'publisher' as type, COUNT(*) as relevance
                FROM publishers p
                WHERE p.name ILIKE $1
                GROUP BY p.name
                ORDER BY relevance DESC, p.name
                LIMIT 3
            `;
            const publisherResult = await db.query(publisherQuery, [`%${q}%`]);
            suggestions.push(...publisherResult.rows);
        }

        // Characters - temporarily disabled due to schema conflicts
        // TODO: Re-enable after fixing characters column schema
        if (false && (type === 'all' || type === 'characters')) {
            const characterQuery = `
                SELECT DISTINCT character as title, 'character' as type, COUNT(*) as relevance
                FROM (
                    SELECT unnest(characters) as character
                    FROM comics
                    WHERE array_to_string(characters, ',') ILIKE $1
                ) char_list
                WHERE character ILIKE $1
                GROUP BY character
                ORDER BY relevance DESC, character
                LIMIT 5
            `;
            const characterResult = await db.query(characterQuery, [`%${q}%`]);
            suggestions.push(...characterResult.rows);
        }

        res.json({ 
            suggestions: suggestions.slice(0, 15),
            query: q 
        });
    } catch (error) {
        console.error('Error fetching search suggestions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get comics by price range and investment potential
router.get('/search/investment', async (req, res) => {
    try {
        const { 
            min_price, 
            max_price, 
            price_trend = 'any', // 'rising', 'falling', 'stable', 'any'
            limit = 20 
        } = req.query;

        let priceConditions = [];
        let queryParams = [];
        let paramIndex = 1;

        if (min_price) {
            priceConditions.push(`latest_price >= $${paramIndex}`);
            queryParams.push(parseFloat(min_price));
            paramIndex++;
        }

        if (max_price) {
            priceConditions.push(`latest_price <= $${paramIndex}`);
            queryParams.push(parseFloat(max_price));
            paramIndex++;
        }

        const priceFilter = priceConditions.length > 0 ? `HAVING ${priceConditions.join(' AND ')}` : '';

        let trendCondition = '';
        if (price_trend === 'rising') {
            trendCondition = 'AND price_trend > 0';
        } else if (price_trend === 'falling') {
            trendCondition = 'AND price_trend < 0';
        } else if (price_trend === 'stable') {
            trendCondition = 'AND ABS(price_trend) < 5';
        }

        const query = `
            WITH price_analysis AS (
                SELECT 
                    c.id,
                    c.title,
                    c.issue_number,
                    c.cover_image_url,
                    c.key_issue_notes,
                    p.name as publisher_name,
                    s.title as series_title,
                    -- Latest price
                    (SELECT price FROM price_history ph 
                     WHERE ph.comic_id = c.id AND ph.condition = 'NM' 
                     ORDER BY ph.sale_date DESC LIMIT 1) as latest_price,
                    -- Price 6 months ago
                    (SELECT price FROM price_history ph 
                     WHERE ph.comic_id = c.id AND ph.condition = 'NM' 
                     AND ph.sale_date <= CURRENT_DATE - INTERVAL '6 months'
                     ORDER BY ph.sale_date DESC LIMIT 1) as price_6m_ago,
                    -- Sale frequency
                    (SELECT COUNT(*) FROM price_history ph 
                     WHERE ph.comic_id = c.id 
                     AND ph.sale_date >= CURRENT_DATE - INTERVAL '12 months') as sales_last_year
                FROM comics c
                LEFT JOIN publishers p ON c.publisher_id = p.id
                LEFT JOIN series s ON c.series_id = s.id
                WHERE EXISTS (
                    SELECT 1 FROM price_history ph 
                    WHERE ph.comic_id = c.id AND ph.condition = 'NM'
                )
            )
            SELECT *,
                   CASE 
                       WHEN price_6m_ago > 0 AND latest_price > 0 THEN
                           ROUND(((latest_price - price_6m_ago) / price_6m_ago * 100)::numeric, 2)
                       ELSE 0
                   END as price_trend
            FROM price_analysis
            WHERE latest_price IS NOT NULL
            ${priceFilter}
            ${trendCondition}
            ORDER BY 
                CASE WHEN price_trend = 'rising' THEN price_trend END DESC NULLS LAST,
                sales_last_year DESC,
                latest_price DESC
            LIMIT $${paramIndex}
        `;

        queryParams.push(limit);
        const result = await db.query(query, queryParams);
        
        res.json({ 
            comics: result.rows,
            filters: { min_price, max_price, price_trend },
            total_results: result.rows.length 
        });
    } catch (error) {
        console.error('Error in investment search:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get trending/popular comics
router.get('/trending', async (req, res) => {
    try {
        const query = `
            SELECT 
                c.id,
                c.title,
                c.issue_number,
                c.cover_image_url,
                c.key_issue_notes,
                p.name as publisher_name,
                s.title as series_title,
                COUNT(ph.id) as sale_count,
                AVG(ph.price) as avg_price,
                MAX(ph.sale_date) as last_sale
            FROM comics c
            LEFT JOIN publishers p ON c.publisher_id = p.id
            LEFT JOIN series s ON c.series_id = s.id
            LEFT JOIN price_history ph ON c.id = ph.comic_id
            WHERE ph.sale_date >= CURRENT_DATE - INTERVAL '30 days'
            GROUP BY c.id, p.name, s.title
            HAVING COUNT(ph.id) > 0
            ORDER BY sale_count DESC, avg_price DESC
            LIMIT 10
        `;

        const result = await db.query(query);
        res.json({ trending_comics: result.rows });
    } catch (error) {
        console.error('Error fetching trending comics:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router; 