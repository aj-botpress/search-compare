import { Clock, Hash, DollarSign, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { SearchMetrics } from '../types';

interface Props {
  exaMetrics: SearchMetrics | null;
  braveMetrics: SearchMetrics | null;
  sessionTotalCost: number;
}

export function StatsGrid({ exaMetrics, braveMetrics, sessionTotalCost }: Props) {
  const latencyDelta = exaMetrics && braveMetrics
    ? exaMetrics.latencyMs - braveMetrics.latencyMs
    : null;

  const latencyWinner = latencyDelta === null ? null : latencyDelta > 0 ? 'brave' : latencyDelta < 0 ? 'exa' : 'tie';

  const formatLatency = (ms: number | undefined) => ms !== undefined ? `${ms}ms` : '—';
  const formatCost = (cost: number | undefined) => cost !== undefined ? `$${cost.toFixed(4)}` : '—';

  const StatBox = ({
    label,
    value,
    subValue,
    icon: Icon,
    highlight,
  }: {
    label: string;
    value: string;
    subValue?: string;
    icon: typeof Clock;
    highlight?: 'exa' | 'brave' | 'green' | null;
  }) => (
    <div className={`bg-zinc-900/60 border rounded-lg p-3 ${
      highlight === 'exa' ? 'border-exa/50' :
      highlight === 'brave' ? 'border-brave/50' :
      highlight === 'green' ? 'border-terminal-green/50' :
      'border-zinc-800'
    }`}>
      <div className="flex items-center gap-2 text-xs text-zinc-500 uppercase tracking-wider mb-1">
        <Icon className="w-3 h-3" />
        {label}
      </div>
      <div className={`text-xl font-bold ${
        highlight === 'exa' ? 'text-exa' :
        highlight === 'brave' ? 'text-brave' :
        highlight === 'green' ? 'text-terminal-green' :
        'text-zinc-100'
      }`}>
        {value}
      </div>
      {subValue && <div className="text-xs text-zinc-500 mt-1">{subValue}</div>}
    </div>
  );

  const DeltaBox = ({ value, unit }: { value: number | null; unit: string }) => {
    if (value === null) return (
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-3">
        <div className="flex items-center gap-2 text-xs text-zinc-500 uppercase tracking-wider mb-1">
          <TrendingUp className="w-3 h-3" />
          Delta
        </div>
        <div className="text-xl font-bold text-zinc-500">—</div>
      </div>
    );

    const isPositive = value > 0;
    const Icon = value > 0 ? TrendingUp : value < 0 ? TrendingDown : Minus;
    const color = value > 0 ? 'text-brave' : value < 0 ? 'text-exa' : 'text-zinc-400';

    return (
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-3">
        <div className="flex items-center gap-2 text-xs text-zinc-500 uppercase tracking-wider mb-1">
          <Icon className="w-3 h-3" />
          Delta
        </div>
        <div className={`text-xl font-bold ${color}`}>
          {isPositive ? '+' : ''}{value}{unit}
        </div>
        <div className="text-xs text-zinc-500 mt-1">
          {value > 0 ? 'Brave faster' : value < 0 ? 'Exa faster' : 'Tie'}
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
      <StatBox
        label="Exa Latency"
        value={formatLatency(exaMetrics?.latencyMs)}
        icon={Clock}
        highlight={latencyWinner === 'exa' ? 'exa' : null}
      />
      <StatBox
        label="Brave Latency"
        value={formatLatency(braveMetrics?.latencyMs)}
        icon={Clock}
        highlight={latencyWinner === 'brave' ? 'brave' : null}
      />
      <DeltaBox value={latencyDelta} unit="ms" />
      <StatBox
        label="Exa Results"
        value={exaMetrics?.resultCount?.toString() ?? '—'}
        icon={Hash}
        highlight="exa"
      />
      <StatBox
        label="Brave Results"
        value={braveMetrics?.resultCount?.toString() ?? '—'}
        icon={Hash}
        highlight="brave"
      />
      <StatBox
        label="Exa Cost"
        value={formatCost(exaMetrics?.costUsd)}
        icon={DollarSign}
        highlight="exa"
      />
      <StatBox
        label="Brave Cost"
        value={formatCost(braveMetrics?.costUsd)}
        icon={DollarSign}
        highlight="brave"
      />
      <StatBox
        label="Session Total"
        value={`$${sessionTotalCost.toFixed(3)}`}
        icon={DollarSign}
        highlight="green"
      />
    </div>
  );
}
