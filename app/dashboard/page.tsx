'use client';

import { useState, useEffect, useMemo } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';
import { ProductCard } from '@/components/ProductCard';
import { ScoreModal } from '@/components/ScoreModal';
import { GlassCard } from '@/components/GlassCard';
import { StatsCard } from '@/components/StatsCard';
import { FilterControls } from '@/components/FilterControls';
import { Rocket, RefreshCcw, LogOut, TrendingUp, Package, Award, Zap } from 'lucide-react';
import { withAuthenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { cn, filterBySearch, filterByScoreRange, sortProducts } from '@/lib/utils';
import { MOCK_PRODUCTS } from '@/lib/mock-data';

// Determine if we are in dev/mock mode
const IS_DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === 'true';

const client = generateClient<Schema>();

function Dashboard({ signOut }: { signOut?: () => void }) {
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date-desc');
  const [scoreRange, setScoreRange] = useState<[number, number]>([0, 10]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (IS_DEV_MODE) {
      setProducts(MOCK_PRODUCTS);
      setLoading(false);
      return;
    }

    fetchProducts();
    const sub = client.models.Product.observeQuery().subscribe({
      next: ({ items }) => {
        setProducts(items.sort((a, b) =>
          new Date(b.launchDate || '').getTime() - new Date(a.launchDate || '').getTime()
        ));
        setLoading(false);
      },
      error: (err) => {
        console.error('Observe error:', err);
        // Fallback to mock data in case of Amplify error during dev
        if (process.env.NODE_ENV === 'development') {
          setProducts(MOCK_PRODUCTS);
        }
        setLoading(false);
      }
    });
    return () => sub.unsubscribe();
  }, []);

  async function fetchProducts() {
    if (IS_DEV_MODE) return;
    try {
      const { data: items } = await client.models.Product.list();
      setProducts(items.sort((a, b) =>
        new Date(b.launchDate || '').getTime() - new Date(a.launchDate || '').getTime()
      ));
    } catch (err) {
      console.error('Error fetching products', err);
      if (process.env.NODE_ENV === 'development') {
        setProducts(MOCK_PRODUCTS);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleSync() {
    if (IS_DEV_MODE) {
      alert("Sync is disabled in Mock/Dev mode.");
      return;
    }
    setSyncing(true);
    try {
      const res = await fetch('/api/cron/sync-ph', { method: 'POST' });
      if (!res.ok) throw new Error('Sync failed');
    } catch (err) {
      console.error('Sync failed', err);
      alert('Sync failed. Check console for details.');
    } finally {
      setSyncing(false);
    }
  }

  // Apply filters and sorting
  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    // Apply search
    filtered = filterBySearch(filtered, searchQuery);

    // Apply score range filter
    filtered = filterByScoreRange(filtered, scoreRange[0], scoreRange[1]);

    // Apply sorting
    filtered = sortProducts(filtered, sortBy);

    return filtered;
  }, [products, searchQuery, scoreRange, sortBy]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalProducts = products.length;
    const scoredProducts = products.filter(p => p.score > 0);
    const avgScore = scoredProducts.length > 0
      ? (scoredProducts.reduce((sum, p) => sum + p.score, 0) / scoredProducts.length).toFixed(1)
      : '0';
    const topProduct = scoredProducts.length > 0
      ? scoredProducts.reduce((max, p) => p.score > max.score ? p : max, scoredProducts[0])
      : null;
    const totalUpvotes = products.reduce((sum, p) => sum + (p.upvotes || 0), 0);

    return { totalProducts, avgScore, topProduct, totalUpvotes };
  }, [products]);

  return (
    <main className="container mx-auto px-4 py-12 min-h-screen">
      <header className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
        <div className="text-center md:text-left">
          <h1 className="text-5xl font-black tracking-tighter flex items-center justify-center md:justify-start gap-3">
            <Rocket className="text-cyan-400 w-10 h-10" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60">
              BlitzTracker
            </span>
          </h1>
          <p className="text-white/50 mt-2 font-medium">Monitoring the next wave of hyper-growth startups.</p>
          {IS_DEV_MODE && (
            <div className="mt-2 inline-block px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-full">
              <span className="text-xs font-bold text-yellow-500 uppercase tracking-wider">Development Mode / Mock Data</span>
            </div>
          )}
        </div>

        <div className="flex gap-4">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 px-6 py-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all disabled:opacity-50"
          >
            <RefreshCcw className={cn("w-4 h-4", syncing && "animate-spin")} />
            {syncing ? 'Syncing...' : 'Sync PH'}
          </button>
          {signOut && (
            <button
              onClick={signOut}
              className="flex items-center gap-2 px-6 py-3 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          )}
        </div>
      </header>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-40">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-400 mb-4"></div>
          <div className="text-white/30 text-xl font-bold">Scanning the frontier...</div>
        </div>
      ) : (
        <>
          {products.length === 0 ? (
            <GlassCard className="text-center py-20">
              <p className="text-xl text-white/50 mb-6">No products found. Hit Sync to fetch today's launches and run AI scoring.</p>
              <button
                onClick={handleSync}
                disabled={syncing}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-cyan-500 text-black font-bold hover:bg-cyan-400 transition-all disabled:opacity-50"
              >
                <RefreshCcw className={cn("w-5 h-5", syncing && "animate-spin")} />
                Initialize Sync
              </button>
            </GlassCard>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatsCard
                  title="Total Products"
                  value={stats.totalProducts}
                  icon={Package}
                  color="text-cyan-400"
                />
                <StatsCard
                  title="Average Score"
                  value={stats.avgScore}
                  icon={TrendingUp}
                  color="text-green-400"
                />
                <StatsCard
                  title="Top Scorer"
                  value={stats.topProduct?.name || 'N/A'}
                  icon={Award}
                  color="text-yellow-400"
                />
                <StatsCard
                  title="Total Upvotes"
                  value={stats.totalUpvotes.toLocaleString()}
                  icon={Zap}
                  color="text-purple-400"
                />
              </div>

              {/* Filter Controls */}
              <div className="mb-8">
                <FilterControls
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  sortBy={sortBy}
                  onSortChange={setSortBy}
                  scoreRange={scoreRange}
                  onScoreRangeChange={setScoreRange}
                  showFilters={showFilters}
                  onToggleFilters={() => setShowFilters(!showFilters)}
                />
              </div>

              {/* Products Grid */}
              {filteredProducts.length === 0 ? (
                <GlassCard className="text-center py-20">
                  <p className="text-xl text-white/50">No products match your filters. Try adjusting your search or filters.</p>
                </GlassCard>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onClick={() => setSelectedProduct(product)}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}

      <ScoreModal
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        product={selectedProduct}
      />
    </main>
  );
}

// Conditionally wrap with authenticator or return component directly
const AuthenticatedDashboard = IS_DEV_MODE ? Dashboard : withAuthenticator(Dashboard);

export default AuthenticatedDashboard;


