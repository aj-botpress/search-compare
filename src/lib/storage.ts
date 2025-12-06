import type { ApiKeys, HistoryEntry } from '../types';

const STORAGE_KEYS = {
  API_KEYS: 'search-compare-api-keys',
  HISTORY: 'search-compare-history',
} as const;

const MAX_HISTORY_ENTRIES = 50;

export function saveApiKeys(keys: ApiKeys): void {
  try {
    const encoded = btoa(JSON.stringify(keys));
    localStorage.setItem(STORAGE_KEYS.API_KEYS, encoded);
  } catch (e) {
    console.error('Failed to save API keys:', e);
  }
}

export function loadApiKeys(): ApiKeys {
  try {
    const encoded = localStorage.getItem(STORAGE_KEYS.API_KEYS);
    if (!encoded) return { exa: '', brave: '' };
    return JSON.parse(atob(encoded));
  } catch (e) {
    console.error('Failed to load API keys:', e);
    return { exa: '', brave: '' };
  }
}

export function saveHistory(history: HistoryEntry[]): void {
  try {
    const trimmed = history.slice(0, MAX_HISTORY_ENTRIES);
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(trimmed));
  } catch (e) {
    console.error('Failed to save history:', e);
  }
}

export function loadHistory(): HistoryEntry[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.HISTORY);
    if (!data) return [];
    return JSON.parse(data);
  } catch (e) {
    console.error('Failed to load history:', e);
    return [];
  }
}

export function addHistoryEntry(entry: HistoryEntry): HistoryEntry[] {
  const history = loadHistory();
  const updated = [entry, ...history].slice(0, MAX_HISTORY_ENTRIES);
  saveHistory(updated);
  return updated;
}

export function clearHistory(): void {
  localStorage.removeItem(STORAGE_KEYS.HISTORY);
}

export function clearAllData(): void {
  localStorage.removeItem(STORAGE_KEYS.API_KEYS);
  localStorage.removeItem(STORAGE_KEYS.HISTORY);
}

export function exportHistoryToCsv(history: HistoryEntry[]): string {
  const headers = ['Query', 'Results', 'Exa Latency (ms)', 'Brave Latency (ms)', 'Winner', 'Exa Cost', 'Brave Cost', 'Timestamp'];
  const rows = history.map(h => {
    const winner = !h.exa ? 'Brave' : !h.brave ? 'Exa' :
      h.exa.latencyMs < h.brave.latencyMs ? 'Exa' : 'Brave';
    return [
      `"${h.query.replace(/"/g, '""')}"`,
      h.numResults,
      h.exa?.latencyMs ?? 'N/A',
      h.brave?.latencyMs ?? 'N/A',
      winner,
      h.exa?.costUsd?.toFixed(4) ?? 'N/A',
      h.brave?.costUsd?.toFixed(4) ?? 'N/A',
      new Date(h.timestamp).toISOString(),
    ].join(',');
  });
  return [headers.join(','), ...rows].join('\n');
}
