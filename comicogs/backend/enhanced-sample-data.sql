-- ==========================================
-- COMICOGS ENHANCED SAMPLE DATA
-- Task 13: Comprehensive data for Discogs-inspired schema
-- ==========================================

-- Insert Publishers (like major record labels)
INSERT INTO publishers (name, sort_name, founded_year, description, type, country, status) VALUES
('Marvel Comics', 'Marvel Comics', 1939, 'American comic book publisher and subsidiary of The Walt Disney Company', 'publisher', 'US', 'active'),
('DC Comics', 'DC Comics', 1934, 'American comic book publisher and subsidiary of Warner Bros. Discovery', 'publisher', 'US', 'active'),
('Image Comics', 'Image Comics', 1992, 'American comic book publisher founded by several high-profile illustrators', 'publisher', 'US', 'active'),
('Dark Horse Comics', 'Dark Horse Comics', 1986, 'American comic book and manga publisher founded by Mike Richardson', 'publisher', 'US', 'active'),
('IDW Publishing', 'IDW Publishing', 1999, 'American publisher of comic books, graphic novels, art books, and comic strip collections', 'publisher', 'US', 'active'),
('Vertigo', 'Vertigo', 1993, 'DC Comics imprint for mature readers', 'imprint', 'US', 'active');

-- Insert Creators (like artists in Discogs)
INSERT INTO creators (name, sort_name, legal_name, birth_date, biography, country, gender, status) VALUES
('Stan Lee', 'Lee, Stan', 'Stanley Martin Lieber', '1922-12-28', 'American comic book writer, editor, publisher, and producer known for co-creating Spider-Man, X-Men, and many Marvel characters.', 'US', 'male', 'deceased'),
('Jack Kirby', 'Kirby, Jack', 'Jacob Kurtzberg', '1917-08-28', 'American comic book artist, writer and editor, widely regarded as one of the mediums major innovators and most influential figures.', 'US', 'male', 'deceased'),
('Steve Ditko', 'Ditko, Steve', 'Stephen John Ditko', '1927-11-02', 'American comics artist and writer best known for being co-creator of Marvel superhero Spider-Man and Doctor Strange.', 'US', 'male', 'deceased'),
('Frank Miller', 'Miller, Frank', 'Frank Miller', '1957-01-27', 'American comic book writer, penciller and inker, novelist, screenwriter, film director, and producer known for Daredevil, Sin City, and 300.', 'US', 'male', 'active'),
('Alan Moore', 'Moore, Alan', 'Alan Moore', '1953-11-18', 'English author known primarily for his work in comic books including Watchmen, V for Vendetta, and Batman: The Killing Joke.', 'GB', 'male', 'active'),
('Neil Gaiman', 'Gaiman, Neil', 'Neil Richard MacKinnon Gaiman', '1960-11-10', 'English author of short fiction, novels, comic books, graphic novels, nonfiction, audio theatre, and films including Sandman.', 'GB', 'male', 'active'),
('Todd McFarlane', 'McFarlane, Todd', 'Todd McFarlane', '1961-03-16', 'Canadian comic book creator, artist, writer, filmmaker and entrepreneur, known for Spider-Man and creating Spawn.', 'CA', 'male', 'active'),
('Jim Lee', 'Lee, Jim', 'Jim Lee', '1964-08-11', 'Korean-American comic book artist, writer, editor, and publisher known for X-Men and co-founding Image Comics.', 'KR', 'male', 'active'),
('Chris Claremont', 'Claremont, Chris', 'Christopher S. Claremont', '1950-11-25', 'British-born American comic book writer and novelist, known for his 17-year stint on Uncanny X-Men.', 'GB', 'male', 'active'),
('John Byrne', 'Byrne, John', 'John Lindley Byrne', '1950-07-06', 'British-born American comic book writer and artist known for X-Men, Fantastic Four, and Superman.', 'GB', 'male', 'active');

-- Insert Creator Aliases
INSERT INTO creator_aliases (creator_id, alias_name, alias_type) VALUES
(1, 'Stan the Man', 'nickname'),
(2, 'King Kirby', 'nickname'),
(2, 'The King', 'nickname'),
(4, 'Frank Miller', 'pen_name'),
(5, 'The Magus', 'nickname'),
(7, 'The Spider-Man Guy', 'nickname');

-- Insert Creator URLs
INSERT INTO creator_urls (creator_id, url, url_type) VALUES
(4, 'https://frankmillerink.com', 'website'),
(5, 'http://www.alanmoore.com', 'website'),
(6, 'https://neilgaiman.com', 'website'),
(7, 'https://www.toddmcfarlane.com', 'website'),
(8, 'https://www.jimlee.com', 'website');

