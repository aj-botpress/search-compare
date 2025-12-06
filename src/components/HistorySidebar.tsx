import { useState, useRef, useEffect } from 'react';
import { Download, Trash2, MoreVertical, Clock, Plus } from 'lucide-react';
import type { HistoryEntry } from '../types';
import { exportHistoryToCsv } from '../lib/storage';

interface Props {
  history: HistoryEntry[];
  onSelect: (entry: HistoryEntry) => void;
  onClear: () => void;
  onNewSearch?: () => void;
  selectedQuery?: string;
}

function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

function HistoryItem({
  entry,
  onSelect,
  isSelected
}: {
  entry: HistoryEntry;
  onSelect: () => void;
  isSelected: boolean;
}) {
  const getWinner = () => {
    if (!entry.exa || !entry.brave) return entry.exa ? 'exa' : 'brave';
    if (entry.exa.latencyMs < entry.brave.latencyMs) return 'exa';
    if (entry.brave.latencyMs < entry.exa.latencyMs) return 'brave';
    return 'tie';
  };

  const winner = getWinner();

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left p-3 rounded-lg transition-colors group ${
        isSelected
          ? 'bg-zinc-800 border border-zinc-700'
          : 'hover:bg-zinc-800/50'
      }`}
    >
      <div className="flex items-start gap-2">
        {/* Winner indicator dot */}
        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
          winner === 'exa' ? 'bg-exa' : winner === 'brave' ? 'bg-brave' : 'bg-zinc-500'
        }`} />

        <div className="flex-1 min-w-0">
          {/* Query text */}
          <div className="text-sm text-zinc-200 truncate">
            {entry.query}
          </div>

          {/* Meta info */}
          <div className="flex items-center gap-2 mt-1 text-xs text-zinc-500">
            <span>{formatRelativeTime(entry.timestamp)}</span>
            <span className="text-zinc-700">·</span>
            <span className="text-exa">{entry.exa?.latencyMs ?? '—'}ms</span>
            <span className="text-zinc-700">/</span>
            <span className="text-brave">{entry.brave?.latencyMs ?? '—'}ms</span>
          </div>
        </div>
      </div>
    </button>
  );
}

export function HistorySidebar({ history, onSelect, onClear, onNewSearch, selectedQuery }: Props) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExport = () => {
    const csv = exportHistoryToCsv(history);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `search-comparison-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setShowMenu(false);
  };

  const handleClear = () => {
    onClear();
    setShowMenu(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* New Search Button */}
      {onNewSearch && (
        <div className="px-3 pt-3">
          <button
            onClick={onNewSearch}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Search
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <div className="flex items-center gap-2 text-sm font-medium text-zinc-300">
          <Clock className="w-4 h-4" />
          History
          {history.length > 0 && (
            <span className="text-xs text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded">
              {history.length}
            </span>
          )}
        </div>

        {/* Menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 hover:bg-zinc-800 rounded transition-colors text-zinc-500 hover:text-zinc-300"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-full mt-1 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl py-1 z-50 min-w-[140px]">
              <button
                onClick={handleExport}
                disabled={history.length === 0}
                className="w-full px-3 py-2 text-left text-sm hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
              <button
                onClick={handleClear}
                disabled={history.length === 0}
                className="w-full px-3 py-2 text-left text-sm hover:bg-zinc-800 hover:text-terminal-red disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Clear All
              </button>
            </div>
          )}
        </div>
      </div>

      {/* History List */}
      <div className="flex-1 overflow-y-auto px-2 py-2">
        {history.length > 0 ? (
          <div className="space-y-1">
            {history.map((entry) => (
              <HistoryItem
                key={entry.id}
                entry={entry}
                onSelect={() => onSelect(entry)}
                isSelected={selectedQuery === entry.query}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="text-zinc-600 text-sm">
              Your search history will appear here
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
