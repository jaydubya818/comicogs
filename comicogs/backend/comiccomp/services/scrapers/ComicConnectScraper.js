const BaseScraper = require('./BaseScraper');
const cheerio = require('cheerio');

class ComicConnectScraper extends BaseScraper {
    constructor(config) {
        super('comicConnect', config);
        this.marketplace = 'comicconnect';
        this.baseUrl = 'https://www.comicconnect.com';
        this.searchUrl = 'https://www.comicconnect.com/search.asp';
        this.auctionUrl = 'https://www.comicconnect.com/auctions.asp';
    }

    async searchComics(query, options = {}) {
        try {
            this.validateQuery(query);
            await this.enforceRateLimit();

            console.log(`🔍 Searching ComicConnect for: "${query}"...`);

            // Search both current auctions and buy-now items
            const [auctionResults, buyNowResults] = await Promise.all([
                this.searchAuctions(query, options),
                this.searchBuyNow(query, options)
            ]);

            const allListings = [...auctionResults, ...buyNowResults];
            console.log(`✅ Found ${allListings.length} listings on ComicConnect`);
            
            return allListings;

        } catch (error) {
            console.error(`❌ ComicConnect search error for "${query}":`, error.message);
            throw error;
        }
    }

    async searchAuctions(query, options = {}) {
        try {
            const searchParams = this.buildSearchParams(query, { ...options, type: 'auction' });
            const url = `${this.auctionUrl}?${searchParams}`;
            
            const response = await this.makeRequest(url);
            return this.parseAuctionResults(response.data);

        } catch (error) {
            console.warn('Could not fetch ComicConnect auctions:', error.message);
            return [];
        }
    }

    async searchBuyNow(query, options = {}) {
        try {
            const searchParams = this.buildSearchParams(query, { ...options, type: 'buynow' });
            const url = `${this.searchUrl}?${searchParams}`;
            
            const response = await this.makeRequest(url);
            return this.parseBuyNowResults(response.data);

        } catch (error) {
            console.warn('Could not fetch ComicConnect buy-now items:', error.message);
            return [];
        }
    }

    buildSearchParams(query, options) {
        const params = new URLSearchParams();
        
        params.append('keyword', query);
        params.append('type', options.type || 'all');
        params.append('grading', options.grading || 'all');
        params.append('sort', options.sort || 'ending');
        params.append('per_page', Math.min(options.maxResults || 50, 100));
        
        if (options.minPrice) {
            params.append('min_price', options.minPrice);
        }
        if (options.maxPrice) {
            params.append('max_price', options.maxPrice);
        }
        if (options.condition) {
            params.append('condition', options.condition);
        }
        
        return params.toString();
    }

    parseAuctionResults(html) {
        const $ = cheerio.load(html);
        const listings = [];

        $('.auction-item, .lot-item').each((index, element) => {
            try {
                const $item = $(element);
                const listing = this.parseAuctionItem($item);
                
                if (listing && this.validateListing(listing)) {
                    listings.push(listing);
                }
            } catch (error) {
                console.warn('Error parsing ComicConnect auction item:', error.message);
            }
        });

        return listings;
    }

    parseBuyNowResults(html) {
        const $ = cheerio.load(html);
        const listings = [];

        $('.product-item, .inventory-item').each((index, element) => {
            try {
                const $item = $(element);
                const listing = this.parseBuyNowItem($item);
                
                if (listing && this.validateListing(listing)) {
                    listings.push(listing);
                }
            } catch (error) {
                console.warn('Error parsing ComicConnect buy-now item:', error.message);
            }
        });

        return listings;
    }

    parseAuctionItem($item) {
        const title = this.cleanText($item.find('.lot-title, .item-title').first().text());
        const lotNumber = $item.find('.lot-number').text().trim();
        
        // Extract pricing information
        const currentBid = this.extractPrice($item.find('.current-bid, .bid-amount').text());
        const estimateText = $item.find('.estimate').text();
        const estimate = this.parseEstimate(estimateText);
        
        // Extract URLs and images
        const itemLink = $item.find('a').first();
        const relativeUrl = itemLink.attr('href');
        const url = relativeUrl ? `${this.baseUrl}${relativeUrl}` : null;
        const imageUrl = $item.find('img').first().attr('src');
        
        // Extract auction details
        const endTime = this.parseEndTime($item.find('.end-time, .auction-end').text());
        const bidCount = this.extractNumber($item.find('.bid-count').text());
        
        // Extract grading information
        const gradingInfo = this.parseGradingInfo($item);
        
        // Parse comic information from title
        const comicInfo = this.parseComicTitle(title);

        return {
            id: lotNumber || this.generateId(title),
            title: title,
            price: currentBid,
            condition: gradingInfo.condition,
            grade: gradingInfo.grade,
            gradingService: gradingInfo.service,
            url: url,
            imageUrl: imageUrl ? `${this.baseUrl}${imageUrl}` : null,
            auction: {
                status: 'active',
                currentBid: currentBid,
                estimate: estimate,
                endTime: endTime,
                bidCount: bidCount,
                lotNumber: lotNumber
            },
            marketplace: this.marketplace,
            scrapedAt: new Date().toISOString(),
            ...comicInfo
        };
    }