-- Insert Series (like Discogs Masters)
INSERT INTO series (title, sort_title, publisher_id, start_year, description, genre, status, issue_count, country, language, format, age_rating) VALUES
('Amazing Spider-Man', 'Amazing Spider-Man', 1, 1963, 'The adventures of Peter Parker, the Amazing Spider-Man', 'Superhero', 'ongoing', 800, 'US', 'en', 'ongoing', 'teen'),
('Uncanny X-Men', 'Uncanny X-Men', 1, 1963, 'A team of mutant superheroes in the Marvel Universe', 'Superhero', 'ongoing', 600, 'US', 'en', 'ongoing', 'teen'),
('Batman', 'Batman', 2, 1940, 'The Dark Knight of Gotham City', 'Superhero', 'ongoing', 700, 'US', 'en', 'ongoing', 'teen'),
('The Sandman', 'Sandman, The', 6, 1989, 'Neil Gaimans dark fantasy epic about Morpheus, Lord of Dreams', 'Fantasy', 'completed', 75, 'US', 'en', 'limited', 'mature'),
('Watchmen', 'Watchmen', 2, 1986, 'Alan Moores deconstruction of the superhero genre', 'Superhero', 'completed', 12, 'US', 'en', 'mini', 'mature'),
('The Walking Dead', 'Walking Dead, The', 3, 2003, 'Post-apocalyptic horror survival story', 'Horror', 'completed', 193, 'US', 'en', 'ongoing', 'mature'),
('Spawn', 'Spawn', 3, 1992, 'Todd McFarlanes supernatural antihero', 'Supernatural', 'ongoing', 350, 'US', 'en', 'ongoing', 'mature'),
('Saga', 'Saga', 3, 2012, 'Brian K. Vaughan and Fiona Staples space opera', 'Science Fiction', 'ongoing', 66, 'US', 'en', 'ongoing', 'mature');

-- Insert Comics (like Discogs Releases)
INSERT INTO comics (title, issue_number, volume, publisher_id, series_id, publication_date, cover_date, on_sale_date, page_count, description, isbn, upc, diamond_code, cover_price) VALUES
('Amazing Spider-Man', '1', 1, 1, 1, '1963-03-01', '1963-03-01', '1963-03-01', 11, 'First appearance of Spider-Man in his own title', NULL, '071486000016', NULL, 0.12),
('Amazing Spider-Man', '50', 1, 1, 1, '1967-07-01', '1967-07-01', '1967-07-01', 20, 'First appearance of the Kingpin', NULL, '071486000509', NULL, 0.12),
('Amazing Spider-Man', '121', 1, 1, 1, '1973-06-01', '1973-06-01', '1973-06-01', 20, 'The death of Gwen Stacy', NULL, '071486001215', NULL, 0.20),
('Amazing Spider-Man', '300', 1, 1, 1, '1988-05-01', '1988-05-01', '1988-04-20', 22, 'First full appearance of Venom', NULL, '071486003005', 'MAY880251', 1.00),
('Uncanny X-Men', '1', 1, 1, 2, '1963-09-01', '1963-09-01', '1963-09-01', 22, 'First appearance of the X-Men', NULL, '071486010015', NULL, 0.12),
('Uncanny X-Men', '94', 1, 1, 2, '1975-08-01', '1975-08-01', '1975-08-01', 18, 'New X-Men begin', NULL, '071486010948', NULL, 0.25),
('Uncanny X-Men', '141', 1, 1, 2, '1981-01-01', '1981-01-01', '1981-01-01', 22, 'Days of Future Past begins', NULL, '071486014115', NULL, 0.50),
('Batman', '1', 1, 2, 3, '1940-04-25', '1940-04-25', '1940-04-25', 64, 'The first appearance of Batman and Joker', NULL, '076194130013', NULL, 0.10),
('Batman', '181', 1, 2, 3, '1966-06-01', '1966-06-01', '1966-06-01', 16, 'First appearance of Poison Ivy', NULL, '076194131815', NULL, 0.12),
('The Sandman', '1', 1, 6, 4, '1989-01-01', '1989-01-01', '1989-01-01', 24, 'Sleep of the Just', NULL, '076194135017', 'DEC881756', 1.50),
('Watchmen', '1', 1, 2, 5, '1986-09-01', '1986-09-01', '1986-09-01', 28, 'At Midnight, All the Agents...', NULL, '076194140019', NULL, 1.50),
('The Walking Dead', '1', 1, 3, 6, '2003-10-01', '2003-10-01', '2003-10-01', 22, 'First appearance of Rick Grimes', NULL, '070985300015', 'OCT030267', 2.95),
('Spawn', '1', 1, 3, 7, '1992-05-01', '1992-05-01', '1992-05-01', 28, 'First appearance of Spawn', NULL, '070985301016', 'MAY920001', 1.95);

