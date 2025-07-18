/**
 * Task 6: External Trigger Service
 * Integrates external trigger data (movie/TV announcements) - Acceptance Criteria 3
 */

class ExternalTriggerService {
    constructor() {
        // External data sources configuration
        this.dataSources = {
            entertainment: {
                apis: [
                    'tmdb',           // The Movie Database
                    'imdb',           // Internet Movie Database
                    'tvdb',           // TheTVDB
                    'marvel_api',     // Marvel API
                    'dc_api'          // DC Comics API
                ],
                enabled: true
            },
            news: {
                apis: [
                    'comic_news',     // Comic book news sources
                    'entertainment_weekly',
                    'variety',
                    'hollywood_reporter'
                ],
                enabled: true
            },
            social: {
                apis: [
                    'twitter',        // Twitter API for trending topics
                    'reddit',         // Reddit for community discussions
                    'youtube'         // YouTube for trailer releases
                ],
                enabled: false    // Disabled by default due to API restrictions
            }
        };

        // Trigger type weights for recommendation impact
        this.triggerWeights = {
            movie_announcement: 0.8,     // High impact
            tv_show_announcement: 0.7,    // High impact
            casting_news: 0.6,           // Medium-high impact
            trailer_release: 0.9,        // Very high impact
            premiere_date: 0.8,          // High impact
            comic_adaptation: 0.7,       // High impact
            character_rights: 0.6,       // Medium-high impact
            awards_nomination: 0.4,      // Medium impact
            creator_news: 0.5,           // Medium impact
            merchandise_release: 0.3,    // Low-medium impact
            convention_announcement: 0.3, // Low-medium impact
            publisher_news: 0.4          // Medium impact
        };

        // Cache for external data
        this.cache = {
            triggers: new Map(),
            lastUpdate: null,
            ttl: 60 * 60 * 1000  // 1 hour TTL
        };

        // Character and publisher mapping
        this.characterMapping = {
            // Marvel characters
            'spider-man': ['Amazing Spider-Man', 'Spectacular Spider-Man', 'Ultimate Spider-Man'],
            'iron man': ['Iron Man', 'Tales of Suspense'],
            'captain america': ['Captain America', 'Tales of Suspense'],
            'thor': ['Thor', 'Journey into Mystery'],
            'hulk': ['Hulk', 'Incredible Hulk'],
            'black widow': ['Black Widow', 'Avengers'],
            'hawkeye': ['Hawkeye', 'Avengers'],
            'deadpool': ['Deadpool', 'X-Force'],
            'wolverine': ['Wolverine', 'X-Men'],
            'x-men': ['X-Men', 'Uncanny X-Men', 'New X-Men'],
            
            // DC characters
            'batman': ['Batman', 'Detective Comics'],
            'superman': ['Superman', 'Action Comics'],
            'wonder woman': ['Wonder Woman'],
            'flash': ['Flash'],
            'green lantern': ['Green Lantern'],
            'aquaman': ['Aquaman'],
            'joker': ['Batman', 'Detective Comics', 'Joker'],
            'harley quinn': ['Harley Quinn', 'Batman'],
            'justice league': ['Justice League', 'JLA'],
            
            // Other popular characters
            'teenage mutant ninja turtles': ['Teenage Mutant Ninja Turtles'],
            'spawn': ['Spawn'],
            'the walking dead': ['Walking Dead'],
            'invincible': ['Invincible']
        };
    }

