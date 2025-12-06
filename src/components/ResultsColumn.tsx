import { useState } from 'react';
import { ExternalLink, AlertCircle, Loader2, ChevronDown, ChevronUp, Clock, Zap, DollarSign } from 'lucide-react';
import type { SearchResult, SearchMetrics, Provider } from '../types';

interface Props {
  provider: Provider;
  results: SearchResult[];
  otherResults: SearchResult[];
  metrics: SearchMetrics | null;
  otherMetrics: SearchMetrics | null;
  isLoading: boolean;
  error?: string;
}

// Strip HTML tags from text
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, match => {
    const entities: Record<string, string> = {
      '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#x27;': "'", '&#39;': "'"
    };
    return entities[match] || match;
  });
}

function ResultCard({
  result,
  isCommon,
  provider
}: {
  result: SearchResult;
  isCommon: boolean;
  provider: Provider;
}) {
  const [expanded, setExpanded] = useState(false);
  const cleanSnippet = result.snippet ? stripHtml(result.snippet) : '';
  const hasMoreContent = result.summary || (result.highlights && result.highlights.length > 0) || result.meta;
  const snippetIsTruncated = cleanSnippet.length > 150;

  return (
    <div
      className={`p-3 rounded border ${
        isCommon
          ? 'bg-terminal-green/5 border-terminal-green/20'
          : 'bg-zinc-950/50 border-zinc-800'
      }`}
    >
      <div className="flex items-start gap-2">
        {/* Rank */}
        <span className="text-zinc-600 text-xs font-mono w-5 shrink-0">
          {result.rank}.
        </span>

        <div className="flex-1 min-w-0 overflow-hidden">
          {/* Title row with favicon */}
          <div className="flex items-center gap-2 min-w-0">
            {result.favicon && (
              <img
                src={result.favicon}
                alt=""
                className="w-4 h-4 rounded shrink-0"
                onError={(e) => (e.currentTarget.style.display = 'none')}
              />
            )}
            <a
              href={result.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`font-medium hover:underline min-w-0 truncate ${
                provider === 'exa' ? 'text-exa' : 'text-brave'
              }`}
            >
              {result.title}
            </a>
            <ExternalLink className={`w-3 h-3 shrink-0 ${provider === 'exa' ? 'text-exa' : 'text-brave'}`} />
          </div>

          {/* URL and meta badges */}
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-xs text-zinc-500 truncate">
              {result.sourceName || new URL(result.url).hostname}
            </span>
            {isCommon && (
              <span className="text-xs text-terminal-green">● common</span>
            )}
            {result.author && (
              <span className="text-xs text-zinc-600">by {result.author}</span>
            )}
            {result.publishedDate && (
              <span className="text-xs text-zinc-600">
                {new Date(result.publishedDate).toLocaleDateString()}
              </span>
            )}
            {result.meta?.score !== undefined && (
              <span className="text-xs text-zinc-600">
                score: {result.meta.score.toFixed(2)}
              </span>
            )}
          </div>

          {/* Snippet */}
          {cleanSnippet && (
            <p className={`text-sm text-zinc-400 mt-2 break-words ${!expanded && snippetIsTruncated ? 'line-clamp-2' : ''}`}>
              {cleanSnippet}
            </p>
          )}

          {/* Expanded content */}
          {expanded && (
            <div className="mt-3 space-y-3 overflow-hidden">
              {/* Summary (Exa) */}
              {result.summary && (
                <div className="text-sm">
                  <div className="text-xs text-zinc-500 uppercase mb-1">AI Summary</div>
                  <p className="text-zinc-300 break-words">{stripHtml(result.summary)}</p>
                </div>
              )}

              {/* All highlights (Exa) */}
              {result.highlights && result.highlights.length > 0 && (
                <div className="text-sm">
                  <div className="text-xs text-zinc-500 uppercase mb-1">Highlights</div>
                  <ul className="space-y-1">
                    {result.highlights.map((h, i) => (
                      <li key={i} className="text-zinc-400 text-sm pl-2 border-l border-zinc-700 break-words">
                        {stripHtml(h)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Meta section */}
              {result.meta && (
                <div className="text-xs bg-zinc-900/50 rounded p-2 space-y-1 overflow-hidden">
                  <div className="text-zinc-500 uppercase mb-1">Meta</div>
                  {result.meta.id && (
                    <div className="text-zinc-500 truncate">ID: <span className="text-zinc-400 font-mono">{result.meta.id}</span></div>
                  )}
                  {result.meta.score !== undefined && (
                    <div className="text-zinc-500">Score: <span className="text-zinc-400">{result.meta.score.toFixed(4)}</span></div>
                  )}
                  {result.meta.type && (
                    <div className="text-zinc-500">Type: <span className="text-zinc-400">{result.meta.type}</span></div>
                  )}
                  {result.meta.language && (
                    <div className="text-zinc-500">Language: <span className="text-zinc-400">{result.meta.language}</span></div>
                  )}
                  {result.meta.hostname && (
                    <div className="text-zinc-500 truncate">Hostname: <span className="text-zinc-400">{result.meta.hostname}</span></div>
                  )}
                  {result.meta.isLocal && (
                    <div className="text-zinc-500">Local business: <span className="text-terminal-green">Yes</span></div>
                  )}
                  {result.meta.subpageCount && (
                    <div className="text-zinc-500">Subpages: <span className="text-zinc-400">{result.meta.subpageCount}</span></div>
                  )}
                  {result.meta.extractedLinks?.length && (
                    <div className="text-zinc-500">Extracted links: <span className="text-zinc-400">{result.meta.extractedLinks.length}</span></div>
                  )}
                </div>
              )}

              {/* Thumbnail if available */}
              {result.thumbnail && (
                <div>
                  <img
                    src={result.thumbnail}
                    alt=""
                    className="rounded max-h-32 object-cover"
                    onError={(e) => (e.currentTarget.style.display = 'none')}
                  />
                </div>
              )}
            </div>
          )}

          {/* Show more/less button */}
          {(hasMoreContent || snippetIsTruncated) && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 mt-2 transition-colors"
            >
              {expanded ? (
                <>
                  <ChevronUp className="w-3 h-3" />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDown className="w-3 h-3" />
                  Show more
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function ResultsColumn({ provider, results, otherResults, metrics, otherMetrics, isLoading, error }: Props) {
  const otherUrls = new Set(otherResults.map(r => r.url));
  const title = provider === 'exa' ? 'Exa' : 'Brave';

  // Determine if this provider is faster/cheaper
  const isFaster = metrics && otherMetrics && metrics.latencyMs < otherMetrics.latencyMs;
  const latencyDiff = metrics && otherMetrics ? Math.abs(metrics.latencyMs - otherMetrics.latencyMs) : 0;
  const isCheaper = metrics && otherMetrics && metrics.costUsd < otherMetrics.costUsd;
  const costDiff = metrics && otherMetrics ? Math.abs(metrics.costUsd - otherMetrics.costUsd) : 0;

  const borderColor = provider === 'exa' ? 'border-exa/30' : 'border-brave/30';
  const textColor = provider === 'exa' ? 'text-exa' : 'text-brave';
  const bgColor = provider === 'exa' ? 'bg-exa' : 'bg-brave';

  if (isLoading) {
    return (
      <div className={`bg-zinc-900/60 border ${borderColor} rounded-lg p-4`}>
        <div className={`flex items-center gap-2 ${textColor} font-medium mb-4`}>
          <span className={`w-2 h-2 rounded-full ${bgColor}`} />
          {title} Results
        </div>
        <div className="flex items-center justify-center py-12 text-zinc-500">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          Searching...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-zinc-900/60 border border-terminal-red/30 rounded-lg p-4">
        <div className={`flex items-center gap-2 ${textColor} font-medium mb-4`}>
          <span className={`w-2 h-2 rounded-full ${bgColor}`} />
          {title} Results
        </div>
        <div className="flex items-center gap-2 text-terminal-red py-8 justify-center">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-zinc-900/60 border ${borderColor} rounded-lg overflow-hidden`}>
      {/* Header with stats */}
      <div className="p-4 border-b border-zinc-800">
        <div className="flex items-center justify-between">
          <div className={`flex items-center gap-2 font-medium ${textColor}`}>
            <span className={`w-2 h-2 rounded-full ${bgColor}`} />
            {title} Results
            <span className="text-zinc-500 text-sm font-normal">({results.length})</span>
          </div>
          <div className="flex items-center gap-2">
            {isFaster && (
              <span className="flex items-center gap-1 text-xs text-terminal-green bg-terminal-green/10 px-2 py-0.5 rounded">
                <Zap className="w-3 h-3" />
                {latencyDiff}ms faster
              </span>
            )}
            {isCheaper && costDiff > 0 && (
              <span className="flex items-center gap-1 text-xs text-terminal-green bg-terminal-green/10 px-2 py-0.5 rounded">
                <DollarSign className="w-3 h-3" />
                ${costDiff.toFixed(4)} cheaper
              </span>
            )}
          </div>
        </div>

        {/* Stats row */}
        {metrics && (
          <div className="flex items-center gap-4 mt-2 text-xs text-zinc-500">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {metrics.latencyMs}ms
            </span>
            <span className="flex items-center gap-1">
              <DollarSign className="w-3 h-3" />
              ${metrics.costUsd.toFixed(4)}
            </span>
          </div>
        )}
      </div>

      {/* Results list */}
      <div className="p-4 overflow-hidden">
        {results.length === 0 ? (
          <div className="text-zinc-500 text-center py-8">No results</div>
        ) : (
          <div className="space-y-3 max-h-[600px] overflow-y-auto overflow-x-hidden pr-2">
            {results.map((result, i) => (
              <ResultCard
                key={i}
                result={result}
                isCommon={otherUrls.has(result.url)}
                provider={provider}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
