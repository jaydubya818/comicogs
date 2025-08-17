-- ==========================================
-- COMICCOMP PRODUCTION DATABASE OPTIMIZATIONS
-- Performance-focused indexes and configurations
-- ==========================================

-- ==========================================
-- PERFORMANCE INDEXES
-- ==========================================

-- Comics table optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_comics_title_trgm ON comics USING gin(title gin_trgm_ops);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_comics_search_vector ON comics USING gin(search_vector);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_comics_publisher_year ON comics(publisher, publication_year);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_comics_grade_condition ON comics(grade, condition);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_comics_created_at_desc ON comics(created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_comics_updated_at ON comics(updated_at) WHERE updated_at > NOW() - INTERVAL '7 days';

-- Marketplace listings optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_marketplace_status_price ON marketplace_listings(status, price) WHERE status = 'active';
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_marketplace_seller_created ON marketplace_listings(seller_id, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_marketplace_comic_condition ON marketplace_listings(comic_id, condition);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_marketplace_price_range ON marketplace_listings(price) WHERE status = 'active';
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_marketplace_featured ON marketplace_listings(featured, created_at DESC) WHERE featured = true;

-- User collections optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_collections_user_comic ON collections(user_id, comic_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_collections_user_added ON collections(user_id, added_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_collections_comic_grade ON collections(comic_id, grade);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_collections_value ON collections(estimated_value DESC) WHERE estimated_value > 0;

-- Wantlists optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_wantlists_user_priority ON wantlists(user_id, priority DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_wantlists_comic_watchers ON wantlists(comic_id, created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_wantlists_max_price ON wantlists(comic_id, max_price DESC) WHERE max_price > 0;

-- User authentication optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_lower ON users(LOWER(email));
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_username_lower ON users(LOWER(username));
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_active_verified ON users(created_at DESC) WHERE active = true AND email_verified = true;

-- OAuth tokens optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_oauth_tokens_user_provider ON oauth_tokens(user_id, provider);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_oauth_tokens_expires ON oauth_tokens(expires_at) WHERE expires_at > NOW();
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_oauth_tokens_refresh ON oauth_tokens(refresh_token) WHERE refresh_token IS NOT NULL;

-- Session management optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_sessions_user_active ON user_sessions(user_id, last_activity DESC) WHERE expires_at > NOW();
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_sessions_cleanup ON user_sessions(expires_at) WHERE expires_at < NOW();

-- Notifications optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, created_at DESC) WHERE read_at IS NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_type_created ON notifications(type, created_at DESC);

-- Analytics and tracking optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_activity_user_timestamp ON user_activity(user_id, timestamp DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_activity_action_timestamp ON user_activity(action, timestamp DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_price_history_comic_date ON price_history(comic_id, date DESC);

-- Full-text search optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_comics_fulltext ON comics USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));

-- ==========================================
-- PARTIAL INDEXES FOR PERFORMANCE
-- ==========================================

-- Active marketplace listings only
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_marketplace_active_recent 
ON marketplace_listings(created_at DESC) 
WHERE status = 'active' AND created_at > NOW() - INTERVAL '30 days';

-- High-value collections
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_collections_high_value 
ON collections(user_id, estimated_value DESC) 
WHERE estimated_value > 100;

-- Recent user activity
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_recent_activity 
ON users(last_login DESC) 
WHERE last_login > NOW() - INTERVAL '90 days';

-- Trending comics (high activity)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_comics_trending 
ON comics(view_count DESC, updated_at DESC) 
WHERE view_count > 100 AND updated_at > NOW() - INTERVAL '7 days';

-- ==========================================
-- COMPOSITE INDEXES FOR COMPLEX QUERIES
-- ==========================================

-- Marketplace search with filters
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_marketplace_search_filters 
ON marketplace_listings(status, condition, price, created_at DESC) 
WHERE status = 'active';

-- User collection analytics
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_collections_analytics 
ON collections(user_id, grade, condition, estimated_value, added_at);

-- Comic popularity tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_comics_popularity 
ON comics(publisher, publication_year, view_count DESC, rating DESC);

-- ==========================================
-- EXPRESSION INDEXES
-- ==========================================

-- Case-insensitive search optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_comics_title_lower ON comics(LOWER(title));
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_normalized ON users(LOWER(TRIM(email)));

-- Date-based partitioning helpers
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_marketplace_monthly 
ON marketplace_listings(DATE_TRUNC('month', created_at), status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_activity_daily 
ON user_activity(DATE_TRUNC('day', timestamp), action);

-- ==========================================
-- STATISTICS OPTIMIZATION
-- ==========================================

-- Increase statistics target for frequently queried columns
ALTER TABLE comics ALTER COLUMN title SET STATISTICS 1000;
ALTER TABLE comics ALTER COLUMN publisher SET STATISTICS 500;
ALTER TABLE marketplace_listings ALTER COLUMN price SET STATISTICS 1000;
ALTER TABLE collections ALTER COLUMN estimated_value SET STATISTICS 500;

-- ==========================================
-- TABLE-SPECIFIC OPTIMIZATIONS
-- ==========================================

-- Comics table optimization
ALTER TABLE comics SET (fillfactor = 90);  -- Leave room for updates

-- Marketplace listings optimization
ALTER TABLE marketplace_listings SET (fillfactor = 85);  -- More updates expected

-- Collections table optimization  
ALTER TABLE collections SET (fillfactor = 95);  -- Fewer updates

-- ==========================================
-- QUERY PERFORMANCE FUNCTIONS
-- ==========================================

-- Function to get trending comics efficiently
CREATE OR REPLACE FUNCTION get_trending_comics(time_period INTERVAL DEFAULT '7 days')
RETURNS TABLE(
    comic_id INTEGER,
    title VARCHAR,
    publisher VARCHAR,
    trend_score NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.title,
        c.publisher,
        (c.view_count * 0.3 + 
         COALESCE(marketplace_count.count, 0) * 0.4 + 
         COALESCE(wantlist_count.count, 0) * 0.3) as trend_score
    FROM comics c
    LEFT JOIN (
        SELECT comic_id, COUNT(*) as count
        FROM marketplace_listings
        WHERE created_at > NOW() - time_period
        GROUP BY comic_id
    ) marketplace_count ON c.id = marketplace_count.comic_id
    LEFT JOIN (
        SELECT comic_id, COUNT(*) as count
        FROM wantlists
        WHERE created_at > NOW() - time_period
        GROUP BY comic_id
    ) wantlist_count ON c.id = wantlist_count.comic_id
    WHERE c.updated_at > NOW() - time_period
    ORDER BY trend_score DESC
    LIMIT 100;
END;
$$ LANGUAGE plpgsql;

-- Function for efficient user collection stats
CREATE OR REPLACE FUNCTION get_user_collection_stats(user_id_param INTEGER)
RETURNS TABLE(
    total_comics INTEGER,
    total_value NUMERIC,
    avg_grade NUMERIC,
    top_publisher VARCHAR,
    completion_percentage NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_comics,
        COALESCE(SUM(estimated_value), 0) as total_value,
        COALESCE(AVG(CASE 
            WHEN grade ~ '^[0-9]+\.?[0-9]*$' 
            THEN grade::NUMERIC 
            ELSE NULL 
        END), 0) as avg_grade,
        (SELECT publisher FROM comics c 
         JOIN collections col ON c.id = col.comic_id 
         WHERE col.user_id = user_id_param 
         GROUP BY publisher 
         ORDER BY COUNT(*) DESC 
         LIMIT 1) as top_publisher,
        (COUNT(*) * 100.0 / NULLIF((SELECT COUNT(*) FROM comics), 0)) as completion_percentage
    FROM collections
    WHERE user_id = user_id_param;
END;
$$ LANGUAGE plpgsql;

-- Function for marketplace price analytics
CREATE OR REPLACE FUNCTION get_comic_price_analytics(comic_id_param INTEGER)
RETURNS TABLE(
    current_avg_price NUMERIC,
    price_trend VARCHAR,
    lowest_price NUMERIC,
    highest_price NUMERIC,
    listing_count INTEGER
) AS $$
DECLARE
    recent_avg NUMERIC;
    older_avg NUMERIC;
BEGIN
    -- Get recent average (last 30 days)
    SELECT AVG(price) INTO recent_avg
    FROM marketplace_listings
    WHERE comic_id = comic_id_param 
    AND status = 'active'
    AND created_at > NOW() - INTERVAL '30 days';
    
    -- Get older average (30-60 days ago)
    SELECT AVG(price) INTO older_avg
    FROM marketplace_listings
    WHERE comic_id = comic_id_param 
    AND status IN ('sold', 'active')
    AND created_at BETWEEN NOW() - INTERVAL '60 days' AND NOW() - INTERVAL '30 days';
    
    RETURN QUERY
    SELECT 
        recent_avg as current_avg_price,
        CASE 
            WHEN recent_avg > older_avg * 1.1 THEN 'increasing'
            WHEN recent_avg < older_avg * 0.9 THEN 'decreasing'
            ELSE 'stable'
        END as price_trend,
        MIN(price) as lowest_price,
        MAX(price) as highest_price,
        COUNT(*)::INTEGER as listing_count
    FROM marketplace_listings
    WHERE comic_id = comic_id_param 
    AND status = 'active';
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- MAINTENANCE PROCEDURES
-- ==========================================

-- Procedure to update table statistics
CREATE OR REPLACE FUNCTION update_table_statistics()
RETURNS VOID AS $$
BEGIN
    ANALYZE comics;
    ANALYZE marketplace_listings;
    ANALYZE collections;
    ANALYZE wantlists;
    ANALYZE users;
    ANALYZE user_activity;
    ANALYZE notifications;
    
    RAISE NOTICE 'Table statistics updated successfully';
END;
$$ LANGUAGE plpgsql;

-- Procedure to cleanup old data
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS VOID AS $$
BEGIN
    -- Cleanup expired sessions
    DELETE FROM user_sessions WHERE expires_at < NOW() - INTERVAL '7 days';
    
    -- Cleanup old user activity (keep 6 months)
    DELETE FROM user_activity WHERE timestamp < NOW() - INTERVAL '6 months';
    
    -- Cleanup old notifications (keep 3 months)
    DELETE FROM notifications WHERE created_at < NOW() - INTERVAL '3 months' AND read_at IS NOT NULL;
    
    -- Cleanup expired OAuth tokens
    DELETE FROM oauth_tokens WHERE expires_at < NOW() - INTERVAL '1 day';
    
    RAISE NOTICE 'Old data cleanup completed';
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- VACUUM AND REINDEX SCHEDULING
-- ==========================================

-- Create function to perform maintenance
CREATE OR REPLACE FUNCTION perform_maintenance()
RETURNS VOID AS $$
BEGIN
    -- Update statistics
    PERFORM update_table_statistics();
    
    -- Cleanup old data
    PERFORM cleanup_old_data();
    
    -- Vacuum analyze high-traffic tables
    VACUUM ANALYZE comics;
    VACUUM ANALYZE marketplace_listings;
    VACUUM ANALYZE collections;
    VACUUM ANALYZE user_activity;
    
    RAISE NOTICE 'Database maintenance completed successfully';
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- MONITORING VIEWS
-- ==========================================

-- View for performance monitoring
CREATE OR REPLACE VIEW performance_stats AS
SELECT 
    schemaname,
    tablename,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    n_live_tup as live_tuples,
    n_dead_tup as dead_tuples,
    last_vacuum,
    last_autovacuum,
    last_analyze,
    last_autoanalyze
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;

-- View for index usage
CREATE OR REPLACE VIEW index_usage AS
SELECT 
    t.tablename,
    indexname,
    c.reltuples as num_rows,
    pg_size_pretty(pg_relation_size(indexrelname::regclass)) as index_size,
    idx_scan as times_used,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_tables t
LEFT JOIN pg_class c ON c.relname = t.tablename
LEFT JOIN pg_indexes i ON i.tablename = t.tablename
LEFT JOIN pg_stat_user_indexes ui ON ui.indexrelname = i.indexname
WHERE t.schemaname = 'public'
ORDER BY times_used DESC;

-- View for slow queries monitoring
CREATE OR REPLACE VIEW slow_queries AS
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    max_time,
    min_time,
    rows,
    100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
FROM pg_stat_statements
WHERE calls > 10
ORDER BY mean_time DESC;

COMMENT ON TABLE comics IS 'Optimized with full-text search and trending analytics';
COMMENT ON TABLE marketplace_listings IS 'Optimized for real-time marketplace queries';
COMMENT ON TABLE collections IS 'Optimized for user collection analytics';
COMMENT ON INDEX idx_comics_title_trgm IS 'Trigram index for fuzzy title matching';
COMMENT ON INDEX idx_marketplace_active_recent IS 'Partial index for active recent listings';
COMMENT ON FUNCTION get_trending_comics IS 'Efficient trending comics calculation';
COMMENT ON FUNCTION perform_maintenance IS 'Automated database maintenance routine';