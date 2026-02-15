import { useState, useCallback } from 'react';
import { Trade, TradeStats, generateTradeId, calculateRMultiple, calculatePnlDollar } from '@/lib/trade-types';

const STORAGE_KEY = 'trading-journal-trades';

function loadTrades(): Trade[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    const trades: Trade[] = JSON.parse(data);
    // Migrate old trades missing CRT fields
    return trades.map(t => ({
      dealingRangeHigh: null,
      dealingRangeLow: null,
      equilibrium: null,
      tradeLocation: null,
      liquiditySweepType: null,
      keyLevels: [],
      entryType: null,
      entryQuality: null,
      htfBiasRespected: null,
      ltfBosConfirmed: null,
      mssPresent: null,
      ...t,
    }));
  } catch {
    return [];
  }
}

function saveTrades(trades: Trade[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trades));
}

export function useTrades() {
  const [trades, setTrades] = useState<Trade[]>(loadTrades);

  const addTrade = useCallback((trade: Omit<Trade, 'id' | 'createdAt'>) => {
    const newTrade: Trade = {
      ...trade,
      id: generateTradeId(),
      createdAt: new Date().toISOString(),
    };
    setTrades(prev => {
      const updated = [newTrade, ...prev];
      saveTrades(updated);
      return updated;
    });
    return newTrade;
  }, []);

  const updateTrade = useCallback((id: string, updates: Partial<Trade>) => {
    setTrades(prev => {
      const updated = prev.map(t => t.id === id ? { ...t, ...updates } : t);
      saveTrades(updated);
      return updated;
    });
  }, []);

  const deleteTrade = useCallback((id: string) => {
    setTrades(prev => {
      const updated = prev.filter(t => t.id !== id);
      saveTrades(updated);
      return updated;
    });
  }, []);

  const getStats = useCallback((): TradeStats => {
    const closed = trades.filter(t => t.status === 'Closed' && t.exitPrice !== null);
    if (closed.length === 0) {
      return { totalTrades: 0, winRate: 0, totalPnl: 0, avgRMultiple: 0, bestTrade: 0, worstTrade: 0, profitFactor: 0, avgHoldingTime: '—', expectancy: 0, maxDrawdown: 0, consecutiveWins: 0, consecutiveLosses: 0 };
    }

    const results = closed.map(t => {
      const rMult = calculateRMultiple(t.entryPrice, t.exitPrice!, t.stopLoss, t.direction);
      const pnl = calculatePnlDollar(t.riskAmount, rMult);
      return { rMult, pnl };
    });

    const wins = results.filter(r => r.pnl > 0);
    const losses = results.filter(r => r.pnl < 0);
    const totalWins = wins.reduce((s, r) => s + r.pnl, 0);
    const totalLosses = Math.abs(losses.reduce((s, r) => s + r.pnl, 0));

    // Consecutive wins/losses
    let maxConsWins = 0, maxConsLosses = 0, consWins = 0, consLosses = 0;
    for (const r of results) {
      if (r.pnl > 0) { consWins++; consLosses = 0; maxConsWins = Math.max(maxConsWins, consWins); }
      else if (r.pnl < 0) { consLosses++; consWins = 0; maxConsLosses = Math.max(maxConsLosses, consLosses); }
      else { consWins = 0; consLosses = 0; }
    }

    // Max drawdown
    let peak = 0, maxDD = 0, cumPnl = 0;
    for (const r of results) {
      cumPnl += r.pnl;
      peak = Math.max(peak, cumPnl);
      maxDD = Math.max(maxDD, peak - cumPnl);
    }

    const winRate = Math.round((wins.length / closed.length) * 100);
    const avgR = results.reduce((s, r) => s + r.rMult, 0) / closed.length;
    const expectancy = (winRate / 100) * (wins.length > 0 ? totalWins / wins.length : 0) - ((100 - winRate) / 100) * (losses.length > 0 ? totalLosses / losses.length : 0);

    return {
      totalTrades: closed.length,
      winRate,
      totalPnl: Math.round(results.reduce((s, r) => s + r.pnl, 0) * 100) / 100,
      avgRMultiple: Math.round(avgR * 100) / 100,
      bestTrade: Math.max(...results.map(r => r.pnl)),
      worstTrade: Math.min(...results.map(r => r.pnl)),
      profitFactor: totalLosses === 0 ? totalWins : Math.round((totalWins / totalLosses) * 100) / 100,
      avgHoldingTime: '—',
      expectancy: Math.round(expectancy * 100) / 100,
      maxDrawdown: Math.round(maxDD * 100) / 100,
      consecutiveWins: maxConsWins,
      consecutiveLosses: maxConsLosses,
    };
  }, [trades]);

  return { trades, addTrade, updateTrade, deleteTrade, getStats };
}