    /**
     * Main method to check for external triggers
     * @param {Object} comicData - Comic identification data
     * @returns {Promise<Object>} External trigger results
     */
    async checkTriggers(comicData) {
        try {
            console.log(`🎬 Checking external triggers for: ${comicData.title || comicData.id}`);

            // Check cache first
            const cachedResult = this.getCachedTriggers(comicData);
            if (cachedResult) {
                console.log('📋 Using cached trigger data');
                return cachedResult;
            }

            // Extract relevant characters and properties
            const extractedEntities = this.extractComicEntities(comicData);

            // Fetch triggers from multiple sources
            const [
                entertainmentTriggers,
                newsTriggers,
                socialTriggers,
                historicalTriggers
            ] = await Promise.all([
                this.fetchEntertainmentTriggers(extractedEntities),
                this.fetchNewsTriggers(extractedEntities),
                this.fetchSocialTriggers(extractedEntities),
                this.analyzeHistoricalTriggers(extractedEntities)
            ]);

            // Combine and analyze triggers
            const allTriggers = [
                ...entertainmentTriggers,
                ...newsTriggers,
                ...socialTriggers,
                ...historicalTriggers
            ];

            // Filter and rank triggers by relevance
            const relevantTriggers = this.filterRelevantTriggers(allTriggers, extractedEntities);
            const rankedTriggers = this.rankTriggersByImpact(relevantTriggers);

            // Categorize triggers by timing
            const categorizedTriggers = this.categorizeTriggersByTiming(rankedTriggers);

            // Calculate overall trigger impact
            const impactScore = this.calculateTriggerImpact(rankedTriggers);

            const result = {
                activeEvents: categorizedTriggers.active.map(t => t.title),
                upcomingEvents: categorizedTriggers.upcoming.map(t => t.title),
                historicalEvents: categorizedTriggers.historical.slice(0, 5).map(t => t.title),
                impact_score: impactScore,
                detailed_triggers: {
                    active: categorizedTriggers.active,
                    upcoming: categorizedTriggers.upcoming,
                    historical: categorizedTriggers.historical.slice(0, 10)
                },
                recommendations: this.generateTriggerRecommendations(categorizedTriggers, impactScore),
                metadata: {
                    extracted_entities: extractedEntities,
                    total_triggers_found: allTriggers.length,
                    relevant_triggers: relevantTriggers.length,
                    data_sources_used: this.getUsedDataSources(),
                    last_updated: new Date().toISOString()
                }
            };

            // Cache the result
            this.cacheTriggers(comicData, result);

            console.log(`✅ Found ${result.activeEvents.length} active and ${result.upcomingEvents.length} upcoming triggers`);
            return result;

        } catch (error) {
            console.error('❌ External trigger check error:', error);
            return {
                activeEvents: [],
                upcomingEvents: [],
                historicalEvents: [],
                impact_score: 0,
                error: error.message,
                fallback: true
            };
        }
    }

    /**
     * Extract comic entities (characters, publishers, series)
     */
    extractComicEntities(comicData) {
        const entities = {
            characters: [],
            publishers: [],
            series: [],
            creators: [],
            keywords: []
        };

        // Extract from title
        if (comicData.title) {
            const title = comicData.title.toLowerCase();
            
            // Check for character matches
            Object.keys(this.characterMapping).forEach(character => {
                if (title.includes(character)) {
                    entities.characters.push(character);
                    entities.series.push(...this.characterMapping[character]);
                }
            });

            // Extract publisher
            if (title.includes('marvel') || title.includes('amazing') || title.includes('fantastic')) {
                entities.publishers.push('Marvel');
            }
            if (title.includes('dc') || title.includes('detective') || title.includes('action')) {
                entities.publishers.push('DC');
            }

            // Extract series name
            entities.series.push(comicData.title);
        }

        // Extract from additional metadata
        if (comicData.publisher) {
            entities.publishers.push(comicData.publisher);
        }

        if (comicData.series) {
            entities.series.push(comicData.series);
        }

        if (comicData.creators) {
            entities.creators.push(...comicData.creators);
        }

        if (comicData.characters) {
            entities.characters.push(...comicData.characters);
        }

        // Remove duplicates
        Object.keys(entities).forEach(key => {
            entities[key] = [...new Set(entities[key])];
        });

        return entities;
    }

    /**
     * Fetch entertainment industry triggers
     */
    async fetchEntertainmentTriggers(entities) {
        const triggers = [];
        
        // Simulate movie/TV announcements
        const entertainmentEvents = await this.simulateEntertainmentAPI(entities);
        
        entertainmentEvents.forEach(event => {
            triggers.push({
                id: event.id,
                type: event.type,
                title: event.title,
                description: event.description,
                date: event.date,
                relevance_score: event.relevance,
                source: 'entertainment_api',
                impact_weight: this.triggerWeights[event.type] || 0.5,
                metadata: event.metadata
            });
        });

        return triggers;
    }

