const config = {
  // Database configuration
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'comicogs',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password'
  },

  // Marketplace configurations
  marketplaces: {
    ebay: {
      enabled: true,
      apiKey: process.env.EBAY_API_KEY,
      appId: process.env.EBAY_APP_ID,
      certId: process.env.EBAY_CERT_ID,
      baseUrl: 'https://api.ebay.com',
      rateLimits: {
        requestsPerSecond: 2,
        requestsPerDay: 5000,
        burstLimit: 10
      },
      categories: {
        comics: '259104', // Comics > US Comics category
        collectibles: '1'
      },
      retryPolicy: {
        maxRetries: 3,
        baseDelay: 1000,
        maxDelay: 10000
      }
    },
    
    whatnot: {
      enabled: true,
      baseUrl: 'https://www.whatnot.com',
      rateLimits: {
        requestsPerSecond: 1,
        requestsPerMinute: 30,
        burstLimit: 5
      },
      retryPolicy: {
        maxRetries: 3,
        baseDelay: 2000,
        maxDelay: 15000
      }
    },
    
    comicConnect: {
      enabled: true,
      baseUrl: 'https://www.comicconnect.com',
      rateLimits: {
        requestsPerSecond: 1,
        requestsPerMinute: 20,
        burstLimit: 3
      },
      retryPolicy: {
        maxRetries: 2,
        baseDelay: 2000,
        maxDelay: 10000
      }
    },
    
    heritageAuctions: {
      enabled: true,
      baseUrl: 'https://comics.ha.com',
      rateLimits: {
        requestsPerSecond: 1,
        requestsPerMinute: 15,
        burstLimit: 3
      },
      retryPolicy: {
        maxRetries: 2,
        baseDelay: 3000,
        maxDelay: 15000
      }
    },
    
    myComicShop: {
      enabled: true,
      baseUrl: 'https://www.mycomicshop.com',
      searchUrl: 'https://www.mycomicshop.com/search',
      rateLimits: {
        requestsPerSecond: 1,
        requestsPerMinute: 30,
        burstLimit: 5
      },
      retryPolicy: {
        maxRetries: 3,
        baseDelay: 1500,
        maxDelay: 10000
      },
      categories: {
        comics: 'comics',
        vintage: 'vintage-comics',
        modern: 'modern-comics'
      }
    },
    
    amazon: {
      enabled: false, // Requires special API access and approval
      apiKey: process.env.AMAZON_API_KEY,
      baseUrl: 'https://webservices.amazon.com',
      rateLimits: {
        requestsPerSecond: 1,
        requestsPerHour: 3600,
        burstLimit: 2
      },
      retryPolicy: {
        maxRetries: 2,
        baseDelay: 5000,
        maxDelay: 30000
      }
    }
  },

  // Caching settings
  cache: {
    enabled: true,
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      ttl: 3600 // 1 hour default TTL
    },
    pricingDataTTL: 86400, // 24 hours for pricing data
    searchResultsTTL: 1800 // 30 minutes for search results
  },

  // Data collection settings
  collection: {
    maxRetries: 3,
    retryDelay: 1000,
    timeout: 30000,
    maxConcurrentRequests: 5,
    batchSize: 10,
    enableValidation: true,
    enableMetrics: true,
    maxResultsPerMarketplace: 100,
    defaultSearchLimit: 50
  },

  // Data validation rules
  validation: {
    requiredFields: ["id", "title", "price", "marketplace", "url"],
    minPrice: 0.01,
    maxPrice: 100000,
    maxTitleLength: 500,
    maxDescriptionLength: 5000,
    allowedConditions: [
      'Near Mint', 'Very Fine', 'Fine', 'Very Good', 
      'Good', 'Fair', 'Poor', 'Unknown'
    ],
    suspiciousPatterns: [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /\beval\b/i,
      /\bbid\b.*\bshill\b/i
    ]
  },

  // Security and request settings
  security: {
    userAgent: "ComicComp/1.0 (https://comicogs.com; pricing-bot)",
    headers: { 
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.5",
      "Accept-Encoding": "gzip, deflate",
      "DNT": "1",
      "Connection": "keep-alive",
      "Upgrade-Insecure-Requests": "1"
    },
    requestDelay: { 
      min: 1000, 
      max: 3000 
    },
    maxRedirects: 5,
    followRedirects: true
  },

  // Price normalization settings
  priceNormalization: {
    enabled: true,
    filterOutliers: true,
    outlierThreshold: 3, // Standard deviations
    minDataPoints: 3,
    confidence: {
      high: 0.9,
      medium: 0.7,
      low: 0.5
    },
    adjustments: {
      shippingIncluded: true,
      gradingPremium: {
        'CGC 9.8': 1.5,
        'CGC 9.6': 1.3,
        'CGC 9.4': 1.2,
        'CBCS 9.8': 1.4,
        'Raw NM': 1.0
      }
    }
  },

  // AI recommendation settings
  recommendations: {
    enabled: true,
    updateInterval: '1 hour',
    factors: {
      priceMovement: 0.3,
      volume: 0.2,
      marketTrend: 0.2,
      condition: 0.15,
      rarity: 0.15
    },
    thresholds: {
      listNow: 0.8,
      hold: 0.6,
      grade: 0.7,
      monitor: 0.4
    }
  },

  // Error handling and monitoring
  monitoring: {
    errorLogSize: 100,
    metricsRetention: '7 days',
    alertThresholds: {
      errorRate: 0.1,
      successRate: 0.8,
      responseTime: 5000
    },
    notifications: {
      email: process.env.ALERT_EMAIL,
      slack: process.env.SLACK_WEBHOOK,
      enabled: process.env.NODE_ENV === 'production'
    }
  },

  // Testing configuration
  testing: {
    mockMode: process.env.NODE_ENV === 'test',
    fixtures: {
      ebayResults: './test/fixtures/ebay-results.json',
      whatnotResults: './test/fixtures/whatnot-results.json',
      myComicShopResults: './test/fixtures/mycomicshop-results.json'
    },
    testQueries: [
      'Amazing Spider-Man #1',
      'Batman #1',
      'X-Men #1',
      'Incredible Hulk #181',
      'Walking Dead #1'
    ],
    performance: {
      maxCollectionTime: 10000,
      maxResponseTime: 2000,
      minSuccessRate: 0.8
    }
  },

  // API endpoints (for backend integration)
  api: {
    baseUrl: process.env.API_BASE_URL || 'http://localhost:3000',
    endpoints: {
      search: '/api/comiccomp/search',
      pricing: '/api/comiccomp/pricing',
      trends: '/api/comiccomp/trends',
      recommendations: '/api/comiccomp/recommendations'
    },
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100 // requests per window
    }
  },

  // Environment-specific overrides
  environments: {
    development: {
      collection: {
        maxConcurrentRequests: 2,
        timeout: 15000
      },
      security: {
        requestDelay: { min: 2000, max: 5000 }
      }
    },
    production: {
      collection: {
        maxConcurrentRequests: 10,
        timeout: 45000
      },
      monitoring: {
        notifications: {
          enabled: true
        }
      }
    },
    test: {
      testing: {
        mockMode: true
      },
      collection: {
        timeout: 5000,
        maxRetries: 1
      }
    }
  }
};

// Apply environment-specific overrides
const environment = process.env.NODE_ENV || 'development';
if (config.environments[environment]) {
  const merge = (target, source) => {
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        target[key] = target[key] || {};
        merge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
  };
  merge(config, config.environments[environment]);
}

module.exports = config; 