import { NextResponse } from 'next/server';
import { fetchDailyProducts } from '@/lib/ph-api';
import { scoreProduct } from '@/lib/gemini';
import { generateClient } from 'aws-amplify/data';
import { Amplify } from 'aws-amplify';
import type { Schema } from '@/amplify/data/resource';

// We try to import outputs, but handle the case where it doesn't exist yet
let outputs;
try {
  outputs = require('@/amplify_outputs.json');
  Amplify.configure(outputs);
} catch (e) {
  console.warn("Amplify outputs not found. Run 'npx ampx sandbox' to generate them.");
}

const client = generateClient<Schema>({ authMode: 'apiKey' });

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!process.env.PH_TOKEN || !process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: "Missing environment variables" }, { status: 500 });
  }

  try {
    const products = await fetchDailyProducts();
    const results = [];

    for (const p of products) {
      // 1. Check if product already exists to avoid re-scoring
      const { data: existing } = await client.models.Product.list({
        filter: { phId: { eq: p.id } }
      });

      if (existing.length > 0) {
        results.push({ name: p.name, status: 'skipped (exists)' });
        continue;
      }

      // 2. Score with Gemini
      const score = await scoreProduct(p.name, p.tagline, p.description || "");

      if (score) {
        // 3. Save to DynamoDB
        await client.models.Product.create({
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
        results.push({ name: p.name, status: 'scored' });

        // Small delay to respect Gemini free tier RPM
        await new Promise(r => setTimeout(r, 4000));
      }
    }

    return NextResponse.json({ success: true, processed: results });
  } catch (error: any) {
    console.error("Sync Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST() {
  return GET();
}
