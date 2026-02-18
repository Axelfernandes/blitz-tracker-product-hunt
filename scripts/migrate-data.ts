import { generateClient } from 'aws-amplify/data';
import { Amplify } from 'aws-amplify';
import type { Schema } from '@/amplify/data/resource';
import Papa from 'papaparse';
import fs from 'fs';
import path from 'path';

// ============================================
// 1. CONFIGURATION SECTION
// ============================================
// Map your CSV headers (keys) to the Amplify Schema fields (values).
// If your CSV header is different, change the KEY (left side).
const CSV_MAPPING = {
    // CSV Header       // Schema Field
    'name': 'name',
    'tagline': 'tagline',
    'description': 'description',
    'phId': 'phId',
    'thumbnailUrl': 'thumbnailUrl',
    'upvotes': 'upvotes',
    'launchDate': 'launchDate',
    'speedScore': 'speedScore',
    'marketScore': 'marketScore',
    'pmfScore': 'pmfScore',
    'networkScore': 'networkScore',
    'growthScore': 'growthScore',
    'uncertaintyScore': 'uncertaintyScore',
    'score': 'score',
    'scoreExplanation': 'scoreExplanation'
};

const CSV_FILE_PATH = path.join(process.cwd(), 'data', 'results_2-16-2026.csv');
const BATCH_SIZE = 10; // Number of records to process in parallel
const CLEAR_EXISTING = false; // Set to true to delete all existing products before migrating

// ============================================
// 2. SETUP & UTILS
// ============================================

// Configure Amplify
try {
    const outputs = require('../amplify_outputs.json');
    Amplify.configure(outputs);
} catch (e) {
    console.error("❌ Could not load amplify_outputs.json. Make sure you have deployed the backend or pulled the config.");
    process.exit(1);
}

const client = generateClient<Schema>();

async function clearExistingProducts() {
    console.log("🗑️  Clearing existing products...");
    let hasMore = true;
    let lastCursor: string | undefined;
    let deleted = 0;

    while (hasMore) {
        const { data: items, nextToken } = await client.models.Product.list({
            limit: 100,
            nextToken: lastCursor
        });

        if (items.length > 0) {
            const deletePromises = items.map(item => 
                client.models.Product.delete({ id: item.id })
            );
            await Promise.all(deletePromises);
            deleted += items.length;
            console.log(`   Deleted ${deleted} products...`);
        }

        lastCursor = nextToken || undefined;
        hasMore = !!nextToken;
    }
    console.log(`✅ Cleared ${deleted} products.`);
}

async function getAllProducts(): Promise<Map<string, any>> {
    const productMap = new Map();
    let lastToken: string | undefined;
    
    while (true) {
        const { data: items, nextToken } = await client.models.Product.list({
            limit: 100,
            nextToken: lastToken
        });
        
        items.forEach(p => {
            if (p.phId) productMap.set(p.phId, p);
        });
        
        if (!nextToken) break;
        lastToken = nextToken;
    }
    
    return productMap;
}

// ============================================
// 3. MIGRATION LOGIC
// ============================================

async function migrate() {
    console.log("🚀 Starting Data Migration...");
    console.log(`📂 Reading CSV from: ${CSV_FILE_PATH}`);

    let existingProducts = new Map();

    if (CLEAR_EXISTING) {
        await clearExistingProducts();
    } else {
        // Load existing products for deduplication
        existingProducts = await getAllProducts();
    }
    console.log(`📊 Found ${existingProducts.size} existing products.`);

    if (!fs.existsSync(CSV_FILE_PATH)) {
        console.error(`❌ File not found: ${CSV_FILE_PATH}`);
        process.exit(1);
    }

    const fileContent = fs.readFileSync(CSV_FILE_PATH, 'utf8');

    Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
            const rows = results.data as any[];
            console.log(`📊 Found ${rows.length} records to process.`);

            let processed = 0;
            let successes = 0;
            let failures = 0;
            let skipped = 0;

            // Process in batches
            for (let i = 0; i < rows.length; i += BATCH_SIZE) {
                const batch = rows.slice(i, i + BATCH_SIZE);
                const promises = batch.map(async (row) => {
                    try {
                        // Map CSV row to Schema object
                        const record: any = {};

                        for (const [csvHeader, schemaField] of Object.entries(CSV_MAPPING)) {
                            let value = row[csvHeader];

                            if (schemaField === 'upvotes') value = parseInt(value) || 0;
                            if (['score', 'speedScore', 'marketScore', 'pmfScore', 'networkScore', 'growthScore', 'uncertaintyScore'].includes(schemaField)) {
                                value = parseFloat(value) || 0;
                            }

                            if (value !== undefined && value !== '') {
                                record[schemaField] = value;
                            }
                        }

                        // Ensure required fields
                        if (!record.phId) {
                            console.warn(`⚠️  Skipping row missing 'phId':`, row);
                            return;
                        }

                        // Check for existing product by phId (deduplication) - only if not clearing
                        let existing = null;
                        if (!CLEAR_EXISTING && typeof existingProducts !== 'undefined') {
                            existing = existingProducts.get(record.phId);
                        }

                        if (existing) {
                            // Update existing record
                            const { errors } = await client.models.Product.update({
                                id: existing.id,
                                ...record
                            });

                            if (errors) {
                                console.error(`❌ Error updating ${record.name || record.phId}:`, errors);
                                failures++;
                            } else {
                                console.log(`🔄 Updated: ${record.name || record.phId}`);
                                successes++;
                            }
                        } else {
                            // Create new record
                            const { errors } = await client.models.Product.create(record);

                            if (errors) {
                                console.error(`❌ Error creating ${record.name || record.phId}:`, errors);
                                failures++;
                            } else {
                                console.log(`✅ Created: ${record.name || record.phId}`);
                                successes++;
                            }
                        }
                    } catch (err) {
                        console.error(`❌ Exception processing row:`, err);
                        failures++;
                    }
                });

                await Promise.all(promises);
                processed += batch.length;
                console.log(`⏳ Progress: ${Math.min(processed, rows.length)}/${rows.length}`);
            }

            console.log("\n🎉 Migration Complete!");
            console.log(`✅ Successes: ${successes}`);
            console.log(`❌ Failures: ${failures}`);
        }
    });
}

migrate();
