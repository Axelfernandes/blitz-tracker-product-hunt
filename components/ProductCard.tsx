import { GlassCard } from "./GlassCard";
import { format } from "date-fns";
import Image from "next/image";
import { ArrowBigUp, Calendar, TrendingUp } from "lucide-react";
import { getScoreColor, getScoreGrade } from "@/lib/utils";

interface ProductCardProps {
  product: any;
  onClick: () => void;
}

export function ProductCard({ product, onClick }: ProductCardProps) {
  const score = product.score || 0;
  const hasScore = score > 0;

  return (
    <GlassCard
      onClick={onClick}
      className="cursor-pointer flex flex-col h-full gap-4 group relative overflow-hidden"
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Score Badge */}
      {hasScore && (
        <div className={`absolute top-4 right-4 px-3 py-1.5 rounded-full text-xs font-bold border-2 backdrop-blur-sm bg-black/40 ${getScoreColor(score)} z-10`}>
          {getScoreGrade(score)} · {score}
        </div>
      )}

      <div className="flex items-start justify-between gap-4">
        <div className="relative h-16 w-16 overflow-hidden rounded-lg border border-white/20 group-hover:border-cyan-400/50 transition-colors">
          <Image
            src={product.thumbnailUrl || product.thumbnail?.url}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-300"
          />
        </div>
      </div>

      <div className="flex-1">
        <h3 className="text-xl font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-1">
          {product.name}
        </h3>
        <p className="text-sm text-white/70 mt-2 line-clamp-2 leading-relaxed">
          {product.tagline}
        </p>
      </div>

      <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/5">
        <div className="flex items-center gap-4 text-xs text-white/50">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>{format(new Date(product.launchDate || product.createdAt), "MMM d")}</span>
          </div>
          <div className="flex items-center gap-1.5 text-white/70">
            <ArrowBigUp className="w-3.5 h-3.5" />
            <span>{product.upvotes || product.votedUpByCount}</span>
          </div>
        </div>
        {hasScore && (
          <div className="flex items-center gap-1 text-xs text-cyan-400 font-semibold group-hover:underline decoration-cyan-400/50 underline-offset-4">
            <TrendingUp className="w-3 h-3" />
            <span>View Score</span>
          </div>
        )}
      </div>
    </GlassCard>
  );
}