-- Insert Comic Variants
INSERT INTO comic_variants (comic_id, variant_name, variant_type, cover_image_url, print_run, rarity_ratio, is_primary) VALUES
(4, 'Cover A - Direct Edition', 'cover', '/images/asm300-cover-a.jpg', 500000, NULL, TRUE),
(4, 'Cover B - Newsstand Edition', 'cover', '/images/asm300-cover-b.jpg', 100000, NULL, FALSE),
(4, '2nd Print', 'reprint', '/images/asm300-2nd-print.jpg', 50000, NULL, FALSE),
(10, 'Cover A - Regular', 'cover', '/images/sandman1-regular.jpg', 25000, NULL, TRUE),
(10, 'Cover B - Black Cover', 'cover', '/images/sandman1-black.jpg', 5000, '1:5', FALSE),
(12, 'Cover A - Color', 'cover', '/images/twd1-color.jpg', 7500, NULL, TRUE),
(12, 'Cover B - Black & White', 'cover', '/images/twd1-bw.jpg', 2500, '1:3', FALSE),
(13, 'Cover A - Regular', 'cover', '/images/spawn1-regular.jpg', 100000, NULL, TRUE),
(13, 'Cover B - Black & White', 'cover', '/images/spawn1-bw.jpg', 10000, '1:10', FALSE);

-- Insert Comic Formats
INSERT INTO comic_formats (comic_id, format_name, format_details) VALUES
(1, 'newsstand', '{"distribution": "newsstand", "spine": "square"}'),
(4, 'direct', '{"distribution": "direct_market", "spine": "square"}'),
(4, 'newsstand', '{"distribution": "newsstand", "spine": "square"}'),
(10, 'direct', '{"distribution": "direct_market", "binding": "saddle_stitched"}'),
(11, 'direct', '{"distribution": "direct_market", "paper": "prestige"}'),
(12, 'direct', '{"distribution": "direct_market", "finish": "glossy"}'),
(13, 'direct', '{"distribution": "direct_market", "paper": "newsprint"}');

-- Insert Comic Creator Roles
INSERT INTO comic_creator_roles (comic_id, creator_id, role, credited_as, role_details) VALUES
-- Amazing Spider-Man #1
(1, 1, 'writer', 'Stan Lee', 'Story concept and dialogue'),
(1, 3, 'artist', 'Steve Ditko', 'Pencils and inks'),
-- Amazing Spider-Man #300
(4, 7, 'artist', 'Todd McFarlane', 'Pencils, inks, and cover art'),
-- Uncanny X-Men #1
(5, 1, 'writer', 'Stan Lee', 'Story and dialogue'),
(5, 2, 'artist', 'Jack Kirby', 'Pencils and layouts'),
-- Uncanny X-Men #141
(7, 9, 'writer', 'Chris Claremont', 'Script and plot'),
(7, 10, 'artist', 'John Byrne', 'Pencils'),
-- Batman #1
(8, 2, 'artist', 'Bob Kane', 'Cover and interior art'),
-- The Sandman #1
(10, 6, 'writer', 'Neil Gaiman', 'Story and script'),
-- Watchmen #1
(11, 5, 'writer', 'Alan Moore', 'Story and script');

