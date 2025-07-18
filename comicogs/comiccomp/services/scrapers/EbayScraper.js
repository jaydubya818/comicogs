const BaseScraper = require('./BaseScraper');
const EBay = require('ebay-api');

class EbayScraper extends BaseScraper {
    constructor(config) {
        super('ebay', config);
        this.marketplace = 'ebay';
        
        // Initialize eBay API client
        this.ebayApi = new EBay({
            clientID: config.apiKeys?.ebayClientId || process.env.EBAY_CLIENT_ID,
            clientSecret: config.apiKeys?.ebayClientSecret || process.env.EBAY_CLIENT_SECRET,
            sandbox: config.ebay?.sandbox !== false, // Default to sandbox for testing
            siteID: config.ebay?.siteId || 0, // US site
            acceptLanguage: config.ebay?.language || 'en-US',
            contentLanguage: config.ebay?.language || 'en-US'
        });
        
        this.searchDefaults = {
            categoryId: '63', // Comics category
            sortOrder: 'PricePlusShippingLowest',
            outputSelector: [
                'SellerInfo',
                'PictureURLSuperSize',
                'PictureURLLarge',
                'UnitPriceInfo',
                'StoreInfo'
            ],
            itemFilter: [
                {
                    name: 'Condition',
                    value: ['New', 'Like New', 'Very Good', 'Good', 'Acceptable']
                },
                {
                    name: 'ListingType',
                    value: ['FixedPrice', 'Auction', 'AuctionWithBIN']
                },
                {
                    name: 'MaxPrice',
                    value: 10000,
                    paramName: 'Currency',
                    paramValue: 'USD'
                }
            ]
        };
    }

    async searchComics(query, options = {}) {
        try {
            this.validateQuery(query);
            await this.enforceRateLimit();

            const searchParams = this.buildSearchParams(query, options);
            console.log(`🔍 Searching eBay for: "${query}"...`);

            // Use eBay Finding API to search for comics
            const response = await this.ebayApi.finding.findItemsAdvanced({
                keywords: query,
                ...searchParams
            });

            const items = this.parseSearchResults(response);
            
            // Get additional details for each item
            const detailedItems = await this.enrichItemDetails(items);
            
            console.log(`✅ Found ${detailedItems.length} listings on eBay`);
            return detailedItems;

        } catch (error) {
            console.error(`❌ eBay search error for "${query}":`, error.message);
            throw error;
        }
    }

    buildSearchParams(query, options) {
        const params = { ...this.searchDefaults };
        
        // Apply options
        if (options.maxPrice) {
            params.itemFilter = params.itemFilter.map(filter => 
                filter.name === 'MaxPrice' 
                    ? { ...filter, value: options.maxPrice }
                    : filter
            );
        }
        
        if (options.condition) {
            params.itemFilter = params.itemFilter.map(filter => 
                filter.name === 'Condition'
                    ? { ...filter, value: Array.isArray(options.condition) ? options.condition : [options.condition] }
                    : filter
            );
        }
        
        if (options.sortOrder) {
            params.sortOrder = options.sortOrder;
        }
        
        if (options.maxResults) {
            params.paginationInput = {
                entriesPerPage: Math.min(options.maxResults, 100)
            };
        }

        return params;
    }

    parseSearchResults(response) {
        if (!response?.searchResult?.item) {
            return [];
        }

        const items = Array.isArray(response.searchResult.item) 
            ? response.searchResult.item 
            : [response.searchResult.item];

        return items.map(item => ({
            id: item.itemId,
            title: this.cleanText(item.title),
            price: this.parsePrice(item.sellingStatus?.currentPrice),
            condition: this.normalizeCondition(item.condition?.conditionDisplayName),
            url: item.viewItemURL,
            imageUrl: item.galleryURL || item.pictureURLSuperSize || item.pictureURLLarge,
            seller: {
                username: item.sellerInfo?.sellerUserName,
                feedbackScore: parseInt(item.sellerInfo?.feedbackScore) || 0,
                positiveFeedbackPercent: parseFloat(item.sellerInfo?.positiveFeedbackPercent) || 0
            },
            listing: {
                type: item.listingInfo?.listingType,
                format: item.listingInfo?.buyItNowAvailable ? 'Buy It Now' : 'Auction',
                endTime: item.listingInfo?.endTime,
                watchCount: parseInt(item.listingInfo?.watchCount) || 0
            },
            shipping: {
                cost: this.parsePrice(item.shippingInfo?.shippingServiceCost),
                type: item.shippingInfo?.shippingType,
                locations: item.shippingInfo?.shipToLocations
            },
            location: item.location,
            categoryId: item.primaryCategory?.categoryId,
            categoryName: item.primaryCategory?.categoryName,
            marketplace: this.marketplace,
            scrapedAt: new Date().toISOString(),
            rawData: item // Store raw data for debugging
        }));
    }

