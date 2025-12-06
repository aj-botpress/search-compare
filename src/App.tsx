import { useState, useEffect, useCallback } from 'react';
import { Zap, Github, Search, History } from 'lucide-react';
import { ApiKeyPanel } from './components/ApiKeyPanel';
import { SearchInput } from './components/SearchInput';
import { StatsGrid } from './components/StatsGrid';
import { ResultsColumn } from './components/ResultsColumn';
import { HistoryView } from './components/HistoryView';
import { searchExa, searchBrave } from './lib/api';
import { loadApiKeys, saveApiKeys, loadHistory, addHistoryEntry, clearHistory } from './lib/storage';
import type { ApiKeys, SearchResponse, HistoryEntry } from './types';

type Tab = 'search' | 'history';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('search');
  const [apiKeys, setApiKeys] = useState<ApiKeys>({ exa: '', brave: '' });
  const [query, setQuery] = useState('');
  const [numResults, setNumResults] = useState(10);
  const [isSearching, setIsSearching] = useState(false);
  const [exaResponse, setExaResponse] = useState<SearchResponse | null>(null);
  const [braveResponse, setBraveResponse] = useState<SearchResponse | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [sessionCost, setSessionCost] = useState(0);
  const [pendingQuery, setPendingQuery] = useState<string | null>(null);

  useEffect(() => {
    setApiKeys(loadApiKeys());
    setHistory(loadHistory());
  }, []);

  const handleKeysChange = useCallback((keys: ApiKeys) => {
    setApiKeys(keys);
    saveApiKeys(keys);
  }, []);

  const executeSearch = useCallback(async (searchQuery: string, searchNumResults: number) => {
    if (!searchQuery.trim()) return;

    setActiveTab('search');
    setIsSearching(true);
    setExaResponse(null);
    setBraveResponse(null);

    const results: { exa: SearchResponse | null; brave: SearchResponse | null } = {
      exa: null,
      brave: null,
    };

    const searchPromises: Promise<void>[] = [];

    if (apiKeys.exa) {
      searchPromises.push(
        searchExa(searchQuery, apiKeys.exa, searchNumResults).then((res) => {
          results.exa = res;
          setExaResponse(res);
        })
      );
    }

    if (apiKeys.brave) {
      searchPromises.push(
        searchBrave(searchQuery, apiKeys.brave, searchNumResults).then((res) => {
          results.brave = res;
          setBraveResponse(res);
        })
      );
    }

    await Promise.allSettled(searchPromises);
    setIsSearching(false);

    // Add to history
    if (results.exa || results.brave) {
      const entry: HistoryEntry = {
        id: crypto.randomUUID(),
        query: searchQuery,
        numResults: searchNumResults,
        exa: results.exa?.metrics ?? null,
        brave: results.brave?.metrics ?? null,
        timestamp: Date.now(),
        exaResults: results.exa?.results,
        braveResults: results.brave?.results,
      };
      const updated = addHistoryEntry(entry);
      setHistory(updated);

      const cost = (results.exa?.metrics?.costUsd ?? 0) + (results.brave?.metrics?.costUsd ?? 0);
      setSessionCost((prev) => prev + cost);
    }
  }, [apiKeys]);

  const handleSearch = useCallback(() => {
    executeSearch(query, numResults);
  }, [executeSearch, query, numResults]);

  const handleRerun = useCallback((entry: HistoryEntry) => {
    setQuery(entry.query);
    setNumResults(entry.numResults);
    setPendingQuery(entry.query);
  }, []);

  useEffect(() => {
    if (pendingQuery) {
      executeSearch(pendingQuery, numResults);
      setPendingQuery(null);
    }
  }, [pendingQuery, numResults, executeSearch]);

  const handleClearHistory = useCallback(() => {
    clearHistory();
    setHistory([]);
  }, []);

  const hasAnyKey = apiKeys.exa || apiKeys.brave;

  return (
    <div className="min-h-screen bg-[#0a0a0f] p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-exa to-brave rounded-lg">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Search Compare</h1>
              <p className="text-xs text-zinc-500">Exa vs Brave • Side-by-side comparison</p>
            </div>
          </div>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <Github className="w-5 h-5" />
          </a>
        </div>

        {/* API Keys */}
        <ApiKeyPanel apiKeys={apiKeys} onKeysChange={handleKeysChange} />

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('search')}
            className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors ${
              activeTab === 'search'
                ? 'bg-terminal-green/20 text-terminal-green border border-terminal-green/50'
                : 'bg-zinc-900/60 text-zinc-400 border border-zinc-800 hover:border-zinc-700'
            }`}
          >
            <Search className="w-4 h-4" />
            Search
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors ${
              activeTab === 'history'
                ? 'bg-terminal-green/20 text-terminal-green border border-terminal-green/50'
                : 'bg-zinc-900/60 text-zinc-400 border border-zinc-800 hover:border-zinc-700'
            }`}
          >
            <History className="w-4 h-4" />
            History
            {history.length > 0 && (
              <span className="bg-zinc-700 text-zinc-300 text-xs px-1.5 py-0.5 rounded">
                {history.length}
              </span>
            )}
          </button>
        </div>

        {/* Search Tab */}
        {activeTab === 'search' && (
          <>
            {/* Search Input */}
            <SearchInput
              query={query}
              numResults={numResults}
              isSearching={isSearching}
              onQueryChange={setQuery}
              onNumResultsChange={setNumResults}
              onSearch={handleSearch}
            />

            {/* Stats Grid */}
            <StatsGrid
              exaMetrics={exaResponse?.metrics ?? null}
              braveMetrics={braveResponse?.metrics ?? null}
              sessionTotalCost={sessionCost}
            />

            {/* Results Comparison */}
            {(exaResponse || braveResponse || isSearching) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ResultsColumn
                  provider="exa"
                  results={exaResponse?.results ?? []}
                  otherResults={braveResponse?.results ?? []}
                  isLoading={isSearching && !!apiKeys.exa}
                  error={exaResponse?.error}
                />
                <ResultsColumn
                  provider="brave"
                  results={braveResponse?.results ?? []}
                  otherResults={exaResponse?.results ?? []}
                  isLoading={isSearching && !!apiKeys.brave}
                  error={braveResponse?.error}
                />
              </div>
            )}

            {/* Empty State */}
            {!exaResponse && !braveResponse && !isSearching && (
              <div className="bg-zinc-900/40 border border-zinc-800 border-dashed rounded-lg p-12 text-center">
                <div className="text-zinc-600 mb-2">
                  {hasAnyKey
                    ? 'Enter a search query and click "Search Both" to compare results'
                    : 'Add your API keys above to start comparing search providers'}
                </div>
                <div className="text-xs text-zinc-700">
                  Get your API keys:{' '}
                  <a
                    href="https://dashboard.exa.ai"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-exa hover:underline"
                  >
                    Exa
                  </a>{' '}
                  •{' '}
                  <a
                    href="https://api-dashboard.search.brave.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brave hover:underline"
                  >
                    Brave
                  </a>
                </div>
              </div>
            )}
          </>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <HistoryView
            history={history}
            onRerun={handleRerun}
            onClear={handleClearHistory}
          />
        )}

        {/* Footer */}
        <div className="text-center text-xs text-zinc-600 pt-4">
          Pricing estimates: Exa $5/1K queries • Brave Free 2K/mo, then $5/1K
        </div>
      </div>
    </div>
  );
}

export default App;
