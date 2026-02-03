import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "./GlassCard";
import { X, Zap, Globe, Target, Share2, Rocket, ExternalLink } from "lucide-react";
import { cn, getScoreColor } from "@/lib/utils";
import { ScoreChart } from "./ScoreChart";

interface ScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: any;
  loading?: boolean;
}

export function ScoreModal({ isOpen, onClose, product, loading }: ScoreModalProps) {
  if (!isOpen || !product) return null;

  const hasScore = product.score !== undefined && product.score !== null;
  const scores = {
    speed: product.speedScore || 0,
    market: product.marketScore || 0,
    pmf: product.pmfScore || 0,
    network: product.networkScore || 0,
    growth: product.growthScore || 0,
    overall: product.score || 0,
    explanation: product.scoreExplanation || "AI analysis pending...",
  };

  const criteria = [
    { name: "Speed > Efficiency", score: scores.speed, icon: Zap, color: "text-yellow-400", bgColor: "bg-yellow-500" },
    { name: "Huge Market", score: scores.market, icon: Globe, color: "text-blue-400", bgColor: "bg-blue-500" },
    { name: "Product-Market Fit", score: scores.pmf, icon: Target, color: "text-green-400", bgColor: "bg-green-500" },
    { name: "Network Effects", score: scores.network, icon: Share2, color: "text-purple-400", bgColor: "bg-purple-500" },
    { name: "Hyper-Growth", score: scores.growth, icon: Rocket, color: "text-red-400", bgColor: "bg-red-500" },
  ];

  // Calculate Product Hunt URL
  const phUrl = product.phId ? `https://www.producthunt.com/posts/${product.phId}` : null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-3xl max-h-[90vh] overflow-y-auto"
        >
          <GlassCard className="border-white/30 bg-gray-900/80">
            <div className="flex justify-between items-start mb-6">
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-white mb-2">{product.name}</h2>
                <p className="text-white/60 text-lg">{product.tagline}</p>
                {phUrl && (
                  <a
                    href={phUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 mt-3 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    View on Product Hunt
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-white/10 transition-colors text-white/70 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 text-white/50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-400 mb-4"></div>
                <p>AI is analyzing Blitzscaling potential...</p>
              </div>
            ) : (
              <>
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  {/* Overall Score */}
                  <div className="flex flex-col items-center justify-center bg-white/5 p-6 rounded-xl border border-white/10">
                    <div className={cn(
                      "flex items-center justify-center w-24 h-24 rounded-full text-4xl font-bold border-4 mb-4",
                      getScoreColor(scores.overall)
                    )}>
                      {scores.overall}
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">Blitzscaling Score</h3>
                    <p className="text-white/70 italic text-center text-sm">"{scores.explanation}"</p>
                  </div>

                  {/* Radar Chart */}
                  <div className="flex items-center justify-center bg-white/5 p-6 rounded-xl border border-white/10">
                    <ScoreChart scores={scores} />
                  </div>
                </div>

                {/* Detailed Scores */}
                <div className="space-y-3">
                  <h4 className="text-lg font-semibold text-white mb-4">Detailed Analysis</h4>
                  {criteria.map((c) => (
                    <div key={c.name} className="flex items-center gap-4 p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/5">
                      <div className={cn("p-2 rounded-lg bg-white/5", c.color)}>
                        <c.icon className="w-5 h-5" />
                      </div>
                      <span className="text-white/90 font-medium flex-1">{c.name}</span>
                      <div className="w-40 h-3 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                          className={cn("h-full rounded-full", c.bgColor)}
                          initial={{ width: 0 }}
                          animate={{ width: `${c.score * 10}%` }}
                          transition={{ duration: 0.5, delay: 0.1 }}
                        />
                      </div>
                      <span className={cn("text-sm font-bold w-8 text-right", c.color)}>{c.score}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </GlassCard>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

