#!/bin/bash

# BlitzTracker - AWS Amplify Sandbox Setup Script
# This script helps deploy the Amplify backend when there are Node.js compatibility issues

echo "🚀 BlitzTracker - AWS Amplify Setup"
echo "===================================="
echo ""

# Check Node version
NODE_VERSION=$(node --version)
echo "Current Node.js version: $NODE_VERSION"
echo ""

# Check if using Node v25+ (which has compatibility issues)
if [[ "$NODE_VERSION" == v25* ]] || [[ "$NODE_VERSION" == v26* ]]; then
    echo "⚠️  Warning: Node.js v25+ has compatibility issues with Amplify CLI"
    echo ""
    echo "📋 Options to fix this:"
    echo ""
    echo "Option 1: Use an older Node version (Recommended)"
    echo "  - Use the project's .nvmrc: nvm use"
    echo "  - (If nvm not installed): brew install nvm"
    echo "  - Run: npx ampx sandbox"
    echo ""
    echo "Option 2: Deploy via AWS Amplify Console"
    echo "  1. Push code to GitHub"
    echo "  2. Go to AWS Amplify Console: https://console.aws.amazon.com/amplify"
    echo "  3. Click 'New app' > 'Host web app'"
    echo "  4. Connect your GitHub repository"
    echo "  5. Add environment variables in Amplify Console:"
    echo "     - PH_TOKEN"
    echo "     - GEMINI_API_KEY"
    echo "     - CRON_SECRET"
    echo ""
    echo "Option 3: Manual CloudFormation deployment"
    echo "  - Use AWS Console to create Cognito User Pool and DynamoDB table"
    echo "  - Update amplify_outputs.json manually"
    echo ""
    exit 1
fi

# If Node version is compatible, run sandbox
echo "✅ Node version is compatible"
echo "Starting Amplify sandbox..."
echo ""

npx ampx sandbox
