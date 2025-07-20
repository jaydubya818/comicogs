-- ==========================================
-- COMICOGS ENHANCED DATABASE SCHEMA
-- Task 13: Comic Database & Release Management System
-- Modeled after Discogs database structure
-- ==========================================

-- Drop existing tables in correct order
DROP TABLE IF EXISTS comic_creator_roles CASCADE;
DROP TABLE IF EXISTS comic_characters CASCADE;
DROP TABLE IF EXISTS comic_story_arcs CASCADE;
DROP TABLE IF EXISTS comic_genres CASCADE;
DROP TABLE IF EXISTS comic_formats CASCADE;
DROP TABLE IF EXISTS comic_variants CASCADE;
DROP TABLE IF EXISTS comic_identifiers CASCADE;
DROP TABLE IF EXISTS creator_aliases CASCADE;
DROP TABLE IF EXISTS creator_urls CASCADE;
DROP TABLE IF EXISTS creator_images CASCADE;
DROP TABLE IF EXISTS series_creators CASCADE;
DROP TABLE IF EXISTS publisher_creators CASCADE;
DROP TABLE IF EXISTS price_history CASCADE;
DROP TABLE IF EXISTS marketplace_listings CASCADE;
DROP TABLE IF EXISTS wantlists CASCADE;
DROP TABLE IF EXISTS collections CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS comics CASCADE;
DROP TABLE IF EXISTS series CASCADE;
DROP TABLE IF EXISTS creators CASCADE;
DROP TABLE IF EXISTS publishers CASCADE;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ==========================================
-- CORE ENTITIES (like Discogs Artists, Labels, Masters, Releases)
-- ==========================================

-- Publishers table (like Discogs Labels)
CREATE TABLE publishers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    sort_name VARCHAR(255), -- for alphabetical sorting
    founded_year INT,
    ended_year INT,
    description TEXT,
    logo_url VARCHAR(255),
    website_url VARCHAR(255),
    parent_publisher_id INT, -- for subsidiaries
    country VARCHAR(2), -- ISO country code
    type VARCHAR(50) DEFAULT 'publisher', -- publisher, imprint, distributor
    status VARCHAR(50) DEFAULT 'active', -- active, defunct, unknown
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_publisher_id) REFERENCES publishers(id) ON DELETE SET NULL
);

