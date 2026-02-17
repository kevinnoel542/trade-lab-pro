import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
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

  // Fetch all transactions & closed trades for dynamic balance calc
  const fetchBalanceData = useCallback(async () => {
    if (!userId) return;
    const [txRes, tradeRes] = await Promise.all([
      supabase.from('account_transactions').select('*').eq('user_id', userId),
      supabase.from('trades').select('entry_price, exit_price, stop_loss, direction, risk_amount, account_id')
        .eq('user_id', userId).eq('status', 'Closed').not('exit_price', 'is', null),
    ]);
    if (txRes.data) setAllTransactions(txRes.data as AccountTransaction[]);
    if (tradeRes.data) setClosedTrades(tradeRes.data as ClosedTradeRow[]);
  }, [userId]);

  // Compute dynamic balances per account
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

  // Enrich accounts with computed current_balance
  const enrichedAccounts = useMemo(() =>
    accounts.map(a => ({ ...a, current_balance: dynamicBalances[a.id] ?? a.current_balance })),
  [accounts, dynamicBalances]);

  const activeAccount = enrichedAccounts.find(a => a.id === activeAccountId) || enrichedAccounts[0] || null;

  const fetchAccounts = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase
      .from('trading_accounts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at');
    if (data) {
      setAccounts(data as TradingAccount[]);
      if (!activeAccountId && data.length > 0) {
        setActiveAccountId(data[0].id);
        localStorage.setItem(ACTIVE_ACCOUNT_KEY, data[0].id);
      }
    }
    setLoading(false);
  }, [userId, activeAccountId]);

  const fetchTransactions = useCallback(async (accountId: string) => {
    const { data } = await supabase
      .from('account_transactions')
      .select('*')
      .eq('account_id', accountId)
      .order('created_at', { ascending: false });
    if (data) setTransactions(data as AccountTransaction[]);
  }, []);

  useEffect(() => { fetchAccounts(); fetchBalanceData(); }, [fetchAccounts, fetchBalanceData]);
  useEffect(() => { if (activeAccount) fetchTransactions(activeAccount.id); }, [activeAccount?.id, fetchTransactions]);

  const switchAccount = (id: string) => {
    setActiveAccountId(id);
    localStorage.setItem(ACTIVE_ACCOUNT_KEY, id);
  };

  const createAccount = async (name: string, type: string, broker: string, initialBalance: number) => {
    if (!userId) return;
    const { error } = await supabase.from('trading_accounts').insert({
      user_id: userId, name, type, broker: broker || null,
      initial_balance: initialBalance, current_balance: initialBalance,
    });
    if (!error) await fetchAccounts();
    return { error };
  };

  const updateAccount = async (id: string, updates: Partial<Pick<TradingAccount, 'name' | 'type' | 'broker'>>) => {
    const { error } = await supabase.from('trading_accounts').update(updates).eq('id', id);
    if (!error) await fetchAccounts();
    return { error };
  };

  const deleteAccount = async (id: string) => {
    const { error } = await supabase.from('trading_accounts').delete().eq('id', id);
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
    if (!userId) return;

    const { error: txError } = await supabase.from('account_transactions').insert({
      account_id: accountId, user_id: userId, type, amount, note: note || null,
    });
    if (txError) return { error: txError };

    // Refresh balance data (dynamic calc will update current_balance)
    await fetchBalanceData();
    await fetchTransactions(accountId);
    return { error: null };
  };

  // Allow external refresh of balance data (e.g. after closing a trade)
  const refreshBalances = useCallback(async () => {
    await fetchBalanceData();
  }, [fetchBalanceData]);

  return {
    accounts: enrichedAccounts, activeAccount, activeAccountId, transactions, loading,
    switchAccount, createAccount, updateAccount, deleteAccount, addTransaction, fetchAccounts, refreshBalances,
  };
}
