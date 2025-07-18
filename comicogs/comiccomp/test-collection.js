const DataCollectionService = require('./services/DataCollectionService');
const PricingData = require('./models/PricingData');

/**
 * Test script for ComicComp data collection system
 */
async function testComicCompCollection() {
  console.log('🧠 ComicComp Data Collection Test\n');

  try {
    // Step 1: Create database tables
    console.log('📊 Creating ComicComp database tables...');
    await PricingData.createTables();
    console.log('✅ Database tables created successfully\n');

    // Step 2: Initialize data collection service
    console.log('🔧 Initializing Data Collection Service...');
    const collectionService = new DataCollectionService();
    console.log('✅ Service initialized\n');

    // Step 3: Test collection for a popular comic
    console.log('🔍 Testing data collection for "Amazing Spider-Man #1"...');
    
    const testQuery = 'Amazing Spider-Man #1';
    const results = await collectionService.collectComicPricing(testQuery, {
      marketplaces: ['ebay'],
      includeSold: true,
      limit: 10, // Small limit for testing
      comicId: 1 // Assuming comic ID 1 exists
    });

    console.log('\n📋 Collection Results:');
    console.log(`Query: ${results.query}`);
    console.log(`Total Listings: ${results.total_listings}`);
    console.log('Marketplace Results:');
    Object.entries(results.marketplaces).forEach(([marketplace, data]) => {
      console.log(`  ${marketplace}:`);
      console.log(`    Active: ${data.active_listings || 0}`);
      console.log(`    Sold: ${data.sold_listings || 0}`);
      console.log(`    Processed: ${data.processed || 0}`);
      console.log(`    Status: ${data.status}`);
      if (data.error) {
        console.log(`    Error: ${data.error}`);
      }
    });

    if (results.errors.length > 0) {
      console.log('\n⚠️ Errors encountered:');
      results.errors.forEach(error => console.log(`  - ${error}`));
    }

    // Step 4: Test price analysis
    console.log('\n📈 Testing price analysis...');
    const pricingData = await PricingData.getCurrentPricing(1, {
      marketplace: 'ebay',
      limit: 5
    });

    console.log(`Found ${pricingData.length} recent pricing records:`);
    pricingData.forEach(item => {
      console.log(`  - ${item.title}: $${item.price} (${item.condition})`);
    });

    // Step 5: Get collection statistics
    console.log('\n📊 Collection Statistics:');
    const stats = await collectionService.getCollectionStats();
    stats.forEach(stat => {
      console.log(`  ${stat.marketplace}:`);
      console.log(`    Total Listings: ${stat.total_listings}`);
      console.log(`    Unique Comics: ${stat.unique_comics}`);
      console.log(`    Average Price: $${parseFloat(stat.avg_price).toFixed(2)}`);
    });

    console.log('\n🎉 ComicComp test completed successfully!');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

/**
 * Test individual scraper functionality
 */
async function testScraper() {
  console.log('🕷️ Testing eBay Scraper directly...\n');

  try {
    const EbayScraper = require('./services/scrapers/EbayScraper');
    const scraper = new EbayScraper();

    // Test basic search
    console.log('🔍 Searching for "Batman #1"...');
    const searchResults = await scraper.searchComics('Batman #1', {
      limit: 5
    });

    console.log(`Found ${searchResults.length} listings:`);
    searchResults.forEach((listing, index) => {
      console.log(`${index + 1}. ${listing.title}`);
      console.log(`   Price: $${listing.price}`);
      console.log(`   Condition: ${listing.condition}`);
      console.log(`   URL: ${listing.listing_url}`);
      console.log('');
    });

    // Test sold listings
    console.log('📊 Getting sold listings for "Batman #1"...');
    const soldResults = await scraper.getSoldListings('Batman #1', {
      limit: 3,
      days: 30
    });

    console.log(`Found ${soldResults.length} sold listings:`);
    soldResults.forEach((listing, index) => {
      console.log(`${index + 1}. ${listing.title}`);
      console.log(`   Sale Price: $${listing.price}`);
      console.log(`   Sale Date: ${listing.sale_date || 'Unknown'}`);
      console.log(`   Condition: ${listing.condition}`);
      console.log('');
    });

    console.log('✅ Scraper test completed successfully!');

  } catch (error) {
    console.error('❌ Scraper test failed:', error.message);
  }
}

/**
 * Main function to run tests
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--scraper-only')) {
    await testScraper();
  } else if (args.includes('--full')) {
    await testComicCompCollection();
  } else {
    console.log('ComicComp Test Options:');
    console.log('  node test-collection.js --scraper-only  # Test scraper only');
    console.log('  node test-collection.js --full          # Full system test');
    console.log('');
    console.log('Running scraper test by default...\n');
    await testScraper();
  }
}

// Run the tests
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = {
  testComicCompCollection,
  testScraper
}; 