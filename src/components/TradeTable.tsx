import { DbTrade } from '@/hooks/use-trades';
import { calculateRMultiple, calculatePnlDollar, calculatePips } from '@/lib/trade-types';
import { Trash2, Eye, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TradeTableProps {
  trades: DbTrade[];
  onDelete: (id: string) => void;
  onView: (trade: DbTrade) => void;
  onEdit: (trade: DbTrade) => void;
}

export function TradeTable({ trades, onDelete, onView, onEdit }: TradeTableProps) {
  if (trades.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p className="text-lg">No trades logged yet</p>
        <p className="text-sm mt-1">Click "New Trade" to get started</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-xs text-muted-foreground uppercase tracking-wider">
            <th className="text-left py-3 px-2">Date</th>
            <th className="text-left py-3 px-2">Pair</th>
            <th className="text-left py-3 px-2">Dir</th>
            <th className="text-left py-3 px-2">Session</th>
            <th className="text-right py-3 px-2">Entry</th>
            <th className="text-right py-3 px-2">Exit</th>
            <th className="text-right py-3 px-2">Pips</th>
            <th className="text-right py-3 px-2">R-Mult</th>
            <th className="text-right py-3 px-2">P&L</th>
            <th className="text-left py-3 px-2">Strategy</th>
            <th className="text-center py-3 px-2">Status</th>
            <th className="text-right py-3 px-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {trades.map(trade => {
            const hasExit = trade.exit_price !== null && trade.exit_price !== 0;
            const pips = hasExit ? calculatePips(trade.pair, trade.entry_price, trade.exit_price!, trade.direction as 'Buy' | 'Sell') : null;
            const rMult = hasExit ? calculateRMultiple(trade.entry_price, trade.exit_price!, trade.stop_loss, trade.direction as 'Buy' | 'Sell') : null;
            const pnl = hasExit && rMult !== null ? calculatePnlDollar(trade.risk_amount, rMult) : null;

            return (
              <tr key={trade.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                <td className="py-2.5 px-2 font-mono text-xs">{trade.date}</td>
                <td className="py-2.5 px-2 font-semibold">{trade.pair}</td>
                <td className="py-2.5 px-2">
                  <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${trade.direction === 'Buy' ? 'bg-profit/10 text-profit' : 'bg-loss/10 text-loss'}`}>
                    {trade.direction === 'Buy' ? '▲' : '▼'} {trade.direction}
                  </span>
                </td>
                <td className="py-2.5 px-2 text-muted-foreground text-xs">{trade.session}</td>
                <td className="py-2.5 px-2 font-mono text-right">{trade.entry_price}</td>
                <td className="py-2.5 px-2 font-mono text-right">{hasExit ? trade.exit_price : '—'}</td>
                <td className={`py-2.5 px-2 font-mono text-right font-semibold ${pips !== null ? (pips >= 0 ? 'text-profit' : 'text-loss') : ''}`}>
                  {pips !== null ? `${pips > 0 ? '+' : ''}${pips}` : '—'}
                </td>
                <td className={`py-2.5 px-2 font-mono text-right font-semibold ${rMult !== null ? (rMult >= 0 ? 'text-profit' : 'text-loss') : ''}`}>
                  {rMult !== null ? `${rMult > 0 ? '+' : ''}${rMult}R` : '—'}
                </td>
                <td className={`py-2.5 px-2 font-mono text-right font-semibold ${pnl !== null ? (pnl >= 0 ? 'text-profit' : 'text-loss') : ''}`}>
                  {pnl !== null ? `${pnl > 0 ? '+' : ''}$${pnl}` : '—'}
                </td>
                <td className="py-2.5 px-2 text-xs text-muted-foreground">{trade.strategy || '—'}</td>
                <td className="py-2.5 px-2 text-center">
                  <span className={`text-xs px-1.5 py-0.5 rounded ${trade.status === 'Open' ? 'bg-warning/20 text-warning' : 'bg-profit/10 text-profit'}`}>
                    {trade.status}
                  </span>
                </td>
                <td className="py-2.5 px-2 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onView(trade)}>
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(trade)}>
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-loss" onClick={() => onDelete(trade.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
