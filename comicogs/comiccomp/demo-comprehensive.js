#!/usr/bin/env node

/**
 * ComicComp Comprehensive System Demo
 * 
 * This demo showcases the complete ComicComp Live Pricing Intelligence system:
 * - Real eBay API Integration (mock for demo)
 * - Multiple Marketplace Scrapers
 * - Price Normalization Engine
 * - AI Recommendation Engine
 * - Complete workflow from search to recommendations
 */

const DataCollectionService = require('./services/DataCollectionService');
const PriceNormalizationEngine = require('./services/PriceNormalizationEngine');
const RecommendationEngine = require('./services/RecommendationEngine');

class ComicCompDemo {
    constructor() {
        this.config = {
            maxRetries: 2,
            retryDelay: 500,
            enabledMarketplaces: ['ebay', 'whatnot', 'comicconnect', 'heritage'],
            apiKeys: {
                // Using demo/mock keys
                ebayClientId: 'DEMO_CLIENT_ID',
                ebayClientSecret: 'DEMO_CLIENT_SECRET'
            },
            ebay: {
                sandbox: true
            }
        };

        this.dataCollectionService = new DataCollectionService(this.config);
        this.priceNormalizer = new PriceNormalizationEngine();
        this.recommendationEngine = new RecommendationEngine();
    }

    async runComprehensiveDemo() {
        console.log('🚀 ComicComp Live Pricing Intelligence Demo');
        console.log('==========================================\n');

        try {
            // Demo 1: Single Comic Search with Full Analysis
            await this.demoSingleComicSearch();
            
            // Demo 2: Marketplace Comparison
            await this.demoMarketplaceComparison();
            
            // Demo 3: Price Normalization Engine
            await this.demoPriceNormalization();
            
            // Demo 4: AI Recommendation Engine
            await this.demoRecommendationEngine();
            
            // Demo 5: User Context Analysis
            await this.demoUserContextAnalysis();
            
            // Demo 6: Portfolio Analysis
            await this.demoPortfolioAnalysis();

            console.log('\n✅ ComicComp Comprehensive Demo Completed Successfully!');
            console.log('\n📊 System Capabilities Demonstrated:');
            console.log('  ✓ Multi-marketplace data collection');
            console.log('  ✓ Real-time price analysis');
            console.log('  ✓ Statistical trend analysis');
            console.log('  ✓ AI-powered recommendations');
            console.log('  ✓ Risk assessment');
            console.log('  ✓ Portfolio optimization');
            console.log('  ✓ Data quality validation');

        } catch (error) {
            console.error('❌ Demo failed:', error.message);
        }
    }

    async demoSingleComicSearch() {
        console.log('🔍 Demo 1: Complete Comic Analysis');
        console.log('===================================');
        
        const query = 'Amazing Spider-Man #1';
        console.log(`Searching for: "${query}"\n`);

        // Perform complete analysis
        const result = await this.dataCollectionService.collectPricingData(query, {
            maxResults: 50,
            userContext: {
                action: 'buy',
                condition: 'Near Mint'
            }
        });

        if (result.success) {
            console.log('📈 Collection Results:');
            console.log(`  • Total listings collected: ${result.summary.totalListings}`);
            console.log(`  • Marketplaces searched: ${result.summary.marketplacesSearched}`);
            console.log(`  • Successful marketplaces: ${result.summary.marketplacesSuccessful}`);
            console.log(`  • Collection time: ${result.summary.collectionTimeMs}ms\n`);

            // Display pricing analysis for first comic
            const comicKeys = Object.keys(result.pricing);
            if (comicKeys.length > 0) {
                const firstComic = comicKeys[0];
                const analysis = result.pricing[firstComic];
                
                if (analysis.status === 'success') {
                    console.log(`📊 Pricing Analysis for ${firstComic}:`);
                    const stats = analysis.data.statistics;
                    console.log(`  • Median Price: $${stats.median}`);
                    console.log(`  • Average Price: $${stats.mean}`);
                    console.log(`  • Price Range: $${stats.min} - $${stats.max}`);
                    console.log(`  • Data Quality Score: ${Math.round(analysis.data.dataQuality.score * 100)}%`);
                    console.log(`  • Volatility: ${Math.round(stats.coefficientOfVariation * 100)}%\n`);

                    // Display top recommendations
                    const comicRecs = result.recommendations.comics[firstComic];
                    if (comicRecs && comicRecs.recommendations.length > 0) {
                        console.log('🤖 Top AI Recommendations:');
                        comicRecs.recommendations.slice(0, 3).forEach((rec, index) => {
                            console.log(`  ${index + 1}. ${rec.title}`);
                            console.log(`     ${rec.description}`);
                            console.log(`     Priority: ${rec.priority}/10, Confidence: ${Math.round(rec.confidence * 100)}%`);
                        });
                    }
                }
            }
        }

        console.log('\n' + '='.repeat(50) + '\n');
    }

