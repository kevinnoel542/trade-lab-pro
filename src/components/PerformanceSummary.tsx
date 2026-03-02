import { useMemo, useState } from 'react';
import { calculateRMultiple, calculatePnlDollar } from '@/lib/trade-types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { format, startOfWeek, startOfMonth, startOfYear, parseISO } from 'date-fns';

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
  bestTrade: number;  // always the highest pnl (can be positive)
  worstTrade: number; // always the lowest pnl (can be negative)
}

type Period = 'day' | 'week' | 'month' | 'year';

function groupTrades(trades: AnalyticsTrade[], groupBy: Period): PeriodSummary[] {
  const closed = trades.filter(t => t.status === 'Closed' && t.exitPrice !== null);
  if (closed.length === 0) return [];

  const groups: Record<string, AnalyticsTrade[]> = {};
  closed.forEach(t => {
    const d = parseISO(t.date);
    let key: string;
    if (groupBy === 'day') key = format(d, 'yyyy-MM-dd');
    else if (groupBy === 'week') key = format(startOfWeek(d, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    else if (groupBy === 'month') key = format(startOfMonth(d), 'yyyy-MM');
    else key = format(startOfYear(d), 'yyyy');
    if (!groups[key]) groups[key] = [];
    groups[key].push(t);
  });

  return Object.entries(groups)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([key, periodTrades]) => {
      const results = periodTrades.map(t => {
        const rMult = calculateRMultiple(t.entryPrice, t.exitPrice!, t.stopLoss, t.direction);
        const pnl = calculatePnlDollar(t.riskAmount, rMult);
        return { rMult, pnl };
      });
      const wins = results.filter(r => r.pnl > 0);
      const losses = results.filter(r => r.pnl < 0);
      const totalPnl = Math.round(results.reduce((s, r) => s + r.pnl, 0) * 100) / 100;
      const avgR = Math.round((results.reduce((s, r) => s + r.rMult, 0) / results.length) * 100) / 100;
      // bestTrade = highest pnl value (positive = win, keep sign)
      const bestTrade = Math.round(Math.max(...results.map(r => r.pnl)) * 100) / 100;
      // worstTrade = lowest pnl value (negative = loss, keep sign)
      const worstTrade = Math.round(Math.min(...results.map(r => r.pnl)) * 100) / 100;

      return {
        label: key,
        totalTrades: results.length,
        wins: wins.length,
        losses: losses.length,
        winRate: Math.round((wins.length / results.length) * 100),
        totalPnl,
        avgR,
        bestTrade,
        worstTrade,
      };
    });
}

export default function PerformanceSummary({ trades }: PerformanceSummaryProps) {
  const [period, setPeriod] = useState<Period>('week');
  const summaries = useMemo(() => groupTrades(trades, period), [trades, period]);

  if (summaries.length === 0) {
    return (
      <div className="rounded-xl bg-card border border-border/60 p-6 text-center text-muted-foreground text-sm">
        No closed trades for performance summaries
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-card border border-border/60 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/60 bg-secondary/20">
        <div className="flex items-center gap-2">
          <div className="h-4 w-1 rounded-full bg-cyan-500" />
          <span className="text-xs font-bold text-foreground uppercase tracking-widest">
            {{ day: 'Daily', week: 'Weekly', month: 'Monthly', year: 'Yearly' }[period]} Performance
          </span>
          <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-0.5 rounded-full ml-1">
            {summaries.length} {{ day: 'days', week: 'weeks', month: 'months', year: 'years' }[period]}
          </span>
        </div>
        <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
          <SelectTrigger className="text-xs h-7 w-28 border-border/60">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="day">Daily</SelectItem>
            <SelectItem value="week">Weekly</SelectItem>
            <SelectItem value="month">Monthly</SelectItem>
            <SelectItem value="year">Yearly</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/40 text-[10px] text-muted-foreground uppercase tracking-widest bg-secondary/10">
              <th className="text-left py-3 px-4">{{ day: 'Date', week: 'Week Starting', month: 'Month', year: 'Year' }[period]}</th>
              <th className="text-center py-3 px-3">Trades</th>
              <th className="text-center py-3 px-3">W / L</th>
              <th className="text-center py-3 px-3">Win %</th>
              <th className="text-right py-3 px-3">Avg R</th>
              <th className="text-right py-3 px-3">Net P&L</th>
              <th className="text-right py-3 px-3">Best</th>
              <th className="text-right py-3 px-3">Worst</th>
            </tr>
          </thead>
          <tbody>
            {summaries.map((s, idx) => (
              <tr key={s.label}
                className={`border-b border-border/30 hover:bg-secondary/30 transition-colors ${idx % 2 === 0 ? '' : 'bg-secondary/10'}`}>
                <td className="py-3 px-4 font-mono text-xs text-muted-foreground">{s.label}</td>
                <td className="py-3 px-3 text-center font-mono text-xs">{s.totalTrades}</td>
                <td className="py-3 px-3 text-center text-xs">
                  <span className="text-profit font-semibold">{s.wins}W</span>
                  <span className="text-muted-foreground mx-1">/</span>
                  <span className="text-loss font-semibold">{s.losses}L</span>
                </td>
                <td className="py-3 px-3 text-center">
                  <span className={`inline-block font-mono font-bold text-xs px-2 py-0.5 rounded-md ${
                    s.winRate >= 60 ? 'bg-profit/15 text-profit' :
                    s.winRate >= 50 ? 'bg-profit/10 text-profit' :
                    s.winRate >= 40 ? 'bg-yellow-500/10 text-yellow-400' :
                    'bg-loss/10 text-loss'
                  }`}>
                    {s.winRate}%
                  </span>
                </td>
                <td className={`py-3 px-3 text-right font-mono text-xs font-semibold ${s.avgR >= 0 ? 'text-profit' : 'text-loss'}`}>
                  {s.avgR >= 0 ? '+' : ''}{s.avgR}R
                </td>
                <td className="py-3 px-3 text-right font-mono text-xs font-bold">
                  <span className={`inline-flex items-center gap-1 justify-end ${s.totalPnl >= 0 ? 'text-profit' : 'text-loss'}`}>
                    {s.totalPnl >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {s.totalPnl >= 0 ? '+' : '-'}${Math.abs(s.totalPnl).toLocaleString()}
                  </span>
                </td>
                <td className="py-3 px-3 text-right font-mono text-xs font-semibold">
                  <span className={s.bestTrade >= 0 ? 'text-profit' : 'text-loss'}>
                    {s.bestTrade >= 0 ? '+' : ''}${s.bestTrade}
                  </span>
                </td>
                <td className="py-3 px-3 text-right font-mono text-xs font-semibold">
                  <span className={s.worstTrade >= 0 ? 'text-profit' : 'text-loss'}>
                    {s.worstTrade >= 0 ? '+' : ''}${s.worstTrade}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
          {/* Totals row */}
          <tfoot>
            <tr className="border-t border-border/60 bg-secondary/20">
              <td className="py-3 px-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Total</td>
              <td className="py-3 px-3 text-center font-mono text-xs font-bold">{summaries.reduce((s, r) => s + r.totalTrades, 0)}</td>
              <td className="py-3 px-3 text-center text-xs">
                <span className="text-profit font-bold">{summaries.reduce((s, r) => s + r.wins, 0)}W</span>
                <span className="text-muted-foreground mx-1">/</span>
                <span className="text-loss font-bold">{summaries.reduce((s, r) => s + r.losses, 0)}L</span>
              </td>
              <td className="py-3 px-3 text-center">
                {(() => {
                  const totalTrades = summaries.reduce((s, r) => s + r.totalTrades, 0);
                  const totalWins = summaries.reduce((s, r) => s + r.wins, 0);
                  const wr = totalTrades > 0 ? Math.round((totalWins / totalTrades) * 100) : 0;
                  return (
                    <span className={`inline-block font-mono font-bold text-xs px-2 py-0.5 rounded-md ${wr >= 50 ? 'bg-profit/15 text-profit' : 'bg-loss/10 text-loss'}`}>
                      {wr}%
                    </span>
                  );
                })()}
              </td>
              <td className="py-3 px-3 text-right font-mono text-xs font-bold text-muted-foreground">—</td>
              <td className="py-3 px-3 text-right font-mono text-xs font-bold">
                {(() => {
                  const total = summaries.reduce((s, r) => s + r.totalPnl, 0);
                  return (
                    <span className={`inline-flex items-center gap-1 justify-end ${total >= 0 ? 'text-profit' : 'text-loss'}`}>
                      {total >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {total >= 0 ? '+' : '-'}${Math.abs(Math.round(total * 100) / 100).toLocaleString()}
                    </span>
                  );
                })()}
              </td>
              {(() => {
                const best = Math.max(...summaries.map(s => s.bestTrade));
                const worst = Math.min(...summaries.map(s => s.worstTrade));
                return (
                  <>
                    <td className="py-3 px-3 text-right font-mono text-xs font-bold">
                      <span className={best >= 0 ? 'text-profit' : 'text-loss'}>
                        {best >= 0 ? '+' : ''}${best}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-xs font-bold">
                      <span className={worst >= 0 ? 'text-profit' : 'text-loss'}>
                        {worst >= 0 ? '+' : ''}${worst}
                      </span>
                    </td>
                  </>
                );
              })()}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
