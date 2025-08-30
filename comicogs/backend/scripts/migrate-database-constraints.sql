-- Database Constraint Enhancement Migration
-- This script adds enhanced constraints, indexes, and validation rules

-- 1. Add check constraints for data validation
ALTER TABLE users 
ADD CONSTRAINT check_email_format 
CHECK (email ~* '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}$');

ALTER TABLE users 
ADD CONSTRAINT check_name_length 
CHECK (name IS NULL OR length(name) BETWEEN 1 AND 100);

-- 2. Add constraints for Comic model
ALTER TABLE comics 
ADD CONSTRAINT check_title_not_empty 
CHECK (length(trim(title)) > 0);

ALTER TABLE comics 
ADD CONSTRAINT check_series_not_empty 
CHECK (length(trim(series)) > 0);

ALTER TABLE comics 
ADD CONSTRAINT check_issue_not_empty 
CHECK (length(trim(issue)) > 0);

ALTER TABLE comics 
ADD CONSTRAINT check_year_reasonable 
CHECK (year IS NULL OR (year >= 1930 AND year <= EXTRACT(year FROM CURRENT_DATE) + 5));

ALTER TABLE comics 
ADD CONSTRAINT check_estimated_price_positive 
CHECK (estimatedPrice IS NULL OR estimatedPrice >= 0);

-- 3. Add constraints for Listing model
ALTER TABLE listings 
ADD CONSTRAINT check_price_positive 
CHECK (price > 0);

ALTER TABLE listings 
ADD CONSTRAINT check_original_price_positive 
CHECK (originalPrice IS NULL OR originalPrice > 0);

ALTER TABLE listings 
ADD CONSTRAINT check_views_non_negative 
CHECK (views >= 0);

ALTER TABLE listings 
ADD CONSTRAINT check_watch_count_non_negative 
CHECK (watchCount >= 0);

ALTER TABLE listings 
ADD CONSTRAINT check_sold_at_when_sold 
CHECK (status != 'sold' OR soldAt IS NOT NULL);

ALTER TABLE listings 
ADD CONSTRAINT check_expires_at_future 
CHECK (expiresAt IS NULL OR expiresAt > createdAt);

-- 4. Add constraints for Order model
ALTER TABLE orders 
ADD CONSTRAINT check_amount_positive 
CHECK (amount > 0);

ALTER TABLE orders 
ADD CONSTRAINT check_fees_non_negative 
CHECK (fees >= 0);

ALTER TABLE orders 
ADD CONSTRAINT check_tax_non_negative 
CHECK (tax >= 0);

ALTER TABLE orders 
ADD CONSTRAINT check_refund_amount_valid 
CHECK (refundAmount IS NULL OR (refundAmount >= 0 AND refundAmount <= amount));

ALTER TABLE orders 
ADD CONSTRAINT check_shipped_tracking 
CHECK (shippedAt IS NULL OR trackingNumber IS NOT NULL);

ALTER TABLE orders 
ADD CONSTRAINT check_delivered_after_shipped 
CHECK (deliveredAt IS NULL OR (shippedAt IS NOT NULL AND deliveredAt >= shippedAt));

ALTER TABLE orders 
ADD CONSTRAINT check_canceled_reason 
CHECK (canceledAt IS NULL OR cancelReason IS NOT NULL);

-- 5. Add constraints for CollectionItem model
ALTER TABLE collection_items 
ADD CONSTRAINT check_paid_price_non_negative 
CHECK (paidPrice IS NULL OR paidPrice >= 0);

ALTER TABLE collection_items 
ADD CONSTRAINT check_current_value_non_negative 
CHECK (currentValue IS NULL OR currentValue >= 0);

ALTER TABLE collection_items 
ADD CONSTRAINT check_acquired_at_past 
CHECK (acquiredAt IS NULL OR acquiredAt <= CURRENT_TIMESTAMP);

