import { ExternalLink, AlertCircle, Loader2 } from 'lucide-react';
import type { SearchResult, Provider } from '../types';

interface Props {
  provider: Provider;
  results: SearchResult[];
  otherResults: SearchResult[];
  isLoading: boolean;
  error?: string;
}

export function ResultsColumn({ provider, results, otherResults, isLoading, error }: Props) {
  const otherUrls = new Set(otherResults.map(r => r.url));
  const color = provider === 'exa' ? 'exa' : 'brave';
  const title = provider === 'exa' ? 'Exa' : 'Brave';

  if (isLoading) {
    return (
      <div className={`bg-zinc-900/60 border border-${color}/30 rounded-lg p-4`}>
        <div className={`flex items-center gap-2 text-${color} font-medium mb-4`}>
          <span className={`w-2 h-2 rounded-full bg-${color}`} />
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
      <div className={`bg-zinc-900/60 border border-terminal-red/30 rounded-lg p-4`}>
        <div className={`flex items-center gap-2 text-${color} font-medium mb-4`}>
          <span className={`w-2 h-2 rounded-full bg-${color}`} />
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
    <div className={`bg-zinc-900/60 border rounded-lg p-4 ${
      provider === 'exa' ? 'border-exa/30' : 'border-brave/30'
    }`}>
      <div className={`flex items-center gap-2 font-medium mb-4 ${
        provider === 'exa' ? 'text-exa' : 'text-brave'
      }`}>
        <span className={`w-2 h-2 rounded-full ${
          provider === 'exa' ? 'bg-exa' : 'bg-brave'
        }`} />
        {title} Results
        <span className="text-zinc-500 text-sm font-normal">({results.length})</span>
      </div>

      {results.length === 0 ? (
        <div className="text-zinc-500 text-center py-8">No results</div>
      ) : (
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
          {results.map((result, i) => {
            const isCommon = otherUrls.has(result.url);
            return (
              <div
                key={i}
                className={`p-3 rounded border ${
                  isCommon
                    ? 'bg-terminal-green/5 border-terminal-green/20'
                    : 'bg-zinc-950/50 border-zinc-800'
                }`}
              >
                <div className="flex items-start gap-2">
                  <span className="text-zinc-600 text-xs font-mono w-5 shrink-0">
                    {result.rank}.
                  </span>
                  <div className="flex-1 min-w-0">
                    <a
                      href={result.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`font-medium hover:underline flex items-center gap-1 ${
                        provider === 'exa' ? 'text-exa' : 'text-brave'
                      }`}
                    >
                      <span className="truncate">{result.title}</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                    <div className="text-xs text-zinc-500 truncate mt-0.5">
                      {new URL(result.url).hostname}
                      {isCommon && (
                        <span className="ml-2 text-terminal-green">● common</span>
                      )}
                    </div>
                    {result.snippet && (
                      <p className="text-sm text-zinc-400 mt-2 line-clamp-2">
                        {result.snippet}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
