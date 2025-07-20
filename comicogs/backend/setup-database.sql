-- ==========================================
-- COMICOGS DATABASE SETUP WITH SAMPLE DATA
-- ==========================================

-- Drop existing tables in correct order (reverse dependency order)
DROP TABLE IF EXISTS search_history CASCADE;
DROP TABLE IF EXISTS price_alerts CASCADE;
DROP TABLE IF EXISTS folder_collections CASCADE;
DROP TABLE IF EXISTS user_folders CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS marketplace_listings CASCADE;
DROP TABLE IF EXISTS pricing_data CASCADE;
DROP TABLE IF EXISTS price_history CASCADE;
DROP TABLE IF EXISTS wantlists CASCADE;
DROP TABLE IF EXISTS collections CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS comics CASCADE;
DROP TABLE IF EXISTS series CASCADE;
DROP TABLE IF EXISTS publishers CASCADE;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ==========================================
-- CORE PUBLISHING ENTITIES
-- ==========================================

-- Publishers table
CREATE TABLE publishers (
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
CREATE TABLE series (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    publisher_id INT NOT NULL,
    start_year INT,
    end_year INT,
    description TEXT,
    genre VARCHAR(100),
    status VARCHAR(50) DEFAULT 'ongoing',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (publisher_id) REFERENCES publishers(id) ON DELETE CASCADE
);

-- Comics table
CREATE TABLE comics (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    issue_number VARCHAR(50) NOT NULL,
    variant_name VARCHAR(255),
    publisher_id INT NOT NULL,
    series_id INT,
    publication_date DATE,
    cover_date DATE,
    page_count INT,
    format VARCHAR(50) DEFAULT 'regular',
    description TEXT,
    cover_image_url VARCHAR(255),
    creators JSONB DEFAULT '[]'::jsonb,
    characters JSONB DEFAULT '[]'::jsonb,
    story_arcs JSONB DEFAULT '[]'::jsonb,
    key_issue_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (publisher_id) REFERENCES publishers(id) ON DELETE CASCADE,
    FOREIGN KEY (series_id) REFERENCES series(id) ON DELETE SET NULL
);

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    refresh_token TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_verified BOOLEAN DEFAULT FALSE,
    profile_image_url VARCHAR(255),
    bio TEXT,
    location VARCHAR(255)
);

-- Collections table
CREATE TABLE collections (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    comic_id INT NOT NULL,
    condition VARCHAR(50) NOT NULL,
    purchase_price DECIMAL(10,2),
    current_value DECIMAL(10,2),
    purchase_date DATE,
    acquired_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    location VARCHAR(255),
    reading_status VARCHAR(50) DEFAULT 'unread',
    favorite BOOLEAN DEFAULT FALSE,
    for_sale BOOLEAN DEFAULT FALSE,
    sale_price DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (comic_id) REFERENCES comics(id) ON DELETE CASCADE,
    UNIQUE(user_id, comic_id)
);

-- Wantlists table
CREATE TABLE wantlists (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    comic_id INT NOT NULL,
    max_price DECIMAL(10,2),
    min_condition VARCHAR(50) DEFAULT 'FN',
    priority INT DEFAULT 1,
    notes TEXT,
    notifications_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (comic_id) REFERENCES comics(id) ON DELETE CASCADE,
    UNIQUE(user_id, comic_id)
);

-- Price history table
CREATE TABLE price_history (
    id SERIAL PRIMARY KEY,
    comic_id INT NOT NULL,
    condition VARCHAR(50) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    sale_date DATE NOT NULL,
    source VARCHAR(100),
    marketplace VARCHAR(100),
    grade DECIMAL(3,1),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (comic_id) REFERENCES comics(id) ON DELETE CASCADE
);

-- Marketplace listings table
CREATE TABLE marketplace_listings (
    id SERIAL PRIMARY KEY,
    seller_id INT NOT NULL,
    comic_id INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    condition VARCHAR(50) NOT NULL,
    grade VARCHAR(20),
    description TEXT,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (comic_id) REFERENCES comics(id) ON DELETE CASCADE
);

-- ==========================================
-- SAMPLE DATA INSERTION
-- ==========================================

-- Insert Publishers
INSERT INTO publishers (name, founded_year, description) VALUES
('Marvel Comics', 1939, 'American comic book publisher and subsidiary of The Walt Disney Company'),
('DC Comics', 1934, 'American comic book publisher and subsidiary of Warner Bros. Discovery'),
('Image Comics', 1992, 'American comic book publisher founded by several high-profile illustrators'),
('Dark Horse Comics', 1986, 'American comic book and manga publisher founded by Mike Richardson');

-- Insert Series
INSERT INTO series (title, publisher_id, start_year, description, genre) VALUES
('Amazing Spider-Man', 1, 1963, 'The adventures of Peter Parker, the Amazing Spider-Man', 'Superhero'),
('Batman', 2, 1940, 'The Dark Knight of Gotham City', 'Superhero'),
('The Walking Dead', 3, 2003, 'Post-apocalyptic horror survival story', 'Horror'),
('Hellboy', 4, 1993, 'Paranormal investigator from Hell', 'Supernatural');

