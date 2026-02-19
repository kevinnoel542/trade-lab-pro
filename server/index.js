const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const pool = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;
const SCREENSHOTS_DIR = path.resolve(process.env.SCREENSHOTS_DIR || './screenshots');
const USER_ID = 'local'; // single-user offline mode

// Ensure screenshots directory exists
fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

app.use(cors());
app.use(express.json());
// Serve screenshots as static files
app.use('/screenshots', express.static(SCREENSHOTS_DIR));

// ── Multer config for screenshot uploads ────────────────────
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, _file, cb) => {
      const date = req.body.date || new Date().toISOString().split('T')[0];
      const [year, month, day] = date.split('-');
      const time = new Date().toTimeString().slice(0, 8).replace(/:/g, '');
      const dir = path.join(SCREENSHOTS_DIR, year, month, day, time);
      fs.mkdirSync(dir, { recursive: true });
      req._screenshotDir = dir;
      req._screenshotRelPath = `${year}/${month}/${day}/${time}`;
      cb(null, dir);
    },
    filename: (_req, file, cb) => {
      const type = file.fieldname; // 'before' or 'after'
      const ext = path.extname(file.originalname) || '.png';
      cb(null, `${type}${ext}`);
    },
  }),
  limits: { fileSize: 20 * 1024 * 1024 },
});

// ══════════════════════════════════════════════════════════════
// HEALTH
// ══════════════════════════════════════════════════════════════
app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

// ══════════════════════════════════════════════════════════════
// TRADING ACCOUNTS
// ══════════════════════════════════════════════════════════════
app.get('/api/accounts', async (_req, res) => {
  const [rows] = await pool.query(
    'SELECT * FROM trading_accounts WHERE user_id = ? ORDER BY created_at', [USER_ID]
  );
  res.json(rows);
});

app.post('/api/accounts', async (req, res) => {
  const { name, type, broker, initial_balance } = req.body;
  const id = uuidv4();
  await pool.query(
    'INSERT INTO trading_accounts (id, user_id, name, type, broker, initial_balance, current_balance) VALUES (?,?,?,?,?,?,?)',
    [id, USER_ID, name, type || 'Personal', broker || null, initial_balance || 0, initial_balance || 0]
  );
  const [[row]] = await pool.query('SELECT * FROM trading_accounts WHERE id = ?', [id]);
  res.json(row);
});

app.put('/api/accounts/:id', async (req, res) => {
  const { name, type, broker } = req.body;
  await pool.query(
    'UPDATE trading_accounts SET name=COALESCE(?,name), type=COALESCE(?,type), broker=? WHERE id=?',
    [name, type, broker ?? null, req.params.id]
  );
  const [[row]] = await pool.query('SELECT * FROM trading_accounts WHERE id = ?', [req.params.id]);
  res.json(row);
});