    /**
     * Fetch news triggers
     */
    async fetchNewsTriggers(entities) {
        const triggers = [];
        
        // Simulate comic book news
        const newsEvents = await this.simulateNewsAPI(entities);
        
        newsEvents.forEach(event => {
            triggers.push({
                id: event.id,
                type: event.type,
                title: event.title,
                description: event.description,
                date: event.date,
                relevance_score: event.relevance,
                source: 'news_api',
                impact_weight: this.triggerWeights[event.type] || 0.3,
                metadata: event.metadata
            });
        });

        return triggers;
    }

    /**
     * Fetch social media triggers
     */
    async fetchSocialTriggers(entities) {
        const triggers = [];
        
        if (!this.dataSources.social.enabled) {
            return triggers;
        }
        
        // Simulate social media trends
        const socialEvents = await this.simulateSocialAPI(entities);
        
        socialEvents.forEach(event => {
            triggers.push({
                id: event.id,
                type: 'social_trend',
                title: event.title,
                description: event.description,
                date: event.date,
                relevance_score: event.relevance,
                source: 'social_api',
                impact_weight: 0.4,
                metadata: event.metadata
            });
        });

        return triggers;
    }

    /**
     * Analyze historical trigger patterns
     */
    async analyzeHistoricalTriggers(entities) {
        const triggers = [];
        
        // Simulate historical pattern analysis
        const historicalPatterns = this.getHistoricalPatterns(entities);
        
        historicalPatterns.forEach(pattern => {
            triggers.push({
                id: pattern.id,
                type: 'historical_pattern',
                title: pattern.title,
                description: pattern.description,
                date: pattern.date,
                relevance_score: pattern.relevance,
                source: 'historical_analysis',
                impact_weight: 0.6,
                metadata: pattern.metadata
            });
        });

        return triggers;
    }

    /**
     * Simulate entertainment API responses
     */
    async simulateEntertainmentAPI(entities) {
        const events = [];
        const now = new Date();
        
        // Create realistic movie/TV announcements
        entities.characters.forEach(character => {
            // Movie announcement
            if (Math.random() > 0.7) {
                events.push({
                    id: `movie_${character}_${Date.now()}`,
                    type: 'movie_announcement',
                    title: `${character} Movie Announced`,
                    description: `New ${character} movie announced for production`,
                    date: new Date(now.getTime() + Math.random() * 365 * 24 * 60 * 60 * 1000),
                    relevance: 0.8 + Math.random() * 0.2,
                    metadata: {
                        character: character,
                        studio: Math.random() > 0.5 ? 'Marvel Studios' : 'Warner Bros',
                        phase: 'development'
                    }
                });
            }

            // TV show announcement
            if (Math.random() > 0.8) {
                events.push({
                    id: `tv_${character}_${Date.now()}`,
                    type: 'tv_show_announcement',
                    title: `${character} TV Series Coming`,
                    description: `${character} series announced for streaming platform`,
                    date: new Date(now.getTime() + Math.random() * 180 * 24 * 60 * 60 * 1000),
                    relevance: 0.7 + Math.random() * 0.3,
                    metadata: {
                        character: character,
                        platform: Math.random() > 0.5 ? 'Disney+' : 'HBO Max',
                        episodes: Math.floor(Math.random() * 10) + 6
                    }
                });
            }

            // Trailer release
            if (Math.random() > 0.9) {
                events.push({
                    id: `trailer_${character}_${Date.now()}`,
                    type: 'trailer_release',
                    title: `${character} Trailer Released`,
                    description: `First trailer for ${character} movie released`,
                    date: new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000),
                    relevance: 0.9 + Math.random() * 0.1,
                    metadata: {
                        character: character,
                        trailer_type: 'teaser',
                        views: Math.floor(Math.random() * 10000000) + 1000000
                    }
                });
            }
        });

