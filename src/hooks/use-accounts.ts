import { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '@/lib/api';
import { calculateRMultiple, calculatePnlDollar } from '@/lib/trade-types';

export interface TradingAccount {
  id: string;
  user_id: string;
  name: string;
  type: string;
  broker: string | null;
  initial_balance: number;
  current_balance: number;
  currency: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AccountTransaction {
  id: string;
  account_id: string;
  user_id: string;
  type: 'deposit' | 'withdrawal';
  amount: number;
  note: string | null;
  created_at: string;
}

interface ClosedTradeRow {
  entry_price: number;
  exit_price: number;
  stop_loss: number;
  direction: string;
  risk_amount: number;
  account_id: string;
}

const ACTIVE_ACCOUNT_KEY = 'tradevault-active-account';

export function useAccounts(userId: string | undefined) {
  const [accounts, setAccounts] = useState<TradingAccount[]>([]);
  const [activeAccountId, setActiveAccountId] = useState<string | null>(
    localStorage.getItem(ACTIVE_ACCOUNT_KEY)
  );
  const [transactions, setTransactions] = useState<AccountTransaction[]>([]);
  const [allTransactions, setAllTransactions] = useState<AccountTransaction[]>([]);
  const [closedTrades, setClosedTrades] = useState<ClosedTradeRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBalanceData = useCallback(async () => {
    const [txRes, tradeRes] = await Promise.all([
      api.getAllTransactions(),
      api.getClosedSummary(),
    ]);
    if (txRes.data) setAllTransactions(txRes.data as AccountTransaction[]);
    if (tradeRes.data) setClosedTrades(tradeRes.data as ClosedTradeRow[]);
  }, []);

  const dynamicBalances = useMemo(() => {
    const map: Record<string, number> = {};
    accounts.forEach(acc => {
      const deposits = allTransactions.filter(t => t.account_id === acc.id && t.type === 'deposit').reduce((s, t) => s + t.amount, 0);
      const withdrawals = allTransactions.filter(t => t.account_id === acc.id && t.type === 'withdrawal').reduce((s, t) => s + t.amount, 0);
      const tradePnl = closedTrades.filter(t => t.account_id === acc.id).reduce((sum, t) => {
        const rMult = calculateRMultiple(t.entry_price, t.exit_price!, t.stop_loss, t.direction as 'Buy' | 'Sell');
        return sum + calculatePnlDollar(t.risk_amount, rMult);
      }, 0);
      map[acc.id] = Math.round((acc.initial_balance + deposits - withdrawals + tradePnl) * 100) / 100;
    });
    return map;
  }, [accounts, allTransactions, closedTrades]);

  const enrichedAccounts = useMemo(() =>
    accounts.map(a => ({ ...a, current_balance: dynamicBalances[a.id] ?? a.current_balance })),
  [accounts, dynamicBalances]);

  const activeAccount = enrichedAccounts.find(a => a.id === activeAccountId) || enrichedAccounts[0] || null;

  const fetchAccounts = useCallback(async () => {
    const { data } = await api.getAccounts();
    if (data) {
      setAccounts(data as TradingAccount[]);
      if (!activeAccountId && data.length > 0) {
        setActiveAccountId(data[0].id);
        localStorage.setItem(ACTIVE_ACCOUNT_KEY, data[0].id);
      }
    }
    setLoading(false);
  }, [activeAccountId]);

  const fetchTransactions = useCallback(async (accountId: string) => {
    const { data } = await api.getTransactions(accountId);
    if (data) setTransactions(data as AccountTransaction[]);
  }, []);

  useEffect(() => { fetchAccounts(); fetchBalanceData(); }, [fetchAccounts, fetchBalanceData]);
  useEffect(() => { if (activeAccount) fetchTransactions(activeAccount.id); }, [activeAccount?.id, fetchTransactions]);

  const switchAccount = (id: string) => {
    setActiveAccountId(id);
    localStorage.setItem(ACTIVE_ACCOUNT_KEY, id);
  };

  const createAccount = async (name: string, type: string, broker: string, initialBalance: number) => {
    const { error } = await api.createAccount({
      name, type, broker: broker || null,
      initial_balance: initialBalance,
    });
    if (!error) await fetchAccounts();
    return { error };
  };

  const updateAccount = async (id: string, updates: Partial<Pick<TradingAccount, 'name' | 'type' | 'broker'>>) => {
    const { error } = await api.updateAccount(id, updates);
    if (!error) await fetchAccounts();
    return { error };
  };

  const deleteAccount = async (id: string) => {
    const { error } = await api.deleteAccount(id);
    if (!error) {
      if (activeAccountId === id) {
        const remaining = accounts.filter(a => a.id !== id);
        if (remaining.length > 0) switchAccount(remaining[0].id);
        else setActiveAccountId(null);
      }
      await fetchAccounts();
      await fetchBalanceData();
    }
    return { error };
  };

  const addTransaction = async (accountId: string, type: 'deposit' | 'withdrawal', amount: number, note?: string) => {
    const { error: txError } = await api.createTransaction({
      account_id: accountId, type, amount, note: note || null,
    });
    if (txError) return { error: txError };
    await fetchBalanceData();
    await fetchTransactions(accountId);
    return { error: null };
  };

  const refreshBalances = useCallback(async () => {
    await fetchBalanceData();
  }, [fetchBalanceData]);

  return {
    accounts: enrichedAccounts, activeAccount, activeAccountId, transactions, loading,
    switchAccount, createAccount, updateAccount, deleteAccount, addTransaction, fetchAccounts, refreshBalances,
  };
}
