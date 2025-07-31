const HNSWLib = require('hnswlib-node');
const { pipeline } = require('@xenova/transformers');
const fs = require('fs');
const path = require('path');
const db = require('../db');

class VectorSearchService {
  constructor() {
    this.index = null;
    this.embedder = null;
    this.isInitialized = false;
    this.indexPath = path.join(__dirname, '../storage/vector_index');
    this.embeddingsCache = new Map();
    this.maxResults = 50;
  }

  async initialize() {
    try {
      console.log('Initializing VectorSearchService...');

      // Initialize the embedding pipeline
      this.embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');

      // Create storage directory if it doesn't exist
      const storageDir = path.dirname(this.indexPath);
      if (!fs.existsSync(storageDir)) {
        fs.mkdirSync(storageDir, { recursive: true });
      }

      // Initialize or load the vector index
      await this.initializeIndex();

      this.isInitialized = true;
      console.log('VectorSearchService initialized successfully');
    } catch (error) {
      console.error('Error initializing VectorSearchService:', error);
      throw error;
    }
  }

  async initializeIndex() {
    const dimension = 384; // all-MiniLM-L6-v2 embedding dimension
    const maxElements = 100000; // Maximum number of elements

    this.index = new HNSWLib.HierarchicalNSW('cosine', dimension);

    // Try to load existing index
    if (fs.existsSync(this.indexPath + '.dat')) {
      try {
        this.index.loadIndex(this.indexPath, maxElements);
        console.log('Loaded existing vector index');
      } catch (error) {
        console.log('Failed to load existing index, creating new one');
        this.index.initIndex(maxElements);
      }
    } else {
      this.index.initIndex(maxElements);
      console.log('Created new vector index');
    }
  }

  async generateEmbedding(text) {
    if (!this.embedder) {
      throw new Error('VectorSearchService not initialized');
    }

    // Check cache first
    if (this.embeddingsCache.has(text)) {
      return this.embeddingsCache.get(text);
    }

    try {
      const output = await this.embedder(text, { pooling: 'mean', normalize: true });
      const embedding = Array.from(output.data);

      // Cache the embedding
      this.embeddingsCache.set(text, embedding);

      // Limit cache size
      if (this.embeddingsCache.size > 10000) {
        const firstKey = this.embeddingsCache.keys().next().value;
        this.embeddingsCache.delete(firstKey);
      }

      return embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw error;
    }
  }

  async indexComic(comicId, comicData) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Create searchable text from comic data
      const searchableText = this.createSearchableText(comicData);

      // Generate embedding
      const embedding = await this.generateEmbedding(searchableText);

      // Add to index
      this.index.addPoint(embedding, comicId);

