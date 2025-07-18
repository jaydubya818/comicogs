# Task 0: Define Entity-Relationship Diagram (ERD)

## Epic
EPIC-0 Foundation

## Feat
contuinue
ure

Database Schema Definition

## Description
Define the Entity-Relationship Diagram (ERD) for the Comicogs database, outlining all tables, their columns, data types, primary keys, foreign keys, and relationships based on the provided PRD.

## Requirements
- All tables mentioned in the PRD's "Database Schema" section (Users, Comics, Collections, Publishers, Series) must be included.
- Columns for each table must match the PRD specifications.
- Appropriate data types should be assigned to each column.
- Primary and foreign key relationships must be clearly defined.
- Relationships between tables (one-to-many, many-to-many) should be illustrated.

## Implementation Steps
1.  **Review PRD:** Re-read the "Database Schema" section (5.9) and any other relevant sections (e.g., "Core Features") to ensure all entities and their attributes are captured.
2.  **Identify Entities:** List all distinct entities that will become tables.
3.  **Define Attributes:** For each entity, list all necessary attributes (columns) and their data types.
4.  **Establish Relationships:** Determine how entities relate to each other (e.g., a User has many Collections, a Collection belongs to one User and one Comic).
5.  **Create ERD Diagram (Conceptual/Logical):** Use a suitable tool (or simply text-based representation) to draw or describe the ERD, showing tables, columns, primary keys, foreign keys, and relationships.
6.  **Validate:** Cross-reference the ERD with the PRD to ensure all requirements are met and the schema supports the described features.

## ✅ ERD ANALYSIS COMPLETED

### Core Entities Identified

**Primary Entities:**
1. **users** - User accounts and profiles
2. **publishers** - Comic book publishers (Marvel, DC, etc.)
3. **series** - Comic book series (Amazing Spider-Man, Batman, etc.)
4. **comics** - Individual comic book issues and variants
5. **collections** - User's owned comics with condition/value tracking

**Marketplace Entities:**
6. **marketplace_listings** - Comics listed for sale
7. **transactions** - Completed sales transactions
8. **price_history** - Historical pricing data from various sources
9. **pricing_data** - External marketplace pricing intelligence (ComicComp)

**User Experience Entities:**
10. **wantlists** - User's desired comics with price/condition preferences
11. **user_folders** - Custom organization folders
12. **folder_collections** - Many-to-many link between folders and collections
13. **price_alerts** - User price monitoring alerts
14. **search_history** - User search behavior for AI recommendations

### Key Relationships

**Core Publishing Hierarchy:**
- Publishers ➤ Series (1:N)
- Publishers ➤ Comics (1:N)
- Series ➤ Comics (1:N)

**User-Centric Relationships:**
- Users ➤ Collections (1:N) - What comics users own
- Users ➤ Wantlists (1:N) - What comics users want
- Users ➤ Marketplace Listings (1:N) - What comics users are selling
- Users ➤ Price Alerts (1:N) - What comics users are monitoring

**Marketplace Relationships:**
- Collections ➤ Marketplace Listings (1:N) - Users can list owned comics
- Marketplace Listings ➤ Transactions (1:N) - Sales from listings
- Users ➤ Transactions (1:N) as both buyers and sellers

**Pricing Intelligence:**
- Comics ➤ Price History (1:N) - Historical sales data
- Comics ➤ Pricing Data (1:N) - External marketplace data

**Organization & Personalization:**
- Users ➤ User Folders (1:N) - Custom organization
- User Folders ↔ Collections (N:M) via folder_collections - Flexible organization
- Users ➤ Search History (1:N) - For AI recommendations

### Data Types & Constraints

**Primary Keys:** All entities use `SERIAL PRIMARY KEY` for auto-incrementing IDs

**Foreign Key Constraints:**
- CASCADE deletes for dependent data (collections, listings)
- SET NULL for optional references (series_id in comics)
- Referential integrity maintained throughout

**Unique Constraints:**
- User credentials (username, email)
- Publisher names
- Comic identification (title, issue_number, variant_name, publisher_id)
- User-comic relationships (user_id, comic_id) in collections and wantlists

**Data Types Aligned with PRD:**
- `VARCHAR(255)` for names, titles, URLs
- `TEXT` for descriptions and notes
- `DECIMAL(10,2)` for currency values
- `JSONB` for flexible metadata (creators, characters, story_arcs)
- `TIMESTAMP WITH TIME ZONE` for audit trails
- `BOOLEAN` for flags and preferences

### Validation Against PRD Requirements

✅ **Catalog Requirements (3.1):** Master-Issue model supported via publishers→series→comics hierarchy
✅ **Collection Manager (3.3):** Collections table with value tracking, custom folders, privacy controls
✅ **Wantlist (3.4):** Dedicated wantlists table with notifications and sharing
✅ **Marketplace (3.5):** Full marketplace_listings and transactions with escrow support
✅ **Price Guide (3.6):** price_history and pricing_data tables for comprehensive pricing
✅ **AI Agent Layer (3.8):** search_history for recommendations, pricing_data for intelligence

### ERD Status: COMPLETE ✅

The Entity-Relationship Diagram has been fully defined and validated against the PRD requirements. The visual ERD diagram shows all 14 entities with their complete attribute sets, data types, and relationship mappings. The schema supports all core features outlined in the PRD including the three-part flywheel (Database, Marketplace, Collection Tools) and advanced features like AI pricing intelligence and user personalization.

**Next Step:** Proceed to Task 0.1 - Generate SQL DDL for Database Schema Implementation
