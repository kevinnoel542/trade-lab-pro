export interface Trade {
  id: string;
  date: string;
  session: 'London' | 'New York' | 'Asia' | 'Sydney';
  pair: string;
  direction: 'Buy' | 'Sell';
  lotSize: number;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  exitPrice: number | null;
  riskAmount: number;
  riskPercent: number;
  accountSize: number;
  strategy: string;
  htfTimeframe: string;
  entryTimeframe: string;
  marketCondition: 'Trending' | 'Ranging' | 'High Volatility' | 'Low Volatility';
  confluences: string[];
  screenshotBefore: string | null;
  screenshotAfter: string | null;
  notes: string;
  status: 'Open' | 'Closed';
  createdAt: string;

  // CRT-specific fields
  dealingRangeHigh: number | null;
  dealingRangeLow: number | null;
  equilibrium: number | null; // auto-calculated 50%
  tradeLocation: 'Premium' | 'Discount' | 'EQ' | null;
  liquiditySweepType: string | null;
  keyLevels: string[];

  // Entry model precision
  entryType: string | null;
  entryQuality: number | null; // 1-5
  htfBiasRespected: boolean | null;
  ltfBosConfirmed: boolean | null;
  mssPresent: boolean | null;
}

export interface TradeStats {
  totalTrades: number;
  winRate: number;
  totalPnl: number;
  avgRMultiple: number;
  bestTrade: number;
  worstTrade: number;
  profitFactor: number;
  avgHoldingTime: string;
  expectancy: number;
  maxDrawdown: number;
  consecutiveWins: number;
  consecutiveLosses: number;
}

export const SESSIONS = ['London', 'New York', 'Asia', 'Sydney'] as const;

export const PAIRS = [
  'EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'AUDUSD', 'NZDUSD', 'USDCAD',
  'EURGBP', 'EURJPY', 'GBPJPY', 'XAUUSD', 'XAGUSD', 'US30', 'NAS100', 'SPX500',
];

export const STRATEGIES = [
  'Breakout', 'Liquidity Sweep', 'Trend Continuation', 'Reversal',
  'Range Play', 'News Trade', 'Scalp', 'Swing', 'Order Block Entry',
];

export const TIMEFRAMES = ['M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1', 'W1', 'MN'];

export const MARKET_CONDITIONS = ['Trending', 'Ranging', 'High Volatility', 'Low Volatility'] as const;

export const CONFLUENCES = [
  'Support/Resistance', 'FVG', 'Order Block', 'News Catalyst',
  'EMA Alignment', 'RSI Divergence', 'Volume Profile', 'Fibonacci',
  'Trendline Break', 'Liquidity Zone', 'VWAP', 'Market Structure Shift',
];

export const LIQUIDITY_SWEEP_TYPES = [
  'PDH', 'PDL', 'Asian High', 'Asian Low', 'Internal', 'External',
] as const;

export const KEY_LEVELS = ['OB', 'FVG', 'RB', 'BB'] as const;

export const ENTRY_TYPES = [
  'FVG Mitigation', 'OB Tap', 'Breaker', 'Confirmation BOS', 'Aggressive', 'Conservative',
] as const;

export const TRADE_LOCATIONS = ['Premium', 'Discount', 'EQ'] as const;

export function calculateEquilibrium(high: number, low: number): number {
  return Math.round(((high + low) / 2) * 100000) / 100000;
}

export function getTradeLocation(price: number, high: number, low: number): 'Premium' | 'Discount' | 'EQ' {
  const eq = calculateEquilibrium(high, low);
  const range = high - low;
  const eqZone = range * 0.05;
  if (Math.abs(price - eq) <= eqZone) return 'EQ';
  return price > eq ? 'Premium' : 'Discount';
}

export function calculatePips(pair: string, entry: number, exit: number, direction: 'Buy' | 'Sell'): number {
  const isJpy = pair.includes('JPY');
  const isGold = pair.includes('XAU');
  const multiplier = isJpy ? 100 : isGold ? 10 : 10000;
  const diff = direction === 'Buy' ? exit - entry : entry - exit;
  return Math.round(diff * multiplier * 10) / 10;
}

export function calculateRMultiple(entry: number, exit: number, stopLoss: number, direction: 'Buy' | 'Sell'): number {
  const risk = Math.abs(entry - stopLoss);
  if (risk === 0) return 0;
  const reward = direction === 'Buy' ? exit - entry : entry - exit;
  return Math.round((reward / risk) * 100) / 100;
}

export function calculatePnlDollar(riskAmount: number, rMultiple: number): number {
  return Math.round(riskAmount * rMultiple * 100) / 100;
}

export function calculatePnlPercent(pnlDollar: number, accountSize: number): number {
  if (accountSize === 0) return 0;
  return Math.round((pnlDollar / accountSize) * 10000) / 100;
}

export function generateTradeId(): string {
  const now = new Date();
  const datePart = now.toISOString().slice(2, 10).replace(/-/g, '');
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `T${datePart}-${rand}`;
}
