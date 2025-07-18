const config = {
  marketplaces: {
    ebay: {
      enabled: true,
      baseUrl: "https://www.ebay.com",
      rateLimits: { requestsPerSecond: 2 }
    }
  },
  validation: {
    requiredFields: ["title", "price", "marketplace", "url"],
    minPrice: 0.01,
    maxPrice: 100000
  },
  collection: { maxRetries: 3, retryDelay: 5000, timeout: 30000 },
  security: {
    userAgent: "ComicComp/1.0",
    headers: { "Accept": "text/html,application/xhtml+xml" },
    requestDelay: { min: 1000, max: 3000 }
  }
};
module.exports = config;
