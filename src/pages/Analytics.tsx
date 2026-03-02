import { useMemo, useState } from 'react';
import { calculateRMultiple, calculatePnlDollar, SESSIONS, KEY_LEVELS, LIQUIDITY_SWEEP_TYPES, ENTRY_TYPES, TRADE_LOCATIONS, STRATEGIES, PAIRS, MARKET_CONDITIONS } from '@/lib/trade-types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart3, TrendingUp, TrendingDown, Target, Scale, AlertTriangle, Trophy, Zap, ArrowDown, Activity, Filter, ChevronUp, ChevronDown } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Area, AreaChart, ReferenceLine, PieChart, Pie, Legend } from 'recharts';
import PerformanceSummary from '@/components/PerformanceSummary';
import TradeCalendar from '@/components/TradeCalendar';
import { generateTradeReport } from '@/lib/pdf-report';
import { FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
  rawTrades?: any[];
  accountName?: string;
  accountBalance?: number;
  initialBalance?: number;
}

const CHART_COLORS = {
  profit: '#22c55e',
  loss: '#ef4444',
  accent: '#6366f1',
  gold: '#f59e0b',
  cyan: '#06b6d4',
  grid: 'rgba(255,255,255,0.05)',
  tooltip: { bg: '#0f1117', border: 'rgba(255,255,255,0.08)' },
};

const tooltipStyle = {
  backgroundColor: CHART_COLORS.tooltip.bg,
  border: `1px solid ${CHART_COLORS.tooltip.border}`,
  borderRadius: 10,
  fontSize: 12,
  color: '#e2e8f0',
  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
};

function MetricCard({ label, value, icon: Icon, colorClass, sub }: { label: string; value: string | number; icon: any; colorClass?: string; sub?: string }) {
  return (
    <div className="rounded-xl bg-card border border-border/60 p-4 flex flex-col gap-2 relative overflow-hidden group hover:border-border transition-all duration-200">
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">{label}</span>
        <div className={`h-7 w-7 rounded-lg flex items-center justify-center bg-secondary/60`}>
          <Icon className={`h-3.5 w-3.5 ${colorClass || 'text-muted-foreground'}`} />
        </div>
      </div>
      <span className={`text-2xl font-mono font-bold tracking-tight ${colorClass || 'text-foreground'}`}>{value}</span>
      {sub && <span className="text-[10px] text-muted-foreground">{sub}</span>}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="h-4 w-1 rounded-full bg-indigo-500" />
      <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">{children}</h2>
    </div>
  );
}

