import { useState, useRef, useEffect } from 'react';
import { Search, Loader2, Settings2, ChevronDown } from 'lucide-react';

interface Props {
  query: string;
  numResults: number;
  isSearching: boolean;
  onQueryChange: (query: string) => void;
  onNumResultsChange: (num: number) => void;
  onSearch: () => void;
  variant?: 'centered' | 'compact';
}

export function SearchInput({
  query,
  numResults,
  isSearching,
  onQueryChange,
  onNumResultsChange,
  onSearch,
  variant = 'centered',
}: Props) {
  const [showTools, setShowTools] = useState(false);
  const toolsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (toolsRef.current && !toolsRef.current.contains(event.target as Node)) {
        setShowTools(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isSearching && query.trim()) {
      onSearch();
    }
  };

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-2 flex-1 max-w-xl">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search..."
            className="w-full bg-zinc-900 border border-zinc-700 rounded-full pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-terminal-green"
          />
        </div>
        <div className="relative" ref={toolsRef}>
          <button
            onClick={() => setShowTools(!showTools)}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-zinc-200"
          >
            <Settings2 className="w-4 h-4" />
          </button>
          {showTools && (
            <div className="absolute right-0 top-full mt-2 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl p-3 z-50 min-w-[160px]">
              <div className="text-xs text-zinc-500 mb-2">Results</div>
              <select
                value={numResults}
                onChange={(e) => onNumResultsChange(Number(e.target.value))}
                className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-terminal-green cursor-pointer"
              >
                <option value={5}>5 results</option>
                <option value={10}>10 results</option>
                <option value={25}>25 results</option>
              </select>
            </div>
          )}
        </div>
        <button
          onClick={onSearch}
          disabled={isSearching || !query.trim()}
          className="px-4 py-2 bg-terminal-green/20 hover:bg-terminal-green/30 text-terminal-green border border-terminal-green/50 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors whitespace-nowrap"
        >
          {isSearching ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
          Search
        </button>
      </div>
    );
  }

  // Centered variant (default)
  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Main search input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
        <input
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter your search query..."
          className="w-full bg-zinc-900 border border-zinc-700 rounded-2xl pl-12 pr-4 py-4 text-lg focus:outline-none focus:border-terminal-green transition-colors"
        />
      </div>

      {/* Tools button and dropdown */}
      <div className="flex items-center justify-between mt-3">
        <div className="relative" ref={toolsRef}>
          <button
            onClick={() => setShowTools(!showTools)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 rounded-lg transition-colors"
          >
            <Settings2 className="w-4 h-4" />
            <span>Tools</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showTools ? 'rotate-180' : ''}`} />
          </button>

          {showTools && (
            <div className="absolute left-0 top-full mt-2 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl p-3 z-50 min-w-[180px]">
              <div className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Results per search</div>
              <div className="space-y-1">
                {[5, 10, 25].map((num) => (
                  <button
                    key={num}
                    onClick={() => {
                      onNumResultsChange(num);
                      setShowTools(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                      numResults === num
                        ? 'bg-terminal-green/20 text-terminal-green'
                        : 'hover:bg-zinc-800 text-zinc-300'
                    }`}
                  >
                    {num} results
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={onSearch}
          disabled={isSearching || !query.trim()}
          className="px-6 py-2.5 bg-terminal-green/20 hover:bg-terminal-green/30 text-terminal-green border border-terminal-green/50 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
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
