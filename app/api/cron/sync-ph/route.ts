import { NextResponse } from 'next/server';
import { fetchDailyProducts } from '@/lib/ph-api';
import { scoreProduct } from '@/lib/gemini';
import { generateClient } from 'aws-amplify/data';
import { Amplify } from 'aws-amplify';
import type { Schema } from '@/amplify/data/resource';

export const dynamic = 'force-dynamic';

export async function GET() {
  const logs: string[] = [];
  const MAX_DURATION_MS = 50 * 1000; // 50 seconds safety buffer
  const startTime = Date.now();

  // 1. Check Environment Variables
  if (!process.env.PH_TOKEN) {
    return NextResponse.json({ error: "PH_TOKEN is missing" }, { status: 500 });
  }
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: "GEMINI_API_KEY is missing" }, { status: 500 });
  }

  // 2. Configure Amplify
  try {
    const outputs = require('@/amplify_outputs.json');
    Amplify.configure(outputs);
  } catch (e: any) {
    return NextResponse.json({
      error: "Amplify configuration missing.",
      detailedError: e.message
    }, { status: 500 });
  }

  const client = generateClient<Schema>({ authMode: 'apiKey' });

  try {
    const products = await fetchDailyProducts();
    const results = [];
    logs.push(`Fetched ${products.length} products from Product Hunt`);

    if (products.length === 0) {
      return NextResponse.json({ success: true, message: "No products found.", logs });
    }

    // 3. Batch Existence Check
    // optimization: get all existing IDs first to avoid N database calls
    // Note: In a massive scale app, we'd filter by the specific IDs we just fetched,
    // but here fetching all (or a large limit) is fine for now, or we rely on the specific check if listing is too big.
    // For now, let's fetch products created in the last 2 days or just list plenty.
    // Actually, list() has default limit 100. Let's try to get enough to cover overlaps.
    const { data: existingData } = await client.models.Product.list({ limit: 1000 });
    const existingIds = new Set(existingData.map(p => p.phId));

    // Filter down to only NEW products
    const newProducts = products.filter(p => !existingIds.has(p.id));
    const alreadyExistsCount = products.length - newProducts.length;

    logs.push(`Skipped ${alreadyExistsCount} existing products.`);
    logs.push(`Processing ${newProducts.length} new products...`);

    for (const p of newProducts) {
      // Timeout check
      if (Date.now() - startTime > MAX_DURATION_MS) {
        logs.push("WARNING: Time limit reached. Stopping partial sync.");
        break;
      }

      try {
        // Score
        const score = await scoreProduct(p.name, p.tagline, p.description || "");

        if (score) {
          // Save
          const { data: created, errors: createErrors } = await client.models.Product.create({
            phId: p.id,
            name: p.name,
            tagline: p.tagline,
            description: p.description,
            thumbnailUrl: p.thumbnail.url,
            launchDate: p.createdAt,
            upvotes: p.votesCount,
            score: score.overallScore,
            speedScore: score.speedScore,
            marketScore: score.marketScore,
            pmfScore: score.pmfScore,
            networkScore: score.networkScore,
            growthScore: score.growthScore,
            uncertaintyScore: score.uncertaintyScore,
            scoreExplanation: score.explanation
          });

          if (createErrors && createErrors.length > 0) {
            logs.push(`Save failed for ${p.name}: ${JSON.stringify(createErrors)}`);
          } else {
            results.push({ name: p.name, status: 'scored' });
            logs.push(`Saved ${p.name}`);
          }

          // Delay for Gemini free tier RPM (only for new saves)
          await new Promise(r => setTimeout(r, 4000));
        }
      } catch (err: any) {
        logs.push(`Error processing ${p.name}: ${err.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      skipped: alreadyExistsCount,
      logs
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message, logs }, { status: 500 });
  }
}

export async function POST() {
  return GET();
}
