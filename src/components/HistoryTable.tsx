import { Download, Trash2, RotateCcw } from 'lucide-react';
import type { HistoryEntry } from '../types';
import { exportHistoryToCsv } from '../lib/storage';

interface Props {
  history: HistoryEntry[];
  onRerun: (entry: HistoryEntry) => void;
  onClear: () => void;
}

export function HistoryTable({ history, onRerun, onClear }: Props) {
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

  const formatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const getWinner = (entry: HistoryEntry) => {
    if (!entry.exa || !entry.brave) return entry.exa ? 'Exa' : 'Brave';
    if (entry.exa.latencyMs < entry.brave.latencyMs) return 'Exa';
    if (entry.brave.latencyMs < entry.exa.latencyMs) return 'Brave';
    return 'Tie';
  };

  if (history.length === 0) {
    return (
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-4">
        <div className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Search History</div>
        <div className="text-zinc-500 text-center py-8">No searches yet</div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs text-zinc-500 uppercase tracking-wider">
          Search History ({history.length})
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded text-xs flex items-center gap-1.5"
          >
            <Download className="w-3 h-3" />
            Export CSV
          </button>
          <button
            onClick={onClear}
            className="px-3 py-1.5 bg-zinc-800 hover:bg-terminal-red/20 hover:text-terminal-red rounded text-xs flex items-center gap-1.5"
          >
            <Trash2 className="w-3 h-3" />
            Clear
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-zinc-500 text-xs uppercase">
              <th className="text-left py-2 px-2 font-medium">Query</th>
              <th className="text-right py-2 px-2 font-medium">Exa</th>
              <th className="text-right py-2 px-2 font-medium">Brave</th>
              <th className="text-center py-2 px-2 font-medium">Winner</th>
              <th className="text-right py-2 px-2 font-medium">Cost</th>
              <th className="text-right py-2 px-2 font-medium">Time</th>
              <th className="py-2 px-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {history.slice(0, 10).map((entry) => {
              const winner = getWinner(entry);
              const totalCost = (entry.exa?.costUsd ?? 0) + (entry.brave?.costUsd ?? 0);
              return (
                <tr key={entry.id} className="hover:bg-zinc-800/30">
                  <td className="py-2 px-2 truncate max-w-[200px]" title={entry.query}>
                    "{entry.query}"
                  </td>
                  <td className="py-2 px-2 text-right text-exa">
                    {entry.exa?.latencyMs ?? '—'}ms
                  </td>
                  <td className="py-2 px-2 text-right text-brave">
                    {entry.brave?.latencyMs ?? '—'}ms
                  </td>
                  <td className={`py-2 px-2 text-center font-medium ${
                    winner === 'Exa' ? 'text-exa' : winner === 'Brave' ? 'text-brave' : 'text-zinc-500'
                  }`}>
                    {winner}
                  </td>
                  <td className="py-2 px-2 text-right text-terminal-green">
                    ${totalCost.toFixed(3)}
                  </td>
                  <td className="py-2 px-2 text-right text-zinc-500">
                    {formatTime(entry.timestamp)}
                  </td>
                  <td className="py-2 px-2">
                    <button
                      onClick={() => onRerun(entry)}
                      className="p-1 hover:bg-zinc-700 rounded"
                      title="Re-run search"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
