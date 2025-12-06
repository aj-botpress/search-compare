export interface SearchResult {
  rank: number;
  title: string;
  url: string;
  snippet: string;
  publishedDate?: string;
  author?: string;
}

export interface SearchMetrics {
  latencyMs: number;
  resultCount: number;
  costUsd: number;
  timestamp: number;
}

export interface SearchResponse {
  results: SearchResult[];
  metrics: SearchMetrics;
  error?: string;
}

export interface HistoryEntry {
  id: string;
  query: string;
  numResults: number;
  exa: SearchMetrics | null;
  brave: SearchMetrics | null;
  timestamp: number;
  exaResults?: SearchResult[];
  braveResults?: SearchResult[];
}

export interface ApiKeys {
  exa: string;
  brave: string;
}

export type Provider = 'exa' | 'brave';

export interface SearchState {
  query: string;
  numResults: number;
  isSearching: boolean;
  exaResponse: SearchResponse | null;
  braveResponse: SearchResponse | null;
}
