import { useState } from 'react';
import { DbTrade } from '@/hooks/use-trades';
import { calculatePips, pipsToDollars } from '@/lib/trade-types';
import { Trash2, Eye, Edit, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TradeTableProps {
  trades: DbTrade[];
  onDelete: (id: string) => void;
  onView: (trade: DbTrade) => void;
  onEdit: (trade: DbTrade) => void;
}

export function TradeTable({ trades, onDelete, onView, onEdit }: TradeTableProps) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(10);

  if (trades.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p className="text-lg">No trades logged yet</p>
        <p className="text-sm mt-1">Click "New Trade" to get started</p>
      </div>
    );
  }

  const totalPages = Math.ceil(trades.length / pageSize);
  const paginated = trades.slice((page - 1) * pageSize, page * pageSize);

  const handlePageSize = (val: string) => {
    setPageSize(Number(val));
    setPage(1);
  };

  return (
    <div className="space-y-3">

      {/* ── Desktop Table (hidden on mobile) ── */}
      <div className="hidden sm:block overflow-x-auto">
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
            {paginated.map(trade => {
              const hasExit = trade.exit_price !== null && trade.exit_price !== 0;
              const pips = hasExit ? calculatePips(trade.pair, trade.entry_price, trade.exit_price!, trade.direction as 'Buy' | 'Sell') : null;
              const rMult = hasExit ? (Math.abs(trade.entry_price - trade.stop_loss) > 0 ? Math.round(((trade.direction === 'Buy' ? trade.exit_price! - trade.entry_price : trade.entry_price - trade.exit_price!) / Math.abs(trade.entry_price - trade.stop_loss)) * 100) / 100 : 0) : null;
              const pnl = hasExit && pips !== null ? pipsToDollars(trade.pair, Math.abs(pips), trade.lot_size) * (pips >= 0 ? 1 : -1) : null;
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
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onView(trade)}><Eye className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(trade)}><Edit className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-loss" onClick={() => onDelete(trade.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Mobile Card View (hidden on desktop) ── */}
      <div className="sm:hidden space-y-2 px-3">
        {paginated.map(trade => {
          const hasExit = trade.exit_price !== null && trade.exit_price !== 0;
          const pips = hasExit ? calculatePips(trade.pair, trade.entry_price, trade.exit_price!, trade.direction as 'Buy' | 'Sell') : null;
          const rMult = hasExit ? (Math.abs(trade.entry_price - trade.stop_loss) > 0 ? Math.round(((trade.direction === 'Buy' ? trade.exit_price! - trade.entry_price : trade.entry_price - trade.exit_price!) / Math.abs(trade.entry_price - trade.stop_loss)) * 100) / 100 : 0) : null;
          const pnl = hasExit && pips !== null ? pipsToDollars(trade.pair, Math.abs(pips), trade.lot_size) * (pips >= 0 ? 1 : -1) : null;
          const isWin = pnl !== null && pnl >= 0;

          return (
            <div key={trade.id}
              className={`rounded-xl border p-3 relative overflow-hidden ${
                hasExit
                  ? isWin ? 'border-profit/20 bg-profit/5' : 'border-loss/20 bg-loss/5'
                  : 'border-border/60 bg-card'
              }`}>
              {/* Top row */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm">{trade.pair}</span>
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${trade.direction === 'Buy' ? 'bg-profit/15 text-profit' : 'bg-loss/15 text-loss'}`}>
                    {trade.direction === 'Buy' ? '▲' : '▼'} {trade.direction}
                  </span>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${trade.status === 'Open' ? 'bg-yellow-500/15 text-yellow-400' : 'bg-indigo-500/15 text-indigo-400'}`}>
                    {trade.status}
                  </span>
                </div>
                <div className="flex items-center gap-0.5">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onView(trade)}><Eye className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(trade)}><Edit className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-loss" onClick={() => onDelete(trade.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>

              {/* Info row */}
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground mb-2">
                <span className="font-mono">{trade.date}</span>
                <span>{trade.session}</span>
                {trade.strategy && <span>{trade.strategy}</span>}
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-4 gap-2">
                <div className="text-center">
                  <div className="text-[9px] font-bold text-muted-foreground uppercase mb-0.5">Pips</div>
                  <div className={`text-xs font-mono font-bold ${pips !== null ? (pips >= 0 ? 'text-profit' : 'text-loss') : 'text-muted-foreground'}`}>
                    {pips !== null ? `${pips > 0 ? '+' : ''}${pips}` : '—'}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-[9px] font-bold text-muted-foreground uppercase mb-0.5">R-Mult</div>
                  <div className={`text-xs font-mono font-bold ${rMult !== null ? (rMult >= 0 ? 'text-profit' : 'text-loss') : 'text-muted-foreground'}`}>
                    {rMult !== null ? `${rMult > 0 ? '+' : ''}${rMult}R` : '—'}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-[9px] font-bold text-muted-foreground uppercase mb-0.5">P&L</div>
                  <div className={`text-xs font-mono font-bold ${pnl !== null ? (pnl >= 0 ? 'text-profit' : 'text-loss') : 'text-muted-foreground'}`}>
                    {pnl !== null ? `${pnl > 0 ? '+' : ''}$${pnl}` : '—'}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-[9px] font-bold text-muted-foreground uppercase mb-0.5">Entry</div>
                  <div className="text-xs font-mono text-foreground">{trade.entry_price}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between pt-1 px-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="hidden sm:inline">Rows per page:</span>
          <Select value={String(pageSize)} onValueChange={handlePageSize}>
            <SelectTrigger className="h-7 w-14 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{(page - 1) * pageSize + 1}–{Math.min(page * pageSize, trades.length)} of {trades.length}</span>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
