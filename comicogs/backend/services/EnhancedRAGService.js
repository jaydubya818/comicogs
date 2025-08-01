const VectorSearchService = require('./VectorSearchService');
const db = require('../db');
const { OpenAI } = require('openai');

/**
 * Enhanced RAG (Retrieval-Augmented Generation) Service
 * Combines vector search with contextual generation for intelligent comic discovery
 */
class EnhancedRAGService {
  constructor() {
    this.vectorService = new VectorSearchService();
    this.openai = process.env.OPENAI_API_KEY ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    }) : null;
    this.contextWindow = 4000; // Max tokens for context
    this.isInitialized = false;
    this.hasOpenAI = !!process.env.OPENAI_API_KEY;
  }

  async initialize() {
    try {
      console.log('Initializing Enhanced RAG Service...');
      
      // Initialize vector search service
      if (!this.vectorService.isInitialized) {
        await this.vectorService.initialize();
      }
      
      this.isInitialized = true;
      console.log('Enhanced RAG Service initialized successfully');
    } catch (error) {
      console.error('Error initializing Enhanced RAG Service:', error);
      throw error;
    }
  }

  /**
   * Perform contextual search with AI-generated responses
   */
  async contextualSearch(query, options = {}) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const {
      limit = 10,
      includeExplanation = true,
      searchType = 'hybrid',
      userContext = null,
      conversationHistory = []
    } = options;

    try {
      // Step 1: Enhance query using conversation context
      const enhancedQuery = await this.enhanceQueryWithContext(query, conversationHistory, userContext);
      
      // Step 2: Perform vector search
      const vectorResults = await this.vectorService.searchSimilar(enhancedQuery, limit * 2);
      
      // Step 3: Perform traditional search for comparison
      const traditionalResults = await this.performTraditionalSearch(enhancedQuery, limit);
      
      // Step 4: Combine and rank results
      const combinedResults = await this.combineSearchResults(vectorResults, traditionalResults, query);
      
      // Step 5: Generate contextual explanations
      const enrichedResults = await this.enrichResultsWithContext(
        combinedResults.slice(0, limit), 
        query, 
        userContext
      );
      
      // Step 6: Generate AI summary/insights
      const aiInsights = includeExplanation ? 
        await this.generateSearchInsights(query, enrichedResults, userContext) : null;

      return {
        success: true,
        query: {
          original: query,
          enhanced: enhancedQuery,
          search_type: searchType
        },
        results: enrichedResults,
        ai_insights: aiInsights,
        result_count: enrichedResults.length,
        search_metadata: {
          vector_results: vectorResults.length,
          traditional_results: traditionalResults.length,
          combined_results: combinedResults.length
        }
      };

    } catch (error) {
      console.error('Error in contextual search:', error);
      return {
        success: false,
        error: error.message,
        results: []
      };
    }
  }

  /**
   * Enhance query using conversation context and user preferences
   */
  async enhanceQueryWithContext(query, conversationHistory, userContext) {
    try {
      if (!this.hasOpenAI) {
        console.warn('OpenAI API key not configured, returning original query');
        return query;
      }
      
      const contextPrompt = this.buildContextPrompt(query, conversationHistory, userContext);
      
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are a comic book expert helping to enhance search queries. Based on the conversation context and user preferences, expand and improve the search query to find the most relevant comics. Return only the enhanced query, no additional text.`
          },
          {
            role: 'user',
            content: contextPrompt
          }
        ],
        max_tokens: 100,
        temperature: 0.3
      });

      const enhancedQuery = response.choices[0].message.content.trim();
      return enhancedQuery || query; // Fallback to original if enhancement fails

    } catch (error) {
      console.error('Error enhancing query:', error);
      return query; // Fallback to original query
    }
  }

  buildContextPrompt(query, conversationHistory, userContext) {
    let prompt = `Original query: "${query}"\n\n`;
    
    if (userContext) {
      prompt += `User preferences:\n`;
      if (userContext.favorite_publishers) {
        prompt += `- Favorite publishers: ${userContext.favorite_publishers.join(', ')}\n`;
      }
      if (userContext.favorite_genres) {
        prompt += `- Favorite genres: ${userContext.favorite_genres.join(', ')}\n`;
      }
      if (userContext.collection_size) {
        prompt += `- Collection size: ${userContext.collection_size}\n`;
      }
      prompt += '\n';
    }
    
    if (conversationHistory.length > 0) {
      prompt += `Recent conversation:\n`;
      conversationHistory.slice(-3).forEach((msg, index) => {
        prompt += `${msg.role}: ${msg.content}\n`;
      });
      prompt += '\n';
    }
    
    prompt += `Please enhance this search query to be more specific and likely to find relevant comics:`;
    
    return prompt;
  }

  /**
   * Perform traditional database search for comparison
   */
  async performTraditionalSearch(query, limit) {
    try {
      const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 2);
      const conditions = searchTerms.map(() => `(
        LOWER(c.title) LIKE ? OR 
        LOWER(c.series) LIKE ? OR 
        LOWER(c.description) LIKE ? OR 
        LOWER(c.characters) LIKE ? OR 
        LOWER(c.creators) LIKE ?
      )`).join(' AND ');
      
      const params = [];
      searchTerms.forEach(term => {
        const likePattern = `%${term}%`;
        params.push(likePattern, likePattern, likePattern, likePattern, likePattern);
      });
      
      const results = await db.all(`
        SELECT 
          c.*,
          GROUP_CONCAT(DISTINCT ct.tag_name) as tags,
          0.5 as similarity_score
        FROM comics c
        LEFT JOIN comic_tags ct ON c.id = ct.comic_id
        WHERE ${conditions}
        GROUP BY c.id
        ORDER BY c.id
        LIMIT ?
      `, [...params, limit]);

      return results;

    } catch (error) {
      console.error('Error in traditional search:', error);
      return [];
    }
  }

  /**
   * Combine vector and traditional search results with smart ranking
   */
  async combineSearchResults(vectorResults, traditionalResults, originalQuery) {
    const combined = new Map();
    
    // Add vector results with higher weight
    vectorResults.forEach((result, index) => {
      const relevanceScore = 1 - (index / vectorResults.length); // Higher for earlier results
      combined.set(result.id, {
        ...result,
        vector_score: result.similarity_score || relevanceScore,
        traditional_score: 0,
        combined_score: result.similarity_score || relevanceScore
      });
    });
    
    // Add or boost traditional results
    traditionalResults.forEach((result, index) => {
      const relevanceScore = 1 - (index / traditionalResults.length);
      
      if (combined.has(result.id)) {
        // Boost existing result
        const existing = combined.get(result.id);
        existing.traditional_score = relevanceScore;
        existing.combined_score = (existing.vector_score * 0.7) + (relevanceScore * 0.3);
      } else {
        // Add new result
        combined.set(result.id, {
          ...result,
          vector_score: 0,
          traditional_score: relevanceScore,
          combined_score: relevanceScore * 0.3 // Lower weight for traditional-only
        });
      }
    });
    
    // Convert to array and sort by combined score
    return Array.from(combined.values())
      .sort((a, b) => b.combined_score - a.combined_score);
  }

  /**
   * Enrich results with contextual information
   */
  async enrichResultsWithContext(results, query, userContext) {
    const enriched = [];
    
    for (const result of results) {
      try {
        // Get additional comic details
        const comicDetails = await this.getEnhancedComicDetails(result.id);
        
        // Calculate relevance reasons
        const relevanceReasons = await this.calculateRelevanceReasons(result, query, userContext);
        
        // Add reading recommendations
        const readingRecs = await this.getReadingRecommendations(result.id, userContext);
        
        enriched.push({
          ...result,
          ...comicDetails,
          relevance_score: result.combined_score,
          relevance_reasons: relevanceReasons,
          reading_recommendations: readingRecs,
          search_metadata: {
            vector_score: result.vector_score,
            traditional_score: result.traditional_score,
            combined_score: result.combined_score
          }
        });

      } catch (error) {
        console.error(`Error enriching result ${result.id}:`, error);
        // Add basic result even if enrichment fails
        enriched.push({
          ...result,
          relevance_score: result.combined_score
        });
      }
    }
    
    return enriched;
  }

  async getEnhancedComicDetails(comicId) {
    try {
      const details = await db.get(`
        SELECT 
          c.*,
          AVG(cr.rating) as average_rating,
          COUNT(cr.id) as rating_count,
          COUNT(co.id) as collection_count,
          COUNT(wl.id) as wishlist_count,
          GROUP_CONCAT(DISTINCT ct.tag_name) as tags
        FROM comics c
        LEFT JOIN comic_ratings cr ON c.id = cr.comic_id
        LEFT JOIN collections co ON c.id = co.comic_id
        LEFT JOIN wantlists wl ON c.id = wl.comic_id
        LEFT JOIN comic_tags ct ON c.id = ct.comic_id
        WHERE c.id = ?
        GROUP BY c.id
      `, [comicId]);

      return {
        community_stats: {
          average_rating: details?.average_rating || null,
          rating_count: details?.rating_count || 0,
          collection_count: details?.collection_count || 0,
          wishlist_count: details?.wishlist_count || 0
        },
        enhanced_tags: details?.tags ? details.tags.split(',') : []
      };

    } catch (error) {
      console.error(`Error getting enhanced details for comic ${comicId}:`, error);
      return {
        community_stats: {},
        enhanced_tags: []
      };
    }
  }

  async calculateRelevanceReasons(result, query, userContext) {
    const reasons = [];
    
    // Query matching reasons
    const queryLower = query.toLowerCase();
    if (result.title && result.title.toLowerCase().includes(queryLower)) {
      reasons.push(`Title matches "${query}"`);
    }
    if (result.description && result.description.toLowerCase().includes(queryLower)) {
      reasons.push(`Description mentions "${query}"`);
    }
    if (result.characters && result.characters.toLowerCase().includes(queryLower)) {
      reasons.push(`Features character from "${query}"`);
    }
    
    // User context reasons
    if (userContext) {
      if (userContext.favorite_publishers && userContext.favorite_publishers.includes(result.publisher)) {
        reasons.push(`From ${result.publisher}, one of your favorite publishers`);
      }
      if (userContext.favorite_genres && result.genre && 
          userContext.favorite_genres.some(genre => result.genre.includes(genre))) {
        reasons.push(`Matches your preferred genres`);
      }
    }
    
    // Quality indicators
    if (result.vector_score > 0.8) {
      reasons.push('High semantic similarity to your search');
    }
    if (result.community_stats?.average_rating > 4.0) {
      reasons.push(`Highly rated by community (${result.community_stats.average_rating.toFixed(1)}/5.0)`);
    }
    if (result.community_stats?.collection_count > 50) {
      reasons.push('Popular among collectors');
    }
    
    return reasons.slice(0, 3); // Limit to top 3 reasons
  }

  async getReadingRecommendations(comicId, userContext) {
    const recommendations = [];
    
    try {
      // Find related issues in the same series
      const seriesIssues = await db.all(`
        SELECT id, title, issue_number, publication_date
        FROM comics 
        WHERE series = (SELECT series FROM comics WHERE id = ?) 
        AND id != ?
        ORDER BY issue_number
        LIMIT 5
      `, [comicId, comicId]);
      
      if (seriesIssues.length > 0) {
        recommendations.push({
          type: 'series_continuation',
          title: 'More from this series',
          items: seriesIssues
        });
      }
      
      // Find similar comics by the same creator
      const creatorWorks = await db.all(`
        SELECT c.id, c.title, c.issue_number
        FROM comics c
        WHERE c.creators LIKE (
          SELECT '%' || SUBSTR(creators, 1, INSTR(creators, ',') - 1) || '%'
          FROM comics WHERE id = ?
        )
        AND c.id != ?
        LIMIT 3
      `, [comicId, comicId]);
      
      if (creatorWorks.length > 0) {
        recommendations.push({
          type: 'same_creator',
          title: 'More by same creator',
          items: creatorWorks
        });
      }

    } catch (error) {
      console.error(`Error getting reading recommendations for ${comicId}:`, error);
    }
    
    return recommendations;
  }

  /**
   * Generate AI insights about the search results
   */
  async generateSearchInsights(query, results, userContext) {
    try {
      if (!this.hasOpenAI) {
        return {
          insights: 'AI insights unavailable - OpenAI API key not configured',
          recommendations: [],
          trends: []
        };
      }
      
      const topResults = results.slice(0, 5);
      const resultsText = topResults.map(r => 
        `${r.title} (${r.publisher}) - ${r.description?.substring(0, 100) || 'No description'}`
      ).join('\n');

      const prompt = `Based on these search results for "${query}":\n\n${resultsText}\n\nProvide brief insights about the search results, trends, and recommendations (max 200 words):`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a comic book expert providing insights about search results. Be concise and helpful.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 200,
        temperature: 0.7
      });

      return {
        summary: response.choices[0].message.content.trim(),
        generated_at: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error generating AI insights:', error);
      return {
        summary: 'Unable to generate insights at this time.',
        generated_at: new Date().toISOString()
      };
    }
  }

  /**
   * Perform semantic question answering about comics
   */
  async answerQuestion(question, context = {}) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.hasOpenAI) {
      return {
        success: false,
        answer: 'AI-powered question answering unavailable - OpenAI API key not configured',
        confidence: 0
      };
    }

    try {
      // First, search for relevant comics based on the question
      const searchResults = await this.contextualSearch(question, {
        limit: 5,
        includeExplanation: false,
        userContext: context
      });

      if (!searchResults.success || searchResults.results.length === 0) {
        return {
          success: false,
          answer: "I couldn't find relevant information to answer your question.",
          confidence: 0
        };
      }

      // Build context from search results
      const contextText = searchResults.results.map(comic => 
        `${comic.title} (${comic.publisher}): ${comic.description || 'No description available'}`
      ).join('\n\n');

      // Generate answer using GPT
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are a knowledgeable comic book expert. Answer questions based on the provided comic information. If you don't have enough information, say so clearly.`
          },
          {
            role: 'user',
            content: `Question: ${question}\n\nRelevant comics:\n${contextText}\n\nAnswer:`
          }
        ],
        max_tokens: 300,
        temperature: 0.5
      });

      const answer = response.choices[0].message.content.trim();

      return {
        success: true,
        question,
        answer,
        confidence: 0.8, // Base confidence for GPT responses
        sources: searchResults.results.slice(0, 3).map(r => ({
          title: r.title,
          id: r.id,
          relevance_score: r.relevance_score
        })),
        generated_at: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error answering question:', error);
      return {
        success: false,
        question,
        answer: "I encountered an error while processing your question.",
        confidence: 0
      };
    }
  }

  /**
   * Get conversation-aware recommendations
   */
  async getConversationalRecommendations(conversationHistory, userContext) {
    try {
      // Extract topics and preferences from conversation
      const conversationText = conversationHistory
        .map(msg => msg.content)
        .join(' ')
        .toLowerCase();
      
      // Identify mentioned topics
      const mentionedTopics = this.extractTopicsFromConversation(conversationText);
      
      // Build search query from conversation context
      const searchQuery = mentionedTopics.join(' ');
      
      // Perform contextual search
      const results = await this.contextualSearch(searchQuery, {
        limit: 8,
        includeExplanation: true,
        userContext,
        conversationHistory
      });

      return {
        success: true,
        conversation_topics: mentionedTopics,
        recommendations: results.results,
        explanation: `Based on your conversation about ${mentionedTopics.join(', ')}, here are some comics you might enjoy.`,
        generated_at: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error getting conversational recommendations:', error);
      return {
        success: false,
        recommendations: [],
        error: error.message
      };
    }
  }

  extractTopicsFromConversation(conversationText) {
    const comicKeywords = [
      'superman', 'batman', 'spider-man', 'x-men', 'avengers', 'justice league',
      'marvel', 'dc', 'image', 'dark horse', 'vertigo',
      'superhero', 'villain', 'mutant', 'alien', 'magic', 'sci-fi', 'horror',
      'origin', 'crossover', 'event', 'series', 'ongoing', 'limited',
      'writer', 'artist', 'penciler', 'colorist'
    ];

    const mentionedTopics = comicKeywords.filter(keyword => 
      conversationText.includes(keyword)
    );

    return mentionedTopics.length > 0 ? mentionedTopics : ['comics', 'recommendations'];
  }
}

module.exports = new EnhancedRAGService();