    parseBuyNowItem($item) {
        const title = this.cleanText($item.find('.product-title, .item-title').first().text());
        const price = this.extractPrice($item.find('.price, .buy-price').text());
        
        // Extract URLs and images
        const itemLink = $item.find('a').first();
        const relativeUrl = itemLink.attr('href');
        const url = relativeUrl ? `${this.baseUrl}${relativeUrl}` : null;
        const imageUrl = $item.find('img').first().attr('src');
        
        // Extract grading information
        const gradingInfo = this.parseGradingInfo($item);
        
        // Parse comic information from title
        const comicInfo = this.parseComicTitle(title);

        return {
            id: this.generateId(title),
            title: title,
            price: price,
            condition: gradingInfo.condition,
            grade: gradingInfo.grade,
            gradingService: gradingInfo.service,
            url: url,
            imageUrl: imageUrl ? `${this.baseUrl}${imageUrl}` : null,
            listing: {
                type: 'buy_now',
                format: 'Fixed Price'
            },
            marketplace: this.marketplace,
            scrapedAt: new Date().toISOString(),
            ...comicInfo
        };
    }

    parseGradingInfo($item) {
        const text = $item.text();
        const gradingInfo = {
            condition: 'Unknown',
            grade: null,
            service: null
        };

        // Look for CGC grading
        const cgcMatch = text.match(/CGC\s*(\d+\.?\d*)/i);
        if (cgcMatch) {
            gradingInfo.service = 'CGC';
            gradingInfo.grade = parseFloat(cgcMatch[1]);
            gradingInfo.condition = `CGC ${cgcMatch[1]}`;
        }

        // Look for CBCS grading
        const cbcsMatch = text.match(/CBCS\s*(\d+\.?\d*)/i);
        if (cbcsMatch) {
            gradingInfo.service = 'CBCS';
            gradingInfo.grade = parseFloat(cbcsMatch[1]);
            gradingInfo.condition = `CBCS ${cbcsMatch[1]}`;
        }

        // Look for PGX grading
        const pgxMatch = text.match(/PGX\s*(\d+\.?\d*)/i);
        if (pgxMatch) {
            gradingInfo.service = 'PGX';
            gradingInfo.grade = parseFloat(pgxMatch[1]);
            gradingInfo.condition = `PGX ${pgxMatch[1]}`;
        }

        // Look for raw/ungraded
        if (text.match(/raw|ungraded/i)) {
            gradingInfo.service = 'Raw';
            gradingInfo.condition = 'Raw/Ungraded';
        }

        return gradingInfo;
    }

    parseEstimate(estimateText) {
        if (!estimateText) return null;
        
        // Parse estimate ranges like "$1,000 - $2,000"
        const match = estimateText.match(/\$?([\d,]+)\s*-\s*\$?([\d,]+)/);
        if (match) {
            return {
                low: parseInt(match[1].replace(/,/g, '')),
                high: parseInt(match[2].replace(/,/g, ''))
            };
        }
        
        // Parse single estimate like "$1,500"
        const singleMatch = estimateText.match(/\$?([\d,]+)/);
        if (singleMatch) {
            const value = parseInt(singleMatch[1].replace(/,/g, ''));
            return { low: value, high: value };
        }
        
        return null;
    }

    parseEndTime(timeText) {
        if (!timeText) return null;
        
        try {
            // ComicConnect typically shows end times like "2 days 5 hours"
            const now = new Date();
            
            const daysMatch = timeText.match(/(\d+)\s*days?/i);
            const hoursMatch = timeText.match(/(\d+)\s*hours?/i);
            const minutesMatch = timeText.match(/(\d+)\s*minutes?/i);
            
            let endTime = new Date(now);
            
            if (daysMatch) {
                endTime.setDate(endTime.getDate() + parseInt(daysMatch[1]));
            }
            if (hoursMatch) {
                endTime.setHours(endTime.getHours() + parseInt(hoursMatch[1]));
            }
            if (minutesMatch) {
                endTime.setMinutes(endTime.getMinutes() + parseInt(minutesMatch[1]));
            }
            
            return endTime.toISOString();
        } catch (error) {
            console.warn('Error parsing end time:', timeText);
            return null;
        }
    }

    extractNumber(text) {
        if (!text) return 0;
        const match = text.match(/(\d+)/);
        return match ? parseInt(match[1]) : 0;
    }

    generateId(title) {
        return title.toLowerCase()
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '')
            .substring(0, 50);
    }

    validateListing(listing) {
        return listing.title && 
               listing.price !== null && 
               listing.price > 0;
    }

    async getItemDetails(itemId) {
        try {
            const url = `${this.baseUrl}/item/${itemId}`;
            const response = await this.makeRequest(url);
            const $ = cheerio.load(response.data);
            
            return {
                description: this.cleanText($('.description, .item-description').text()),
                provenance: this.cleanText($('.provenance').text()),
                condition: this.cleanText($('.condition-details').text()),
                certification: this.parseCertification($),
                images: this.extractAllImages($)
            };
            
        } catch (error) {
            console.warn(`Could not get ComicConnect item details for ${itemId}:`, error.message);
            return {};
        }
    }

    parseCertification($) {
        const certText = $('.certification, .grading-details').text();
        if (!certText) return null;
        
        return {
            service: this.extractText(certText, /(CGC|CBCS|PGX)/i),
            grade: this.extractText(certText, /(\d+\.?\d*)/),
            serial: this.extractText(certText, /Serial[:\s]+([A-Z0-9-]+)/i),
            notes: this.cleanText(certText)
        };
    }

    extractAllImages($) {
        const images = [];
        $('img').each((i, img) => {
            const src = $(img).attr('src');
            if (src && src.includes('/images/')) {
                images.push(`${this.baseUrl}${src}`);
            }
        });
        return images;
    }

    extractText(text, pattern) {
        const match = text.match(pattern);
        return match ? match[1] : null;
    }
}

module.exports = ComicConnectScraper;