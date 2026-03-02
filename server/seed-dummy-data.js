/**
 * Seed dummy data — creates 2 accounts with a mix of winning AND losing trades.
 * Run: node server/seed-dummy-data.js
 */
const pool = require('./db');
const { v4: uuidv4 } = require('uuid');

const USER_ID = 'local';

// ── Dummy Accounts ──
const accounts = [
  { id: uuidv4(), name: 'FTMO Challenge', type: 'Funded', broker: 'FTMO', initial_balance: 100000 },
  { id: uuidv4(), name: 'Personal Live', type: 'Personal', broker: 'IC Markets', initial_balance: 5000 },
];

// ── Trade templates: mix of WINS and LOSSES ──
function makeTrades(accountId, accountBalance) {
  const now = new Date();
  const trades = [];

  const templates = [
    // WINS
    { date: '2026-01-06', pair: 'EURUSD', dir: 'Buy',  entry: 1.08500, sl: 1.08300, tp: 1.09100, exit: 1.09000, session: 'London',   strategy: 'CRT',               lot: 0.50, status: 'Closed' },
    { date: '2026-01-08', pair: 'GBPUSD', dir: 'Sell', entry: 1.27200, sl: 1.27500, tp: 1.26500, exit: 1.26600, session: 'New York', strategy: 'Liquidity Sweep',    lot: 0.30, status: 'Closed' },
    { date: '2026-01-13', pair: 'XAUUSD', dir: 'Buy',  entry: 2020.00, sl: 2015.00, tp: 2035.00, exit: 2032.00, session: 'London',   strategy: 'Order Block Entry',   lot: 0.10, status: 'Closed' },
    { date: '2026-01-20', pair: 'USDJPY', dir: 'Sell', entry: 148.500, sl: 149.000, tp: 147.000, exit: 147.200, session: 'Asia',     strategy: 'CRT',                 lot: 0.20, status: 'Closed' },
    { date: '2026-02-03', pair: 'EURUSD', dir: 'Buy',  entry: 1.09000, sl: 1.08800, tp: 1.09600, exit: 1.09500, session: 'London',   strategy: 'Trend Continuation',  lot: 0.40, status: 'Closed' },
    { date: '2026-02-10', pair: 'NAS100', dir: 'Buy',  entry: 17500,   sl: 17450,   tp: 17650,   exit: 17620,   session: 'New York', strategy: 'Breakout',            lot: 0.05, status: 'Closed' },

    // LOSSES — needed for "worst" performance summary data
    { date: '2026-01-10', pair: 'EURUSD', dir: 'Sell', entry: 1.08700, sl: 1.08900, tp: 1.08200, exit: 1.08900, session: 'London',   strategy: 'CRT',                 lot: 0.50, status: 'Closed' },
    { date: '2026-01-15', pair: 'GBPUSD', dir: 'Buy',  entry: 1.26800, sl: 1.26500, tp: 1.27400, exit: 1.26500, session: 'New York', strategy: 'Reversal',            lot: 0.30, status: 'Closed' },
    { date: '2026-01-22', pair: 'XAUUSD', dir: 'Sell', entry: 2025.00, sl: 2030.00, tp: 2010.00, exit: 2030.00, session: 'London',   strategy: 'Liquidity Sweep',     lot: 0.10, status: 'Closed' },
    { date: '2026-01-27', pair: 'USDJPY', dir: 'Buy',  entry: 147.800, sl: 147.300, tp: 148.800, exit: 147.400, session: 'Asia',     strategy: 'Scalp',               lot: 0.20, status: 'Closed' },
    { date: '2026-02-05', pair: 'EURUSD', dir: 'Sell', entry: 1.09200, sl: 1.09400, tp: 1.08700, exit: 1.09350, session: 'New York', strategy: 'CRT',                 lot: 0.40, status: 'Closed' },

    // OPEN trade
    { date: '2026-02-18', pair: 'GBPUSD', dir: 'Buy',  entry: 1.26100, sl: 1.25800, tp: 1.26700, exit: null,    session: 'London',   strategy: 'CRT',                 lot: 0.25, status: 'Open' },
  ];

  for (const t of templates) {
    const slPips = Math.abs(t.entry - t.sl);
    const riskAmt = t.pair.includes('XAU') ? t.lot * 100 * slPips * 0.1
                  : t.pair.includes('JPY') ? t.lot * 10 * (slPips * 100)
                  : ['US30','NAS100','SPX500'].includes(t.pair) ? t.lot * slPips
                  : t.lot * 10 * (slPips * 10000);
    const riskPct = accountBalance > 0 ? Math.round((riskAmt / accountBalance) * 10000) / 100 : 0;

    trades.push({
      id: uuidv4(),
      user_id: USER_ID,
      account_id: accountId,
      trade_id: `T${t.date.replace(/-/g, '').slice(2)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      date: t.date,
      session: t.session,
      pair: t.pair,
      direction: t.dir,
      lot_size: t.lot,
      entry_price: t.entry,
      stop_loss: t.sl,
      take_profit: t.tp,
      exit_price: t.exit,
      risk_amount: Math.round(riskAmt * 100) / 100,
      risk_percent: riskPct,
      account_size: accountBalance,
      strategy: t.strategy,
      notes: t.exit && t.exit === t.sl ? 'Hit stop loss — review entry.' : t.exit ? 'Clean execution.' : 'Trade in progress.',
      status: t.status,
      confluences: JSON.stringify(['FVG', 'Order Block']),
      key_levels: JSON.stringify(['OB', 'FVG']),
      htf_timeframe: 'H4',
      entry_timeframe: 'M15',
      market_condition: 'Trending',
      entry_type: 'FVG Mitigation',
      entry_quality: t.exit && t.exit !== t.sl ? 4 : 2,
      htf_bias_respected: t.exit && t.exit !== t.sl ? 1 : 0,
      ltf_bos_confirmed: t.exit && t.exit !== t.sl ? 1 : 0,
      mss_present: 1,
    });
  }
  return trades;
}

async function seed() {
  console.log('🌱 Seeding dummy data...\n');

  // Clear existing data
  await pool.query('DELETE FROM trades WHERE user_id = ?', [USER_ID]);
  await pool.query('DELETE FROM account_transactions WHERE user_id = ?', [USER_ID]);
  await pool.query('DELETE FROM trading_accounts WHERE user_id = ?', [USER_ID]);

  // Insert accounts
  for (const acc of accounts) {
    await pool.query(
      'INSERT INTO trading_accounts (id, user_id, name, type, broker, initial_balance, current_balance) VALUES (?,?,?,?,?,?,?)',
      [acc.id, USER_ID, acc.name, acc.type, acc.broker, acc.initial_balance, acc.initial_balance]
    );
    console.log(`  ✅ Account: ${acc.name} ($${acc.initial_balance})`);
  }

  // Insert trades for each account
  for (const acc of accounts) {
    const trades = makeTrades(acc.id, acc.initial_balance);
    for (const t of trades) {
      await pool.query(
        `INSERT INTO trades (id, user_id, account_id, trade_id, date, session, pair, direction,
          lot_size, entry_price, stop_loss, take_profit, exit_price,
          risk_amount, risk_percent, account_size, strategy, notes, status,
          confluences, key_levels, htf_timeframe, entry_timeframe, market_condition,
          entry_type, entry_quality, htf_bias_respected, ltf_bos_confirmed, mss_present)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          t.id, t.user_id, t.account_id, t.trade_id, t.date, t.session, t.pair, t.direction,
          t.lot_size, t.entry_price, t.stop_loss, t.take_profit, t.exit_price,
          t.risk_amount, t.risk_percent, t.account_size, t.strategy, t.notes, t.status,
          t.confluences, t.key_levels, t.htf_timeframe, t.entry_timeframe, t.market_condition,
          t.entry_type, t.entry_quality, t.htf_bias_respected, t.ltf_bos_confirmed, t.mss_present,
        ]
      );
    }
    const wins = trades.filter(t => t.status === 'Closed' && t.exit_price && t.exit_price !== t.stop_loss).length;
    const losses = trades.filter(t => t.status === 'Closed' && t.exit_price === t.stop_loss).length;
    console.log(`  📊 ${acc.name}: ${trades.length} trades (${wins}W / ${losses}L / 1 Open)`);
  }

  console.log('\n✅ Seed complete! Start the server with: node server/index.js');
  process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });
