import { NextResponse } from 'next/server';
import { fetchDailyProducts } from '@/lib/ph-api';
import { scoreProduct } from '@/lib/gemini';
import { generateClient } from 'aws-amplify/data';
import { Amplify } from 'aws-amplify';
import type { Schema } from '@/amplify/data/resource';

export const dynamic = 'force-dynamic';

export async function GET() {
    const timings: Record<string, number> = {};
    const logs: string[] = [];
    const start = Date.now();

    try {
        // 1. Check Env
        timings['env_check'] = Date.now() - start;
        if (!process.env.PH_TOKEN) logs.push("PH_TOKEN key missing");
        if (!process.env.GEMINI_API_KEY) logs.push("GEMINI_API_KEY missing");

        // 2. PH API
        const phStart = Date.now();
        try {
            logs.push("Fetching PH products...");
            const products = await fetchDailyProducts();
            timings['ph_api_latency'] = Date.now() - phStart;
            logs.push(`Fetched ${products?.length} products.`);
        } catch (e: any) {
            timings['ph_api_error'] = Date.now() - phStart;
            logs.push(`PH Error: ${e.message}`);
        }

        // 3. Amplify Config & DB
        const dbStart = Date.now();
        try {
            logs.push("Configuring Amplify...");
            const outputs = require('@/amplify_outputs.json');
            Amplify.configure(outputs);
            const client = generateClient<Schema>({ authMode: 'apiKey' });

            logs.push("Listing 1 product...");
            const { data } = await client.models.Product.list({ limit: 1 });
            timings['db_latency'] = Date.now() - dbStart;
            logs.push(`DB Success. Found ${data.length} items.`);
        } catch (e: any) {
            timings['db_error'] = Date.now() - dbStart;
            logs.push(`DB Error: ${e.message}`);
        }

        // 4. Gemini API
        const geminiStart = Date.now();
        try {
            logs.push("Testing Gemini...");
            const score = await scoreProduct("Test Product", "A test tagline", "A test description");
            timings['gemini_latency'] = Date.now() - geminiStart;
            logs.push("Gemini Success.");
        } catch (e: any) {
            timings['gemini_error'] = Date.now() - geminiStart;
            logs.push(`Gemini Error: ${e.message}`);
        }

        timings['total_duration'] = Date.now() - start;

        return NextResponse.json({
            success: true,
            timings,
            logs
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message, logs, timings }, { status: 500 });
    }
}
