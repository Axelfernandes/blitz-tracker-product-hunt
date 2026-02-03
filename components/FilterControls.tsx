'use client';

import { Search, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface FilterControlsProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    sortBy: string;
    onSortChange: (sort: string) => void;
    scoreRange: [number, number];
    onScoreRangeChange: (range: [number, number]) => void;
    showFilters: boolean;
    onToggleFilters: () => void;
}

export function FilterControls({
    searchQuery,
    onSearchChange,
    sortBy,
    onSortChange,
    scoreRange,
    onScoreRangeChange,
    showFilters,
    onToggleFilters,
}: FilterControlsProps) {
    return (
        <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
                {/* Search */}
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Search products..."
                        className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                    />
                </div>

                {/* Sort */}
                <select
                    value={sortBy}
                    onChange={(e) => onSortChange(e.target.value)}
                    className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all cursor-pointer"
                >
                    <option value="date-desc">Latest First</option>
                    <option value="date-asc">Oldest First</option>
                    <option value="score-desc">Highest Score</option>
                    <option value="score-asc">Lowest Score</option>
                    <option value="upvotes-desc">Most Upvotes</option>
                    <option value="upvotes-asc">Least Upvotes</option>
                </select>

                {/* Filter Toggle */}
                <button
                    onClick={onToggleFilters}
                    className={cn(
                        "flex items-center gap-2 px-6 py-3 rounded-xl border transition-all",
                        showFilters
                            ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-300"
                            : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                    )}
                >
                    <SlidersHorizontal className="w-5 h-5" />
                    Filters
                </button>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
                <div className="p-6 rounded-xl bg-white/5 border border-white/10 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-white/80 mb-3">
                            Score Range: {scoreRange[0]} - {scoreRange[1]}
                        </label>
                        <div className="flex gap-4 items-center">
                            <input
                                type="range"
                                min="0"
                                max="10"
                                step="1"
                                value={scoreRange[0]}
                                onChange={(e) => onScoreRangeChange([parseInt(e.target.value), scoreRange[1]])}
                                className="flex-1 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                            />
                            <input
                                type="range"
                                min="0"
                                max="10"
                                step="1"
                                value={scoreRange[1]}
                                onChange={(e) => onScoreRangeChange([scoreRange[0], parseInt(e.target.value)])}
                                className="flex-1 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                            />
                        </div>
                        <div className="flex justify-between text-xs text-white/50 mt-2">
                            <span>Min: {scoreRange[0]}</span>
                            <span>Max: {scoreRange[1]}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
