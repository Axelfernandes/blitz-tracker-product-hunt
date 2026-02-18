'use client';

import { useState, useEffect, useMemo } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';
import { ProductCard } from '@/components/ProductCard';
import { ScoreModal } from '@/components/ScoreModal';
import { GlassCard } from '@/components/GlassCard';
import { StatsCard } from '@/components/StatsCard';
import { FilterControls, QUICK_FILTERS } from '@/components/FilterControls';
import { TrendingUp, Package, Award, Zap } from 'lucide-react';
import { filterBySearch, filterByScoreRange, sortProducts } from '@/lib/utils';
import { MOCK_PRODUCTS } from '@/lib/mock-data';

const IS_DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === 'true';
const client = generateClient<Schema>();

export default function Dashboard() {
  const [products, setProducts] = useState<Schema['Product']['type'][]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Schema['Product']['type'] | null>(null);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date-desc');
  const [scoreRange, setScoreRange] = useState<[number, number]>([0, 10]);
  const [showFilters, setShowFilters] = useState(false);
  const [quickFilter, setQuickFilter] = useState<string | null>(null);

  useEffect(() => {
    if (IS_DEV_MODE) {
      setProducts(MOCK_PRODUCTS as Schema['Product']['type'][]);
      setLoading(false);
      return;
    }

    fetchProducts();
  }, []);

  async function fetchProducts() {
    if (IS_DEV_MODE) return;
    try {
      const { data: items } = await client.models.Product.list({ limit: 500 });
      setProducts(items.sort((a, b) =>
        new Date(b.launchDate || '').getTime() - new Date(a.launchDate || '').getTime()
      ));
    } catch (err) {
      console.error('Error fetching products', err);
      if (process.env.NODE_ENV === 'development') {
        setProducts(MOCK_PRODUCTS as Schema['Product']['type'][]);
      }
    } finally {
      setLoading(false);
    }
  }

  const filteredProducts = useMemo(() => {
    let filtered = [...products];
    
    if (quickFilter) {
      const filter = QUICK_FILTERS.find(f => f.id === quickFilter);
      if (filter) {
        filtered = filtered.filter(filter.filter);
      }
    }
    
    filtered = filterBySearch(filtered, searchQuery);
    filtered = filterByScoreRange(filtered, scoreRange[0], scoreRange[1]);
    filtered = sortProducts(filtered, sortBy);
    return filtered;
  }, [products, searchQuery, scoreRange, sortBy, quickFilter]);

  const stats = useMemo(() => {
    const totalProducts = products.length;
    const scoredProducts = products.filter(p => p.score && p.score > 0);
    const avgScore = scoredProducts.length > 0
      ? (scoredProducts.reduce((sum, p) => sum + (p.score || 0), 0) / scoredProducts.length).toFixed(1)
      : '0';
    const topProduct = scoredProducts.length > 0
      ? scoredProducts.reduce((max, p) => (p.score || 0) > (max.score || 0) ? p : max, scoredProducts[0])
      : null;
    const totalUpvotes = products.reduce((sum, p) => sum + (p.upvotes || 0), 0);
    return { totalProducts, avgScore, topProduct, totalUpvotes };
  }, [products]);

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen">
      {loading ? (
        <div className="flex flex-col items-center justify-center py-40">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FF958C] mb-4"></div>
          <div className="text-white/30 text-xl font-bold">Scanning the frontier...</div>
        </div>
      ) : (
        <>
          {products.length === 0 ? (
            <GlassCard className="text-center py-20">
              <p className="text-xl text-white/50 mb-6">No products found. The automated sync runs every 6 hours.</p>
            </GlassCard>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatsCard
                  title="Total Products"
                  value={stats.totalProducts}
                  icon={Package}
                  color="text-[#FF958C]"
                />
                <StatsCard
                  title="Average Score"
                  value={stats.avgScore}
                  icon={TrendingUp}
                  color="text-[#EE85B5]"
                />
                <StatsCard
                  title="Top Scorer"
                  value={stats.topProduct?.name || 'N/A'}
                  icon={Award}
                  color="text-[#441151]"
                />
                <StatsCard
                  title="Total Upvotes"
                  value={stats.totalUpvotes.toLocaleString()}
                  icon={Zap}
                  color="text-[#FF958C]"
                />
              </div>

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
                  products={products}
                  quickFilter={quickFilter}
                  onQuickFilterChange={setQuickFilter}
                />
              </div>

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
    </div>
  );
}
