import { useMemo, useState } from 'react';
import { calculateRMultiple, calculatePnlDollar, SESSIONS, KEY_LEVELS, LIQUIDITY_SWEEP_TYPES, ENTRY_TYPES, TRADE_LOCATIONS, STRATEGIES, PAIRS, MARKET_CONDITIONS } from '@/lib/trade-types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart3, TrendingUp, Target, Scale, AlertTriangle, Trophy, Zap, ArrowDown } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface AnalyticsTrade {
  entryPrice: number;
  exitPrice: number | null;
  stopLoss: number;
  riskAmount: number;
  direction: 'Buy' | 'Sell';
  tradeLocation: string | null;
  keyLevels: string[];
  liquiditySweepType: string | null;
  entryType: string | null;
  marketCondition: string | null;
  strategy: string | null;
  session: string;
  status: string;
  pair: string;
  date: string;
}

interface AnalyticsProps {
  trades: AnalyticsTrade[];
}

function MetricCard({ label, value, icon: Icon, colorClass }: { label: string; value: string | number; icon: any; colorClass?: string }) {
  return (
    <div className="rounded-lg bg-card border border-border p-3 flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
        <Icon className={`h-3.5 w-3.5 ${colorClass || 'text-muted-foreground'}`} />
      </div>
      <span className={`text-xl font-mono font-bold ${colorClass || 'text-foreground'}`}>{value}</span>
    </div>
  );
}

