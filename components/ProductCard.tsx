import { GlassCard } from "./GlassCard";
import { format } from "date-fns";
import Image from "next/image";
import { ArrowBigUp, Calendar, TrendingUp, Package, Zap } from "lucide-react";
import { getScoreColor, getScoreGrade } from "@/lib/utils";
import type { Schema } from "@/amplify/data/resource";
import { motion } from "framer-motion";

interface ProductCardProps {
  product: Schema['Product']['type'];
  onClick: () => void;
  index?: number;
}

export function ProductCard({ product, onClick, index = 0 }: ProductCardProps) {
  const score = product.score || 0;
  const hasScore = score > 0;
  const grade = getScoreGrade(score);
  const hasHighGrowth = hasScore && (product.growthScore || 0) > 5;

  const getBorderClass = () => {
    if (!hasScore) return '';
    if (grade === 'A+' || grade === 'A') return 'border-l-4 border-l-yellow-400';
    if (grade === 'B+' || grade === 'B') return 'border-l-4 border-l-green-400';
    if (grade === 'C+' || grade === 'C') return 'border-l-4 border-l-blue-400';
    if (grade === 'D') return 'border-l-4 border-l-purple-400';
    return '';
  };

  const getGlowClass = () => {
    if (!hasScore) return '';
    if (grade === 'A+' || grade === 'A') return 'shadow-[0_0_20px_rgba(250,204,21,0.15)]';
    if (grade === 'B+' || grade === 'B') return 'shadow-[0_0_20px_rgba(74,222,128,0.15)]';
    if (grade === 'C+' || grade === 'C') return 'shadow-[0_0_20px_rgba(96,165,250,0.15)]';
    if (grade === 'D') return 'shadow-[0_0_20px_rgba(168,85,247,0.15)]';
    return '';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.3, 
        delay: index * 0.05,
        ease: "easeOut"
      }}
    >
      <GlassCard
        onClick={onClick}
        className={`cursor-pointer flex flex-col h-full gap-3 group relative overflow-hidden ${getBorderClass()} ${getGlowClass()}`}
        whileHover={{ scale: 1.02, y: -4 }}
        whileTap={{ scale: 0.98 }}
      >
        {hasScore && (
          <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-bold border-2 backdrop-blur-sm bg-black/40 z-10 ${getScoreColor(score)}`}>
            {grade} · {score}
          </div>
        )}

        <div className="flex items-start gap-3 pr-16">
          <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg border border-white/20 group-hover:border-[#FF958C]/50 transition-colors">
            {product.thumbnailUrl && product.thumbnailUrl.startsWith('http') ? (
              <Image
                src={product.thumbnailUrl}
                alt={product.name || ''}
                fill
                sizes="56px"
                className="object-cover group-hover:scale-110 transition-transform duration-300"
              />
            ) : (
              <div className="h-full w-full bg-white/10 flex items-center justify-center">
                <Package className="w-6 h-6 text-white/30" />
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-white group-hover:text-[#FF958C] transition-colors line-clamp-1">
              {product.name}
            </h3>
            <p className="text-sm text-white/70 line-clamp-2 leading-relaxed mt-1">
              {product.tagline}
            </p>
          </div>
        </div>

        {hasHighGrowth && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-green-500/10 border border-green-500/20 w-fit">
            <Zap className="w-3 h-3 text-green-400" />
            <span className="text-xs text-green-400 font-medium">High Growth</span>
          </div>
        )}

        <div className="flex items-center justify-between gap-2 pt-2 mt-auto border-t border-white/5">
          <div className="flex items-center gap-4 text-xs text-white/50">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>{product.launchDate ? format(new Date(product.launchDate), "MMM d") : 'N/A'}</span>
            </div>
            <div className="flex items-center gap-1.5 text-white/70">
              <ArrowBigUp className="w-3.5 h-3.5" />
              <span>{product.upvotes || 0}</span>
            </div>
          </div>
          {hasScore && (
            <div className="flex items-center gap-1 text-xs text-[#FF958C] font-semibold">
              <TrendingUp className="w-3 h-3" />
              <span>Score</span>
            </div>
          )}
        </div>
      </GlassCard>
    </motion.div>
  );
}