-- Insert Comic Characters
INSERT INTO comic_characters (comic_id, character_name, character_type, first_appearance, death) VALUES
-- Amazing Spider-Man #1
(1, 'Spider-Man', 'main', TRUE, FALSE),
(1, 'Peter Parker', 'main', TRUE, FALSE),
(1, 'J. Jonah Jameson', 'supporting', TRUE, FALSE),
(1, 'Chameleon', 'villain', TRUE, FALSE),
-- Amazing Spider-Man #50
(2, 'Spider-Man', 'main', FALSE, FALSE),
(2, 'Kingpin', 'villain', TRUE, FALSE),
-- Amazing Spider-Man #121
(3, 'Spider-Man', 'main', FALSE, FALSE),
(3, 'Gwen Stacy', 'supporting', FALSE, TRUE),
(3, 'Green Goblin', 'villain', FALSE, FALSE),
-- Amazing Spider-Man #300
(4, 'Spider-Man', 'main', FALSE, FALSE),
(4, 'Venom', 'villain', TRUE, FALSE),
(4, 'Eddie Brock', 'villain', TRUE, FALSE),
-- Uncanny X-Men #1
(5, 'Professor X', 'main', TRUE, FALSE),
(5, 'Cyclops', 'main', TRUE, FALSE),
(5, 'Beast', 'main', TRUE, FALSE),
(5, 'Angel', 'main', TRUE, FALSE),
(5, 'Iceman', 'main', TRUE, FALSE),
(5, 'Marvel Girl', 'main', TRUE, FALSE),
-- Batman #1
(8, 'Batman', 'main', TRUE, FALSE),
(8, 'Joker', 'villain', TRUE, FALSE),
(8, 'Bruce Wayne', 'main', TRUE, FALSE),
-- The Walking Dead #1
(12, 'Rick Grimes', 'main', TRUE, FALSE),
(12, 'Shane Walsh', 'supporting', TRUE, FALSE),
-- Spawn #1
(13, 'Spawn', 'main', TRUE, FALSE),
(13, 'Al Simmons', 'main', TRUE, FALSE);

-- Insert Comic Story Arcs
INSERT INTO comic_story_arcs (comic_id, story_arc_name, part_number) VALUES
(3, 'The Night Gwen Stacy Died', 1),
(4, 'Venom Saga', 1),
(7, 'Days of Future Past', 1),
(10, 'Preludes & Nocturnes', 1),
(11, 'Watchmen', 1),
(12, 'Days Gone Bye', 1);

-- Insert Comic Genres
INSERT INTO comic_genres (comic_id, genre) VALUES
(1, 'Superhero'), (1, 'Action'),
(2, 'Superhero'), (2, 'Crime'),
(3, 'Superhero'), (3, 'Drama'),
(4, 'Superhero'), (4, 'Horror'),
(5, 'Superhero'), (5, 'Science Fiction'),
(7, 'Superhero'), (7, 'Science Fiction'),
(8, 'Superhero'), (8, 'Crime'),
(10, 'Fantasy'), (10, 'Horror'),
(11, 'Superhero'), (11, 'Science Fiction'),
(12, 'Horror'), (12, 'Drama'),
(13, 'Supernatural'), (13, 'Action');

-- Insert Sample Price History
INSERT INTO price_history (comic_id, variant_id, condition, grade, price, sale_date, sale_type, source, marketplace, seller_feedback_score) VALUES
-- Amazing Spider-Man #1 price history
(1, NULL, 'CGC 9.0', 9.0, 145000.00, '2023-10-15', 'auction', 'Heritage Auctions', 'heritage', 100),
(1, NULL, 'CGC 8.0', 8.0, 85000.00, '2023-11-20', 'auction', 'Heritage Auctions', 'heritage', 100),
(1, NULL, 'VF', 8.0, 65000.00, '2024-01-10', 'fixed_price', 'eBay', 'ebay', 98),
-- Amazing Spider-Man #300 price history  
(4, 1, 'CGC 9.8', 9.8, 1250.00, '2024-01-15', 'auction', 'Heritage Auctions', 'heritage', 100),
(4, 1, 'CGC 9.6', 9.6, 950.00, '2024-01-12', 'fixed_price', 'ComicConnect', 'comicconnect', 99),
(4, 1, 'NM', 9.0, 650.00, '2024-01-08', 'auction', 'eBay', 'ebay', 97),
-- Uncanny X-Men #1 price history
(5, NULL, 'CGC 9.0', 9.0, 125000.00, '2023-12-01', 'auction', 'Heritage Auctions', 'heritage', 100),
(5, NULL, 'VF', 8.0, 75000.00, '2024-01-05', 'fixed_price', 'MyComicShop', 'mycomicshop', 98),
-- The Walking Dead #1 price history
(12, 1, 'CGC 9.8', 9.8, 4500.00, '2024-01-20', 'auction', 'ComicConnect', 'comicconnect', 99),
(12, 2, 'CGC 9.8', 9.8, 8500.00, '2024-01-18', 'auction', 'Heritage Auctions', 'heritage', 100),
-- Spawn #1 price history
(13, 1, 'CGC 9.8', 9.8, 850.00, '2024-01-22', 'fixed_price', 'eBay', 'ebay', 95),
(13, 1, 'NM', 9.0, 450.00, '2024-01-15', 'auction', 'eBay', 'ebay', 92);

COMMIT; 