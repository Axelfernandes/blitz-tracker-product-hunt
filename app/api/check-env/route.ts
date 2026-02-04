import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    const envStatus = {
        PH_TOKEN: process.env.PH_TOKEN ? "Present (Hidden)" : "Missing",
        GEMINI_API_KEY: process.env.GEMINI_API_KEY ? "Present (Hidden)" : "Missing",
        NODE_ENV: process.env.NODE_ENV,
        AMPLIFY_OUT_DIR: process.env.AMPLIFY_OUT_DIR || "Not set",
    };

    return NextResponse.json(envStatus);
}