-- Creators table (like Discogs Artists)
CREATE TABLE creators (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    sort_name VARCHAR(255), -- for alphabetical sorting (Last, First)
    legal_name VARCHAR(255), -- real name if different from pen name
    birth_date DATE,
    death_date DATE,
    biography TEXT,
    country VARCHAR(2), -- ISO country code  
    gender VARCHAR(10),
    profile_image_url VARCHAR(255),
    website_url VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active', -- active, deceased, unknown
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Creator aliases (like Discogs Artist Name Variations)
CREATE TABLE creator_aliases (
    id SERIAL PRIMARY KEY,
    creator_id INT NOT NULL,
    alias_name VARCHAR(255) NOT NULL,
    alias_type VARCHAR(50), -- pen_name, nickname, misspelling, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (creator_id) REFERENCES creators(id) ON DELETE CASCADE,
    UNIQUE(creator_id, alias_name)
);

-- Creator URLs (social media, portfolios, etc.)
CREATE TABLE creator_urls (
    id SERIAL PRIMARY KEY,
    creator_id INT NOT NULL,
    url VARCHAR(500) NOT NULL,
    url_type VARCHAR(50), -- website, twitter, instagram, artstation, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (creator_id) REFERENCES creators(id) ON DELETE CASCADE
);

-- Creator images 
CREATE TABLE creator_images (
    id SERIAL PRIMARY KEY,
    creator_id INT NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    image_type VARCHAR(50) DEFAULT 'photo', -- photo, artwork, etc.
    caption TEXT,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (creator_id) REFERENCES creators(id) ON DELETE CASCADE
);

-- Series table (like Discogs Masters)
CREATE TABLE series (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    sort_title VARCHAR(255), -- for alphabetical sorting
    publisher_id INT NOT NULL,
    start_year INT,
    end_year INT,
    description TEXT,
    genre VARCHAR(100),
    status VARCHAR(50) DEFAULT 'ongoing', -- ongoing, completed, cancelled, hiatus
    issue_count INT DEFAULT 0, -- total number of issues
    country VARCHAR(2), -- ISO country code
    language VARCHAR(10) DEFAULT 'en', -- ISO language code
    format VARCHAR(50), -- ongoing, limited, mini, one-shot, graphic_novel
    age_rating VARCHAR(20), -- all_ages, teen, mature, adults_only
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (publisher_id) REFERENCES publishers(id) ON DELETE CASCADE
);

-- Comics table (like Discogs Releases)
CREATE TABLE comics (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    issue_number VARCHAR(50) NOT NULL,
    volume INT DEFAULT 1, -- for series reboots
    publisher_id INT NOT NULL,
    series_id INT,
    publication_date DATE,
    cover_date DATE, -- date printed on cover
    on_sale_date DATE, -- actual release date
    page_count INT,
    description TEXT,
    isbn VARCHAR(17), -- ISBN-13 format
    upc VARCHAR(12), -- UPC barcode
    diamond_code VARCHAR(20), -- Diamond Comics code
    cover_price DECIMAL(6,2), -- original cover price
    reprint_of INT, -- references another comic if this is a reprint
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (publisher_id) REFERENCES publishers(id) ON DELETE CASCADE,
    FOREIGN KEY (series_id) REFERENCES series(id) ON DELETE SET NULL,
    FOREIGN KEY (reprint_of) REFERENCES comics(id) ON DELETE SET NULL
);

-- Comic variants (like Discogs Release formats)
CREATE TABLE comic_variants (
    id SERIAL PRIMARY KEY,
    comic_id INT NOT NULL,
    variant_name VARCHAR(255), -- "Cover A", "1:25 Variant", "Sketch Cover"
    variant_type VARCHAR(50), -- cover, incentive, sketch, blank, etc.
    cover_image_url VARCHAR(500),
    print_run INT, -- how many copies printed
    rarity_ratio VARCHAR(20), -- "1:25", "1:100", etc.
    is_primary BOOLEAN DEFAULT FALSE, -- main cover
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (comic_id) REFERENCES comics(id) ON DELETE CASCADE
);

-- Comic formats (newsstand, direct, digital, etc.)
CREATE TABLE comic_formats (
    id SERIAL PRIMARY KEY,
    comic_id INT NOT NULL,
    format_name VARCHAR(50) NOT NULL, -- newsstand, direct, digital, hardcover, paperback
    format_details JSONB, -- additional format-specific data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (comic_id) REFERENCES comics(id) ON DELETE CASCADE
);

-- Comic identifiers (barcodes, ISBNs, etc.)
CREATE TABLE comic_identifiers (
    id SERIAL PRIMARY KEY,
    comic_id INT NOT NULL,
    identifier_type VARCHAR(50) NOT NULL, -- isbn, upc, diamond_code, etc.
    identifier_value VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (comic_id) REFERENCES comics(id) ON DELETE CASCADE,
    UNIQUE(comic_id, identifier_type, identifier_value)
);

-- Comic creator roles (like Discogs Release Artists)
CREATE TABLE comic_creator_roles (
    id SERIAL PRIMARY KEY,
    comic_id INT NOT NULL,
    creator_id INT NOT NULL,
    role VARCHAR(50) NOT NULL, -- writer, penciler, inker, colorist, letterer, cover, editor
    credited_as VARCHAR(255), -- name as credited in comic (if different)
    role_details TEXT, -- additional details about the role
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (comic_id) REFERENCES comics(id) ON DELETE CASCADE,
    FOREIGN KEY (creator_id) REFERENCES creators(id) ON DELETE CASCADE
);

-- Comic characters
CREATE TABLE comic_characters (
    id SERIAL PRIMARY KEY,
    comic_id INT NOT NULL,
    character_name VARCHAR(255) NOT NULL,
    character_type VARCHAR(50), -- main, supporting, villain, cameo
    first_appearance BOOLEAN DEFAULT FALSE,
    death BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (comic_id) REFERENCES comics(id) ON DELETE CASCADE
);

-- Comic story arcs
CREATE TABLE comic_story_arcs (
    id SERIAL PRIMARY KEY,
    comic_id INT NOT NULL,
    story_arc_name VARCHAR(255) NOT NULL,
    part_number INT, -- which part of the story arc
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (comic_id) REFERENCES comics(id) ON DELETE CASCADE
);

-- Comic genres
CREATE TABLE comic_genres (
    id SERIAL PRIMARY KEY,
    comic_id INT NOT NULL,
    genre VARCHAR(100) NOT NULL, -- superhero, horror, sci-fi, romance, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (comic_id) REFERENCES comics(id) ON DELETE CASCADE
);

-- ==========================================
-- USER MANAGEMENT
-- ==========================================

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user', -- user, admin, moderator
    refresh_token TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_verified BOOLEAN DEFAULT FALSE,
    profile_image_url VARCHAR(255),
    bio TEXT,
    location VARCHAR(255),
    birth_date DATE,
    website_url VARCHAR(255),
    privacy_settings JSONB DEFAULT '{"collection_public": true, "wantlist_public": true}'::jsonb
);

-- ==========================================
-- COLLECTION & MARKETPLACE TABLES
-- ==========================================

-- Collections table
CREATE TABLE collections (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    comic_id INT NOT NULL,
    variant_id INT, -- specific variant owned
    condition VARCHAR(50) NOT NULL, -- MT, NM, VF, FN, VG, GD, FR, PR
    grade DECIMAL(3,1), -- CGC/CBCS grade if professionally graded
    grading_company VARCHAR(20), -- CGC, CBCS, PGX, etc.
    certification_number VARCHAR(50), -- grading cert number
    purchase_price DECIMAL(10,2),
    current_value DECIMAL(10,2),
    purchase_date DATE,
    acquired_from VARCHAR(255), -- where/how acquired
    storage_location VARCHAR(255),
    notes TEXT,
    reading_status VARCHAR(50) DEFAULT 'unread', -- unread, reading, read
    favorite BOOLEAN DEFAULT FALSE,
    for_sale BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (comic_id) REFERENCES comics(id) ON DELETE CASCADE,
    FOREIGN KEY (variant_id) REFERENCES comic_variants(id) ON DELETE SET NULL,
    UNIQUE(user_id, comic_id, variant_id)
);

