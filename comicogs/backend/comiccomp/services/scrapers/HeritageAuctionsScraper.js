const BaseScraper = require('./BaseScraper');
const cheerio = require('cheerio');

class HeritageAuctionsScraper extends BaseScraper {
    constructor(config) {
        super('heritageAuctions', config);
        this.marketplace = 'heritage';
        this.baseUrl = 'https://comics.ha.com';
        this.searchUrl = 'https://comics.ha.com/c/search-results.zx';
        this.apiUrl = 'https://api.ha.com/search';
    }

    async searchComics(query, options = {}) {
        try {
            this.validateQuery(query);
            await this.enforceRateLimit();

            console.log(`🔍 Searching Heritage Auctions for: "${query}"...`);

            // Search both current auctions and auction archives
            const [currentAuctions, archivedAuctions] = await Promise.all([
                this.searchCurrentAuctions(query, options),
                this.searchAuctionArchives(query, options)
            ]);

            const allListings = [...currentAuctions, ...archivedAuctions];
            console.log(`✅ Found ${allListings.length} listings on Heritage Auctions`);
            
            return allListings;

        } catch (error) {
            console.error(`❌ Heritage Auctions search error for "${query}":`, error.message);
            throw error;
        }
    }

    async searchCurrentAuctions(query, options = {}) {
        try {
            const searchParams = this.buildSearchParams(query, { ...options, status: 'current' });
            const url = `${this.searchUrl}?${searchParams}`;
            
            const response = await this.makeRequest(url);
            return this.parseSearchResults(response.data, 'current');

        } catch (error) {
            console.warn('Could not fetch current Heritage auctions:', error.message);
            return [];
        }
    }

    async searchAuctionArchives(query, options = {}) {
        try {
            const searchParams = this.buildSearchParams(query, { ...options, status: 'archive' });
            const url = `${this.searchUrl}?${searchParams}`;
            
            const response = await this.makeRequest(url);
            return this.parseSearchResults(response.data, 'completed');

        } catch (error) {
            console.warn('Could not fetch Heritage auction archives:', error.message);
            return [];
        }
    }

    buildSearchParams(query, options) {
        const params = new URLSearchParams();
        
        params.append('N', '790+899+1249'); // Comics categories
        params.append('Ntt', query);
        params.append('Ns', options.sort || 'p_EndDate|1'); // Sort by end date
        params.append('Nrpp', Math.min(options.maxResults || 50, 120)); // Results per page
        
        if (options.status === 'archive') {
            params.append('type', 'archive');
        } else {
            params.append('type', 'current');
        }
        
        if (options.minPrice) {
            params.append('IC', 'true');
            params.append('low', options.minPrice);
        }
        if (options.maxPrice) {
            params.append('IC', 'true');
            params.append('high', options.maxPrice);
        }
        
        // Grade filters
        if (options.grade) {
            params.append('grade', options.grade);
        }
        
        return params.toString();
    }

    parseSearchResults(html, status) {
        const $ = cheerio.load(html);
        const listings = [];

        $('.item, .lot-item, .search-item').each((index, element) => {
            try {
                const $item = $(element);
                const listing = this.parseAuctionItem($item, status);
                
                if (listing && this.validateListing(listing)) {
                    listings.push(listing);
                }
            } catch (error) {
                console.warn('Error parsing Heritage auction item:', error.message);
            }
        });

        return listings;
    }

    parseAuctionItem($item, status) {
        // Extract basic information
        const titleElement = $item.find('.lot-title, .item-title, h3 a').first();
        const title = this.cleanText(titleElement.text());
        
        // Extract lot number
        const lotNumber = this.extractLotNumber($item);
        
        // Extract pricing information
        const price = this.extractPrice($item, status);
        const estimate = this.extractEstimate($item);
        
        // Extract URLs and images
        const itemLink = titleElement.attr('href') || $item.find('a').first().attr('href');
        const url = itemLink ? this.resolveUrl(itemLink) : null;
        const imageUrl = this.extractImageUrl($item);
        
        // Extract auction details
        const auctionInfo = this.extractAuctionInfo($item, status);
        
        // Extract grading information
        const gradingInfo = this.parseGradingInfo($item);
        
        // Parse comic information from title
        const comicInfo = this.parseComicTitle(title);

        return {
            id: lotNumber || this.generateId(title),
            title: title,
            price: price,
            condition: gradingInfo.condition,
            grade: gradingInfo.grade,
            gradingService: gradingInfo.service,
            url: url,
            imageUrl: imageUrl,
            auction: {
                status: status,
                lotNumber: lotNumber,
                estimate: estimate,
                ...auctionInfo
            },
            marketplace: this.marketplace,
            scrapedAt: new Date().toISOString(),
            ...comicInfo
        };
    }

