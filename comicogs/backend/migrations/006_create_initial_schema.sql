-- 006_create_initial_schema.sql

-- Create Publishers table
CREATE TABLE publishers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Series table
CREATE TABLE series (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Comics table
CREATE TABLE comics (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    issue_number VARCHAR(50),
    publication_date DATE,
    publisher_id INT REFERENCES publishers(id) ON DELETE SET NULL,
    series_id INT REFERENCES series(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Collections table
CREATE TABLE collections (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    comic_id INT NOT NULL REFERENCES comics(id) ON DELETE CASCADE,
    acquisition_date DATE,
    grade VARCHAR(50),
    price_paid DECIMAL(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, comic_id) -- A user can only have one entry for a specific comic in their collection
);

-- Add indexes for frequently queried columns
CREATE INDEX idx_comics_publisher_id ON comics (publisher_id);
CREATE INDEX idx_comics_series_id ON comics (series_id);
CREATE INDEX idx_collections_user_id ON collections (user_id);
CREATE INDEX idx_collections_comic_id ON collections (comic_id);
