const DataCollectionService = require('../services/DataCollectionService');
const config = require('../config');

async function runScraperTest() {
    console.log('Starting scraper test...');
    const dataCollectionService = new DataCollectionService(config);

    const testQuery = 'Amazing Spider-Man #1';

    try {
        console.log(`
--- Testing MyComicShop Scraper ---`);
        const myComicShopListings = await dataCollectionService.scrapers.mycomicshop.searchComics(testQuery);
        console.log(`MyComicShop found: ${myComicShopListings.length} listings`);
        if (myComicShopListings.length > 0) {
            console.log('Sample MyComicShop listing:', myComicShopListings[0]);
        }

        console.log(`
--- Testing Amazon Scraper (Placeholder) ---`);
        const amazonListings = await dataCollectionService.scrapers.amazon.searchComics(testQuery);
        console.log(`Amazon found: ${amazonListings.length} listings (expected 0 for placeholder)`);

        console.log('Scraper test completed successfully.');
    } catch (error) {
        console.error('Scraper test failed:', error);
    }
}

runScraperTest();
