const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    }
});

// AI-powered cover image matching
router.post('/match-cover', upload.single('cover_image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Cover image is required' });
        }

        const imageUrl = `/uploads/${req.file.filename}`;
        
        // In a real implementation, this would use computer vision APIs
        // For now, we'll simulate AI matching with similarity algorithms
        const mockMatches = await findSimilarCovers(imageUrl);
        
        res.json({
            uploaded_image: imageUrl,
            matches: mockMatches,
            confidence_scores: mockMatches.map(match => ({
                comic_id: match.id,
                confidence: Math.random() * 0.4 + 0.6 // 60-100% confidence
            }))
        });
    } catch (error) {
        console.error('Error in cover matching:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Helper function to simulate AI cover matching
async function findSimilarCovers(uploadedImageUrl) {
    // This would normally use computer vision APIs like Google Vision, AWS Rekognition, or OpenAI Vision
    // For demonstration, we'll return some sample matches
    const query = `
        SELECT 
            c.id,
            c.title,
            c.issue_number,
            c.variant_name,
            c.cover_image_url,
            c.publication_date,
            p.name as publisher_name,
            s.title as series_title,
            -- Simulate similarity score
            (0.6 + RANDOM() * 0.4) as similarity_score
        FROM comics c
        LEFT JOIN publishers p ON c.publisher_id = p.id
        LEFT JOIN series s ON c.series_id = s.id
        WHERE c.cover_image_url IS NOT NULL
        ORDER BY RANDOM()
        LIMIT 5
    `;
    
    const result = await db.query(query);
    return result.rows;
}

// AI grading assistance
router.post('/grade-assistance', upload.single('comic_image'), async (req, res) => {
    try {
        const { comic_id, condition_notes } = req.body;
        
        if (!req.file) {
            return res.status(400).json({ error: 'Comic image is required for grading assistance' });
        }

        const imageUrl = `/uploads/${req.file.filename}`;
        
        // Get comic details for context
        let comicContext = {};
        if (comic_id) {
            const comicQuery = `
                SELECT c.*, p.name as publisher_name, s.title as series_title
                FROM comics c
                LEFT JOIN publishers p ON c.publisher_id = p.id
                LEFT JOIN series s ON c.series_id = s.id
                WHERE c.id = $1
            `;
            const comicResult = await db.query(comicQuery, [comic_id]);
            comicContext = comicResult.rows[0] || {};
        }

        // Simulate AI grading analysis
        const gradingAnalysis = await analyzeComicCondition(imageUrl, condition_notes, comicContext);
        
        res.json({
            uploaded_image: imageUrl,
            comic_context: comicContext,
            grading_analysis: gradingAnalysis,
            recommendations: generateGradingRecommendations(gradingAnalysis)
        });
    } catch (error) {
        console.error('Error in grading assistance:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Helper function to simulate AI grading analysis
async function analyzeComicCondition(imageUrl, conditionNotes, comicContext) {
    // This would normally use AI vision APIs to analyze the comic condition
    // For demonstration, we'll provide a comprehensive mock analysis
    
    const conditions = ['Poor', 'Fair', 'Good', 'Very Good', 'Fine', 'Very Fine', 'Near Mint', 'Mint'];
    const estimatedGrade = conditions[Math.floor(Math.random() * conditions.length)];
    
    return {
        estimated_grade: estimatedGrade,
        confidence: Math.random() * 0.3 + 0.7, // 70-100% confidence
        detected_issues: [
            {
                type: 'Cover Wear',
                severity: Math.random() > 0.5 ? 'Minor' : 'Moderate',
                description: 'Some edge wear visible along the spine',
                impact_on_grade: 'Low'
            },
            {
                type: 'Corner Condition',
                severity: Math.random() > 0.7 ? 'None' : 'Minor',
                description: 'Slight corner blunting on top right',
                impact_on_grade: 'Low'
            },
            {
                type: 'Color Quality',
                severity: 'Good',
                description: 'Colors remain vibrant with minimal fading',
                impact_on_grade: 'Positive'
            }
        ].filter(issue => Math.random() > 0.3), // Randomly include some issues
        pricing_estimate: {
            current_grade: {
                grade: estimatedGrade,
                estimated_value: Math.floor(Math.random() * 500 + 50)
            },
            potential_grades: conditions.map(grade => ({
                grade,
                estimated_value: Math.floor(Math.random() * 800 + 30),
                probability: Math.random()
            })).sort((a, b) => b.probability - a.probability).slice(0, 3)
        }
    };
}

// Generate grading recommendations
function generateGradingRecommendations(analysis) {
    const recommendations = [];
    
    // Professional grading recommendation
    if (analysis.confidence > 0.8 && analysis.estimated_grade === 'Near Mint') {
        recommendations.push({
            type: 'Professional Grading',
            priority: 'High',
            description: 'Consider professional grading through CGC or CBCS for this high-grade comic',
            potential_value_increase: '15-30%'
        });
    }
    
    // Storage recommendations
    recommendations.push({
        type: 'Storage',
        priority: 'Medium',
        description: 'Store in acid-free bag and board, keep in cool, dry environment',
        benefit: 'Preserve current condition and prevent further degradation'
    });
    
    // Investment potential
    if (analysis.pricing_estimate.current_grade.estimated_value > 200) {
        recommendations.push({
            type: 'Investment',
            priority: 'Medium',
            description: 'This comic shows strong investment potential based on current market trends',
            market_outlook: 'Positive'
        });
    }
    
    return recommendations;
}

// AI-powered price prediction
router.get('/price-prediction/:comic_id', async (req, res) => {
    try {
        const { comic_id } = req.params;
        const { condition = 'NM', timeframe = '6' } = req.query;
        
        // Get historical price data
        const priceQuery = `
            SELECT price, sale_date, condition, source
            FROM price_history
            WHERE comic_id = $1 AND condition = $2
            ORDER BY sale_date DESC
            LIMIT 20
        `;
        
        const priceResult = await db.query(priceQuery, [comic_id, condition]);
        const priceHistory = priceResult.rows;
        
        if (priceHistory.length < 3) {
            return res.status(400).json({ 
                error: 'Insufficient price history for prediction',
                required_data_points: 3,
                available_data_points: priceHistory.length
            });
        }
        
        // Generate AI price prediction
        const prediction = generatePricePrediction(priceHistory, parseInt(timeframe));
        
        res.json({
            comic_id,
            condition,
            timeframe_months: timeframe,
            current_price: priceHistory[0]?.price || null,
            prediction,
            confidence_factors: [
                'Historical price volatility',
                'Market trend analysis',
                'Comparable sales data',
                'Series popularity metrics'
            ]
        });
    } catch (error) {
        console.error('Error in price prediction:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Helper function for price prediction
function generatePricePrediction(priceHistory, timeframeMonths) {
    const prices = priceHistory.map(p => p.price);
    const currentPrice = prices[0];
    
    // Simple trend analysis
    const recentPrices = prices.slice(0, Math.min(5, prices.length));
    const averageRecent = recentPrices.reduce((a, b) => a + b, 0) / recentPrices.length;
    
    // Calculate trend
    let trend = 0;
    if (prices.length >= 2) {
        trend = (prices[0] - prices[prices.length - 1]) / prices[prices.length - 1];
    }
    
    // Project future price with some randomness for volatility
    const trendMultiplier = Math.max(0.5, Math.min(2, 1 + trend));
    const volatility = 0.1 + Math.random() * 0.2; // 10-30% volatility
    const timeMultiplier = Math.pow(trendMultiplier, timeframeMonths / 12);
    
    const predictedPrice = currentPrice * timeMultiplier;
    const confidence = Math.max(0.3, 1 - (volatility * timeframeMonths / 12));
    
    return {
        predicted_price: Math.round(predictedPrice * 100) / 100,
        confidence: Math.round(confidence * 100) / 100,
        price_range: {
            low: Math.round(predictedPrice * (1 - volatility) * 100) / 100,
            high: Math.round(predictedPrice * (1 + volatility) * 100) / 100
        },
        trend_analysis: {
            direction: trend > 0.05 ? 'Rising' : trend < -0.05 ? 'Falling' : 'Stable',
            strength: Math.abs(trend) > 0.2 ? 'Strong' : Math.abs(trend) > 0.05 ? 'Moderate' : 'Weak',
            historical_volatility: Math.round(volatility * 100) + '%'
        }
    };
}

// Smart comic recommendations based on collection
router.get('/recommendations/:user_id', async (req, res) => {
    try {
        const { user_id } = req.params;
        const { limit = 10 } = req.query;
        
        // Get user's collection to analyze preferences
        const collectionQuery = `
            SELECT c.*, p.name as publisher_name, s.title as series_title, s.genre
            FROM collections col
            JOIN comics c ON col.comic_id = c.id
            LEFT JOIN publishers p ON c.publisher_id = p.id
            LEFT JOIN series s ON c.series_id = s.id
            WHERE col.user_id = $1
        `;
        
        const collection = await db.query(collectionQuery, [user_id]);
        
        if (collection.rows.length === 0) {
            return res.status(400).json({ error: 'User has no collection data for recommendations' });
        }
        
        // Analyze user preferences
        const preferences = analyzeUserPreferences(collection.rows);
        
        // Generate recommendations
        const recommendations = await generateRecommendations(preferences, user_id, limit);
        
        res.json({
            user_id,
            preference_analysis: preferences,
            recommendations,
            recommendation_reasons: recommendations.map(rec => ({
                comic_id: rec.id,
                reasons: rec.recommendation_reasons
            }))
        });
    } catch (error) {
        console.error('Error generating recommendations:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Analyze user preferences from collection
function analyzeUserPreferences(collection) {
    const publishers = {};
    const genres = {};
    const characters = {};
    const eras = {};
    
    collection.forEach(comic => {
        // Publisher preferences
        if (comic.publisher_name) {
            publishers[comic.publisher_name] = (publishers[comic.publisher_name] || 0) + 1;
        }
        
        // Genre preferences
        if (comic.genre) {
            genres[comic.genre] = (genres[comic.genre] || 0) + 1;
        }
        
        // Character preferences
        if (comic.characters) {
            comic.characters.forEach(character => {
                characters[character] = (characters[character] || 0) + 1;
            });
        }
        
        // Era preferences
        if (comic.publication_date) {
            const year = new Date(comic.publication_date).getFullYear();
            const era = getEra(year);
            eras[era] = (eras[era] || 0) + 1;
        }
    });
    
    return {
        top_publishers: Object.entries(publishers).sort((a, b) => b[1] - a[1]).slice(0, 3),
        top_genres: Object.entries(genres).sort((a, b) => b[1] - a[1]).slice(0, 3),
        top_characters: Object.entries(characters).sort((a, b) => b[1] - a[1]).slice(0, 5),
        preferred_eras: Object.entries(eras).sort((a, b) => b[1] - a[1]).slice(0, 2)
    };
}

// Get era from year
function getEra(year) {
    if (year < 1956) return 'Golden Age';
    if (year < 1970) return 'Silver Age';
    if (year < 1985) return 'Bronze Age';
    if (year < 2000) return 'Modern Age';
    return 'Contemporary';
}

// Generate recommendations based on preferences
async function generateRecommendations(preferences, userId, limit) {
    const conditions = [];
    const params = [];
    let paramIndex = 1;
    
    // Exclude comics already in collection
    conditions.push(`c.id NOT IN (SELECT comic_id FROM collections WHERE user_id = $${paramIndex})`);
    params.push(userId);
    paramIndex++;
    
    // Prefer top publishers
    if (preferences.top_publishers.length > 0) {
        const topPublisher = preferences.top_publishers[0][0];
        conditions.push(`p.name = $${paramIndex}`);
        params.push(topPublisher);
        paramIndex++;
    }
    
    const query = `
        SELECT 
            c.id,
            c.title,
            c.issue_number,
            c.cover_image_url,
            c.key_issue_notes,
            c.characters,
            p.name as publisher_name,
            s.title as series_title,
            s.genre,
            (SELECT price FROM price_history ph 
             WHERE ph.comic_id = c.id AND ph.condition = 'NM' 
             ORDER BY ph.sale_date DESC LIMIT 1) as latest_price,
            ARRAY['Similar to collection', 'Preferred publisher', 'Investment potential'] as recommendation_reasons
        FROM comics c
        LEFT JOIN publishers p ON c.publisher_id = p.id
        LEFT JOIN series s ON c.series_id = s.id
        WHERE ${conditions.join(' AND ')}
        ORDER BY RANDOM()
        LIMIT $${paramIndex}
    `;
    
    params.push(limit);
    const result = await db.query(query, params);
    return result.rows;
}

module.exports = router; 