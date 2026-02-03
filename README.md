# BlitzTracker

AI-powered Product Hunt tracker scored on Blitzscaling principles.

## Tech Stack
- **Framework:** Next.js 14 (App Router)
- **Backend:** AWS Amplify Gen 2 (Auth, Data/DynamoDB)
- **AI:** Google Gemini API
- **Styling:** Tailwind CSS + Framer Motion (Glassmorphism)

## Prerequisites
1. **Node.js:** Version 20 (Required for AWS Amplify CLI compatibility). Use `nvm use` if you have `.nvmrc` support.
2. **Product Hunt Token:** Get a developer token from [Product Hunt](https://www.producthunt.com/v2/oauth/applications).
2. **Gemini API Key:** Get an API key from [Google AI Studio](https://aistudio.google.com/).
3. **AWS Account:** For Amplify deployment.

## Getting Started

1. **Clone and Install:**
   ```bash
   cd blitz-tracker
   npm install
   ```

2. **Set Environment Variables:**
   Create a `.env.local` file:
   ```env
   PH_TOKEN=your_product_hunt_token
   GEMINI_API_KEY=your_gemini_api_key
   ```

3. **Run Amplify Sandbox:**
   This will deploy the backend resources and generate the required `amplify_outputs.json`.
   ```bash
   npx ampx sandbox
   ```

4. **Run Next.js:**
   ```bash
   npm run dev
   ```

## Deployment
This project is configured for AWS Amplify Hosting. 
1. Push your code to a Git provider (GitHub, GitLab, etc.).
2. Connect your repository to AWS Amplify.
3. Add the environment variables (`PH_TOKEN`, `GEMINI_API_KEY`) in the Amplify Console.
4. The `amplify.yml` included will handle the build and deployment.