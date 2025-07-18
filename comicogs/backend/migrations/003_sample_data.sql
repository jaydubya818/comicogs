-- Migration 003: Add comprehensive sample data

-- Add Publishers
INSERT INTO publishers (name, founded_year, description, website_url) VALUES 
('Marvel Comics', 1939, 'Marvel Comics is an American comic book publisher and the flagship property of Marvel Entertainment', 'https://www.marvel.com'),
('DC Comics', 1934, 'DC Comics is an American comic book publisher and the flagship unit of DC Entertainment', 'https://www.dc.com'),
('Image Comics', 1992, 'Image Comics is an American comic book publisher and is the third largest comic book publisher in the United States', 'https://imagecomics.com'),
('Dark Horse Comics', 1986, 'Dark Horse Comics is an American comic book and manga publisher', 'https://www.darkhorse.com'),
('IDW Publishing', 1999, 'IDW Publishing is an American publisher of comic books, graphic novels, art books, and comic strip collections', 'https://www.idwpublishing.com');

-- Add Series
INSERT INTO series (title, publisher_id, start_year, description, genre, status) VALUES 
('The Amazing Spider-Man', 1, 1963, 'The flagship Spider-Man series featuring Peter Parker', 'Superhero', 'ongoing'),
('Batman', 2, 1940, 'The main Batman series featuring Bruce Wayne', 'Superhero', 'ongoing'),
('The Walking Dead', 3, 2003, 'Post-apocalyptic horror series by Robert Kirkman', 'Horror', 'completed'),
('Hellboy', 4, 1993, 'Paranormal adventure series by Mike Mignola', 'Supernatural', 'ongoing'),
('X-Men', 1, 1963, 'Team of mutant superheroes', 'Superhero', 'ongoing'),
('Superman', 2, 1939, 'The Man of Steel adventures', 'Superhero', 'ongoing'),
('Saga', 3, 2012, 'Space opera fantasy by Brian K. Vaughan', 'Science Fiction', 'ongoing'),
('Sin City', 4, 1991, 'Neo-noir crime series by Frank Miller', 'Crime', 'completed');

-- Add Comics (Key Issues)
INSERT INTO comics (title, issue_number, variant_name, publisher_id, series_id, publication_date, cover_date, 
                   description, characters, creators, key_issue_notes, format) VALUES 
('The Amazing Spider-Man', '1', NULL, 1, 1, '1963-03-01', '1963-03-01', 
 'First appearance of Spider-Man in his own title', 
 '["Spider-Man", "J. Jonah Jameson", "Aunt May"]'::jsonb,
 '[{"name": "Stan Lee", "role": "writer"}, {"name": "Steve Ditko", "role": "artist"}]'::jsonb,
 'First appearance of Spider-Man', 'regular'),

('Batman', '1', NULL, 2, 2, '1940-04-01', '1940-04-01',
 'First appearance of Batman and Commissioner Gordon',
 '["Batman", "Commissioner Gordon", "Bruce Wayne"]'::jsonb,
 '[{"name": "Bob Kane", "role": "artist"}, {"name": "Bill Finger", "role": "writer"}]'::jsonb,
 'First appearance of Batman', 'regular'),

('The Walking Dead', '1', NULL, 3, 3, '2003-10-01', '2003-10-01',
 'First issue of The Walking Dead series',
 '["Rick Grimes", "Morgan Jones", "Duane Jones"]'::jsonb,
 '[{"name": "Robert Kirkman", "role": "writer"}, {"name": "Tony Moore", "role": "artist"}]'::jsonb,
 'First appearance of Rick Grimes', 'regular'),

('Hellboy', '1', NULL, 4, 4, '1993-03-01', '1993-03-01',
 'First appearance of Hellboy',
 '["Hellboy", "Professor Bruttenholm"]'::jsonb,
 '[{"name": "Mike Mignola", "role": "writer"}, {"name": "Mike Mignola", "role": "artist"}]'::jsonb,
 'First appearance of Hellboy', 'regular'),