    extractLotNumber($item) {
        const lotText = $item.find('.lot-number, .lot-num').text();
        const match = lotText.match(/Lot[:\s#]*(\d+)/i);
        return match ? match[1] : null;
    }

    extractPrice($item, status) {
        let priceElement;
        
        if (status === 'completed') {
            // For completed auctions, look for realized/final price
            priceElement = $item.find('.realized-price, .final-price, .hammer-price');
        } else {
            // For current auctions, look for current bid
            priceElement = $item.find('.current-bid, .bid-amount, .current-price');
        }
        
        const priceText = priceElement.text();
        return this.parseMoneyAmount(priceText);
    }

    extractEstimate($item) {
        const estimateText = $item.find('.estimate, .pre-sale-estimate').text();
        return this.parseEstimateRange(estimateText);
    }

    extractImageUrl($item) {
        const img = $item.find('img').first();
        const src = img.attr('src') || img.attr('data-src');
        
        if (src) {
            return this.resolveUrl(src);
        }
        
        return null;
    }

    extractAuctionInfo($item, status) {
        const info = {
            status: status
        };
        
        // Extract sale date
        const dateElement = $item.find('.sale-date, .end-date, .auction-date');
        if (dateElement.length) {
            info.saleDate = this.parseDate(dateElement.text());
        }
        
        // Extract auction name/event
        const auctionElement = $item.find('.auction-name, .sale-name');
        if (auctionElement.length) {
            info.auctionName = this.cleanText(auctionElement.text());
        }
        
        // Extract bid information for current auctions
        if (status === 'current') {
            const bidElement = $item.find('.bid-count, .bids');
            if (bidElement.length) {
                info.bidCount = this.extractNumber(bidElement.text());
            }
            
            const timeElement = $item.find('.time-left, .end-time');
            if (timeElement.length) {
                info.endTime = this.parseEndTime(timeElement.text());
            }
        }
        
        return info;
    }

    parseGradingInfo($item) {
        const text = $item.text();
        const gradingInfo = {
            condition: 'Unknown',
            grade: null,
            service: null
        };

        // Look for CGC grading (most common at Heritage)
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

        // Look for ungraded/raw
        if (text.match(/ungraded|raw/i)) {
            gradingInfo.service = 'Raw';
            gradingInfo.condition = 'Raw/Ungraded';
        }

        return gradingInfo;
    }

    parseEstimateRange(estimateText) {
        if (!estimateText) return null;
        
        // Parse ranges like "$1,000 - $2,000" or "$1,000-$2,000"
        const rangeMatch = estimateText.match(/\$?([\d,]+)\s*[-–]\s*\$?([\d,]+)/);
        if (rangeMatch) {
            return {
                low: parseInt(rangeMatch[1].replace(/,/g, '')),
                high: parseInt(rangeMatch[2].replace(/,/g, ''))
            };
        }
        
        // Parse single estimates
        const singleMatch = estimateText.match(/\$?([\d,]+)/);
        if (singleMatch) {
            const value = parseInt(singleMatch[1].replace(/,/g, ''));
            return { low: value, high: value };
        }
        
        return null;
    }

    parseMoneyAmount(text) {
        if (!text) return null;
        
        // Remove currency symbols and clean up
        const cleaned = text.replace(/[$,\s]/g, '');
        const amount = parseFloat(cleaned);
        
        return isNaN(amount) ? null : amount;
    }

    parseDate(dateText) {
        if (!dateText) return null;
        
        try {
            // Heritage uses various date formats
            const cleaned = dateText.trim();
            const date = new Date(cleaned);
            
            if (isNaN(date.getTime())) {
                return null;
            }
            
            return date.toISOString();
        } catch (error) {
            console.warn('Error parsing date:', dateText);
            return null;
        }
    }

    parseEndTime(timeText) {
        if (!timeText) return null;
        
        try {
            // Heritage shows time remaining like "2d 5h 30m"
            const now = new Date();
            
            const daysMatch = timeText.match(/(\d+)d/);
            const hoursMatch = timeText.match(/(\d+)h/);
            const minutesMatch = timeText.match(/(\d+)m/);
            
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
        const match = text.match(/(\d+)/);
        return match ? parseInt(match[1]) : 0;
    }

    resolveUrl(url) {
        if (!url) return null;
        
        if (url.startsWith('http')) {
            return url;
        }
        
        if (url.startsWith('//')) {
            return `https:${url}`;
        }
        
        if (url.startsWith('/')) {
            return `${this.baseUrl}${url}`;
        }
        
        return `${this.baseUrl}/${url}`;
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

    async getItemDetails(lotNumber) {
        try {
            const url = `${this.baseUrl}/lot/${lotNumber}`;
            const response = await this.makeRequest(url);
            const $ = cheerio.load(response.data);
            
            return {
                description: this.cleanText($('.lot-description, .description').text()),
                provenance: this.cleanText($('.provenance').text()),
                condition: this.cleanText($('.condition-report').text()),
                certification: this.parseCertificationDetails($),
                images: this.extractAllImages($),
                auctionHistory: this.parseAuctionHistory($)
            };
            
        } catch (error) {
            console.warn(`Could not get Heritage lot details for ${lotNumber}:`, error.message);
            return {};
        }
    }

    parseCertificationDetails($) {
        const certSection = $('.certification, .grading-info');
        if (!certSection.length) return null;
        
        const text = certSection.text();
        
        return {
            service: this.extractText(text, /(CGC|CBCS|PGX)/i),
            grade: this.extractText(text, /Grade[:\s]*(\d+\.?\d*)/i),
            serial: this.extractText(text, /Serial[:\s#]*([A-Z0-9-]+)/i),
            label: this.extractText(text, /Label[:\s]*([^,\n]+)/i),
            notes: this.cleanText(text)
        };
    }

    parseAuctionHistory($) {
        const history = [];
        $('.auction-history tr, .price-history tr').each((i, row) => {
            const $row = $(row);
            const date = this.cleanText($row.find('td:first-child').text());
            const price = this.parseMoneyAmount($row.find('td:last-child').text());
            
            if (date && price) {
                history.push({ date, price });
            }
        });
        return history;
    }

    extractAllImages($) {
        const images = [];
        $('.lot-images img, .item-images img').each((i, img) => {
            const src = $(img).attr('src') || $(img).attr('data-src');
            if (src) {
                images.push(this.resolveUrl(src));
            }
        });
        return images;
    }

    extractText(text, pattern) {
        const match = text.match(pattern);
        return match ? match[1].trim() : null;
    }
}

module.exports = HeritageAuctionsScraper;