-- Insert Comics
INSERT INTO comics (title, issue_number, variant_name, publisher_id, series_id, publication_date, cover_date, page_count, description, cover_image_url, creators, characters, story_arcs, key_issue_notes) VALUES
('Amazing Spider-Man', '300', 'Direct Edition', 1, 1, '1988-05-01', '1988-05-01', 22, 'First full appearance of Venom', '/placeholder-comic.jpg', '[{"name": "David Michelinie", "role": "writer"}, {"name": "Todd McFarlane", "role": "artist"}]'::jsonb, '["Spider-Man", "Venom", "Peter Parker"]'::jsonb, '["Venom Saga"]'::jsonb, 'First full appearance of Venom (Eddie Brock)'),
('Batman', '1', 'Original', 2, 2, '1940-04-25', '1940-04-25', 64, 'The first appearance of Batman and Joker', '/placeholder-comic.jpg', '[{"name": "Bob Kane", "role": "artist"}, {"name": "Bill Finger", "role": "writer"}]'::jsonb, '["Batman", "Joker", "Bruce Wayne"]'::jsonb, '["Batman Origin"]'::jsonb, 'First appearance of Batman and Joker'),
('The Walking Dead', '1', 'Black and White', 3, 3, '2003-10-01', '2003-10-01', 22, 'First appearance of Rick Grimes in the zombie apocalypse', '/placeholder-comic.jpg', '[{"name": "Robert Kirkman", "role": "writer"}, {"name": "Tony Moore", "role": "artist"}]'::jsonb, '["Rick Grimes", "Shane Walsh"]'::jsonb, '["Days Gone Bye"]'::jsonb, 'First appearance of Rick Grimes'),
('Hellboy', '1', 'Seed of Destruction', 4, 4, '1994-03-01', '1994-03-01', 22, 'First comic appearance of Hellboy', '/placeholder-comic.jpg', '[{"name": "Mike Mignola", "role": "writer"}, {"name": "Mike Mignola", "role": "artist"}]'::jsonb, '["Hellboy", "Professor Bruttenholm"]'::jsonb, '["Seed of Destruction"]'::jsonb, 'First comic appearance of Hellboy'),
('Amazing Spider-Man', '1', 'Reprint', 1, 1, '1963-03-01', '1963-03-01', 11, 'First appearance of Spider-Man in his own title', '/placeholder-comic.jpg', '[{"name": "Stan Lee", "role": "writer"}, {"name": "Steve Ditko", "role": "artist"}]'::jsonb, '["Spider-Man", "J. Jonah Jameson", "Chameleon"]'::jsonb, '["Spider-Man Origin"]'::jsonb, 'First appearance in own title'),
('X-Men', '1', 'Original', 1, NULL, '1963-09-01', '1963-09-01', 22, 'First appearance of the X-Men', '/placeholder-comic.jpg', '[{"name": "Stan Lee", "role": "writer"}, {"name": "Jack Kirby", "role": "artist"}]'::jsonb, '["Professor X", "Cyclops", "Beast", "Angel", "Iceman", "Marvel Girl"]'::jsonb, '["X-Men Origin"]'::jsonb, 'First appearance of the X-Men'),
('Incredible Hulk', '181', 'Newsstand', 1, NULL, '1974-11-01', '1974-11-01', 22, 'First full appearance of Wolverine', '/placeholder-comic.jpg', '[{"name": "Len Wein", "role": "writer"}, {"name": "Herb Trimpe", "role": "artist"}]'::jsonb, '["Hulk", "Wolverine", "Wendigo"]'::jsonb, '["Wolverine Debut"]'::jsonb, 'First full appearance of Wolverine'),
('Superman', '1', 'Original', 2, NULL, '1939-04-18', '1939-04-18', 64, 'First appearance of Superman', '/placeholder-comic.jpg', '[{"name": "Jerry Siegel", "role": "writer"}, {"name": "Joe Shuster", "role": "artist"}]'::jsonb, '["Superman", "Clark Kent", "Lois Lane"]'::jsonb, '["Superman Origin"]'::jsonb, 'First appearance of Superman');

-- Insert Sample Price History
INSERT INTO price_history (comic_id, condition, price, sale_date, source, marketplace, grade) VALUES
(1, 'NM', 1250.00, '2024-01-15', 'Heritage Auctions', 'heritage', 9.8),
(1, 'VF', 850.00, '2024-01-10', 'eBay', 'ebay', 8.5),
(2, 'GD', 125000.00, '2023-12-01', 'Heritage Auctions', 'heritage', 3.0),
(3, 'NM', 4500.00, '2024-01-20', 'ComicConnect', 'comicconnect', 9.6),
(4, 'VF', 1200.00, '2024-01-18', 'eBay', 'ebay', 8.0),
(5, 'VG', 25000.00, '2023-11-15', 'Heritage Auctions', 'heritage', 4.0),
(6, 'NM', 145000.00, '2023-10-30', 'Heritage Auctions', 'heritage', 9.0),
(7, 'VF', 12500.00, '2024-01-12', 'ComicConnect', 'comicconnect', 8.0);

-- Create indexes for performance
CREATE INDEX idx_comics_title ON comics(title);
CREATE INDEX idx_comics_publisher ON comics(publisher_id);
CREATE INDEX idx_comics_series ON comics(series_id);
CREATE INDEX idx_comics_publication_date ON comics(publication_date);
CREATE INDEX idx_collections_user ON collections(user_id);
CREATE INDEX idx_collections_comic ON collections(comic_id);
CREATE INDEX idx_wantlists_user ON wantlists(user_id);
CREATE INDEX idx_price_history_comic ON price_history(comic_id);
CREATE INDEX idx_marketplace_listings_seller ON marketplace_listings(seller_id);
CREATE INDEX idx_marketplace_listings_comic ON marketplace_listings(comic_id);

-- Full text search indexes
CREATE INDEX idx_comics_fulltext ON comics USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));
CREATE INDEX idx_series_fulltext ON series USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));

COMMIT; 