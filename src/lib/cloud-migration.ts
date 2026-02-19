/**
 * Cloud-to-Local Migration Script
 * 
 * Exports all your data from Lovable Cloud (Supabase) and generates
 * SQL INSERT statements you can run against your local MySQL database.
 * 
 * Usage: Run this in your browser console while logged into the cloud app,
 *        OR use the migration page at /migrate in the offline app.
 * 
 * This file generates a downloadable .sql file with all your data.
 */

import { supabase } from '@/integrations/supabase/client';

export async function exportCloudDataToSql(): Promise<string> {
  const lines: string[] = [
    '-- ============================================================',
    '-- TradeVault Cloud → Local MySQL Migration',
    `-- Generated: ${new Date().toISOString()}`,
    '-- ============================================================',
    '',
    'USE tradevault;',
    '',
  ];

  // 1. Export accounts
  const { data: accounts } = await supabase.from('trading_accounts').select('*');
  if (accounts?.length) {
    lines.push('-- ─── Trading Accounts ───');
    for (const a of accounts) {
      lines.push(
        `INSERT INTO trading_accounts (id, user_id, name, type, broker, initial_balance, current_balance, currency, is_active) VALUES (` +
        `'${a.id}', 'local', ${esc(a.name)}, ${esc(a.type)}, ${esc(a.broker)}, ${a.initial_balance}, ${a.current_balance}, ${esc(a.currency)}, ${a.is_active ? 1 : 0});`
      );
    }
    lines.push('');
  }

  // 2. Export transactions
  const { data: transactions } = await supabase.from('account_transactions').select('*');
  if (transactions?.length) {
    lines.push('-- ─── Account Transactions ───');
    for (const t of transactions) {
      lines.push(
        `INSERT INTO account_transactions (id, account_id, user_id, type, amount, note) VALUES (` +
        `'${t.id}', '${t.account_id}', 'local', ${esc(t.type)}, ${t.amount}, ${esc(t.note)});`
      );
    }
    lines.push('');
  }

  // 3. Export trades
  const { data: trades } = await supabase.from('trades').select('*');
  if (trades?.length) {
    lines.push('-- ─── Trades ───');
    for (const t of trades) {
      lines.push(
        `INSERT INTO trades (id, user_id, account_id, trade_id, date, session, pair, direction, ` +
        `lot_size, entry_price, stop_loss, take_profit, exit_price, ` +
        `risk_amount, risk_percent, account_size, strategy, htf_timeframe, entry_timeframe, ` +
        `market_condition, confluences, screenshot_before, screenshot_after, notes, status, ` +
        `dealing_range_high, dealing_range_low, equilibrium, trade_location, liquidity_sweep_type, ` +
        `key_levels, entry_type, entry_quality, htf_bias_respected, ltf_bos_confirmed, mss_present) VALUES (` +
        `'${t.id}', 'local', '${t.account_id}', ${esc(t.trade_id)}, '${t.date}', ${esc(t.session)}, ${esc(t.pair)}, ${esc(t.direction)}, ` +
        `${t.lot_size}, ${t.entry_price}, ${t.stop_loss}, ${t.take_profit}, ${t.exit_price ?? 'NULL'}, ` +
        `${t.risk_amount}, ${t.risk_percent}, ${t.account_size}, ${esc(t.strategy)}, ${esc(t.htf_timeframe)}, ${esc(t.entry_timeframe)}, ` +
        `${esc(t.market_condition)}, ${escJson(t.confluences)}, ${esc(t.screenshot_before)}, ${esc(t.screenshot_after)}, ${esc(t.notes)}, ${esc(t.status)}, ` +
        `${t.dealing_range_high ?? 'NULL'}, ${t.dealing_range_low ?? 'NULL'}, ${t.equilibrium ?? 'NULL'}, ${esc(t.trade_location)}, ${esc(t.liquidity_sweep_type)}, ` +
        `${escJson(t.key_levels)}, ${esc(t.entry_type)}, ${t.entry_quality ?? 'NULL'}, ${boolToSql(t.htf_bias_respected)}, ${boolToSql(t.ltf_bos_confirmed)}, ${boolToSql(t.mss_present)});`
      );
    }
  }

  lines.push('');
  lines.push(`-- Migration complete: ${accounts?.length || 0} accounts, ${transactions?.length || 0} transactions, ${trades?.length || 0} trades`);

  return lines.join('\n');
}

function esc(val: any): string {
  if (val === null || val === undefined) return 'NULL';
  return `'${String(val).replace(/'/g, "''")}'`;
}

function escJson(val: any): string {
  if (!val) return 'NULL';
  return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
}

function boolToSql(val: boolean | null): string {
  if (val === null || val === undefined) return 'NULL';
  return val ? '1' : '0';
}

export function downloadSqlFile(content: string) {
  const blob = new Blob([content], { type: 'text/sql;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `tradevault-migration-${new Date().toISOString().slice(0, 10)}.sql`;
  a.click();
  URL.revokeObjectURL(url);
}
