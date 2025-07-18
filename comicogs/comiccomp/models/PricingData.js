const db = require("../backend/db");

class PricingData {
  
  /**
   * Create the pricing data tables if they don't exist
   */
  static async createTables() {
    const createPricingDataTable = `
      CREATE TABLE IF NOT EXISTS pricing_data (
        id SERIAL PRIMARY KEY,
        comic_id INTEGER,
        marketplace VARCHAR(50) NOT NULL,
        listing_id VARCHAR(255),
        title VARCHAR(500) NOT NULL,
        issue_number VARCHAR(50),
        variant_type VARCHAR(100),
        condition VARCHAR(50),
        grade VARCHAR(20),
        grading_company VARCHAR(50),
        price DECIMAL(10,2) NOT NULL,
        sale_type VARCHAR(20) DEFAULT 'fixed', -- 'auction' or 'fixed'
        seller_info JSONB,
        listing_url TEXT,
        image_urls TEXT[],
        description TEXT,
        sale_date TIMESTAMP,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (comic_id) REFERENCES comics(id) ON DELETE SET NULL
      );
    `;

    const createPriceHistoryTable = `
      CREATE TABLE IF NOT EXISTS price_history (
        id SERIAL PRIMARY KEY,
        comic_id INTEGER NOT NULL,
        marketplace VARCHAR(50) NOT NULL,
        condition VARCHAR(50),
        grade VARCHAR(20),
        avg_price DECIMAL(10,2),
        min_price DECIMAL(10,2),
        max_price DECIMAL(10,2),
        median_price DECIMAL(10,2),
        sale_count INTEGER DEFAULT 0,
        date_period DATE NOT NULL, -- Daily aggregation
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (comic_id) REFERENCES comics(id) ON DELETE CASCADE,
        UNIQUE(comic_id, marketplace, condition, grade, date_period)
      );
    `;

    const createMarketplacesTable = `
      CREATE TABLE IF NOT EXISTS marketplaces (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) UNIQUE NOT NULL,
        base_url VARCHAR(255),
        is_active BOOLEAN DEFAULT true,
        last_scan_at TIMESTAMP WITH TIME ZONE,
        scan_frequency INTERVAL DEFAULT '1 day',
        rate_limit_per_second INTEGER DEFAULT 1,
        total_listings_collected INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    const createCollectionJobsTable = `
      CREATE TABLE IF NOT EXISTS collection_jobs (
        id SERIAL PRIMARY KEY,
        marketplace VARCHAR(50) NOT NULL,
        search_query VARCHAR(500),
        status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed'
        started_at TIMESTAMP WITH TIME ZONE,
        completed_at TIMESTAMP WITH TIME ZONE,
        total_found INTEGER DEFAULT 0,
        total_processed INTEGER DEFAULT 0,
        total_errors INTEGER DEFAULT 0,
        error_details JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Create indexes for performance
    const createIndexes = `
      CREATE INDEX IF NOT EXISTS idx_pricing_data_comic_marketplace ON pricing_data(comic_id, marketplace);
      CREATE INDEX IF NOT EXISTS idx_pricing_data_condition_grade ON pricing_data(condition, grade);
      CREATE INDEX IF NOT EXISTS idx_pricing_data_sale_date ON pricing_data(sale_date DESC);
      CREATE INDEX IF NOT EXISTS idx_pricing_data_created_at ON pricing_data(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_price_history_comic_date ON price_history(comic_id, date_period DESC);
      CREATE INDEX IF NOT EXISTS idx_collection_jobs_status ON collection_jobs(status, created_at);
    `;

    try {
      await db.query(createPricingDataTable);
      await db.query(createPriceHistoryTable);
      await db.query(createMarketplacesTable);
      await db.query(createCollectionJobsTable);
      await db.query(createIndexes);
      
      console.log('✅ ComicComp pricing tables created successfully');
      return true;
    } catch (error) {
      console.error('❌ Error creating ComicComp pricing tables:', error);
      throw error;
    }
  }

  /**
   * Insert pricing data from marketplace scraping
   */
  static async insertPricingData(data) {
    const query = `
      INSERT INTO pricing_data (
        comic_id, marketplace, listing_id, title, issue_number, variant_type,
        condition, grade, grading_company, price, sale_type, seller_info,
        listing_url, image_urls, description, sale_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      ON CONFLICT (marketplace, listing_id) 
      DO UPDATE SET
        price = EXCLUDED.price,
        condition = EXCLUDED.condition,
        updated_at = CURRENT_TIMESTAMP
      RETURNING id;
    `;

    const values = [
      data.comic_id,
      data.marketplace,
      data.listing_id,
      data.title,
      data.issue_number,
      data.variant_type,
      data.condition,
      data.grade,
      data.grading_company,
      data.price,
      data.sale_type || 'fixed',
      JSON.stringify(data.seller_info || {}),
      data.listing_url,
      data.image_urls || [],
      data.description,
      data.sale_date
    ];

    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error inserting pricing data:', error);
      throw error;
    }
  }

