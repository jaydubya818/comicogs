-- Migration 001: Enhance existing schema
-- Add missing columns to existing tables

-- Enhance users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image_url VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS location VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS privacy_settings JSONB DEFAULT '{"collection_public": true, "wantlist_public": true}'::jsonb;

-- Enhance publishers table
ALTER TABLE publishers ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE publishers ADD COLUMN IF NOT EXISTS logo_url VARCHAR(255);
ALTER TABLE publishers ADD COLUMN IF NOT EXISTS website_url VARCHAR(255);
ALTER TABLE publishers ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Enhance series table
ALTER TABLE series ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE series ADD COLUMN IF NOT EXISTS genre VARCHAR(100);
ALTER TABLE series ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'ongoing';
ALTER TABLE series ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Enhance comics table
ALTER TABLE comics ADD COLUMN IF NOT EXISTS variant_name VARCHAR(255);
ALTER TABLE comics ADD COLUMN IF NOT EXISTS publication_date DATE;
ALTER TABLE comics ADD COLUMN IF NOT EXISTS cover_date DATE;
ALTER TABLE comics ADD COLUMN IF NOT EXISTS page_count INT;
ALTER TABLE comics ADD COLUMN IF NOT EXISTS format VARCHAR(50);
ALTER TABLE comics ADD COLUMN IF NOT EXISTS upc VARCHAR(50);
ALTER TABLE comics ADD COLUMN IF NOT EXISTS isbn VARCHAR(50);
ALTER TABLE comics ADD COLUMN IF NOT EXISTS creators JSONB;
ALTER TABLE comics ADD COLUMN IF NOT EXISTS characters JSONB;
ALTER TABLE comics ADD COLUMN IF NOT EXISTS story_arcs JSONB;
ALTER TABLE comics ADD COLUMN IF NOT EXISTS key_issue_notes TEXT;
ALTER TABLE comics ADD COLUMN IF NOT EXISTS cgc_id VARCHAR(50);
ALTER TABLE comics ADD COLUMN IF NOT EXISTS cbcs_id VARCHAR(50);
ALTER TABLE comics ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Enhance collections table
ALTER TABLE collections ADD COLUMN IF NOT EXISTS current_value DECIMAL(10, 2);
ALTER TABLE collections ADD COLUMN IF NOT EXISTS purchase_date DATE;
ALTER TABLE collections ADD COLUMN IF NOT EXISTS location VARCHAR(255);
ALTER TABLE collections ADD COLUMN IF NOT EXISTS reading_status VARCHAR(50) DEFAULT 'unread';
ALTER TABLE collections ADD COLUMN IF NOT EXISTS favorite BOOLEAN DEFAULT FALSE;
ALTER TABLE collections ADD COLUMN IF NOT EXISTS for_sale BOOLEAN DEFAULT FALSE;
ALTER TABLE collections ADD COLUMN IF NOT EXISTS sale_price DECIMAL(10, 2);
ALTER TABLE collections ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Update sample data in publishers
UPDATE publishers SET description = 'Marvel Comics is an American comic book publisher' WHERE name = 'Marvel Comics';
UPDATE publishers SET description = 'DC Comics is an American comic book publisher' WHERE name = 'DC Comics';
UPDATE publishers SET description = 'Image Comics is an American comic book publisher' WHERE name = 'Image Comics';
UPDATE publishers SET description = 'Dark Horse Comics is an American comic book publisher' WHERE name = 'Dark Horse Comics';

-- Update sample data in series
UPDATE series SET description = 'Spider-Man ongoing series', genre = 'Superhero' WHERE title = 'The Amazing Spider-Man';
UPDATE series SET description = 'Batman ongoing series', genre = 'Superhero' WHERE title = 'Batman';
UPDATE series SET description = 'Post-apocalyptic horror series', genre = 'Horror' WHERE title = 'The Walking Dead';
UPDATE series SET description = 'Paranormal adventure series', genre = 'Supernatural' WHERE title = 'Hellboy';

-- Update sample data in comics
UPDATE comics SET 
    publication_date = '1963-03-01',
    cover_date = '1963-03-01',
    characters = '["Spider-Man", "J. Jonah Jameson"]'::jsonb,
    key_issue_notes = 'First appearance of Spider-Man'
WHERE title = 'The Amazing Spider-Man' AND issue_number = '1';

UPDATE comics SET 
    publication_date = '1940-04-01',
    cover_date = '1940-04-01',
    characters = '["Batman", "Commissioner Gordon"]'::jsonb,
    key_issue_notes = 'First appearance of Batman'
WHERE title = 'Batman' AND issue_number = '1';

UPDATE comics SET 
    publication_date = '2003-10-01',
    cover_date = '2003-10-01',
    characters = '["Rick Grimes", "Morgan Jones"]'::jsonb,
    key_issue_notes = 'First issue of The Walking Dead'
WHERE title = 'The Walking Dead' AND issue_number = '1';

UPDATE comics SET 
    publication_date = '1993-03-01',
    cover_date = '1993-03-01',
    characters = '["Hellboy", "Professor Bruttenholm"]'::jsonb,
    key_issue_notes = 'First appearance of Hellboy'
WHERE title = 'Hellboy' AND issue_number = '1';

-- Create missing indexes
CREATE INDEX IF NOT EXISTS idx_comics_publication_date ON comics(publication_date);
CREATE INDEX IF NOT EXISTS idx_comics_characters ON comics USING GIN(characters);
CREATE INDEX IF NOT EXISTS idx_comics_creators ON comics USING GIN(creators);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email); 