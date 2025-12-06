import type { SearchResult, SearchResponse } from '../types';

const EXA_COST_PER_QUERY = 0.005; // $5 per 1000 queries (1-25 results)
const BRAVE_COST_PER_QUERY = 0.005; // $5 per 1000 queries

// Detect if running on GitHub Pages (no proxy available)
const isGitHubPages = window.location.hostname.includes('github.io');

// API endpoints
const EXA_API_URL = isGitHubPages ? 'https://api.exa.ai/search' : '/api/exa';
const BRAVE_API_URL = isGitHubPages
  ? 'https://api.search.brave.com/res/v1/web/search'
  : '/api/brave';

interface ExaResult {
  title: string;
  url: string;
  text?: string;
  highlights?: string[];
  publishedDate?: string;
  author?: string;
}

interface ExaResponse {
  results: ExaResult[];
  serverLatencyMs?: number;
  costDollars?: { total: number };
}

interface BraveWebResult {
  title: string;
  url: string;
  description: string;
  page_age?: string;
}

interface BraveResponse {
  web?: { results: BraveWebResult[] };
  serverLatencyMs?: number;
}

export async function searchExa(
  query: string,
  apiKey: string,
  numResults: number = 10
): Promise<SearchResponse> {
  const startTime = performance.now();

  try {
    const response = await fetch(EXA_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({
        query,
        numResults,
        type: 'auto',
        contents: {
          text: { maxCharacters: 500 },
          highlights: { numSentences: 2 },
        },
      }),
    });

    const latencyMs = Math.round(performance.now() - startTime);
    const data: ExaResponse = await response.json();

    if (!response.ok) {
      return {
        results: [],
        metrics: { latencyMs, resultCount: 0, costUsd: 0, timestamp: Date.now() },
        error: (data as any).error || 'Exa API error',
      };
    }

    const results: SearchResult[] = (data.results || []).map((r, i) => ({
      rank: i + 1,
      title: r.title || 'Untitled',
      url: r.url,
      snippet: r.highlights?.[0] || r.text?.slice(0, 200) || '',
      publishedDate: r.publishedDate,
      author: r.author,
    }));

    return {
      results,
      metrics: {
        latencyMs: data.serverLatencyMs || latencyMs,
        resultCount: results.length,
        costUsd: data.costDollars?.total || EXA_COST_PER_QUERY,
        timestamp: Date.now(),
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const corsHint = isGitHubPages ? ' (CORS may be blocking - run locally with proxy)' : '';
    return {
      results: [],
      metrics: { latencyMs: 0, resultCount: 0, costUsd: 0, timestamp: Date.now() },
      error: message + corsHint,
    };
  }
}

export async function searchBrave(
  query: string,
  apiKey: string,
  numResults: number = 10
): Promise<SearchResponse> {
  const startTime = performance.now();

  try {
    const params = new URLSearchParams({
      q: query,
      count: String(numResults),
    });

    const url = isGitHubPages
      ? `${BRAVE_API_URL}?${params}`
      : `/api/brave?${params}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'X-Subscription-Token': apiKey,
      },
    });

    const latencyMs = Math.round(performance.now() - startTime);
    const data: BraveResponse = await response.json();

    if (!response.ok) {
      return {
        results: [],
        metrics: { latencyMs, resultCount: 0, costUsd: 0, timestamp: Date.now() },
        error: (data as any).error || 'Brave API error',
      };
    }

    const webResults = data.web?.results || [];
    const results: SearchResult[] = webResults.map((r, i) => ({
      rank: i + 1,
      title: r.title || 'Untitled',
      url: r.url,
      snippet: r.description || '',
      publishedDate: r.page_age,
    }));

    return {
      results,
      metrics: {
        latencyMs: data.serverLatencyMs || latencyMs,
        resultCount: results.length,
        costUsd: BRAVE_COST_PER_QUERY,
        timestamp: Date.now(),
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const corsHint = isGitHubPages ? ' (CORS may be blocking - run locally with proxy)' : '';
    return {
      results: [],
      metrics: { latencyMs: 0, resultCount: 0, costUsd: 0, timestamp: Date.now() },
      error: message + corsHint,
    };
  }
}
