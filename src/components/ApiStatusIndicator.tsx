import { useState, useRef, useEffect } from 'react';
import { Eye, EyeOff, Check, X, Loader2, ChevronDown } from 'lucide-react';
import type { ApiKeys } from '../types';
import { PROXY_URL } from '../lib/api';
import { loadApiStatus, saveApiStatus, type ApiKeyStatus } from '../lib/storage';

interface Props {
  apiKeys: ApiKeys;
  onKeysChange: (keys: ApiKeys) => void;
}

type KeyStatus = ApiKeyStatus | 'testing';

export function ApiStatusIndicator({ apiKeys, onKeysChange }: Props) {
  const [expandedProvider, setExpandedProvider] = useState<'exa' | 'brave' | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [exaStatus, setExaStatus] = useState<KeyStatus>('untested');
  const [braveStatus, setBraveStatus] = useState<KeyStatus>('untested');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load persisted status on mount
  useEffect(() => {
    const status = loadApiStatus();
    // Only restore status if the key still exists
    if (apiKeys.exa) {
      setExaStatus(status.exa);
    }
    if (apiKeys.brave) {
      setBraveStatus(status.brave);
    }
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setExpandedProvider(null);
        setShowPassword(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const persistStatus = (exa: ApiKeyStatus, brave: ApiKeyStatus) => {
    saveApiStatus({ exa, brave });
  };

  const testExaKey = async () => {
    if (!apiKeys.exa) return;
    setExaStatus('testing');
    try {
      const res = await fetch(`${PROXY_URL}/api/exa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKeys.exa },
        body: JSON.stringify({ query: 'test', numResults: 1 }),
      });
      const newStatus: ApiKeyStatus = res.ok ? 'valid' : 'invalid';
      setExaStatus(newStatus);
      persistStatus(newStatus, braveStatus === 'testing' ? 'untested' : braveStatus as ApiKeyStatus);
    } catch {
      setExaStatus('invalid');
      persistStatus('invalid', braveStatus === 'testing' ? 'untested' : braveStatus as ApiKeyStatus);
    }
  };

  const testBraveKey = async () => {
    if (!apiKeys.brave) return;
    setBraveStatus('testing');
    try {
      const res = await fetch(`${PROXY_URL}/api/brave?q=test&count=1`, {
        headers: { 'X-Subscription-Token': apiKeys.brave },
      });
      const newStatus: ApiKeyStatus = res.ok ? 'valid' : 'invalid';
      setBraveStatus(newStatus);
      persistStatus(exaStatus === 'testing' ? 'untested' : exaStatus as ApiKeyStatus, newStatus);
    } catch {
      setBraveStatus('invalid');
      persistStatus(exaStatus === 'testing' ? 'untested' : exaStatus as ApiKeyStatus, 'invalid');
    }
  };

  const getStatusColor = (status: KeyStatus, hasKey: boolean) => {
    if (!hasKey) return 'bg-zinc-600';
    if (status === 'valid') return 'bg-terminal-green';
    if (status === 'invalid') return 'bg-terminal-red';
    if (status === 'testing') return 'bg-terminal-amber animate-pulse';
    return 'bg-zinc-500';
  };

  const getStatusText = (status: KeyStatus, hasKey: boolean) => {
    if (!hasKey) return 'Not configured';
    if (status === 'valid') return 'Connected';
    if (status === 'invalid') return 'Invalid key';
    if (status === 'testing') return 'Testing...';
    return 'Not tested';
  };

  const StatusBadge = ({
    provider,
    status,
    hasKey
  }: {
    provider: 'exa' | 'brave';
    status: KeyStatus;
    hasKey: boolean;
  }) => {
    const isExpanded = expandedProvider === provider;
    const colorClass = provider === 'exa' ? 'text-exa' : 'text-brave';

    return (
      <button
        onClick={() => setExpandedProvider(isExpanded ? null : provider)}
        className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-colors
          ${isExpanded ? 'bg-zinc-800' : 'hover:bg-zinc-800/50'} ${colorClass}`}
      >
        <span className={`w-2 h-2 rounded-full ${getStatusColor(status, hasKey)}`} />
        <span className="capitalize">{provider}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
      </button>
    );
  };

  const ConfigDropdown = ({ provider }: { provider: 'exa' | 'brave' }) => {
    const isExa = provider === 'exa';
    const currentKey = isExa ? apiKeys.exa : apiKeys.brave;
    const status = isExa ? exaStatus : braveStatus;
    const setStatus = isExa ? setExaStatus : setBraveStatus;
    const testKey = isExa ? testExaKey : testBraveKey;
    const colorClass = isExa ? 'border-exa/30 focus:border-exa' : 'border-brave/30 focus:border-brave';
    const buttonClass = isExa ? 'bg-exa/20 hover:bg-exa/30 text-exa' : 'bg-brave/20 hover:bg-brave/30 text-brave';

    const handleKeyChange = (newKey: string) => {
      onKeysChange({
        ...apiKeys,
        [provider]: newKey
      });
      setStatus('untested');
      // Persist untested status when key changes
      if (isExa) {
        persistStatus('untested', braveStatus === 'testing' ? 'untested' : braveStatus as ApiKeyStatus);
      } else {
        persistStatus(exaStatus === 'testing' ? 'untested' : exaStatus as ApiKeyStatus, 'untested');
      }
    };

    return (
      <div className="absolute right-0 top-full mt-2 w-72 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl p-3 z-50">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-400">Status</span>
            <span className={`flex items-center gap-1.5 ${
              status === 'valid' ? 'text-terminal-green' :
              status === 'invalid' ? 'text-terminal-red' :
              status === 'testing' ? 'text-terminal-amber' : 'text-zinc-500'
            }`}>
              {status === 'testing' && <Loader2 className="w-3 h-3 animate-spin" />}
              {status === 'valid' && <Check className="w-3 h-3" />}
              {status === 'invalid' && <X className="w-3 h-3" />}
              {getStatusText(status, !!currentKey)}
            </span>
          </div>

          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={currentKey}
              onChange={(e) => handleKeyChange(e.target.value)}
              placeholder={`Enter ${provider === 'exa' ? 'Exa' : 'Brave'} API key...`}
              className={`w-full bg-zinc-950 border ${colorClass} rounded px-3 py-2 text-sm focus:outline-none pr-10`}
            />
            <button
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <button
            onClick={testKey}
            disabled={!currentKey || status === 'testing'}
            className={`w-full px-3 py-2 ${buttonClass} disabled:opacity-50 disabled:cursor-not-allowed rounded text-sm font-medium flex items-center justify-center gap-2`}
          >
            {status === 'testing' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Testing...
              </>
            ) : (
              'Test Connection'
            )}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="relative flex items-center gap-2" ref={dropdownRef}>
      <StatusBadge provider="exa" status={exaStatus} hasKey={!!apiKeys.exa} />
      <StatusBadge provider="brave" status={braveStatus} hasKey={!!apiKeys.brave} />

      {expandedProvider && <ConfigDropdown provider={expandedProvider} />}
    </div>
  );
}
