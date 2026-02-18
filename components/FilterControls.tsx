'use client';

import { Search, X, Clock, TrendingUp, Calendar, Zap, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import type { Schema } from "@/amplify/data/resource";

interface SearchSuggestion {
    name: string;
    tagline: string;
    id: string;
}

interface FilterControlsProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    sortBy: string;
    onSortChange: (sort: string) => void;
    scoreRange: [number, number];
    onScoreRangeChange: (range: [number, number]) => void;
    showFilters: boolean;
    onToggleFilters: () => void;
    products: Schema['Product']['type'][];
    quickFilter?: string | null;
    onQuickFilterChange?: (filter: string | null) => void;
}

const QUICK_FILTERS = [
    { id: 'high-score', label: 'High Score', icon: TrendingUp, filter: (p: any) => p.score >= 8 },
    { id: 'recent', label: 'This Week', icon: Calendar, filter: (p: any) => {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return new Date(p.launchDate) >= weekAgo;
    }},
    { id: 'popular', label: 'Popular', icon: Zap, filter: (p: any) => p.upvotes >= 50 },
];

const STORAGE_KEY = 'blitz-search-history';

export function FilterControls({
    searchQuery,
    onSearchChange,
    sortBy,
    onSortChange,
    scoreRange,
    onScoreRangeChange,
    showFilters,
    onToggleFilters,
    products,
    quickFilter,
    onQuickFilterChange,
}: FilterControlsProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
    const [recentSearches, setRecentSearches] = useState<string[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    // Debounced search
    const debouncedSearch = useMemo(() => {
        return searchQuery;
    }, [searchQuery]);

    // Generate suggestions with debounce
    useEffect(() => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        if (!debouncedSearch.trim()) {
            setSuggestions([]);
            return;
        }

        debounceRef.current = setTimeout(() => {
            const query = debouncedSearch.toLowerCase();
            const matches = products
                .filter(p => 
                    p.name?.toLowerCase().includes(query) ||
                    p.tagline?.toLowerCase().includes(query) ||
                    p.description?.toLowerCase().includes(query)
                )
                .slice(0, 5)
                .map(p => ({
                    id: p.id,
                    name: p.name || '',
                    tagline: p.tagline || ''
                }));
            
            setSuggestions(matches);
        }, 150);

        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [debouncedSearch, products]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === '/' && !isOpen) {
                e.preventDefault();
                inputRef.current?.focus();
            }
            if (e.key === 'Escape') {
                if (searchQuery) {
                    onSearchChange('');
                    setSuggestions([]);
                }
                inputRef.current?.blur();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [searchQuery, onSearchChange, isOpen]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const saveSearch = useCallback((query: string) => {
        if (!query.trim()) return;
        const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
        setRecentSearches(updated);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }, [recentSearches]);

    // Load recent searches from localStorage
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            setRecentSearches(JSON.parse(stored));
        }
    }, []);

    const handleSearch = (query: string) => {
        onSearchChange(query);
        setIsOpen(true);
        if (query.length >= 2) {
            saveSearch(query);
        }
    };

    const handleSuggestionClick = (suggestion: SearchSuggestion) => {
        onSearchChange(suggestion.name);
        setSuggestions([]);
        setIsOpen(false);
    };

    const handleRecentClick = (query: string) => {
        onSearchChange(query);
        setIsOpen(false);
    };

    const clearRecentSearches = () => {
        setRecentSearches([]);
        localStorage.removeItem(STORAGE_KEY);
    };

    const toggleChip = (chipId: string) => {
        if (onQuickFilterChange) {
            if (quickFilter === chipId) {
                onQuickFilterChange(null);
            } else {
                onQuickFilterChange(chipId);
            }
        }
    };

    return (
        <div className="space-y-4" ref={containerRef}>
            <div className="flex flex-col md:flex-row gap-4">
                {/* Enhanced Search */}
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 z-10" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                        onFocus={() => setIsOpen(true)}
                        placeholder="Search products... (Press /)"
                        className="w-full pl-12 pr-20 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#FF958C]/50 focus:border-[#FF958C]/50 transition-all"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        {searchQuery && (
                            <button
                                onClick={() => {
                                    onSearchChange('');
                                    setSuggestions([]);
                                    inputRef.current?.focus();
                                }}
                                className="p-1 hover:bg-white/10 rounded"
                            >
                                <X className="w-4 h-4 text-white/40" />
                            </button>
                        )}
                        <kbd className="hidden sm:inline-flex px-2 py-1 text-xs text-white/30 bg-white/5 rounded border border-white/10">
                            /
                        </kbd>
                    </div>

                    {/* Autocomplete Dropdown */}
                    {isOpen && (suggestions.length > 0 || recentSearches.length > 0) && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-[#0a0a0a]/95 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden z-50 shadow-2xl">
                            {/* Quick Filters */}
                            <div className="p-3 border-b border-white/10">
                                <div className="flex flex-wrap gap-2">
                                    {QUICK_FILTERS.map(chip => (
                                        <button
                                            key={chip.id}
                                            onClick={() => toggleChip(chip.id)}
                                            className={cn(
                                                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all",
                                                quickFilter === chip.id
                                                    ? "bg-[#FF958C]/20 text-[#FF958C] border border-[#FF958C]/50"
                                                    : "bg-white/5 text-white/70 border border-white/10 hover:bg-white/10"
                                            )}
                                        >
                                            <chip.icon className="w-3.5 h-3.5" />
                                            {chip.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Suggestions */}
                            {suggestions.length > 0 && (
                                <div className="p-2">
                                    <div className="text-xs text-white/40 px-2 py-1">Suggestions</div>
                                    {suggestions.map(s => (
                                        <button
                                            key={s.id}
                                            onClick={() => handleSuggestionClick(s)}
                                            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-left"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <div className="text-white font-medium truncate">{s.name}</div>
                                                <div className="text-white/50 text-sm truncate">{s.tagline}</div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Recent Searches */}
                            {recentSearches.length > 0 && !searchQuery && (
                                <div className="p-2 border-t border-white/10">
                                    <div className="flex items-center justify-between px-2 py-1">
                                        <div className="text-xs text-white/40 flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            Recent
                                        </div>
                                        <button
                                            onClick={clearRecentSearches}
                                            className="text-xs text-white/40 hover:text-white/70"
                                        >
                                            Clear
                                        </button>
                                    </div>
                                    {recentSearches.map((query, i) => (
                                        <button
                                            key={i}
                                            onClick={() => handleRecentClick(query)}
                                            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-left"
                                        >
                                            <Clock className="w-4 h-4 text-white/40" />
                                            <span className="text-white/70">{query}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Sort */}
                <select
                    value={sortBy}
                    onChange={(e) => onSortChange(e.target.value)}
                    className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-[#FF958C]/50 focus:border-[#FF958C]/50 transition-all cursor-pointer"
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
                            ? "bg-[#FF958C]/20 border-[#FF958C]/50 text-[#FF958C]"
                            : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                    )}
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                    </svg>
                    Filters
                </button>
            </div>

            {/* Active Chips */}
            {quickFilter && (
                <div className="flex items-center gap-2">
                    <span className="text-sm text-white/60">Active filter:</span>
                    <button
                        onClick={() => onQuickFilterChange?.(null)}
                        className="flex items-center gap-1 px-3 py-1 bg-[#FF958C]/20 text-[#FF958C] rounded-lg text-sm"
                    >
                        {QUICK_FILTERS.find(c => c.id === quickFilter)?.label}
                        <XCircle className="w-4 h-4" />
                    </button>
                </div>
            )}

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
                                className="flex-1 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#FF958C]"
                            />
                            <input
                                type="range"
                                min="0"
                                max="10"
                                step="1"
                                value={scoreRange[1]}
                                onChange={(e) => onScoreRangeChange([scoreRange[0], parseInt(e.target.value)])}
                                className="flex-1 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#FF958C]"
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

export { QUICK_FILTERS };
