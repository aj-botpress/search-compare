import { useState } from 'react';
import { Download, Trash2, RotateCcw, Clock, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import type { HistoryEntry, SearchResult } from '../types';
import { exportHistoryToCsv } from '../lib/storage';

interface Props {
  history: HistoryEntry[];
  onRerun: (entry: HistoryEntry) => void;
  onClear: () => void;
}

function ResultsList({ results, provider }: { results: SearchResult[]; provider: 'exa' | 'brave' }) {
  const color = provider === 'exa' ? 'text-exa' : 'text-brave';

  if (!results || results.length === 0) {
    return <div className="text-zinc-500 text-sm">No results</div>;
  }

  return (
    <div className="space-y-2 max-h-[300px] overflow-y-auto">
      {results.map((result, i) => (
        <div key={i} className="p-2 bg-zinc-950/50 rounded border border-zinc-800">
          <div className="flex items-start gap-2">
            <span className="text-zinc-600 text-xs font-mono w-4">{result.rank}.</span>
            <div className="flex-1 min-w-0">
              <a
                href={result.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`text-sm font-medium hover:underline flex items-center gap-1 ${color}`}
              >
                <span className="truncate">{result.title}</span>
                <ExternalLink className="w-3 h-3 shrink-0" />
              </a>
              <div className="text-xs text-zinc-500 truncate">{new URL(result.url).hostname}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function HistoryCard({ entry, onRerun }: { entry: HistoryEntry; onRerun: () => void }) {
  const [expanded, setExpanded] = useState(false);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const getWinner = () => {
    if (!entry.exa || !entry.brave) return entry.exa ? 'Exa' : 'Brave';
    if (entry.exa.latencyMs < entry.brave.latencyMs) return 'Exa';
    if (entry.brave.latencyMs < entry.exa.latencyMs) return 'Brave';
    return 'Tie';
  };

  const winner = getWinner();
  const totalCost = (entry.exa?.costUsd ?? 0) + (entry.brave?.costUsd ?? 0);

  return (
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg overflow-hidden">
      <div
        className="p-4 cursor-pointer hover:bg-zinc-800/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <span className="text-lg font-medium truncate">"{entry.query}"</span>
              <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded">
                {entry.numResults} results
              </span>
            </div>
            <div className="flex items-center gap-4 mt-2 text-sm">
              <span className="text-exa">
                Exa: {entry.exa?.latencyMs ?? '—'}ms
              </span>
              <span className="text-brave">
                Brave: {entry.brave?.latencyMs ?? '—'}ms
              </span>
              <span className={`font-medium ${
                winner === 'Exa' ? 'text-exa' : winner === 'Brave' ? 'text-brave' : 'text-zinc-500'
              }`}>
                Winner: {winner}
              </span>
              <span className="text-terminal-green">
                ${totalCost.toFixed(4)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 ml-4">
            <div className="text-xs text-zinc-500 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatTime(entry.timestamp)}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRerun();
              }}
              className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded text-sm flex items-center gap-1.5"
              title="Re-run this search"
            >
              <RotateCcw className="w-4 h-4" />
              Re-run
            </button>
            {expanded ? (
              <ChevronUp className="w-5 h-5 text-zinc-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-zinc-500" />
            )}
          </div>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-zinc-800 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-2 text-exa font-medium mb-3">
                <span className="w-2 h-2 rounded-full bg-exa" />
                Exa Results ({entry.exaResults?.length ?? 0})
              </div>
              <ResultsList results={entry.exaResults ?? []} provider="exa" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-brave font-medium mb-3">
                <span className="w-2 h-2 rounded-full bg-brave" />
                Brave Results ({entry.braveResults?.length ?? 0})
              </div>
              <ResultsList results={entry.braveResults ?? []} provider="brave" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function HistoryView({ history, onRerun, onClear }: Props) {
  const handleExport = () => {
    const csv = exportHistoryToCsv(history);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `search-comparison-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalCost = history.reduce((sum, entry) => {
    return sum + (entry.exa?.costUsd ?? 0) + (entry.brave?.costUsd ?? 0);
  }, 0);

  const avgExaLatency = history.filter(h => h.exa).reduce((sum, h) => sum + (h.exa?.latencyMs ?? 0), 0) / (history.filter(h => h.exa).length || 1);
  const avgBraveLatency = history.filter(h => h.brave).reduce((sum, h) => sum + (h.brave?.latencyMs ?? 0), 0) / (history.filter(h => h.brave).length || 1);

  const exaWins = history.filter(h => h.exa && h.brave && h.exa.latencyMs < h.brave.latencyMs).length;
  const braveWins = history.filter(h => h.exa && h.brave && h.brave.latencyMs < h.exa.latencyMs).length;

  return (
    <div className="space-y-4">
      {/* Stats Summary */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="text-xs text-zinc-500 uppercase tracking-wider">
            History Summary ({history.length} searches)
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExport}
              disabled={history.length === 0}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed rounded text-xs flex items-center gap-1.5"
            >
              <Download className="w-3 h-3" />
              Export CSV
            </button>
            <button
              onClick={onClear}
              disabled={history.length === 0}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-terminal-red/20 hover:text-terminal-red disabled:opacity-50 disabled:cursor-not-allowed rounded text-xs flex items-center gap-1.5"
            >
              <Trash2 className="w-3 h-3" />
              Clear All
            </button>
          </div>
        </div>

        {history.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <div className="text-xs text-zinc-500 uppercase mb-1">Avg Exa Latency</div>
              <div className="text-xl font-bold text-exa">{Math.round(avgExaLatency)}ms</div>
            </div>
            <div>
              <div className="text-xs text-zinc-500 uppercase mb-1">Avg Brave Latency</div>
              <div className="text-xl font-bold text-brave">{Math.round(avgBraveLatency)}ms</div>
            </div>
            <div>
              <div className="text-xs text-zinc-500 uppercase mb-1">Exa Wins</div>
              <div className="text-xl font-bold text-exa">{exaWins}</div>
            </div>
            <div>
              <div className="text-xs text-zinc-500 uppercase mb-1">Brave Wins</div>
              <div className="text-xl font-bold text-brave">{braveWins}</div>
            </div>
            <div>
              <div className="text-xs text-zinc-500 uppercase mb-1">Total Cost</div>
              <div className="text-xl font-bold text-terminal-green">${totalCost.toFixed(3)}</div>
            </div>
          </div>
        ) : (
          <div className="text-zinc-500 text-center py-4">No search history yet</div>
        )}
      </div>

      {/* History List */}
      <div className="space-y-3">
        {history.map((entry) => (
          <HistoryCard
            key={entry.id}
            entry={entry}
            onRerun={() => onRerun(entry)}
          />
        ))}
      </div>

      {history.length === 0 && (
        <div className="bg-zinc-900/40 border border-zinc-800 border-dashed rounded-lg p-12 text-center">
          <div className="text-zinc-600">
            No searches yet. Run a search from the Search tab to see history here.
          </div>
        </div>
      )}
    </div>
  );
}
