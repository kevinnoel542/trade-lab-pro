import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TradeStats, calculateRMultiple, calculatePnlDollar } from '@/lib/trade-types';

export interface DbTrade {
  id: string;
  user_id: string;
  account_id: string;
  trade_id: string;
  date: string;
  session: string;
  pair: string;
  direction: string;
  lot_size: number;
  entry_price: number;
  stop_loss: number;
  take_profit: number;
  exit_price: number | null;
  risk_amount: number;
  risk_percent: number;
  account_size: number;
  strategy: string | null;
  htf_timeframe: string | null;
  entry_timeframe: string | null;
  market_condition: string | null;
  confluences: string[];
  screenshot_before: string | null;
  screenshot_after: string | null;
  notes: string;
  status: string;
  dealing_range_high: number | null;
  dealing_range_low: number | null;
  equilibrium: number | null;
  trade_location: string | null;
  liquidity_sweep_type: string | null;
  key_levels: string[];
  entry_type: string | null;
  entry_quality: number | null;
  htf_bias_respected: boolean | null;
  ltf_bos_confirmed: boolean | null;
  mss_present: boolean | null;
  created_at: string;
  updated_at: string;
}

export function useTrades(userId: string | undefined, accountId: string | undefined) {
  const [trades, setTrades] = useState<DbTrade[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTrades = useCallback(async () => {
    if (!userId || !accountId) { setTrades([]); setLoading(false); return; }
    const { data } = await supabase
      .from('trades')
      .select('*')
      .eq('account_id', accountId)
      .order('date', { ascending: false });
    if (data) setTrades(data as DbTrade[]);
    setLoading(false);
  }, [userId, accountId]);

  useEffect(() => { fetchTrades(); }, [fetchTrades]);

  const addTrade = useCallback(async (trade: Omit<DbTrade, 'id' | 'created_at' | 'updated_at'>) => {
    const { error } = await supabase.from('trades').insert(trade);
    if (!error) await fetchTrades();
    return { error };
  }, [fetchTrades]);

  const updateTrade = useCallback(async (id: string, updates: Partial<DbTrade>) => {
    const { error } = await supabase.from('trades').update(updates).eq('id', id);
    if (!error) await fetchTrades();
    return { error };
  }, [fetchTrades]);

  const deleteTrade = useCallback(async (id: string) => {
    const { error } = await supabase.from('trades').delete().eq('id', id);
    if (!error) await fetchTrades();
    return { error };
  }, [fetchTrades]);

  const getStats = useCallback((): TradeStats => {
    const closed = trades.filter(t => t.status === 'Closed' && t.exit_price !== null);
    if (closed.length === 0) {
      return { totalTrades: 0, winRate: 0, totalPnl: 0, avgRMultiple: 0, bestTrade: 0, worstTrade: 0, profitFactor: 0, avgHoldingTime: '—', expectancy: 0, maxDrawdown: 0, consecutiveWins: 0, consecutiveLosses: 0 };
    }
    const results = closed.map(t => {
      const rMult = calculateRMultiple(t.entry_price, t.exit_price!, t.stop_loss, t.direction as 'Buy' | 'Sell');
      const pnl = calculatePnlDollar(t.risk_amount, rMult);
      return { rMult, pnl };
    });
    const wins = results.filter(r => r.pnl > 0);
    const losses = results.filter(r => r.pnl < 0);
    const totalWins = wins.reduce((s, r) => s + r.pnl, 0);
    const totalLosses = Math.abs(losses.reduce((s, r) => s + r.pnl, 0));
    let maxConsWins = 0, maxConsLosses = 0, cw = 0, cl = 0;
    for (const r of results) {
      if (r.pnl > 0) { cw++; cl = 0; maxConsWins = Math.max(maxConsWins, cw); }
      else if (r.pnl < 0) { cl++; cw = 0; maxConsLosses = Math.max(maxConsLosses, cl); }
      else { cw = 0; cl = 0; }
    }
    let peak = 0, maxDD = 0, cumPnl = 0;
    for (const r of results) { cumPnl += r.pnl; peak = Math.max(peak, cumPnl); maxDD = Math.max(maxDD, peak - cumPnl); }
    const winRate = Math.round((wins.length / closed.length) * 100);
    const avgR = results.reduce((s, r) => s + r.rMult, 0) / closed.length;
    const expectancy = (winRate / 100) * (wins.length > 0 ? totalWins / wins.length : 0) - ((100 - winRate) / 100) * (losses.length > 0 ? totalLosses / losses.length : 0);
    return {
      totalTrades: closed.length, winRate,
      totalPnl: Math.round(results.reduce((s, r) => s + r.pnl, 0) * 100) / 100,
      avgRMultiple: Math.round(avgR * 100) / 100,
      bestTrade: Math.max(...results.map(r => r.pnl)),
      worstTrade: Math.min(...results.map(r => r.pnl)),
      profitFactor: totalLosses === 0 ? totalWins : Math.round((totalWins / totalLosses) * 100) / 100,
      avgHoldingTime: '—',
      expectancy: Math.round(expectancy * 100) / 100,
      maxDrawdown: Math.round(maxDD * 100) / 100,
      consecutiveWins: maxConsWins, consecutiveLosses: maxConsLosses,
    };
  }, [trades]);

  return { trades, loading, addTrade, updateTrade, deleteTrade, getStats, fetchTrades };
}
