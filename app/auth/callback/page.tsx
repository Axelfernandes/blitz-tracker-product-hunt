'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { GlassCard } from '@/components/GlassCard';
import { Rocket, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function AuthCallback() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const code = searchParams.get('code');
        const state = searchParams.get('state');

        if (code) {
            // In a full OAuth implementation, you would send this 'code' to your backend
            // to exchange it for an access token.
            console.log('Product Hunt Auth Code received:', code);
            setStatus('success');

            // Auto-redirect to dashboard after 3 seconds
            const timer = setTimeout(() => {
                router.push('/dashboard');
            }, 3000);

            return () => clearTimeout(timer);
        } else if (searchParams.get('error')) {
            setStatus('error');
            setError(searchParams.get('error_description') || 'Authorization failed');
        } else {
            setStatus('error');
            setError('No authorization code found in the response.');
        }
    }, [searchParams, router]);

    return (
        <main className="container mx-auto px-4 py-20 min-h-screen flex items-center justify-center">
            <GlassCard className="max-w-md w-full p-8 text-center">
                <div className="flex justify-center mb-6">
                    <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
                        <Rocket className="text-cyan-400 w-8 h-8" />
                    </div>
                </div>

                {status === 'loading' && (
                    <>
                        <h1 className="text-2xl font-bold mb-4 text-white">Authenticating...</h1>
                        <p className="text-white/60 mb-8">Connecting to Product Hunt to sync your account.</p>
                        <div className="flex justify-center">
                            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                        </div>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <h1 className="text-2xl font-bold mb-4 text-green-400">Success!</h1>
                        <p className="text-white/60 mb-8">
                            Your Product Hunt authentication was successful. Redirecting you back to the dashboard...
                        </p>
                        <div className="flex justify-center">
                            <CheckCircle2 className="w-12 h-12 text-green-400" />
                        </div>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <h1 className="text-2xl font-bold mb-4 text-red-400">Authentication Failed</h1>
                        <p className="text-red-400/60 mb-8">{error}</p>
                        <div className="flex justify-center mb-8">
                            <AlertCircle className="w-12 h-12 text-red-400" />
                        </div>
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all font-bold"
                        >
                            Back to Dashboard
                        </button>
                    </>
                )}
            </GlassCard>
        </main>
    );
}
