-- Migration 002: Create new tables for marketplace and advanced features

-- Wantlist Table
CREATE TABLE IF NOT EXISTS wantlists (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    comic_id INT NOT NULL,
    max_price DECIMAL(10, 2),
    min_condition VARCHAR(50),
    priority INT DEFAULT 1, -- 1-5 priority scale
    notes TEXT,
    notifications_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (comic_id) REFERENCES comics(id) ON DELETE CASCADE,
    UNIQUE(user_id, comic_id)
);

-- Marketplace Listings Table
CREATE TABLE IF NOT EXISTS marketplace_listings (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    comic_id INT NOT NULL,
    collection_id INT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    condition VARCHAR(50) NOT NULL,
    description TEXT,
    images JSONB, -- JSON array of image URLs
    shipping_cost DECIMAL(10, 2),
    international_shipping BOOLEAN DEFAULT FALSE,
    status VARCHAR(50) DEFAULT 'active', -- active, sold, cancelled
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (comic_id) REFERENCES comics(id) ON DELETE CASCADE,
    FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE
);

-- Price History Table
CREATE TABLE IF NOT EXISTS price_history (
    id SERIAL PRIMARY KEY,
    comic_id INT NOT NULL,
    condition VARCHAR(50) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    source VARCHAR(50) NOT NULL, -- comicogs, ebay, heritage, etc.
    sale_date DATE NOT NULL,
    graded_by VARCHAR(50), -- CGC, CBCS, etc.
    grade VARCHAR(10), -- 9.8, 9.6, etc.
    source_url VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (comic_id) REFERENCES comics(id) ON DELETE CASCADE
);

-- Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    listing_id INT NOT NULL,
    buyer_id INT NOT NULL,
    seller_id INT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    shipping_cost DECIMAL(10, 2),
    total_amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50),
    payment_status VARCHAR(50) DEFAULT 'pending',
    shipping_status VARCHAR(50) DEFAULT 'pending',
    tracking_number VARCHAR(255),
    escrow_released BOOLEAN DEFAULT FALSE,
    buyer_rating INT CHECK (buyer_rating >= 1 AND buyer_rating <= 5),
    seller_rating INT CHECK (seller_rating >= 1 AND seller_rating <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    FOREIGN KEY (listing_id) REFERENCES marketplace_listings(id) ON DELETE CASCADE,
    FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE
);

-- User Folders (Custom organization)
CREATE TABLE IF NOT EXISTS user_folders (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) DEFAULT 'custom', -- custom, series, publisher, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Folder Collections (Many-to-many)
CREATE TABLE IF NOT EXISTS folder_collections (
    id SERIAL PRIMARY KEY,
    folder_id INT NOT NULL,
    collection_id INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (folder_id) REFERENCES user_folders(id) ON DELETE CASCADE,
    FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE,
    UNIQUE(folder_id, collection_id)
);

-- Price Alerts Table
CREATE TABLE IF NOT EXISTS price_alerts (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    comic_id INT NOT NULL,
    condition VARCHAR(50),
    target_price DECIMAL(10, 2) NOT NULL,
    alert_type VARCHAR(50) DEFAULT 'below', -- below, above
    active BOOLEAN DEFAULT TRUE,
    last_triggered TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (comic_id) REFERENCES comics(id) ON DELETE CASCADE
);

-- Search History Table (for AI recommendations)
CREATE TABLE IF NOT EXISTS search_history (
    id SERIAL PRIMARY KEY,
    user_id INT,
    search_query TEXT NOT NULL,
    search_type VARCHAR(50), -- title, character, creator, etc.
    results_count INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for new tables
CREATE INDEX IF NOT EXISTS idx_wantlists_user ON wantlists(user_id);
CREATE INDEX IF NOT EXISTS idx_wantlists_comic ON wantlists(comic_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_status ON marketplace_listings(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_user ON marketplace_listings(user_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_comic ON marketplace_listings(comic_id);
CREATE INDEX IF NOT EXISTS idx_price_history_comic ON price_history(comic_id);
CREATE INDEX IF NOT EXISTS idx_price_history_date ON price_history(sale_date);
CREATE INDEX IF NOT EXISTS idx_transactions_buyer ON transactions(buyer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_seller ON transactions(seller_id);
CREATE INDEX IF NOT EXISTS idx_price_alerts_user ON price_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_search_history_user ON search_history(user_id);

-- Add some sample price history data
INSERT INTO price_history (comic_id, condition, price, source, sale_date) VALUES
(1, 'NM', 25000.00, 'heritage', '2024-01-15'),
(1, 'VF', 15000.00, 'ebay', '2024-01-20'),
(2, 'NM', 35000.00, 'heritage', '2024-02-01'),
(2, 'VF', 22000.00, 'ebay', '2024-02-05'),
(3, 'NM', 2500.00, 'comicogs', '2024-01-10'),
(4, 'NM', 800.00, 'comicogs', '2024-01-25');

-- Add some sample wantlist entries for the test user
INSERT INTO wantlists (user_id, comic_id, max_price, min_condition, priority, notes) VALUES
(1, 2, 20000.00, 'VF', 5, 'Holy grail comic - Batman #1'),
(1, 3, 1500.00, 'NM', 3, 'Love The Walking Dead series'),
(1, 4, 500.00, 'VF', 2, 'Hellboy collection completion'); 