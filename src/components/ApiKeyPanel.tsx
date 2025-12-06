import { useState } from 'react';
import { Eye, EyeOff, Check, X, Loader2 } from 'lucide-react';
import type { ApiKeys } from '../types';

interface Props {
  apiKeys: ApiKeys;
  onKeysChange: (keys: ApiKeys) => void;
}

type KeyStatus = 'untested' | 'testing' | 'valid' | 'invalid';

export function ApiKeyPanel({ apiKeys, onKeysChange }: Props) {
  const [showExa, setShowExa] = useState(false);
  const [showBrave, setShowBrave] = useState(false);
  const [exaStatus, setExaStatus] = useState<KeyStatus>('untested');
  const [braveStatus, setBraveStatus] = useState<KeyStatus>('untested');

  const testExaKey = async () => {
    if (!apiKeys.exa) return;
    setExaStatus('testing');
    try {
      const res = await fetch('/api/exa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKeys.exa },
        body: JSON.stringify({ query: 'test', numResults: 1 }),
      });
      setExaStatus(res.ok ? 'valid' : 'invalid');
    } catch {
      setExaStatus('invalid');
    }
  };

  const testBraveKey = async () => {
    if (!apiKeys.brave) return;
    setBraveStatus('testing');
    try {
      const res = await fetch('/api/brave?q=test&count=1', {
        headers: { 'X-Subscription-Token': apiKeys.brave },
      });
      setBraveStatus(res.ok ? 'valid' : 'invalid');
    } catch {
      setBraveStatus('invalid');
    }
  };

  const StatusIcon = ({ status }: { status: KeyStatus }) => {
    if (status === 'testing') return <Loader2 className="w-4 h-4 animate-spin text-terminal-amber" />;
    if (status === 'valid') return <Check className="w-4 h-4 text-terminal-green" />;
    if (status === 'invalid') return <X className="w-4 h-4 text-terminal-red" />;
    return <div className="w-4 h-4 rounded-full border border-zinc-600" />;
  };

  return (
    <div className="bg-zinc-900/80 border border-zinc-800 rounded-lg p-4">
      <div className="text-xs text-zinc-500 uppercase tracking-wider mb-3">API Configuration</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Exa Key */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm text-exa font-medium">
            <span className="w-2 h-2 rounded-full bg-exa" />
            Exa API Key
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type={showExa ? 'text' : 'password'}
                value={apiKeys.exa}
                onChange={(e) => {
                  onKeysChange({ ...apiKeys, exa: e.target.value });
                  setExaStatus('untested');
                }}
                placeholder="Enter Exa API key..."
                className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-exa pr-10"
              />
              <button
                onClick={() => setShowExa(!showExa)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              >
                {showExa ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <button
              onClick={testExaKey}
              disabled={!apiKeys.exa || exaStatus === 'testing'}
              className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed rounded text-sm flex items-center gap-2"
            >
              <StatusIcon status={exaStatus} />
              Test
            </button>
          </div>
        </div>

        {/* Brave Key */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm text-brave font-medium">
            <span className="w-2 h-2 rounded-full bg-brave" />
            Brave API Key
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type={showBrave ? 'text' : 'password'}
                value={apiKeys.brave}
                onChange={(e) => {
                  onKeysChange({ ...apiKeys, brave: e.target.value });
                  setBraveStatus('untested');
                }}
                placeholder="Enter Brave API key..."
                className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-brave pr-10"
              />
              <button
                onClick={() => setShowBrave(!showBrave)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              >
                {showBrave ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <button
              onClick={testBraveKey}
              disabled={!apiKeys.brave || braveStatus === 'testing'}
              className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed rounded text-sm flex items-center gap-2"
            >
              <StatusIcon status={braveStatus} />
              Test
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
