"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const user = await prisma.user.create({
        data: {
            email: 'demo@example.com',
            username: 'demouser',
            name: 'Demo User',
            verified: true,
            role: client_1.Role.USER,
        },
    });
    console.log(`Created user: ${user.name} (${user.email})`);
    const comics = await prisma.comic.createMany({
        data: [
            {
                title: 'The Amazing Spider-Man',
                series: 'The Amazing Spider-Man',
                issue: '1',
                publisher: 'Marvel',
                grade: '9.8',
                format: client_1.Format.SLAB,
                ownerId: user.id,
                coverImage: 'https://i.annihil.us/u/prod/marvel/i/mg/9/90/5a75f640b0325/clean.jpg',
            },
            {
                title: 'The Amazing Spider-Man',
                series: 'The Amazing Spider-Man',
                issue: '2',
                publisher: 'Marvel',
                grade: '9.6',
                format: client_1.Format.SLAB,
                ownerId: user.id,
                coverImage: 'https://i.annihil.us/u/prod/marvel/i/mg/9/90/5a75f640b0325/clean.jpg',
            },
            {
                title: 'The Incredible Hulk',
                series: 'The Incredible Hulk',
                issue: '181',
                publisher: 'Marvel',
                grade: '9.4',
                format: client_1.Format.SLAB,
                ownerId: user.id,
                coverImage: 'https://i.annihil.us/u/prod/marvel/i/mg/9/90/5a75f640b0325/clean.jpg',
            },
            {
                title: 'Batman',
                series: 'Batman',
                issue: '428',
                publisher: 'DC Comics',
                grade: '9.2',
                format: client_1.Format.SLAB,
                ownerId: user.id,
                coverImage: 'https://i.annihil.us/u/prod/marvel/i/mg/9/90/5a75f640b0325/clean.jpg',
            },
            {
                title: 'Uncanny X-Men',
                series: 'Uncanny X-Men',
                issue: '141',
                publisher: 'Marvel',
                grade: '9.0',
                format: client_1.Format.RAW,
                ownerId: user.id,
                coverImage: 'https://i.annihil.us/u/prod/marvel/i/mg/9/90/5a75f640b0325/clean.jpg',
            },
            {
                title: 'Watchmen',
                series: 'Watchmen',
                issue: '1',
                publisher: 'DC Comics',
                grade: '8.5',
                format: client_1.Format.RAW,
                ownerId: user.id,
                coverImage: 'https://i.annihil.us/u/prod/marvel/i/mg/9/90/5a75f640b0325/clean.jpg',
            },
            {
                title: 'Saga',
                series: 'Saga',
                issue: '1',
                publisher: 'Image Comics',
                grade: '9.8',
                format: client_1.Format.SLAB,
                ownerId: user.id,
                coverImage: 'https://i.annihil.us/u/prod/marvel/i/mg/9/90/5a75f640b0325/clean.jpg',
            },
            {
                title: 'The Walking Dead',
                series: 'The Walking Dead',
                issue: '1',
                publisher: 'Image Comics',
                grade: '9.6',
                format: client_1.Format.SLAB,
                ownerId: user.id,
                coverImage: 'https://i.annihil.us/u/prod/marvel/i/mg/9/90/5a75f640b0325/clean.jpg',
            },
            {
                title: 'Spawn',
                series: 'Spawn',
                issue: '1',
                publisher: 'Image Comics',
                grade: '9.4',
                format: client_1.Format.SLAB,
                ownerId: user.id,
                coverImage: 'https://i.annihil.us/u/prod/marvel/i/mg/9/90/5a75f640b0325/clean.jpg',
            },
            {
                title: 'Teenage Mutant Ninja Turtles',
                series: 'Teenage Mutant Ninja Turtles',
                issue: '1',
                publisher: 'Mirage Studios',
                grade: '9.2',
                format: client_1.Format.SLAB,
                ownerId: user.id,
                coverImage: 'https://i.annihil.us/u/prod/marvel/i/mg/9/90/5a75f640b0325/clean.jpg',
            },
            {
                title: 'Cerebus the Aardvark',
                series: 'Cerebus the Aardvark',
                issue: '1',
                publisher: 'Aardvark-Vanaheim',
                grade: '9.0',
                format: client_1.Format.RAW,
                ownerId: user.id,
                coverImage: 'https://i.annihil.us/u/prod/marvel/i/mg/9/90/5a75f640b0325/clean.jpg',
            },
            {
                title: 'Love and Rockets',
                series: 'Love and Rockets',
                issue: '1',
                publisher: 'Fantagraphics',
                grade: '8.5',
                format: client_1.Format.RAW,
                ownerId: user.id,
                coverImage: 'https://i.annihil.us/u/prod/marvel/i/mg/9/90/5a75f640b0325/clean.jpg',
            },
            {
                title: 'Bone',
                series: 'Bone',
                issue: '1',
                publisher: 'Cartoon Books',
                grade: '9.8',
                format: client_1.Format.SLAB,
                ownerId: user.id,
                coverImage: 'https://i.annihil.us/u/prod/marvel/i/mg/9/90/5a75f640b0325/clean.jpg',
            },
            {
                title: 'Strangers in Paradise',
                series: 'Strangers in Paradise',
                issue: '1',
                publisher: 'Abstract Studio',
                grade: '9.6',
                format: client_1.Format.SLAB,
                ownerId: user.id,
                coverImage: 'https://i.annihil.us/u/prod/marvel/i/mg/9/90/5a75f640b0325/clean.jpg',
            },
            {
                title: 'Sandman',
                series: 'Sandman',
                issue: '1',
                publisher: 'DC Comics',
                grade: '9.4',
                format: client_1.Format.SLAB,
                ownerId: user.id,
                coverImage: 'https://i.annihil.us/u/prod/marvel/i/mg/9/90/5a75f640b0325/clean.jpg',
            },
        ],
    });
    console.log(`Created ${comics.count} comics`);
    const createdComics = await prisma.comic.findMany({
        where: {
            ownerId: user.id,
        },
    });
    const listings = await prisma.transaction.createMany({
        data: [
            {
                comicId: createdComics[0].id,
                buyerId: user.id,
                amount: 12000,
                type: 'PURCHASE',
            },
            {
                comicId: createdComics[1].id,
                buyerId: user.id,
                amount: 8000,
                type: 'PURCHASE',
            },
            {
                comicId: createdComics[2].id,
                buyerId: user.id,
                amount: 6000,
                type: 'PURCHASE',
            },
            {
                comicId: createdComics[3].id,
                buyerId: user.id,
                amount: 4000,
                type: 'PURCHASE',
            },
            {
                comicId: createdComics[4].id,
                buyerId: user.id,
                amount: 2000,
                type: 'PURCHASE',
            },
        ],
    });
    console.log(`Created ${listings.count} active listings`);
    const wantlist = await prisma.wishlistItem.createMany({
        data: [
            {
                userId: user.id,
                title: 'Secret Wars',
                issue: '8',
                publisher: 'Marvel',
                priority: client_1.Priority.HIGH,
            },
            {
                userId: user.id,
                title: 'The New Mutants',
                issue: '98',
                publisher: 'Marvel',
                priority: client_1.Priority.MEDIUM,
            },
            {
                userId: user.id,
                title: 'Akira',
                issue: '1',
                publisher: 'Epic Comics',
                priority: client_1.Priority.LOW,
            },
        ],
    });
    console.log(`Created ${wantlist.count} wantlist entries`);
    const userCount = await prisma.user.count();
    const comicCount = await prisma.comic.count();
    const transactionCount = await prisma.transaction.count();
    const wantlistCount = await prisma.wishlistItem.count();
    console.log("\n--- Seed complete ---");
    console.log(`Total users: ${userCount}`);
    console.log(`Total comics: ${comicCount}`);
    console.log(`Total transactions: ${transactionCount}`);
    console.log(`Total wantlist items: ${wantlistCount}`);
}
main()
    .catch(e => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map