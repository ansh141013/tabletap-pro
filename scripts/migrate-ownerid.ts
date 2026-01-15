/**
 * FIRESTORE DATA MIGRATION SCRIPT
 * 
 * Purpose: Backfill ownerId field to all existing documents
 * 
 * This script should be run ONCE after deploying the new multi-tenant architecture.
 * It adds the ownerId field to all documents in collections that need it.
 * 
 * IMPORTANT: Run this from Firebase Functions or Firebase Console
 * 
 * Collections to update:
 * - categories
 * - menuItems
 * - tables
 * - orders
 * - waiterCalls
 */

import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue, QueryDocumentSnapshot } from 'firebase-admin/firestore';

// Initialize Firebase Admin (if not already initialized)
if (!getApps().length) {
    initializeApp();
}

const db = getFirestore();

interface MigrationStats {
    collection: string;
    totalDocuments: number;
    updated: number;
    skipped: number;
    errors: number;
}

/**
 * Main migration function
 */
async function migrateOwnerId() {
    console.log('🚀 Starting ownerId migration...\n');

    const stats: MigrationStats[] = [];

    try {
        // Step 1: Build a map of restaurantId -> ownerId
        console.log('📊 Step 1: Building restaurantId -> ownerId map...');
        const restaurantsSnapshot = await db.collection('restaurants').get();
        const ownerMap = new Map<string, string>();

        restaurantsSnapshot.docs.forEach((doc: QueryDocumentSnapshot) => {
            const data = doc.data();
            if (data.ownerId) {
                ownerMap.set(doc.id, data.ownerId);
                console.log(`  ✓ Restaurant ${doc.id} -> Owner ${data.ownerId}`);
            } else {
                console.warn(`  ⚠️  Restaurant ${doc.id} is missing ownerId!`);
            }
        });

        console.log(`\n✅ Found ${ownerMap.size} restaurants with ownerId\n`);

        // Step 2: Migrate each collection
        const collections = ['categories', 'menuItems', 'tables', 'orders', 'waiterCalls'];

        for (const collectionName of collections) {
            console.log(`\n📦 Migrating collection: ${collectionName}`);
            const collectionStats = await migrateCollection(collectionName, ownerMap);
            stats.push(collectionStats);
        }

        // Step 3: Print summary
        console.log('\n\n═══════════════════════════════════════');
        console.log('📋 MIGRATION SUMMARY');
        console.log('═══════════════════════════════════════\n');

        let totalUpdated = 0;
        let totalSkipped = 0;
        let totalErrors = 0;

        stats.forEach(stat => {
            console.log(`Collection: ${stat.collection}`);
            console.log(`  Total Documents: ${stat.totalDocuments}`);
            console.log(`  ✅ Updated: ${stat.updated}`);
            console.log(`  ⏭️  Skipped: ${stat.skipped}`);
            console.log(`  ❌ Errors: ${stat.errors}`);
            console.log('');

            totalUpdated += stat.updated;
            totalSkipped += stat.skipped;
            totalErrors += stat.errors;
        });

        console.log('═══════════════════════════════════════');
        console.log(`TOTALS:`);
        console.log(`  ✅ Updated: ${totalUpdated}`);
        console.log(`  ⏭️  Skipped: ${totalSkipped}`);
        console.log(`  ❌ Errors: ${totalErrors}`);
        console.log('═══════════════════════════════════════\n');

        if (totalErrors > 0) {
            console.error('⚠️  Migration completed with errors. Please review logs.');
        } else {
            console.log('✅ Migration completed successfully!');
        }

    } catch (error) {
        console.error('❌ Fatal migration error:', error);
        throw error;
    }
}

/**
 * Migrate a single collection
 */
