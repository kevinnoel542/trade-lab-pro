import { useMemo, useState } from 'react';
import { calculateRMultiple, calculatePnlDollar } from '@/lib/trade-types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { format, startOfWeek, startOfMonth, parseISO } from 'date-fns';

interface AnalyticsTrade {
  entryPrice: number;
  exitPrice: number | null;
  stopLoss: number;
  riskAmount: number;
  direction: 'Buy' | 'Sell';
  status: string;
  date: string;
}

interface PerformanceSummaryProps {
  trades: AnalyticsTrade[];
}

interface PeriodSummary {
  label: string;
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  totalPnl: number;
  avgR: number;
  bestTrade: number;
  worstTrade: number;
}

function groupTrades(trades: AnalyticsTrade[], groupBy: 'week' | 'month'): PeriodSummary[] {
  const closed = trades.filter(t => t.status === 'Closed' && t.exitPrice !== null);
  if (closed.length === 0) return [];

  const groups: Record<string, AnalyticsTrade[]> = {};
  closed.forEach(t => {
    const d = parseISO(t.date);
    const key = groupBy === 'week'
      ? format(startOfWeek(d, { weekStartsOn: 1 }), 'yyyy-MM-dd')
      : format(startOfMonth(d), 'yyyy-MM');
    if (!groups[key]) groups[key] = [];
    groups[key].push(t);
  });

  return Object.entries(groups)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([key, trades]) => {
      const results = trades.map(t => {
        const rMult = calculateRMultiple(t.entryPrice, t.exitPrice!, t.stopLoss, t.direction);
        const pnl = calculatePnlDollar(t.riskAmount, rMult);
        return { rMult, pnl };
      });
      const wins = results.filter(r => r.pnl > 0);
      const losses = results.filter(r => r.pnl < 0);
      const totalPnl = Math.round(results.reduce((s, r) => s + r.pnl, 0) * 100) / 100;
      const avgR = Math.round((results.reduce((s, r) => s + r.rMult, 0) / results.length) * 100) / 100;

      return {
        label: key,
        totalTrades: results.length,
        wins: wins.length,
        losses: losses.length,
        winRate: Math.round((wins.length / results.length) * 100),
        totalPnl,
        avgR,
        bestTrade: Math.round(Math.max(...results.map(r => r.pnl)) * 100) / 100,
        worstTrade: Math.round(Math.min(...results.map(r => r.pnl)) * 100) / 100,
      };
    });
}

export default function PerformanceSummary({ trades }: PerformanceSummaryProps) {
  const [period, setPeriod] = useState<'week' | 'month'>('week');
  const summaries = useMemo(() => groupTrades(trades, period), [trades, period]);

  if (summaries.length === 0) {
    return (
      <div className="rounded-lg bg-card border border-border p-6 text-center text-muted-foreground">
        <p>No closed trades for performance summaries</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-card border border-border">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="text-sm font-semibold">Performance Summary</h3>
        <Select value={period} onValueChange={(v) => setPeriod(v as 'week' | 'month')}>
          <SelectTrigger className="text-xs h-8 w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Weekly</SelectItem>
            <SelectItem value="month">Monthly</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-muted-foreground uppercase tracking-wider">
              <th className="text-left py-3 px-3">{period === 'week' ? 'Week Starting' : 'Month'}</th>
              <th className="text-center py-3 px-2">Trades</th>
              <th className="text-center py-3 px-2">W/L</th>
              <th className="text-center py-3 px-2">Win Rate</th>
              <th className="text-right py-3 px-2">Avg R</th>
              <th className="text-right py-3 px-2">P&L</th>
              <th className="text-right py-3 px-2">Best</th>
              <th className="text-right py-3 px-2">Worst</th>
            </tr>
          </thead>
          <tbody>
            {summaries.map(s => (
              <tr key={s.label} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                <td className="py-2.5 px-3 font-mono text-xs">{s.label}</td>
                <td className="py-2.5 px-2 text-center font-mono">{s.totalTrades}</td>
                <td className="py-2.5 px-2 text-center text-xs">
                  <span className="text-profit">{s.wins}W</span>{' / '}
                  <span className="text-loss">{s.losses}L</span>
                </td>
                <td className={`py-2.5 px-2 text-center font-mono font-semibold ${s.winRate >= 50 ? 'text-profit' : 'text-loss'}`}>
                  {s.winRate}%
                </td>
                <td className={`py-2.5 px-2 text-right font-mono ${s.avgR >= 0 ? 'text-profit' : 'text-loss'}`}>
                  {s.avgR}R
                </td>
                <td className="py-2.5 px-2 text-right font-mono font-semibold">
                  <span className={`inline-flex items-center gap-1 ${s.totalPnl >= 0 ? 'text-profit' : 'text-loss'}`}>
                    {s.totalPnl >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    ${Math.abs(s.totalPnl)}
                  </span>
                </td>
                <td className="py-2.5 px-2 text-right font-mono text-xs text-profit">${s.bestTrade}</td>
                <td className="py-2.5 px-2 text-right font-mono text-xs text-loss">${s.worstTrade}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
