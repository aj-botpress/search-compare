import { useState, useRef, useEffect } from 'react';
import { Search, Loader2, SlidersHorizontal, Send } from 'lucide-react';
import type { SearchOptions } from '../types';

interface Props {
  query: string;
  options: SearchOptions;
  isSearching: boolean;
  onQueryChange: (query: string) => void;
  onOptionsChange: (options: SearchOptions) => void;
  onSearch: () => void;
  variant?: 'centered' | 'compact';
}

const EXA_CATEGORIES = [
  { value: '', label: 'All' },
  { value: 'company', label: 'Company' },
  { value: 'research paper', label: 'Research Paper' },
  { value: 'news', label: 'News' },
  { value: 'pdf', label: 'PDF' },
  { value: 'github', label: 'GitHub' },
  { value: 'tweet', label: 'Tweet' },
  { value: 'personal site', label: 'Personal Site' },
  { value: 'linkedin profile', label: 'LinkedIn' },
];

const BRAVE_FRESHNESS = [
  { value: '', label: 'Any time' },
  { value: 'pd', label: 'Past 24 hours' },
  { value: 'pw', label: 'Past week' },
  { value: 'pm', label: 'Past month' },
  { value: 'py', label: 'Past year' },
];

const COUNTRIES = [
  { value: 'us', label: 'United States' },
  { value: 'gb', label: 'United Kingdom' },
  { value: 'ca', label: 'Canada' },
  { value: 'au', label: 'Australia' },
  { value: 'de', label: 'Germany' },
  { value: 'fr', label: 'France' },
  { value: 'jp', label: 'Japan' },
  { value: 'in', label: 'India' },
];

