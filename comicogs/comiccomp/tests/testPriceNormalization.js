const PriceNormalizationEngine = require('../services/PriceNormalizationEngine');

function runPriceNormalizationTest() {
    console.log('Starting Price Normalization Engine test...');

    const engine = new PriceNormalizationEngine();

    const rawData = [
        // Valid listings
        {
            id: '1', title: 'Amazing Spider-Man #1', price: 100, marketplace: 'ebay', scrapedAt: new Date(),
            imageUrl: 'http://example.com/img1.jpg', seller: { feedbackScore: 200, positiveFeedbackPercent: 98 },
            condition: 'Near Mint', grade: null, variant_type: 'base', url: 'http://example.com/1', sale_type: 'fixed'
        },
        {
            id: '2', title: 'Amazing Spider-Man #1', price: 90, marketplace: 'whatnot', scrapedAt: new Date(Date.now() - 86400000),
            imageUrl: 'http://example.com/img2.jpg', seller: { feedbackScore: 150, positiveFeedbackPercent: 96 },
            condition: 'Very Fine', grade: null, variant_type: 'base', url: 'http://example.com/2', sale_type: 'auction'
        },
        {
            id: '3', title: 'Amazing Spider-Man #1', price: 200, marketplace: 'comicconnect', scrapedAt: new Date(Date.now() - 2 * 86400000),
            imageUrl: 'http://example.com/img3.jpg', seller: { feedbackScore: 500, positiveFeedbackPercent: 99 },
            condition: 'CGC 9.8', grade: 9.8, gradingService: 'CGC', variant_type: 'base', url: 'http://example.com/3', sale_type: 'auction'
        },
        {
            id: '4', title: 'Amazing Spider-Man #1', price: 80, marketplace: 'ebay', scrapedAt: new Date(Date.now() - 3 * 86400000),
            imageUrl: 'http://example.com/img4.jpg', seller: { feedbackScore: 120, positiveFeedbackPercent: 97 },
            condition: 'Fine', grade: null, variant_type: 'variant_a', url: 'http://example.com/4', sale_type: 'fixed'
        },
        {
            id: '5', title: 'Amazing Spider-Man #1', price: 110, marketplace: 'ebay', scrapedAt: new Date(),
            imageUrl: 'http://example.com/img5.jpg', seller: { feedbackScore: 250, positiveFeedbackPercent: 99 },
            condition: 'Near Mint', grade: null, variant_type: 'base', url: 'http://example.com/5', sale_type: 'fixed'
        },
        // Invalid listings
        {
            id: '6', title: 'Bad Listing', price: 0, marketplace: 'ebay', scrapedAt: new Date(),
            imageUrl: 'http://example.com/img6.jpg', seller: { feedbackScore: 200, positiveFeedbackPercent: 98 },
            condition: 'Near Mint', grade: null, variant_type: 'base', url: 'http://example.com/6'
        }, // Price 0
        {
            id: '7', title: 'Bad Seller', price: 50, marketplace: 'ebay', scrapedAt: new Date(),
            imageUrl: 'http://example.com/img7.jpg', seller: { feedbackScore: 50, positiveFeedbackPercent: 80 },
            condition: 'Near Mint', grade: null, variant_type: 'base', url: 'http://example.com/7'
        }, // Low feedback
        {
            id: '8', title: 'No Image', price: 70, marketplace: 'ebay', scrapedAt: new Date(),
            imageUrl: null, seller: { feedbackScore: 200, positiveFeedbackPercent: 98 },
            condition: 'Near Mint', grade: null, variant_type: 'base', url: 'http://example.com/8'
        }, // No image
    ];

    engine.normalizePricingData(rawData)
        .then(results => {
            console.log('Price Normalization Results:', JSON.stringify(results, null, 2));
            console.log('Keys in results object:', Object.keys(results));
            
            // Assertions
            const asm1BaseKey = 'unknown-amazing-spiderman-001-base';
            const asm1VariantAKey = 'unknown-amazing-spiderman-001-varianta';

            console.log('Checking asm1BaseKey:', asm1BaseKey);
            console.log('Value of results[asm1BaseKey]:', results[asm1BaseKey]);

            if (results[asm1BaseKey] && results[asm1BaseKey].status === 'success' && results[asm1BaseKey].data.fixedPrice && results[asm1BaseKey].data.auction) {
                console.log('✅ Successfully normalized Amazing Spider-Man #1 (base variant)');
                if (results[asm1BaseKey].data.fixedPrice.filteredListingCount === 2) {
                    console.log('✅ Correct number of fixedPrice listings processed for base variant');
                } else {
                    console.error('❌ Incorrect number of fixedPrice listings for base variant. Expected 2, got ' + results[asm1BaseKey].data.fixedPrice.filteredListingCount);
                }
                if (results[asm1BaseKey].data.auction.filteredListingCount === 2) {
                    console.log('✅ Correct number of auction listings processed for base variant');
                } else {
                    console.error('❌ Incorrect number of auction listings for base variant. Expected 2, got ' + results[asm1BaseKey].data.auction.filteredListingCount);
                }
            } else {
                console.error('❌ Failed to normalize Amazing Spider-Man #1 (base variant). Status: ' + (results[asm1BaseKey] ? results[asm1BaseKey].status : 'undefined'));
            }

            console.log('Checking asm1VariantAKey:', asm1VariantAKey);
            console.log('Value of results[asm1VariantAKey]:', results[asm1VariantAKey]);

            if (results[asm1VariantAKey] && results[asm1VariantAKey].status === 'insufficient_data') {
                console.log('✅ Correctly identified Amazing Spider-Man #1 (variant_a) as insufficient data');
            } else {
                console.error('❌ Incorrectly processed Amazing Spider-Man #1 (variant_a)');
            }

            console.log('Price Normalization Engine test completed.');
        })
        .catch(error => {
            console.error('Price Normalization Engine test failed:', error);
        });
}

runPriceNormalizationTest();
