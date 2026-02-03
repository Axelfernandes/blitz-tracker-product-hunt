# AWS Amplify Setup Guide for BlitzTracker

## Problem: Node.js v25 Compatibility Issue

The Amplify CLI (`npx ampx sandbox`) has a known compatibility issue with Node.js v25+. You're currently running **Node.js v25.2.1**.

## ✅ Your AWS Credentials are Already Configured

```
Region: us-west-2
Access Key: AKIA3QJZQE74KUIV7DI4
```

## 🔧 Solution Options

### Option 1: Use Node.js v20 (Recommended - Fastest)

1. **Install nvm (Node Version Manager)**:
   ```bash
   brew install nvm
   ```

2. **Add nvm to your shell** (add to `~/.zshrc` or `~/.bash_profile`):
   ```bash
   export NVM_DIR="$HOME/.nvm"
   [ -s "/opt/homebrew/opt/nvm/nvm.sh" ] && \. "/opt/homebrew/opt/nvm/nvm.sh"
   ```

3. **Reload shell**:
   ```bash
   source ~/.zshrc
   ```

4. **Install and use Node 20**:
   ```bash
   nvm install 20
   nvm use 20
   ```

5. **Run Amplify sandbox**:
   ```bash
   cd /Users/axelfernandes/Desktop/applications/product_hunt_tracker/blitz-tracker
   npx ampx sandbox
   ```

### Option 2: Deploy via AWS Amplify Console (No Node version change needed)

1. **Push your code to GitHub** (if not already):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Go to AWS Amplify Console**:
   - Visit: https://console.aws.amazon.com/amplify
   - Click "New app" → "Host web app"
   - Connect your GitHub repository
   - Select the `blitz-tracker` repository

3. **Configure build settings**:
   - Amplify will auto-detect Next.js
   - The `amplify.yml` file is already configured

4. **Add environment variables**:
   - In Amplify Console, go to "Environment variables"
   - Add:
     - `PH_TOKEN` = `WoCWCxOiED9P7eCJsTZ-SmiPv9R9-w3676dFKOANUWU`
     - `GEMINI_API_KEY` = `AIzaSyBhGdrlFm7PVwJ8OJhQ4-i3C4JySv4j5hA`
     - `CRON_SECRET` = `a_random_secret_string`

5. **Deploy**:
   - Click "Save and deploy"
   - Amplify will automatically create Cognito and DynamoDB

### Option 3: Quick Test with Mock Data (No AWS needed)

If you just want to see the UI improvements without AWS setup, I can create a mock data version that works without authentication.

## 🎯 Recommended Next Steps

**For local development**: Use Option 1 (Node 20 via nvm)  
**For production deployment**: Use Option 2 (Amplify Console)  
**For quick demo**: Use Option 3 (Mock data)

Which option would you like to proceed with?