  /**
   * Get current pricing data for a comic
   */
  static async getCurrentPricing(comicId, options = {}) {
    const {
      marketplace = null,
      condition = null,
      grade = null,
      limit = 50,
      days = 30
    } = options;

    let whereClause = 'WHERE comic_id = $1 AND created_at >= NOW() - INTERVAL \'%s days\'';
    let params = [comicId];
    let paramIndex = 2;

    if (marketplace) {
      whereClause += ` AND marketplace = $${paramIndex}`;
      params.push(marketplace);
      paramIndex++;
    }

    if (condition) {
      whereClause += ` AND condition = $${paramIndex}`;
      params.push(condition);
      paramIndex++;
    }

    if (grade) {
      whereClause += ` AND grade = $${paramIndex}`;
      params.push(grade);
      paramIndex++;
    }

    const query = `
      SELECT *
      FROM pricing_data
      ${whereClause.replace('%s', days)}
      ORDER BY created_at DESC
      LIMIT $${paramIndex}
    `;

    params.push(limit);

    try {
      const result = await db.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('Error fetching current pricing:', error);
      throw error;
    }
  }

  /**
   * Update price history aggregations
   */
  static async updatePriceHistory(comicId, marketplace, date = new Date()) {
    const dateStr = date.toISOString().split('T')[0];
    
    const query = `
      INSERT INTO price_history (
        comic_id, marketplace, condition, grade, avg_price, min_price, 
        max_price, median_price, sale_count, date_period
      )
      SELECT 
        comic_id,
        marketplace,
        condition,
        grade,
        ROUND(AVG(price), 2) as avg_price,
        MIN(price) as min_price,
        MAX(price) as max_price,
        ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY price), 2) as median_price,
        COUNT(*) as sale_count,
        $3::date as date_period
      FROM pricing_data
      WHERE comic_id = $1 
        AND marketplace = $2
        AND DATE(created_at) = $3::date
        AND sale_date IS NOT NULL
      GROUP BY comic_id, marketplace, condition, grade
      ON CONFLICT (comic_id, marketplace, condition, grade, date_period)
      DO UPDATE SET
        avg_price = EXCLUDED.avg_price,
        min_price = EXCLUDED.min_price,
        max_price = EXCLUDED.max_price,
        median_price = EXCLUDED.median_price,
        sale_count = EXCLUDED.sale_count;
    `;

    try {
      await db.query(query, [comicId, marketplace, dateStr]);
      return true;
    } catch (error) {
      console.error('Error updating price history:', error);
      throw error;
    }
  }

  /**
   * Get price trends for a comic
   */
  static async getPriceTrends(comicId, options = {}) {
    const {
      marketplace = null,
      condition = null,
      days = 180
    } = options;

    let whereClause = 'WHERE comic_id = $1 AND date_period >= NOW() - INTERVAL \'%s days\'';
    let params = [comicId];
    let paramIndex = 2;

    if (marketplace) {
      whereClause += ` AND marketplace = $${paramIndex}`;
      params.push(marketplace);
      paramIndex++;
    }

    if (condition) {
      whereClause += ` AND condition = $${paramIndex}`;
      params.push(condition);
      paramIndex++;
    }

    const query = `
      SELECT 
        date_period,
        marketplace,
        condition,
        grade,
        avg_price,
        min_price,
        max_price,
        median_price,
        sale_count
      FROM price_history
      ${whereClause.replace('%s', days)}
      ORDER BY date_period DESC, marketplace, condition, grade
    `;

    try {
      const result = await db.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('Error fetching price trends:', error);
      throw error;
    }
  }
}

module.exports = PricingData; 