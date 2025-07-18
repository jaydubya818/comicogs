-- ==========================================
-- ComicComp Database Schema - Task 9 Implementation
-- Optimized for pricing data and high performance
-- ==========================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- ==========================================
-- CORE ENTITIES
-- ==========================================

-- Publishers table with optimization for lookups
CREATE TABLE publishers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    slug VARCHAR(255) NOT NULL UNIQUE,
    founded_year INTEGER,
    website_url VARCHAR(500),
    logo_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Series table with publisher relationship
CREATE TABLE series (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    publisher_id INTEGER REFERENCES publishers(id) ON DELETE SET NULL,
    start_year INTEGER,
    end_year INTEGER,
    issue_count INTEGER,
    description TEXT,
    cover_image_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(title, publisher_id, start_year)
);

-- Comics table - core entity for all pricing data
CREATE TABLE comics (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    issue_number VARCHAR(50) NOT NULL,
    variant_name VARCHAR(255),
    publisher_id INTEGER REFERENCES publishers(id) ON DELETE SET NULL,
    series_id INTEGER REFERENCES series(id) ON DELETE SET NULL,
    publication_date DATE,
    cover_image_url VARCHAR(500),
    page_count INTEGER,
    
    -- Key issue tracking for pricing intelligence
    is_key_issue BOOLEAN DEFAULT FALSE,
    key_issue_notes TEXT,
    first_appearance_characters JSONB,
    story_arcs JSONB,
    creators JSONB,
    
    -- Market metadata
    print_run INTEGER,
    cover_price DECIMAL(10,2),
    isbn VARCHAR(20),
    upc VARCHAR(20),
    diamond_code VARCHAR(20),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(title, issue_number, variant_name, publisher_id)
);

-- Users table with privacy and performance considerations
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    
    -- Profile information
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    avatar_url VARCHAR(500),
    bio TEXT,
    location VARCHAR(255),
    
    -- Account settings
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    privacy_level VARCHAR(20) DEFAULT 'public', -- public, friends, private
    
    -- Marketplace settings
    seller_rating DECIMAL(3,2) DEFAULT 0.00,
    buyer_rating DECIMAL(3,2) DEFAULT 0.00,
    total_sales INTEGER DEFAULT 0,
    total_purchases INTEGER DEFAULT 0,
    
    -- Notification preferences (JSONB for flexibility)
    notification_preferences JSONB DEFAULT '{"email": true, "push": true, "sms": false}',
    
    -- Security and audit
    last_login_at TIMESTAMP WITH TIME ZONE,
    password_changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- PRICING DATA TABLES (Core of ComicComp)
-- ==========================================

