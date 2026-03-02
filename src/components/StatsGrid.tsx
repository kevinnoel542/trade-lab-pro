import { TrendingUp, TrendingDown, Target, BarChart3, Scale, Zap, Activity } from 'lucide-react';
import { TradeStats } from '@/lib/trade-types';

interface StatsGridProps {
  stats: TradeStats;
}

function StatCard({
  label, value, icon: Icon, colorClass, sub, trend
}: {
  label: string; value: string | number; icon: any; colorClass?: string; sub?: string; trend?: 'up' | 'down' | null;
}) {
  return (
    <div className="rounded-xl bg-card border border-border/60 p-4 flex flex-col gap-2.5 relative overflow-hidden group hover:border-border transition-all duration-200">
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{label}</span>
        <div className="h-7 w-7 rounded-lg flex items-center justify-center bg-secondary/60">
          <Icon className={`h-3.5 w-3.5 ${colorClass || 'text-muted-foreground'}`} />
        </div>
      </div>
      <span className={`text-2xl font-mono font-bold tracking-tight ${colorClass || 'text-foreground'}`}>{value}</span>
      {sub && <span className="text-[10px] text-muted-foreground leading-tight">{sub}</span>}
    </div>
  );
}

export function StatsGrid({ stats }: StatsGridProps) {
  const pnlColor = stats.totalPnl >= 0 ? 'text-profit' : 'text-loss';
  const wrColor = stats.winRate >= 50 ? 'text-profit' : stats.winRate >= 40 ? 'text-yellow-400' : 'text-loss';

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      <StatCard
        label="Total Trades" value={stats.totalTrades} icon={BarChart3}
        sub={`${stats.openTrades ?? 0} open · ${stats.closedTrades ?? 0} closed`}
      />
      <StatCard
        label="Win Rate" value={`${stats.winRate}%`} icon={Target} colorClass={wrColor}
        sub={stats.winRate >= 50 ? 'Above benchmark' : 'Below benchmark'}
      />
      <StatCard
        label="Total P&L" value={`$${stats.totalPnl.toLocaleString()}`}
        icon={stats.totalPnl >= 0 ? TrendingUp : TrendingDown} colorClass={pnlColor}
        sub="Net realized P&L"
      />
      <StatCard
        label="Avg R-Multiple" value={`${stats.avgRMultiple}R`} icon={Scale}
        colorClass={stats.avgRMultiple >= 0 ? 'text-profit' : 'text-loss'}
        sub="Mean per closed trade"
      />
      <StatCard
        label="Expectancy" value={`$${stats.expectancy}`} icon={Zap}
        colorClass={stats.expectancy >= 0 ? 'text-profit' : 'text-loss'}
        sub="Expected $ per trade"
      />
      <StatCard
        label="Profit Factor" value={stats.profitFactor} icon={Activity}
        colorClass={stats.profitFactor >= 1 ? 'text-profit' : 'text-loss'}
        sub={stats.profitFactor >= 1 ? 'Profitable system' : 'Unprofitable'}
      />
    </div>
  );
}