export function SearchInput({
  query,
  options,
  isSearching,
  onQueryChange,
  onOptionsChange,
  onSearch,
  variant = 'centered',
}: Props) {
  const [showOptions, setShowOptions] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'exa' | 'brave'>('general');
  const optionsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (optionsRef.current && !optionsRef.current.contains(event.target as Node)) {
        setShowOptions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 120) + 'px';
    }
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isSearching && query.trim()) {
      e.preventDefault();
      onSearch();
    }
  };

  const updateExaOption = <K extends keyof SearchOptions['exa']>(key: K, value: SearchOptions['exa'][K]) => {
    onOptionsChange({
      ...options,
      exa: { ...options.exa, [key]: value },
    });
  };

  const updateBraveOption = <K extends keyof SearchOptions['brave']>(key: K, value: SearchOptions['brave'][K]) => {
    onOptionsChange({
      ...options,
      brave: { ...options.brave, [key]: value },
    });
  };

  // Toggle component
  const Toggle = ({ enabled, onChange, color = 'green' }: { enabled: boolean; onChange: () => void; color?: 'green' | 'exa' | 'brave' }) => {
    const colorClasses = {
      green: 'bg-terminal-green',
      exa: 'bg-exa',
      brave: 'bg-brave',
    };
    return (
      <button
        onClick={onChange}
        className={`w-10 h-5 rounded-full transition-colors flex items-center ${
          enabled ? colorClasses[color] : 'bg-zinc-700'
        }`}
      >
        <div className={`w-4 h-4 rounded-full bg-white transition-transform mx-0.5 ${
          enabled ? 'translate-x-5' : 'translate-x-0'
        }`} />
      </button>
    );
  };

  // Full options dropdown with tabs
  const OptionsDropdown = () => (
    <div className="absolute left-0 bottom-full mb-2 bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl z-50 w-[360px] max-h-[70vh] overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-zinc-800">
        {(['general', 'exa', 'brave'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
              activeTab === tab
                ? tab === 'exa' ? 'text-exa border-b-2 border-exa bg-exa/5'
                : tab === 'brave' ? 'text-brave border-b-2 border-brave bg-brave/5'
                : 'text-terminal-green border-b-2 border-terminal-green bg-terminal-green/5'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-3 max-h-[calc(70vh-40px)] overflow-y-auto">
        {activeTab === 'general' && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">Results per provider</label>
              <div className="flex gap-1.5">
                {[5, 10, 20, 25].map((num) => (
                  <button
                    key={num}
                    onClick={() => onOptionsChange({ ...options, numResults: num })}
                    className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition-colors ${
                      options.numResults === num
                        ? 'bg-terminal-green/20 text-terminal-green'
                        : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'exa' && (
          <div className="space-y-3">
            {/* Search Type */}
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">Search Type</label>
              <div className="flex gap-1.5">
                {(['auto', 'neural', 'keyword'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => updateExaOption('type', type)}
                    className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition-colors capitalize ${
                      options.exa.type === type
                        ? 'bg-exa/20 text-exa'
                        : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">Category Filter</label>
              <select
                value={options.exa.category || ''}
                onChange={(e) => updateExaOption('category', e.target.value as any)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-exa"
              >
                {EXA_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            {/* Use Autoprompt */}
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs text-zinc-300">Use Autoprompt</label>
                <span className="text-[10px] text-zinc-500">Enhance query automatically</span>
              </div>
              <Toggle
                enabled={options.exa.useAutoprompt ?? true}
                onChange={() => updateExaOption('useAutoprompt', !options.exa.useAutoprompt)}
                color="exa"
              />
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">Date Range</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={options.exa.startPublishedDate || ''}
                  onChange={(e) => updateExaOption('startPublishedDate', e.target.value || undefined)}
                  placeholder="From"
                  className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-exa"
                />
                <input
                  type="date"
                  value={options.exa.endPublishedDate || ''}
                  onChange={(e) => updateExaOption('endPublishedDate', e.target.value || undefined)}
                  placeholder="To"
                  className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-exa"
                />
              </div>
            </div>

            {/* Include Domains */}
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">Include Domains (comma-separated)</label>
              <input
                type="text"
                value={options.exa.includeDomains?.join(', ') || ''}
                onChange={(e) => updateExaOption('includeDomains', e.target.value ? e.target.value.split(',').map(s => s.trim()) : undefined)}
                placeholder="example.com, site.org"
                className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-exa"
              />
            </div>

            {/* Exclude Domains */}
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">Exclude Domains (comma-separated)</label>
              <input
                type="text"
                value={options.exa.excludeDomains?.join(', ') || ''}
                onChange={(e) => updateExaOption('excludeDomains', e.target.value ? e.target.value.split(',').map(s => s.trim()) : undefined)}
                placeholder="spam.com, ads.net"
                className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-exa"
              />
            </div>
          </div>
        )}

        {activeTab === 'brave' && (
          <div className="space-y-3">
            {/* Time Range */}
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">Time Range</label>
              <select
                value={options.brave.freshness || ''}
                onChange={(e) => updateBraveOption('freshness', e.target.value as any)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-brave"
              >
                {BRAVE_FRESHNESS.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>

            {/* Safe Search */}
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">Safe Search</label>
              <div className="flex gap-1.5">
                {(['off', 'moderate', 'strict'] as const).map((level) => (
                  <button
                    key={level}
                    onClick={() => updateBraveOption('safesearch', level)}
                    className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition-colors capitalize ${
                      options.brave.safesearch === level
                        ? 'bg-brave/20 text-brave'
                        : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* Country */}
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">Country</label>
              <select
                value={options.brave.country || 'us'}
                onChange={(e) => updateBraveOption('country', e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-brave"
              >
                {COUNTRIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            {/* Language */}
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">Search Language</label>
              <select
                value={options.brave.searchLang || 'en'}
                onChange={(e) => updateBraveOption('searchLang', e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-brave"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="ja">Japanese</option>
                <option value="zh">Chinese</option>
              </select>
            </div>

            {/* Extra Snippets */}
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs text-zinc-300">Extra Snippets</label>
                <span className="text-[10px] text-zinc-500">Up to 5 alternative excerpts</span>
              </div>
              <Toggle
                enabled={options.brave.extraSnippets ?? true}
                onChange={() => updateBraveOption('extraSnippets', !options.brave.extraSnippets)}
                color="brave"
              />
            </div>

            {/* Spellcheck */}
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs text-zinc-300">Spellcheck</label>
                <span className="text-[10px] text-zinc-500">Auto-correct queries</span>
              </div>
              <Toggle
                enabled={options.brave.spellcheck ?? true}
                onChange={() => updateBraveOption('spellcheck', !options.brave.spellcheck)}
                color="brave"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (variant === 'compact') {
    return (
      <div className="flex-1 max-w-xl relative" ref={optionsRef}>
        <div className="relative flex items-center bg-zinc-900 border border-zinc-700 rounded-full overflow-hidden focus-within:border-terminal-green transition-colors">
          <Search className="ml-3 w-4 h-4 text-zinc-500 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search..."
            className="flex-1 bg-transparent px-2 py-2 text-sm focus:outline-none min-w-0"
          />
          <button
            onClick={() => setShowOptions(!showOptions)}
            className={`p-2 transition-colors shrink-0 ${showOptions ? 'text-terminal-green' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
          <button
            onClick={onSearch}
            disabled={isSearching || !query.trim()}
            className="p-2 mr-1 text-terminal-green disabled:text-zinc-600 disabled:cursor-not-allowed transition-colors shrink-0"
          >
            {isSearching ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
        {/* Options dropdown - positioned below for compact */}
        {showOptions && (
          <div className="absolute left-0 top-full mt-2 bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl z-50 w-[360px] max-h-[70vh] overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-zinc-800">
              {(['general', 'exa', 'brave'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
                    activeTab === tab
                      ? tab === 'exa' ? 'text-exa border-b-2 border-exa bg-exa/5'
                      : tab === 'brave' ? 'text-brave border-b-2 border-brave bg-brave/5'
                      : 'text-terminal-green border-b-2 border-terminal-green bg-terminal-green/5'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
            {/* Render same content as OptionsDropdown */}
            <div className="p-3 max-h-[calc(70vh-40px)] overflow-y-auto">
              {activeTab === 'general' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1.5">Results per provider</label>
                    <div className="flex gap-1.5">
                      {[5, 10, 20, 25].map((num) => (
                        <button
                          key={num}
                          onClick={() => onOptionsChange({ ...options, numResults: num })}
                          className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition-colors ${
                            options.numResults === num
                              ? 'bg-terminal-green/20 text-terminal-green'
                              : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {activeTab === 'exa' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1.5">Search Type</label>
                    <div className="flex gap-1.5">
                      {(['auto', 'neural', 'keyword'] as const).map((type) => (
                        <button
                          key={type}
                          onClick={() => updateExaOption('type', type)}
                          className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition-colors capitalize ${
                            options.exa.type === type
                              ? 'bg-exa/20 text-exa'
                              : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1.5">Category Filter</label>
                    <select
                      value={options.exa.category || ''}
                      onChange={(e) => updateExaOption('category', e.target.value as SearchOptions['exa']['category'])}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-exa"
                    >
                      {EXA_CATEGORIES.map((cat) => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-xs text-zinc-300">Use Autoprompt</label>
                      <span className="text-[10px] text-zinc-500">Enhance query automatically</span>
                    </div>
                    <Toggle
                      enabled={options.exa.useAutoprompt ?? true}
                      onChange={() => updateExaOption('useAutoprompt', !options.exa.useAutoprompt)}
                      color="exa"
                    />
                  </div>
                </div>
              )}
              {activeTab === 'brave' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1.5">Time Range</label>
                    <select
                      value={options.brave.freshness || ''}
                      onChange={(e) => updateBraveOption('freshness', e.target.value as SearchOptions['brave']['freshness'])}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-brave"
                    >
                      {BRAVE_FRESHNESS.map((f) => (
                        <option key={f.value} value={f.value}>{f.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1.5">Safe Search</label>
                    <div className="flex gap-1.5">
                      {(['off', 'moderate', 'strict'] as const).map((level) => (
                        <button
                          key={level}
                          onClick={() => updateBraveOption('safesearch', level)}
                          className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition-colors capitalize ${
                            options.brave.safesearch === level
                              ? 'bg-brave/20 text-brave'
                              : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                          }`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-xs text-zinc-300">Extra Snippets</label>
                      <span className="text-[10px] text-zinc-500">Up to 5 alternative excerpts</span>
                    </div>
                    <Toggle
                      enabled={options.brave.extraSnippets ?? true}
                      onChange={() => updateBraveOption('extraSnippets', !options.brave.extraSnippets)}
                      color="brave"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Centered variant (default) - Gemini style with everything inside
  return (
    <div className="w-full max-w-2xl mx-auto relative" ref={optionsRef}>
      <div className="bg-zinc-900 border border-zinc-700 rounded-3xl focus-within:border-zinc-600 transition-colors overflow-hidden">
        {/* Text input area */}
        <div className="px-4 pt-4 pb-2">
          <textarea
            ref={inputRef}
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter your search query..."
            rows={1}
            className="w-full bg-transparent text-base resize-none focus:outline-none placeholder:text-zinc-500"
            style={{ minHeight: '24px', maxHeight: '120px' }}
          />
        </div>

        {/* Bottom toolbar inside the search box */}
        <div className="flex items-center justify-between px-3 pb-3">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowOptions(!showOptions)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors ${
                showOptions
                  ? 'bg-zinc-800 text-terminal-green'
                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Options</span>
            </button>
          </div>

          <button
            onClick={onSearch}
            disabled={isSearching || !query.trim()}
            className="p-2.5 bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-800 disabled:text-zinc-600 text-terminal-green rounded-full transition-colors disabled:cursor-not-allowed"
          >
            {isSearching ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Options dropdown - positioned above */}
      {showOptions && <OptionsDropdown />}
    </div>
  );
}
