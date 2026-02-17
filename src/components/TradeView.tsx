import { DbTrade } from '@/hooks/use-trades';
import { calculatePips, calculatePnlPercent, pipsToDollars, calculateRMultiple } from '@/lib/trade-types';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface TradeViewProps {
  trade: DbTrade;
  onClose: () => void;
}

function Field({ label, value, className }: { label: string; value: React.ReactNode; className?: string }) {
  return (
    <div className="space-y-0.5">
      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
      <div className={`text-sm font-mono ${className || ''}`}>{value || '—'}</div>
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

  return (
    <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-2">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">{trade.pair} — {trade.direction}</h2>
          <p className="text-xs text-muted-foreground">{trade.trade_id} · {trade.date} · {trade.session}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button>
      </div>

      {/* Result Banner */}
      {hasExit && (
        <div className={`rounded-lg p-4 border ${pnl !== null && pnl >= 0 ? 'border-profit/30 bg-profit/5' : 'border-loss/30 bg-loss/5'}`}>
          <div className="grid grid-cols-4 gap-4">
            <Field label="Pips" value={<span className={pips! >= 0 ? 'text-profit' : 'text-loss'}>{pips! > 0 ? '+' : ''}{pips}</span>} />
            <Field label="R-Multiple" value={<span className={rMult! >= 0 ? 'text-profit' : 'text-loss'}>{rMult! > 0 ? '+' : ''}{rMult}R</span>} />
            <Field label="P&L $" value={<span className={pnl! >= 0 ? 'text-profit' : 'text-loss'}>{pnl! > 0 ? '+' : ''}${pnl}</span>} />
            <Field label="P&L %" value={pnlPct !== null ? <span className={pnlPct >= 0 ? 'text-profit' : 'text-loss'}>{pnlPct > 0 ? '+' : ''}{pnlPct}%</span> : '—'} />
          </div>
        </div>
      )}

      {/* Trade Info */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Trade Info</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 rounded-lg bg-card border border-border p-3">
          <Field label="Lot Size" value={trade.lot_size} />
          <Field label="Entry" value={trade.entry_price} />
          <Field label="Stop Loss" value={trade.stop_loss} />
          <Field label="Take Profit" value={trade.take_profit} />
          <Field label="Exit" value={trade.exit_price} />
          <Field label="Risk $" value={`$${trade.risk_amount}`} />
          <Field label="Risk %" value={`${trade.risk_percent}%`} />
          <Field label="Account Size" value={`$${trade.account_size}`} />
        </div>
      </div>

      {/* CRT */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">CRT / Dealing Range</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 rounded-lg bg-card border border-border p-3">
          <Field label="DR High" value={trade.dealing_range_high} />
          <Field label="DR Low" value={trade.dealing_range_low} />
          <Field label="Equilibrium" value={trade.equilibrium} />
          <Field label="Location" value={trade.trade_location ? <span className={trade.trade_location === 'Premium' ? 'text-loss' : trade.trade_location === 'Discount' ? 'text-profit' : 'text-warning'}>{trade.trade_location}</span> : null} />
          <Field label="Sweep Type" value={trade.liquidity_sweep_type} />
          <Field label="Key Levels" value={trade.key_levels?.join(', ')} />
        </div>
      </div>

      {/* Entry Model */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Entry Model</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 rounded-lg bg-card border border-border p-3">
          <Field label="Entry Type" value={trade.entry_type} />
          <Field label="Quality" value={trade.entry_quality ? '⭐'.repeat(trade.entry_quality) : null} />
          <Field label="HTF Bias Respected" value={trade.htf_bias_respected === true ? '✅ Yes' : trade.htf_bias_respected === false ? '❌ No' : null} />
          <Field label="LTF BOS Confirmed" value={trade.ltf_bos_confirmed === true ? '✅ Yes' : trade.ltf_bos_confirmed === false ? '❌ No' : null} />
          <Field label="MSS Present" value={trade.mss_present === true ? '✅ Yes' : trade.mss_present === false ? '❌ No' : null} />
        </div>
      </div>

      {/* Strategy */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Strategy</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 rounded-lg bg-card border border-border p-3">
          <Field label="Strategy" value={trade.strategy} />
          <Field label="HTF Bias" value={trade.htf_timeframe} />
          <Field label="Entry TF" value={trade.entry_timeframe} />
          <Field label="Market Condition" value={trade.market_condition} />
        </div>
        {trade.confluences?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {trade.confluences.map(c => (
              <span key={c} className="px-2 py-0.5 rounded-md text-xs bg-primary/10 text-primary border border-primary/30">{c}</span>
            ))}
          </div>
        )}
      </div>

      {/* Screenshots */}
      {(trade.screenshot_before || trade.screenshot_after) && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Screenshots</h3>
          <div className="grid grid-cols-2 gap-3">
            {trade.screenshot_before && (
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Before Entry</span>
                <img src={trade.screenshot_before} alt="Before" className="rounded-lg border border-border w-full object-contain max-h-64 cursor-pointer" onClick={() => window.open(trade.screenshot_before!, '_blank')} />
              </div>
            )}
            {trade.screenshot_after && (
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">After Exit</span>
                <img src={trade.screenshot_after} alt="After" className="rounded-lg border border-border w-full object-contain max-h-64 cursor-pointer" onClick={() => window.open(trade.screenshot_after!, '_blank')} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notes */}
      {trade.notes && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Notes</h3>
          <p className="text-sm rounded-lg bg-card border border-border p-3 whitespace-pre-wrap">{trade.notes}</p>
        </div>
      )}
    </div>
  );
}
