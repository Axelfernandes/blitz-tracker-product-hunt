import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Amplify } from 'aws-amplify';
import ConfigureAmplifyClientSide from "@/components/ConfigureAmplify";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Header } from "@/components/Header";

try {
  const outputs = require('@/amplify_outputs.json');
  Amplify.configure(outputs, { ssr: true });
} catch (e) {
  console.warn("Amplify SSR configuration skipped: amplify_outputs.json not found.");
}

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BlitzTracker | AI Product Hunt Analysis",
  description: "Score Product Hunt launches on Blitzscaling values via AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning className={`${inter.className} antialiased min-h-screen selection:bg-[#FF958C]/30`}>
        <ThemeProvider>
          <div className="fixed inset-0 -z-10 overflow-hidden">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#FF958C]/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-[10%] right-[-5%] w-[35%] h-[35%] bg-[#EE85B5]/10 rounded-full blur-[120px]" />
            <div className="absolute top-[20%] right-[10%] w-[25%] h-[25%] bg-[#441151]/20 rounded-full blur-[100px]" />
          </div>
          <Header />
          <main className="pt-16">
            {children}
          </main>
          <ConfigureAmplifyClientSide />
        </ThemeProvider>
      </body>
    </html>
  );
}