-- Wantlists table
CREATE TABLE wantlists (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    comic_id INT NOT NULL,
    variant_id INT, -- specific variant wanted
    max_price DECIMAL(10,2),
    min_condition VARCHAR(50) DEFAULT 'FN',
    min_grade DECIMAL(3,1), -- minimum professional grade
    priority INT DEFAULT 1, -- 1=low, 5=high
    notes TEXT,
    notifications_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (comic_id) REFERENCES comics(id) ON DELETE CASCADE,
    FOREIGN KEY (variant_id) REFERENCES comic_variants(id) ON DELETE SET NULL,
    UNIQUE(user_id, comic_id, variant_id)
);

-- Marketplace listings table
CREATE TABLE marketplace_listings (
    id SERIAL PRIMARY KEY,
    seller_id INT NOT NULL,
    comic_id INT NOT NULL,
    variant_id INT, -- specific variant being sold
    price DECIMAL(10,2) NOT NULL,
    condition VARCHAR(50) NOT NULL,
    grade DECIMAL(3,1), -- professional grade if applicable
    grading_company VARCHAR(20),
    certification_number VARCHAR(50),
    description TEXT,
    images JSONB, -- array of image URLs
    shipping_cost DECIMAL(6,2),
    status VARCHAR(50) DEFAULT 'active', -- active, sold, cancelled
    views_count INT DEFAULT 0,
    watchers_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (comic_id) REFERENCES comics(id) ON DELETE CASCADE,
    FOREIGN KEY (variant_id) REFERENCES comic_variants(id) ON DELETE SET NULL
);

-- Price history table
CREATE TABLE price_history (
    id SERIAL PRIMARY KEY,
    comic_id INT NOT NULL,
    variant_id INT,
    condition VARCHAR(50) NOT NULL,
    grade DECIMAL(3,1),
    price DECIMAL(10,2) NOT NULL,
    sale_date DATE NOT NULL,
    sale_type VARCHAR(50), -- auction, fixed_price, best_offer
    source VARCHAR(100), -- ebay, heritage, comicconnect, etc.
    marketplace VARCHAR(100),
    seller_feedback_score INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (comic_id) REFERENCES comics(id) ON DELETE CASCADE,
    FOREIGN KEY (variant_id) REFERENCES comic_variants(id) ON DELETE SET NULL
);

-- ==========================================
-- INDEXES FOR PERFORMANCE
-- ==========================================

-- Publisher indexes
CREATE INDEX idx_publishers_name ON publishers(name);
CREATE INDEX idx_publishers_parent ON publishers(parent_publisher_id);

-- Creator indexes
CREATE INDEX idx_creators_name ON creators(name);
CREATE INDEX idx_creators_sort_name ON creators(sort_name);
CREATE INDEX idx_creator_aliases_name ON creator_aliases(alias_name);

-- Series indexes
CREATE INDEX idx_series_title ON series(title);
CREATE INDEX idx_series_publisher ON series(publisher_id);
CREATE INDEX idx_series_start_year ON series(start_year);

-- Comic indexes
CREATE INDEX idx_comics_title ON comics(title);
CREATE INDEX idx_comics_issue_number ON comics(issue_number);
CREATE INDEX idx_comics_publisher ON comics(publisher_id);
CREATE INDEX idx_comics_series ON comics(series_id);
CREATE INDEX idx_comics_publication_date ON comics(publication_date);
CREATE INDEX idx_comics_cover_date ON comics(cover_date);

-- Collection indexes
CREATE INDEX idx_collections_user ON collections(user_id);
CREATE INDEX idx_collections_comic ON collections(comic_id);
CREATE INDEX idx_collections_condition ON collections(condition);

-- Marketplace indexes
CREATE INDEX idx_marketplace_comic ON marketplace_listings(comic_id);
CREATE INDEX idx_marketplace_seller ON marketplace_listings(seller_id);
CREATE INDEX idx_marketplace_status ON marketplace_listings(status);
CREATE INDEX idx_marketplace_price ON marketplace_listings(price);

-- Price history indexes
CREATE INDEX idx_price_history_comic ON price_history(comic_id);
CREATE INDEX idx_price_history_date ON price_history(sale_date);
CREATE INDEX idx_price_history_condition ON price_history(condition);

-- Wantlist indexes
CREATE INDEX idx_wantlists_user ON wantlists(user_id);
CREATE INDEX idx_wantlists_comic ON wantlists(comic_id);

-- Full text search indexes
CREATE INDEX idx_comics_fulltext ON comics USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));
CREATE INDEX idx_series_fulltext ON series USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));
CREATE INDEX idx_creators_fulltext ON creators USING gin(to_tsvector('english', name || ' ' || COALESCE(legal_name, '') || ' ' || COALESCE(biography, '')));
CREATE INDEX idx_publishers_fulltext ON publishers USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));

COMMIT; 