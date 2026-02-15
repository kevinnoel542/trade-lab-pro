import { TrendingUp, TrendingDown, Target, BarChart3, Trophy, AlertTriangle, Scale } from 'lucide-react';
import { TradeStats } from '@/lib/trade-types';

interface StatsGridProps {
  stats: TradeStats;
}

function StatCard({ label, value, icon: Icon, colorClass }: { label: string; value: string | number; icon: any; colorClass?: string }) {
  return (
    <div className="rounded-lg bg-card border border-border p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
        <Icon className={`h-4 w-4 ${colorClass || 'text-muted-foreground'}`} />
      </div>
      <span className={`text-2xl font-mono font-bold ${colorClass || 'text-foreground'}`}>{value}</span>
    </div>
  );
}

export function StatsGrid({ stats }: StatsGridProps) {
  const pnlColor = stats.totalPnl >= 0 ? 'text-profit' : 'text-loss';
  const wrColor = stats.winRate >= 50 ? 'text-profit' : stats.winRate >= 40 ? 'text-warning' : 'text-loss';

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
      <StatCard label="Total Trades" value={stats.totalTrades} icon={BarChart3} />
      <StatCard label="Win Rate" value={`${stats.winRate}%`} icon={Target} colorClass={wrColor} />
      <StatCard label="Total P&L" value={`$${stats.totalPnl.toLocaleString()}`} icon={stats.totalPnl >= 0 ? TrendingUp : TrendingDown} colorClass={pnlColor} />
      <StatCard label="Avg R-Multiple" value={`${stats.avgRMultiple}R`} icon={Scale} colorClass={stats.avgRMultiple >= 0 ? 'text-profit' : 'text-loss'} />
      <StatCard label="Best Trade" value={`$${stats.bestTrade.toLocaleString()}`} icon={Trophy} colorClass="text-profit" />
      <StatCard label="Worst Trade" value={`$${stats.worstTrade.toLocaleString()}`} icon={AlertTriangle} colorClass="text-loss" />
      <StatCard label="Profit Factor" value={stats.profitFactor} icon={Scale} colorClass={stats.profitFactor >= 1 ? 'text-profit' : 'text-loss'} />
    </div>
  );
}
