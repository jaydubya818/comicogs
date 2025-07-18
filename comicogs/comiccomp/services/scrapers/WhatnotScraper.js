const BaseScraper = require('./BaseScraper');
const fetch = require('node-fetch');

class WhatnotScraper extends BaseScraper {
    constructor(config) {
        super('whatnot', config);
        this.marketplace = 'whatnot';
        this.baseUrl = 'https://whatnot.com';
        this.apiUrl = 'https://api.whatnot.com';
        
        // Whatnot-specific configuration
        this.categories = {
            comics: 'collectibles-trading-cards',
            vintage: 'vintage-comics',
            modern: 'modern-comics'
        };
    }

    async searchComics(query, options = {}) {
        try {
            this.validateQuery(query);
            await this.enforceRateLimit();

            console.log(`🔍 Searching Whatnot for: "${query}"...`);

            // Search both active auctions and recently completed ones
            const [activeAuctions, completedAuctions] = await Promise.all([
                this.searchActiveAuctions(query, options),
                this.searchCompletedAuctions(query, options)
            ]);

            const allListings = [...activeAuctions, ...completedAuctions];
            console.log(`✅ Found ${allListings.length} listings on Whatnot`);
            
            return allListings;

        } catch (error) {
            console.error(`❌ Whatnot search error for "${query}":`, error.message);
            throw error;
        }
    }

    async searchActiveAuctions(query, options = {}) {
        try {
            const searchParams = {
                query: query,
                category: this.categories.comics,
                status: 'live',
                limit: options.maxResults || 50,
                sort: 'ending_soon'
            };

            const response = await this.makeAPIRequest('/v1/auctions/search', {
                method: 'GET',
                params: searchParams
            });

            return this.parseAuctionResults(response.data?.auctions || [], 'active');

        } catch (error) {
            console.warn('Could not fetch active Whatnot auctions:', error.message);
            return [];
        }
    }

    async searchCompletedAuctions(query, options = {}) {
        try {
            const searchParams = {
                query: query,
                category: this.categories.comics,
                status: 'completed',
                limit: options.maxResults || 50,
                sort: 'recently_ended',
                days: options.days || 30
            };

            const response = await this.makeAPIRequest('/v1/auctions/search', {
                method: 'GET',
                params: searchParams
            });

            return this.parseAuctionResults(response.data?.auctions || [], 'completed');

        } catch (error) {
            console.warn('Could not fetch completed Whatnot auctions:', error.message);
            return [];
        }
    }

    async makeAPIRequest(endpoint, options = {}) {
        const url = `${this.apiUrl}${endpoint}`;
        const params = new URLSearchParams(options.params || {});
        const fullUrl = `${url}?${params}`;

        const response = await fetch(fullUrl, {
            method: options.method || 'GET',
            headers: {
                'Accept': 'application/json',
                'User-Agent': this.config.userAgent,
                ...options.headers
            }
        });

        if (!response.ok) {
            throw new Error(`Whatnot API error: ${response.status} ${response.statusText}`);
        }

        return await response.json();
    }

    parseAuctionResults(auctions, status) {
        return auctions.map(auction => {
            const listing = {
                id: auction.id,
                title: this.cleanText(auction.title),
                price: this.parsePrice(auction),
                condition: this.normalizeCondition(auction.condition),
                url: `${this.baseUrl}/auction/${auction.id}`,
                imageUrl: auction.images?.[0]?.url,
                seller: {
                    username: auction.seller?.username,
                    rating: auction.seller?.rating,
                    feedbackCount: auction.seller?.feedback_count
                },
                auction: {
                    status: status,
                    startTime: auction.start_time,
                    endTime: auction.end_time,
                    bidCount: auction.bid_count || 0,
                    currentBid: auction.current_bid,
                    startingBid: auction.starting_bid,
                    isLive: auction.is_live || false
                },
                marketplace: this.marketplace,
                scrapedAt: new Date().toISOString(),
                rawData: auction
            };

            // Add final sale price for completed auctions
            if (status === 'completed') {
                listing.finalPrice = auction.final_price;
                listing.saleDate = auction.end_time;
            }

            return listing;
        });
    }

    parsePrice(auction) {
        if (auction.status === 'completed' && auction.final_price) {
            return parseFloat(auction.final_price);
        }
        
        if (auction.current_bid) {
            return parseFloat(auction.current_bid);
        }
        
        if (auction.starting_bid) {
            return parseFloat(auction.starting_bid);
        }
        
        return null;
    }

    normalizeCondition(condition) {
        if (!condition) return 'Unknown';
        
        const conditionMap = {
            'mint': 'Mint',
            'near mint': 'Near Mint',
            'very fine': 'Very Fine',
            'fine': 'Fine',
            'very good': 'Very Good',
            'good': 'Good',
            'fair': 'Fair',
            'poor': 'Poor',
            'raw': 'Raw',
            'graded': 'Graded'
        };
        
        return conditionMap[condition.toLowerCase()] || condition;
    }

    async getAuctionDetails(auctionId) {
        try {
            const response = await this.makeAPIRequest(`/v1/auctions/${auctionId}`);
            const auction = response.data;

            return {
                description: this.cleanText(auction.description),
                specifications: this.extractSpecifications(auction.details),
                bidHistory: auction.bid_history || [],
                watchers: auction.watcher_count || 0,
                category: auction.category,
                tags: auction.tags || []
            };

        } catch (error) {
            console.warn(`Could not get Whatnot auction details for ${auctionId}:`, error.message);
            return {};
        }
    }

    extractSpecifications(details) {
        if (!details) return {};
        
        const specs = {};
        
        // Extract common comic specifications
        if (details.series) specs['Series'] = details.series;
        if (details.issue_number) specs['Issue'] = details.issue_number;
        if (details.publisher) specs['Publisher'] = details.publisher;
        if (details.year) specs['Year'] = details.year;
        if (details.grade) specs['Grade'] = details.grade;
        if (details.grading_service) specs['Grading Service'] = details.grading_service;
        if (details.variant) specs['Variant'] = details.variant;
        
        return specs;
    }

    async searchByCategory(category, options = {}) {
        try {
            const searchParams = {
                category: this.categories[category] || category,
                status: 'live',
                limit: options.maxResults || 100,
                sort: options.sort || 'ending_soon'
            };

            const response = await this.makeAPIRequest('/v1/auctions/category', {
                method: 'GET',
                params: searchParams
            });

            return this.parseAuctionResults(response.data?.auctions || [], 'active');

        } catch (error) {
            console.error(`Error searching Whatnot category ${category}:`, error.message);
            return [];
        }
    }

    async getTrendingComics() {
        try {
            const response = await this.makeAPIRequest('/v1/trending/comics');
            return response.data?.trending || [];

        } catch (error) {
            console.warn('Could not fetch trending comics from Whatnot:', error.message);
            return [];
        }
    }
}

module.exports = WhatnotScraper; 