// ===========================================
// Raw API Response Types (what APIs return)
// ===========================================

// Exa API raw result
export interface ExaRawResult {
  id?: string;
  title: string;
  url: string;
  score?: number;
  publishedDate?: string;
  author?: string;
  // Content fields (require contents option)
  text?: string;
  highlights?: string[];
  highlightScores?: number[];
  summary?: string;
  // Media
  image?: string;
  favicon?: string;
  // Extras
  subpages?: ExaRawResult[];
  extras?: {
    links?: string[];
    imageLinks?: string[];
  };
}

// Brave API raw result
export interface BraveRawResult {
  title: string;
  url: string;
  description: string;
  page_age?: string;
  type?: string;
  language?: string;
  family_friendly?: boolean;
  is_source_local?: boolean;
  is_source_both?: boolean;
  // Profile/source info
  profile?: {
    name?: string;
    url?: string;
    long_name?: string;
    img?: string;
  };
  // Thumbnail
  thumbnail?: {
    src?: string;
    original?: string;
    logo?: boolean;
  };
  // Deep results (optional enriched data)
  deep_results?: {
    buttons?: Array<{ type?: string; title?: string; url?: string }>;
    news?: Array<{ title?: string; url?: string; description?: string }>;
  };
  // Meta info
  meta_url?: {
    scheme?: string;
    netloc?: string;
    hostname?: string;
    favicon?: string;
    path?: string;
  };
}

// ===========================================
// Normalized Search Result (unified view)
// ===========================================

export interface SearchResultMeta {
  // Exa-specific meta
  id?: string;
  score?: number;
  highlightScores?: number[];
  subpageCount?: number;
  extractedLinks?: string[];
  extractedImages?: string[];
  // Brave-specific meta
  type?: string;
  language?: string;
  familyFriendly?: boolean;
  isLocal?: boolean;
  hostname?: string;
}

export interface SearchResult {
  rank: number;
  title: string;
  url: string;
  snippet: string;
  // Common optional fields
  publishedDate?: string;
  author?: string;
  favicon?: string;
  thumbnail?: string;
  sourceName?: string;
  // Rich content (Exa)
  highlights?: string[];
  summary?: string;
  // All additional data
  meta?: SearchResultMeta;
  // Raw data for debugging/advanced use
  _raw?: ExaRawResult | BraveRawResult;
}

// ===========================================
// Search Metrics & Response
// ===========================================

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

// ===========================================
// App State Types
// ===========================================

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

// Search configuration options
export interface SearchOptions {
  numResults: number;
  // Exa-specific options
  exa: {
    type: 'auto' | 'neural' | 'keyword';
    category?: 'company' | 'research paper' | 'news' | 'pdf' | 'github' | 'tweet' | 'personal site' | 'linkedin profile' | '';
    useAutoprompt?: boolean;
    includeDomains?: string[];
    excludeDomains?: string[];
    startPublishedDate?: string;
    endPublishedDate?: string;
    includeText?: string[];
    excludeText?: string[];
  };
  // Brave-specific options
  brave: {
    country?: string;
    searchLang?: string;
    safesearch?: 'off' | 'moderate' | 'strict';
    freshness?: 'pd' | 'pw' | 'pm' | 'py' | ''; // past day, week, month, year
    extraSnippets?: boolean;
    spellcheck?: boolean;
  };
}

export const DEFAULT_SEARCH_OPTIONS: SearchOptions = {
  numResults: 10,
  exa: {
    type: 'auto',
    category: '',
    useAutoprompt: true,
  },
  brave: {
    country: 'us',
    searchLang: 'en',
    safesearch: 'moderate',
    freshness: '',
    extraSnippets: true,
    spellcheck: true,
  },
};

export interface SearchState {
  query: string;
  numResults: number;
  isSearching: boolean;
  exaResponse: SearchResponse | null;
  braveResponse: SearchResponse | null;
}
