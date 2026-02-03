'use client';

import { Authenticator, useTheme, View, Text, Heading } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { GlassCard } from '@/components/GlassCard';

export default function LoginPage() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <GlassCard className="w-full max-w-md p-8 border-white/10">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
            BlitzTracker
          </h1>
          <p className="text-white/60 mt-2">Scale faster with AI insights.</p>
        </div>
        
        <Authenticator>
          {({ user }) => {
            useEffect(() => {
              if (user) {
                router.push('/dashboard');
              }
            }, [user]);
            return (
              <div className="flex justify-center p-4">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-400"></div>
              </div>
            );
          }}
        </Authenticator>

        <style jsx global>{`
          .amplify-authenticator {
            --amplify-colors-background-primary: transparent;
            --amplify-colors-brand-primary-80: #22d3ee;
            --amplify-colors-brand-primary-90: #0891b2;
            --amplify-colors-brand-primary-100: #0e7490;
            --amplify-colors-text-primary: white;
            --amplify-colors-text-secondary: rgba(255,255,255,0.7);
            --amplify-colors-border-primary: rgba(255,255,255,0.1);
            --amplify-components-fieldcontrol-focus-box-shadow: 0 0 0 2px #22d3ee;
          }
          .amplify-tabs__item--active {
            border-color: #22d3ee !important;
            color: #22d3ee !important;
          }
          .amplify-button--primary {
            background: linear-gradient(to right, #22d3ee, #a855f7) !important;
            border: none !important;
          }
          .amplify-field-group__control input {
            color: white !important;
            background: rgba(255,255,255,0.05) !important;
          }
        `}</style>
      </GlassCard>
    </div>
  );
}