      console.log(`Indexed comic ${comicId}: ${comicData.title}`);
    } catch (error) {
      console.error(`Error indexing comic ${comicId}:`, error);
      throw error;
    }
  }

  async indexAllComics() {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      console.log('Starting to index all comics...');

      const comics = await db.all(`
        SELECT 
          c.id,
          c.title,
          c.series,
          c.issue_number,
          c.publisher,
          c.publication_date,
          c.description,
          c.characters,
          c.creators,
          c.genre,
          c.age_rating,
          c.cover_image_url,
          GROUP_CONCAT(DISTINCT ct.tag_name) as tags
        FROM comics c
        LEFT JOIN comic_tags ct ON c.id = ct.comic_id
        GROUP BY c.id
        ORDER BY c.id
      `);

      console.log(`Found ${comics.length} comics to index`);

      let indexed = 0;
      for (const comic of comics) {
        try {
          await this.indexComic(comic.id, comic);
          indexed++;

          if (indexed % 100 === 0) {
            console.log(`Indexed ${indexed}/${comics.length} comics`);
          }
        } catch (error) {
          console.error(`Failed to index comic ${comic.id}:`, error);
        }
      }

      // Save the index to disk
      await this.saveIndex();

      console.log(`Successfully indexed ${indexed} comics`);
      return indexed;
    } catch (error) {
      console.error('Error indexing all comics:', error);
      throw error;
    }
  }

  async saveIndex() {
    try {
      this.index.writeIndex(this.indexPath);
      console.log('Vector index saved to disk');
    } catch (error) {
      console.error('Error saving vector index:', error);
      throw error;
    }
  }

  async searchSimilar(query, limit = 10) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Generate embedding for the query
      const queryEmbedding = await this.generateEmbedding(query);

      // Search the index
      const results = this.index.searchKnn(queryEmbedding, Math.min(limit, this.maxResults));

      // Get comic details for the results
      const comicIds = results.neighbors;
      const distances = results.distances;

      if (comicIds.length === 0) {
        return [];
      }

      const placeholders = comicIds.map(() => '?').join(',');
      const comics = await db.all(`
        SELECT 
          c.*,
          GROUP_CONCAT(DISTINCT ct.tag_name) as tags
        FROM comics c
        LEFT JOIN comic_tags ct ON c.id = ct.comic_id
        WHERE c.id IN (${placeholders})
        GROUP BY c.id
      `, comicIds);

      // Create a map for quick lookup
      const comicMap = new Map();
      comics.forEach(comic => {
        comicMap.set(comic.id, comic);
      });

      // Return results with similarity scores
      const searchResults = comicIds.map((id, index) => {
        const comic = comicMap.get(id);
        if (!comic) return null;

        const similarity = 1 - distances[index]; // Convert distance to similarity
        return {
          ...comic,
          similarity_score: Math.max(0, similarity),
          search_type: 'semantic'
        };
      }).filter(result => result !== null);

      return searchResults;
    } catch (error) {
      console.error('Error in semantic search:', error);
      throw error;
    }
  }

  async hybridSearch(query, filters = {}, limit = 20) {
    try {
      const semanticResults = await this.searchSimilar(query, limit);
      const traditionalResults = await this.traditionalSearch(query, filters, limit);

      // Combine and deduplicate results
      const combinedResults = new Map();

      // Add semantic results with higher weight
      semanticResults.forEach(result => {
        combinedResults.set(result.id, {
          ...result,
          combined_score: result.similarity_score * 0.7
        });
      });

      // Add traditional results
      traditionalResults.forEach(result => {
        if (combinedResults.has(result.id)) {
          const existing = combinedResults.get(result.id);
          existing.combined_score += result.relevance_score * 0.3;
          existing.search_type = 'hybrid';
        } else {
          combinedResults.set(result.id, {
            ...result,
            combined_score: result.relevance_score * 0.3,
            search_type: 'traditional'
          });
        }
      });

      // Sort by combined score and return top results
      const finalResults = Array.from(combinedResults.values())
        .sort((a, b) => b.combined_score - a.combined_score)
        .slice(0, limit);

      return finalResults;
    } catch (error) {
      console.error('Error in hybrid search:', error);
      throw error;
    }
  }

  async traditionalSearch(query, filters = {}, limit = 20) {
    try {
      let whereClause = 'WHERE 1=1';
      let params = [];

      // Text search
      if (query && query.trim()) {
        whereClause += ` AND (
          c.title LIKE ? OR 
          c.series LIKE ? OR 
          c.publisher LIKE ? OR 
          c.description LIKE ? OR 
          c.characters LIKE ? OR 
          c.creators LIKE ?
        )`;
        const searchTerm = `%${query.trim()}%`;
        params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
      }

      // Apply filters
      if (filters.publisher) {
        whereClause += ' AND c.publisher = ?';
        params.push(filters.publisher);
      }

      if (filters.genre) {
        whereClause += ' AND c.genre = ?';
        params.push(filters.genre);
      }

      if (filters.year) {
        whereClause += ' AND strftime("%Y", c.publication_date) = ?';
        params.push(filters.year.toString());
      }

      if (filters.minPrice || filters.maxPrice) {
        whereClause += ' AND EXISTS (SELECT 1 FROM comic_prices cp WHERE cp.comic_id = c.id';
        if (filters.minPrice) {
          whereClause += ' AND cp.price >= ?';
          params.push(filters.minPrice);
        }
        if (filters.maxPrice) {
          whereClause += ' AND cp.price <= ?';
          params.push(filters.maxPrice);
        }
        whereClause += ')';
      }

      const comics = await db.all(`
        SELECT 
          c.*,
          GROUP_CONCAT(DISTINCT ct.tag_name) as tags,
          1.0 as relevance_score
        FROM comics c
        LEFT JOIN comic_tags ct ON c.id = ct.comic_id
        ${whereClause}
        GROUP BY c.id
        ORDER BY c.title
        LIMIT ?
      `, [...params, limit]);

      return comics;
    } catch (error) {
      console.error('Error in traditional search:', error);
      throw error;
    }
  }

  createSearchableText(comic) {
    const parts = [
      comic.title || '',
      comic.series || '',
      comic.publisher || '',
      comic.description || '',
      comic.characters || '',
      comic.creators || '',
      comic.genre || '',
      comic.tags || '',
      `Issue ${comic.issue_number || ''}`.trim()
    ].filter(part => part && part.trim());

    return parts.join(' ');
  }

  async getSimilarComics(comicId, limit = 10) {
    try {
      const comic = await db.get('SELECT * FROM comics WHERE id = ?', [comicId]);
      if (!comic) {
        throw new Error('Comic not found');
      }

      const searchableText = this.createSearchableText(comic);
      const results = await this.searchSimilar(searchableText, limit + 1);

      // Remove the original comic from results
      return results.filter(result => result.id !== comicId);
    } catch (error) {
      console.error('Error finding similar comics:', error);
      throw error;
    }
  }

  async updateComicIndex(comicId) {
    try {
      const comic = await db.get(`
        SELECT 
          c.*,
          GROUP_CONCAT(DISTINCT ct.tag_name) as tags
        FROM comics c
        LEFT JOIN comic_tags ct ON c.id = ct.comic_id
        WHERE c.id = ?
        GROUP BY c.id
      `, [comicId]);

      if (comic) {
        await this.indexComic(comicId, comic);
        await this.saveIndex();
      }
    } catch (error) {
      console.error(`Error updating comic index for ${comicId}:`, error);
      throw error;
    }
  }

  async getIndexStats() {
    if (!this.isInitialized) {
      return { initialized: false };
    }

    return {
      initialized: true,
      indexedCount: this.index.getCurrentCount(),
      maxElements: this.index.getMaxElements(),
      embeddingDimension: 384,
      cacheSize: this.embeddingsCache.size,
      indexPath: this.indexPath
    };
  }
}

module.exports = VectorSearchService;
