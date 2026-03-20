import { NextResponse, NextRequest } from 'next/server';
import { fetchDailyProducts, getPrimaryCategory } from '@/lib/ph-api';
import { scoreProduct } from '@/lib/gemini';
import { generateClient } from 'aws-amplify/data';
import { Amplify } from 'aws-amplify';
import type { Schema } from '@/amplify/data/resource';

export const dynamic = 'force-dynamic';

// Shared sync logic used by both GET (cron) and POST (admin panel)
async function runSync() {
  console.log("Sync route started.");
  const logs: string[] = [];
  const MAX_DURATION_MS = 20 * 1000;
  const startTime = Date.now();

  if (!process.env.PH_TOKEN) {
    return NextResponse.json({ error: "PH_TOKEN is missing" }, { status: 500 });
  }
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: "GEMINI_API_KEY is missing" }, { status: 500 });
  }

  try {
    const outputs = require('@/amplify_outputs.json');
    Amplify.configure(outputs);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: "Amplify configuration missing.", detailedError: message }, { status: 500 });
  }

  const client = generateClient<Schema>({ authMode: 'apiKey' });

  try {
    const products = await fetchDailyProducts();
    const results = [];
    logs.push(`Fetched ${products.length} products from Product Hunt`);

    if (products.length === 0) {
      return NextResponse.json({ success: true, message: "No products found.", logs });
    }

    const { data: existingData } = await client.models.Product.list({ limit: 1000 });
    const existingIds = new Set(existingData.map(p => p.phId));

    const newProducts = products.filter(p => !existingIds.has(p.id));
    const alreadyExistsCount = products.length - newProducts.length;

    logs.push(`Skipped ${alreadyExistsCount} existing products.`);
    logs.push(`Found ${newProducts.length} new products to process.`);

    const BATCH_SIZE = 3;
    const batch = newProducts.slice(0, BATCH_SIZE);
    const remainingCount = Math.max(0, newProducts.length - BATCH_SIZE);

    logs.push(`Processing batch of ${batch.length} products. (${remainingCount} remaining in queue)`);

    for (const p of batch) {
      const elapsed = Date.now() - startTime;
      if (elapsed > MAX_DURATION_MS) {
        logs.push(`WARNING: Time limit reached (${elapsed}ms). Stopping partial sync.`);
        break;
      }

      try {
        const score = await scoreProduct(p.name, p.tagline, p.description || "");

        if (score) {
          const category = getPrimaryCategory(p);
          const { errors: createErrors } = await client.models.Product.create({
            phId: p.id,
            name: p.name,
            tagline: p.tagline,
            description: p.description,
            thumbnailUrl: p.thumbnail.url,
            launchDate: p.createdAt,
            upvotes: p.votesCount,
            category: category,
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
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        logs.push(`Error processing ${p.name}: ${message}`);
      }
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      remaining: remainingCount,
      hasMore: remainingCount > 0,
      skipped: alreadyExistsCount,
      logs
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message, logs }, { status: 500 });
  }
}

// GET: called by external cron job — requires CRON_SECRET
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const queryKey = request.nextUrl.searchParams.get('key');
  const secret = process.env.CRON_SECRET;

  if (secret) {
    const providedKey = authHeader?.replace('Bearer ', '') || queryKey;
    if (providedKey !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  return runSync();
}

// POST: called by admin panel "Sync Now" button — no secret needed (admin is behind Cognito auth)
export async function POST() {
  return runSync();
}
