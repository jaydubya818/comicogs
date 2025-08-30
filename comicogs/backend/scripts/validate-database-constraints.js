#!/usr/bin/env node

/**
 * Database Constraint Validation Script
 * 
 * Validates database integrity constraints, checks for data consistency,
 * and ensures all foreign key relationships are properly maintained.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class DatabaseValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.stats = {
      totalChecks: 0,
      passed: 0,
      failed: 0,
      warnings: 0
    };
  }

  async validateAll() {
    console.log('🔍 Starting database constraint validation...\n');

    await this.validateUserConstraints();
    await this.validateComicConstraints();
    await this.validateListingConstraints();
    await this.validateOrderConstraints();
    await this.validateCollectionConstraints();
    await this.validateReportConstraints();
    await this.validateDataIntegrity();
    await this.validateBusinessRules();

    this.printResults();
  }

  async validateUserConstraints() {
    console.log('👤 Validating User constraints...');

    // Check for duplicate emails
    const duplicateEmails = await prisma.$queryRaw`
      SELECT email, COUNT(*) as count 
      FROM users 
      GROUP BY email 
      HAVING COUNT(*) > 1
    `;
    
    this.check(
      duplicateEmails.length === 0,
      'No duplicate emails found',
      `Found ${duplicateEmails.length} duplicate emails: ${duplicateEmails.map(d => d.email).join(', ')}`
    );

    // Check for users with invalid roles
    const invalidRoles = await prisma.user.findMany({
      where: {
        role: {
          notIn: ['user', 'seller', 'admin']
        }
      }
    });

    this.check(
      invalidRoles.length === 0,
      'All users have valid roles',
      `Found ${invalidRoles.length} users with invalid roles`
    );

    // Check suspended users don't have active listings
    const suspendedUsersWithActiveListings = await prisma.user.findMany({
      where: {
        suspended: true,
        listings: {
          some: {
            status: 'active'
          }
        }
      },
      include: {
        listings: {
          where: {
            status: 'active'
          }
        }
      }
    });

    this.check(
      suspendedUsersWithActiveListings.length === 0,
      'No suspended users have active listings',
      `Found ${suspendedUsersWithActiveListings.length} suspended users with active listings`
    );
  }

  async validateComicConstraints() {
    console.log('📚 Validating Comic constraints...');

    // Check for duplicate comics (same series, issue, variant)
    const duplicateComics = await prisma.$queryRaw`
      SELECT series, issue, variant, COUNT(*) as count 
      FROM comics 
      GROUP BY series, issue, COALESCE(variant, '') 
      HAVING COUNT(*) > 1
    `;

    this.check(
      duplicateComics.length === 0,
      'No duplicate comics found',
      `Found ${duplicateComics.length} duplicate comics`
    );

    // Check for comics with invalid years
    const invalidYearComics = await prisma.comic.findMany({
      where: {
        year: {
          OR: [
            { lt: 1930 }, // Comics didn't exist before 1930
            { gt: new Date().getFullYear() + 5 } // Future releases shouldn't be more than 5 years ahead
          ]
        }
      }
    });

    this.check(
      invalidYearComics.length === 0,
      'All comics have valid years',
      `Found ${invalidYearComics.length} comics with invalid years`
    );

    // Check for negative estimated prices
    const negativePrice = await prisma.comic.findMany({
      where: {
        estimatedPrice: {
          lt: 0
        }
      }
    });

    this.check(
      negativePrice.length === 0,
      'No comics with negative estimated prices',
      `Found ${negativePrice.length} comics with negative estimated prices`
    );
  }

  async validateListingConstraints() {
    console.log('🏪 Validating Listing constraints...');

    // Check for negative prices
    const negativeListingPrices = await prisma.listing.findMany({
      where: {
        price: {
          lt: 0
        }
      }
    });

    this.check(
      negativeListingPrices.length === 0,
      'No listings with negative prices',
      `Found ${negativeListingPrices.length} listings with negative prices`
    );

    // Check for expired active listings
    const expiredActiveListings = await prisma.listing.findMany({
      where: {
        status: 'active',
        expiresAt: {
          lt: new Date()
        }
      }
    });

    this.check(
      expiredActiveListings.length === 0,
      'No expired active listings',
      `Found ${expiredActiveListings.length} expired active listings that should be updated`
    );

    // Check sold listings have soldAt timestamp
    const soldWithoutTimestamp = await prisma.listing.findMany({
      where: {
        status: 'sold',
        soldAt: null
      }
    });

    this.warn(
      soldWithoutTimestamp.length === 0,
      'All sold listings have soldAt timestamp',
      `Found ${soldWithoutTimestamp.length} sold listings without soldAt timestamp`
    );

    // Check for listings by suspended users
    const listingsBySuspendedUsers = await prisma.listing.findMany({
      where: {
        seller: {
          suspended: true
        },
        status: {
          in: ['active', 'draft']
        }
      },
      include: {
        seller: true
      }
    });

    this.check(
      listingsBySuspendedUsers.length === 0,
      'No active/draft listings by suspended users',
      `Found ${listingsBySuspendedUsers.length} active/draft listings by suspended users`
    );
  }

  async validateOrderConstraints() {
    console.log('📦 Validating Order constraints...');

    // Check for negative amounts
    const negativeAmounts = await prisma.order.findMany({
      where: {
        amount: {
          lt: 0
        }
      }
    });

    this.check(
      negativeAmounts.length === 0,
      'No orders with negative amounts',
      `Found ${negativeAmounts.length} orders with negative amounts`
    );

    // Check paid orders have listing status as sold
    const paidOrdersWithActiveListing = await prisma.order.findMany({
      where: {
        status: 'paid',
        listing: {
          status: {
            not: 'sold'
          }
        }
      },
      include: {
        listing: true
      }
    });

    this.check(
      paidOrdersWithActiveListing.length === 0,
      'All paid orders have corresponding sold listings',
      `Found ${paidOrdersWithActiveListing.length} paid orders with non-sold listings`
    );

    // Check for orders where refund amount exceeds original amount
    const invalidRefunds = await prisma.order.findMany({
      where: {
        refundAmount: {
          gt: prisma.order.fields.amount
        }
      }
    });

    this.check(
      invalidRefunds.length === 0,
      'No orders with refund amount exceeding original amount',
      `Found ${invalidRefunds.length} orders with invalid refund amounts`
    );

    // Check shipped orders have tracking numbers
    const shippedWithoutTracking = await prisma.order.findMany({
      where: {
        shippedAt: {
          not: null
        },
        trackingNumber: null
      }
    });

    this.warn(
      shippedWithoutTracking.length === 0,
      'All shipped orders have tracking numbers',
      `Found ${shippedWithoutTracking.length} shipped orders without tracking numbers`
    );
  }

  async validateCollectionConstraints() {
    console.log('📖 Validating Collection constraints...');

    // Check for negative paid prices
    const negativePaidPrices = await prisma.collectionItem.findMany({
      where: {
        paidPrice: {
          lt: 0
        }
      }
    });

    this.check(
      negativePaidPrices.length === 0,
      'No collection items with negative paid prices',
      `Found ${negativePaidPrices.length} collection items with negative paid prices`
    );

    // Check for items marked for sale but user isn't a seller
    const nonSellerItemsForSale = await prisma.collectionItem.findMany({
      where: {
        forSale: true,
        user: {
          role: 'user' // Only users with 'user' role, not 'seller' or 'admin'
        }
      },
      include: {
        user: true
      }
    });

    this.warn(
      nonSellerItemsForSale.length === 0,
      'All items marked for sale belong to sellers',
      `Found ${nonSellerItemsForSale.length} collection items marked for sale by non-sellers`
    );
  }

  async validateReportConstraints() {
    console.log('🚨 Validating Report constraints...');

    // Check for reports on non-existent listings
    const reportsOnDeletedListings = await prisma.report.findMany({
      where: {
        listing: null
      }
    });

    this.check(
      reportsOnDeletedListings.length === 0,
      'No reports on deleted listings',
      `Found ${reportsOnDeletedListings.length} reports referencing deleted listings`
    );

    // Check for old open reports (older than 30 days)
    const oldOpenReports = await prisma.report.findMany({
      where: {
        status: 'open',
        createdAt: {
          lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
        }
      }
    });

    this.warn(
      oldOpenReports.length === 0,
      'No old open reports found',
      `Found ${oldOpenReports.length} open reports older than 30 days`
    );
  }

  async validateDataIntegrity() {
    console.log('🔗 Validating Data Integrity...');

    // Check for orphaned collection items
    const orphanedCollectionItems = await prisma.$queryRaw`
      SELECT ci.id 
      FROM collection_items ci 
      LEFT JOIN users u ON ci.userId = u.id 
      LEFT JOIN comics c ON ci.comicId = c.id 
      WHERE u.id IS NULL OR c.id IS NULL
    `;

    this.check(
      orphanedCollectionItems.length === 0,
      'No orphaned collection items',
      `Found ${orphanedCollectionItems.length} orphaned collection items`
    );

    // Check for orders without corresponding listings
    const ordersWithoutListings = await prisma.$queryRaw`
      SELECT o.id 
      FROM orders o 
      LEFT JOIN listings l ON o.listingId = l.id 
      WHERE l.id IS NULL
    `;

    this.check(
      ordersWithoutListings.length === 0,
      'No orders without corresponding listings',
      `Found ${ordersWithoutListings.length} orders without corresponding listings`
    );

    // Check session cleanup - expired sessions should be cleaned up
    const expiredSessions = await prisma.userSession.findMany({
      where: {
        expiresAt: {
          lt: new Date()
        }
      }
    });

    this.warn(
      expiredSessions.length < 100, // Allow some expired sessions, but warn if too many
      'Reasonable number of expired sessions',
      `Found ${expiredSessions.length} expired sessions - consider cleanup`
    );
  }

  async validateBusinessRules() {
    console.log('💼 Validating Business Rules...');

    // Check for users buying their own items
    const selfPurchases = await prisma.order.findMany({
      where: {
        buyer: {
          id: {
            equals: prisma.order.fields.listing.references.seller.references.id
          }
        }
      },
      include: {
        buyer: true,
        listing: {
          include: {
            seller: true
          }
        }
      }
    });

    // Manual check since Prisma doesn't support complex joins in where clauses easily
    const actualSelfPurchases = [];
    for (const order of await prisma.order.findMany({
      include: {
        buyer: true,
        listing: {
          include: {
            seller: true
          }
        }
      }
    })) {
      if (order.buyer.id === order.listing.seller.id) {
        actualSelfPurchases.push(order);
      }
    }

    this.check(
      actualSelfPurchases.length === 0,
      'No users buying their own items',
      `Found ${actualSelfPurchases.length} cases of users buying their own items`
    );

    // Check for unrealistic comic prices (over $100,000)
    const unrealisticPrices = await prisma.listing.findMany({
      where: {
        price: {
          gt: 100000 // $100,000
        }
      }
    });

    this.warn(
      unrealisticPrices.length === 0,
      'No unrealistically priced items',
      `Found ${unrealisticPrices.length} items priced over $100,000 - may need review`
    );
  }

  check(condition, successMessage, errorMessage) {
    this.stats.totalChecks++;
    if (condition) {
      this.stats.passed++;
      console.log(`  ✅ ${successMessage}`);
    } else {
      this.stats.failed++;
      this.errors.push(errorMessage);
      console.log(`  ❌ ${errorMessage}`);
    }
  }

  warn(condition, successMessage, warningMessage) {
    this.stats.totalChecks++;
    if (condition) {
      this.stats.passed++;
      console.log(`  ✅ ${successMessage}`);
    } else {
      this.stats.warnings++;
      this.warnings.push(warningMessage);
      console.log(`  ⚠️  ${warningMessage}`);
    }
  }

  printResults() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 DATABASE VALIDATION RESULTS');
    console.log('='.repeat(60));
    console.log(`Total Checks: ${this.stats.totalChecks}`);
    console.log(`✅ Passed: ${this.stats.passed}`);
    console.log(`❌ Failed: ${this.stats.failed}`);
    console.log(`⚠️  Warnings: ${this.stats.warnings}`);
    
    if (this.errors.length > 0) {
      console.log('\n🚨 CRITICAL ISSUES FOUND:');
      this.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }

    if (this.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      this.warnings.forEach((warning, index) => {
        console.log(`${index + 1}. ${warning}`);
      });
    }

    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log('\n🎉 All database constraints are valid!');
    }

    console.log('\n' + '='.repeat(60));
  }
}

async function main() {
  try {
    const validator = new DatabaseValidator();
    await validator.validateAll();
  } catch (error) {
    console.error('❌ Validation failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

module.exports = { DatabaseValidator };