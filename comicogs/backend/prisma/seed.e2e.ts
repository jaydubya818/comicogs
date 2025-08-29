import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function seedTestData() {
  console.log('🌱 Seeding E2E test data...');

  try {
    // Create test users
    const buyer = await prisma.user.upsert({
      where: { email: "buyer@example.com" },
      update: {},
      create: { 
        email: "buyer@example.com", 
        role: "user", 
        name: "Test Buyer",
        profileScore: 85,
      },
    });

    const seller = await prisma.user.upsert({
      where: { email: "seller@example.com" },
      update: {},
      create: { 
        email: "seller@example.com", 
        role: "user", 
        name: "Test Seller", 
        profileScore: 100,
        verified: true,
      },
    });

    const admin = await prisma.user.upsert({
      where: { email: "admin@example.com" },
      update: {},
      create: { 
        email: "admin@example.com", 
        role: "admin", 
        name: "Test Admin",
        profileScore: 100,
        verified: true,
      },
    });

    // Create test comics
    const spiderman129 = await prisma.comic.upsert({
      where: { 
        series_issue: { 
          series: "AMAZING SPIDER-MAN", 
          issue: "129" 
        } 
      },
      update: {},
      create: { 
        series: "AMAZING SPIDER-MAN", 
        issue: "129", 
        title: "The Punisher!",
        publisher: "Marvel Comics",
        year: 1974,
        tags: ["ASM", "key", "first-appearance"],
        coverUrl: "https://example.com/covers/asm129.jpg",
        synopsis: "First appearance of the Punisher"
      },
    });

    const spiderman300 = await prisma.comic.upsert({
      where: { 
        series_issue: { 
          series: "AMAZING SPIDER-MAN", 
          issue: "300" 
        } 
      },
      update: {},
      create: { 
        series: "AMAZING SPIDER-MAN", 
        issue: "300", 
        title: "The Spider and the Symbiote",
        publisher: "Marvel Comics", 
        year: 1988,
        tags: ["ASM", "key", "venom"],
        coverUrl: "https://example.com/covers/asm300.jpg",
        synopsis: "Classic Venom story"
      },
    });

    const batman1 = await prisma.comic.upsert({
      where: { 
        series_issue: { 
          series: "BATMAN", 
          issue: "1" 
        } 
      },
      update: {},
      create: { 
        series: "BATMAN", 
        issue: "1", 
        title: "The Legend of the Batman",
        publisher: "DC Comics",
        year: 1940,
        tags: ["batman", "key", "golden-age"],
        coverUrl: "https://example.com/covers/batman1.jpg",
        synopsis: "The Dark Knight's first solo comic"
      },
    });

    // Create test listings
    const listing1 = await prisma.listing.upsert({
      where: { id: "test-asm129-listing" },
      update: { 
        status: "active",
        price: new prisma.Prisma.Decimal(999.99)
      },
      create: {
        id: "test-asm129-listing",
        sellerId: seller.id,
        comicId: spiderman129.id,
        status: "active",
        price: new prisma.Prisma.Decimal(999.99),
        grade: "CGC 9.6",
        condition: "Near Mint",
        description: "Beautiful copy of ASM #129. First appearance of Punisher!"
      },
    });

    const listing2 = await prisma.listing.upsert({
      where: { id: "test-asm300-listing" },
      update: { 
        status: "active",
        price: new prisma.Prisma.Decimal(450.00)
      },
      create: {
        id: "test-asm300-listing",
        sellerId: seller.id,
        comicId: spiderman300.id,
        status: "active",
        price: new prisma.Prisma.Decimal(450.00),
        grade: "CGC 9.8",
        condition: "Near Mint+",
        description: "Iconic Venom cover in excellent condition"
      },
    });

    const listing3 = await prisma.listing.upsert({
      where: { id: "test-batman1-listing" },
      update: { 
        status: "active",
        price: new prisma.Prisma.Decimal(25000.00)
      },
      create: {
        id: "test-batman1-listing",
        sellerId: seller.id,
        comicId: batman1.id,
        status: "active", 
        price: new prisma.Prisma.Decimal(25000.00),
        grade: "CGC 3.0",
        condition: "Good/Very Good",
        description: "Holy grail Batman #1! Rare opportunity."
      },
    });

    // Create some sample saved searches for testing
    await prisma.savedSearch.upsert({
      where: { id: "test-spider-search" },
      update: {},
      create: {
        id: "test-spider-search",
        userId: buyer.id,
        name: "Spider-Man Keys",
        queryJson: {
          series: "AMAZING SPIDER-MAN",
          tags: ["key"]
        },
        cadence: "weekly"
      },
    });

    // Create sample wantlist items
    await prisma.wantlistItem.upsert({
      where: { 
        userId_comicId: {
          userId: buyer.id,
          comicId: batman1.id
        }
      },
      update: {},
      create: {
        userId: buyer.id,
        comicId: batman1.id,
        maxPrice: new prisma.Prisma.Decimal(20000.00),
        minGrade: "CGC 2.5"
      },
    });

    console.log('✅ E2E test data seeded successfully:', {
      users: { buyer: buyer.email, seller: seller.email, admin: admin.email },
      comics: [spiderman129.series + " #" + spiderman129.issue, spiderman300.series + " #" + spiderman300.issue, batman1.series + " #" + batman1.issue],
      listings: [listing1.id, listing2.id, listing3.id]
    });

    return {
      users: { buyer, seller, admin },
      comics: { spiderman129, spiderman300, batman1 },
      listings: { listing1, listing2, listing3 }
    };

  } catch (error) {
    console.error('❌ Error seeding E2E test data:', error);
    throw error;
  }
}

export async function clearTestData() {
  console.log('🧹 Clearing E2E test data...');

  try {
    // Clear in order due to foreign key constraints
    await prisma.order.deleteMany({
      where: {
        OR: [
          { buyerId: { in: await getUserIds() } },
          { listing: { sellerId: { in: await getUserIds() } } }
        ]
      }
    });

    await prisma.wantlistItem.deleteMany({
      where: { userId: { in: await getUserIds() } }
    });

    await prisma.savedSearch.deleteMany({
      where: { userId: { in: await getUserIds() } }
    });

    await prisma.listing.deleteMany({
      where: { sellerId: { in: await getUserIds() } }
    });

    await prisma.comic.deleteMany({
      where: {
        series: { in: ["AMAZING SPIDER-MAN", "BATMAN"] }
      }
    });

    await prisma.user.deleteMany({
      where: {
        email: { in: ["buyer@example.com", "seller@example.com", "admin@example.com"] }
      }
    });

    console.log('✅ E2E test data cleared successfully');

  } catch (error) {
    console.error('❌ Error clearing E2E test data:', error);
    throw error;
  }
}

async function getUserIds(): Promise<string[]> {
  const users = await prisma.user.findMany({
    where: {
      email: { in: ["buyer@example.com", "seller@example.com", "admin@example.com"] }
    },
    select: { id: true }
  });
  return users.map(u => u.id);
}

// Run if called directly
async function main() {
  const command = process.argv[2];
  
  if (command === 'clear') {
    await clearTestData();
  } else {
    await seedTestData();
  }
}

if (require.main === module) {
  main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
}