('X-Men', '1', NULL, 1, 5, '1963-09-01', '1963-09-01',
 'First appearance of the X-Men',
 '["Professor X", "Cyclops", "Marvel Girl", "Beast", "Angel", "Iceman"]'::jsonb,
 '[{"name": "Stan Lee", "role": "writer"}, {"name": "Jack Kirby", "role": "artist"}]'::jsonb,
 'First appearance of X-Men', 'regular'),

('Superman', '1', NULL, 2, 6, '1939-04-01', '1939-04-01',
 'First Superman comic in his own title',
 '["Superman", "Clark Kent", "Lois Lane"]'::jsonb,
 '[{"name": "Jerry Siegel", "role": "writer"}, {"name": "Joe Shuster", "role": "artist"}]'::jsonb,
 'First Superman solo title', 'regular'),

('Saga', '1', NULL, 3, 7, '2012-03-14', '2012-03-01',
 'First issue of Saga space opera',
 '["Alana", "Marko", "Hazel"]'::jsonb,
 '[{"name": "Brian K. Vaughan", "role": "writer"}, {"name": "Fiona Staples", "role": "artist"}]'::jsonb,
 'First appearance of Saga characters', 'regular'),

('The Amazing Spider-Man', '129', NULL, 1, 1, '1974-02-01', '1974-02-01',
 'First appearance of the Punisher',
 '["Spider-Man", "Punisher", "Jackal"]'::jsonb,
 '[{"name": "Gerry Conway", "role": "writer"}, {"name": "Ross Andru", "role": "artist"}]'::jsonb,
 'First appearance of Punisher', 'regular'),

('X-Men', '94', NULL, 1, 5, '1975-08-01', '1975-08-01',
 'New X-Men team introduction',
 '["Wolverine", "Storm", "Nightcrawler", "Colossus"]'::jsonb,
 '[{"name": "Len Wein", "role": "writer"}, {"name": "Dave Cockrum", "role": "artist"}]'::jsonb,
 'First appearance of new X-Men team', 'regular'),

('Batman', '181', NULL, 2, 2, '1966-06-01', '1966-06-01',
 'First appearance of Poison Ivy',
 '["Batman", "Robin", "Poison Ivy"]'::jsonb,
 '[{"name": "Robert Kanigher", "role": "writer"}, {"name": "Sheldon Moldoff", "role": "artist"}]'::jsonb,
 'First appearance of Poison Ivy', 'regular');

-- Add some price history data
INSERT INTO price_history (comic_id, condition, price, source, sale_date, grade) VALUES
-- Amazing Spider-Man #1
(1, 'NM', 25000.00, 'heritage', '2024-01-15', '9.0'),
(1, 'VF', 15000.00, 'ebay', '2024-01-20', '8.0'),
(1, 'FN', 8000.00, 'comicogs', '2024-01-10', '6.0'),

-- Batman #1
(2, 'NM', 35000.00, 'heritage', '2024-02-01', '9.0'),
(2, 'VF', 22000.00, 'ebay', '2024-02-05', '8.0'),
(2, 'FN', 12000.00, 'comicogs', '2024-01-25', '6.0'),

-- Walking Dead #1
(3, 'NM', 2500.00, 'comicogs', '2024-01-10', '9.0'),
(3, 'VF', 1800.00, 'ebay', '2024-01-15', '8.0'),
(3, 'FN', 1200.00, 'comicogs', '2024-01-08', '6.0'),

-- Hellboy #1
(4, 'NM', 800.00, 'comicogs', '2024-01-25', '9.0'),
(4, 'VF', 500.00, 'ebay', '2024-01-20', '8.0'),

-- X-Men #1
(5, 'NM', 45000.00, 'heritage', '2024-02-10', '9.0'),
(5, 'VF', 28000.00, 'ebay', '2024-02-12', '8.0'),

