-- 007_create_comic_reviews_table.sql

CREATE TABLE IF NOT EXISTS comic_reviews (
    id SERIAL PRIMARY KEY,
    comic_id INTEGER NOT NULL REFERENCES comics(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_comic_reviews_comic_id ON comic_reviews (comic_id);
CREATE INDEX IF NOT EXISTS idx_comic_reviews_user_id ON comic_reviews (user_id);

-- Add a unique constraint to prevent a user from reviewing the same comic multiple times
ALTER TABLE comic_reviews
ADD CONSTRAINT unique_comic_user_review UNIQUE (comic_id, user_id);
