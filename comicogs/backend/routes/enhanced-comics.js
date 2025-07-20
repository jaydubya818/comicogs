const express = require('express');
const { Pool } = require('pg');
const router = express.Router();

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'comicogs',
  user: process.env.DB_USER || 'jaywest',
  password: process.env.DB_PASSWORD || ''
});

// ==========================================
// ENHANCED COMIC ROUTES - DISCOGS INSPIRED
// ==========================================

// GET /api/v2/comics - Enhanced comic listing with full relationships
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      publisher = '',
      series = '',
      creator = '',
      character = '',
      genre = '',
      year_start = '',
      year_end = '',
      format = '',
      condition = '',
      sort = 'title',
      order = 'asc'
    } = req.query;

    const offset = (page - 1) * limit;
    
    // Build the main query with all relationships
    let query = `
      SELECT DISTINCT
        c.id,
        c.title,
        c.issue_number,
        c.volume,
        c.publication_date,
        c.cover_date,
        c.page_count,
        c.description,
        c.isbn,
        c.upc,
        c.diamond_code,
        c.cover_price,
        
        -- Publisher info
        p.id as publisher_id,
        p.name as publisher_name,
        p.type as publisher_type,
        
        -- Series info
        s.id as series_id,
        s.title as series_title,
        s.genre as series_genre,
        s.status as series_status,
        
        -- Aggregated data
        COUNT(DISTINCT cv.id) as variant_count,
        COUNT(DISTINCT ccr.creator_id) as creator_count,
        COUNT(DISTINCT cc.id) as character_count,
        
        -- Latest pricing info
        (SELECT price FROM price_history ph 
         WHERE ph.comic_id = c.id AND ph.condition = 'NM' 
         ORDER BY ph.sale_date DESC LIMIT 1) as latest_nm_price,
        (SELECT price FROM price_history ph 
         WHERE ph.comic_id = c.id AND ph.condition = 'VF' 
         ORDER BY ph.sale_date DESC LIMIT 1) as latest_vf_price,
         
        -- Primary variant cover image
        (SELECT cover_image_url FROM comic_variants cv2 
         WHERE cv2.comic_id = c.id AND cv2.is_primary = true 
         LIMIT 1) as cover_image_url
         
      FROM comics c
      LEFT JOIN publishers p ON c.publisher_id = p.id
      LEFT JOIN series s ON c.series_id = s.id
      LEFT JOIN comic_variants cv ON c.id = cv.comic_id
      LEFT JOIN comic_creator_roles ccr ON c.id = ccr.comic_id
      LEFT JOIN creators cr ON ccr.creator_id = cr.id
      LEFT JOIN comic_characters cc ON c.id = cc.comic_id
      LEFT JOIN comic_genres cg ON c.id = cg.comic_id
    `;
    
    // Build WHERE conditions
    const conditions = [];
    const params = [];
    let paramCount = 0;
    
    if (search) {
      paramCount++;
      conditions.push(`(
        c.title ILIKE $${paramCount} OR 
        c.description ILIKE $${paramCount} OR
        s.title ILIKE $${paramCount} OR
        p.name ILIKE $${paramCount} OR
        cr.name ILIKE $${paramCount}
      )`);
      params.push(`%${search}%`);
    }
    
    if (publisher) {
      paramCount++;
      conditions.push(`p.name ILIKE $${paramCount}`);
      params.push(`%${publisher}%`);
    }
    
    if (series) {
      paramCount++;
      conditions.push(`s.title ILIKE $${paramCount}`);
      params.push(`%${series}%`);
    }
    
    if (creator) {
      paramCount++;
      conditions.push(`cr.name ILIKE $${paramCount}`);
      params.push(`%${creator}%`);
    }
    
    if (character) {
      paramCount++;
      conditions.push(`cc.character_name ILIKE $${paramCount}`);
      params.push(`%${character}%`);
    }
    
    if (genre) {
      paramCount++;
      conditions.push(`cg.genre ILIKE $${paramCount}`);
      params.push(`%${genre}%`);
    }
    
    if (year_start) {
      paramCount++;
      conditions.push(`EXTRACT(YEAR FROM c.publication_date) >= $${paramCount}`);
      params.push(parseInt(year_start));
    }
    
    if (year_end) {
      paramCount++;
      conditions.push(`EXTRACT(YEAR FROM c.publication_date) <= $${paramCount}`);
      params.push(parseInt(year_end));
    }
    
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    // Add GROUP BY for aggregations
    query += `
      GROUP BY c.id, p.id, p.name, p.type, s.id, s.title, s.genre, s.status
    `;
    
    // Add sorting
    const validSorts = ['title', 'issue_number', 'publication_date', 'cover_date', 'publisher_name', 'series_title'];
    const validOrders = ['asc', 'desc'];
    
    const sortField = validSorts.includes(sort) ? sort : 'title';
    const sortOrder = validOrders.includes(order) ? order : 'asc';
    
    if (sortField === 'publisher_name') {
      query += ` ORDER BY p.name ${sortOrder}`;
    } else if (sortField === 'series_title') {
      query += ` ORDER BY s.title ${sortOrder}`;
    } else {
      query += ` ORDER BY c.${sortField} ${sortOrder}`;
    }
    
    // Add pagination
    paramCount++;
    paramCount++;
    query += ` LIMIT $${paramCount-1} OFFSET $${paramCount}`;
    params.push(parseInt(limit), offset);
    
    // Execute main query
    const result = await pool.query(query, params);
    
    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(DISTINCT c.id) as total
      FROM comics c
      LEFT JOIN publishers p ON c.publisher_id = p.id
      LEFT JOIN series s ON c.series_id = s.id
      LEFT JOIN comic_creator_roles ccr ON c.id = ccr.comic_id
      LEFT JOIN creators cr ON ccr.creator_id = cr.id
      LEFT JOIN comic_characters cc ON c.id = cc.comic_id
      LEFT JOIN comic_genres cg ON c.id = cg.comic_id
    `;
    
    if (conditions.length > 0) {
      countQuery += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    const countParams = params.slice(0, -2); // Remove limit and offset params
    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);
    
    // Format response
    const comics = result.rows.map(row => ({
      id: row.id,
      title: row.title,
      issue_number: row.issue_number,
      volume: row.volume,
      publication_date: row.publication_date,
      cover_date: row.cover_date,
      page_count: row.page_count,
      description: row.description,
      isbn: row.isbn,
      upc: row.upc,
      diamond_code: row.diamond_code,
      cover_price: parseFloat(row.cover_price) || null,
      cover_image_url: row.cover_image_url || '/placeholder-comic.jpg',
      publisher: {
        id: row.publisher_id,
        name: row.publisher_name,
        type: row.publisher_type
      },
      series: row.series_id ? {
        id: row.series_id,
        title: row.series_title,
        genre: row.series_genre,
        status: row.series_status
      } : null,
      stats: {
        variant_count: parseInt(row.variant_count) || 0,
        creator_count: parseInt(row.creator_count) || 0,
        character_count: parseInt(row.character_count) || 0
      },
      pricing: {
        latest_nm_price: row.latest_nm_price ? parseFloat(row.latest_nm_price) : null,
        latest_vf_price: row.latest_vf_price ? parseFloat(row.latest_vf_price) : null
      }
    }));
    
    res.json({
      comics,
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

// GET /api/v2/comics/creators - List creators
router.get('/creators', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search = '',
      sort = 'name',
      order = 'asc'
    } = req.query;
    
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT 
        cr.*,
        COUNT(DISTINCT ccr.comic_id) as comic_count
      FROM creators cr
      LEFT JOIN comic_creator_roles ccr ON cr.id = ccr.creator_id
    `;
    
    const params = [];
    let paramCount = 0;
    
    if (search) {
      paramCount++;
      query += ` WHERE (cr.name ILIKE $${paramCount} OR cr.legal_name ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }
    
    query += ` GROUP BY cr.id`;
    
    // Add sorting
    const validSorts = ['name', 'sort_name', 'birth_date', 'comic_count'];
    const validOrders = ['asc', 'desc'];
    
    const sortField = validSorts.includes(sort) ? sort : 'name';
    const sortOrder = validOrders.includes(order) ? order : 'asc';
    
    if (sortField === 'comic_count') {
      query += ` ORDER BY comic_count ${sortOrder}`;
    } else {
      query += ` ORDER BY cr.${sortField} ${sortOrder}`;
    }
    
    // Add pagination
    paramCount++;
    paramCount++;
    query += ` LIMIT $${paramCount-1} OFFSET $${paramCount}`;
    params.push(parseInt(limit), offset);
    
    const result = await pool.query(query, params);
    
    // Get total count
    let countQuery = `SELECT COUNT(*) as total FROM creators cr`;
    const countParams = [];
    
    if (search) {
      countQuery += ` WHERE (cr.name ILIKE $1 OR cr.legal_name ILIKE $1)`;
      countParams.push(`%${search}%`);
    }
    
    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);
    
    const creators = result.rows.map(creator => ({
      id: creator.id,
      name: creator.name,
      sort_name: creator.sort_name,
      legal_name: creator.legal_name,
      birth_date: creator.birth_date,
      death_date: creator.death_date,
      biography: creator.biography,
      country: creator.country,
      gender: creator.gender,
      status: creator.status,
      profile_image_url: creator.profile_image_url,
      website_url: creator.website_url,
      comic_count: parseInt(creator.comic_count) || 0
    }));
    
    res.json({
      creators,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Error fetching creators:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/v2/comics/series - List series
router.get('/series', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search = '',
      publisher = '',
      status = '',
      genre = '',
      sort = 'title',
      order = 'asc'
    } = req.query;
    
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT 
        s.*,
        p.name as publisher_name,
        COUNT(DISTINCT c.id) as comic_count
      FROM series s
      LEFT JOIN publishers p ON s.publisher_id = p.id
      LEFT JOIN comics c ON s.id = c.series_id
    `;
    
    const conditions = [];
    const params = [];
    let paramCount = 0;
    
    if (search) {
      paramCount++;
      conditions.push(`s.title ILIKE $${paramCount}`);
      params.push(`%${search}%`);
    }
    
    if (publisher) {
      paramCount++;
      conditions.push(`p.name ILIKE $${paramCount}`);
      params.push(`%${publisher}%`);
    }
    
    if (status) {
      paramCount++;
      conditions.push(`s.status = $${paramCount}`);
      params.push(status);
    }
    
    if (genre) {
      paramCount++;
      conditions.push(`s.genre ILIKE $${paramCount}`);
      params.push(`%${genre}%`);
    }
    
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    query += ` GROUP BY s.id, p.name`;
    
    // Add sorting
    const validSorts = ['title', 'start_year', 'status', 'genre', 'comic_count'];
    const validOrders = ['asc', 'desc'];
    
    const sortField = validSorts.includes(sort) ? sort : 'title';
    const sortOrder = validOrders.includes(order) ? order : 'asc';
    
    if (sortField === 'comic_count') {
      query += ` ORDER BY comic_count ${sortOrder}`;
    } else {
      query += ` ORDER BY s.${sortField} ${sortOrder}`;
    }
    
    // Add pagination
    paramCount++;
    paramCount++;
    query += ` LIMIT $${paramCount-1} OFFSET $${paramCount}`;
    params.push(parseInt(limit), offset);
    
    const result = await pool.query(query, params);
    
    const series = result.rows.map(serie => ({
      id: serie.id,
      title: serie.title,
      sort_title: serie.sort_title,
      publisher_id: serie.publisher_id,
      publisher_name: serie.publisher_name,
      start_year: serie.start_year,
      end_year: serie.end_year,
      description: serie.description,
      genre: serie.genre,
      status: serie.status,
      issue_count: serie.issue_count,
      comic_count: parseInt(serie.comic_count) || 0,
      country: serie.country,
      language: serie.language,
      format: serie.format,
      age_rating: serie.age_rating
    }));
    
    res.json({ series });
    
  } catch (error) {
    console.error('Error fetching series:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/v2/comics/:id - Get detailed comic information
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Main comic query
    const comicQuery = `
      SELECT 
        c.*,
        p.name as publisher_name,
        p.type as publisher_type,
        p.founded_year as publisher_founded,
        s.title as series_title,
        s.genre as series_genre,
        s.status as series_status,
        s.start_year as series_start_year,
        s.end_year as series_end_year,
        s.issue_count as series_issue_count
      FROM comics c
      LEFT JOIN publishers p ON c.publisher_id = p.id
      LEFT JOIN series s ON c.series_id = s.id
      WHERE c.id = $1
    `;
    
    const comicResult = await pool.query(comicQuery, [id]);
    
    if (comicResult.rows.length === 0) {
      return res.status(404).json({ error: 'Comic not found' });
    }
    
    const comic = comicResult.rows[0];
    
    // Get creators with roles
    const creatorsQuery = `
      SELECT 
        cr.id,
        cr.name,
        cr.sort_name,
        cr.legal_name,
        cr.biography,
        cr.birth_date,
        cr.death_date,
        cr.country,
        cr.status,
        ccr.role,
        ccr.credited_as,
        ccr.role_details
      FROM comic_creator_roles ccr
      JOIN creators cr ON ccr.creator_id = cr.id
      WHERE ccr.comic_id = $1
      ORDER BY 
        CASE ccr.role 
          WHEN 'writer' THEN 1
          WHEN 'artist' THEN 2
          WHEN 'penciler' THEN 3
          WHEN 'inker' THEN 4
          WHEN 'colorist' THEN 5
          WHEN 'letterer' THEN 6
          WHEN 'cover' THEN 7
          WHEN 'editor' THEN 8
          ELSE 9
        END,
        cr.name
    `;
    
    const creatorsResult = await pool.query(creatorsQuery, [id]);
    
    // Get variants
    const variantsQuery = `
      SELECT *
      FROM comic_variants
      WHERE comic_id = $1
      ORDER BY is_primary DESC, variant_name
    `;
    
    const variantsResult = await pool.query(variantsQuery, [id]);
    
    // Get characters
    const charactersQuery = `
      SELECT *
      FROM comic_characters
      WHERE comic_id = $1
      ORDER BY 
        CASE character_type
          WHEN 'main' THEN 1
          WHEN 'supporting' THEN 2
          WHEN 'villain' THEN 3
          WHEN 'cameo' THEN 4
          ELSE 5
        END,
        character_name
    `;
    
    const charactersResult = await pool.query(charactersQuery, [id]);
    
    // Get story arcs
    const storyArcsQuery = `
      SELECT *
      FROM comic_story_arcs
      WHERE comic_id = $1
      ORDER BY part_number, story_arc_name
    `;
    
    const storyArcsResult = await pool.query(storyArcsQuery, [id]);
    
    // Get genres
    const genresQuery = `
      SELECT genre
      FROM comic_genres
      WHERE comic_id = $1
      ORDER BY genre
    `;
    
    const genresResult = await pool.query(genresQuery, [id]);
    
    // Get price history
    const priceHistoryQuery = `
      SELECT *
      FROM price_history
      WHERE comic_id = $1
      ORDER BY sale_date DESC
      LIMIT 20
    `;
    
    const priceHistoryResult = await pool.query(priceHistoryQuery, [id]);
    
    // Format detailed response
    const detailedComic = {
      id: comic.id,
      title: comic.title,
      issue_number: comic.issue_number,
      volume: comic.volume,
      publication_date: comic.publication_date,
      cover_date: comic.cover_date,
      on_sale_date: comic.on_sale_date,
      page_count: comic.page_count,
      description: comic.description,
      isbn: comic.isbn,
      upc: comic.upc,
      diamond_code: comic.diamond_code,
      cover_price: parseFloat(comic.cover_price) || null,
      reprint_of: comic.reprint_of,
      created_at: comic.created_at,
      updated_at: comic.updated_at,
      
      publisher: {
        id: comic.publisher_id,
        name: comic.publisher_name,
        type: comic.publisher_type,
        founded_year: comic.publisher_founded
      },
      
      series: comic.series_id ? {
        id: comic.series_id,
        title: comic.series_title,
        genre: comic.series_genre,
        status: comic.series_status,
        start_year: comic.series_start_year,
        end_year: comic.series_end_year,
        issue_count: comic.series_issue_count
      } : null,
      
      creators: creatorsResult.rows.map(creator => ({
        id: creator.id,
        name: creator.name,
        sort_name: creator.sort_name,
        legal_name: creator.legal_name,
        biography: creator.biography,
        birth_date: creator.birth_date,
        death_date: creator.death_date,
        country: creator.country,
        status: creator.status,
        role: creator.role,
        credited_as: creator.credited_as,
        role_details: creator.role_details
      })),
      
      variants: variantsResult.rows.map(variant => ({
        id: variant.id,
        variant_name: variant.variant_name,
        variant_type: variant.variant_type,
        cover_image_url: variant.cover_image_url,
        print_run: variant.print_run,
        rarity_ratio: variant.rarity_ratio,
        is_primary: variant.is_primary
      })),
      
      characters: charactersResult.rows.map(char => ({
        id: char.id,
        character_name: char.character_name,
        character_type: char.character_type,
        first_appearance: char.first_appearance,
        death: char.death
      })),
      
      story_arcs: storyArcsResult.rows.map(arc => ({
        id: arc.id,
        story_arc_name: arc.story_arc_name,
        part_number: arc.part_number
      })),
      
      genres: genresResult.rows.map(g => g.genre),
      
      price_history: priceHistoryResult.rows.map(price => ({
        id: price.id,
        condition: price.condition,
        grade: price.grade,
        price: parseFloat(price.price),
        sale_date: price.sale_date,
        sale_type: price.sale_type,
        source: price.source,
        marketplace: price.marketplace,
        seller_feedback_score: price.seller_feedback_score
      }))
    };
    
    res.json(detailedComic);
    
  } catch (error) {
    console.error('Error fetching comic details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});



module.exports = router; 