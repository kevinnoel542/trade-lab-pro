import { DbTrade } from '@/hooks/use-trades';

// ─── Export ───

const EXPORT_COLUMNS: (keyof DbTrade)[] = [
  'trade_id', 'date', 'session', 'pair', 'direction', 'lot_size',
  'entry_price', 'stop_loss', 'take_profit', 'exit_price',
  'risk_amount', 'risk_percent', 'account_size', 'strategy',
  'htf_timeframe', 'entry_timeframe', 'market_condition',
  'confluences', 'notes', 'status',
  'dealing_range_high', 'dealing_range_low', 'equilibrium',
  'trade_location', 'liquidity_sweep_type', 'key_levels',
  'entry_type', 'entry_quality', 'htf_bias_respected',
  'ltf_bos_confirmed', 'mss_present',
];

export function tradesToCsv(trades: DbTrade[]): string {
  const header = EXPORT_COLUMNS.join(',');
  const rows = trades.map(t =>
    EXPORT_COLUMNS.map(col => {
      const val = t[col];
      if (val === null || val === undefined) return '';
      if (Array.isArray(val)) return `"${val.join(';')}"`;
      if (typeof val === 'string' && (val.includes(',') || val.includes('"')))
        return `"${val.replace(/"/g, '""')}"`;
      return String(val);
    }).join(',')
  );
  return [header, ...rows].join('\n');
}

export function downloadCsv(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Import (MT5 compatible) ───

/** Map of MT5 column names → our DbTrade field names */
const MT5_COLUMN_MAP: Record<string, keyof DbTrade> = {
  // MT5 columns
  'ticket': 'trade_id',
  'order': 'trade_id',
  'open time': 'date',
  'time': 'date',
  'type': 'direction',
  'symbol': 'pair',
  'volume': 'lot_size',
  'price': 'entry_price',
  'open price': 'entry_price',
  's / l': 'stop_loss',
  'sl': 'stop_loss',
  'stop loss': 'stop_loss',
  't / p': 'take_profit',
  'tp': 'take_profit',
  'take profit': 'take_profit',
  'close price': 'exit_price',
  'close time': 'date', // fallback
  'profit': 'notes', // we'll store MT5 profit in notes
  'comment': 'notes',
  // TradeVault native columns (lowercase match)
  'trade_id': 'trade_id',
  'date': 'date',
  'session': 'session',
  'pair': 'pair',
  'direction': 'direction',
  'lot_size': 'lot_size',
  'entry_price': 'entry_price',
  'stop_loss': 'stop_loss',
  'take_profit': 'take_profit',
  'exit_price': 'exit_price',
  'risk_amount': 'risk_amount',
  'risk_percent': 'risk_percent',
  'account_size': 'account_size',
  'strategy': 'strategy',
  'htf_timeframe': 'htf_timeframe',
  'entry_timeframe': 'entry_timeframe',
  'market_condition': 'market_condition',
  'confluences': 'confluences',
  'notes': 'notes',
  'status': 'status',
  'dealing_range_high': 'dealing_range_high',
  'dealing_range_low': 'dealing_range_low',
  'equilibrium': 'equilibrium',
  'trade_location': 'trade_location',
  'liquidity_sweep_type': 'liquidity_sweep_type',
  'key_levels': 'key_levels',
  'entry_type': 'entry_type',
  'entry_quality': 'entry_quality',
  'htf_bias_respected': 'htf_bias_respected',
  'ltf_bos_confirmed': 'ltf_bos_confirmed',
  'mss_present': 'mss_present',
};

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') { current += '"'; i++; }
      else if (ch === '"') inQuotes = false;
      else current += ch;
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ',' || ch === '\t') { result.push(current.trim()); current = ''; }
      else current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function normalizeDirection(val: string): 'Buy' | 'Sell' {
  const v = val.toLowerCase().trim();
  if (v === 'buy' || v === 'buy limit' || v === 'buy stop' || v === 'long') return 'Buy';
  return 'Sell';
}

function extractDate(val: string): string {
  // MT5: "2024.01.15 12:30:00" → "2024-01-15"
  const match = val.match(/(\d{4})[./\-](\d{2})[./\-](\d{2})/);
  if (match) return `${match[1]}-${match[2]}-${match[3]}`;
  return new Date().toISOString().slice(0, 10);
}

function guessSession(dateStr: string): string {
  // Try to extract time for session guess
  const timeMatch = dateStr.match(/(\d{2}):(\d{2})/);
  if (timeMatch) {
    const hour = parseInt(timeMatch[1]);
    if (hour >= 0 && hour < 7) return 'Asia';
    if (hour >= 7 && hour < 12) return 'London';
    if (hour >= 12 && hour < 21) return 'New York';
    return 'Sydney';
  }
  return 'London';
}

export interface CsvImportResult {
  trades: Partial<DbTrade>[];
  warnings: string[];
}

export function parseCsvImport(csvText: string): CsvImportResult {
  const lines = csvText.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return { trades: [], warnings: ['File is empty or has no data rows'] };

  const headerLine = lines[0];
  const headers = parseCsvLine(headerLine).map(h => h.toLowerCase().trim());

  // Map headers to our fields
  const columnMap: (keyof DbTrade | null)[] = headers.map(h => MT5_COLUMN_MAP[h] || null);

  const warnings: string[] = [];
  const trades: Partial<DbTrade>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    if (values.length === 0 || values.every(v => !v)) continue;

    const raw: Record<string, string> = {};
    columnMap.forEach((field, idx) => {
      if (field && values[idx]) raw[field] = values[idx];
    });

    // Skip if no pair/symbol
    if (!raw.pair) {
      warnings.push(`Row ${i + 1}: No pair/symbol found, skipped`);
      continue;
    }

    const dateRaw = raw.date || new Date().toISOString().slice(0, 10);
    const date = extractDate(dateRaw);
    const session = raw.session || guessSession(dateRaw);
    const direction = raw.direction ? normalizeDirection(raw.direction) : 'Buy';

    const trade: Partial<DbTrade> = {
      trade_id: raw.trade_id || `IMP-${Date.now()}-${i}`,
      date,
      session: session as any,
      pair: raw.pair.replace(/[^A-Z0-9a-z]/g, '').toUpperCase(),
      direction,
      lot_size: parseFloat(raw.lot_size || '0.01') || 0.01,
      entry_price: parseFloat(raw.entry_price || '0') || 0,
      stop_loss: parseFloat(raw.stop_loss || '0') || 0,
      take_profit: parseFloat(raw.take_profit || '0') || 0,
      exit_price: raw.exit_price ? parseFloat(raw.exit_price) || null : null,
      risk_amount: parseFloat(raw.risk_amount || '0') || 0,
      risk_percent: parseFloat(raw.risk_percent || '0') || 0,
      account_size: parseFloat(raw.account_size || '0') || 0,
      strategy: raw.strategy || null,
      notes: raw.notes || '',
      status: raw.exit_price ? 'Closed' : (raw.status || 'Open'),
      confluences: raw.confluences ? (raw.confluences as string).split(';').filter(Boolean) : [],
      key_levels: raw.key_levels ? (raw.key_levels as string).split(';').filter(Boolean) : [],
    };

    trades.push(trade);
  }

  return { trades, warnings };
}
