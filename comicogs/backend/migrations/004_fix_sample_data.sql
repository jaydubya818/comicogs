-- Migration 004: Fix sample data with correct comic IDs

-- Add price history data with correct comic IDs
INSERT INTO price_history (comic_id, condition, price, source, sale_date, grade) VALUES
-- Amazing Spider-Man #1 (comic_id = 5)
(5, 'NM', 25000.00, 'heritage', '2024-01-15', '9.0'),
(5, 'VF', 15000.00, 'ebay', '2024-01-20', '8.0'),
(5, 'FN', 8000.00, 'comicogs', '2024-01-10', '6.0'),

-- Batman #1 (comic_id = 6)
(6, 'NM', 35000.00, 'heritage', '2024-02-01', '9.0'),
(6, 'VF', 22000.00, 'ebay', '2024-02-05', '8.0'),
(6, 'FN', 12000.00, 'comicogs', '2024-01-25', '6.0'),

-- Walking Dead #1 (comic_id = 7)
(7, 'NM', 2500.00, 'comicogs', '2024-01-10', '9.0'),
(7, 'VF', 1800.00, 'ebay', '2024-01-15', '8.0'),
(7, 'FN', 1200.00, 'comicogs', '2024-01-08', '6.0'),

-- Hellboy #1 (comic_id = 8)
(8, 'NM', 800.00, 'comicogs', '2024-01-25', '9.0'),
(8, 'VF', 500.00, 'ebay', '2024-01-20', '8.0'),

-- X-Men #1 (comic_id = 9)
(9, 'NM', 45000.00, 'heritage', '2024-02-10', '9.0'),
(9, 'VF', 28000.00, 'ebay', '2024-02-12', '8.0'),

-- Superman #1 (comic_id = 10)
(10, 'NM', 55000.00, 'heritage', '2024-01-30', '9.0'),
(10, 'VF', 35000.00, 'ebay', '2024-02-01', '8.0'),

-- Saga #1 (comic_id = 11)
(11, 'NM', 150.00, 'comicogs', '2024-01-12', '9.0'),
(11, 'VF', 100.00, 'ebay', '2024-01-18', '8.0'),

-- Amazing Spider-Man #129 (comic_id = 12)
(12, 'NM', 3500.00, 'heritage', '2024-01-22', '9.0'),
(12, 'VF', 2200.00, 'ebay', '2024-01-25', '8.0'),

-- X-Men #94 (comic_id = 13)
(13, 'NM', 1800.00, 'comicogs', '2024-01-28', '9.0'),
(13, 'VF', 1200.00, 'ebay', '2024-02-03', '8.0'),

-- Batman #181 (comic_id = 14)
(14, 'NM', 2800.00, 'heritage', '2024-02-08', '9.0'),
(14, 'VF', 1800.00, 'comicogs', '2024-02-10', '8.0');

-- Add sample collections for the test user (user_id = 1)
INSERT INTO collections (user_id, comic_id, condition, purchase_price, current_value, notes, reading_status, favorite) VALUES
(1, 7, 'VF', 1000.00, 1800.00, 'Bought at local comic shop', 'read', true),       -- Walking Dead #1
(1, 8, 'NM', 400.00, 800.00, 'First Hellboy issue', 'read', false),               -- Hellboy #1
(1, 11, 'NM', 50.00, 150.00, 'Love this series!', 'read', true),                  -- Saga #1
(1, 12, 'VF', 1500.00, 2200.00, 'First Punisher appearance', 'read', true),       -- Amazing Spider-Man #129
(1, 13, 'VF', 800.00, 1200.00, 'New X-Men team', 'unread', false);               -- X-Men #94

-- Add wantlist entries for the test user
INSERT INTO wantlists (user_id, comic_id, max_price, min_condition, priority, notes, notifications_enabled) VALUES
(1, 5, 20000.00, 'VF', 5, 'Holy grail comic - Amazing Spider-Man #1', true),     -- Amazing Spider-Man #1
(1, 6, 25000.00, 'VF', 5, 'Batman #1 - dream comic', true),                       -- Batman #1
(1, 9, 30000.00, 'FN', 4, 'X-Men #1 - completing collection', true),             -- X-Men #1
(1, 10, 40000.00, 'VF', 3, 'Superman #1 - would be amazing', true),              -- Superman #1
(1, 14, 2000.00, 'VF', 2, 'First Poison Ivy appearance', true);                  -- Batman #181

-- Fix the folder collections with correct collection IDs
-- First, let's check what collection IDs were created
-- Collection IDs should be 1-5 based on the inserts above

INSERT INTO folder_collections (folder_id, collection_id) VALUES
-- Key Issues folder (folder_id = 1)
(1, 2), -- Hellboy #1
(1, 4), -- Amazing Spider-Man #129 (First Punisher)

-- Marvel Collection folder (folder_id = 2)
(2, 4), -- Amazing Spider-Man #129
(2, 5), -- X-Men #94

-- Horror Comics folder (folder_id = 3)
(3, 1), -- Walking Dead #1

-- Investment Comics folder (folder_id = 4)
(4, 1), -- Walking Dead #1
(4, 4), -- Amazing Spider-Man #129
(4, 5); -- X-Men #94

-- Add price alerts with correct comic IDs
INSERT INTO price_alerts (user_id, comic_id, condition, target_price, alert_type, active) VALUES
(1, 5, 'VF', 18000.00, 'below', true),   -- Alert when Amazing Spider-Man #1 VF goes below $18k
(1, 6, 'FN', 10000.00, 'below', true),   -- Alert when Batman #1 FN goes below $10k
(1, 9, 'FN', 25000.00, 'below', true);   -- Alert when X-Men #1 FN goes below $25k 

-- Add characters column to comics table for character search
ALTER TABLE comics ADD COLUMN characters TEXT[]; 