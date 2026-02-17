import { useState, useMemo } from 'react';
import { DbTrade } from '@/hooks/use-trades';
import { SESSIONS, PAIRS, STRATEGIES, TIMEFRAMES, MARKET_CONDITIONS, CONFLUENCES, LIQUIDITY_SWEEP_TYPES, KEY_LEVELS, ENTRY_TYPES, calculateEquilibrium, getTradeLocation, calculatePips, calculateRMultiple, calculatePnlDollar, calculatePnlPercent, generateTradeId, priceToPips, pipsToDollars } from '@/lib/trade-types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { X, Camera, Calculator } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface TradeFormProps {
  onSubmit: (trade: Omit<DbTrade, 'id' | 'created_at' | 'updated_at'>) => void;
  onCancel: () => void;
  userId: string;
  accountId: string;
  accountBalance: number;
  initialData?: DbTrade;
}

function ToggleChips({ items, selected, onToggle, label }: { items: readonly string[]; selected: string[]; onToggle: (v: string) => void; label: string }) {
  return (
    <div className="space-y-2">
      <Label className="text-xs">{label}</Label>
      <div className="flex flex-wrap gap-2">
        {items.map(c => (
          <button key={c} type="button" onClick={() => onToggle(c)}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              selected.includes(c) ? 'bg-primary/20 text-primary border border-primary/40' : 'bg-secondary text-secondary-foreground border border-border hover:border-muted-foreground/30'
            }`}>{c}</button>
        ))}
      </div>
    </div>
  );
}

function BooleanToggle({ label, value, onChange }: { label: string; value: boolean | null; onChange: (v: boolean) => void }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <div className="flex gap-1">
        <button type="button" onClick={() => onChange(true)} className={`flex-1 px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${value === true ? 'bg-profit/20 text-profit border border-profit/40' : 'bg-secondary text-secondary-foreground border border-border'}`}>Yes</button>
        <button type="button" onClick={() => onChange(false)} className={`flex-1 px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${value === false ? 'bg-loss/20 text-loss border border-loss/40' : 'bg-secondary text-secondary-foreground border border-border'}`}>No</button>
      </div>
    </div>
  );
}

async function uploadScreenshot(userId: string, file: File, tradeDate: string, type: 'before' | 'after'): Promise<string | null> {
  const now = new Date();
  const timePart = now.toTimeString().slice(0, 8).replace(/:/g, '');
  const ext = file.name.split('.').pop() || 'png';
  const path = `${userId}/${tradeDate.replace(/-/g, '/')}/${timePart}/${type}.${ext}`;
  
  const { error } = await supabase.storage.from('trade-screenshots').upload(path, file);
  if (error) return null;
  const { data } = supabase.storage.from('trade-screenshots').getPublicUrl(path);
  return data.publicUrl;
}

export function TradeForm({ onSubmit, onCancel, userId, accountId, accountBalance, initialData }: TradeFormProps) {
  const isEdit = !!initialData;
  const [form, setForm] = useState({
    date: initialData?.date || new Date().toISOString().split('T')[0],
    session: initialData?.session || '',
    pair: initialData?.pair || '',
    direction: initialData?.direction || '',
    lotSize: initialData?.lot_size?.toString() || '',
    entryPrice: initialData?.entry_price?.toString() || '',
    stopLoss: initialData?.stop_loss?.toString() || '',
    takeProfit: initialData?.take_profit?.toString() || '',
    exitPrice: initialData?.exit_price?.toString() || '',
    riskPercent: initialData?.risk_percent?.toString() || '',
    strategy: initialData?.strategy || '',
    htfTimeframe: initialData?.htf_timeframe || '',
    entryTimeframe: initialData?.entry_timeframe || '',
    marketCondition: initialData?.market_condition || '',
    confluences: initialData?.confluences || [] as string[],
    notes: initialData?.notes || '',
    status: (initialData?.status || 'Open') as 'Open' | 'Closed',
    dealingRangeHigh: initialData?.dealing_range_high?.toString() || '',
    dealingRangeLow: initialData?.dealing_range_low?.toString() || '',
    liquiditySweepType: initialData?.liquidity_sweep_type || '',
    keyLevels: initialData?.key_levels || [] as string[],
    entryType: initialData?.entry_type || '',
    entryQuality: initialData?.entry_quality?.toString() || '',
    htfBiasRespected: initialData?.htf_bias_respected ?? null as boolean | null,
    ltfBosConfirmed: initialData?.ltf_bos_confirmed ?? null as boolean | null,
    mssPresent: initialData?.mss_present ?? null as boolean | null,
  });

  const [screenshotBeforeFile, setScreenshotBeforeFile] = useState<File | null>(null);
  const [screenshotAfterFile, setScreenshotAfterFile] = useState<File | null>(null);
  const [screenshotBeforePreview, setScreenshotBeforePreview] = useState<string | null>(initialData?.screenshot_before || null);
  const [screenshotAfterPreview, setScreenshotAfterPreview] = useState<string | null>(initialData?.screenshot_after || null);
  const [submitting, setSubmitting] = useState(false);

  const handleFileUpload = (type: 'before' | 'after') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (type === 'before') { setScreenshotBeforeFile(file); setScreenshotBeforePreview(url); }
    else { setScreenshotAfterFile(file); setScreenshotAfterPreview(url); }
  };

  const toggleList = (key: 'confluences' | 'keyLevels', value: string) => {
    setForm(prev => ({ ...prev, [key]: prev[key].includes(value) ? prev[key].filter(x => x !== value) : [...prev[key], value] }));
  };

  const entry = parseFloat(form.entryPrice) || 0;
  const sl = parseFloat(form.stopLoss) || 0;
  const tp = parseFloat(form.takeProfit) || 0;
  const exit = parseFloat(form.exitPrice) || 0;
  const dir = form.direction as 'Buy' | 'Sell';
  const lotSize = parseFloat(form.lotSize) || 0;
  const drHigh = parseFloat(form.dealingRangeHigh) || 0;
  const drLow = parseFloat(form.dealingRangeLow) || 0;

  // Pip-based calculations for SL and TP
  const slPips = entry && sl && form.pair ? priceToPips(form.pair, entry, sl) : 0;
  const tpPips = entry && tp && form.pair ? priceToPips(form.pair, entry, tp) : 0;
  const slDollars = slPips && lotSize && form.pair ? pipsToDollars(form.pair, slPips, lotSize) : 0;
  const tpDollars = tpPips && lotSize && form.pair ? pipsToDollars(form.pair, tpPips, lotSize) : 0;

  // Risk amount = SL dollar value (pip-based), Risk % = auto-calculated from balance
  const riskAmt = slDollars;
  const riskPct = accountBalance > 0 && riskAmt > 0 ? Math.round((riskAmt / accountBalance) * 10000) / 100 : 0;

  const equilibrium = useMemo(() => drHigh && drLow ? calculateEquilibrium(drHigh, drLow) : null, [drHigh, drLow]);
  const autoTradeLocation = useMemo(() => entry && drHigh && drLow ? getTradeLocation(entry, drHigh, drLow) : null, [entry, drHigh, drLow]);

  const plannedRR = sl && tp && entry ? Math.abs((tp - entry) / (entry - sl)) : 0;
  const actualPips = exit && entry && form.pair ? calculatePips(form.pair, entry, exit, dir) : 0;
  const actualPnlDollar = actualPips && lotSize && form.pair ? pipsToDollars(form.pair, Math.abs(actualPips), lotSize) * (actualPips >= 0 ? 1 : -1) : 0;
  const rMultiple = exit && entry && sl ? calculateRMultiple(entry, exit, sl, dir) : 0;
  const pnlPercent = actualPnlDollar && accountBalance ? calculatePnlPercent(actualPnlDollar, accountBalance) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    let ssBefore = initialData?.screenshot_before || null;
    let ssAfter = initialData?.screenshot_after || null;
    
    if (screenshotBeforeFile) ssBefore = await uploadScreenshot(userId, screenshotBeforeFile, form.date, 'before');
    if (screenshotAfterFile) ssAfter = await uploadScreenshot(userId, screenshotAfterFile, form.date, 'after');

    onSubmit({
      user_id: userId,
      account_id: accountId,
      trade_id: initialData?.trade_id || generateTradeId(),
      date: form.date,
      session: form.session,
      pair: form.pair,
      direction: dir,
      lot_size: parseFloat(form.lotSize) || 0,
      entry_price: entry,
      stop_loss: sl,
      take_profit: tp,
      exit_price: exit || null,
      risk_amount: riskAmt,
      risk_percent: riskPct,
      account_size: accountBalance,
      strategy: form.strategy || null,
      htf_timeframe: form.htfTimeframe || null,
      entry_timeframe: form.entryTimeframe || null,
      market_condition: form.marketCondition || null,
      confluences: form.confluences,
      screenshot_before: ssBefore,
      screenshot_after: ssAfter,
      notes: form.notes,
      status: form.status,
      dealing_range_high: drHigh || null,
      dealing_range_low: drLow || null,
      equilibrium,
      trade_location: autoTradeLocation,
      liquidity_sweep_type: form.liquiditySweepType || null,
      key_levels: form.keyLevels,
      entry_type: form.entryType || null,
      entry_quality: form.entryQuality ? parseInt(form.entryQuality) : null,
      htf_bias_respected: form.htfBiasRespected,
      ltf_bos_confirmed: form.ltfBosConfirmed,
      mss_present: form.mssPresent,
    });
    setSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-h-[80vh] overflow-y-auto pr-2">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{isEdit ? 'Edit Trade' : 'New Trade'}</h2>
        <Button type="button" variant="ghost" size="icon" onClick={onCancel}><X className="h-4 w-4" /></Button>
      </div>

      {/* Account info banner */}
      <div className="rounded-lg bg-secondary/50 border border-border p-3 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Account Balance</span>
        <span className="font-mono font-bold">${accountBalance.toLocaleString()}</span>
      </div>

      {/* Basic Info */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Trade Info</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="space-y-1"><Label className="text-xs">Date</Label><Input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} className="font-mono text-sm" /></div>
          <div className="space-y-1"><Label className="text-xs">Session</Label>
            <Select value={form.session} onValueChange={v => setForm(p => ({ ...p, session: v }))}><SelectTrigger className="text-sm"><SelectValue placeholder="Session" /></SelectTrigger><SelectContent>{SESSIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
          </div>
          <div className="space-y-1"><Label className="text-xs">Pair</Label>
            <Select value={form.pair} onValueChange={v => setForm(p => ({ ...p, pair: v }))}><SelectTrigger className="text-sm"><SelectValue placeholder="Pair" /></SelectTrigger><SelectContent>{PAIRS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select>
          </div>
          <div className="space-y-1"><Label className="text-xs">Direction</Label>
            <Select value={form.direction} onValueChange={v => setForm(p => ({ ...p, direction: v }))}><SelectTrigger className="text-sm"><SelectValue placeholder="Buy/Sell" /></SelectTrigger><SelectContent><SelectItem value="Buy">🟢 Buy</SelectItem><SelectItem value="Sell">🔴 Sell</SelectItem></SelectContent></Select>
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Pricing & Risk</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="space-y-1"><Label className="text-xs">Lot Size</Label><Input type="number" step="0.01" placeholder="0.10" value={form.lotSize} onChange={e => setForm(p => ({ ...p, lotSize: e.target.value }))} className="font-mono text-sm" /></div>
          <div className="space-y-1"><Label className="text-xs">Entry Price</Label><Input type="number" step="0.00001" placeholder="1.08500" value={form.entryPrice} onChange={e => setForm(p => ({ ...p, entryPrice: e.target.value }))} className="font-mono text-sm" /></div>
          <div className="space-y-1">
            <Label className="text-xs">Stop Loss</Label>
            <Input type="number" step="0.00001" placeholder="1.08300" value={form.stopLoss} onChange={e => setForm(p => ({ ...p, stopLoss: e.target.value }))} className="font-mono text-sm" />
            {slPips > 0 && <p className="text-[10px] font-mono text-muted-foreground">{slPips} pips · <span className="text-loss">${slDollars}</span></p>}
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Take Profit</Label>
            <Input type="number" step="0.00001" placeholder="1.08900" value={form.takeProfit} onChange={e => setForm(p => ({ ...p, takeProfit: e.target.value }))} className="font-mono text-sm" />
            {tpPips > 0 && <p className="text-[10px] font-mono text-muted-foreground">{tpPips} pips · <span className="text-profit">${tpDollars}</span></p>}
          </div>
          <div className="space-y-1"><Label className="text-xs">Exit Price</Label><Input type="number" step="0.00001" placeholder="—" value={form.exitPrice} onChange={e => setForm(p => ({ ...p, exitPrice: e.target.value }))} className="font-mono text-sm" /></div>
          <div className="space-y-1">
            <Label className="text-xs">Risk % (auto)</Label>
            <div className="h-9 flex items-center px-3 rounded-md border border-border bg-muted/50 font-mono text-sm">{riskPct > 0 ? `${riskPct}%` : '—'}</div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Risk Amount (auto)</Label>
            <div className="h-9 flex items-center px-3 rounded-md border border-border bg-muted/50 font-mono text-sm">{riskAmt > 0 ? `$${riskAmt.toLocaleString()}` : '—'}</div>
          </div>
        </div>

        {(entry > 0 && sl > 0) && (
          <div className="flex flex-wrap gap-4 p-3 rounded-lg bg-secondary/50 border border-border">
            <div className="flex items-center gap-2">
              <Calculator className="h-3.5 w-3.5 text-accent" />
              <span className="text-xs text-muted-foreground">R:R</span>
              <span className="font-mono text-sm font-semibold">{plannedRR.toFixed(2)}</span>
            </div>
            {exit > 0 && (
              <>
                <div><span className="text-xs text-muted-foreground">Pips: </span><span className={`font-mono text-sm font-semibold ${actualPips >= 0 ? 'text-profit' : 'text-loss'}`}>{actualPips > 0 ? '+' : ''}{actualPips}</span></div>
                <div><span className="text-xs text-muted-foreground">R-Mult: </span><span className={`font-mono text-sm font-semibold ${rMultiple >= 0 ? 'text-profit' : 'text-loss'}`}>{rMultiple > 0 ? '+' : ''}{rMultiple}R</span></div>
                {actualPnlDollar !== 0 && (
                  <div><span className="text-xs text-muted-foreground">P&L: </span><span className={`font-mono text-sm font-semibold ${actualPnlDollar >= 0 ? 'text-profit' : 'text-loss'}`}>{actualPnlDollar > 0 ? '+' : ''}${actualPnlDollar}</span>
                    {accountBalance > 0 && <span className={`font-mono text-xs ml-1 ${pnlPercent >= 0 ? 'text-profit' : 'text-loss'}`}>({pnlPercent > 0 ? '+' : ''}{pnlPercent}%)</span>}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* CRT / Dealing Range */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">CRT / Dealing Range</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="space-y-1"><Label className="text-xs">DR High</Label><Input type="number" step="0.00001" value={form.dealingRangeHigh} onChange={e => setForm(p => ({ ...p, dealingRangeHigh: e.target.value }))} className="font-mono text-sm" /></div>
          <div className="space-y-1"><Label className="text-xs">DR Low</Label><Input type="number" step="0.00001" value={form.dealingRangeLow} onChange={e => setForm(p => ({ ...p, dealingRangeLow: e.target.value }))} className="font-mono text-sm" /></div>
          <div className="space-y-1"><Label className="text-xs">Equilibrium (50%)</Label><div className="h-9 flex items-center px-3 rounded-md border border-border bg-muted/50 font-mono text-sm">{equilibrium !== null ? equilibrium : '—'}</div></div>
          <div className="space-y-1"><Label className="text-xs">Trade Location</Label>
            <div className={`h-9 flex items-center px-3 rounded-md border font-mono text-sm font-semibold ${
              autoTradeLocation === 'Premium' ? 'border-loss/40 bg-loss/10 text-loss' :
              autoTradeLocation === 'Discount' ? 'border-profit/40 bg-profit/10 text-profit' :
              autoTradeLocation === 'EQ' ? 'border-warning/40 bg-warning/10 text-warning' :
              'border-border bg-muted/50 text-muted-foreground'
            }`}>{autoTradeLocation || '—'}</div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1"><Label className="text-xs">Liquidity Sweep</Label>
            <Select value={form.liquiditySweepType} onValueChange={v => setForm(p => ({ ...p, liquiditySweepType: v }))}><SelectTrigger className="text-sm"><SelectValue placeholder="Sweep type" /></SelectTrigger><SelectContent>{LIQUIDITY_SWEEP_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
          </div>
        </div>
        <ToggleChips items={KEY_LEVELS} selected={form.keyLevels} onToggle={v => toggleList('keyLevels', v)} label="Key Levels" />
      </div>

      {/* Entry Model */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Entry Model</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="space-y-1"><Label className="text-xs">Entry Type</Label>
            <Select value={form.entryType} onValueChange={v => setForm(p => ({ ...p, entryType: v }))}><SelectTrigger className="text-sm"><SelectValue placeholder="Entry type" /></SelectTrigger><SelectContent>{ENTRY_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
          </div>
          <div className="space-y-1"><Label className="text-xs">Entry Quality (1–5)</Label>
            <Select value={form.entryQuality} onValueChange={v => setForm(p => ({ ...p, entryQuality: v }))}><SelectTrigger className="text-sm"><SelectValue placeholder="Score" /></SelectTrigger><SelectContent>{[1,2,3,4,5].map(n => <SelectItem key={n} value={String(n)}>{'⭐'.repeat(n)} ({n})</SelectItem>)}</SelectContent></Select>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <BooleanToggle label="HTF Bias Respected?" value={form.htfBiasRespected} onChange={v => setForm(p => ({ ...p, htfBiasRespected: v }))} />
          <BooleanToggle label="LTF BOS Confirmed?" value={form.ltfBosConfirmed} onChange={v => setForm(p => ({ ...p, ltfBosConfirmed: v }))} />
          <BooleanToggle label="MSS Present?" value={form.mssPresent} onChange={v => setForm(p => ({ ...p, mssPresent: v }))} />
        </div>
      </div>

      {/* Strategy */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Strategy & Setup</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="space-y-1"><Label className="text-xs">Strategy</Label>
            <Select value={form.strategy} onValueChange={v => setForm(p => ({ ...p, strategy: v }))}><SelectTrigger className="text-sm"><SelectValue placeholder="Strategy" /></SelectTrigger><SelectContent>{STRATEGIES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
          </div>
          <div className="space-y-1"><Label className="text-xs">HTF Bias</Label>
            <Select value={form.htfTimeframe} onValueChange={v => setForm(p => ({ ...p, htfTimeframe: v }))}><SelectTrigger className="text-sm"><SelectValue placeholder="Timeframe" /></SelectTrigger><SelectContent>{TIMEFRAMES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
          </div>
          <div className="space-y-1"><Label className="text-xs">Entry TF</Label>
            <Select value={form.entryTimeframe} onValueChange={v => setForm(p => ({ ...p, entryTimeframe: v }))}><SelectTrigger className="text-sm"><SelectValue placeholder="Timeframe" /></SelectTrigger><SelectContent>{TIMEFRAMES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
          </div>
          <div className="space-y-1"><Label className="text-xs">Market Condition</Label>
            <Select value={form.marketCondition} onValueChange={v => setForm(p => ({ ...p, marketCondition: v }))}><SelectTrigger className="text-sm"><SelectValue placeholder="Condition" /></SelectTrigger><SelectContent>{MARKET_CONDITIONS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent></Select>
          </div>
        </div>
        <ToggleChips items={CONFLUENCES} selected={form.confluences} onToggle={v => toggleList('confluences', v)} label="Confluences" />
      </div>

      {/* Screenshots */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Screenshots</h3>
        <div className="grid grid-cols-2 gap-3">
          {(['before', 'after'] as const).map(type => {
            const preview = type === 'before' ? screenshotBeforePreview : screenshotAfterPreview;
            const clearFn = type === 'before' 
              ? () => { setScreenshotBeforeFile(null); setScreenshotBeforePreview(null); }
              : () => { setScreenshotAfterFile(null); setScreenshotAfterPreview(null); };
            return (
              <div key={type} className="space-y-1">
                <Label className="text-xs">{type === 'before' ? 'Before Entry' : 'After Exit'}</Label>
                {preview ? (
                  <div className="relative group">
                    <img src={preview} alt={type} className="rounded-lg border border-border w-full h-32 object-cover" />
                    <button type="button" onClick={clearFn} className="absolute top-1 right-1 bg-background/80 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"><X className="h-3 w-3" /></button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center h-32 rounded-lg border border-dashed border-border bg-secondary/30 cursor-pointer hover:border-muted-foreground/40 transition-colors">
                    <div className="text-center"><Camera className="h-5 w-5 mx-auto text-muted-foreground mb-1" /><span className="text-xs text-muted-foreground">Upload</span></div>
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload(type)} />
                  </label>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Status & Notes */}
      <div className="space-y-3">
        <div className="space-y-1"><Label className="text-xs">Status</Label>
          <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v as 'Open' | 'Closed' }))}><SelectTrigger className="text-sm"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Open">🟡 Open</SelectItem><SelectItem value="Closed">✅ Closed</SelectItem></SelectContent></Select>
        </div>
        <div className="space-y-1"><Label className="text-xs">Notes</Label>
          <Textarea placeholder="Trade rationale, emotions, lessons learned..." value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} className="text-sm min-h-[80px]" />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" className="flex-1" disabled={submitting}>{submitting ? 'Saving...' : isEdit ? 'Update Trade' : 'Log Trade'}</Button>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}
