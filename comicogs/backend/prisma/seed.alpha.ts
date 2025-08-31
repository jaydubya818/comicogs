import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding alpha database...')

  // Create demo users (matching allowlist)
  const demoUsers = [
    {
      email: 'alpha@comicogs.com',
      name: 'Alpha Tester',
      role: 'admin',
    },
    {
      email: 'demo@comicogs.com', 
      name: 'Demo User',
      role: 'seller',
    },
    {
      email: 'collector@comicogs.com',
      name: 'Comic Collector',
      role: 'user',
    }
  ]

  const users = []
  for (const userData of demoUsers) {
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: userData,
    })
    users.push(user)
    console.log(`✅ Created user: ${user.email}`)
  }

  // Create 15 demo comics
  const demoComics = [
    {
      title: "The Amazing Spider-Man",
      issueNumber: "1",
      series: "The Amazing Spider-Man",
      publisher: "Marvel Comics",
      year: 1963,
      creator: "Stan Lee, Steve Ditko",
      description: "The origin of Spider-Man! Peter Parker gains his spider powers.",
      coverImage: "https://images.unsplash.com/photo-1612198188060-c7c2a3b66eae?w=300&h=450&fit=crop",
      condition: "Fine",
      grade: 6.0,
    },
    {
      title: "X-Men",
      issueNumber: "1", 
      series: "X-Men",
      publisher: "Marvel Comics",
      year: 1963,
      creator: "Stan Lee, Jack Kirby",
      description: "The first appearance of the X-Men superhero team.",
      coverImage: "https://images.unsplash.com/photo-1601645191163-3fc0d5d64e35?w=300&h=450&fit=crop",
      condition: "Very Fine",
      grade: 8.0,
    },
    {
      title: "Batman",
      issueNumber: "1",
      series: "Batman", 
      publisher: "DC Comics",
      year: 1940,
      creator: "Bob Kane, Bill Finger",
      description: "The first solo Batman comic featuring the Joker and Catwoman.",
      coverImage: "https://images.unsplash.com/photo-1635805737707-575885ab0820?w=300&h=450&fit=crop",
      condition: "Good",
      grade: 4.0,
    },
    {
      title: "Action Comics",
      issueNumber: "1",
      series: "Action Comics",
      publisher: "DC Comics", 
      year: 1938,
      creator: "Jerry Siegel, Joe Shuster",
      description: "The first appearance of Superman!",
      coverImage: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&h=450&fit=crop",
      condition: "Poor",
      grade: 1.0,
    },
    {
      title: "Fantastic Four",
      issueNumber: "1",
      series: "Fantastic Four",
      publisher: "Marvel Comics",
      year: 1961,
      creator: "Stan Lee, Jack Kirby", 
      description: "The origin of Marvel's first family.",
      coverImage: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=450&fit=crop",
      condition: "Very Good",
      grade: 5.0,
    },
    {
      title: "The Incredible Hulk",
      issueNumber: "1",
      series: "The Incredible Hulk",
      publisher: "Marvel Comics",
      year: 1962,
      creator: "Stan Lee, Jack Kirby",
      description: "The first appearance of the Hulk.",
      coverImage: "https://images.unsplash.com/photo-1609220136736-443140cffec6?w=300&h=450&fit=crop", 
      condition: "Fine",
      grade: 6.5,
    },
    {
      title: "Tales of Suspense",
      issueNumber: "39",
      series: "Tales of Suspense",
      publisher: "Marvel Comics",
      year: 1963,
      creator: "Stan Lee, Jack Kirby",
      description: "The first appearance of Iron Man!",
      coverImage: "https://images.unsplash.com/photo-1635805737707-575885ab0820?w=300&h=450&fit=crop",
      condition: "Very Fine",
      grade: 8.5,
    },
    {
      title: "The Flash",
      issueNumber: "105",
      series: "The Flash",
      publisher: "DC Comics",
      year: 1959,
      creator: "John Broome, Carmine Infantino",
      description: "The first appearance of Barry Allen as The Flash.",
      coverImage: "https://images.unsplash.com/photo-1612198188060-c7c2a3b66eae?w=300&h=450&fit=crop",
      condition: "Very Good",
      grade: 5.5,
    },
    {
      title: "Green Lantern",
      issueNumber: "76",
      series: "Green Lantern",
      publisher: "DC Comics",
      year: 1970,
      creator: "Dennis O'Neil, Neal Adams",
      description: "The famous Green Lantern/Green Arrow team-up begins.",
      coverImage: "https://images.unsplash.com/photo-1601645191163-3fc0d5d64e35?w=300&h=450&fit=crop",
      condition: "Near Mint",
      grade: 9.2,
    },
    {
      title: "Avengers",
      issueNumber: "1",
      series: "The Avengers",
      publisher: "Marvel Comics",
      year: 1963,
      creator: "Stan Lee, Jack Kirby",
      description: "Earth's Mightiest Heroes assemble for the first time!",
      coverImage: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=450&fit=crop",
      condition: "Fine",
      grade: 6.0,
    },
    {
      title: "Detective Comics",
      issueNumber: "27",
      series: "Detective Comics",
      publisher: "DC Comics",
      year: 1939,
      creator: "Bob Kane, Bill Finger",
      description: "The first appearance of Batman!",
      coverImage: "https://images.unsplash.com/photo-1635805737707-575885ab0820?w=300&h=450&fit=crop",
      condition: "Good",
      grade: 3.5,
    },
    {
      title: "Journey Into Mystery",
      issueNumber: "83",
      series: "Journey Into Mystery",
      publisher: "Marvel Comics",
      year: 1962,
      creator: "Stan Lee, Jack Kirby",
      description: "The first appearance of Thor!",
      coverImage: "https://images.unsplash.com/photo-1609220136736-443140cffec6?w=300&h=450&fit=crop",
      condition: "Very Fine",
      grade: 7.5,
    },
    {
      title: "Showcase",
      issueNumber: "4",
      series: "Showcase",
      publisher: "DC Comics",
      year: 1956,
      creator: "Robert Kanigher, Carmine Infantino",
      description: "The Silver Age Flash debut that started it all.",
      coverImage: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&h=450&fit=crop",
      condition: "Fine",
      grade: 6.5,
    },
    {
      title: "Wonder Woman",
      issueNumber: "1",
      series: "Wonder Woman",
      publisher: "DC Comics",
      year: 1942,
      creator: "William Moulton Marston, Harry G. Peter",
      description: "The Amazon Princess gets her own series!",
      coverImage: "https://images.unsplash.com/photo-1612198188060-c7c2a3b66eae?w=300&h=450&fit=crop",
      condition: "Very Good",
      grade: 5.0,
    },
    {
      title: "Captain America Comics",
      issueNumber: "1",
      series: "Captain America Comics",
      publisher: "Marvel Comics",
      year: 1941,
      creator: "Joe Simon, Jack Kirby",
      description: "The Star-Spangled Man with a Plan debuts!",
      coverImage: "https://images.unsplash.com/photo-1601645191163-3fc0d5d64e35?w=300&h=450&fit=crop",
      condition: "Good",
      grade: 4.5,
    }
  ]

  const comics = []
  for (const comicData of demoComics) {
    const comic = await prisma.comic.create({
      data: comicData,
    })
    comics.push(comic)
    console.log(`✅ Created comic: ${comic.title} #${comic.issueNumber}`)
  }

  // Create sample listings
  const listings = [
    {
      comicId: comics[0].id, // Spider-Man #1
      sellerId: users[1].id,  // Demo User
      price: 25000, // $250.00
      condition: "Fine",
      description: "A great copy of the first Spider-Man comic!",
      isAuction: true,
      auctionEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    },
    {
      comicId: comics[1].id, // X-Men #1  
      sellerId: users[1].id,
      price: 15000, // $150.00
      condition: "Very Fine",
      description: "Beautiful copy of X-Men #1 in excellent condition.",
      isAuction: false,
    },
    {
      comicId: comics[6].id, // Tales of Suspense #39 (Iron Man)
      sellerId: users[2].id,
      price: 18000, // $180.00
      condition: "Very Fine",
      description: "First Iron Man appearance! Key issue.",
      isAuction: true,
      auctionEndDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    }
  ]

  for (const listingData of listings) {
    const listing = await prisma.listing.create({
      data: listingData,
    })
    console.log(`✅ Created listing: $${(listing.price / 100).toFixed(2)}`)
  }

  // Create sample wantlist items
  const wantlistItems = [
    {
      userId: users[2].id, // Comic Collector
      comicId: comics[2].id, // Batman #1
      maxPrice: 50000, // $500.00
      condition: "Good or better",
      notes: "Looking for a decent copy of Batman #1"
    },
    {
      userId: users[2].id,
      comicId: comics[3].id, // Action Comics #1
      maxPrice: 100000, // $1000.00  
      condition: "Any",
      notes: "Holy grail book! Any condition considered."
    }
  ]

  for (const wantlistData of wantlistItems) {
    const wantlist = await prisma.wantlist.create({
      data: wantlistData,
    })
    console.log(`✅ Created wantlist item: ${wantlist.notes}`)
  }

  console.log('🎉 Alpha database seeded successfully!')
  console.log(`📊 Created:`)
  console.log(`   - ${users.length} users`)
  console.log(`   - ${comics.length} comics`)
  console.log(`   - ${listings.length} listings`)
  console.log(`   - ${wantlistItems.length} wantlist items`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Seeding failed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