    async demoMarketplaceComparison() {
        console.log('🏪 Demo 2: Marketplace Comparison Analysis');
        console.log('==========================================');

        // Generate sample data from multiple marketplaces
        const marketplaceData = this.generateSampleMarketplaceData();
        
        console.log('📊 Sample Marketplace Data Generated:');
        Object.entries(marketplaceData).forEach(([marketplace, listings]) => {
            const avgPrice = listings.reduce((sum, l) => sum + l.price, 0) / listings.length;
            console.log(`  • ${marketplace}: ${listings.length} listings, avg $${avgPrice.toFixed(2)}`);
        });

        // Normalize across marketplaces
        const allListings = [];
        Object.entries(marketplaceData).forEach(([marketplace, listings]) => {
            listings.forEach(listing => {
                allListings.push({ ...listing, marketplace: marketplace.toLowerCase() });
            });
        });

        const normalizedData = await this.priceNormalizer.normalizePricingData(allListings);
        
        console.log('\n🔄 Price Normalization Results:');
        Object.entries(normalizedData).forEach(([comicKey, analysis]) => {
            if (analysis.status === 'success') {
                console.log(`\n📖 ${comicKey}:`);
                console.log(`  • Raw listings: ${analysis.data.rawListingCount}`);
                console.log(`  • After filtering: ${analysis.data.filteredListingCount}`);
                console.log(`  • Outliers removed: ${analysis.data.outlierCount}`);
                console.log(`  • Data quality: ${Math.round(analysis.data.dataQuality.score * 100)}%`);
                
                if (analysis.data.insights && analysis.data.insights.length > 0) {
                    console.log('  • Key insights:');
                    analysis.data.insights.forEach(insight => {
                        console.log(`    - ${insight.message}`);
                    });
                }
            }
        });

        console.log('\n' + '='.repeat(50) + '\n');
    }

    async demoPriceNormalization() {
        console.log('⚙️ Demo 3: Advanced Price Normalization');
        console.log('=======================================');

        // Generate diverse pricing data with various conditions and marketplaces
        const diverseData = this.generateDiversePricingData();
        
        console.log('📊 Input Data Summary:');
        console.log(`  • Total listings: ${diverseData.length}`);
        console.log(`  • Price range: $${Math.min(...diverseData.map(d => d.price))} - $${Math.max(...diverseData.map(d => d.price))}`);
        console.log(`  • Conditions: ${[...new Set(diverseData.map(d => d.condition))].join(', ')}`);
        console.log(`  • Marketplaces: ${[...new Set(diverseData.map(d => d.marketplace))].join(', ')}\n`);

        const normalizedResult = await this.priceNormalizer.normalizePricingData(diverseData);

        Object.entries(normalizedResult).forEach(([comicKey, analysis]) => {
            if (analysis.status === 'success') {
                console.log(`📈 Analysis for ${comicKey}:`);
                
                // Statistical breakdown
                const stats = analysis.data.statistics;
                console.log('  Statistics:');
                console.log(`    • Mean: $${stats.mean} | Median: $${stats.median}`);
                console.log(`    • Std Dev: $${stats.standardDeviation} | CV: ${Math.round(stats.coefficientOfVariation * 100)}%`);
                console.log(`    • Percentiles: 25th=$${stats.percentiles.p25}, 75th=$${stats.percentiles.p75}`);

                // Trend analysis
                if (analysis.data.trends) {
                    const trends = analysis.data.trends;
                    console.log('  Trends:');
                    console.log(`    • Direction: ${trends.direction} (${trends.slope > 0 ? '+' : ''}${trends.slope}%)`);
                    console.log(`    • Confidence: ${Math.round(trends.confidence * 100)}%`);
                    console.log(`    • Volatility: ${Math.round(trends.volatility * 100)}%`);
                }

                // Condition-specific pricing
                if (analysis.data.conditionPricing) {
                    console.log('  Condition Pricing:');
                    Object.entries(analysis.data.conditionPricing).forEach(([condition, pricing]) => {
                        console.log(`    • ${condition}: $${pricing.average} (${pricing.count} listings)`);
                    });
                }
            }
        });

        console.log('\n' + '='.repeat(50) + '\n');
    }

