import { PrismaClient, Decimal } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Start seeding...');

  // Clear existing data in dependency order (if tables exist)
  console.log('🧹 Clearing existing data...');
  try {
    await prisma.wantItem.deleteMany({});
    await prisma.collectionItem.deleteMany({});
    await prisma.order.deleteMany({});
    await prisma.listing.deleteMany({});
    await prisma.comic.deleteMany({});
    await prisma.user.deleteMany({});
  } catch (error) {
    console.log('⚠️ Some tables may not exist yet, continuing with seeding...');
  }

  // Create demo user (regular user)
  console.log('👤 Creating demo users...');
  const demoUser = await prisma.user.create({
    data: {
      email: 'demo@comicogs.com',
      name: 'Demo Collector',
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo',
      role: 'user',
    },
  });

  // Create seller user
  const sellerUser = await prisma.user.create({
    data: {
      email: 'seller@comicogs.com',
      name: 'Comic Seller',
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=seller',
      role: 'seller',
    },
  });

  // Create admin user
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@comicogs.com',
      name: 'Admin User',
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
      role: 'admin',
    },
  });

  // Create 15 comics with realistic data
  console.log('📚 Creating comics...');
  const comicsData = [
    {
      title: 'The Amazing Spider-Man',
      series: 'The Amazing Spider-Man',
      issue: '1',
      grade: 'CGC 9.4',
      format: 'slab',
      price: new Decimal(15000.00),
      coverUrl: 'https://images.unsplash.com/photo-1588497859490-85d1c17db96d?w=300&h=450&fit=crop',
      tags: ['superhero', 'marvel', 'key-issue', 'silver-age'],
    },
    {
      title: 'X-Men',
      series: 'X-Men',
      issue: '1',
      grade: 'CGC 8.5',
      format: 'slab',
      price: new Decimal(8500.00),
      coverUrl: 'https://images.unsplash.com/photo-1612198188060-c7c2a3b66eae?w=300&h=450&fit=crop',
      tags: ['superhero', 'marvel', 'team', 'silver-age'],
    },
    {
      title: 'Batman',
      series: 'Batman',
      issue: '1',
      grade: 'CGC 7.0',
      format: 'slab',
      price: new Decimal(45000.00),
      coverUrl: 'https://images.unsplash.com/photo-1635805737707-575885ab0820?w=300&h=450&fit=crop',
      tags: ['superhero', 'dc', 'detective', 'golden-age'],
    },
    {
      title: 'Fantastic Four',
      series: 'Fantastic Four',
      issue: '1',
      grade: 'CGC 6.5',
      format: 'slab',
      price: new Decimal(32000.00),
      coverUrl: 'https://images.unsplash.com/photo-1594736797933-d0c6a3f95d04?w=300&h=450&fit=crop',
      tags: ['superhero', 'marvel', 'team', 'silver-age'],
    },
    {
      title: 'The Incredible Hulk',
      series: 'The Incredible Hulk',
      issue: '181',
      grade: 'VF+',
      format: 'raw',
      price: new Decimal(650.00),
      coverUrl: 'https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?w=300&h=450&fit=crop',
      tags: ['superhero', 'marvel', 'key-issue', 'bronze-age'],
    },
    {
      title: 'Saga',
      series: 'Saga',
      issue: '1',
      grade: 'NM',
      format: 'raw',
      price: new Decimal(250.00),
      coverUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=450&fit=crop',
      tags: ['sci-fi', 'fantasy', 'image', 'modern'],
    },
    {
      title: 'Watchmen',
      series: 'Watchmen',
      issue: '1',
      grade: 'VF+',
      format: 'raw',
      price: new Decimal(300.00),
      coverUrl: 'https://images.unsplash.com/photo-1633113093730-3ac14213fd61?w=300&h=450&fit=crop',
      tags: ['superhero', 'dc', 'classic', 'copper-age'],
    },
    {
      title: 'The Walking Dead',
      series: 'The Walking Dead',
      issue: '1',
      grade: 'CGC 9.8',
      format: 'slab',
      price: new Decimal(1200.00),
      coverUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=300&h=450&fit=crop',
      tags: ['horror', 'image', 'zombies', 'modern'],
    },
    {
      title: 'New Mutants',
      series: 'New Mutants',
      issue: '98',
      grade: 'CGC 9.6',
      format: 'slab',
      price: new Decimal(850.00),
      coverUrl: 'https://images.unsplash.com/photo-1601645191163-3fc0d5d64e35?w=300&h=450&fit=crop',
      tags: ['superhero', 'marvel', 'key-issue', 'copper-age'],
    },
    {
      title: 'Giant Size X-Men',
      series: 'Giant Size X-Men',
      issue: '1',
      grade: 'CGC 9.0',
      format: 'slab',
      price: new Decimal(4500.00),
      coverUrl: 'https://images.unsplash.com/photo-1607077364155-3db5a3d7a3f0?w=300&h=450&fit=crop',
      tags: ['superhero', 'marvel', 'key-issue', 'bronze-age'],
    },
    {
      title: 'Iron Fist',
      series: 'Iron Fist',
      issue: '14',
      grade: 'VF',
      format: 'raw',
      price: new Decimal(180.00),
      coverUrl: 'https://images.unsplash.com/photo-1546878636-a3f57c3b8c1f?w=300&h=450&fit=crop',
      tags: ['superhero', 'marvel', 'martial-arts', 'bronze-age'],
    },
    {
      title: 'Spawn',
      series: 'Spawn',
      issue: '1',
      grade: 'CGC 9.8',
      format: 'slab',
      price: new Decimal(400.00),
      coverUrl: 'https://images.unsplash.com/photo-1636633762833-5d1658f1e29b?w=300&h=450&fit=crop',
      tags: ['supernatural', 'image', 'dark', 'modern'],
    },
    {
      title: 'The Sandman',
      series: 'The Sandman',
      issue: '1',
      grade: 'NM+',
      format: 'raw',
      price: new Decimal(320.00),
      coverUrl: 'https://images.unsplash.com/photo-1544716278-e513176f20a5?w=300&h=450&fit=crop',
      tags: ['fantasy', 'dc', 'vertigo', 'modern'],
    },
    {
      title: 'Teenage Mutant Ninja Turtles',
      series: 'Teenage Mutant Ninja Turtles',
      issue: '1',
      grade: 'CGC 8.0',
      format: 'slab',
      price: new Decimal(2800.00),
      coverUrl: 'https://images.unsplash.com/photo-1578468546634-2c2d5d3c7d1d?w=300&h=450&fit=crop',
      tags: ['action', 'mirage', 'key-issue', 'copper-age'],
    },
    {
      title: 'House of Secrets',
      series: 'House of Secrets',
      issue: '92',
      grade: 'VG+',
      format: 'raw',
      price: new Decimal(2200.00),
      coverUrl: 'https://images.unsplash.com/photo-1587396651634-c2ee87a5e0b8?w=300&h=450&fit=crop',
      tags: ['horror', 'dc', 'key-issue', 'bronze-age'],
    },
  ];

  const createdComics = [];
  for (const comicData of comicsData) {
    const comic = await prisma.comic.create({
      data: comicData,
    });
    createdComics.push(comic);
  }

  // Create 5 active listings
  console.log('🏪 Creating active listings...');
  const listingsData = [
    { comicIndex: 0, price: new Decimal(15000.00) }, // Amazing Spider-Man #1
    { comicIndex: 1, price: new Decimal(8500.00) },  // X-Men #1
    { comicIndex: 4, price: new Decimal(650.00) },   // Incredible Hulk #181
    { comicIndex: 8, price: new Decimal(850.00) },   // New Mutants #98
    { comicIndex: 11, price: new Decimal(400.00) },  // Spawn #1
  ];

  for (const listingData of listingsData) {
    await prisma.listing.create({
      data: {
        comicId: createdComics[listingData.comicIndex].id,
        sellerId: sellerUser.id,
        price: listingData.price,
        status: 'active',
      },
    });
  }

  // Add some comics to demo user's collection
  console.log('📖 Adding comics to collection...');
  await prisma.collectionItem.create({
    data: {
      userId: demoUser.id,
      comicId: createdComics[2].id, // Batman #1
      notes: 'Grail comic! Finally found a decent copy at a convention.',
      acquiredAt: new Date('2023-06-15'),
    },
  });

  await prisma.collectionItem.create({
    data: {
      userId: demoUser.id,
      comicId: createdComics[6].id, // Watchmen #1
      notes: 'Great condition, got it at a local comic shop.',
      acquiredAt: new Date('2023-08-20'),
    },
  });

  await prisma.collectionItem.create({
    data: {
      userId: demoUser.id,
      comicId: createdComics[12].id, // The Sandman #1
      notes: 'Love Neil Gaiman\'s work. This is a classic.',
      acquiredAt: new Date('2023-09-10'),
    },
  });

  // Create 3 wantlist entries
  console.log('❤️ Creating wantlist entries...');
  const wantlistData = [
    {
      series: 'Action Comics',
      issue: '1',
      maxPrice: new Decimal(500000.00),
    },
    {
      series: 'Detective Comics',
      issue: '27',
      maxPrice: new Decimal(75000.00),
    },
    {
      series: 'Tales of Suspense',
      issue: '39',
      maxPrice: new Decimal(15000.00),
    },
  ];

  for (const wantData of wantlistData) {
    await prisma.wantItem.create({
      data: {
        userId: demoUser.id,
        ...wantData,
      },
    });
  }

  // Print counts for sanity check
  console.log('\n📊 Seeding completed! Summary:');
  
  const userCount = await prisma.user.count();
  const comicCount = await prisma.comic.count();
  const listingCount = await prisma.listing.count();
  const collectionCount = await prisma.collectionItem.count();
  const wantlistCount = await prisma.wantItem.count();
  
  console.log(`👥 Users: ${userCount}`);
  console.log(`📚 Comics: ${comicCount}`);
  console.log(`🏪 Listings: ${listingCount}`);
  console.log(`📖 Collection Items: ${collectionCount}`);
  console.log(`❤️ Wantlist Items: ${wantlistCount}`);
  
  console.log('\n✅ Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });