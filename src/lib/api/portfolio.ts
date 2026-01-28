// API functions for portfolio analysis
export interface PortfolioAnalysis {
  totalValue: number;
  allocation: {
    category: string;
    value: number;
    percentage: number;
  }[];
  performance: {
    daily: number;
    weekly: number;
    monthly: number;
    yearly: number;
  };
  recommendations: string[];
}

export interface FinanceSearchResult {
  symbol: string;
  name: string;
  type: string;
  exchange?: string;
  currency?: string;
}

// Fetch portfolio analysis
export async function fetchPortfolioAnalysis(): Promise<PortfolioAnalysis> {
  const response = await fetch('/api/portfolio/analyze');
  
  if (!response.ok) {
    throw new Error('Failed to fetch portfolio analysis');
  }
  
  return response.json();
}

// Search for financial instruments
export async function searchFinance(query: string): Promise<FinanceSearchResult[]> {
  if (!query || query.length < 2) return [];
  
  const response = await fetch(`/api/finance/search?q=${encodeURIComponent(query)}`);
  
  if (!response.ok) {
    throw new Error('Failed to search finance');
  }
  
  return response.json();
}