    async demoRecommendationEngine() {
        console.log('🤖 Demo 4: AI Recommendation Engine');
        console.log('===================================');

        // Generate sample normalized data
        const sampleData = this.generateSampleNormalizedData();
        
        // Test different user contexts
        const userContexts = [
            { action: 'buy', condition: 'Near Mint', budget: 500 },
            { action: 'sell', condition: 'Very Fine', timeline: 'immediate' },
            { action: 'research', investmentGoal: 'long-term' }
        ];

        for (const [index, userContext] of userContexts.entries()) {
            console.log(`\n👤 User Scenario ${index + 1}: ${userContext.action.toUpperCase()}`);
            console.log(`Context: ${JSON.stringify(userContext)}\n`);

            const recommendations = await this.recommendationEngine.generateRecommendations(sampleData, userContext);

            console.log(`📊 Generated ${Object.keys(recommendations.comics).length} comic recommendations:`);
            
            Object.entries(recommendations.comics).forEach(([comicKey, comicRec]) => {
                console.log(`\n📖 ${comicKey}:`);
                console.log(`  Overall Confidence: ${Math.round(comicRec.confidence * 100)}%`);
                
                // Show top 2 recommendations
                comicRec.recommendations.slice(0, 2).forEach((rec, recIndex) => {
                    console.log(`  ${recIndex + 1}. ${rec.title} (Priority: ${rec.priority})`);
                    console.log(`     📝 ${rec.description}`);
                    console.log(`     🔍 ${rec.rationale}`);
                    
                    if (rec.data) {
                        if (rec.data.suggestedPrice) console.log(`     💰 Suggested: $${rec.data.suggestedPrice}`);
                        if (rec.data.maxBuyPrice) console.log(`     🛒 Max Buy: $${rec.data.maxBuyPrice}`);
                        if (rec.data.projectedGrowth) {
                            console.log(`     📈 Growth: 1m=${rec.data.projectedGrowth['1_month']}%, 6m=${rec.data.projectedGrowth['6_month']}%`);
                        }
                    }
                });
            });

            // Portfolio recommendations
            if (recommendations.portfolio.recommendations.length > 0) {
                console.log('\n🎯 Portfolio Recommendations:');
                recommendations.portfolio.recommendations.forEach((rec, index) => {
                    console.log(`  ${index + 1}. ${rec.title}: ${rec.description}`);
                });
            }
        }

        console.log('\n' + '='.repeat(50) + '\n');
    }

    async demoUserContextAnalysis() {
        console.log('👥 Demo 5: User Context Analysis');
        console.log('================================');

        const userData = this.generateSampleNormalizedData();
        
        // Simulate different user personas
        const personas = [
            {
                name: 'Collector Sarah',
                context: { action: 'buy', experience: 'intermediate', budget: 1000, focus: 'silver-age' },
                description: 'Intermediate collector focusing on Silver Age comics'
            },
            {
                name: 'Investor Mike',
                context: { action: 'buy', experience: 'expert', budget: 5000, focus: 'investment' },
                description: 'Expert investor looking for high-value opportunities'
            },
            {
                name: 'Seller Janet',
                context: { action: 'sell', experience: 'beginner', timeline: 'flexible' },
                description: 'Beginner looking to sell collection strategically'
            }
        ];

        for (const persona of personas) {
            console.log(`\n👤 Persona: ${persona.name}`);
            console.log(`Description: ${persona.description}`);
            console.log(`Context: ${JSON.stringify(persona.context)}\n`);

            const recommendations = await this.recommendationEngine.generateRecommendations(userData, persona.context);
            
            // Analyze recommendation patterns
            const allRecs = Object.values(recommendations.comics).flatMap(comic => comic.recommendations);
            const actionCounts = {};
            const typeCounts = {};
            
            allRecs.forEach(rec => {
                actionCounts[rec.action] = (actionCounts[rec.action] || 0) + 1;
                typeCounts[rec.type] = (typeCounts[rec.type] || 0) + 1;
            });

            console.log('📊 Recommendation Analysis:');
            console.log(`  • Total recommendations: ${allRecs.length}`);
            console.log(`  • Action breakdown: ${Object.entries(actionCounts).map(([k,v]) => `${k}:${v}`).join(', ')}`);
            console.log(`  • Type breakdown: ${Object.entries(typeCounts).map(([k,v]) => `${k.replace('_',' ')}:${v}`).join(', ')}`);
            
            // Show most relevant recommendation
            const topRec = allRecs.sort((a, b) => b.priority - a.priority)[0];
            if (topRec) {
                console.log(`\n🎯 Top Recommendation for ${persona.name}:`);
                console.log(`  ${topRec.title}: ${topRec.description}`);
                console.log(`  Confidence: ${Math.round(topRec.confidence * 100)}%, Priority: ${topRec.priority}/10`);
            }
        }

        console.log('\n' + '='.repeat(50) + '\n');
    }

