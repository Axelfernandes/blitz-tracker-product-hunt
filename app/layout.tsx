import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ConfigureAmplifyClientSide from "@/components/ConfigureAmplify";

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
    <html lang="en">
      <body className={`${inter.className} antialiased bg-[#0a0a0c] text-white min-h-screen selection:bg-cyan-500/30`}>
        <ConfigureAmplifyClientSide />
        <div className="fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-[10%] right-[-5%] w-[35%] h-[35%] bg-purple-600/20 rounded-full blur-[120px]" />
          <div className="absolute top-[20%] right-[10%] w-[25%] h-[25%] bg-cyan-600/10 rounded-full blur-[100px]" />
        </div>
        {children}
      </body>
    </html>
  );
}