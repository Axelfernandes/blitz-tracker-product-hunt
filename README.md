# 🚀 BlitzTracker | AI-Powered Product Hunt Analysis

[![Live Demo](https://img.shields.io/badge/Live-Demo-cyan?style=for-the-badge&logo=vercel)](https://producthunt.forgify.io)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com)

**BlitzTracker** is a high-performance analytics dashboard that monitors the next wave of hyper-growth startups. It leverages Google's Gemini AI to score daily Product Hunt launches against **Blitzscaling** principles, providing investors and builders with deep insights into market potential, network effects, and growth velocity.

🔗 **Visit the Live App:** [producthunt.forgify.io](https://producthunt.forgify.io)

---

## ✨ Key Features

- **🤖 6-Dimensional AI Scoring**: Automated evaluation using Gemini AI based on 6 core Blitzscaling criteria:
  - Speed over Efficiency
  - Market Potential
  - Product-Market Fit (PMF)
  - Network Effects
  - Hyper-Growth Velocity
  - Risk & Uncertainty Management
- **📊 Premium Data Visualization**: Custom SVG-based Radar Charts with glassmorphism and real-time animations.
- **⚡ Real-time Sync**: Automated cron jobs to fetch and score the latest Product Hunt launches.
- **📱 Responsive UI**: A slick, dark-mode first interface built for desktop and mobile efficiency.
- **🛡️ Secure Auth**: Robust user authentication and data management powered by AWS Amplify Gen 2.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | [Next.js 16](https://nextjs.org/) (App Router), [React 19](https://react.dev/) |
| **Styling** | [Tailwind CSS 4.0](https://tailwindcss.com/), [Framer Motion](https://www.framer.com/motion/) |
| **Backend/Auth** | [AWS Amplify Gen 2](https://aws.amazon.com/amplify/), DynamoDB |
| **AI Engine** | [Google Gemini Pro API](https://aistudio.google.com/) |
| **Icons** | [Lucide React](https://lucide.dev/) |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: Version 20.x or higher
- **Product Hunt API Token**: [Create one here](https://www.producthunt.com/v2/oauth/applications)
- **Gemini API Key**: [Get one here](https://aistudio.google.com/)
- **AWS Account**: Configured for Amplify CLI

### Setup

1. **Clone & Install**
   ```bash
   git clone https://github.com/Axelfernandes/blitz-tracker-product-hunt.git
   cd blitz-tracker
   npm install
   ```

2. **Environment Configuration**
   Create a `.env.local` file:
   ```env
   PH_TOKEN=your_token_here
   GEMINI_API_KEY=your_key_here
   NEXT_PUBLIC_DEV_MODE=false
   ```

3. **Launch Backend (Sandbox)**
   ```bash
   npx ampx sandbox
   ```

4. **Run Development Server**
   ```bash
   npm run dev
   ```

---

## 🌐 Deployment

This project is optimized for **AWS Amplify Hosting**.
- Environment variables (`PH_TOKEN`, `GEMINI_API_KEY`) must be configured in the Amplify Console.
- The `amplify.yml` configuration manages the automated build pipeline and Next.js SSR deployment.

---

## 📄 License
MIT © [Axel Fernandes](https://github.com/Axelfernandes)