-- 6. Add constraints for WantItem model
ALTER TABLE want_items 
ADD CONSTRAINT check_max_price_positive 
CHECK (maxPrice IS NULL OR maxPrice > 0);

ALTER TABLE want_items 
ADD CONSTRAINT check_priority_valid 
CHECK (priority IN (1, 2, 3));

ALTER TABLE want_items 
ADD CONSTRAINT check_series_not_empty_want 
CHECK (length(trim(series)) > 0);

ALTER TABLE want_items 
ADD CONSTRAINT check_issue_not_empty_want 
CHECK (length(trim(issue)) > 0);

-- 7. Add constraints for Report model
ALTER TABLE reports 
ADD CONSTRAINT check_priority_valid_report 
CHECK (priority IN (1, 2, 3));

ALTER TABLE reports 
ADD CONSTRAINT check_reviewed_fields_consistency 
CHECK ((reviewedAt IS NULL AND reviewedBy IS NULL) OR 
       (reviewedAt IS NOT NULL AND reviewedBy IS NOT NULL));

-- 8. Add constraints for SavedSearch model
ALTER TABLE saved_searches 
ADD CONSTRAINT check_name_not_empty 
CHECK (length(trim(name)) > 0);

ALTER TABLE saved_searches 
ADD CONSTRAINT check_cadence_valid 
CHECK (cadence IN ('daily', 'weekly', 'monthly'));

ALTER TABLE saved_searches 
ADD CONSTRAINT check_results_count_non_negative 
CHECK (resultsCount >= 0);

-- 9. Add constraints for UserSession model
ALTER TABLE user_sessions 
ADD CONSTRAINT check_expires_at_future_session 
CHECK (expiresAt > createdAt);

ALTER TABLE user_sessions 
ADD CONSTRAINT check_last_used_after_created 
CHECK (lastUsedAt >= createdAt);

-- 10. Add constraints for WebhookEvent model
ALTER TABLE webhook_events 
ADD CONSTRAINT check_attempts_non_negative 
CHECK (attempts >= 0);

ALTER TABLE webhook_events 
ADD CONSTRAINT check_processed_at_when_processed 
CHECK (NOT processed OR processedAt IS NOT NULL);

-- 11. Create additional indexes for performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_suspended ON users(suspended) WHERE suspended = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_verified ON users(verified) WHERE verified = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_last_login ON users(lastLoginAt DESC) WHERE lastLoginAt IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_comics_key_issue ON comics(keyIssue) WHERE keyIssue = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_comics_publisher_year ON comics(publisher, year) WHERE publisher IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_comics_first_appearance ON comics(firstAppearance) WHERE firstAppearance IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_listings_featured ON listings(featured) WHERE featured = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_listings_price_range ON listings(price) WHERE status = 'active';
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_listings_expires_soon ON listings(expiresAt) WHERE expiresAt IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_listings_sold_date ON listings(soldAt) WHERE soldAt IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_payment_processing ON orders(status, createdAt) WHERE status IN ('pending', 'failed');
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_shipping_tracking ON orders(trackingNumber) WHERE trackingNumber IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_refunded ON orders(refundAmount) WHERE refundAmount IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_collection_favorites ON collection_items(userId, favorite) WHERE favorite = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_collection_for_sale ON collection_items(userId, forSale) WHERE forSale = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_collection_value ON collection_items(currentValue DESC) WHERE currentValue IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_want_items_priority ON want_items(userId, priority);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_want_items_alerts ON want_items(emailAlerts) WHERE emailAlerts = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reports_urgent ON reports(priority, status) WHERE priority = 1 AND status = 'open';
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reports_unreviewed ON reports(status, createdAt) WHERE status = 'open';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_active ON user_sessions(userId, expiresAt) WHERE expiresAt > CURRENT_TIMESTAMP;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_cleanup ON user_sessions(expiresAt) WHERE expiresAt <= CURRENT_TIMESTAMP;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_webhook_pending ON webhook_events(processed, attempts) WHERE processed = false;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_webhook_failed ON webhook_events(attempts) WHERE attempts > 3;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_user_action ON audit_logs(userId, action, createdAt);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource, resourceId, createdAt);

