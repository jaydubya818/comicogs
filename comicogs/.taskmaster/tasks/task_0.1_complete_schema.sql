-- ==========================================
-- COMICOGS COMPLETE DATABASE SCHEMA (ERD Implementation)
-- Task 0.1: Complete SQL DDL for all 14 entities
-- ==========================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- ==========================================
-- CORE PUBLISHING ENTITIES
-- ==========================================

-- Publishers table
CREATE TABLE IF NOT EXISTS publishers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    founded_year INT,
    description TEXT,
    logo_url VARCHAR(255),
    website_url VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Series table
CREATE TABLE IF NOT EXISTS series (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    publisher_id INT NOT NULL,
    start_year INT,
    end_year INT,
    description TEXT,
    genre VARCHAR(100),
    status VARCHAR(50) DEFAULT 'ongoing', -- ongoing, completed, cancelled
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (publisher_id) REFERENCES publishers(id) ON DELETE CASCADE,
    UNIQUE(title, publisher_id, start_year)
);

-- Comics table (Master Issues)
CREATE TABLE IF NOT EXISTS comics (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    issue_number VARCHAR(50) NOT NULL,
    variant_name VARCHAR(255), -- for variant covers
    publisher_id INT NOT NULL,
    series_id INT,
    publication_date DATE,
    cover_date DATE,
    page_count INT,
    format VARCHAR(50), -- regular, annual, special, etc.
    upc VARCHAR(50),
    isbn VARCHAR(50),
    description TEXT,
    cover_image_url VARCHAR(255),
    creators JSONB, -- JSON array of creators with roles
    characters JSONB, -- JSON array of characters
    story_arcs JSONB, -- JSON array of story arcs
    key_issue_notes TEXT,
    cgc_id VARCHAR(50),
    cbcs_id VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (publisher_id) REFERENCES publishers(id) ON DELETE CASCADE,
    FOREIGN KEY (series_id) REFERENCES series(id) ON DELETE SET NULL,
    UNIQUE(title, issue_number, variant_name, publisher_id)
);

-- ==========================================
-- USER MANAGEMENT
-- ==========================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user', -- user, admin, moderator
    refresh_token TEXT, -- for JWT refresh token storage
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_verified BOOLEAN DEFAULT FALSE,
    profile_image_url VARCHAR(255),
    bio TEXT,
    location VARCHAR(255),
    privacy_settings JSONB DEFAULT '{"collection_public": true, "wantlist_public": true}'::jsonb
);

-- ==========================================
-- COLLECTION MANAGEMENT
-- ==========================================

-- Collections table (User's owned comics)
CREATE TABLE IF NOT EXISTS collections (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    comic_id INT NOT NULL,
    condition VARCHAR(50) NOT NULL, -- NM, VF, FN, etc.
    purchase_price DECIMAL(10, 2),
    current_value DECIMAL(10, 2),
    purchase_date DATE,
    acquired_date DATE DEFAULT CURRENT_DATE,
    notes TEXT,
    location VARCHAR(255), -- storage location
    reading_status VARCHAR(50) DEFAULT 'unread', -- read, unread, reading
    favorite BOOLEAN DEFAULT FALSE,
    for_sale BOOLEAN DEFAULT FALSE,
    sale_price DECIMAL(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (comic_id) REFERENCES comics(id) ON DELETE CASCADE,
    UNIQUE(user_id, comic_id)
);

-- User folders (Custom organization)
CREATE TABLE IF NOT EXISTS user_folders (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) DEFAULT 'custom', -- custom, series, publisher, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Folder collections (Many-to-many relationship)
CREATE TABLE IF NOT EXISTS folder_collections (
    id SERIAL PRIMARY KEY,
    folder_id INT NOT NULL,
    collection_id INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (folder_id) REFERENCES user_folders(id) ON DELETE CASCADE,
    FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE,
    UNIQUE(folder_id, collection_id)
);

-- ==========================================
-- WANTLIST MANAGEMENT
-- ==========================================

-- Wantlists table
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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (comic_id) REFERENCES comics(id) ON DELETE CASCADE,
    UNIQUE(user_id, comic_id)
);

-- ==========================================
-- MARKETPLACE
-- ==========================================

-- Marketplace listings table
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

-- Transactions table
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

-- ==========================================
-- PRICING INTELLIGENCE
-- ==========================================

-- Price history table (Sales data from internal marketplace)
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

-- Pricing data table (External marketplace intelligence from ComicComp)
CREATE TABLE IF NOT EXISTS pricing_data (
    id SERIAL PRIMARY KEY,
    comic_id INT NOT NULL,
    condition VARCHAR(50) NOT NULL,
    grade VARCHAR(10), -- CGC/CBCS grade if applicable
    current_price DECIMAL(10, 2),
    previous_price DECIMAL(10, 2),
    price_change_percentage DECIMAL(5, 2),
    market_trend VARCHAR(20), -- rising, falling, stable
    confidence_score DECIMAL(3, 2), -- 0.00 to 1.00
    source_marketplace VARCHAR(50) NOT NULL, -- ebay, heritage, mycomicshop, etc.
    last_sale_date DATE,
    sale_count_30d INT DEFAULT 0,
    avg_price_30d DECIMAL(10, 2),
    data_freshness TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (comic_id) REFERENCES comics(id) ON DELETE CASCADE,
    UNIQUE(comic_id, condition, grade, source_marketplace)
);

-- ==========================================
-- USER EXPERIENCE & AI
-- ==========================================

-- Price alerts table
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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (comic_id) REFERENCES comics(id) ON DELETE CASCADE
);