app.delete('/api/accounts/:id', async (req, res) => {
  await pool.query('DELETE FROM trading_accounts WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
});

// ══════════════════════════════════════════════════════════════
// ACCOUNT TRANSACTIONS
// ══════════════════════════════════════════════════════════════
app.get('/api/transactions', async (req, res) => {
  const { account_id } = req.query;
  let sql = 'SELECT * FROM account_transactions WHERE user_id = ?';
  const params = [USER_ID];
  if (account_id) { sql += ' AND account_id = ?'; params.push(account_id); }
  sql += ' ORDER BY created_at DESC';
  const [rows] = await pool.query(sql, params);
  res.json(rows);
});

app.post('/api/transactions', async (req, res) => {
  const { account_id, type, amount, note } = req.body;
  const id = uuidv4();
  await pool.query(
    'INSERT INTO account_transactions (id, account_id, user_id, type, amount, note) VALUES (?,?,?,?,?,?)',
    [id, account_id, USER_ID, type, amount, note || null]
  );
  const [[row]] = await pool.query('SELECT * FROM account_transactions WHERE id = ?', [id]);
  res.json(row);
});

// ══════════════════════════════════════════════════════════════
// TRADES
// ══════════════════════════════════════════════════════════════
app.get('/api/trades', async (req, res) => {
  const { account_id } = req.query;
  let sql = 'SELECT * FROM trades WHERE user_id = ?';
  const params = [USER_ID];
  if (account_id) { sql += ' AND account_id = ?'; params.push(account_id); }
  sql += ' ORDER BY date DESC';
  const [rows] = await pool.query(sql, params);
  // Convert MySQL booleans (0/1) → true/false/null for JSON columns are already handled by typeCast
  const mapped = rows.map(r => ({
    ...r,
    confluences: r.confluences || [],
    key_levels: r.key_levels || [],
    htf_bias_respected: r.htf_bias_respected === null ? null : !!r.htf_bias_respected,
    ltf_bos_confirmed: r.ltf_bos_confirmed === null ? null : !!r.ltf_bos_confirmed,
    mss_present: r.mss_present === null ? null : !!r.mss_present,
  }));
  res.json(mapped);
});

app.post('/api/trades', upload.fields([
  { name: 'before', maxCount: 1 },
  { name: 'after', maxCount: 1 },
]), async (req, res) => {
  const data = req.body;
  const id = uuidv4();

  // Build screenshot URLs (local paths served via /screenshots)
  let ssBefore = data.screenshot_before || null;
  let ssAfter = data.screenshot_after || null;
  if (req.files?.before?.[0]) {
    ssBefore = `/screenshots/${req._screenshotRelPath}/${req.files.before[0].filename}`;
  }
  if (req.files?.after?.[0]) {
    ssAfter = `/screenshots/${req._screenshotRelPath}/${req.files.after[0].filename}`;
  }

  const confluences = data.confluences ? (typeof data.confluences === 'string' ? JSON.parse(data.confluences) : data.confluences) : [];
  const keyLevels = data.key_levels ? (typeof data.key_levels === 'string' ? JSON.parse(data.key_levels) : data.key_levels) : [];

  await pool.query(
    `INSERT INTO trades (id, user_id, account_id, trade_id, date, session, pair, direction,
      lot_size, entry_price, stop_loss, take_profit, exit_price,
      risk_amount, risk_percent, account_size, strategy, htf_timeframe, entry_timeframe,
      market_condition, confluences, screenshot_before, screenshot_after, notes, status,
      dealing_range_high, dealing_range_low, equilibrium, trade_location, liquidity_sweep_type,
      key_levels, entry_type, entry_quality, htf_bias_respected, ltf_bos_confirmed, mss_present)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      id, USER_ID, data.account_id, data.trade_id, data.date, data.session, data.pair, data.direction,
      data.lot_size || 0, data.entry_price || 0, data.stop_loss || 0, data.take_profit || 0, data.exit_price || null,
      data.risk_amount || 0, data.risk_percent || 0, data.account_size || 0,
      data.strategy || null, data.htf_timeframe || null, data.entry_timeframe || null,
      data.market_condition || null, JSON.stringify(confluences), ssBefore, ssAfter, data.notes || null,
      data.status || 'Open',
      data.dealing_range_high || null, data.dealing_range_low || null, data.equilibrium || null,
      data.trade_location || null, data.liquidity_sweep_type || null,
      JSON.stringify(keyLevels), data.entry_type || null, data.entry_quality || null,
      data.htf_bias_respected === undefined ? null : data.htf_bias_respected,
      data.ltf_bos_confirmed === undefined ? null : data.ltf_bos_confirmed,
      data.mss_present === undefined ? null : data.mss_present,
    ]
  );
  const [[row]] = await pool.query('SELECT * FROM trades WHERE id = ?', [id]);
  res.json(row);
});

app.put('/api/trades/:id', async (req, res) => {
  const updates = req.body;
  const fields = [];
  const values = [];

  const directFields = [
    'trade_id', 'date', 'session', 'pair', 'direction', 'lot_size',
    'entry_price', 'stop_loss', 'take_profit', 'exit_price',
    'risk_amount', 'risk_percent', 'account_size', 'strategy',
    'htf_timeframe', 'entry_timeframe', 'market_condition',
    'screenshot_before', 'screenshot_after', 'notes', 'status',
    'dealing_range_high', 'dealing_range_low', 'equilibrium',
    'trade_location', 'liquidity_sweep_type', 'entry_type',
    'entry_quality', 'htf_bias_respected', 'ltf_bos_confirmed', 'mss_present',
  ];

  for (const f of directFields) {
    if (updates[f] !== undefined) {
      fields.push(`${f} = ?`);
      values.push(updates[f]);
    }
  }
  // JSON fields
  if (updates.confluences !== undefined) {
    fields.push('confluences = ?');
    values.push(JSON.stringify(updates.confluences));
  }
  if (updates.key_levels !== undefined) {
    fields.push('key_levels = ?');
    values.push(JSON.stringify(updates.key_levels));
  }

  if (fields.length === 0) return res.json({ ok: true });

  values.push(req.params.id);
  await pool.query(`UPDATE trades SET ${fields.join(', ')} WHERE id = ?`, values);
  const [[row]] = await pool.query('SELECT * FROM trades WHERE id = ?', [req.params.id]);
  res.json(row);
});

app.delete('/api/trades/:id', async (req, res) => {
  await pool.query('DELETE FROM trades WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
});

// ══════════════════════════════════════════════════════════════
// CLOSED TRADES (for balance calculation)
// ══════════════════════════════════════════════════════════════
app.get('/api/trades/closed-summary', async (_req, res) => {
  const [rows] = await pool.query(
    `SELECT entry_price, exit_price, stop_loss, direction, risk_amount, account_id
     FROM trades WHERE user_id = ? AND status = 'Closed' AND exit_price IS NOT NULL`,
    [USER_ID]
  );
  res.json(rows);
});

// ══════════════════════════════════════════════════════════════
// SCREENSHOT UPLOAD (standalone endpoint)
// ══════════════════════════════════════════════════════════════
app.post('/api/upload-screenshot', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  const url = `/screenshots/${req._screenshotRelPath}/${req.file.filename}`;
  res.json({ url });
});

// ══════════════════════════════════════════════════════════════
// START SERVER
// ══════════════════════════════════════════════════════════════
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════╗
║   TradeVault Server running on port ${PORT}          ║
║   Screenshots: ${SCREENSHOTS_DIR}
║   API: http://localhost:${PORT}/api/health           ║
╚═══════════════════════════════════════════════════╝
  `);
});
