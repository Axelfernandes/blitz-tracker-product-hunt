import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export interface BlitzScore {
  speedScore: number;
  marketScore: number;
  pmfScore: number;
  networkScore: number;
  growthScore: number;
  overallScore: number;
  explanation: string;
}

export async function scoreProduct(
  name: string,
  tagline: string,
  description: string
): Promise<BlitzScore | null> {
  if (!process.env.GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY is missing");
    return null;
  }

  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const prompt = `
    Score this Product Hunt launch on Blitzscaling (Reid Hoffman) principles.
    Product Name: ${name}
    Tagline: ${tagline}
    Description: ${description}

    Evaluate on 0-10 scale (0=low, 10=high) for these 5 criteria:
    1. Speed over efficiency in uncertainty
    2. Huge market potential
    3. Strong Product-Market Fit (PMF)
    4. Network effects
    5. Hyper-growth potential

    Provide the output strictly as a JSON object with the following keys:
    {
      "speedScore": number,
      "marketScore": number,
      "pmfScore": number,
      "networkScore": number,
      "growthScore": number,
      "overallScore": number,
      "explanation": "1-sentence explanation"
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Clean up markdown code blocks if present
    const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();
    
    return JSON.parse(cleanText) as BlitzScore;
  } catch (error) {
    console.error("Gemini Scoring Error:", error);
    return null;
  }
}
