import { NextResponse } from 'next/server';
import { fetchDailyProducts } from '@/lib/ph-api';
import { scoreProduct } from '@/lib/gemini';
import { generateClient } from 'aws-amplify/data';
import { Amplify } from 'aws-amplify';
import type { Schema } from '@/amplify/data/resource';

export const dynamic = 'force-dynamic';

export async function GET() {
  const logs: string[] = [];

  // 1. Check Environment Variables
  if (!process.env.PH_TOKEN) {
    return NextResponse.json({ error: "PH_TOKEN is missing in production environment variables" }, { status: 500 });
  }
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: "GEMINI_API_KEY is missing in production environment variables" }, { status: 500 });
  }

  // 2. Configure Amplify
  let outputs;
  try {
    outputs = require('@/amplify_outputs.json');
    Amplify.configure(outputs);
    logs.push("Amplify configured successfully with outputs.");
  } catch (e: any) {
    logs.push("WARNING: amplify_outputs.json not found. Using fallback config if available.");
    // Optional: add fallback logic here if user provides standard Amplify env vars
    return NextResponse.json({
      error: "Amplify configuration (amplify_outputs.json) is missing on the production server. Make sure this file is included in your build or deployment.",
      detailedError: e.message
    }, { status: 500 });
  }

  const client = generateClient<Schema>({ authMode: 'apiKey' });

  try {
    const products = await fetchDailyProducts();
    const results = [];
    logs.push(`Fetched ${products.length} products`);

    if (products.length === 0) {
      return NextResponse.json({
        success: true,
        message: "PH API returned 0 products.",
        logs
      });
    }

    for (const p of products) {
      try {
        // 1. Check if exists
        const { data: existing } = await client.models.Product.list({
          filter: { phId: { eq: p.id } }
        });

        if (existing && existing.length > 0) {
          results.push({ name: p.name, status: 'skipped (exists)' });
          continue;
        }

        // 2. Score
        const score = await scoreProduct(p.name, p.tagline, p.description || "");

        if (score) {
          // 3. Save
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
            logs.push(`Saved ${p.name} (ID: ${created?.id})`);
          }

          // Delay for Gemini free tier RPM
          await new Promise(r => setTimeout(r, 4000));
        }
      } catch (err: any) {
        logs.push(`Error processing ${p.name}: ${err.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      processedCount: results.length,
      logs
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message, logs }, { status: 500 });
  }
}

export async function POST() {
  return GET();
}
