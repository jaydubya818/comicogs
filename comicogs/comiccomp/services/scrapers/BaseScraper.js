const axios = require('axios');
const config = require('../../config');

/**
 * Base scraper class that provides common functionality for all marketplace scrapers
 */
class BaseScraper {
  constructor(marketplaceName, fullConfig) {
    this.marketplace = marketplaceName;
    this.config = fullConfig.marketplaces[marketplaceName];
    this.securityConfig = fullConfig.security;
    this.validationConfig = fullConfig.validation;
    
    // Rate limiting state
    this.lastRequestTime = 0;
    this.requestCount = 0;
    this.requestWindow = {};
    
    // Setup axios instance with common configuration
    this.httpClient = axios.create({
      timeout: fullConfig.collection.timeout,
      headers: {
        'User-Agent': this.securityConfig.userAgent,
        ...this.securityConfig.headers
      }
    });

    // Add request interceptor for rate limiting
    this.httpClient.interceptors.request.use(
      async (requestConfig) => {
        await this.applyRateLimit();
        return requestConfig;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor for logging and error handling
    this.httpClient.interceptors.response.use(
      (response) => {
        this.logRequest('success', response.config.url, response.status);
        return response;
      },
      (error) => {
        this.logRequest('error', error.config?.url, error.response?.status, error.message);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Apply rate limiting based on marketplace configuration
   */
  async applyRateLimit() {
    const now = Date.now();
    const rateLimits = this.config.rateLimits;
    
    // Check requests per second limit
    if (rateLimits.requestsPerSecond) {
      const timeSinceLastRequest = now - this.lastRequestTime;
      const minDelay = 1000 / rateLimits.requestsPerSecond;
      
      if (timeSinceLastRequest < minDelay) {
        const delay = minDelay - timeSinceLastRequest;
        await this.delay(delay);
      }
    }

    // Check requests per minute/hour/day limits
    await this.checkWindowedRateLimit('minute', rateLimits.requestsPerMinute, 60000);
    await this.checkWindowedRateLimit('hour', rateLimits.requestsPerHour, 3600000);
    await this.checkWindowedRateLimit('day', rateLimits.requestsPerDay, 86400000);

    // Apply random delay for human-like behavior
    const randomDelay = Math.random() * 
      (this.securityConfig.requestDelay.max - this.securityConfig.requestDelay.min) + 
      this.securityConfig.requestDelay.min;
    
    await this.delay(randomDelay);
    
    this.lastRequestTime = Date.now();
    this.requestCount++;
  }

  /**
   * Check windowed rate limits (per minute, hour, day)
   */
  async checkWindowedRateLimit(window, limit, windowMs) {
    if (!limit) return;

    const now = Date.now();
    const windowStart = now - windowMs;
    
    if (!this.requestWindow[window]) {
      this.requestWindow[window] = [];
    }

    // Remove old requests outside the window
    this.requestWindow[window] = this.requestWindow[window].filter(
      timestamp => timestamp > windowStart
    );

    // Check if we're at the limit
    if (this.requestWindow[window].length >= limit) {
      const oldestRequest = Math.min(...this.requestWindow[window]);
      const waitTime = (oldestRequest + windowMs) - now;
      
      if (waitTime > 0) {
        console.log(`⏳ Rate limit reached for ${this.marketplace}. Waiting ${waitTime}ms`);
        await this.delay(waitTime);
      }
    }

    // Record this request
    this.requestWindow[window].push(now);
  }

  /**
   * Delay execution for specified milliseconds
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Make HTTP request with retry logic
   */
  async makeRequest(url, options = {}) {
    const maxRetries = config.collection.maxRetries;
    const retryDelay = config.collection.retryDelay;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.httpClient.get(url, options);
        return response;
      } catch (error) {
        console.error(`❌ Request failed (attempt ${attempt}/${maxRetries}):`, error.message);
        
        if (attempt === maxRetries) {
          throw new Error(`Max retries exceeded for ${url}: ${error.message}`);
        }

        // Exponential backoff
        const delay = retryDelay * Math.pow(2, attempt - 1);
        await this.delay(delay);
      }
    }
  }

  /**
   * Validate scraped data against our standards
   */
  validateData(data) {
    const errors = [];
    const required = this.validationConfig.requiredFields;

    // Check required fields
    for (const field of required) {
      if (!data[field] || data[field] === '') {
        errors.push(`Missing required field: ${field}`);
      }
    }

    // Validate price
    if (data.price) {
      const price = parseFloat(data.price);
      if (isNaN(price) || price < this.validationConfig.minPrice || price > this.validationConfig.maxPrice) {
        errors.push(`Invalid price: ${data.price}`);
      }
    }

    // Validate title length
    if (data.title && data.title.length > this.validationConfig.maxTitleLength) {
      errors.push(`Title too long: ${data.title.length} characters`);
    }

    // Validate description length
    if (data.description && data.description.length > this.validationConfig.maxDescriptionLength) {
      errors.push(`Description too long: ${data.description.length} characters`);
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
      data: this.sanitizeData(data)
    };
  }

  /**
   * Sanitize and normalize data
   */
  sanitizeData(data) {
    return {
      ...data,
      title: this.cleanText(data.title),
      description: this.cleanText(data.description),
      condition: this.normalizeCondition(data.condition),
      price: this.normalizePrice(data.price),
      marketplace: this.marketplace
    };
  }

  /**
   * Clean text data
   */
  cleanText(text) {
    if (!text) return null;
    
    return text
      .trim()
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/[^\x20-\x7E]/g, '') // Remove non-printable characters
      .substring(0, 500); // Limit length
  }

  /**
   * Normalize condition strings
   */
  normalizeCondition(condition) {
    if (!condition) return 'Unknown';

    const conditionMap = {
      'mint': 'Mint',
      'near mint': 'Near Mint',
      'nm': 'Near Mint',
      'very fine': 'Very Fine',
      'vf': 'Very Fine',
      'fine': 'Fine',
      'very good': 'Very Good',
      'vg': 'Very Good',
      'good': 'Good',
      'fair': 'Fair',
      'poor': 'Poor'
    };

    const normalized = condition.toLowerCase().trim();
    return conditionMap[normalized] || condition;
  }

  /**
   * Normalize price values
   */
  normalizePrice(price) {
    if (!price) return null;

    // Remove currency symbols and extract number
    const cleaned = price.toString().replace(/[^\d.,]/g, '');
    const number = parseFloat(cleaned.replace(',', ''));
    
    return isNaN(number) ? null : parseFloat(number.toFixed(2));
  }

  /**
   * Log request information
   */
  logRequest(type, url, status, message = '') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${this.marketplace.toUpperCase()} ${type.toUpperCase()}: ${url} - Status: ${status} ${message}`;
    
    if (type === 'error') {
      console.error(logMessage);
    } else {
      console.log(logMessage);
    }
  }

  /**
   * Extract comic information from title
   */
  parseComicTitle(title) {
    // Basic regex patterns for comic parsing
    const patterns = {
      // "Amazing Spider-Man #1 (1963)"
      withYear: /^(.+?)\s*#(\d+(?:\.\d+)?)\s*\((\d{4})\)/,
      // "Amazing Spider-Man #1"
      withoutYear: /^(.+?)\s*#(\d+(?:\.\d+)?)/,
      // "Amazing Spider-Man Vol 1 #1"
      withVolume: /^(.+?)\s*(?:Vol|Volume)\s*(\d+)\s*#(\d+(?:\.\d+)?)/i
    };

    for (const [patternName, regex] of Object.entries(patterns)) {
      const match = title.match(regex);
      if (match) {
        switch (patternName) {
          case 'withYear':
            return {
              series: match[1].trim(),
              issue: match[2],
              year: parseInt(match[3])
            };
          case 'withoutYear':
            return {
              series: match[1].trim(),
              issue: match[2]
            };
          case 'withVolume':
            return {
              series: match[1].trim(),
              volume: match[2],
              issue: match[3]
            };
        }
      }
    }

    // If no pattern matches, return the full title as series
    return {
      series: title.trim(),
      issue: null
    };
  }

  /**
   * Abstract methods that must be implemented by subclasses
   */
  async searchComics(query, options = {}) {
    throw new Error('searchComics method must be implemented by subclass');
  }

  async getListingDetails(listingId) {
    throw new Error('getListingDetails method must be implemented by subclass');
  }

  async getSoldListings(query, options = {}) {
    throw new Error('getSoldListings method must be implemented by subclass');
  }
}

module.exports = BaseScraper; 