-- 12. Create partial indexes for common queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_active_listings_by_seller 
ON listings(sellerId, createdAt DESC) 
WHERE status = 'active';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_recent_orders_by_user 
ON orders(userId, createdAt DESC) 
WHERE createdAt > CURRENT_DATE - INTERVAL '30 days';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pending_reports 
ON reports(createdAt DESC) 
WHERE status = 'open';

-- 13. Add database-level functions for common validations
CREATE OR REPLACE FUNCTION validate_listing_status_transition() 
RETURNS TRIGGER AS $$
BEGIN
  -- Prevent invalid status transitions
  IF OLD.status = 'sold' AND NEW.status != 'sold' THEN
    RAISE EXCEPTION 'Cannot change status of sold listing';
  END IF;
  
  IF NEW.status = 'sold' AND NEW.soldAt IS NULL THEN
    NEW.soldAt := CURRENT_TIMESTAMP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER listing_status_validation 
BEFORE UPDATE ON listings 
FOR EACH ROW 
EXECUTE FUNCTION validate_listing_status_transition();

-- 14. Create function to automatically expire old listings
CREATE OR REPLACE FUNCTION expire_old_listings() 
RETURNS void AS $$
BEGIN
  UPDATE listings 
  SET status = 'hidden', 
      updatedAt = CURRENT_TIMESTAMP
  WHERE status = 'active' 
    AND expiresAt IS NOT NULL 
    AND expiresAt < CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- 15. Create function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions() 
RETURNS void AS $$
BEGIN
  DELETE FROM user_sessions 
  WHERE expiresAt < CURRENT_TIMESTAMP - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- 16. Add comments to document constraints
COMMENT ON CONSTRAINT check_email_format ON users IS 'Ensures email follows valid format';
COMMENT ON CONSTRAINT check_price_positive ON listings IS 'Ensures listing price is always positive';
COMMENT ON CONSTRAINT check_amount_positive ON orders IS 'Ensures order amount is always positive';
COMMENT ON CONSTRAINT check_refund_amount_valid ON orders IS 'Ensures refund amount does not exceed original amount';

-- 17. Create views for common queries
CREATE OR REPLACE VIEW active_listings_with_comics AS
SELECT 
  l.id,
  l.price,
  l.createdAt,
  l.views,
  l.watchCount,
  c.title,
  c.series,
  c.issue,
  c.publisher,
  c.year,
  u.name as seller_name,
  u.email as seller_email
FROM listings l
JOIN comics c ON l.comicId = c.id
JOIN users u ON l.sellerId = u.id
WHERE l.status = 'active'
  AND u.suspended = false;

CREATE OR REPLACE VIEW user_collection_summary AS
SELECT 
  u.id as user_id,
  u.name,
  COUNT(ci.id) as total_items,
  COUNT(CASE WHEN ci.favorite = true THEN 1 END) as favorite_items,
  COUNT(CASE WHEN ci.forSale = true THEN 1 END) as items_for_sale,
  COALESCE(SUM(ci.paidPrice), 0) as total_paid,
  COALESCE(SUM(ci.currentValue), 0) as current_value
FROM users u
LEFT JOIN collection_items ci ON u.id = ci.userId
GROUP BY u.id, u.name;

-- 18. Final verification
DO $$
BEGIN
  RAISE NOTICE 'Database constraint enhancement migration completed successfully';
  RAISE NOTICE 'Added % check constraints', (
    SELECT COUNT(*) FROM information_schema.check_constraints 
    WHERE constraint_schema = current_schema()
  );
  RAISE NOTICE 'Added % indexes', (
    SELECT COUNT(*) FROM pg_indexes 
    WHERE schemaname = current_schema()
    AND indexname LIKE 'idx_%'
  );
END $$;