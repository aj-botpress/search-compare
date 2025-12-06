import { useState, useEffect, useCallback } from 'react';
import { Zap, Menu, X } from 'lucide-react';
import { ApiStatusIndicator } from './components/ApiStatusIndicator';
import { SearchInput } from './components/SearchInput';
import { ResultsColumn } from './components/ResultsColumn';
import { HistorySidebar } from './components/HistorySidebar';
import { searchExa, searchBrave } from './lib/api';
import { loadApiKeys, saveApiKeys, loadHistory, addHistoryEntry, clearHistory } from './lib/storage';
import type { ApiKeys, SearchResponse, HistoryEntry, SearchMetrics, SearchOptions } from './types';

function App() {
  const [apiKeys, setApiKeys] = useState<ApiKeys>({ exa: '', brave: '' });
  const [query, setQuery] = useState('');
  const [searchOptions, setSearchOptions] = useState<SearchOptions>({
    numResults: 10,
    exa: {
      type: 'auto',
      category: '',
      useAutoprompt: true,
    },
    brave: {
      country: 'us',
      searchLang: 'en',
      safesearch: 'moderate',
      freshness: '',
      extraSnippets: true,
      spellcheck: true,
    },
  });
  const [isSearching, setIsSearching] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [sessionCost, setSessionCost] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Current view state - either from a new search or viewing history
  const [currentView, setCurrentView] = useState<{
    query: string;
    exaMetrics: SearchMetrics | null;
    braveMetrics: SearchMetrics | null;
    exaResults: SearchResponse['results'];
    braveResults: SearchResponse['results'];
    exaError?: string;
    braveError?: string;
  } | null>(null);

  // Check for mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setSidebarOpen(true);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Derived state: has any results to show?
  const hasResults = currentView !== null;

  useEffect(() => {
    setApiKeys(loadApiKeys());
    setHistory(loadHistory());
  }, []);

  const handleKeysChange = useCallback((keys: ApiKeys) => {
    setApiKeys(keys);
    saveApiKeys(keys);
  }, []);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;

    setIsSearching(true);
    // Clear current view while searching
    setCurrentView(null);

    const results: { exa: SearchResponse | null; brave: SearchResponse | null } = {
      exa: null,
      brave: null,
    };

    const searchPromises: Promise<void>[] = [];

    if (apiKeys.exa) {
      searchPromises.push(
        searchExa(query, apiKeys.exa, searchOptions).then((res) => {
          results.exa = res;
        })
      );
    }

    if (apiKeys.brave) {
      searchPromises.push(
        searchBrave(query, apiKeys.brave, searchOptions).then((res) => {
          results.brave = res;
        })
      );
    }

    await Promise.allSettled(searchPromises);
    setIsSearching(false);

    // Set current view with results
    if (results.exa || results.brave) {
      setCurrentView({
        query,
        exaMetrics: results.exa?.metrics ?? null,
        braveMetrics: results.brave?.metrics ?? null,
        exaResults: results.exa?.results ?? [],
        braveResults: results.brave?.results ?? [],
        exaError: results.exa?.error,
        braveError: results.brave?.error,
      });

      // Add to history
      const entry: HistoryEntry = {
        id: crypto.randomUUID(),
        query,
        numResults: searchOptions.numResults,
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

      // Clear the search input for next search
      setQuery('');
    }
  }, [apiKeys, query, searchOptions]);

  // View a history entry (no API call, just display stored results)
  const handleViewHistory = useCallback((entry: HistoryEntry) => {
    setCurrentView({
      query: entry.query,
      exaMetrics: entry.exa,
      braveMetrics: entry.brave,
      exaResults: entry.exaResults ?? [],
      braveResults: entry.braveResults ?? [],
    });

    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [isMobile]);

  const handleClearHistory = useCallback(() => {
    clearHistory();
    setHistory([]);
    setCurrentView(null);
  }, []);

  // Go back to initial search view
  const handleNewSearch = useCallback(() => {
    setCurrentView(null);
    setQuery('');
  }, []);

  const hasAnyKey = apiKeys.exa || apiKeys.brave;

  return (
    <div className="flex h-screen bg-[#0a0a0f]">
      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`${
          isMobile
            ? `fixed inset-y-0 left-0 z-50 w-[280px] transform transition-transform duration-300 ${
                sidebarOpen ? 'translate-x-0' : '-translate-x-full'
              }`
            : `${sidebarOpen ? 'w-[280px]' : 'w-0'} transition-all duration-300 overflow-hidden`
        } border-r border-zinc-800 flex flex-col bg-zinc-950 shrink-0`}
      >
        {/* Sidebar Header with Logo */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-zinc-800">
          <div className="p-1.5 bg-gradient-to-br from-exa to-brave rounded-lg">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-sm font-bold">Search Compare</h1>
            <p className="text-xs text-zinc-500">Exa vs Brave</p>
          </div>
          {isMobile && (
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* History Sidebar */}
        <HistorySidebar
          history={history}
          onSelect={handleViewHistory}
          onClear={handleClearHistory}
          onNewSearch={handleNewSearch}
          selectedQuery={currentView?.query}
        />
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-14 border-b border-zinc-800 flex items-center px-4 gap-4 shrink-0">
          {/* Sidebar Toggle */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-zinc-200"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Compact Search (only when viewing results) */}
          {hasResults && (
            <SearchInput
              query={query}
              options={searchOptions}
              isSearching={isSearching}
              onQueryChange={setQuery}
              onOptionsChange={setSearchOptions}
              onSearch={handleSearch}
              variant="compact"
            />
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* API Status Indicator */}
          <ApiStatusIndicator apiKeys={apiKeys} onKeysChange={handleKeysChange} />
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          {!hasResults && !isSearching ? (
            /* Centered Search View */
            <div className="h-full flex flex-col items-center justify-center px-4">
              <div className="w-full max-w-2xl">
                {/* Title */}
                <h2 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-exa to-brave bg-clip-text text-transparent">
                  Search Compare
                </h2>

                {/* Centered Search Input */}
                <SearchInput
                  query={query}
                  options={searchOptions}
                  isSearching={isSearching}
                  onQueryChange={setQuery}
                  onOptionsChange={setSearchOptions}
                  onSearch={handleSearch}
                  variant="centered"
                />

                {/* Helper text */}
                {!hasAnyKey && (
                  <div className="text-center mt-8 text-zinc-500 text-sm">
                    <p>Configure your API keys to start comparing</p>
                    <div className="mt-2 text-xs">
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
              </div>
            </div>
          ) : (
            /* Results View */
            <div className="p-4 md:p-6 space-y-4 max-w-7xl mx-auto">
              {/* Current Query Title */}
              {currentView && (
                <div className="flex items-center justify-between">
                  <div className="text-sm text-zinc-500">
                    Results for: <span className="text-zinc-200 font-medium">"{currentView.query}"</span>
                  </div>
                  <div className="text-xs text-zinc-600">
                    Session total: <span className="text-terminal-green">${sessionCost.toFixed(4)}</span>
                  </div>
                </div>
              )}

              {/* Results Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ResultsColumn
                  provider="exa"
                  results={currentView?.exaResults ?? []}
                  otherResults={currentView?.braveResults ?? []}
                  metrics={currentView?.exaMetrics ?? null}
                  otherMetrics={currentView?.braveMetrics ?? null}
                  isLoading={isSearching && !!apiKeys.exa}
                  error={currentView?.exaError}
                />
                <ResultsColumn
                  provider="brave"
                  results={currentView?.braveResults ?? []}
                  otherResults={currentView?.exaResults ?? []}
                  metrics={currentView?.braveMetrics ?? null}
                  otherMetrics={currentView?.exaMetrics ?? null}
                  isLoading={isSearching && !!apiKeys.brave}
                  error={currentView?.braveError}
                />
              </div>

              {/* Footer */}
              <div className="text-center text-xs text-zinc-600 pt-4">
                Pricing estimates: Exa $5/1K queries • Brave Free 2K/mo, then $5/1K
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
