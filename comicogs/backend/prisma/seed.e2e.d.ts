export declare function seedTestData(): Promise<{
    users: {
        buyer: {
            email: string;
            id: string;
            createdAt: Date;
            name: string | null;
            image: string | null;
            role: import(".prisma/client").$Enums.Role;
        };
        seller: {
            email: string;
            id: string;
            createdAt: Date;
            name: string | null;
            image: string | null;
            role: import(".prisma/client").$Enums.Role;
        };
        admin: {
            email: string;
            id: string;
            createdAt: Date;
            name: string | null;
            image: string | null;
            role: import(".prisma/client").$Enums.Role;
        };
    };
    comics: {
        spiderman129: {
            series: string;
            issue: string;
            grade: string | null;
            format: string | null;
            id: string;
            price: import("@prisma/client/runtime/library").Decimal | null;
            title: string;
            coverUrl: string | null;
            tags: string[];
            createdAt: Date;
            updatedAt: Date;
        };
        spiderman300: {
            series: string;
            issue: string;
            grade: string | null;
            format: string | null;
            id: string;
            price: import("@prisma/client/runtime/library").Decimal | null;
            title: string;
            coverUrl: string | null;
            tags: string[];
            createdAt: Date;
            updatedAt: Date;
        };
        batman1: {
            series: string;
            issue: string;
            grade: string | null;
            format: string | null;
            id: string;
            price: import("@prisma/client/runtime/library").Decimal | null;
            title: string;
            coverUrl: string | null;
            tags: string[];
            createdAt: Date;
            updatedAt: Date;
        };
    };
    listings: {
        listing1: {
            id: string;
            status: string;
            comicId: string;
            price: import("@prisma/client/runtime/library").Decimal;
            createdAt: Date;
            sellerId: string;
            images: import("@prisma/client/runtime/library").JsonValue | null;
            blur: string | null;
        };
        listing2: {
            id: string;
            status: string;
            comicId: string;
            price: import("@prisma/client/runtime/library").Decimal;
            createdAt: Date;
            sellerId: string;
            images: import("@prisma/client/runtime/library").JsonValue | null;
            blur: string | null;
        };
        listing3: {
            id: string;
            status: string;
            comicId: string;
            price: import("@prisma/client/runtime/library").Decimal;
            createdAt: Date;
            sellerId: string;
            images: import("@prisma/client/runtime/library").JsonValue | null;
            blur: string | null;
        };
    };
}>;
export declare function clearTestData(): Promise<void>;
//# sourceMappingURL=seed.e2e.d.ts.map