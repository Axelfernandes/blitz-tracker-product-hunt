'use client';

import { useState, useEffect, useMemo } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';
import { GlassCard } from '@/components/GlassCard';
import { 
  TrendingUp, 
  TrendingDown, 
  Package, 
  Award, 
  Zap, 
  Target,
  Users,
  ArrowUp,
  ArrowDown,
  Minus,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';
import { getScoreGrade, cn } from '@/lib/utils';
import { MOCK_PRODUCTS } from '@/lib/mock-data';

const client = generateClient<Schema>();
const IS_DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === 'true';

interface ScoreDistribution {
  grade: string;
  count: number;
  percentage: number;
  color: string;
}

export default function AnalyticsPage() {
  const [products, setProducts] = useState<Schema['Product']['type'][]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    if (IS_DEV_MODE) {
      setProducts(MOCK_PRODUCTS as Schema['Product']['type'][]);
      setLoading(false);
      return;
    }

    try {
      const { data: items } = await client.models.Product.list({ limit: 1000 });
      setProducts(items);
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  }

  const stats = useMemo(() => {
    const total = products.length;
    const scoredProducts = products.filter(p => (p.score || 0) > 0);
    const avgScore = scoredProducts.length > 0
      ? scoredProducts.reduce((sum, p) => sum + (p.score || 0), 0) / scoredProducts.length
      : 0;
    
    const totalUpvotes = products.reduce((sum, p) => sum + (p.upvotes || 0), 0);
    const avgUpvotes = total > 0 ? totalUpvotes / total : 0;

    const topProduct = scoredProducts.length > 0
      ? scoredProducts.reduce((max, p) => (p.score || 0) > (max.score || 0) ? p : max, scoredProducts[0])
      : null;

    const avgScores = {
      speed: scoredProducts.length > 0 ? scoredProducts.reduce((sum, p) => sum + (p.speedScore || 0), 0) / scoredProducts.length : 0,
      market: scoredProducts.length > 0 ? scoredProducts.reduce((sum, p) => sum + (p.marketScore || 0), 0) / scoredProducts.length : 0,
      pmf: scoredProducts.length > 0 ? scoredProducts.reduce((sum, p) => sum + (p.pmfScore || 0), 0) / scoredProducts.length : 0,
      network: scoredProducts.length > 0 ? scoredProducts.reduce((sum, p) => sum + (p.networkScore || 0), 0) / scoredProducts.length : 0,
      growth: scoredProducts.length > 0 ? scoredProducts.reduce((sum, p) => sum + (p.growthScore || 0), 0) / scoredProducts.length : 0,
      uncertainty: scoredProducts.length > 0 ? scoredProducts.reduce((sum, p) => sum + (p.uncertaintyScore || 0), 0) / scoredProducts.length : 0,
    };

    return { total, scoredCount: scoredProducts.length, avgScore, totalUpvotes, avgUpvotes, topProduct, avgScores };
  }, [products]);

  const scoreDistribution = useMemo((): ScoreDistribution[] => {
    const scored = products.filter(p => (p.score || 0) > 0);
    if (scored.length === 0) return [];

    const grades = ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D'];
    const colors: Record<string, string> = {
      'A+': 'bg-yellow-400',
      'A': 'bg-yellow-500',
      'B+': 'bg-green-400',
      'B': 'bg-green-500',
      'C+': 'bg-blue-400',
      'C': 'bg-blue-500',
      'D': 'bg-purple-400',
    };

    return grades.map(grade => {
      const count = scored.filter(p => getScoreGrade(p.score || 0) === grade).length;
      return {
        grade,
        count,
        percentage: (count / scored.length) * 100,
        color: colors[grade] || 'bg-gray-400'
      };
    }).filter(d => d.count > 0);
  }, [products]);

  const topProducts = useMemo(() => {
    return [...products]
      .filter(p => (p.score || 0) > 0)
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, 5);
  }, [products]);

  const recentProducts = useMemo(() => {
    return [...products]
      .sort((a, b) => new Date(b.launchDate || '').getTime() - new Date(a.launchDate || '').getTime())
      .slice(0, 5);
  }, [products]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FF958C]"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
          <BarChart3 className="w-10 h-10 text-[#FF958C]" />
          Analytics
        </h1>
        <p className="text-white/60">Real-time insights from your Product Hunt data</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <GlassCard className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-[#FF958C]/10">
              <Package className="w-6 h-6 text-[#FF958C]" />
            </div>
            <div>
              <p className="text-white/60 text-sm">Total Products</p>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-[#EE85B5]/10">
              <Award className="w-6 h-6 text-[#EE85B5]" />
            </div>
            <div>
              <p className="text-white/60 text-sm">Avg Blitz Score</p>
              <p className="text-2xl font-bold text-white">{stats.avgScore.toFixed(1)}</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-500/10">
              <Zap className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-white/60 text-sm">Total Upvotes</p>
              <p className="text-2xl font-bold text-white">{stats.totalUpvotes.toLocaleString()}</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-500/10">
              <Target className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-white/60 text-sm">Scored</p>
              <p className="text-2xl font-bold text-white">{stats.scoredCount} / {stats.total}</p>
            </div>
          </div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Score Distribution */}
        <GlassCard className="p-6">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-[#FF958C]" />
            Score Distribution
          </h3>
          {scoreDistribution.length > 0 ? (
            <div className="space-y-4">
              {scoreDistribution.map((item) => (
                <div key={item.grade} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/70">Grade {item.grade}</span>
                    <span className="text-white/70">{item.count} ({item.percentage.toFixed(1)}%)</span>
                  </div>
                  <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className={cn("h-full rounded-full", item.color)}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-white/50 text-center py-8">No scored products yet</p>
          )}
        </GlassCard>

        {/* Average Scores Breakdown */}
        <GlassCard className="p-6">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#FF958C]" />
            Average Scores by Category
          </h3>
          <div className="space-y-4">
            {[
              { label: 'Speed', value: stats.avgScores.speed, icon: TrendingUp, color: 'text-cyan-400' },
              { label: 'Market', value: stats.avgScores.market, icon: TrendingUp, color: 'text-green-400' },
              { label: 'PMF', value: stats.avgScores.pmf, icon: Target, color: 'text-yellow-400' },
              { label: 'Network', value: stats.avgScores.network, icon: Users, color: 'text-purple-400' },
              { label: 'Growth', value: stats.avgScores.growth, icon: Zap, color: 'text-pink-400' },
              { label: 'Uncertainty', value: stats.avgScores.uncertainty, icon: Minus, color: 'text-orange-400' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-4">
                <div className={cn("p-2 rounded-lg bg-white/5", item.color)}>
                  <item.icon className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-white/70">{item.label}</span>
                    <span className={cn("font-bold", item.color)}>{item.value.toFixed(1)}</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className={cn("h-full rounded-full", item.color.replace('text-', 'bg-'))}
                      style={{ width: `${(item.value / 10) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <GlassCard className="p-6">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-400" />
            Top Scoring Products
          </h3>
          <div className="space-y-3">
            {topProducts.map((product, index) => (
              <div key={product.id} className="flex items-center gap-4 p-3 bg-white/5 rounded-lg">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                  index === 0 ? "bg-yellow-400/20 text-yellow-400" :
                  index === 1 ? "bg-gray-400/20 text-gray-400" :
                  index === 2 ? "bg-orange-400/20 text-orange-400" :
                  "bg-white/10 text-white/50"
                )}>
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{product.name}</p>
                  <p className="text-white/50 text-sm truncate">{product.tagline}</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-[#FF958C]">{(product.score || 0).toFixed(1)}</p>
                  <p className="text-white/50 text-xs">{getScoreGrade(product.score || 0)}</p>
                </div>
              </div>
            ))}
            {topProducts.length === 0 && (
              <p className="text-white/50 text-center py-8">No scored products yet</p>
            )}
          </div>
        </GlassCard>

        {/* Recent Products */}
        <GlassCard className="p-6">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <Package className="w-5 h-5 text-[#FF958C]" />
            Recently Added
          </h3>
          <div className="space-y-3">
            {recentProducts.map((product) => (
              <div key={product.id} className="flex items-center gap-4 p-3 bg-white/5 rounded-lg">
                {product.thumbnailUrl ? (
                  <img src={product.thumbnailUrl} alt="" className="w-10 h-10 rounded-lg object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-white/10" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{product.name}</p>
                  <p className="text-white/50 text-sm">
                    {product.launchDate ? new Date(product.launchDate).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-white/50">
                  <ArrowUp className="w-4 h-4" />
                  <span>{product.upvotes || 0}</span>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
