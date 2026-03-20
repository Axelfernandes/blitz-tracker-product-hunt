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
const CSV_MAPPING: Record<string, string> = {
  // CSV Header       // Schema Field
  'Name':             'name',
  'Tagline':          'tagline',
  'Description':      'description',
  'URL':              'phId', // We'll extract the ID from the URL if needed
  'Votes':            'upvotes',
  'Date':             'launchDate',
  'SpeedScore':       'speedScore',
  'MarketScore':      'marketScore',
  'PMFScore':         'pmfScore',
  'NetworkScore':     'networkScore',
  'GrowthScore':      'growthScore',
  'UncertaintyScore': 'uncertaintyScore',
  'OverallScore':     'score',
  'ScoreExplanation': 'scoreExplanation'
};

const CSV_FILE_PATH = path.join(process.cwd(), 'data', 'legacy_products.csv');
const BATCH_SIZE = 10; // Number of records to process in parallel

// ============================================
// 2. SETUP & UTILS
// ============================================

// Configure Amplify
// eslint-disable-next-line @typescript-eslint/no-require-imports
const outputs = require('../amplify_outputs.json');
if (!outputs) {
  console.error("❌ Could not load amplify_outputs.json. Make sure you have deployed the backend or pulled the config.");
  process.exit(1);
}
Amplify.configure(outputs);

const client = generateClient<Schema>();

function extractPhId(urlOrId: string): string {
  // If it looks like a URL, extract the last part
  if (urlOrId.includes('producthunt.com/posts/')) {
    const parts = urlOrId.split('/');
    return parts[parts.length - 1];
  }
  return urlOrId;
}

// ============================================
// 3. MIGRATION LOGIC
// ============================================

async function migrate() {
  console.log("🚀 Starting Data Migration...");
  console.log(`📂 Reading CSV from: ${CSV_FILE_PATH}`);

  if (!fs.existsSync(CSV_FILE_PATH)) {
    console.error(`❌ File not found: ${CSV_FILE_PATH}`);
    process.exit(1);
  }

  const fileContent = fs.readFileSync(CSV_FILE_PATH, 'utf8');

  Papa.parse(fileContent, {
    header: true,
    skipEmptyLines: true,
    complete: async (results) => {
      const rows = results.data as Record<string, string>[];
      console.log(`📊 Found ${rows.length} records to process.`);

      let processed = 0;
      let successes = 0;
      let failures = 0;

      // Process in batches
      for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        const batch = rows.slice(i, i + BATCH_SIZE);
        const promises = batch.map(async (row) => {
          try {
            // Map CSV row to Schema object
            const record: Record<string, string | number> = {};
            
            for (const [csvHeader, schemaField] of Object.entries(CSV_MAPPING)) {
              let value: string | number = row[csvHeader];
              
              // Basic transforms
              if (schemaField === 'phId') value = extractPhId(value);
              if (schemaField === 'upvotes') value = parseInt(value as string) || 0;
              if (['score', 'speedScore', 'marketScore', 'pmfScore', 'networkScore', 'growthScore', 'uncertaintyScore'].includes(schemaField)) {
                value = parseFloat(value as string) || 0;
              }

              if (value !== undefined && value !== '') {
                record[schemaField] = value;
              }
            }

            // Ensure required fields
            if (!record.phId) {
               console.warn(`⚠️  Skipping row missing 'phId' (derived from URL):`, row);
               return;
            }

            // Create record
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { errors } = await client.models.Product.create(record as any);
            
            if (errors) {
              console.error(`❌ Error creating ${record.name || record.phId}:`, errors);
              failures++;
            } else {
              console.log(`✅ Created: ${record.name || record.phId}`);
              successes++;
            }
          } catch (err: unknown) {
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
