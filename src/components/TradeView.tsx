import { DbTrade } from '@/hooks/use-trades';
import { calculatePips, calculatePnlPercent, pipsToDollars, calculateRMultiple } from '@/lib/trade-types';
import { Button } from '@/components/ui/button';
import { X, TrendingUp, TrendingDown, ExternalLink } from 'lucide-react';

interface TradeViewProps {
  trade: DbTrade;
  onClose: () => void;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="h-3.5 w-0.5 rounded-full bg-indigo-500" />
      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{children}</span>
    </div>
  );
}

function Field({ label, value, className }: { label: string; value: React.ReactNode; className?: string }) {
  return (
    <div className="space-y-1">
      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{label}</span>
      <div className={`text-sm font-mono font-semibold ${className || 'text-foreground'}`}>{value ?? <span className="text-muted-foreground/40">—</span>}</div>
    </div>
  );
}

function InfoBlock({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl bg-secondary/30 border border-border/40 p-4 grid gap-3 ${className || ''}`}>
      {children}
    </div>
  );
}

export default function TradeView({ trade, onClose }: TradeViewProps) {
  const hasExit = trade.exit_price !== null && trade.exit_price !== 0;
  const dir = trade.direction as 'Buy' | 'Sell';
  const pips = hasExit ? calculatePips(trade.pair, trade.entry_price, trade.exit_price!, dir) : null;
  const rMult = hasExit ? calculateRMultiple(trade.entry_price, trade.exit_price!, trade.stop_loss, dir) : null;
  const pnl = hasExit && pips !== null ? pipsToDollars(trade.pair, Math.abs(pips), trade.lot_size) * (pips >= 0 ? 1 : -1) : null;
  const pnlPct = pnl !== null && trade.account_size ? calculatePnlPercent(pnl, trade.account_size) : null;
  const isWin = pnl !== null && pnl >= 0;

  return (
    <div className="space-y-5 max-h-[82vh] overflow-y-auto pr-1 -mr-1">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${
            trade.direction === 'Buy' ? 'bg-profit/15 border border-profit/30' : 'bg-loss/15 border border-loss/30'
          }`}>
            {trade.direction === 'Buy'
              ? <TrendingUp className="h-5 w-5 text-profit" />
              : <TrendingDown className="h-5 w-5 text-loss" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold tracking-tight">{trade.pair}</h2>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                trade.direction === 'Buy' ? 'bg-profit/15 text-profit' : 'bg-loss/15 text-loss'
              }`}>{trade.direction}</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                trade.status === 'Open' ? 'bg-yellow-500/15 text-yellow-400' : 'bg-indigo-500/15 text-indigo-400'
              }`}>{trade.status}</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5 font-mono">
              {trade.trade_id} · {trade.date} · {trade.session}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0 h-8 w-8 rounded-lg">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* ── Result Banner ── */}
      {hasExit && pnl !== null && (
        <div className={`rounded-xl p-4 border ${isWin ? 'border-profit/25 bg-profit/8' : 'border-loss/25 bg-loss/8'}`}
          style={{ background: isWin ? 'rgba(34,197,94,0.06)' : 'rgba(239,68,68,0.06)' }}>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Pips</div>
              <div className={`text-xl font-mono font-bold ${pips! >= 0 ? 'text-profit' : 'text-loss'}`}>
                {pips! > 0 ? '+' : ''}{pips}
              </div>
            </div>
            <div className="text-center">
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">R-Mult</div>
              <div className={`text-xl font-mono font-bold ${rMult! >= 0 ? 'text-profit' : 'text-loss'}`}>
                {rMult! > 0 ? '+' : ''}{rMult}R
              </div>
            </div>
            <div className="text-center">
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">P&L $</div>
              <div className={`text-xl font-mono font-bold ${pnl >= 0 ? 'text-profit' : 'text-loss'}`}>
                {pnl > 0 ? '+' : ''}${pnl}
              </div>
            </div>
            <div className="text-center">
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">P&L %</div>
              <div className={`text-xl font-mono font-bold ${pnlPct !== null && pnlPct >= 0 ? 'text-profit' : 'text-loss'}`}>
                {pnlPct !== null ? `${pnlPct > 0 ? '+' : ''}${pnlPct}%` : '—'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Trade Info ── */}
      <div>
        <SectionTitle>Trade Info</SectionTitle>
        <InfoBlock className="grid-cols-2 md:grid-cols-4">
          <Field label="Lot Size" value={trade.lot_size} />
          <Field label="Entry" value={trade.entry_price} />
          <Field label="Stop Loss" value={<span className="text-loss">{trade.stop_loss}</span>} />
          <Field label="Take Profit" value={<span className="text-profit">{trade.take_profit}</span>} />
          <Field label="Exit Price" value={trade.exit_price ?? null} />
          <Field label="Risk $" value={<span className="text-loss">${trade.risk_amount}</span>} />
          <Field label="Risk %" value={`${trade.risk_percent}%`} />
          <Field label="Account Size" value={`$${trade.account_size?.toLocaleString()}`} />
        </InfoBlock>
      </div>

      {/* ── CRT / Dealing Range ── */}
      <div>
        <SectionTitle>CRT / Dealing Range</SectionTitle>
        <InfoBlock className="grid-cols-2 md:grid-cols-3">
          <Field label="DR High" value={trade.dealing_range_high} />
          <Field label="DR Low" value={trade.dealing_range_low} />
          <Field label="Equilibrium" value={trade.equilibrium} />
          <Field label="Location" value={trade.trade_location
            ? <span className={trade.trade_location === 'Premium' ? 'text-loss' : trade.trade_location === 'Discount' ? 'text-profit' : 'text-yellow-400'}>{trade.trade_location}</span>
            : null} />
          <Field label="Sweep Type" value={trade.liquidity_sweep_type} />
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Key Levels</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {trade.key_levels?.length
                ? trade.key_levels.map(k => <span key={k} className="px-2 py-0.5 rounded-md text-xs font-semibold bg-indigo-500/15 text-indigo-400 border border-indigo-500/25">{k}</span>)
                : <span className="text-muted-foreground/40 text-sm font-mono">—</span>}
            </div>
          </div>
        </InfoBlock>
      </div>

      {/* ── Entry Model ── */}
      <div>
        <SectionTitle>Entry Model</SectionTitle>
        <InfoBlock className="grid-cols-2 md:grid-cols-3">
          <Field label="Entry Type" value={trade.entry_type} />
          <Field label="Quality" value={trade.entry_quality
            ? <span className="text-yellow-400">{'★'.repeat(trade.entry_quality)}{'☆'.repeat(5 - trade.entry_quality)}</span>
            : null} />
          <div />
          <Field label="HTF Bias" value={trade.htf_bias_respected === true
            ? <span className="text-profit">✓ Yes</span>
            : trade.htf_bias_respected === false
            ? <span className="text-loss">✗ No</span>
            : null} />
          <Field label="LTF BOS" value={trade.ltf_bos_confirmed === true
            ? <span className="text-profit">✓ Yes</span>
            : trade.ltf_bos_confirmed === false
            ? <span className="text-loss">✗ No</span>
            : null} />
          <Field label="MSS Present" value={trade.mss_present === true
            ? <span className="text-profit">✓ Yes</span>
            : trade.mss_present === false
            ? <span className="text-loss">✗ No</span>
            : null} />
        </InfoBlock>
      </div>

      {/* ── Strategy ── */}
      <div>
        <SectionTitle>Strategy & Setup</SectionTitle>
        <InfoBlock className="grid-cols-2 md:grid-cols-4">
          <Field label="Strategy" value={trade.strategy} />
          <Field label="HTF Timeframe" value={trade.htf_timeframe} />
          <Field label="Entry TF" value={trade.entry_timeframe} />
          <Field label="Market" value={trade.market_condition} />
        </InfoBlock>
        {trade.confluences?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {trade.confluences.map(c => (
              <span key={c} className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">{c}</span>
            ))}
          </div>
        )}
      </div>

      {/* ── Screenshots ── */}
      {(trade.screenshot_before || trade.screenshot_after) && (
        <div>
          <SectionTitle>Screenshots</SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            {trade.screenshot_before && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Before Entry</span>
                  <button onClick={() => window.open(trade.screenshot_before!, '_blank')}
                    className="text-muted-foreground hover:text-foreground transition-colors">
                    <ExternalLink className="h-3 w-3" />
                  </button>
                </div>
                <img src={trade.screenshot_before} alt="Before"
                  className="rounded-xl border border-border/60 w-full object-cover max-h-48 cursor-pointer hover:border-border transition-colors"
                  onClick={() => window.open(trade.screenshot_before!, '_blank')} />
              </div>
            )}
            {trade.screenshot_after && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">After Exit</span>
                  <button onClick={() => window.open(trade.screenshot_after!, '_blank')}
                    className="text-muted-foreground hover:text-foreground transition-colors">
                    <ExternalLink className="h-3 w-3" />
                  </button>
                </div>
                <img src={trade.screenshot_after} alt="After"
                  className="rounded-xl border border-border/60 w-full object-cover max-h-48 cursor-pointer hover:border-border transition-colors"
                  onClick={() => window.open(trade.screenshot_after!, '_blank')} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Notes ── */}
      {trade.notes && (
        <div>
          <SectionTitle>Notes</SectionTitle>
          <div className="rounded-xl bg-secondary/30 border border-border/40 p-4 text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">
            {trade.notes}
          </div>
        </div>
      )}
    </div>
  );
}