function WinRateByGroup({ trades, groupBy, label }: { trades: AnalyticsTrade[]; groupBy: (t: AnalyticsTrade) => string | null; label: string }) {
  const data = useMemo(() => {
    const groups: Record<string, { wins: number; total: number }> = {};
    trades.forEach(t => {
      if (t.status !== 'Closed' || !t.exitPrice) return;
      const key = groupBy(t);
      if (!key) return;
      if (!groups[key]) groups[key] = { wins: 0, total: 0 };
      groups[key].total++;
      const rMult = calculateRMultiple(t.entryPrice, t.exitPrice, t.stopLoss, t.direction);
      if (rMult > 0) groups[key].wins++;
    });
    return Object.entries(groups).map(([name, { wins, total }]) => ({
      name, winRate: Math.round((wins / total) * 100), total,
    })).sort((a, b) => b.winRate - a.winRate);
  }, [trades, groupBy]);

  if (data.length === 0) return null;

  return (
    <div className="rounded-lg bg-card border border-border p-4">
      <h3 className="text-sm font-semibold mb-3">{label}</h3>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 18%)" />
            <XAxis dataKey="name" tick={{ fill: 'hsl(215 12% 50%)', fontSize: 11 }} />
            <YAxis tick={{ fill: 'hsl(215 12% 50%)', fontSize: 11 }} domain={[0, 100]} />
            <Tooltip contentStyle={{ backgroundColor: 'hsl(220 18% 12%)', border: '1px solid hsl(220 14% 18%)', borderRadius: 8, fontSize: 12 }} formatter={(value: number) => [`${value}%`, 'Win Rate']} />
            <Bar dataKey="winRate" radius={[4, 4, 0, 0]}>
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.winRate >= 50 ? 'hsl(142 60% 45%)' : 'hsl(0 72% 51%)'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default function Analytics({ trades }: AnalyticsProps) {
  const [filterPair, setFilterPair] = useState('all');
  const [filterSession, setFilterSession] = useState('all');
  const [filterStrategy, setFilterStrategy] = useState('all');
  const [filterCondition, setFilterCondition] = useState('all');
  const [filterKeyLevel, setFilterKeyLevel] = useState('all');
  const [filterLiquidity, setFilterLiquidity] = useState('all');
  const [filterLocation, setFilterLocation] = useState('all');

  const filtered = useMemo(() => {
    return trades.filter(t => {
      if (filterPair !== 'all' && t.pair !== filterPair) return false;
      if (filterSession !== 'all' && t.session !== filterSession) return false;
      if (filterStrategy !== 'all' && t.strategy !== filterStrategy) return false;
      if (filterCondition !== 'all' && t.marketCondition !== filterCondition) return false;
      if (filterKeyLevel !== 'all' && !t.keyLevels?.includes(filterKeyLevel)) return false;
      if (filterLiquidity !== 'all' && t.liquiditySweepType !== filterLiquidity) return false;
      if (filterLocation !== 'all' && t.tradeLocation !== filterLocation) return false;
      return true;
    });
  }, [trades, filterPair, filterSession, filterStrategy, filterCondition, filterKeyLevel, filterLiquidity, filterLocation]);

  const closed = useMemo(() => filtered.filter(t => t.status === 'Closed' && t.exitPrice), [filtered]);

  const stats = useMemo(() => {
    if (closed.length === 0) return null;
    const results = closed.map(t => {
      const rMult = calculateRMultiple(t.entryPrice, t.exitPrice!, t.stopLoss, t.direction);
      const pnl = calculatePnlDollar(t.riskAmount, rMult);
      return { rMult, pnl, trade: t };
    });
    const wins = results.filter(r => r.pnl > 0);
    const losses = results.filter(r => r.pnl < 0);
    const totalWins = wins.reduce((s, r) => s + r.pnl, 0);
    const totalLosses = Math.abs(losses.reduce((s, r) => s + r.pnl, 0));
    const winRate = Math.round((wins.length / closed.length) * 100);
    const avgR = results.reduce((s, r) => s + r.rMult, 0) / closed.length;
    const expectancy = (winRate / 100) * (wins.length > 0 ? totalWins / wins.length : 0) - ((100 - winRate) / 100) * (losses.length > 0 ? totalLosses / losses.length : 0);

    let maxConsWins = 0, maxConsLosses = 0, cw = 0, cl = 0;
    for (const r of results) {
      if (r.pnl > 0) { cw++; cl = 0; maxConsWins = Math.max(maxConsWins, cw); }
      else if (r.pnl < 0) { cl++; cw = 0; maxConsLosses = Math.max(maxConsLosses, cl); }
      else { cw = 0; cl = 0; }
    }
    let peak = 0, maxDD = 0, cumPnl = 0;
    for (const r of results) { cumPnl += r.pnl; peak = Math.max(peak, cumPnl); maxDD = Math.max(maxDD, peak - cumPnl); }

    const stratGroups: Record<string, number[]> = {};
    results.forEach(r => { const s = r.trade.strategy || 'Unknown'; if (!stratGroups[s]) stratGroups[s] = []; stratGroups[s].push(r.pnl); });
    const stratPerf = Object.entries(stratGroups).map(([name, pnls]) => ({
      name, total: pnls.reduce((a, b) => a + b, 0),
    }));
    const bestStrat = stratPerf.sort((a, b) => b.total - a.total)[0]?.name || '—';
    const worstStrat = stratPerf.sort((a, b) => a.total - b.total)[0]?.name || '—';

    return {
      winRate, avgR: Math.round(avgR * 100) / 100,
      expectancy: Math.round(expectancy * 100) / 100,
      profitFactor: totalLosses === 0 ? totalWins : Math.round((totalWins / totalLosses) * 100) / 100,
      maxDrawdown: Math.round(maxDD * 100) / 100,
      consecutiveWins: maxConsWins, consecutiveLosses: maxConsLosses,
      bestStrat, worstStrat,
      totalPnl: Math.round(results.reduce((s, r) => s + r.pnl, 0) * 100) / 100,
      results,
    };
  }, [closed]);

  const equityCurve = useMemo(() => {
    if (!stats) return [];
    let cum = 0;
    return stats.results.map((r, i) => { cum += r.pnl; return { trade: i + 1, equity: Math.round(cum * 100) / 100 }; });
  }, [stats]);

  const rDistribution = useMemo(() => {
    if (!stats) return [];
    const buckets: Record<string, number> = {};
    stats.results.forEach(r => {
      const bucket = r.rMult < -2 ? '<-2R' : r.rMult < -1 ? '-2R to -1R' : r.rMult < 0 ? '-1R to 0' : r.rMult < 1 ? '0 to 1R' : r.rMult < 2 ? '1R to 2R' : r.rMult < 3 ? '2R to 3R' : '3R+';
      buckets[bucket] = (buckets[bucket] || 0) + 1;
    });
    const order = ['<-2R', '-2R to -1R', '-1R to 0', '0 to 1R', '1R to 2R', '2R to 3R', '3R+'];
    return order.filter(k => buckets[k]).map(name => ({ name, count: buckets[name] || 0 }));
  }, [stats]);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="rounded-lg bg-card border border-border p-4">
        <h3 className="text-sm font-semibold mb-3">Filters</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
          <Select value={filterPair} onValueChange={setFilterPair}><SelectTrigger className="text-xs h-8"><SelectValue placeholder="Pair" /></SelectTrigger><SelectContent><SelectItem value="all">All Pairs</SelectItem>{PAIRS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select>
          <Select value={filterSession} onValueChange={setFilterSession}><SelectTrigger className="text-xs h-8"><SelectValue placeholder="Session" /></SelectTrigger><SelectContent><SelectItem value="all">All Sessions</SelectItem>{SESSIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
          <Select value={filterStrategy} onValueChange={setFilterStrategy}><SelectTrigger className="text-xs h-8"><SelectValue placeholder="Strategy" /></SelectTrigger><SelectContent><SelectItem value="all">All Strategies</SelectItem>{STRATEGIES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
          <Select value={filterCondition} onValueChange={setFilterCondition}><SelectTrigger className="text-xs h-8"><SelectValue placeholder="Condition" /></SelectTrigger><SelectContent><SelectItem value="all">All Conditions</SelectItem>{MARKET_CONDITIONS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent></Select>
          <Select value={filterKeyLevel} onValueChange={setFilterKeyLevel}><SelectTrigger className="text-xs h-8"><SelectValue placeholder="Key Level" /></SelectTrigger><SelectContent><SelectItem value="all">All Levels</SelectItem>{KEY_LEVELS.map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}</SelectContent></Select>
          <Select value={filterLiquidity} onValueChange={setFilterLiquidity}><SelectTrigger className="text-xs h-8"><SelectValue placeholder="Liquidity" /></SelectTrigger><SelectContent><SelectItem value="all">All Types</SelectItem>{LIQUIDITY_SWEEP_TYPES.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent></Select>
          <Select value={filterLocation} onValueChange={setFilterLocation}><SelectTrigger className="text-xs h-8"><SelectValue placeholder="Location" /></SelectTrigger><SelectContent><SelectItem value="all">All Locations</SelectItem>{TRADE_LOCATIONS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent></Select>
        </div>
      </div>

      {!stats ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg">No closed trades to analyze</p>
          <p className="text-sm mt-1">Log and close some trades to see analytics</p>
        </div>
      ) : (
        <>
          {/* Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
            <MetricCard label="Win Rate" value={`${stats.winRate}%`} icon={Target} colorClass={stats.winRate >= 50 ? 'text-profit' : 'text-loss'} />
            <MetricCard label="Avg R/Trade" value={`${stats.avgR}R`} icon={Scale} colorClass={stats.avgR >= 0 ? 'text-profit' : 'text-loss'} />
            <MetricCard label="Expectancy" value={`$${stats.expectancy}`} icon={Zap} colorClass={stats.expectancy >= 0 ? 'text-profit' : 'text-loss'} />
            <MetricCard label="Profit Factor" value={stats.profitFactor} icon={TrendingUp} colorClass={stats.profitFactor >= 1 ? 'text-profit' : 'text-loss'} />
            <MetricCard label="Max Drawdown" value={`$${stats.maxDrawdown}`} icon={ArrowDown} colorClass="text-loss" />
            <MetricCard label="Consec. Wins" value={stats.consecutiveWins} icon={Trophy} colorClass="text-profit" />
            <MetricCard label="Consec. Losses" value={stats.consecutiveLosses} icon={AlertTriangle} colorClass="text-loss" />
            <MetricCard label="Total P&L" value={`$${stats.totalPnl}`} icon={BarChart3} colorClass={stats.totalPnl >= 0 ? 'text-profit' : 'text-loss'} />
            <MetricCard label="Best Strategy" value={stats.bestStrat} icon={Trophy} colorClass="text-profit" />
            <MetricCard label="Worst Strategy" value={stats.worstStrat} icon={AlertTriangle} colorClass="text-loss" />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-lg bg-card border border-border p-4">
              <h3 className="text-sm font-semibold mb-3">Equity Curve</h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={equityCurve}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 18%)" />
                    <XAxis dataKey="trade" tick={{ fill: 'hsl(215 12% 50%)', fontSize: 11 }} />
                    <YAxis tick={{ fill: 'hsl(215 12% 50%)', fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(220 18% 12%)', border: '1px solid hsl(220 14% 18%)', borderRadius: 8, fontSize: 12 }} />
                    <Line type="monotone" dataKey="equity" stroke="hsl(142 60% 45%)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="rounded-lg bg-card border border-border p-4">
              <h3 className="text-sm font-semibold mb-3">R-Multiple Distribution</h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={rDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 18%)" />
                    <XAxis dataKey="name" tick={{ fill: 'hsl(215 12% 50%)', fontSize: 10 }} />
                    <YAxis tick={{ fill: 'hsl(215 12% 50%)', fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(220 18% 12%)', border: '1px solid hsl(220 14% 18%)', borderRadius: 8, fontSize: 12 }} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {rDistribution.map((entry, i) => (
                        <Cell key={i} fill={entry.name.startsWith('-') || entry.name.startsWith('<') ? 'hsl(0 72% 51%)' : 'hsl(142 60% 45%)'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Win Rate Breakdowns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <WinRateByGroup trades={filtered} groupBy={t => t.session} label="Win Rate by Session" />
            <WinRateByGroup trades={filtered} groupBy={t => t.tradeLocation} label="Win Rate by Premium vs Discount" />
            <WinRateByGroup trades={filtered} groupBy={t => {
              // Individual key level win rates
              if (!t.keyLevels?.length) return null;
              return t.keyLevels.join('+');
            }} label="Win Rate by Key Level (OB/FVG/RB/BB)" />
            <WinRateByGroup trades={filtered} groupBy={t => t.strategy || null} label="Win Rate by Strategy" />
            <WinRateByGroup trades={filtered} groupBy={t => t.liquiditySweepType} label="Win Rate by Sweep Type (PDH/Internal)" />
            <WinRateByGroup trades={filtered} groupBy={t => t.entryType} label="Win Rate by Entry Model" />
          </div>

          {/* Individual Key Level Breakdown */}
          <WinRateByGroup trades={filtered} groupBy={t => {
            // Flatten: show each key level separately
            return null; // handled by per-level below
          }} label="" />
          
          {/* Per individual key level */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {(['OB', 'FVG', 'RB', 'BB'] as const).map(level => {
              const levelTrades = filtered.filter(t => t.keyLevels?.includes(level));
              const closedLevel = levelTrades.filter(t => t.status === 'Closed' && t.exitPrice);
              if (closedLevel.length === 0) return null;
              const wins = closedLevel.filter(t => calculateRMultiple(t.entryPrice, t.exitPrice!, t.stopLoss, t.direction) > 0);
              const wr = Math.round((wins.length / closedLevel.length) * 100);
              return (
                <div key={level} className="rounded-lg bg-card border border-border p-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold">{level} Trades</h3>
                    <p className="text-xs text-muted-foreground">{closedLevel.length} trades</p>
                  </div>
                  <div className={`text-2xl font-mono font-bold ${wr >= 50 ? 'text-profit' : 'text-loss'}`}>{wr}%</div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