    async enrichItemDetails(items) {
        const enrichedItems = [];
        
        for (const item of items) {
            try {
                // Get detailed item information using Trading API
                const details = await this.getItemDetails(item.id);
                const enrichedItem = {
                    ...item,
                    ...details
                };
                enrichedItems.push(enrichedItem);
                
                // Rate limiting between requests
                await this.sleep(100);
            } catch (error) {
                console.warn(`⚠️ Could not enrich details for item ${item.id}:`, error.message);
                enrichedItems.push(item); // Add original item without enrichment
            }
        }
        
        return enrichedItems;
    }

    async getItemDetails(itemId) {
        try {
            const response = await this.ebayApi.trading.GetItem({
                ItemID: itemId,
                DetailLevel: 'ReturnAll'
            });
            
            const item = response.Item;
            return {
                description: this.cleanText(item.Description),
                specifications: this.extractSpecifications(item.ItemSpecifics),
                salesHistory: await this.getSalesHistory(item.Title),
                condition: {
                    grade: this.extractConditionGrade(item.ConditionDescription),
                    description: item.ConditionDescription,
                    notes: item.ConditionDisplayName
                }
            };
        } catch (error) {
            console.warn(`Could not get details for item ${itemId}:`, error.message);
            return {};
        }
    }

    async getSalesHistory(title) {
        try {
            // Search for completed/sold listings
            const response = await this.ebayApi.finding.findCompletedItems({
                keywords: title,
                itemFilter: [
                    {
                        name: 'SoldItemsOnly',
                        value: true
                    }
                ],
                sortOrder: 'EndTimeSoonest',
                paginationInput: {
                    entriesPerPage: 10
                }
            });

            if (!response?.searchResult?.item) {
                return [];
            }

            const soldItems = Array.isArray(response.searchResult.item) 
                ? response.searchResult.item 
                : [response.searchResult.item];

            return soldItems.map(item => ({
                price: this.parsePrice(item.sellingStatus?.currentPrice),
                endTime: item.listingInfo?.endTime,
                condition: this.normalizeCondition(item.condition?.conditionDisplayName),
                bidCount: parseInt(item.sellingStatus?.bidCount) || 0
            }));
        } catch (error) {
            console.warn('Could not fetch sales history:', error.message);
            return [];
        }
    }

    extractSpecifications(itemSpecifics) {
        if (!itemSpecifics?.NameValueList) return {};
        
        const specs = {};
        const nameValueList = Array.isArray(itemSpecifics.NameValueList) 
            ? itemSpecifics.NameValueList 
            : [itemSpecifics.NameValueList];
            
        nameValueList.forEach(spec => {
            if (spec.Name && spec.Value) {
                specs[spec.Name] = Array.isArray(spec.Value) ? spec.Value.join(', ') : spec.Value;
            }
        });
        
        return specs;
    }

    extractConditionGrade(description) {
        if (!description) return null;
        
        const gradePatterns = {
            'CGC': /CGC\s*(\d+\.?\d*)/i,
            'CBCS': /CBCS\s*(\d+\.?\d*)/i,
            'PGX': /PGX\s*(\d+\.?\d*)/i,
            'Raw': /raw|ungraded/i
        };
        
        for (const [service, pattern] of Object.entries(gradePatterns)) {
            const match = description.match(pattern);
            if (match) {
                return {
                    service,
                    grade: service === 'Raw' ? 'Ungraded' : parseFloat(match[1]) || null
                };
            }
        }
        
        return null;
    }

    parsePrice(priceObj) {
        if (!priceObj) return null;
        
        const amount = parseFloat(priceObj['@currencyId'] === 'USD' ? priceObj.__value__ : priceObj);
        return isNaN(amount) ? null : amount;
    }

    normalizeCondition(condition) {
        if (!condition) return 'Unknown';
        
        const conditionMap = {
            'Brand New': 'New',
            'Like New': 'Near Mint',
            'Very Good': 'Very Fine',
            'Good': 'Fine',
            'Acceptable': 'Good',
            'Used': 'Good',
            'For parts or not working': 'Poor'
        };
        
        return conditionMap[condition] || condition;
    }

    async searchSoldListings(query, days = 30) {
        try {
            const response = await this.ebayApi.finding.findCompletedItems({
                keywords: query,
                itemFilter: [
                    {
                        name: 'SoldItemsOnly',
                        value: true
                    },
                    {
                        name: 'EndTimeFrom',
                        value: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
                    }
                ],
                sortOrder: 'EndTimeSoonest',
                paginationInput: {
                    entriesPerPage: 100
                }
            });

            return this.parseSearchResults(response);
        } catch (error) {
            console.error('Error fetching sold listings:', error.message);
            return [];
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = EbayScraper; 