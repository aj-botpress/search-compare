import type { SearchResult, SearchResponse, ExaRawResult, BraveRawResult, SearchOptions } from '../types';

const EXA_COST_PER_QUERY = 0.005; // $5 per 1000 queries (1-25 results)
const BRAVE_COST_PER_QUERY = 0.005; // $5 per 1000 queries

// Proxy URL - use Render for production, local proxy for dev
export const PROXY_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? '' // Use relative URLs for local dev (Vite proxy handles it)
  : 'https://search-compare-proxy.onrender.com';

// Exa API response wrapper
interface ExaApiResponse {
  results: ExaRawResult[];
  serverLatencyMs?: number;
  costDollars?: { total: number };
  requestId?: string;
  resolvedSearchType?: string;
  error?: string;
}

// Brave API response wrapper
interface BraveApiResponse {
  web?: { results: BraveRawResult[] };
  serverLatencyMs?: number;
  query?: { original: string };
  error?: string;
}

// Transform Exa raw result to normalized SearchResult
function transformExaResult(raw: ExaRawResult, rank: number): SearchResult {
  return {
    rank,
    title: raw.title || 'Untitled',
    url: raw.url,
    snippet: raw.highlights?.[0] || raw.text?.slice(0, 300) || '',
    publishedDate: raw.publishedDate,
    author: raw.author,
    favicon: raw.favicon,
    thumbnail: raw.image,
    highlights: raw.highlights,
    summary: raw.summary,
    meta: {
      id: raw.id,
      score: raw.score,
      highlightScores: raw.highlightScores,
      subpageCount: raw.subpages?.length,
      extractedLinks: raw.extras?.links,
      extractedImages: raw.extras?.imageLinks,
    },
    _raw: raw,
  };
}

// Transform Brave raw result to normalized SearchResult
function transformBraveResult(raw: BraveRawResult, rank: number): SearchResult {
  return {
    rank,
    title: raw.title || 'Untitled',
    url: raw.url,
    snippet: raw.description || '',
    publishedDate: raw.page_age,
    favicon: raw.meta_url?.favicon || raw.profile?.img,
    thumbnail: raw.thumbnail?.src || raw.thumbnail?.original,
    sourceName: raw.profile?.name || raw.profile?.long_name,
    meta: {
      type: raw.type,
      language: raw.language,
      familyFriendly: raw.family_friendly,
      isLocal: raw.is_source_local,
      hostname: raw.meta_url?.hostname || raw.profile?.long_name,
    },
    _raw: raw,
  };
}

export async function searchExa(
  query: string,
  apiKey: string,
  options: SearchOptions
): Promise<SearchResponse> {
  const startTime = performance.now();

  try {
    // Build request body with all Exa options
    const requestBody: Record<string, unknown> = {
      query,
      numResults: options.numResults,
      type: options.exa.type,
      useAutoprompt: options.exa.useAutoprompt,
      contents: {
        text: { maxCharacters: 500 },
        highlights: { numSentences: 3 },
        summary: { query },
      },
    };

    // Add optional filters
    if (options.exa.category) {
      requestBody.category = options.exa.category;
    }
    if (options.exa.includeDomains?.length) {
      requestBody.includeDomains = options.exa.includeDomains;
    }
    if (options.exa.excludeDomains?.length) {
      requestBody.excludeDomains = options.exa.excludeDomains;
    }
    if (options.exa.startPublishedDate) {
      requestBody.startPublishedDate = options.exa.startPublishedDate;
    }
    if (options.exa.endPublishedDate) {
      requestBody.endPublishedDate = options.exa.endPublishedDate;
    }
    if (options.exa.includeText?.length) {
      requestBody.includeText = options.exa.includeText;
    }
    if (options.exa.excludeText?.length) {
      requestBody.excludeText = options.exa.excludeText;
    }

    const response = await fetch(`${PROXY_URL}/api/exa`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify(requestBody),
    });

    const latencyMs = Math.round(performance.now() - startTime);
    const data: ExaApiResponse = await response.json();

    if (!response.ok) {
      return {
        results: [],
        metrics: { latencyMs, resultCount: 0, costUsd: 0, timestamp: Date.now() },
        error: data.error || 'Exa API error',
      };
    }

    const results: SearchResult[] = (data.results || []).map((raw, i) =>
      transformExaResult(raw, i + 1)
    );

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
    return {
      results: [],
      metrics: { latencyMs: 0, resultCount: 0, costUsd: 0, timestamp: Date.now() },
      error: message,
    };
  }
}

export async function searchBrave(
  query: string,
  apiKey: string,
  options: SearchOptions
): Promise<SearchResponse> {
  const startTime = performance.now();

  try {
    // Build query params with all Brave options
    const params = new URLSearchParams({
      q: query,
      count: String(Math.min(options.numResults, 20)), // Brave max is 20
    });

    // Add optional params
    if (options.brave.country) {
      params.set('country', options.brave.country);
    }
    if (options.brave.searchLang) {
      params.set('search_lang', options.brave.searchLang);
    }
    if (options.brave.safesearch) {
      params.set('safesearch', options.brave.safesearch);
    }
    if (options.brave.freshness) {
      params.set('freshness', options.brave.freshness);
    }
    if (options.brave.extraSnippets !== undefined) {
      params.set('extra_snippets', String(options.brave.extraSnippets));
    }
    if (options.brave.spellcheck !== undefined) {
      params.set('spellcheck', String(options.brave.spellcheck));
    }

    const response = await fetch(`${PROXY_URL}/api/brave?${params}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'X-Subscription-Token': apiKey,
      },
    });

    const latencyMs = Math.round(performance.now() - startTime);
    const data: BraveApiResponse = await response.json();

    if (!response.ok) {
      return {
        results: [],
        metrics: { latencyMs, resultCount: 0, costUsd: 0, timestamp: Date.now() },
        error: data.error || 'Brave API error',
      };
    }

    const webResults = data.web?.results || [];
    const results: SearchResult[] = webResults.map((raw, i) =>
      transformBraveResult(raw, i + 1)
    );

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
    return {
      results: [],
      metrics: { latencyMs: 0, resultCount: 0, costUsd: 0, timestamp: Date.now() },
      error: message,
    };
  }
}