function ChartCard({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl bg-card border border-border/60 p-5 relative overflow-hidden ${className || ''}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.015] to-transparent pointer-events-none" />
      <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">{title}</h3>
      {children}
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
      name, winRate: Math.round((wins / total) * 100), total, losses: total - wins,
    })).sort((a, b) => b.winRate - a.winRate);
  }, [trades, groupBy]);

  if (data.length === 0) return null;

  return (
    <ChartCard title={label}>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barSize={28}>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} vertical={false} />
            <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 10 }} domain={[0, 100]} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}%`, 'Win Rate']} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
            <ReferenceLine y={50} stroke="#6366f1" strokeDasharray="4 4" strokeOpacity={0.5} />
            <Bar dataKey="winRate" radius={[6, 6, 0, 0]}>
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.winRate >= 50 ? CHART_COLORS.profit : CHART_COLORS.loss} fillOpacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      {/* Legend row */}
      <div className="mt-3 flex flex-wrap gap-2">
        {data.map(d => (
          <div key={d.name} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <span className={`inline-block w-2 h-2 rounded-full ${d.winRate >= 50 ? 'bg-profit' : 'bg-loss'}`} />
            {d.name} <span className="font-mono font-bold text-foreground">{d.winRate}%</span>
            <span className="opacity-50">({d.total})</span>
          </div>
        ))}
      </div>
    </ChartCard>
  );
}

export default function Analytics({ trades, rawTrades = [], accountName = 'My Account', accountBalance = 0, initialBalance = 0 }: AnalyticsProps) {
  const [filterPair, setFilterPair] = useState('all');
  const [pdfLoading, setPdfLoading] = useState(false);
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
    // Sort by date then compute cumulative P&L
    const sorted = [...stats.results].sort((a, b) => a.trade.date.localeCompare(b.trade.date));
    let cum = 0;
    return sorted.map((r) => {
      cum += r.pnl;
      return { date: r.trade.date, equity: Math.round(cum * 100) / 100, pnl: Math.round(r.pnl * 100) / 100 };
    });
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

  // Win/Loss pie data
  const winLossPie = useMemo(() => {
    if (!stats) return [];
    const wins = stats.results.filter(r => r.pnl > 0).length;
    const losses = stats.results.filter(r => r.pnl < 0).length;
    const be = stats.results.filter(r => r.pnl === 0).length;
    return [
      { name: 'Wins', value: wins, fill: CHART_COLORS.profit },
      { name: 'Losses', value: losses, fill: CHART_COLORS.loss },
      ...(be > 0 ? [{ name: 'Break Even', value: be, fill: '#6366f1' }] : []),
    ];
  }, [stats]);

  // Per-trade PnL bar
  const perTradePnl = useMemo(() => {
    if (!stats) return [];
    return stats.results.map((r, i) => ({
      trade: `#${i + 1}`,
      pnl: Math.round(r.pnl * 100) / 100,
      rMult: r.rMult,
    }));
  }, [stats]);

  const activeFilters = [filterPair, filterSession, filterStrategy, filterCondition, filterKeyLevel, filterLiquidity, filterLocation].filter(f => f !== 'all').length;

  return (
    <div className="space-y-6">

      {/* ── Filters ── */}
      <div className="rounded-xl bg-card border border-border/60 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="h-3.5 w-3.5 text-indigo-400" />
          <span className="text-xs font-bold text-foreground uppercase tracking-widest">Filters</span>
          {activeFilters > 0 && (
            <span className="text-[10px] font-semibold bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full">
              {activeFilters} active
            </span>
          )}
          <Button
            size="sm"
            variant="outline"
            className="ml-auto gap-1.5 text-xs h-7 border-indigo-500/40 text-indigo-400 hover:bg-indigo-500/10"
            disabled={pdfLoading || !stats}
            onClick={async () => {
              if (!stats) return;
              setPdfLoading(true);
              try {
                await generateTradeReport(
                  rawTrades,
                  {
                    totalTrades: trades.length,
                    closedTrades: closed.length,
                    openTrades: trades.filter(t => t.status === 'Open').length,
                    winRate: stats.winRate,
                    totalPnl: stats.totalPnl,
                    avgRMultiple: stats.avgR,
                    profitFactor: stats.profitFactor,
                    expectancy: stats.expectancy,
                    maxDrawdown: stats.maxDrawdown,
                    consecutiveWins: stats.consecutiveWins,
                    consecutiveLosses: stats.consecutiveLosses,
                  },
                  accountName,
                  accountBalance,
                  initialBalance,
                );
              } finally {
                setPdfLoading(false);
              }
            }}
          >
            <FileDown className="h-3.5 w-3.5" />
            {pdfLoading ? 'Generating...' : 'Export PDF'}
          </Button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
          <Select value={filterPair} onValueChange={setFilterPair}><SelectTrigger className="text-xs h-8 border-border/60"><SelectValue placeholder="All Pairs" /></SelectTrigger><SelectContent><SelectItem value="all">All Pairs</SelectItem>{PAIRS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select>
          <Select value={filterSession} onValueChange={setFilterSession}><SelectTrigger className="text-xs h-8 border-border/60"><SelectValue placeholder="All Sessions" /></SelectTrigger><SelectContent><SelectItem value="all">All Sessions</SelectItem>{SESSIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
          <Select value={filterStrategy} onValueChange={setFilterStrategy}><SelectTrigger className="text-xs h-8 border-border/60"><SelectValue placeholder="All Strategies" /></SelectTrigger><SelectContent><SelectItem value="all">All Strategies</SelectItem>{STRATEGIES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
          <Select value={filterCondition} onValueChange={setFilterCondition}><SelectTrigger className="text-xs h-8 border-border/60"><SelectValue placeholder="All Conditions" /></SelectTrigger><SelectContent><SelectItem value="all">All Conditions</SelectItem>{MARKET_CONDITIONS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent></Select>
          <Select value={filterKeyLevel} onValueChange={setFilterKeyLevel}><SelectTrigger className="text-xs h-8 border-border/60"><SelectValue placeholder="All Levels" /></SelectTrigger><SelectContent><SelectItem value="all">All Levels</SelectItem>{KEY_LEVELS.map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}</SelectContent></Select>
          <Select value={filterLiquidity} onValueChange={setFilterLiquidity}><SelectTrigger className="text-xs h-8 border-border/60"><SelectValue placeholder="All Sweeps" /></SelectTrigger><SelectContent><SelectItem value="all">All Types</SelectItem>{LIQUIDITY_SWEEP_TYPES.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent></Select>
          <Select value={filterLocation} onValueChange={setFilterLocation}><SelectTrigger className="text-xs h-8 border-border/60"><SelectValue placeholder="All Locations" /></SelectTrigger><SelectContent><SelectItem value="all">All Locations</SelectItem>{TRADE_LOCATIONS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent></Select>
        </div>
      </div>

      {!stats ? (
        <div className="text-center py-24 text-muted-foreground">
          <Activity className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p className="text-lg font-semibold">No closed trades to analyze</p>
          <p className="text-sm mt-1 opacity-60">Log and close some trades to see analytics</p>
        </div>
      ) : (
        <>
          {/* ── KPI Metrics ── */}
          <div>
            <SectionTitle>Performance Overview</SectionTitle>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              <MetricCard label="Win Rate" value={`${stats.winRate}%`} icon={Target}
                colorClass={stats.winRate >= 50 ? 'text-profit' : 'text-loss'}
                sub={`${stats.results.filter(r => r.pnl > 0).length}W / ${stats.results.filter(r => r.pnl < 0).length}L of ${closed.length} trades`} />
              <MetricCard label="Total P&L" value={`$${stats.totalPnl.toLocaleString()}`}
                icon={stats.totalPnl >= 0 ? TrendingUp : TrendingDown}
                colorClass={stats.totalPnl >= 0 ? 'text-profit' : 'text-loss'}
                sub="Net realized profit/loss" />
              <MetricCard label="Profit Factor" value={stats.profitFactor} icon={Scale}
                colorClass={stats.profitFactor >= 1 ? 'text-profit' : 'text-loss'}
                sub="Gross win ÷ gross loss" />
              <MetricCard label="Avg R / Trade" value={`${stats.avgR}R`} icon={Zap}
                colorClass={stats.avgR >= 0 ? 'text-profit' : 'text-loss'}
                sub="Mean R-multiple" />
              <MetricCard label="Max Drawdown" value={`$${stats.maxDrawdown}`} icon={ArrowDown}
                colorClass="text-loss" sub="Peak-to-trough loss" />
              <MetricCard label="Expectancy" value={`$${stats.expectancy}`} icon={Activity}
                colorClass={stats.expectancy >= 0 ? 'text-profit' : 'text-loss'}
                sub="Expected $ per trade" />
              <MetricCard label="Consec. Wins" value={stats.consecutiveWins} icon={Trophy}
                colorClass="text-profit" sub="Best winning streak" />
              <MetricCard label="Consec. Losses" value={stats.consecutiveLosses} icon={AlertTriangle}
                colorClass="text-loss" sub="Worst losing streak" />
              <MetricCard label="Best Strategy" value={stats.bestStrat} icon={Trophy}
                colorClass="text-profit" sub="Highest total P&L" />
              <MetricCard label="Worst Strategy" value={stats.worstStrat} icon={AlertTriangle}
                colorClass="text-loss" sub="Lowest total P&L" />
            </div>
          </div>

          {/* ── Equity Curve + Per-Trade PnL ── */}
          <div>
            <SectionTitle>Equity & Trade Results</SectionTitle>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

              {/* Equity Curve */}
              <ChartCard title="Cumulative Equity Curve">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={equityCurve} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={CHART_COLORS.profit} stopOpacity={0.25} />
                          <stop offset="100%" stopColor={CHART_COLORS.profit} stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="equityGradRed" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={CHART_COLORS.loss} stopOpacity={0.25} />
                          <stop offset="100%" stopColor={CHART_COLORS.loss} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} vertical={false} />
                      <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                      <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                      <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" />
                      <Tooltip contentStyle={tooltipStyle} formatter={(v: number, n: string) => [`$${v}`, n === 'equity' ? 'Cumulative P&L' : 'Trade P&L']} />
                      <Area type="monotone" dataKey="equity" stroke={stats.totalPnl >= 0 ? CHART_COLORS.profit : CHART_COLORS.loss}
                        strokeWidth={2.5} fill={stats.totalPnl >= 0 ? 'url(#equityGrad)' : 'url(#equityGradRed)'} dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>

              {/* Per-Trade PnL bar */}
              <ChartCard title="Per-Trade P&L">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={perTradePnl} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} vertical={false} />
                      <XAxis dataKey="trade" tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                      <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" />
                      <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`$${v}`, 'P&L']} />
                      <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                        {perTradePnl.map((entry, i) => (
                          <Cell key={i} fill={entry.pnl >= 0 ? CHART_COLORS.profit : CHART_COLORS.loss} fillOpacity={0.85} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>
            </div>
          </div>

          {/* ── R-Distribution + Win/Loss Pie ── */}
          <div>
            <SectionTitle>Distribution & Composition</SectionTitle>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

              {/* R-Multiple Distribution */}
              <ChartCard title="R-Multiple Distribution">
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={rDistribution} barSize={36} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} vertical={false} />
                      <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [v, 'Trades']} />
                      <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                        {rDistribution.map((entry, i) => (
                          <Cell key={i}
                            fill={entry.name.startsWith('-') || entry.name.startsWith('<') ? CHART_COLORS.loss : CHART_COLORS.profit}
                            fillOpacity={0.85} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>

              {/* Win/Loss Pie */}
              <ChartCard title="Win / Loss Breakdown">
                <div className="h-60 flex items-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={winLossPie} cx="50%" cy="50%" innerRadius={60} outerRadius={95}
                        paddingAngle={3} dataKey="value" strokeWidth={0}>
                        {winLossPie.map((entry, i) => (
                          <Cell key={i} fill={entry.fill} fillOpacity={0.9} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                      <Legend iconType="circle" iconSize={8}
                        formatter={(v) => <span style={{ color: '#94a3b8', fontSize: 11 }}>{v}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center label */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                      <div className={`text-2xl font-mono font-bold ${stats.winRate >= 50 ? 'text-profit' : 'text-loss'}`}>{stats.winRate}%</div>
                      <div className="text-[10px] text-muted-foreground">Win Rate</div>
                    </div>
                  </div>
                </div>
              </ChartCard>
            </div>
          </div>

          {/* ── Win Rate Breakdowns ── */}
          <div>
            <SectionTitle>Win Rate Breakdowns</SectionTitle>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <WinRateByGroup trades={filtered} groupBy={t => t.session} label="By Session" />
              <WinRateByGroup trades={filtered} groupBy={t => t.tradeLocation} label="By Premium vs Discount" />
              <WinRateByGroup trades={filtered} groupBy={t => t.strategy || null} label="By Strategy" />
              <WinRateByGroup trades={filtered} groupBy={t => t.entryType} label="By Entry Model" />
              <WinRateByGroup trades={filtered} groupBy={t => t.liquiditySweepType} label="By Sweep Type" />
              <WinRateByGroup trades={filtered} groupBy={t => t.marketCondition} label="By Market Condition" />
            </div>
          </div>

          {/* ── Key Level Stats ── */}
          {(() => {
            const levels = (['OB', 'FVG', 'RB', 'BB'] as const).map(level => {
              const closedLevel = filtered.filter(t => t.keyLevels?.includes(level) && t.status === 'Closed' && t.exitPrice);
              if (closedLevel.length === 0) return null;
              const wins = closedLevel.filter(t => calculateRMultiple(t.entryPrice, t.exitPrice!, t.stopLoss, t.direction) > 0);
              const wr = Math.round((wins.length / closedLevel.length) * 100);
              return { level, wr, total: closedLevel.length };
            }).filter(Boolean);

            if (levels.length === 0) return null;
            return (
              <div>
                <SectionTitle>Key Level Performance</SectionTitle>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {levels.map(l => (
                    <div key={l!.level} className="rounded-xl bg-card border border-border/60 p-4 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">{l!.level}</div>
                        <div className="text-[10px] text-muted-foreground">{l!.total} trades</div>
                      </div>
                      <div className={`text-3xl font-mono font-bold ${l!.wr >= 50 ? 'text-profit' : 'text-loss'}`}>{l!.wr}%</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* ── Trading Calendar ── */}
          <div>
            <SectionTitle>Trading Calendar</SectionTitle>
            <TradeCalendar trades={filtered} />
          </div>

          {/* ── Performance Summary Table ── */}
          <div>
            <SectionTitle>Period Summary</SectionTitle>
            <PerformanceSummary trades={filtered} />
          </div>
        </>
      )}
    </div>
  );
}