    async demoPortfolioAnalysis() {
        console.log('📊 Demo 6: Portfolio Analysis');
        console.log('=============================');

        // Simulate a portfolio of multiple comics
        const portfolioComics = [
            'marvel-amazing-spider-man-001',
            'dc-batman-001',
            'marvel-x-men-001',
            'dc-superman-001',
            'marvel-incredible-hulk-181'
        ];

        console.log(`📚 Analyzing portfolio of ${portfolioComics.length} comics:\n`);

        const portfolioData = {};
        
        // Generate analysis for each comic in portfolio
        for (const comicKey of portfolioComics) {
            const mockData = this.generateMockAnalysisForComic(comicKey);
            portfolioData[comicKey] = mockData;
            
            console.log(`📖 ${comicKey}:`);
            console.log(`  • Current Value: $${mockData.data.statistics.median}`);
            console.log(`  • Trend: ${mockData.data.trends.direction} (${mockData.data.trends.slope > 0 ? '+' : ''}${mockData.data.trends.slope}%)`);
            console.log(`  • Risk Level: ${mockData.data.statistics.coefficientOfVariation > 0.5 ? 'High' : mockData.data.statistics.coefficientOfVariation > 0.3 ? 'Medium' : 'Low'}`);
        }

        // Generate portfolio-level recommendations
        const recommendations = await this.recommendationEngine.generateRecommendations(portfolioData, {
            action: 'portfolio_management',
            diversification: true,
            riskTolerance: 'moderate'
        });

        console.log('\n🎯 Portfolio-Level Insights:');
        console.log(`  • Total portfolio comics: ${Object.keys(portfolioData).length}`);
        console.log(`  • Average confidence: ${Math.round(recommendations.portfolio.summary.averageConfidence * 100)}%`);
        console.log(`  • Risk profile: ${recommendations.portfolio.riskProfile}`);

        // Calculate portfolio metrics
        const totalValue = Object.values(portfolioData).reduce((sum, comic) => 
            sum + (comic.data ? comic.data.statistics.median : 0), 0);
        const avgVolatility = Object.values(portfolioData).reduce((sum, comic) => 
            sum + (comic.data ? comic.data.statistics.coefficientOfVariation : 0), 0) / Object.keys(portfolioData).length;

        console.log(`  • Estimated total value: $${Math.round(totalValue)}`);
        console.log(`  • Average volatility: ${Math.round(avgVolatility * 100)}%`);

        // Show portfolio recommendations
        if (recommendations.portfolio.recommendations.length > 0) {
            console.log('\n📋 Portfolio Recommendations:');
            recommendations.portfolio.recommendations.forEach((rec, index) => {
                console.log(`  ${index + 1}. ${rec.title}`);
                console.log(`     ${rec.description}`);
            });
        }

        console.log('\n' + '='.repeat(50) + '\n');
    }

    // Helper methods to generate sample data

    generateSampleMarketplaceData() {
        return {
            ebay: [
                { title: 'Amazing Spider-Man #1', price: 125.50, condition: 'Very Fine', grade: null, scrapedAt: new Date() },
                { title: 'Amazing Spider-Man #1', price: 89.99, condition: 'Fine', grade: null, scrapedAt: new Date() },
                { title: 'Amazing Spider-Man #1 CGC 9.2', price: 450.00, condition: 'Near Mint', grade: 9.2, scrapedAt: new Date() }
            ],
            whatnot: [
                { title: 'Amazing Spider-Man #1', price: 110.00, condition: 'Very Fine', grade: null, scrapedAt: new Date() },
                { title: 'Amazing Spider-Man #1', price: 95.00, condition: 'Fine', grade: null, scrapedAt: new Date() }
            ],
            comicconnect: [
                { title: 'Amazing Spider-Man #1 CGC 9.0', price: 380.00, condition: 'Near Mint', grade: 9.0, scrapedAt: new Date() }
            ],
            heritage: [
                { title: 'Amazing Spider-Man #1 CGC 9.4', price: 850.00, condition: 'Near Mint', grade: 9.4, scrapedAt: new Date() }
            ]
        };
    }