-- Search history table (for AI recommendations)
CREATE TABLE IF NOT EXISTS search_history (
    id SERIAL PRIMARY KEY,
    user_id INT,
    search_query TEXT NOT NULL,
    search_type VARCHAR(50), -- title, character, creator, etc.
    results_count INT,
    clicked_comic_id INT, -- track what users actually clicked
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (clicked_comic_id) REFERENCES comics(id) ON DELETE SET NULL
);

-- ==========================================
-- PERFORMANCE INDEXES
-- ==========================================

-- Core entity indexes
CREATE INDEX IF NOT EXISTS idx_publishers_name ON publishers(name);
CREATE INDEX IF NOT EXISTS idx_series_publisher ON series(publisher_id);
CREATE INDEX IF NOT EXISTS idx_series_title ON series(title);
CREATE INDEX IF NOT EXISTS idx_comics_publisher ON comics(publisher_id);
CREATE INDEX IF NOT EXISTS idx_comics_series ON comics(series_id);
CREATE INDEX IF NOT EXISTS idx_comics_title ON comics(title);
CREATE INDEX IF NOT EXISTS idx_comics_publication_date ON comics(publication_date);

-- User-centric indexes
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_collections_user ON collections(user_id);
CREATE INDEX IF NOT EXISTS idx_collections_comic ON collections(comic_id);
CREATE INDEX IF NOT EXISTS idx_wantlists_user ON wantlists(user_id);
CREATE INDEX IF NOT EXISTS idx_wantlists_comic ON wantlists(comic_id);

-- Marketplace indexes
CREATE INDEX IF NOT EXISTS idx_marketplace_status ON marketplace_listings(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_user ON marketplace_listings(user_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_comic ON marketplace_listings(comic_id);
CREATE INDEX IF NOT EXISTS idx_transactions_buyer ON transactions(buyer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_seller ON transactions(seller_id);
CREATE INDEX IF NOT EXISTS idx_transactions_listing ON transactions(listing_id);

-- Pricing indexes
CREATE INDEX IF NOT EXISTS idx_price_history_comic ON price_history(comic_id);
CREATE INDEX IF NOT EXISTS idx_price_history_date ON price_history(sale_date);
CREATE INDEX IF NOT EXISTS idx_pricing_data_comic ON pricing_data(comic_id);
CREATE INDEX IF NOT EXISTS idx_pricing_data_freshness ON pricing_data(data_freshness);

-- User experience indexes
CREATE INDEX IF NOT EXISTS idx_price_alerts_user ON price_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_price_alerts_comic ON price_alerts(comic_id);
CREATE INDEX IF NOT EXISTS idx_search_history_user ON search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_folders_user ON user_folders(user_id);

-- ==========================================
-- SAMPLE DATA FOR TESTING
-- ==========================================

-- Insert sample publishers
INSERT INTO publishers (name, founded_year, description) VALUES 
('Marvel Comics', 1939, 'Marvel Comics is an American comic book publisher'),
('DC Comics', 1934, 'DC Comics is an American comic book publisher'),
('Image Comics', 1992, 'Image Comics is an American comic book publisher'),
('Dark Horse Comics', 1986, 'Dark Horse Comics is an American comic book publisher')
ON CONFLICT (name) DO NOTHING;

-- Insert sample series
INSERT INTO series (title, publisher_id, start_year, description, genre) VALUES 
('The Amazing Spider-Man', 1, 1963, 'Spider-Man ongoing series', 'Superhero'),
('Batman', 2, 1940, 'Batman ongoing series', 'Superhero'),
('The Walking Dead', 3, 2003, 'Post-apocalyptic horror series', 'Horror'),
('Hellboy', 4, 1993, 'Paranormal adventure series', 'Supernatural')
ON CONFLICT (title, publisher_id, start_year) DO NOTHING;

-- Insert sample comics
INSERT INTO comics (title, issue_number, publisher_id, series_id, publication_date, cover_date, description, characters) VALUES 
('The Amazing Spider-Man', '1', 1, 1, '1963-03-01', '1963-03-01', 'First appearance of Spider-Man', '["Spider-Man", "J. Jonah Jameson"]'),
('Batman', '1', 2, 2, '1940-04-01', '1940-04-01', 'First appearance of Batman', '["Batman", "Commissioner Gordon"]'),
('The Walking Dead', '1', 3, 3, '2003-10-01', '2003-10-01', 'First issue of The Walking Dead', '["Rick Grimes", "Morgan Jones"]'),
('Hellboy', '1', 4, 4, '1993-03-01', '1993-03-01', 'First appearance of Hellboy', '["Hellboy", "Professor Bruttenholm"]')
ON CONFLICT (title, issue_number, variant_name, publisher_id) DO NOTHING; 