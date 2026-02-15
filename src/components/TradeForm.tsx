import { useState } from 'react';
import { Trade, SESSIONS, PAIRS, STRATEGIES, TIMEFRAMES, MARKET_CONDITIONS, CONFLUENCES, generateTradeId, calculatePips, calculateRMultiple, calculatePnlDollar, calculatePnlPercent } from '@/lib/trade-types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { X, Camera, Calculator } from 'lucide-react';

interface TradeFormProps {
  onSubmit: (trade: Omit<Trade, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}

export function TradeForm({ onSubmit, onCancel }: TradeFormProps) {
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    session: '' as string,
    pair: '' as string,
    direction: '' as string,
    lotSize: '',
    entryPrice: '',
    stopLoss: '',
    takeProfit: '',
    exitPrice: '',
    riskAmount: '',
    riskPercent: '',
    accountSize: '',
    strategy: '',
    htfTimeframe: '',
    entryTimeframe: '',
    marketCondition: '' as string,
    confluences: [] as string[],
    notes: '',
    status: 'Open' as 'Open' | 'Closed',
  });

  const [screenshotBefore, setScreenshotBefore] = useState<string | null>(null);
  const [screenshotAfter, setScreenshotAfter] = useState<string | null>(null);

  const handleFileUpload = (type: 'before' | 'after') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      if (type === 'before') setScreenshotBefore(result);
      else setScreenshotAfter(result);
    };
    reader.readAsDataURL(file);
  };

  const toggleConfluence = (c: string) => {
    setForm(prev => ({
      ...prev,
      confluences: prev.confluences.includes(c)
        ? prev.confluences.filter(x => x !== c)
        : [...prev.confluences, c],
    }));
  };

  const entry = parseFloat(form.entryPrice) || 0;
  const sl = parseFloat(form.stopLoss) || 0;
  const tp = parseFloat(form.takeProfit) || 0;
  const exit = parseFloat(form.exitPrice) || 0;
  const dir = form.direction as 'Buy' | 'Sell';
  const riskAmt = parseFloat(form.riskAmount) || 0;
  const accSize = parseFloat(form.accountSize) || 0;

  const plannedRR = sl && tp && entry
    ? Math.abs((tp - entry) / (entry - sl))
    : 0;

  const actualPips = exit && entry && form.pair ? calculatePips(form.pair, entry, exit, dir) : 0;
  const rMultiple = exit && entry && sl ? calculateRMultiple(entry, exit, sl, dir) : 0;
  const pnlDollar = riskAmt && rMultiple ? calculatePnlDollar(riskAmt, rMultiple) : 0;
  const pnlPercent = pnlDollar && accSize ? calculatePnlPercent(pnlDollar, accSize) : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      date: form.date,
      session: form.session as Trade['session'],
      pair: form.pair,
      direction: dir,
      lotSize: parseFloat(form.lotSize) || 0,
      entryPrice: entry,
      stopLoss: sl,
      takeProfit: tp,
      exitPrice: exit || null,
      riskAmount: riskAmt,
      riskPercent: parseFloat(form.riskPercent) || 0,
      accountSize: accSize,
      strategy: form.strategy,
      htfTimeframe: form.htfTimeframe,
      entryTimeframe: form.entryTimeframe,
      marketCondition: form.marketCondition as Trade['marketCondition'],
      confluences: form.confluences,
      screenshotBefore,
      screenshotAfter,
      notes: form.notes,
      status: form.status,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-h-[80vh] overflow-y-auto pr-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">New Trade</h2>
        <Button type="button" variant="ghost" size="icon" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Basic Info */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Trade Info</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Date</Label>
            <Input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} className="font-mono text-sm" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Session</Label>
            <Select value={form.session} onValueChange={v => setForm(p => ({ ...p, session: v }))}>
              <SelectTrigger className="text-sm"><SelectValue placeholder="Session" /></SelectTrigger>
              <SelectContent>{SESSIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Pair</Label>
            <Select value={form.pair} onValueChange={v => setForm(p => ({ ...p, pair: v }))}>
              <SelectTrigger className="text-sm"><SelectValue placeholder="Pair" /></SelectTrigger>
              <SelectContent>{PAIRS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Direction</Label>
            <Select value={form.direction} onValueChange={v => setForm(p => ({ ...p, direction: v }))}>
              <SelectTrigger className="text-sm"><SelectValue placeholder="Buy/Sell" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Buy">🟢 Buy</SelectItem>
                <SelectItem value="Sell">🔴 Sell</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Pricing & Risk</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Lot Size</Label>
            <Input type="number" step="0.01" placeholder="0.10" value={form.lotSize} onChange={e => setForm(p => ({ ...p, lotSize: e.target.value }))} className="font-mono text-sm" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Entry Price</Label>
            <Input type="number" step="0.00001" placeholder="1.08500" value={form.entryPrice} onChange={e => setForm(p => ({ ...p, entryPrice: e.target.value }))} className="font-mono text-sm" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Stop Loss</Label>
            <Input type="number" step="0.00001" placeholder="1.08300" value={form.stopLoss} onChange={e => setForm(p => ({ ...p, stopLoss: e.target.value }))} className="font-mono text-sm" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Take Profit</Label>
            <Input type="number" step="0.00001" placeholder="1.08900" value={form.takeProfit} onChange={e => setForm(p => ({ ...p, takeProfit: e.target.value }))} className="font-mono text-sm" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Exit Price</Label>
            <Input type="number" step="0.00001" placeholder="—" value={form.exitPrice} onChange={e => setForm(p => ({ ...p, exitPrice: e.target.value }))} className="font-mono text-sm" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Risk Amount ($)</Label>
            <Input type="number" step="0.01" placeholder="100" value={form.riskAmount} onChange={e => setForm(p => ({ ...p, riskAmount: e.target.value }))} className="font-mono text-sm" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Risk %</Label>
            <Input type="number" step="0.1" placeholder="1.0" value={form.riskPercent} onChange={e => setForm(p => ({ ...p, riskPercent: e.target.value }))} className="font-mono text-sm" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Account Size ($)</Label>
            <Input type="number" step="0.01" placeholder="10000" value={form.accountSize} onChange={e => setForm(p => ({ ...p, accountSize: e.target.value }))} className="font-mono text-sm" />
          </div>
        </div>

        {/* Auto-calculated */}
        {(entry > 0 && sl > 0) && (
          <div className="flex flex-wrap gap-4 p-3 rounded-lg bg-secondary/50 border border-border">
            <div className="flex items-center gap-2">
              <Calculator className="h-3.5 w-3.5 text-accent" />
              <span className="text-xs text-muted-foreground">R:R</span>
              <span className="font-mono text-sm font-semibold">{plannedRR.toFixed(2)}</span>
            </div>
            {exit > 0 && (
              <>
                <div>
                  <span className="text-xs text-muted-foreground">Pips: </span>
                  <span className={`font-mono text-sm font-semibold ${actualPips >= 0 ? 'text-profit' : 'text-loss'}`}>{actualPips > 0 ? '+' : ''}{actualPips}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">R-Mult: </span>
                  <span className={`font-mono text-sm font-semibold ${rMultiple >= 0 ? 'text-profit' : 'text-loss'}`}>{rMultiple > 0 ? '+' : ''}{rMultiple}R</span>
                </div>
                {riskAmt > 0 && (
                  <div>
                    <span className="text-xs text-muted-foreground">P&L: </span>
                    <span className={`font-mono text-sm font-semibold ${pnlDollar >= 0 ? 'text-profit' : 'text-loss'}`}>{pnlDollar > 0 ? '+' : ''}${pnlDollar}</span>
                    {accSize > 0 && <span className={`font-mono text-xs ml-1 ${pnlPercent >= 0 ? 'text-profit' : 'text-loss'}`}>({pnlPercent > 0 ? '+' : ''}{pnlPercent}%)</span>}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Strategy */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Strategy & Setup</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Strategy</Label>
            <Select value={form.strategy} onValueChange={v => setForm(p => ({ ...p, strategy: v }))}>
              <SelectTrigger className="text-sm"><SelectValue placeholder="Strategy" /></SelectTrigger>
              <SelectContent>{STRATEGIES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">HTF Bias</Label>
            <Select value={form.htfTimeframe} onValueChange={v => setForm(p => ({ ...p, htfTimeframe: v }))}>
              <SelectTrigger className="text-sm"><SelectValue placeholder="Timeframe" /></SelectTrigger>
              <SelectContent>{TIMEFRAMES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Entry TF</Label>
            <Select value={form.entryTimeframe} onValueChange={v => setForm(p => ({ ...p, entryTimeframe: v }))}>
              <SelectTrigger className="text-sm"><SelectValue placeholder="Timeframe" /></SelectTrigger>
              <SelectContent>{TIMEFRAMES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Market Condition</Label>
            <Select value={form.marketCondition} onValueChange={v => setForm(p => ({ ...p, marketCondition: v }))}>
              <SelectTrigger className="text-sm"><SelectValue placeholder="Condition" /></SelectTrigger>
              <SelectContent>{MARKET_CONDITIONS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>

        {/* Confluences */}
        <div className="space-y-2">
          <Label className="text-xs">Confluences</Label>
          <div className="flex flex-wrap gap-2">
            {CONFLUENCES.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => toggleConfluence(c)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  form.confluences.includes(c)
                    ? 'bg-primary/20 text-primary border border-primary/40'
                    : 'bg-secondary text-secondary-foreground border border-border hover:border-muted-foreground/30'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Screenshots */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Screenshots</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Before Entry</Label>
            {screenshotBefore ? (
              <div className="relative group">
                <img src={screenshotBefore} alt="Before" className="rounded-lg border border-border w-full h-32 object-cover" />
                <button type="button" onClick={() => setScreenshotBefore(null)} className="absolute top-1 right-1 bg-background/80 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <label className="flex items-center justify-center h-32 rounded-lg border border-dashed border-border bg-secondary/30 cursor-pointer hover:border-muted-foreground/40 transition-colors">
                <div className="text-center">
                  <Camera className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                  <span className="text-xs text-muted-foreground">Upload</span>
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload('before')} />
              </label>
            )}
          </div>
          <div className="space-y-1">
            <Label className="text-xs">After Exit</Label>
            {screenshotAfter ? (
              <div className="relative group">
                <img src={screenshotAfter} alt="After" className="rounded-lg border border-border w-full h-32 object-cover" />
                <button type="button" onClick={() => setScreenshotAfter(null)} className="absolute top-1 right-1 bg-background/80 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <label className="flex items-center justify-center h-32 rounded-lg border border-dashed border-border bg-secondary/30 cursor-pointer hover:border-muted-foreground/40 transition-colors">
                <div className="text-center">
                  <Camera className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                  <span className="text-xs text-muted-foreground">Upload</span>
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload('after')} />
              </label>
            )}
          </div>
        </div>
      </div>

      {/* Status & Notes */}
      <div className="space-y-3">
        <div className="space-y-1">
          <Label className="text-xs">Status</Label>
          <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v as 'Open' | 'Closed' }))}>
            <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Open">🟡 Open</SelectItem>
              <SelectItem value="Closed">✅ Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Notes</Label>
          <Textarea placeholder="Trade rationale, emotions, lessons learned..." value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} className="text-sm min-h-[80px]" />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button type="submit" className="flex-1">Log Trade</Button>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}
