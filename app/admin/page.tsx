'use client';

import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';
import { GlassCard } from '@/components/GlassCard';
import { Plus, Download, Calendar, Package, Loader2, CheckCircle, XCircle, Search, ArrowLeft, Save, Sparkles } from 'lucide-react';
import { extractProductSlug, fetchProductBySlug, type PHProduct } from '@/lib/ph-api';
import { scoreProduct, type BlitzScore } from '@/lib/gemini';

const client = generateClient<Schema>();
type ProductType = Schema['Product']['type'];

interface FetchedProduct {
  phId: string;
  name: string;
  tagline: string;
  description: string;
  thumbnailUrl: string;
  launchDate: string;
  upvotes: number;
  score?: BlitzScore;
}

function AdminPanel() {
  const [activeTab, setActiveTab] = useState<'add' | 'export'>('add');
  const [products, setProducts] = useState<ProductType[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [formStatus, setFormStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });

  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');
  const [exporting, setExporting] = useState(false);

  const [phUrl, setPhUrl] = useState('');
  const [fetching, setFetching] = useState(false);
  const [scoring, setScoring] = useState(false);
  const [fetchedProduct, setFetchedProduct] = useState<FetchedProduct | null>(null);
  const [fetchError, setFetchError] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    setLoadingProducts(true);
    try {
      const { data: items } = await client.models.Product.list({ limit: 1000 });
      setProducts(items);
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoadingProducts(false);
    }
  }

  async function handleFetchProduct() {
    if (!phUrl.trim()) {
      setFetchError('Please enter a Product Hunt URL');
      return;
    }

    const slug = extractProductSlug(phUrl);
    if (!slug) {
      setFetchError('Invalid Product Hunt URL. Use format: https://www.producthunt.com/posts/product-name');
      return;
    }

    setFetching(true);
    setScoring(true);
    setFetchError('');
    setFetchedProduct(null);

    try {
      const product = await fetchProductBySlug(slug);
      if (!product) {
        setFetchError('Product not found. Make sure the URL is correct.');
        return;
      }

      const fetched: FetchedProduct = {
        phId: product.id,
        name: product.name,
        tagline: product.tagline,
        description: product.description || '',
        thumbnailUrl: product.thumbnail.url,
        launchDate: product.createdAt,
        upvotes: product.votesCount,
      };

      setFetchedProduct(fetched);

      try {
        const score = await scoreProduct(product.name, product.tagline, product.description || '');
        if (score) {
          setFetchedProduct({ ...fetched, score });
        }
      } catch (scoreErr) {
        console.error('Scoring error:', scoreErr);
      }

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch product';
      setFetchError(message);
    } finally {
      setFetching(false);
      setScoring(false);
    }
  }

  async function handleApproveAndSave() {
    if (!fetchedProduct) return;

    setFetching(true);
    setFormStatus({ type: null, message: '' });

    try {
      const { errors } = await client.models.Product.create({
        phId: fetchedProduct.phId,
        name: fetchedProduct.name,
        tagline: fetchedProduct.tagline,
        description: fetchedProduct.description,
        thumbnailUrl: fetchedProduct.thumbnailUrl,
        launchDate: fetchedProduct.launchDate,
        upvotes: fetchedProduct.upvotes,
        score: fetchedProduct.score?.overallScore || 0,
        speedScore: fetchedProduct.score?.speedScore || 0,
        marketScore: fetchedProduct.score?.marketScore || 0,
        pmfScore: fetchedProduct.score?.pmfScore || 0,
        networkScore: fetchedProduct.score?.networkScore || 0,
        growthScore: fetchedProduct.score?.growthScore || 0,
        uncertaintyScore: fetchedProduct.score?.uncertaintyScore || 0,
        scoreExplanation: fetchedProduct.score?.explanation || 'Manually added',
      });

      if (errors && errors.length > 0) {
        setFormStatus({ type: 'error', message: `Error: ${errors[0].message}` });
      } else {
        setFormStatus({ type: 'success', message: `Successfully added "${fetchedProduct.name}" with score ${fetchedProduct.score?.overallScore.toFixed(1) || 'N/A'}!` });
        setPhUrl('');
        setFetchedProduct(null);
        fetchProducts();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to add product';
      setFormStatus({ type: 'error', message });
    } finally {
      setFetching(false);
    }
  }

  function handleCancel() {
    setFetchedProduct(null);
    setPhUrl('');
    setFetchError('');
  }

  function handleExport() {
    setExporting(true);

    let filteredProducts = [...products];

    if (exportStartDate) {
      const start = new Date(exportStartDate);
      start.setHours(0, 0, 0, 0);
      filteredProducts = filteredProducts.filter(p => {
        const launchDate = new Date(p.launchDate || '');
        return launchDate >= start;
      });
    }

    if (exportEndDate) {
      const end = new Date(exportEndDate);
      end.setHours(23, 59, 59, 999);
      filteredProducts = filteredProducts.filter(p => {
        const launchDate = new Date(p.launchDate || '');
        return launchDate <= end;
      });
    }

    const csvHeader = [
      'ID',
      'Product Hunt ID',
      'Name',
      'Tagline',
      'Description',
      'Thumbnail URL',
      'Launch Date',
      'Upvotes',
      'Overall Score',
      'Speed Score',
      'Market Score',
      'PMF Score',
      'Network Score',
      'Growth Score',
      'Uncertainty Score',
      'Score Explanation',
    ].join(',');

    const csvRows = filteredProducts.map(p => [
      p.id,
      p.phId,
      `"${(p.name || '').replace(/"/g, '""')}"`,
      `"${(p.tagline || '').replace(/"/g, '""')}"`,
      `"${(p.description || '').replace(/"/g, '""')}"`,
      p.thumbnailUrl || '',
      p.launchDate || '',
      p.upvotes || 0,
      p.score || 0,
      p.speedScore || 0,
      p.marketScore || 0,
      p.pmfScore || 0,
      p.networkScore || 0,
      p.growthScore || 0,
      p.uncertaintyScore || 0,
      `"${(p.scoreExplanation || '').replace(/"/g, '""')}"`,
    ].join(','));

    const csvContent = [csvHeader, ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `blitztracker-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setExporting(false);
  }

  const ScoreBar = ({ label, value, color }: { label: string; value: number; color: string }) => (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-white/60">{label}</span>
        <span className={color}>{value.toFixed(1)}</span>
      </div>
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <div 
          className={`h-full ${color} transition-all`} 
          style={{ width: `${(value / 10) * 100}%` }}
        />
      </div>
    </div>
  );

  const inputClassName = "w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-cyan-400 transition-colors";
  const labelClassName = "block text-sm font-medium text-white/70 mb-2";

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
            BlitzTracker Admin
          </h1>
          <p className="text-white/60 mt-2">Manage products and export data.</p>
        </div>

        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setActiveTab('add')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
              activeTab === 'add'
                ? 'bg-gradient-to-r from-cyan-400 to-purple-500 text-white'
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            <Plus className="w-5 h-5" />
            Add Product
          </button>
          <button
            onClick={() => setActiveTab('export')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
              activeTab === 'export'
                ? 'bg-gradient-to-r from-cyan-400 to-purple-500 text-white'
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            <Download className="w-5 h-5" />
            Export Data
          </button>
        </div>

        {activeTab === 'add' && (
          <GlassCard className="p-8 border-white/10">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Package className="w-5 h-5 text-cyan-400" />
              Add Product from Product Hunt
            </h2>

            {!fetchedProduct ? (
              <div className="space-y-6">
                <div>
                  <label className={labelClassName}>Product Hunt URL</label>
                  <div className="flex gap-3">
                    <input
                      type="url"
                      value={phUrl}
                      onChange={(e) => setPhUrl(e.target.value)}
                      placeholder="https://www.producthunt.com/posts/product-name"
                      className={inputClassName}
                      onKeyDown={(e) => e.key === 'Enter' && handleFetchProduct()}
                    />
                    <button
                      onClick={handleFetchProduct}
                      disabled={fetching}
                      className="px-6 py-3 bg-cyan-400 hover:bg-cyan-500 rounded-xl font-medium text-gray-900 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {fetching ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Search className="w-5 h-5" />
                      )}
                      {scoring ? 'Fetching & Scoring...' : 'Fetch & Score'}
                    </button>
                  </div>
                  {fetchError && (
                    <p className="text-red-400 text-sm mt-2">{fetchError}</p>
                  )}
                </div>

                {fetching && (
                  <div className="text-center py-8">
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
                      <span className="text-white/60">Fetching product data...</span>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
                      <span className="text-white/60">AI is analyzing the product for blitz score...</span>
                    </div>
                  </div>
                )}

                {!fetching && (
                  <div className="text-center py-8 text-white/40">
                    <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>Enter a Product Hunt URL to fetch and score the product</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center gap-2 text-white/60 mb-4">
                  <button
                    onClick={handleCancel}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <span>Preview - Review before saving</span>
                </div>

                <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                  <div className="flex gap-6">
                    {fetchedProduct.thumbnailUrl && (
                      <img
                        src={fetchedProduct.thumbnailUrl}
                        alt={fetchedProduct.name}
                        className="w-32 h-32 rounded-xl object-cover"
                      />
                    )}
                    <div className="flex-1 space-y-3">
                      <div>
                        <p className="text-white/50 text-sm">Name</p>
                        <p className="text-white font-medium text-lg">{fetchedProduct.name}</p>
                      </div>
                      <div>
                        <p className="text-white/50 text-sm">Tagline</p>
                        <p className="text-white">{fetchedProduct.tagline}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-white/50 text-sm">Launch Date</p>
                          <p className="text-white">
                            {new Date(fetchedProduct.launchDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-white/50 text-sm">Upvotes</p>
                          <p className="text-white">{fetchedProduct.upvotes}</p>
                        </div>
                      </div>
                      {fetchedProduct.description && (
                        <div>
                          <p className="text-white/50 text-sm">Description</p>
                          <p className="text-white/70 text-sm line-clamp-2">{fetchedProduct.description}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {fetchedProduct.score && (
                  <div className="bg-gradient-to-r from-purple-500/10 to-cyan-500/10 rounded-xl p-6 border border-purple-500/20">
                    <div className="flex items-center gap-2 mb-4">
                      <Sparkles className="w-5 h-5 text-purple-400" />
                      <h3 className="text-white font-bold">AI Blitz Score</h3>
                    </div>
                    
                    <div className="flex items-center gap-6 mb-6">
                      <div className="text-center">
                        <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
                          {fetchedProduct.score.overallScore.toFixed(1)}
                        </div>
                        <div className="text-white/50 text-sm">Overall Score</div>
                      </div>
                      <div className="flex-1 space-y-3">
                        <ScoreBar label="Speed" value={fetchedProduct.score.speedScore} color="text-cyan-400" />
                        <ScoreBar label="Market" value={fetchedProduct.score.marketScore} color="text-green-400" />
                        <ScoreBar label="PMF" value={fetchedProduct.score.pmfScore} color="text-yellow-400" />
                        <ScoreBar label="Network" value={fetchedProduct.score.networkScore} color="text-blue-400" />
                        <ScoreBar label="Growth" value={fetchedProduct.score.growthScore} color="text-purple-400" />
                        <ScoreBar label="Uncertainty" value={fetchedProduct.score.uncertaintyScore} color="text-orange-400" />
                      </div>
                    </div>
                    
                    <div className="p-3 bg-white/5 rounded-lg">
                      <p className="text-white/70 text-sm italic">"{fetchedProduct.score.explanation}"</p>
                    </div>
                  </div>
                )}

                {!fetchedProduct.score && (
                  <div className="flex items-center gap-3 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full" />
                    <span className="text-yellow-400 text-sm">
                      Could not generate AI score. Product will be saved with score = 0.
                    </span>
                  </div>
                )}

                {formStatus.type && (
                  <div className={`flex items-center gap-2 p-4 rounded-xl ${
                    formStatus.type === 'success' ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'
                  }`}>
                    {formStatus.type === 'success' ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-400" />
                    )}
                    <span className={formStatus.type === 'success' ? 'text-green-400' : 'text-red-400'}>
                      {formStatus.message}
                    </span>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={handleCancel}
                    className="flex-1 py-4 bg-white/5 hover:bg-white/10 rounded-xl font-medium text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleApproveAndSave}
                    disabled={fetching}
                    className="flex-1 py-4 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-xl font-bold text-white hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {fetching ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        Approve & Save
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </GlassCard>
        )}

        {activeTab === 'export' && (
          <div className="space-y-6">
            <GlassCard className="p-8 border-white/10">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Download className="w-5 h-5 text-cyan-400" />
                Export Database
              </h2>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className={labelClassName}>
                      <Calendar className="w-4 h-4 inline mr-1" />
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={exportStartDate}
                      onChange={(e) => setExportStartDate(e.target.value)}
                      className={inputClassName}
                    />
                  </div>
                  <div>
                    <label className={labelClassName}>
                      <Calendar className="w-4 h-4 inline mr-1" />
                      End Date
                    </label>
                    <input
                      type="date"
                      value={exportEndDate}
                      onChange={(e) => setExportEndDate(e.target.value)}
                      className={inputClassName}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                  <div>
                    <p className="text-white font-medium">
                      {loadingProducts ? 'Loading...' : `${products.length} products in database`}
                    </p>
                    <p className="text-white/50 text-sm">
                      {(exportStartDate || exportEndDate) 
                        ? `Will export ${products.filter(p => {
                            const launchDate = new Date(p.launchDate || '');
                            if (exportStartDate && launchDate < new Date(exportStartDate)) return false;
                            if (exportEndDate && launchDate > new Date(exportEndDate)) return false;
                            return true;
                          }).length} products with selected filters`
                        : 'All products will be exported'
                      }
                    </p>
                  </div>
                  <button
                    onClick={handleExport}
                    disabled={exporting || products.length === 0}
                    className="px-6 py-3 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-xl font-bold text-white hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
                  >
                    {exporting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Exporting...
                      </>
                    ) : (
                      <>
                        <Download className="w-5 h-5" />
                        Download CSV
                      </>
                    )}
                  </button>
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-6 border-white/10">
              <h3 className="text-lg font-bold text-white mb-4">Products in Database</h3>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {products.slice(0, 50).map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-3">
                      {p.thumbnailUrl ? (
                        <img src={p.thumbnailUrl} alt="" className="w-8 h-8 rounded object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded bg-white/10" />
                      )}
                      <div>
                        <p className="text-white font-medium">{p.name}</p>
                        <p className="text-white/50 text-sm">{p.launchDate ? new Date(p.launchDate).toLocaleDateString() : 'No date'}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      (p.score || 0) > 0 ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {(p.score || 0) > 0 ? `Score: ${(p.score || 0).toFixed(1)}` : 'Not scored'}
                    </span>
                  </div>
                ))}
                {products.length > 50 && (
                  <p className="text-white/50 text-sm text-center py-2">
                    ...and {products.length - 50} more products
                  </p>
                )}
              </div>
            </GlassCard>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
      <Authenticator>
        {({ user }) => {
          if (!user) {
            return (
              <div className="flex min-h-screen items-center justify-center p-4">
                <GlassCard className="w-full max-w-md p-8 border-white/10">
                  <div className="mb-8 text-center">
                    <h1 className="text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
                      BlitzTracker Admin
                    </h1>
                    <p className="text-white/60 mt-2">Sign in to manage products.</p>
                  </div>
                </GlassCard>
              </div>
            );
          }
          return <AdminPanel />;
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
    </div>
  );
}