async function migrateCollection(
    collectionName: string,
    ownerMap: Map<string, string>
): Promise<MigrationStats> {
    const stats: MigrationStats = {
        collection: collectionName,
        totalDocuments: 0,
        updated: 0,
        skipped: 0,
        errors: 0
    };

    try {
        const snapshot = await db.collection(collectionName).get();
        stats.totalDocuments = snapshot.size;

        console.log(`  Found ${stats.totalDocuments} documents`);

        // Process in batches of 500 (Firestore batch limit)
        const batchSize = 500;
        let batch = db.batch();
        let operationsInBatch = 0;

        for (const doc of snapshot.docs) {
            const data = doc.data();

            try {
                // Skip if already has ownerId
                if (data.ownerId) {
                    stats.skipped++;
                    continue;
                }

                // Get ownerId from restaurantId
                const restaurantId = data.restaurantId;
                if (!restaurantId) {
                    console.warn(`  ⚠️  Document ${doc.id} missing restaurantId, skipping`);
                    stats.skipped++;
                    continue;
                }

                const ownerId = ownerMap.get(restaurantId);
                if (!ownerId) {
                    console.warn(`  ⚠️  No ownerId found for restaurantId ${restaurantId}, skipping ${doc.id}`);
                    stats.skipped++;
                    continue;
                }

                // Add to batch
                batch.update(doc.ref, { ownerId });
                operationsInBatch++;
                stats.updated++;

                // Commit batch if we reach the limit
                if (operationsInBatch >= batchSize) {
                    await batch.commit();
                    console.log(`    ✓ Committed batch of ${operationsInBatch} updates`);
                    batch = db.batch();
                    operationsInBatch = 0;
                }

            } catch (error) {
                console.error(`  ❌ Error processing document ${doc.id}:`, error);
                stats.errors++;
            }
        }

        // Commit remaining operations
        if (operationsInBatch > 0) {
            await batch.commit();
            console.log(`    ✓ Committed final batch of ${operationsInBatch} updates`);
        }

        console.log(`  ✅ Completed ${collectionName}: ${stats.updated} updated, ${stats.skipped} skipped, ${stats.errors} errors`);

    } catch (error) {
        console.error(`  ❌ Error migrating collection ${collectionName}:`, error);
        throw error;
    }

    return stats;
}

/**
 * Dry run - preview what would be changed without making changes
 */
async function dryRun() {
    console.log('🔍 DRY RUN MODE - No changes will be made\n');

    const restaurantsSnapshot = await db.collection('restaurants').get();
    const ownerMap = new Map<string, string>();

    restaurantsSnapshot.docs.forEach((doc: QueryDocumentSnapshot) => {
        const data = doc.data();
        if (data.ownerId) {
            ownerMap.set(doc.id, data.ownerId);
        }
    });

    const collections = ['categories', 'menuItems', 'tables', 'orders', 'waiterCalls'];

    for (const collectionName of collections) {
        const snapshot = await db.collection(collectionName).get();
        let needsUpdate = 0;
        let hasOwnerId = 0;
        let missingRestaurantId = 0;

        snapshot.docs.forEach((doc: QueryDocumentSnapshot) => {
            const data = doc.data();
            if (data.ownerId) {
                hasOwnerId++;
            } else if (!data.restaurantId) {
                missingRestaurantId++;
            } else if (ownerMap.has(data.restaurantId)) {
                needsUpdate++;
            }
        });

        console.log(`\n${collectionName}:`);
        console.log(`  Total: ${snapshot.size}`);
        console.log(`  Already has ownerId: ${hasOwnerId}`);
        console.log(`  Needs update: ${needsUpdate}`);
        console.log(`  Missing restaurantId: ${missingRestaurantId}`);
    }
}

// ===================================
// EXECUTION
// ===================================

// Uncomment ONE of these to run:

// DRY RUN (safe - just shows what would happen)
// dryRun().then(() => process.exit(0)).catch(err => {
//   console.error(err);
//   process.exit(1);
// });

// ACTUAL MIGRATION (makes real changes!)
// migrateOwnerId().then(() => process.exit(0)).catch(err => {
//   console.error(err);
//   process.exit(1);
// });

// Export for Firebase Functions
export { migrateOwnerId, dryRun };