-- Raw pricing data from external sources - optimized for high volume inserts
CREATE TABLE pricing_data_raw (
    id BIGSERIAL PRIMARY KEY,
    comic_id INTEGER REFERENCES comics(id) ON DELETE CASCADE,
    
    -- Source information
    source_marketplace VARCHAR(50) NOT NULL, -- ebay, whatnot, heritage, etc.
    source_listing_id VARCHAR(100),
    source_url VARCHAR(1000),
    
    -- Pricing details
    price DECIMAL(12,2) NOT NULL,
    condition VARCHAR(20),
    grade VARCHAR(20), -- CGC 9.8, Raw, etc.
    sale_type VARCHAR(20), -- auction, buy_it_now, fixed_price
    
    -- Listing metadata
    title_raw TEXT NOT NULL,
    description_raw TEXT,
    seller_info JSONB,
    listing_photos JSONB,
    shipping_cost DECIMAL(10,2),
    
    -- Sale details
    sale_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    view_count INTEGER,
    watcher_count INTEGER,
    bid_count INTEGER,
    
    -- Data quality metrics
    confidence_score DECIMAL(5,4) DEFAULT 0.0000,
    is_verified BOOLEAN DEFAULT FALSE,
    is_outlier BOOLEAN DEFAULT FALSE,
    
    -- Processing status
    processing_status VARCHAR(20) DEFAULT 'pending', -- pending, processed, error, excluded
    processed_at TIMESTAMP WITH TIME ZONE,
    
    -- Audit trail
    collected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Normalized pricing data - cleaned and processed for analysis
CREATE TABLE pricing_data_normalized (
    id BIGSERIAL PRIMARY KEY,
    comic_id INTEGER REFERENCES comics(id) ON DELETE CASCADE,
    raw_data_id BIGINT REFERENCES pricing_data_raw(id) ON DELETE SET NULL,
    
    -- Normalized pricing
    price_normalized DECIMAL(12,2) NOT NULL,
    condition_normalized VARCHAR(20) NOT NULL,
    grade_tier VARCHAR(20), -- raw, graded_low, graded_mid, graded_high
    sale_type_normalized VARCHAR(20),
    
    -- Market analysis
    price_percentile DECIMAL(5,2), -- Where this price falls in distribution
    days_on_market INTEGER,
    competitive_rating DECIMAL(3,2), -- How competitive this price was
    
    -- Quality scores
    data_quality_score DECIMAL(5,4) NOT NULL,
    market_impact_score DECIMAL(5,4), -- How much this sale affects market price
    
    -- Temporal data
    sale_date DATE NOT NULL,
    sale_month INTEGER GENERATED ALWAYS AS (EXTRACT(MONTH FROM sale_date)) STORED,
    sale_year INTEGER GENERATED ALWAYS AS (EXTRACT(YEAR FROM sale_date)) STORED,
    
    -- Audit
    normalized_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Aggregated pricing data for fast lookups - materialized view approach
CREATE TABLE pricing_aggregates (
    id SERIAL PRIMARY KEY,
    comic_id INTEGER REFERENCES comics(id) ON DELETE CASCADE,
    condition_tier VARCHAR(20) NOT NULL,
    
    -- Aggregate statistics
    current_market_price DECIMAL(12,2),
    median_price DECIMAL(12,2),
    avg_price DECIMAL(12,2),
    min_price DECIMAL(12,2),
    max_price DECIMAL(12,2),
    std_deviation DECIMAL(12,4),
    
    -- Volume metrics
    sales_count INTEGER DEFAULT 0,
    sales_volume_30d INTEGER DEFAULT 0,
    sales_volume_90d INTEGER DEFAULT 0,
    sales_volume_365d INTEGER DEFAULT 0,
    
    -- Trend analysis
    price_trend_30d DECIMAL(8,4), -- Percentage change
    price_trend_90d DECIMAL(8,4),
    price_trend_365d DECIMAL(8,4),
    velocity_score DECIMAL(5,4), -- How fast it's selling
    
    -- Market health indicators
    liquidity_score DECIMAL(5,4),
    volatility_score DECIMAL(5,4),
    confidence_interval_lower DECIMAL(12,2),
    confidence_interval_upper DECIMAL(12,2),
    
    -- Data quality
    data_points_count INTEGER DEFAULT 0,
    last_sale_date DATE,
    oldest_sale_date DATE,
    
    -- Metadata
    calculation_date DATE NOT NULL DEFAULT CURRENT_DATE,
    is_current BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(comic_id, condition_tier, calculation_date)
);

-- ==========================================
-- USER COLLECTIONS AND MARKETPLACE
-- ==========================================

-- User collections with enhanced tracking
CREATE TABLE collections (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    comic_id INTEGER REFERENCES comics(id) ON DELETE CASCADE,
    
    -- Collection details
    condition VARCHAR(20) NOT NULL,
    grade VARCHAR(20),
    acquisition_date DATE,
    purchase_price DECIMAL(10,2),
    current_value DECIMAL(10,2),
    
    -- Collection metadata
    storage_location VARCHAR(255),
    notes TEXT,
    is_for_sale BOOLEAN DEFAULT FALSE,
    is_public BOOLEAN DEFAULT TRUE,
    reading_status VARCHAR(20) DEFAULT 'unread', -- unread, reading, read
    
    -- Value tracking
    last_value_update TIMESTAMP WITH TIME ZONE,
    value_change_30d DECIMAL(10,2),
    value_change_365d DECIMAL(10,2),
    
    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, comic_id)
);

-- Enhanced wantlists with smart features
CREATE TABLE wantlists (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    comic_id INTEGER REFERENCES comics(id) ON DELETE CASCADE,
    
    -- Want criteria
    max_price DECIMAL(10,2),
    min_condition VARCHAR(20),
    preferred_grade VARCHAR(20),
    priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high, critical
    
    -- Smart features
    price_alert_threshold DECIMAL(5,2) DEFAULT 10.00, -- Percentage below max_price
    auto_buy_enabled BOOLEAN DEFAULT FALSE,
    auto_buy_max_price DECIMAL(10,2),
    
    -- Notifications
    notifications_enabled BOOLEAN DEFAULT TRUE,
    last_notification_sent TIMESTAMP WITH TIME ZONE,
    
    -- Market insights (JSONB for flexibility)
    market_insights JSONB,
    monitoring_settings JSONB DEFAULT '{"frequency": "daily", "alerts": ["price_drop", "new_listing"]}',
    
    -- Metadata
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    target_price DECIMAL(10,2),
    
    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_checked TIMESTAMP WITH TIME ZONE,
    
    UNIQUE(user_id, comic_id)
);

-- Marketplace listings with enhanced features
CREATE TABLE marketplace_listings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    comic_id INTEGER REFERENCES comics(id) ON DELETE CASCADE,
    collection_id INTEGER REFERENCES collections(id) ON DELETE SET NULL,
    
    -- Listing details
    title VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    condition VARCHAR(20) NOT NULL,
    grade VARCHAR(20),
    
    -- Enhanced listing features
    ai_enhanced_description BOOLEAN DEFAULT FALSE,
    market_insights_included BOOLEAN DEFAULT FALSE,
    recommended_price DECIMAL(10,2),
    price_confidence_score DECIMAL(5,4),
    
    -- Listing metadata
    photos JSONB, -- Array of photo URLs
    shipping_cost DECIMAL(10,2),
    handling_time_days INTEGER DEFAULT 1,
    return_policy TEXT,
    
    -- Status and visibility
    status VARCHAR(20) DEFAULT 'active', -- active, sold, expired, draft
    is_featured BOOLEAN DEFAULT FALSE,
    views_count INTEGER DEFAULT 0,
    watchers_count INTEGER DEFAULT 0,
    messages_count INTEGER DEFAULT 0,
    
    -- Market timing
    optimal_timing_score DECIMAL(5,4),
    seasonal_adjustment DECIMAL(8,4),
    
    -- Audit and tracking
    listed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    sold_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- ANALYTICS AND TRACKING TABLES
-- ==========================================

-- User search history for AI recommendations
CREATE TABLE search_history (
    id BIGSERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    
    -- Search details
    search_query TEXT NOT NULL,
    search_type VARCHAR(50), -- comic_search, price_search, market_analysis
    filters_applied JSONB,
    results_count INTEGER,
    
    -- User interaction
    clicked_results JSONB, -- Array of comic_ids clicked
    time_spent_seconds INTEGER,
    converted_to_action BOOLEAN DEFAULT FALSE, -- Added to collection/wantlist
    
    -- Context
    search_source VARCHAR(50), -- web, mobile, api
    user_agent TEXT,
    ip_address INET,
    
    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Price alerts and notifications
CREATE TABLE price_alerts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    comic_id INTEGER REFERENCES comics(id) ON DELETE CASCADE,
    wantlist_id INTEGER REFERENCES wantlists(id) ON DELETE CASCADE,
    
    -- Alert configuration
    alert_type VARCHAR(50) NOT NULL, -- price_drop, target_reached, market_movement
    threshold_value DECIMAL(12,2),
    threshold_percentage DECIMAL(5,2),
    condition_filter VARCHAR(20),
    
    -- Alert status
    is_active BOOLEAN DEFAULT TRUE,
    is_triggered BOOLEAN DEFAULT FALSE,
    triggered_at TIMESTAMP WITH TIME ZONE,
    last_checked TIMESTAMP WITH TIME ZONE,
    
    -- Delivery settings
    delivery_methods JSONB DEFAULT '["email"]', -- email, push, sms
    frequency VARCHAR(20) DEFAULT 'immediate', -- immediate, daily, weekly
    
    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Task 8 integration - Listing success tracking
CREATE TABLE listing_success_tracking (
    id SERIAL PRIMARY KEY,
    listing_id INTEGER REFERENCES marketplace_listings(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    comic_id INTEGER REFERENCES comics(id) ON DELETE CASCADE,
    collection_id INTEGER REFERENCES collections(id) ON DELETE SET NULL,
    
    -- Recommendation tracking
    recommendation_id VARCHAR(100),
    recommendation_action VARCHAR(50),
    recommendation_confidence DECIMAL(5,4),
    ai_suggested_price DECIMAL(10,2),
    ai_price_confidence DECIMAL(5,4),
    
    -- Actual listing data
    actual_listing_price DECIMAL(10,2),
    actual_condition VARCHAR(20),
    listing_description_enhanced BOOLEAN DEFAULT FALSE,
    market_insights_included BOOLEAN DEFAULT FALSE,
    
    -- User behavior
    user_followed_price_suggestion BOOLEAN DEFAULT FALSE,
    user_followed_action_suggestion BOOLEAN DEFAULT FALSE,
    time_from_recommendation_to_listing INTEGER, -- milliseconds
    
    -- Performance metrics
    views_count INTEGER DEFAULT 0,
    watchers_count INTEGER DEFAULT 0,
    messages_count INTEGER DEFAULT 0,
    view_to_message_rate DECIMAL(5,4),
    view_to_watcher_rate DECIMAL(5,4),
    
    -- Sale completion
    sold_at TIMESTAMP WITH TIME ZONE,
    final_sale_price DECIMAL(10,2),
    days_to_sale INTEGER,
    buyer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    sale_method VARCHAR(50),
    
    -- Success metrics
    price_accuracy DECIMAL(5,4),
    recommendation_success DECIMAL(5,4),
    market_prediction_accuracy DECIMAL(5,4),
    
    -- Market conditions at time of listing
    market_conditions JSONB,
    competitive_listings_count INTEGER,
    listing_status VARCHAR(20) DEFAULT 'active',
    
    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    recommendation_generated_at TIMESTAMP WITH TIME ZONE
);

-- ==========================================
-- SYSTEM TABLES
-- ==========================================

-- Data collection status and monitoring
CREATE TABLE data_collection_status (
    id SERIAL PRIMARY KEY,
    source_name VARCHAR(50) NOT NULL,
    collection_type VARCHAR(50) NOT NULL, -- full_scan, incremental, targeted
    
    -- Status tracking
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, running, completed, failed
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Results
    records_found INTEGER DEFAULT 0,
    records_processed INTEGER DEFAULT 0,
    records_inserted INTEGER DEFAULT 0,
    records_updated INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,
    
    -- Error tracking
    error_message TEXT,
    error_details JSONB,
    
    -- Metadata
    collection_parameters JSONB,
    performance_metrics JSONB,
    
    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Database schema versioning
CREATE TABLE schema_migrations (
    version VARCHAR(50) PRIMARY KEY,
    description TEXT,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    execution_time_ms INTEGER,
    checksum VARCHAR(64)
);

-- System configuration
CREATE TABLE system_config (
    id SERIAL PRIMARY KEY,
    config_key VARCHAR(100) NOT NULL UNIQUE,
    config_value JSONB NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- ==========================================

-- Comics table indexes
CREATE INDEX CONCURRENTLY idx_comics_title_gin ON comics USING gin(title gin_trgm_ops);
CREATE INDEX CONCURRENTLY idx_comics_publisher_series ON comics(publisher_id, series_id);
CREATE INDEX CONCURRENTLY idx_comics_publication_date ON comics(publication_date);
CREATE INDEX CONCURRENTLY idx_comics_key_issue ON comics(is_key_issue) WHERE is_key_issue = TRUE;

-- Pricing data indexes (critical for performance)
CREATE INDEX CONCURRENTLY idx_pricing_raw_comic_date ON pricing_data_raw(comic_id, sale_date DESC);
CREATE INDEX CONCURRENTLY idx_pricing_raw_marketplace ON pricing_data_raw(source_marketplace, collected_at DESC);
CREATE INDEX CONCURRENTLY idx_pricing_raw_processing_status ON pricing_data_raw(processing_status) WHERE processing_status = 'pending';

CREATE INDEX CONCURRENTLY idx_pricing_normalized_comic_condition ON pricing_data_normalized(comic_id, condition_normalized, sale_date DESC);
CREATE INDEX CONCURRENTLY idx_pricing_normalized_date_price ON pricing_data_normalized(sale_date DESC, price_normalized);
CREATE INDEX CONCURRENTLY idx_pricing_normalized_quality ON pricing_data_normalized(data_quality_score DESC) WHERE data_quality_score > 0.8;

-- Pricing aggregates indexes
CREATE UNIQUE INDEX CONCURRENTLY idx_pricing_aggregates_current ON pricing_aggregates(comic_id, condition_tier) WHERE is_current = TRUE;
CREATE INDEX CONCURRENTLY idx_pricing_aggregates_market_price ON pricing_aggregates(current_market_price DESC) WHERE is_current = TRUE;

-- User and collection indexes
CREATE INDEX CONCURRENTLY idx_users_username_email ON users(username, email);
CREATE INDEX CONCURRENTLY idx_users_active ON users(is_active) WHERE is_active = TRUE;

CREATE INDEX CONCURRENTLY idx_collections_user_comic ON collections(user_id, comic_id);
CREATE INDEX CONCURRENTLY idx_collections_user_public ON collections(user_id) WHERE is_public = TRUE;
CREATE INDEX CONCURRENTLY idx_collections_value_tracking ON collections(last_value_update, current_value DESC);

CREATE INDEX CONCURRENTLY idx_wantlists_user_active ON wantlists(user_id) WHERE is_active = TRUE;
CREATE INDEX CONCURRENTLY idx_wantlists_comic_price ON wantlists(comic_id, max_price);

-- Marketplace indexes
CREATE INDEX CONCURRENTLY idx_marketplace_listings_active ON marketplace_listings(status, created_at DESC) WHERE status = 'active';
CREATE INDEX CONCURRENTLY idx_marketplace_listings_user ON marketplace_listings(user_id, status);
CREATE INDEX CONCURRENTLY idx_marketplace_listings_comic_price ON marketplace_listings(comic_id, price) WHERE status = 'active';

-- Analytics indexes
CREATE INDEX CONCURRENTLY idx_search_history_user_date ON search_history(user_id, created_at DESC);
CREATE INDEX CONCURRENTLY idx_search_history_query_gin ON search_history USING gin(search_query gin_trgm_ops);

CREATE INDEX CONCURRENTLY idx_price_alerts_active ON price_alerts(is_active, last_checked) WHERE is_active = TRUE;
CREATE INDEX CONCURRENTLY idx_price_alerts_user ON price_alerts(user_id) WHERE is_active = TRUE;

-- Success tracking indexes
CREATE INDEX CONCURRENTLY idx_listing_success_comic_date ON listing_success_tracking(comic_id, created_at DESC);
CREATE INDEX CONCURRENTLY idx_listing_success_performance ON listing_success_tracking(price_accuracy DESC, recommendation_success DESC);

-- ==========================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- ==========================================

-- Update timestamp triggers
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to relevant tables
CREATE TRIGGER tr_publishers_updated_at BEFORE UPDATE ON publishers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_series_updated_at BEFORE UPDATE ON series FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_comics_updated_at BEFORE UPDATE ON comics FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_collections_updated_at BEFORE UPDATE ON collections FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_wantlists_updated_at BEFORE UPDATE ON wantlists FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_marketplace_listings_updated_at BEFORE UPDATE ON marketplace_listings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_pricing_aggregates_updated_at BEFORE UPDATE ON pricing_aggregates FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ==========================================
-- VIEWS FOR COMMON QUERIES
-- ==========================================

-- Current market prices view
CREATE VIEW current_market_prices AS
SELECT 
    c.id,
    c.title,
    c.issue_number,
    c.variant_name,
    p.name as publisher_name,
    s.title as series_title,
    pa.condition_tier,
    pa.current_market_price,
    pa.median_price,
    pa.sales_count,
    pa.price_trend_30d,
    pa.price_trend_90d,
    pa.liquidity_score,
    pa.last_sale_date,
    pa.updated_at
FROM comics c
LEFT JOIN publishers p ON c.publisher_id = p.id
LEFT JOIN series s ON c.series_id = s.id
LEFT JOIN pricing_aggregates pa ON c.id = pa.comic_id AND pa.is_current = TRUE
WHERE pa.current_market_price IS NOT NULL;

-- User collection values view
CREATE VIEW user_collection_values AS
SELECT 
    u.id as user_id,
    u.username,
    COUNT(col.id) as total_comics,
    SUM(col.purchase_price) as total_purchase_price,
    SUM(col.current_value) as total_current_value,
    SUM(col.current_value - col.purchase_price) as total_gain_loss,
    ROUND(
        CASE 
            WHEN SUM(col.purchase_price) > 0 
            THEN ((SUM(col.current_value) - SUM(col.purchase_price)) / SUM(col.purchase_price)) * 100
            ELSE 0 
        END, 2
    ) as roi_percentage
FROM users u
LEFT JOIN collections col ON u.id = col.user_id
WHERE u.is_active = TRUE
GROUP BY u.id, u.username;

-- Market trending comics view
CREATE VIEW trending_comics AS
SELECT 
    c.id,
    c.title,
    c.issue_number,
    c.variant_name,
    p.name as publisher_name,
    pa.current_market_price,
    pa.price_trend_30d,
    pa.price_trend_90d,
    pa.sales_volume_30d,
    pa.velocity_score,
    pa.liquidity_score
FROM comics c
JOIN publishers p ON c.publisher_id = p.id
JOIN pricing_aggregates pa ON c.id = pa.comic_id
WHERE pa.is_current = TRUE 
    AND pa.price_trend_30d > 10 
    AND pa.sales_volume_30d >= 5
ORDER BY pa.price_trend_30d DESC, pa.velocity_score DESC
LIMIT 100;

-- Insert initial schema version
INSERT INTO schema_migrations (version, description) VALUES ('1.0.0', 'Initial ComicComp database schema with Task 9 optimizations');

-- Insert default system configuration
INSERT INTO system_config (config_key, config_value, description) VALUES
('pricing_data_retention_days', '2555', 'Number of days to retain raw pricing data (7 years)'),
('cache_refresh_interval_minutes', '15', 'How often to refresh pricing aggregate cache'),
('max_concurrent_data_collectors', '5', 'Maximum number of concurrent data collection processes'),
('api_rate_limit_per_minute', '1000', 'API rate limit per user per minute'),
('notification_batch_size', '100', 'Number of notifications to process in each batch'),
('search_history_retention_days', '365', 'Number of days to retain user search history');

COMMENT ON DATABASE current_database() IS 'ComicComp - Comic Book Pricing Intelligence Database with Task 9 Optimizations'; 