    generateDiversePricingData() {
        const titles = ['Amazing Spider-Man #1', 'Batman #1', 'X-Men #1'];
        const conditions = ['Poor', 'Fair', 'Good', 'Very Good', 'Fine', 'Very Fine', 'Near Mint', 'Mint'];
        const marketplaces = ['ebay', 'whatnot', 'comicconnect', 'heritage'];
        
        const data = [];
        
        titles.forEach(title => {
            for (let i = 0; i < 15; i++) {
                const basePrice = title.includes('Batman') ? 200 : title.includes('X-Men') ? 150 : 100;
                const conditionIndex = Math.floor(Math.random() * conditions.length);
                const conditionMultiplier = (conditionIndex + 1) / conditions.length;
                const grade = Math.random() > 0.7 ? (8 + Math.random() * 2) : null;
                
                data.push({
                    title,
                    price: Math.round((basePrice * conditionMultiplier * (0.8 + Math.random() * 0.4)) * 100) / 100,
                    condition: conditions[conditionIndex],
                    grade: grade ? Math.round(grade * 10) / 10 : null,
                    marketplace: marketplaces[Math.floor(Math.random() * marketplaces.length)],
                    scrapedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Random date in last 30 days
                });
            }
        });
        
        return data;
    }

    generateSampleNormalizedData() {
        return {
            'marvel-amazing-spider-man-001': {
                status: 'success',
                data: {
                    statistics: {
                        count: 25,
                        mean: 125.50,
                        median: 115.00,
                        min: 75.00,
                        max: 450.00,
                        standardDeviation: 45.20,
                        coefficientOfVariation: 0.36,
                        percentiles: { p25: 95.00, p75: 150.00, p90: 200.00 }
                    },
                    trends: {
                        direction: 'increasing',
                        slope: 2.5,
                        correlation: 0.72,
                        confidence: 0.8,
                        volatility: 0.15
                    },
                    dataQuality: { score: 0.85, outlierRate: 0.1, marketplaceDiversity: 3 }
                }
            },
            'dc-batman-001': {
                status: 'success',
                data: {
                    statistics: {
                        count: 18,
                        mean: 285.75,
                        median: 275.00,
                        min: 150.00,
                        max: 850.00,
                        standardDeviation: 125.60,
                        coefficientOfVariation: 0.44,
                        percentiles: { p25: 200.00, p75: 350.00, p90: 500.00 }
                    },
                    trends: {
                        direction: 'stable',
                        slope: 0.5,
                        correlation: 0.25,
                        confidence: 0.4,
                        volatility: 0.22
                    },
                    dataQuality: { score: 0.75, outlierRate: 0.15, marketplaceDiversity: 2 }
                }
            }
        };
    }

    generateMockAnalysisForComic(comicKey) {
        const basePrice = Math.random() * 400 + 100;
        const volatility = Math.random() * 0.5 + 0.1;
        const trend = (Math.random() - 0.5) * 10; // -5% to +5%
        
        return {
            status: 'success',
            data: {
                statistics: {
                    count: Math.floor(Math.random() * 20 + 10),
                    mean: Math.round(basePrice * 100) / 100,
                    median: Math.round(basePrice * 0.95 * 100) / 100,
                    min: Math.round(basePrice * 0.6 * 100) / 100,
                    max: Math.round(basePrice * 1.8 * 100) / 100,
                    standardDeviation: Math.round(basePrice * volatility * 100) / 100,
                    coefficientOfVariation: Math.round(volatility * 100) / 100
                },
                trends: {
                    direction: trend > 1 ? 'increasing' : trend < -1 ? 'decreasing' : 'stable',
                    slope: Math.round(trend * 100) / 100,
                    confidence: Math.random() * 0.4 + 0.5,
                    volatility: Math.round(volatility * 100) / 100
                },
                dataQuality: {
                    score: Math.random() * 0.3 + 0.6,
                    outlierRate: Math.random() * 0.2,
                    marketplaceDiversity: Math.floor(Math.random() * 3 + 2)
                }
            }
        };
    }
}

// Run the demo
async function runDemo() {
    const demo = new ComicCompDemo();
    await demo.runComprehensiveDemo();
}

// Export for use as module or run directly
if (require.main === module) {
    runDemo().catch(console.error);
}

module.exports = ComicCompDemo; 