const tf = require('@tensorflow/tfjs-node');
const { Pool } = require('pg');

class MarketIntelligenceService {
  constructor() {
    this.trendModel = null;
    this.anomalyDetector = null;
    this.isInitialized = false;
    this.marketData = new Map();
    this.trendCache = new Map();
    this.initializeService();
  }

  async initializeService() {
    try {
      await this.loadModels();
      await this.loadMarketData();
      this.isInitialized = true;
      console.log('Market Intelligence Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Market Intelligence Service:', error);
    }
  }

  async loadModels() {
    // Time series forecasting model for market trends
    this.trendModel = tf.sequential({
      layers: [
        tf.layers.lstm({
          units: 50,
          returnSequences: true,
          inputShape: [30, 5] // 30 days, 5 features
        }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.lstm({ units: 50, returnSequences: false }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 25 }),
        tf.layers.dense({ units: 1 })
      ]
    });

    this.trendModel.compile({
      optimizer: 'adam',
      loss: 'meanSquaredError',
      metrics: ['mae']
    });

    // Anomaly detection model
    this.anomalyDetector = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [10], units: 32, activation: 'relu' }),
        tf.layers.dense({ units: 16, activation: 'relu' }),
        tf.layers.dense({ units: 8, activation: 'relu' }),
        tf.layers.dense({ units: 16, activation: 'relu' }),
        tf.layers.dense({ units: 32, activation: 'relu' }),
        tf.layers.dense({ units: 10, activation: 'linear' })
      ]
    });

    this.anomalyDetector.compile({
      optimizer: 'adam',
      loss: 'meanSquaredError'
    });

    console.log('Market intelligence models loaded');
  }

  async loadMarketData() {
    const db = new Pool();

    try {
      // Load recent market transactions
      const marketQuery = await db.query(`
        SELECT 
          c.id,
          c.title,
          c.issue_number,
          p.name as publisher,
          ml.price,
          ml.condition,
          ml.created_at,
          ml.status
        FROM marketplace_listings ml
        JOIN comics c ON ml.comic_id = c.id
        JOIN publishers p ON c.publisher_id = p.id
        WHERE ml.created_at >= NOW() - INTERVAL '90 days'
        ORDER BY ml.created_at DESC
      `);

      // Process and store market data
      this.processMarketTransactions(marketQuery.rows);

      console.log(`Loaded ${marketQuery.rows.length} market transactions`);
    } finally {
      db.end();
    }
  }

  processMarketTransactions(transactions) {
    const comicData = new Map();

    transactions.forEach(transaction => {
      const key = `${transaction.id}_${transaction.condition}`;

      if (!comicData.has(key)) {
        comicData.set(key, {
          comic_id: transaction.id,
          title: transaction.title,
          issue_number: transaction.issue_number,
          publisher: transaction.publisher,
          condition: transaction.condition,
          prices: [],
          volumes: [],
          dates: []
        });
      }

      const data = comicData.get(key);
      data.prices.push(transaction.price);
      data.volumes.push(1); // Each listing counts as volume
      data.dates.push(new Date(transaction.created_at));
    });

    this.marketData = comicData;
  }

  // #agent-handshake: UX.md - Primary Journeys > 3. Selling a Comic (AI suggests pricing)
  // #agent-handshake: UX.md - Primary Journeys > 6. Smart Recommendations
  async getMarketIntelligence(options = {}) {
    const {
      comicId,
      publisher,
      genre,
      timeframe = '30d',
      includeForecasts = true,
      includeAnomalies = true
    } = options;

    try {
      const intelligence = {
        market_overview: await this.getMarketOverview(timeframe),
        trending_comics: await this.getTrendingComics(timeframe),
        price_movements: await this.getPriceMovements(timeframe),
        volume_analysis: await this.getVolumeAnalysis(timeframe),
        market_sentiment: await this.getMarketSentiment(timeframe)
      };

      if (includeForecasts) {
        intelligence.forecasts = await this.generateForecasts(comicId, publisher);
      }

      if (includeAnomalies) {
        intelligence.anomalies = await this.detectAnomalies(timeframe);
      }

      if (comicId) {
        intelligence.comic_specific = await this.getComicSpecificIntelligence(comicId);
      }

      if (publisher) {
        intelligence.publisher_analysis = await this.getPublisherAnalysis(publisher);
      }

      return {
        success: true,
        data: intelligence,
        generated_at: new Date().toISOString(),
        timeframe: timeframe
      };
    } catch (error) {
      console.error('Market intelligence error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getMarketOverview(timeframe) {
    const db = new Pool();

    try {
      const overviewQuery = await db.query(`
        WITH market_stats AS (
          SELECT 
            DATE_TRUNC('day', ml.created_at) as date,
            COUNT(*) as listings_count,
            AVG(ml.price) as avg_price,
            SUM(ml.price) as total_value,
            COUNT(CASE WHEN ml.status = 'sold' THEN 1 END) as sales_count
          FROM marketplace_listings ml
          WHERE ml.created_at >= NOW() - INTERVAL '${timeframe}'
          GROUP BY DATE_TRUNC('day', ml.created_at)
          ORDER BY date DESC
        )
        SELECT 
          COUNT(*) as total_days,
          SUM(listings_count) as total_listings,
          AVG(avg_price) as market_avg_price,
          SUM(total_value) as total_market_value,
          SUM(sales_count) as total_sales,
          AVG(sales_count::float / NULLIF(listings_count, 0)) as avg_sell_through_rate
        FROM market_stats
      `);

      const stats = overviewQuery.rows[0];

      return {
        total_listings: parseInt(stats.total_listings) || 0,
        average_price: parseFloat(stats.market_avg_price) || 0,
        total_market_value: parseFloat(stats.total_market_value) || 0,
        total_sales: parseInt(stats.total_sales) || 0,
        sell_through_rate: parseFloat(stats.avg_sell_through_rate) || 0,
        market_health: this.calculateMarketHealth(stats)
      };
    } finally {
      db.end();
    }
  }

  calculateMarketHealth(stats) {
    const sellThroughRate = parseFloat(stats.avg_sell_through_rate) || 0;
    const totalListings = parseInt(stats.total_listings) || 0;

    let healthScore = 0;

    // Sell-through rate component (40%)
    if (sellThroughRate >= 0.7) healthScore += 40;
    else if (sellThroughRate >= 0.5) healthScore += 30;
    else if (sellThroughRate >= 0.3) healthScore += 20;
    else healthScore += 10;

    // Market activity component (30%)
    if (totalListings >= 1000) healthScore += 30;
    else if (totalListings >= 500) healthScore += 25;
    else if (totalListings >= 200) healthScore += 20;
    else if (totalListings >= 50) healthScore += 15;
    else healthScore += 5;

    // Price stability component (30%)
    // This would require more complex calculation based on price variance
    healthScore += 25; // Placeholder

    if (healthScore >= 80) return 'Excellent';
    if (healthScore >= 60) return 'Good';
    if (healthScore >= 40) return 'Fair';
    return 'Poor';
  }

  async getTrendingComics(timeframe) {
    const db = new Pool();

    try {
      const trendingQuery = await db.query(`
        WITH comic_metrics AS (
          SELECT 
            c.id,
            c.title,
            c.issue_number,
            p.name as publisher,
            COUNT(ml.id) as listing_count,
            COUNT(CASE WHEN ml.status = 'sold' THEN 1 END) as sales_count,
            AVG(ml.price) as avg_price,
            MAX(ml.price) as max_price,
            MIN(ml.price) as min_price,
            COUNT(wl.id) as wishlist_adds,
            COUNT(co.id) as collection_adds
          FROM comics c
          JOIN publishers p ON c.publisher_id = p.id
          LEFT JOIN marketplace_listings ml ON c.id = ml.comic_id 
            AND ml.created_at >= NOW() - INTERVAL '${timeframe}'
          LEFT JOIN wantlists wl ON c.id = wl.comic_id 
            AND wl.created_at >= NOW() - INTERVAL '${timeframe}'
          LEFT JOIN collections co ON c.id = co.comic_id 
            AND co.created_at >= NOW() - INTERVAL '${timeframe}'
          GROUP BY c.id, c.title, c.issue_number, p.name
          HAVING COUNT(ml.id) + COUNT(wl.id) + COUNT(co.id) >= 3
        )
        SELECT 
          *,
          (listing_count * 2 + sales_count * 3 + wishlist_adds + collection_adds) as trend_score,
          CASE 
            WHEN sales_count > 0 THEN (sales_count::float / listing_count) * 100
            ELSE 0 
          END as sell_through_percentage
        FROM comic_metrics
        ORDER BY trend_score DESC, avg_price DESC
        LIMIT 20
      `);

      return trendingQuery.rows.map(comic => ({
        comic_id: comic.id,
        title: comic.title,
        issue_number: comic.issue_number,
        publisher: comic.publisher,
        trend_score: comic.trend_score,
        market_activity: {
          listings: comic.listing_count,
          sales: comic.sales_count,
          wishlist_adds: comic.wishlist_adds,
          collection_adds: comic.collection_adds
        },
        pricing: {
          average: parseFloat(comic.avg_price) || 0,
          high: parseFloat(comic.max_price) || 0,
          low: parseFloat(comic.min_price) || 0
        },
        sell_through_rate: parseFloat(comic.sell_through_percentage) || 0
      }));
    } finally {
      db.end();
    }
  }

  async getPriceMovements(timeframe) {
    const db = new Pool();

    try {
      const movementQuery = await db.query(`
        WITH price_changes AS (
          SELECT 
            c.id,
            c.title,
            c.issue_number,
            ml.condition,
            AVG(CASE 
              WHEN ml.created_at >= NOW() - INTERVAL '7 days' 
              THEN ml.price 
            END) as recent_avg_price,
            AVG(CASE 
              WHEN ml.created_at < NOW() - INTERVAL '7 days' 
              THEN ml.price 
            END) as previous_avg_price
          FROM comics c
          JOIN marketplace_listings ml ON c.id = ml.comic_id
          WHERE ml.created_at >= NOW() - INTERVAL '${timeframe}'
          GROUP BY c.id, c.title, c.issue_number, ml.condition
          HAVING COUNT(CASE WHEN ml.created_at >= NOW() - INTERVAL '7 days' THEN 1 END) >= 2
            AND COUNT(CASE WHEN ml.created_at < NOW() - INTERVAL '7 days' THEN 1 END) >= 2
        )
        SELECT 
          *,
          CASE 
            WHEN previous_avg_price > 0 
            THEN ((recent_avg_price - previous_avg_price) / previous_avg_price) * 100
            ELSE 0 
          END as price_change_percentage
        FROM price_changes
        WHERE recent_avg_price IS NOT NULL AND previous_avg_price IS NOT NULL
        ORDER BY ABS(price_change_percentage) DESC
        LIMIT 30
      `);

      return movementQuery.rows.map(movement => ({
        comic_id: movement.id,
        title: movement.title,
        issue_number: movement.issue_number,
        condition: movement.condition,
        price_movement: {
          current_avg: parseFloat(movement.recent_avg_price),
          previous_avg: parseFloat(movement.previous_avg_price),
          change_percentage: parseFloat(movement.price_change_percentage),
          trend: movement.price_change_percentage > 5 ? 'increasing' :
            movement.price_change_percentage < -5 ? 'decreasing' : 'stable'
        }
      }));
    } finally {
      db.end();
    }
  }

  async getVolumeAnalysis(timeframe) {
    const db = new Pool();

    try {
      const volumeQuery = await db.query(`
        SELECT 
          DATE_TRUNC('day', ml.created_at) as date,
          COUNT(*) as daily_listings,
          COUNT(CASE WHEN ml.status = 'sold' THEN 1 END) as daily_sales,
          AVG(ml.price) as daily_avg_price
        FROM marketplace_listings ml
        WHERE ml.created_at >= NOW() - INTERVAL '${timeframe}'
        GROUP BY DATE_TRUNC('day', ml.created_at)
        ORDER BY date DESC
        LIMIT 30
      `);

      const dailyData = volumeQuery.rows;
      const totalVolume = dailyData.reduce((sum, day) => sum + day.daily_listings, 0);
      const avgDailyVolume = totalVolume / dailyData.length;

      return {
        total_volume: totalVolume,
        average_daily_volume: Math.round(avgDailyVolume),
        daily_breakdown: dailyData.map(day => ({
          date: day.date,
          listings: day.daily_listings,
          sales: day.daily_sales,
          avg_price: parseFloat(day.daily_avg_price) || 0
        })),
        volume_trend: this.calculateVolumeTrend(dailyData)
      };
    } finally {
      db.end();
    }
  }

  calculateVolumeTrend(dailyData) {
    if (dailyData.length < 7) return 'insufficient_data';

    const recentWeek = dailyData.slice(0, 7);
    const previousWeek = dailyData.slice(7, 14);

    const recentAvg = recentWeek.reduce((sum, day) => sum + day.daily_listings, 0) / 7;
    const previousAvg = previousWeek.reduce((sum, day) => sum + day.daily_listings, 0) / 7;

    const change = ((recentAvg - previousAvg) / previousAvg) * 100;

    if (change > 10) return 'increasing';
    if (change < -10) return 'decreasing';
    return 'stable';
  }

  async getMarketSentiment(timeframe) {
    // Analyze market sentiment based on various factors
    const db = new Pool();

    try {
      const sentimentQuery = await db.query(`
        WITH sentiment_factors AS (
          SELECT 
            COUNT(CASE WHEN ml.status = 'sold' AND ml.created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as recent_sales,
            COUNT(CASE WHEN ml.status = 'active' AND ml.created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as recent_listings,
            COUNT(wl.id) as wishlist_activity,
            COUNT(co.id) as collection_activity,
            AVG(ml.price) as avg_listing_price
          FROM marketplace_listings ml
          LEFT JOIN wantlists wl ON wl.created_at >= NOW() - INTERVAL '${timeframe}'
          LEFT JOIN collections co ON co.created_at >= NOW() - INTERVAL '${timeframe}'
          WHERE ml.created_at >= NOW() - INTERVAL '${timeframe}'
        )
        SELECT * FROM sentiment_factors
      `);

      const factors = sentimentQuery.rows[0];
      const sentiment = this.calculateSentimentScore(factors);

      return {
        overall_sentiment: sentiment.label,
        confidence: sentiment.confidence,
        sentiment_score: sentiment.score,
        contributing_factors: {
          sales_velocity: factors.recent_sales > 10 ? 'high' : factors.recent_sales > 5 ? 'moderate' : 'low',
          listing_activity: factors.recent_listings > 50 ? 'high' : factors.recent_listings > 20 ? 'moderate' : 'low',
          collector_interest: (factors.wishlist_activity + factors.collection_activity) > 100 ? 'high' : 'moderate'
        }
      };
    } finally {
      db.end();
    }
  }

  calculateSentimentScore(factors) {
    let score = 50; // Neutral baseline

    // Sales velocity impact
    if (factors.recent_sales > 20) score += 20;
    else if (factors.recent_sales > 10) score += 10;
    else if (factors.recent_sales < 3) score -= 15;

    // Listing activity impact
    if (factors.recent_listings > 100) score += 15;
    else if (factors.recent_listings > 50) score += 8;
    else if (factors.recent_listings < 10) score -= 10;

    // Collector interest impact
    const collectorActivity = factors.wishlist_activity + factors.collection_activity;
    if (collectorActivity > 200) score += 15;
    else if (collectorActivity > 100) score += 8;
    else if (collectorActivity < 20) score -= 8;

    // Normalize score
    score = Math.max(0, Math.min(100, score));

    let label, confidence;
    if (score >= 70) {
      label = 'bullish';
      confidence = (score - 70) / 30;
    } else if (score >= 30) {
      label = 'neutral';
      confidence = 1 - Math.abs(score - 50) / 20;
    } else {
      label = 'bearish';
      confidence = (30 - score) / 30;
    }

    return { score, label, confidence };
  }

  async generateForecasts(comicId, publisher, days = 30) {
    if (!this.isInitialized) return null;

    try {
      let forecastData;

      if (comicId) {
        forecastData = await this.forecastComicPrice(comicId, days);
      } else if (publisher) {
        forecastData = await this.forecastPublisherTrends(publisher, days);
      } else {
        forecastData = await this.forecastMarketTrends(days);
      }

      return forecastData;
    } catch (error) {
      console.error('Forecast generation error:', error);
      return null;
    }
  }

  async forecastComicPrice(comicId, days) {
    // Get historical price data
    const historicalData = await this.getHistoricalPriceData(comicId);

    if (historicalData.length < 30) {
      return {
        forecast_type: 'comic_price',
        comic_id: comicId,
        error: 'Insufficient historical data for forecasting',
        confidence: 0
      };
    }

    // Prepare data for time series forecasting
    const sequences = this.prepareTimeSeriesData(historicalData);

    // Generate forecast using the trend model
    const forecast = await this.generateTimeSeriesForecast(sequences, days);

    return {
      forecast_type: 'comic_price',
      comic_id: comicId,
      historical_data: historicalData.slice(-30), // Last 30 days
      forecast: forecast,
      confidence: this.calculateForecastConfidence(historicalData),
      generated_at: new Date().toISOString()
    };
  }

  async getHistoricalPriceData(comicId) {
    const db = new Pool();

    try {
      const historyQuery = await db.query(`
        SELECT 
          DATE_TRUNC('day', created_at) as date,
          AVG(price) as avg_price,
          COUNT(*) as volume,
          MIN(price) as min_price,
          MAX(price) as max_price
        FROM marketplace_listings
        WHERE comic_id = $1 AND created_at >= NOW() - INTERVAL '90 days'
        GROUP BY DATE_TRUNC('day', created_at)
        ORDER BY date ASC
      `, [comicId]);

      return historyQuery.rows.map(row => ({
        date: row.date,
        price: parseFloat(row.avg_price),
        volume: parseInt(row.volume),
        min_price: parseFloat(row.min_price),
        max_price: parseFloat(row.max_price)
      }));
    } finally {
      db.end();
    }
  }

  prepareTimeSeriesData(historicalData) {
    // Convert historical data to sequences for LSTM input
    const sequences = [];
    const features = historicalData.map(d => [
      d.price,
      d.volume,
      d.max_price - d.min_price, // Price range
      d.price / (d.max_price - d.min_price || 1), // Relative position
      Math.log(d.volume + 1) // Log volume
    ]);

    // Create sequences of 30 days
    for (let i = 30; i < features.length; i++) {
      sequences.push({
        input: features.slice(i - 30, i),
        target: features[i][0] // Price is the target
      });
    }

    return sequences;
  }

  async generateTimeSeriesForecast(sequences, days) {
    if (sequences.length === 0) return [];

    // Use the last sequence as input for forecasting
    const lastSequence = sequences[sequences.length - 1].input;
    const forecasts = [];

    let currentInput = tf.tensor3d([lastSequence]);

    for (let i = 0; i < days; i++) {
      const prediction = this.trendModel.predict(currentInput);
      const predictedValue = await prediction.data();

      forecasts.push({
        date: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000),
        predicted_price: predictedValue[0],
        confidence: Math.max(0.3, 0.9 - (i * 0.02)) // Confidence decreases over time
      });

      // Update input for next prediction (sliding window)
      const newFeature = [
        predictedValue[0],
        lastSequence[lastSequence.length - 1][1], // Use last volume
        0, // Assume 0 range for prediction
        0.5, // Assume middle position
        Math.log(lastSequence[lastSequence.length - 1][1] + 1)
      ];

      // Slide the window
      const newInput = lastSequence.slice(1).concat([newFeature]);
      currentInput.dispose();
      currentInput = tf.tensor3d([newInput]);
      prediction.dispose();
    }

    currentInput.dispose();
    return forecasts;
  }

  calculateForecastConfidence(historicalData) {
    // Calculate confidence based on data quality and stability
    const priceVariance = this.calculateVariance(historicalData.map(d => d.price));
    const volumeConsistency = this.calculateConsistency(historicalData.map(d => d.volume));

    let confidence = 0.8; // Base confidence

    // Adjust for price stability
    if (priceVariance < 100) confidence += 0.1;
    else if (priceVariance > 1000) confidence -= 0.2;

    // Adjust for volume consistency
    if (volumeConsistency > 0.7) confidence += 0.1;
    else if (volumeConsistency < 0.3) confidence -= 0.15;

    // Adjust for data completeness
    if (historicalData.length >= 60) confidence += 0.05;
    else if (historicalData.length < 30) confidence -= 0.2;

    return Math.max(0.1, Math.min(0.95, confidence));
  }

  calculateVariance(values) {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
    return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  }

  calculateConsistency(values) {
    if (values.length < 2) return 0;

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const deviations = values.map(value => Math.abs(value - mean) / mean);
    const avgDeviation = deviations.reduce((a, b) => a + b, 0) / deviations.length;

    return Math.max(0, 1 - avgDeviation);
  }

  async detectAnomalies(timeframe) {
    const db = new Pool();

    try {
      // Get recent transactions for anomaly detection
      const anomalyQuery = await db.query(`
        SELECT 
          ml.*,
          c.title,
          c.issue_number,
          p.name as publisher,
          AVG(ml2.price) OVER (
            PARTITION BY ml.comic_id, ml.condition 
            ORDER BY ml2.created_at 
            ROWS BETWEEN 10 PRECEDING AND 1 PRECEDING
          ) as avg_recent_price
        FROM marketplace_listings ml
        JOIN comics c ON ml.comic_id = c.id
        JOIN publishers p ON c.publisher_id = p.id
        LEFT JOIN marketplace_listings ml2 ON ml.comic_id = ml2.comic_id 
          AND ml.condition = ml2.condition
          AND ml2.created_at < ml.created_at
        WHERE ml.created_at >= NOW() - INTERVAL '${timeframe}'
          AND ml.status IN ('sold', 'active')
        ORDER BY ml.created_at DESC
      `);

      const transactions = anomalyQuery.rows;
      const anomalies = [];

      transactions.forEach(transaction => {
        if (transaction.avg_recent_price) {
          const priceDifference = Math.abs(transaction.price - transaction.avg_recent_price);
          const percentageDifference = (priceDifference / transaction.avg_recent_price) * 100;

          if (percentageDifference > 50) { // 50% threshold for anomaly
            anomalies.push({
              type: transaction.price > transaction.avg_recent_price ? 'price_spike' : 'price_drop',
              comic_id: transaction.comic_id,
              title: transaction.title,
              issue_number: transaction.issue_number,
              publisher: transaction.publisher,
              condition: transaction.condition,
              anomalous_price: transaction.price,
              expected_price: transaction.avg_recent_price,
              percentage_difference: percentageDifference,
              date: transaction.created_at,
              severity: percentageDifference > 100 ? 'high' : percentageDifference > 75 ? 'medium' : 'low'
            });
          }
        }
      });

      return anomalies.sort((a, b) => b.percentage_difference - a.percentage_difference);
    } finally {
      db.end();
    }
  }

  async getComicSpecificIntelligence(comicId) {
    const db = new Pool();

    try {
      const comicQuery = await db.query(`
        SELECT 
          c.*,
          p.name as publisher_name,
          COUNT(DISTINCT co.user_id) as collectors_count,
          COUNT(DISTINCT wl.user_id) as wishlist_count,
          COUNT(ml.id) as total_listings,
          COUNT(CASE WHEN ml.status = 'sold' THEN 1 END) as total_sales,
          AVG(CASE WHEN ml.status = 'sold' THEN ml.price END) as avg_sold_price,
          MAX(ml.price) as highest_listing,
          MIN(ml.price) as lowest_listing
        FROM comics c
        JOIN publishers p ON c.publisher_id = p.id
        LEFT JOIN collections co ON c.id = co.comic_id
        LEFT JOIN wantlists wl ON c.id = wl.comic_id
        LEFT JOIN marketplace_listings ml ON c.id = ml.comic_id
        WHERE c.id = $1
        GROUP BY c.id, p.name
      `, [comicId]);

      const comic = comicQuery.rows[0];
      if (!comic) return null;

      return {
        comic_id: comicId,
        basic_info: {
          title: comic.title,
          issue_number: comic.issue_number,
          publisher: comic.publisher_name,
          publication_year: comic.publication_year
        },
        market_metrics: {
          collectors: comic.collectors_count,
          wishlist_demand: comic.wishlist_count,
          total_listings: comic.total_listings,
          sales_count: comic.total_sales,
          sell_through_rate: comic.total_listings > 0 ?
            (comic.total_sales / comic.total_listings) * 100 : 0
        },
        pricing: {
          average_sold: parseFloat(comic.avg_sold_price) || 0,
          highest_listing: parseFloat(comic.highest_listing) || 0,
          lowest_listing: parseFloat(comic.lowest_listing) || 0,
          price_range: (parseFloat(comic.highest_listing) || 0) - (parseFloat(comic.lowest_listing) || 0)
        },
        investment_grade: this.calculateInvestmentGrade(comic),
        liquidity_score: this.calculateLiquidityScore(comic)
      };
    } finally {
      db.end();
    }
  }

  calculateInvestmentGrade(comic) {
    let score = 0;

    // Collector interest (30%)
    if (comic.collectors_count > 100) score += 30;
    else if (comic.collectors_count > 50) score += 25;
    else if (comic.collectors_count > 20) score += 20;
    else if (comic.collectors_count > 5) score += 15;
    else score += 5;

    // Market activity (25%)
    if (comic.total_sales > 20) score += 25;
    else if (comic.total_sales > 10) score += 20;
    else if (comic.total_sales > 5) score += 15;
    else if (comic.total_sales > 0) score += 10;
    else score += 0;

    // Demand vs supply (25%)
    const demandRatio = comic.wishlist_count / (comic.total_listings || 1);
    if (demandRatio > 2) score += 25;
    else if (demandRatio > 1) score += 20;
    else if (demandRatio > 0.5) score += 15;
    else score += 10;

    // Price stability (20%)
    const sellThroughRate = comic.total_listings > 0 ?
      (comic.total_sales / comic.total_listings) : 0;
    if (sellThroughRate > 0.7) score += 20;
    else if (sellThroughRate > 0.5) score += 15;
    else if (sellThroughRate > 0.3) score += 10;
    else score += 5;

    if (score >= 80) return 'A+';
    if (score >= 70) return 'A';
    if (score >= 60) return 'B+';
    if (score >= 50) return 'B';
    if (score >= 40) return 'C+';
    if (score >= 30) return 'C';
    if (score >= 20) return 'D';
    return 'F';
  }

  calculateLiquidityScore(comic) {
    const salesVolume = comic.total_sales || 0;
    const listingActivity = comic.total_listings || 0;
    const sellThroughRate = listingActivity > 0 ? (salesVolume / listingActivity) : 0;

    let liquidityScore = 0;

    // Sales volume component (50%)
    if (salesVolume >= 50) liquidityScore += 50;
    else if (salesVolume >= 20) liquidityScore += 40;
    else if (salesVolume >= 10) liquidityScore += 30;
    else if (salesVolume >= 5) liquidityScore += 20;
    else if (salesVolume >= 1) liquidityScore += 10;

    // Sell-through rate component (50%)
    if (sellThroughRate >= 0.8) liquidityScore += 50;
    else if (sellThroughRate >= 0.6) liquidityScore += 40;
    else if (sellThroughRate >= 0.4) liquidityScore += 30;
    else if (sellThroughRate >= 0.2) liquidityScore += 20;
    else if (sellThroughRate > 0) liquidityScore += 10;

    if (liquidityScore >= 80) return 'Very High';
    if (liquidityScore >= 60) return 'High';
    if (liquidityScore >= 40) return 'Medium';
    if (liquidityScore >= 20) return 'Low';
    return 'Very Low';
  }

  async getPublisherAnalysis(publisher) {
    const db = new Pool();

    try {
      const publisherQuery = await db.query(`
        SELECT 
          p.name,
          COUNT(DISTINCT c.id) as total_comics,
          COUNT(DISTINCT co.user_id) as total_collectors,
          COUNT(ml.id) as total_listings,
          COUNT(CASE WHEN ml.status = 'sold' THEN 1 END) as total_sales,
          AVG(ml.price) as avg_price,
          SUM(CASE WHEN ml.status = 'sold' THEN ml.price ELSE 0 END) as total_revenue
        FROM publishers p
        JOIN comics c ON p.id = c.publisher_id
        LEFT JOIN collections co ON c.id = co.comic_id
        LEFT JOIN marketplace_listings ml ON c.id = ml.comic_id
        WHERE p.name ILIKE $1
        GROUP BY p.name
      `, [`%${publisher}%`]);

      const data = publisherQuery.rows[0];
      if (!data) return null;

      return {
        publisher: data.name,
        catalog_size: data.total_comics,
        collector_base: data.total_collectors,
        market_activity: {
          total_listings: data.total_listings,
          total_sales: data.total_sales,
          sell_through_rate: data.total_listings > 0 ?
            (data.total_sales / data.total_listings) * 100 : 0
        },
        financial_metrics: {
          average_price: parseFloat(data.avg_price) || 0,
          total_market_value: parseFloat(data.total_revenue) || 0
        },
        market_share: await this.calculatePublisherMarketShare(data.name),
        performance_grade: this.calculatePublisherGrade(data)
      };
    } finally {
      db.end();
    }
  }

  async calculatePublisherMarketShare(publisherName) {
    const db = new Pool();

    try {
      const shareQuery = await db.query(`
        WITH publisher_sales AS (
          SELECT 
            p.name,
            COUNT(CASE WHEN ml.status = 'sold' THEN 1 END) as sales
          FROM publishers p
          JOIN comics c ON p.id = c.publisher_id
          LEFT JOIN marketplace_listings ml ON c.id = ml.comic_id
          GROUP BY p.name
        ),
        total_market AS (
          SELECT SUM(sales) as total_sales FROM publisher_sales
        )
        SELECT 
          ps.sales::float / tm.total_sales * 100 as market_share
        FROM publisher_sales ps
        CROSS JOIN total_market tm
        WHERE ps.name = $1
      `, [publisherName]);

      return parseFloat(shareQuery.rows[0]?.market_share) || 0;
    } finally {
      db.end();
    }
  }

  calculatePublisherGrade(data) {
    let score = 0;

    // Market activity (40%)
    if (data.total_sales > 1000) score += 40;
    else if (data.total_sales > 500) score += 35;
    else if (data.total_sales > 200) score += 30;
    else if (data.total_sales > 50) score += 20;
    else score += 10;

    // Collector base (30%)
    if (data.total_collectors > 5000) score += 30;
    else if (data.total_collectors > 2000) score += 25;
    else if (data.total_collectors > 1000) score += 20;
    else if (data.total_collectors > 200) score += 15;
    else score += 5;

    // Average price (30%)
    const avgPrice = parseFloat(data.avg_price) || 0;
    if (avgPrice > 100) score += 30;
    else if (avgPrice > 50) score += 25;
    else if (avgPrice > 25) score += 20;
    else if (avgPrice > 10) score += 15;
    else score += 10;

    if (score >= 85) return 'Premium';
    if (score >= 70) return 'Strong';
    if (score >= 55) return 'Stable';
    if (score >= 40) return 'Growing';
    return 'Emerging';
  }
}

module.exports = new MarketIntelligenceService();
