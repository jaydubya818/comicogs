console.log("🧠 ComicComp Demo");
const DataCollectionService = require("./comiccomp/services/DataCollectionService");
const EbayScraper = require("./comiccomp/services/scrapers/EbayScraper");

async function demo() {
  console.log("1️⃣ Testing eBay Scraper");
  const scraper = new EbayScraper();
  const results = await scraper.searchComics("Batman #1", { limit: 3 });
  console.log(`Found ${results.length} listings:`);
  results.forEach(r => console.log(`  - ${r.title}: $${r.price}`));
  
  console.log("\n2️⃣ Testing Data Collection");
  const service = new DataCollectionService();
  const collection = await service.collectComicPricing("Amazing Spider-Man #1");
  console.log(`Collection result: ${collection.total_listings} listings`);
  
  console.log("\n✅ ComicComp Demo Complete!");
}

demo().catch(console.error);
