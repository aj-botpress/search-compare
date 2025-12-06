import { Search, Loader2 } from 'lucide-react';

interface Props {
  query: string;
  numResults: number;
  isSearching: boolean;
  onQueryChange: (query: string) => void;
  onNumResultsChange: (num: number) => void;
  onSearch: () => void;
}

export function SearchInput({
  query,
  numResults,
  isSearching,
  onQueryChange,
  onNumResultsChange,
  onSearch,
}: Props) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isSearching && query.trim()) {
      onSearch();
    }
  };

  return (
    <div className="bg-zinc-900/80 border border-zinc-800 rounded-lg p-4">
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter search query..."
            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg pl-11 pr-4 py-3 text-base focus:outline-none focus:border-terminal-green"
          />
        </div>
        <select
          value={numResults}
          onChange={(e) => onNumResultsChange(Number(e.target.value))}
          className="bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-terminal-green cursor-pointer"
        >
          <option value={5}>5 results</option>
          <option value={10}>10 results</option>
          <option value={25}>25 results</option>
        </select>
        <button
          onClick={onSearch}
          disabled={isSearching || !query.trim()}
          className="px-6 py-3 bg-terminal-green/20 hover:bg-terminal-green/30 text-terminal-green border border-terminal-green/50 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
        >
          {isSearching ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Searching...
            </>
          ) : (
            <>
              <Search className="w-5 h-5" />
              Search Both
            </>
          )}
        </button>
      </div>
    </div>
  );
}
