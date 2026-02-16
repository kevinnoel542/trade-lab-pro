import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

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

const ACTIVE_ACCOUNT_KEY = 'tradevault-active-account';

export function useAccounts(userId: string | undefined) {
  const [accounts, setAccounts] = useState<TradingAccount[]>([]);
  const [activeAccountId, setActiveAccountId] = useState<string | null>(
    localStorage.getItem(ACTIVE_ACCOUNT_KEY)
  );
  const [transactions, setTransactions] = useState<AccountTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const activeAccount = accounts.find(a => a.id === activeAccountId) || accounts[0] || null;

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

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);
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
    }
    return { error };
  };

  const addTransaction = async (accountId: string, type: 'deposit' | 'withdrawal', amount: number, note?: string) => {
    if (!userId) return;
    const account = accounts.find(a => a.id === accountId);
    if (!account) return;

    const newBalance = type === 'deposit'
      ? account.current_balance + amount
      : account.current_balance - amount;

    const { error: txError } = await supabase.from('account_transactions').insert({
      account_id: accountId, user_id: userId, type, amount, note: note || null,
    });
    if (txError) return { error: txError };

    const { error: updateError } = await supabase.from('trading_accounts')
      .update({ current_balance: newBalance }).eq('id', accountId);
    if (!updateError) {
      await fetchAccounts();
      await fetchTransactions(accountId);
    }
    return { error: updateError };
  };

  return {
    accounts, activeAccount, activeAccountId, transactions, loading,
    switchAccount, createAccount, updateAccount, deleteAccount, addTransaction, fetchAccounts,
  };
}
