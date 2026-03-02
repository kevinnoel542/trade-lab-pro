import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { calculateRMultiple, calculatePnlDollar } from '@/lib/trade-types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CalendarTrade {
  date: string;
  pair: string;
  direction: string;
  status: string;
  entryPrice: number;
  exitPrice: number | null;
  stopLoss: number;
  riskAmount: number;
}

interface TradeCalendarProps {
  trades: CalendarTrade[];
}

interface DayData {
  totalPnl: number;
  tradeCount: number;
  wins: number;
  losses: number;
  pairs: string[];
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function TradeCalendar({ trades }: TradeCalendarProps) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth()); // 0-indexed
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  // Build day map from all closed trades
  const dayMap = useMemo(() => {
    const map: Record<string, DayData> = {};
    trades.forEach(t => {
      if (t.status !== 'Closed' || !t.exitPrice) return;
      const dateKey = t.date.slice(0, 10); // 'YYYY-MM-DD'
      const rMult = calculateRMultiple(t.entryPrice, t.exitPrice, t.stopLoss, t.direction as 'Buy' | 'Sell');
      const pnl = calculatePnlDollar(t.riskAmount, rMult);
      if (!map[dateKey]) map[dateKey] = { totalPnl: 0, tradeCount: 0, wins: 0, losses: 0, pairs: [] };
      map[dateKey].totalPnl += pnl;
      map[dateKey].tradeCount++;
      if (pnl > 0) map[dateKey].wins++;
      else if (pnl < 0) map[dateKey].losses++;
      if (!map[dateKey].pairs.includes(t.pair)) map[dateKey].pairs.push(t.pair);
    });
    // Round pnl
    Object.keys(map).forEach(k => { map[k].totalPnl = Math.round(map[k].totalPnl * 100) / 100; });
    return map;
  }, [trades]);

  // Month stats
  const monthStats = useMemo(() => {
    const prefix = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`;
    const days = Object.entries(dayMap).filter(([k]) => k.startsWith(prefix));
    const totalPnl = days.reduce((s, [, d]) => s + d.totalPnl, 0);
    const tradeDays = days.length;
    const winDays = days.filter(([, d]) => d.totalPnl > 0).length;
    const lossDays = days.filter(([, d]) => d.totalPnl < 0).length;
    const totalTrades = days.reduce((s, [, d]) => s + d.tradeCount, 0);
    return { totalPnl: Math.round(totalPnl * 100) / 100, tradeDays, winDays, lossDays, totalTrades };
  }, [dayMap, viewYear, viewMonth]);

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    // Monday=0 offset
    let startOffset = firstDay.getDay() - 1;
    if (startOffset < 0) startOffset = 6;
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells: (number | null)[] = [
      ...Array(startOffset).fill(null),
      ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];
    // Pad to complete last week
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [viewYear, viewMonth]);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
    setSelectedDay(null);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
    setSelectedDay(null);
  };

  // Build year options from trade history + surrounding years
  const yearOptions = useMemo(() => {
    const tradeYears = new Set(Object.keys(dayMap).map(k => parseInt(k.slice(0, 4))));
    const currentYear = today.getFullYear();
    tradeYears.add(currentYear);
    tradeYears.add(currentYear - 1);
    tradeYears.add(currentYear + 1);
    return Array.from(tradeYears).sort((a, b) => b - a);
  }, [dayMap]);

  const formatDayKey = (day: number) =>
    `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const selectedData = selectedDay ? dayMap[selectedDay] : null;

  // Intensity scale for coloring — find max abs pnl in month
  const maxAbsPnl = useMemo(() => {
    const prefix = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`;
    const vals = Object.entries(dayMap).filter(([k]) => k.startsWith(prefix)).map(([, d]) => Math.abs(d.totalPnl));
    return vals.length > 0 ? Math.max(...vals) : 1;
  }, [dayMap, viewYear, viewMonth]);

  const getIntensity = (pnl: number) => Math.min(Math.abs(pnl) / maxAbsPnl, 1);

  return (
    <div className="rounded-xl bg-card border border-border/60 overflow-hidden">

      {/* ── Header ── */}
      <div className="px-5 py-4 border-b border-border/60 bg-secondary/20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="h-4 w-1 rounded-full bg-indigo-500" />
            <h3 className="text-xs font-bold text-foreground uppercase tracking-widest">Trading Calendar</h3>
          </div>
          <div className="flex items-center gap-1.5">
            {/* Prev month */}
            <button onClick={prevMonth}
              className="h-7 w-7 rounded-lg border border-border/60 bg-secondary/40 flex items-center justify-center hover:bg-secondary transition-colors">
              <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground" />
            </button>

            {/* Month dropdown */}
            <Select value={String(viewMonth)} onValueChange={v => { setViewMonth(Number(v)); setSelectedDay(null); }}>
              <SelectTrigger className="h-7 w-32 text-xs font-bold border-border/60 bg-secondary/40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((m, i) => (
                  <SelectItem key={i} value={String(i)} className="text-xs">{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Year dropdown */}
            <Select value={String(viewYear)} onValueChange={v => { setViewYear(Number(v)); setSelectedDay(null); }}>
              <SelectTrigger className="h-7 w-20 text-xs font-bold border-border/60 bg-secondary/40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map(y => (
                  <SelectItem key={y} value={String(y)} className="text-xs">{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Next month */}
            <button onClick={nextMonth}
              className="h-7 w-7 rounded-lg border border-border/60 bg-secondary/40 flex items-center justify-center hover:bg-secondary transition-colors">
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Month stats row */}
        <div className="grid grid-cols-5 gap-3">
          {[
            { label: 'Net P&L', value: `${monthStats.totalPnl >= 0 ? '+' : ''}$${monthStats.totalPnl.toLocaleString()}`, color: monthStats.totalPnl >= 0 ? 'text-profit' : 'text-loss' },
            { label: 'Trade Days', value: monthStats.tradeDays, color: 'text-foreground' },
            { label: 'Green Days', value: monthStats.winDays, color: 'text-profit' },
            { label: 'Red Days', value: monthStats.lossDays, color: 'text-loss' },
            { label: 'Total Trades', value: monthStats.totalTrades, color: 'text-foreground' },
          ].map(s => (
            <div key={s.label} className="rounded-lg bg-secondary/40 border border-border/40 px-3 py-2 text-center">
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">{s.label}</div>
              <div className={`text-base font-mono font-bold ${s.color}`}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Calendar Grid ── */}
      <div className="p-4">
        {/* Day headers */}
        <div className="grid grid-cols-7 mb-2">
          {DAYS.map(d => (
            <div key={d} className="text-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-1.5">
          {calendarDays.map((day, idx) => {
            if (!day) return <div key={`empty-${idx}`} />;
            const key = formatDayKey(day);
            const data = dayMap[key];
            const isToday = key === todayKey;
            const isSelected = key === selectedDay;
            const hasTrades = !!data;
            const isProfit = hasTrades && data.totalPnl > 0;
            const isLoss = hasTrades && data.totalPnl < 0;
            const intensity = hasTrades ? getIntensity(data.totalPnl) : 0;

            return (
              <button
                key={key}
                onClick={() => setSelectedDay(isSelected ? null : key)}
                className={`
                  relative rounded-xl p-2 min-h-[72px] flex flex-col text-left transition-all duration-150 border
                  ${isSelected
                    ? 'ring-2 ring-indigo-500 border-indigo-500/60 bg-indigo-500/10'
                    : isToday
                    ? 'border-indigo-400/40 bg-indigo-500/5'
                    : hasTrades
                    ? 'border-border/40 hover:border-border cursor-pointer'
                    : 'border-transparent hover:border-border/30 cursor-default'}
                `}
                style={hasTrades ? {
                  backgroundColor: isProfit
                    ? `rgba(34,197,94,${0.06 + intensity * 0.18})`
                    : `rgba(239,68,68,${0.06 + intensity * 0.18})`,
                  borderColor: isSelected ? undefined : isProfit
                    ? `rgba(34,197,94,${0.2 + intensity * 0.3})`
                    : `rgba(239,68,68,${0.2 + intensity * 0.3})`,
                } : undefined}
              >
                {/* Day number */}
                <div className="flex items-center justify-between w-full mb-1">
                  <span className={`text-xs font-bold leading-none ${
                    isToday ? 'text-indigo-400' :
                    hasTrades ? (isProfit ? 'text-profit' : 'text-loss') :
                    'text-muted-foreground'
                  }`}>
                    {day}
                  </span>
                  {isToday && (
                    <span className="text-[8px] font-bold text-indigo-400 bg-indigo-500/20 px-1 rounded">TODAY</span>
                  )}
                </div>

                {hasTrades && (
                  <>
                    {/* Trade count badge */}
                    <div className={`text-[9px] font-bold mb-1 ${isProfit ? 'text-profit' : 'text-loss'}`}>
                      {data.tradeCount} {data.tradeCount === 1 ? 'trade' : 'trades'}
                    </div>
                    {/* P&L */}
                    <div className={`text-[11px] font-mono font-bold mt-auto ${isProfit ? 'text-profit' : 'text-loss'}`}>
                      {data.totalPnl > 0 ? '+' : ''}${data.totalPnl}
                    </div>
                    {/* W/L dots */}
                    <div className="flex gap-0.5 mt-1">
                      {Array.from({ length: Math.min(data.wins, 5) }).map((_, i) => (
                        <div key={`w${i}`} className="h-1 w-1 rounded-full bg-profit" />
                      ))}
                      {Array.from({ length: Math.min(data.losses, 5) }).map((_, i) => (
                        <div key={`l${i}`} className="h-1 w-1 rounded-full bg-loss" />
                      ))}
                    </div>
                  </>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Legend ── */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/40">
          <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded bg-profit/30 border border-profit/50" />
              <span>Profit day</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded bg-loss/30 border border-loss/50" />
              <span>Loss day</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded border border-indigo-400/40 bg-indigo-500/5" />
              <span>Today</span>
            </div>
          </div>
          <span className="text-[10px] text-muted-foreground">Color intensity = P&L magnitude</span>
        </div>
      </div>

      {/* ── Selected Day Detail Panel ── */}
      {selectedDay && selectedData && (
        <div className="border-t border-border/60 px-5 py-4 bg-secondary/10">
          <div className="flex items-center gap-3 mb-3">
            <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${
              selectedData.totalPnl > 0 ? 'bg-profit/15 border border-profit/30' :
              selectedData.totalPnl < 0 ? 'bg-loss/15 border border-loss/30' :
              'bg-secondary border border-border/60'
            }`}>
              {selectedData.totalPnl > 0
                ? <TrendingUp className="h-4 w-4 text-profit" />
                : selectedData.totalPnl < 0
                ? <TrendingDown className="h-4 w-4 text-loss" />
                : <Minus className="h-4 w-4 text-muted-foreground" />}
            </div>
            <div>
              <div className="text-sm font-bold">{new Date(selectedDay + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{selectedData.tradeCount} trade{selectedData.tradeCount !== 1 ? 's' : ''} · {selectedData.pairs.join(', ')}</div>
            </div>
            <div className="ml-auto text-right">
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Day P&L</div>
              <div className={`text-xl font-mono font-bold ${selectedData.totalPnl > 0 ? 'text-profit' : selectedData.totalPnl < 0 ? 'text-loss' : 'text-foreground'}`}>
                {selectedData.totalPnl > 0 ? '+' : ''}${selectedData.totalPnl.toLocaleString()}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Trades', value: selectedData.tradeCount, color: 'text-foreground' },
              { label: 'Wins', value: selectedData.wins, color: 'text-profit' },
              { label: 'Losses', value: selectedData.losses, color: 'text-loss' },
              { label: 'Win Rate', value: selectedData.tradeCount > 0 ? `${Math.round((selectedData.wins / selectedData.tradeCount) * 100)}%` : '—', color: selectedData.wins >= selectedData.losses ? 'text-profit' : 'text-loss' },
            ].map(s => (
              <div key={s.label} className="rounded-lg bg-secondary/40 border border-border/40 p-3 text-center">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{s.label}</div>
                <div className={`text-lg font-mono font-bold ${s.color}`}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
