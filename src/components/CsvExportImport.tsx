import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Download, Upload, AlertTriangle, CheckCircle } from 'lucide-react';
import { tradesToCsv, downloadCsv, parseCsvImport, CsvImportResult } from '@/lib/csv-utils';
import { DbTrade } from '@/hooks/use-trades';
import { toast } from 'sonner';

interface CsvExportImportProps {
  trades: DbTrade[];
  userId: string;
  accountId: string;
  accountBalance: number;
  onImport: (trade: Omit<DbTrade, 'id' | 'created_at' | 'updated_at'>) => Promise<{ error: any }>;
}

export function CsvExportImport({ trades, userId, accountId, accountBalance, onImport }: CsvExportImportProps) {
  const [showImport, setShowImport] = useState(false);
  const [importResult, setImportResult] = useState<CsvImportResult | null>(null);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    if (trades.length === 0) { toast.error('No trades to export'); return; }
    const csv = tradesToCsv(trades);
    const date = new Date().toISOString().slice(0, 10);
    downloadCsv(csv, `tradevault-trades-${date}.csv`);
    toast.success(`Exported ${trades.length} trades`);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const result = parseCsvImport(text);
      setImportResult(result);
    };
    reader.readAsText(file);
  };

  const handleImportConfirm = async () => {
    if (!importResult?.trades.length) return;
    setImporting(true);
    let success = 0, failed = 0;
    for (const partial of importResult.trades) {
      const trade: Omit<DbTrade, 'id' | 'created_at' | 'updated_at'> = {
        user_id: userId,
        account_id: accountId,
        trade_id: partial.trade_id || `IMP-${Date.now()}`,
        date: partial.date || new Date().toISOString().slice(0, 10),
        session: (partial.session || 'London') as any,
        pair: partial.pair || 'EURUSD',
        direction: partial.direction || 'Buy',
        lot_size: partial.lot_size || 0.01,
        entry_price: partial.entry_price || 0,
        stop_loss: partial.stop_loss || 0,
        take_profit: partial.take_profit || 0,
        exit_price: partial.exit_price ?? null,
        risk_amount: partial.risk_amount || 0,
        risk_percent: partial.risk_percent || 0,
        account_size: partial.account_size || accountBalance,
        strategy: partial.strategy || null,
        htf_timeframe: null,
        entry_timeframe: null,
        market_condition: null,
        confluences: partial.confluences || [],
        screenshot_before: null,
        screenshot_after: null,
        notes: partial.notes || '',
        status: partial.status || 'Open',
        dealing_range_high: null,
        dealing_range_low: null,
        equilibrium: null,
        trade_location: null,
        liquidity_sweep_type: null,
        key_levels: partial.key_levels || [],
        entry_type: null,
        entry_quality: null,
        htf_bias_respected: null,
        ltf_bos_confirmed: null,
        mss_present: null,
      };
      const { error } = await onImport(trade);
      if (error) failed++; else success++;
    }
    setImporting(false);
    toast.success(`Imported ${success} trades${failed > 0 ? `, ${failed} failed` : ''}`);
    setShowImport(false);
    setImportResult(null);
  };

  return (
    <>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={handleExport}>
          <Download className="h-3.5 w-3.5" />Export CSV
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => { setShowImport(true); setImportResult(null); }}>
          <Upload className="h-3.5 w-3.5" />Import CSV
        </Button>
      </div>

      <Dialog open={showImport} onOpenChange={setShowImport}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Import Trades from CSV</DialogTitle>
            <DialogDescription>
              Supports TradeVault exports and MT5 trade history (File → Save as CSV/Tab-delimited).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <input ref={fileRef} type="file" accept=".csv,.txt,.tsv" onChange={handleFileSelect} className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer" />

            {importResult && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-profit" />
                  <span>{importResult.trades.length} trades parsed</span>
                </div>

                {importResult.warnings.length > 0 && (
                  <div className="rounded-md bg-warning/10 border border-warning/20 p-3 space-y-1">
                    {importResult.warnings.map((w, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-warning">
                        <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
                        <span>{w}</span>
                      </div>
                    ))}
                  </div>
                )}

                {importResult.trades.length > 0 && (
                  <div className="rounded-md bg-secondary p-3 text-xs max-h-40 overflow-y-auto space-y-1">
                    <p className="font-semibold text-muted-foreground mb-2">Preview (first 5):</p>
                    {importResult.trades.slice(0, 5).map((t, i) => (
                      <div key={i} className="font-mono">
                        {t.date} | {t.pair} | {t.direction} | {t.lot_size} lots | Entry: {t.entry_price}
                      </div>
                    ))}
                    {importResult.trades.length > 5 && <div className="text-muted-foreground">...and {importResult.trades.length - 5} more</div>}
                  </div>
                )}

                <Button onClick={handleImportConfirm} disabled={importing || importResult.trades.length === 0} className="w-full">
                  {importing ? 'Importing...' : `Import ${importResult.trades.length} Trades`}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
