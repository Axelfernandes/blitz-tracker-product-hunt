import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Score color helper
export function getScoreColor(score: number): string {
  if (score >= 8) return "text-green-400 border-green-500";
  if (score >= 6) return "text-yellow-400 border-yellow-500";
  if (score >= 4) return "text-orange-400 border-orange-500";
  return "text-red-400 border-red-500";
}

export function getScoreBgColor(score: number): string {
  if (score >= 8) return "bg-green-500";
  if (score >= 6) return "bg-yellow-500";
  if (score >= 4) return "bg-orange-500";
  return "bg-red-500";
}

// Score grade helper
export function getScoreGrade(score: number): string {
  if (score >= 9) return "A+";
  if (score >= 8) return "A";
  if (score >= 7) return "B+";
  if (score >= 6) return "B";
  if (score >= 5) return "C+";
  if (score >= 4) return "C";
  return "D";
}

// Filter products by search query
export function filterBySearch(products: any[], query: string): any[] {
  if (!query.trim()) return products;
  const lowerQuery = query.toLowerCase();
  return products.filter(p =>
    p.name?.toLowerCase().includes(lowerQuery) ||
    p.tagline?.toLowerCase().includes(lowerQuery) ||
    p.description?.toLowerCase().includes(lowerQuery)
  );
}

// Filter products by score range
export function filterByScoreRange(products: any[], min: number, max: number): any[] {
  return products.filter(p => {
    const score = p.score || 0;
    return score >= min && score <= max;
  });
}

// Sort products
export function sortProducts(products: any[], sortBy: string): any[] {
  const sorted = [...products];

  switch (sortBy) {
    case 'score-desc':
      return sorted.sort((a, b) => (b.score || 0) - (a.score || 0));
    case 'score-asc':
      return sorted.sort((a, b) => (a.score || 0) - (b.score || 0));
    case 'upvotes-desc':
      return sorted.sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0));
    case 'upvotes-asc':
      return sorted.sort((a, b) => (a.upvotes || 0) - (b.upvotes || 0));
    case 'date-desc':
      return sorted.sort((a, b) =>
        new Date(b.launchDate || '').getTime() - new Date(a.launchDate || '').getTime()
      );
    case 'date-asc':
      return sorted.sort((a, b) =>
        new Date(a.launchDate || '').getTime() - new Date(b.launchDate || '').getTime()
      );
    default:
      return sorted;
  }
}

