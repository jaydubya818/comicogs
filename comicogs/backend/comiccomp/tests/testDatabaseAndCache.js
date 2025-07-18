const PricingData = require('../models/PricingData');
const { redisClient } = require('../../../backend/db');

async function runDatabaseAndCacheTest() {
    console.log('Starting Database and Cache test...');

    const testComicId = 99999;
    const testMarketplace = 'test_marketplace';
    const testListingId = 'test_listing_123';
    const testTitle = 'Test Comic #1';
    const testPrice = 10.50;
    const testCondition = 'Near Mint';
    const testGrade = 9.8;
    const testGradingCompany = 'CGC';
    const testSaleType = 'fixed';
    const testSellerInfo = { username: 'test_seller', feedback: 100 };
    const testListingUrl = 'http://test.com/listing/123';
    const testImageUrls = ['http://test.com/img1.jpg'];
    const testDescription = 'A test comic listing.';
    const testSaleDate = new Date();

    try {
        // 1. Test createTables
        console.log('Testing createTables...');
        await PricingData.createTables();
        console.log('✅ createTables successful');

        // 2. Test insertPricingData
        console.log('Testing insertPricingData...');
        const insertedData = await PricingData.insertPricingData({
            comic_id: testComicId,
            marketplace: testMarketplace,
            listing_id: testListingId,
            title: testTitle,
            issue_number: '1',
            variant_type: 'base',
            condition: testCondition,
            grade: testGrade,
            grading_company: testGradingCompany,
            price: testPrice,
            sale_type: testSaleType,
            seller_info: testSellerInfo,
            listing_url: testListingUrl,
            image_urls: testImageUrls,
            description: testDescription,
            sale_date: testSaleDate
        });
        console.log('✅ insertPricingData successful:', insertedData);
        if (!insertedData || !insertedData.id) {
            throw new Error('insertPricingData did not return an ID');
        }

        // 3. Test getCurrentPricing
        console.log('Testing getCurrentPricing...');
        const currentPricing = await PricingData.getCurrentPricing(testComicId, { marketplace: testMarketplace });
        console.log('✅ getCurrentPricing successful:', currentPricing);
        if (currentPricing.length === 0 || currentPricing[0].listing_id !== testListingId) {
            throw new Error('getCurrentPricing did not return the expected data');
        }

        // 4. Test insertPriceHistory (aggregation)
        console.log('Testing insertPriceHistory...');
        await PricingData.insertPriceHistory({
            comic_id: testComicId,
            marketplace: testMarketplace,
            condition: testCondition,
            grade: testGrade,
            avg_price: testPrice,
            min_price: testPrice,
            max_price: testPrice,
            median_price: testPrice,
            sale_count: 1,
            date_period: new Date().toISOString().split('T')[0]
        });
        console.log('✅ insertPriceHistory successful');

        // 5. Test getPriceTrends
        console.log('Testing getPriceTrends...');
        const priceTrends = await PricingData.getPriceTrends(testComicId, { marketplace: testMarketplace });
        console.log('✅ getPriceTrends successful:', priceTrends);
        if (priceTrends.length === 0 || priceTrends[0].marketplace !== testMarketplace) {
            throw new Error('getPriceTrends did not return the expected data');
        }

        // 6. Test Redis caching (simple set/get)
        console.log('Testing Redis caching...');
        const cacheKey = 'test_cache_key';
        const cacheValue = 'test_cache_value';
        await redisClient.set(cacheKey, cacheValue);
        const retrievedValue = await redisClient.get(cacheKey);
        if (retrievedValue === cacheValue) {
            console.log('✅ Redis set/get successful');
        } else {
            throw new Error('Redis set/get failed');
        }

        console.log('Database and Cache test completed successfully.');

    } catch (error) {
        console.error('❌ Database and Cache test failed:', error);
    } finally {
        // Clean up test data (optional, but good practice)
        // await db.query(`DELETE FROM pricing_data WHERE comic_id = ${testComicId}`);
        // await db.query(`DELETE FROM price_history WHERE comic_id = ${testComicId}`);
        redisClient.quit();
    }
}

runDatabaseAndCacheTest();