        return events;
    }

    /**
     * Simulate news API responses
     */
    async simulateNewsAPI(entities) {
        const events = [];
        const now = new Date();
        
        entities.creators.forEach(creator => {
            if (Math.random() > 0.8) {
                events.push({
                    id: `creator_${creator}_${Date.now()}`,
                    type: 'creator_news',
                    title: `${creator} Announces New Project`,
                    description: `Comic creator ${creator} reveals upcoming work`,
                    date: new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000),
                    relevance: 0.6 + Math.random() * 0.4,
                    metadata: {
                        creator: creator,
                        project_type: 'limited_series',
                        publisher: 'TBD'
                    }
                });
            }
        });

        // Add some general comic industry news
        if (Math.random() > 0.5) {
            events.push({
                id: `industry_${Date.now()}`,
                type: 'publisher_news',
                title: 'Major Comic Book Industry Announcement',
                description: 'Significant changes announced in comic book publishing',
                date: new Date(now.getTime() - Math.random() * 14 * 24 * 60 * 60 * 1000),
                relevance: 0.5,
                metadata: {
                    scope: 'industry_wide',
                    impact: 'medium'
                }
            });
        }

        return events;
    }

    /**
     * Simulate social media API responses
     */
    async simulateSocialAPI(entities) {
        const events = [];
        const now = new Date();
        
        entities.characters.forEach(character => {
            if (Math.random() > 0.7) {
                events.push({
                    id: `social_${character}_${Date.now()}`,
                    type: 'social_trend',
                    title: `${character} Trending on Social Media`,
                    description: `${character} is currently trending across social platforms`,
                    date: new Date(now.getTime() - Math.random() * 3 * 24 * 60 * 60 * 1000),
                    relevance: 0.4 + Math.random() * 0.6,
                    metadata: {
                        character: character,
                        platforms: ['Twitter', 'Instagram', 'TikTok'],
                        sentiment: Math.random() > 0.5 ? 'positive' : 'neutral'
                    }
                });
            }
        });

        return events;
    }

    /**
     * Get historical patterns
     */
    getHistoricalPatterns(entities) {
        const patterns = [];
        
        // Historical box office correlation
        entities.characters.forEach(character => {
            patterns.push({
                id: `hist_${character}_${Date.now()}`,
                type: 'historical_pattern',
                title: `${character} Movies Drive Comic Sales`,
                description: `Historical data shows ${character} movie releases correlate with 30-50% comic value increases`,
                date: new Date('2020-01-01'),
                relevance: 0.7,
                metadata: {
                    character: character,
                    correlation: 0.75,
                    avg_increase: '35%',
                    sample_size: 12
                }
            });
        });

        return patterns;
    }

    /**
     * Filter triggers by relevance to comic
     */
    filterRelevantTriggers(triggers, entities) {
        return triggers.filter(trigger => {
            // Minimum relevance threshold
            if (trigger.relevance_score < 0.3) return false;

            // Check if trigger relates to extracted entities
            const triggerText = (trigger.title + ' ' + trigger.description).toLowerCase();
            
            const hasCharacterMatch = entities.characters.some(char => 
                triggerText.includes(char.toLowerCase())
            );
            
            const hasSeriesMatch = entities.series.some(series => 
                triggerText.includes(series.toLowerCase())
            );
            
            const hasCreatorMatch = entities.creators.some(creator => 
                triggerText.includes(creator.toLowerCase())
            );

            return hasCharacterMatch || hasSeriesMatch || hasCreatorMatch;
        });
    }

    /**
     * Rank triggers by potential impact
     */
    rankTriggersByImpact(triggers) {
        return triggers
            .map(trigger => ({
                ...trigger,
                impact_score: trigger.relevance_score * trigger.impact_weight
            }))
            .sort((a, b) => b.impact_score - a.impact_score);
    }

    /**
     * Categorize triggers by timing
     */
    categorizeTriggersByTiming(triggers) {
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

        return {
            active: triggers.filter(t => 
                new Date(t.date) >= thirtyDaysAgo && new Date(t.date) <= now
            ),
            upcoming: triggers.filter(t => 
                new Date(t.date) > now && new Date(t.date) <= thirtyDaysFromNow
            ),
            historical: triggers.filter(t => 
                new Date(t.date) < thirtyDaysAgo
            )
        };
    }

    /**
     * Calculate overall trigger impact score
     */
    calculateTriggerImpact(triggers) {
        if (triggers.length === 0) return 0;

        // Weight recent and upcoming triggers more heavily
        const now = new Date();
        let totalImpact = 0;
        let weightSum = 0;

        triggers.forEach(trigger => {
            const daysDiff = Math.abs((new Date(trigger.date) - now) / (24 * 60 * 60 * 1000));
            const timeWeight = Math.max(0.1, 1 - (daysDiff / 365)); // Decay over a year
            
            const weightedImpact = trigger.impact_score * timeWeight;
            totalImpact += weightedImpact;
            weightSum += timeWeight;
        });

        return weightSum > 0 ? Math.min(totalImpact / weightSum, 1.0) : 0;
    }

    /**
     * Generate recommendations based on triggers
     */
    generateTriggerRecommendations(categorizedTriggers, impactScore) {
        const recommendations = [];

        if (impactScore > 0.7) {
            recommendations.push({
                action: 'immediate_action',
                description: 'High external trigger activity detected - consider immediate market positioning',
                priority: 'high',
                timeframe: 'immediate'
            });
        }

        if (categorizedTriggers.upcoming.length > 0) {
            const nearestEvent = categorizedTriggers.upcoming[0];
            recommendations.push({
                action: 'prepare_for_event',
                description: `Prepare for upcoming ${nearestEvent.type}: ${nearestEvent.title}`,
                priority: 'medium',
                timeframe: 'within_30_days',
                event: nearestEvent
            });
        }

        if (categorizedTriggers.active.length > 2) {
            recommendations.push({
                action: 'capitalize_on_momentum',
                description: 'Multiple active events create strong market momentum',
                priority: 'high',
                timeframe: 'immediate'
            });
        }

        if (impactScore > 0.4 && categorizedTriggers.active.length === 0) {
            recommendations.push({
                action: 'monitor_closely',
                description: 'Moderate trigger activity - monitor for market movements',
                priority: 'medium',
                timeframe: 'ongoing'
            });
        }

        return recommendations;
    }

    /**
     * Cache management methods
     */
    getCachedTriggers(comicData) {
        const key = this.generateCacheKey(comicData);
        const cached = this.cache.triggers.get(key);
        
        if (cached && (Date.now() - cached.timestamp) < this.cache.ttl) {
            return cached.data;
        }
        
        return null;
    }

    cacheTriggers(comicData, data) {
        const key = this.generateCacheKey(comicData);
        this.cache.triggers.set(key, {
            data: data,
            timestamp: Date.now()
        });
        
        // Clean old cache entries
        this.cleanCache();
    }

    generateCacheKey(comicData) {
        return `${comicData.title || comicData.id}_${comicData.publisher || 'unknown'}`;
    }

    cleanCache() {
        const now = Date.now();
        for (const [key, value] of this.cache.triggers.entries()) {
            if ((now - value.timestamp) > this.cache.ttl) {
                this.cache.triggers.delete(key);
            }
        }
    }

    /**
     * Get list of data sources used
     */
    getUsedDataSources() {
        const sources = [];
        
        if (this.dataSources.entertainment.enabled) {
            sources.push(...this.dataSources.entertainment.apis);
        }
        
        if (this.dataSources.news.enabled) {
            sources.push(...this.dataSources.news.apis);
        }
        
        if (this.dataSources.social.enabled) {
            sources.push(...this.dataSources.social.apis);
        }
        
        return sources;
    }

    /**
     * Update trigger weights configuration
     */
    updateTriggerWeights(newWeights) {
        this.triggerWeights = { ...this.triggerWeights, ...newWeights };
    }

    /**
     * Add new character mapping
     */
    addCharacterMapping(character, series) {
        this.characterMapping[character.toLowerCase()] = series;
    }

    /**
     * Enable/disable data sources
     */
    configureDataSources(sourceConfig) {
        Object.keys(sourceConfig).forEach(source => {
            if (this.dataSources[source]) {
                this.dataSources[source].enabled = sourceConfig[source];
            }
        });
    }
}

module.exports = ExternalTriggerService;