-- Superman #1
(6, 'NM', 55000.00, 'heritage', '2024-01-30', '9.0'),
(6, 'VF', 35000.00, 'ebay', '2024-02-01', '8.0'),

-- Saga #1
(7, 'NM', 150.00, 'comicogs', '2024-01-12', '9.0'),
(7, 'VF', 100.00, 'ebay', '2024-01-18', '8.0'),

-- Amazing Spider-Man #129 (First Punisher)
(8, 'NM', 3500.00, 'heritage', '2024-01-22', '9.0'),
(8, 'VF', 2200.00, 'ebay', '2024-01-25', '8.0'),

-- X-Men #94
(9, 'NM', 1800.00, 'comicogs', '2024-01-28', '9.0'),
(9, 'VF', 1200.00, 'ebay', '2024-02-03', '8.0'),

-- Batman #181 (First Poison Ivy)
(10, 'NM', 2800.00, 'heritage', '2024-02-08', '9.0'),
(10, 'VF', 1800.00, 'comicogs', '2024-02-10', '8.0');

-- Add sample collections for the test user (user_id = 1)
INSERT INTO collections (user_id, comic_id, condition, purchase_price, current_value, notes, reading_status, favorite) VALUES
(1, 3, 'VF', 1000.00, 1800.00, 'Bought at local comic shop', 'read', true),
(1, 4, 'NM', 400.00, 800.00, 'First Hellboy issue', 'read', false),
(1, 7, 'NM', 50.00, 150.00, 'Love this series!', 'read', true),
(1, 8, 'VF', 1500.00, 2200.00, 'First Punisher appearance', 'read', true),
(1, 9, 'VF', 800.00, 1200.00, 'New X-Men team', 'unread', false);

-- Add wantlist entries for the test user
INSERT INTO wantlists (user_id, comic_id, max_price, min_condition, priority, notes, notifications_enabled) VALUES
(1, 1, 20000.00, 'VF', 5, 'Holy grail comic - Amazing Spider-Man #1', true),
(1, 2, 25000.00, 'VF', 5, 'Batman #1 - dream comic', true),
(1, 5, 30000.00, 'FN', 4, 'X-Men #1 - completing collection', true),
(1, 6, 40000.00, 'VF', 3, 'Superman #1 - would be amazing', true),
(1, 10, 2000.00, 'VF', 2, 'First Poison Ivy appearance', true);

-- Add user folders for organization
INSERT INTO user_folders (user_id, name, description, type) VALUES
(1, 'Key Issues', 'Important first appearances and milestones', 'custom'),
(1, 'Marvel Collection', 'All my Marvel comics', 'publisher'),
(1, 'Horror Comics', 'Walking Dead and other horror titles', 'genre'),
(1, 'Investment Comics', 'High-value comics for investment', 'custom');

-- Link collections to folders
INSERT INTO folder_collections (folder_id, collection_id) VALUES
-- Key Issues folder
(1, 2), -- Hellboy #1
(1, 4), -- Amazing Spider-Man #129 (First Punisher)

-- Marvel Collection folder  
(2, 4), -- Amazing Spider-Man #129
(2, 5), -- X-Men #94

-- Horror Comics folder
(3, 1), -- Walking Dead #1

-- Investment Comics folder
(4, 1), -- Walking Dead #1
(4, 4), -- Amazing Spider-Man #129
(4, 5); -- X-Men #94

-- Add some price alerts
INSERT INTO price_alerts (user_id, comic_id, condition, target_price, alert_type, active) VALUES
(1, 1, 'VF', 18000.00, 'below', true),  -- Alert when Amazing Spider-Man #1 VF goes below $18k
(1, 2, 'FN', 10000.00, 'below', true),  -- Alert when Batman #1 FN goes below $10k
(1, 5, 'FN', 25000.00, 'below', true);  -- Alert when X-Men #1 FN goes below $25k 