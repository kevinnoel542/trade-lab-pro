import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { calculateRMultiple, calculatePnlDollar, calculatePips, pipsToDollars } from './trade-types';

// ─── Design System ──────────────────────────────────────────────────────────
const C = {
  // Backgrounds
  bg:        [8,  12,  20]  as [number,number,number],   // near-black
  surface:   [14, 20,  35]  as [number,number,number],   // card bg
  surface2:  [20, 28,  48]  as [number,number,number],   // elevated card
  // Brand
  indigo:    [99, 102, 241] as [number,number,number],
  indigoD:   [67,  56, 202] as [number,number,number],
  purple:    [139, 92, 246] as [number,number,number],
  // Semantic
  profit:    [34, 197,  94] as [number,number,number],
  loss:      [239, 68,  68] as [number,number,number],
  warning:   [234,179,   8] as [number,number,number],
  // Text
  white:     [255,255, 255] as [number,number,number],
  text:      [226,232, 240] as [number,number,number],
  muted:     [100,116, 139] as [number,number,number],
  faint:     [30,  41,  59] as [number,number,number],
  // Borders
  border:    [30,  41,  70] as [number,number,number],
  borderL:   [51,  65,  85] as [number,number,number],
};

// ─── Helpers ────────────────────────────────────────────────────────────────
function rgb(doc: jsPDF, fill: [number,number,number]) { doc.setFillColor(...fill); }
function stroke(doc: jsPDF, col: [number,number,number]) { doc.setDrawColor(...col); }
function textColor(doc: jsPDF, col: [number,number,number]) { doc.setTextColor(...col); }
function bold(doc: jsPDF, size: number) { doc.setFont('helvetica','bold'); doc.setFontSize(size); }
function normal(doc: jsPDF, size: number) { doc.setFont('helvetica','normal'); doc.setFontSize(size); }
function rect(doc: jsPDF, x:number,y:number,w:number,h:number,r=0,mode:'F'|'FD'|'S'='F') {
  r > 0 ? doc.roundedRect(x,y,w,h,r,r,mode) : doc.rect(x,y,w,h,mode);
}

// Draw a gradient-simulated header bar (using layered rects)
function headerBar(doc: jsPDF, W: number) {
  // Deep bg
  rgb(doc, C.bg); rect(doc, 0, 0, W, 28);
  // Left indigo accent bar
  rgb(doc, C.indigo); rect(doc, 0, 0, 5, 28);
  // Subtle right glow
  rgb(doc, [20, 26, 48]); rect(doc, W-60, 0, 60, 28);
}

// Glassmorphism-style card
function card(doc: jsPDF, x:number,y:number,w:number,h:number,accent?: [number,number,number]) {
  // Shadow layer
  rgb(doc, [5,8,18]); rect(doc, x+1,y+1,w,h,3);
  // Main surface
  rgb(doc, C.surface); stroke(doc, C.border); rect(doc, x,y,w,h,3,'FD');
  // Top accent line
  if (accent) { rgb(doc, accent); rect(doc, x,y,w,1.2,0); }
}

// Pill badge
function pill(doc: jsPDF, x:number, y:number, text:string, bg:[number,number,number], fg:[number,number,number]) {
  const tw = doc.getTextWidth(text);
  const pw = tw + 6; const ph = 5;
  rgb(doc, bg); rect(doc, x - pw/2, y - ph + 1, pw, ph, 2);
  textColor(doc, fg); bold(doc, 6);
  doc.text(text, x, y, { align: 'center' });
}

// Horizontal divider
function divider(doc: jsPDF, x:number, y:number, w:number, col:[number,number,number]=[30,41,70]) {
  stroke(doc, col); doc.setLineWidth(0.1);
  doc.line(x, y, x+w, y);
}

// Watermark text
function watermark(doc: jsPDF, W:number, H:number) {
  doc.saveGraphicsState();
  textColor(doc, [20,28,50]);
  bold(doc, 48);
  doc.text('TRADEVAULT', W/2, H/2 + 10, { align: 'center', angle: 45 });
  doc.restoreGraphicsState();
}

interface ReportTrade {
  trade_id: string;
  date: string;
  pair: string;
  direction: string;
  session: string;
  lot_size: number;
  entry_price: number;
  stop_loss: number;
  take_profit: number;
  exit_price: number | null;
  risk_amount: number;
  risk_percent: number;
  account_size: number;
  strategy: string | null;
  status: string;
  confluences?: string[];
  entry_type?: string | null;
  entry_quality?: number | null;
  market_condition?: string | null;
  htf_timeframe?: string | null;
  entry_timeframe?: string | null;
  trade_location?: string | null;
  liquidity_sweep_type?: string | null;
  notes?: string | null;
}

interface ReportStats {
  totalTrades: number;
  closedTrades: number;
  openTrades: number;
  winRate: number;
  totalPnl: number;
  avgRMultiple: number;
  profitFactor: number;
  expectancy: number;
  maxDrawdown: number;
  consecutiveWins: number;
  consecutiveLosses: number;
}

const DARK = '#0d1117';
const INDIGO = '#6366f1';
const GREEN = '#22c55e';
const RED = '#ef4444';
const GRAY = '#64748b';
const WHITE = '#ffffff';
const CARD = '#161b22';
const BORDER = '#30363d';
const LIGHT_BG = '#f8fafc';
const TEXT = '#1e293b';
const MUTED = '#64748b';

function addPageHeader(doc: jsPDF, title: string, accountName: string, pageNum: number, totalPages: number) {
  const W = doc.internal.pageSize.getWidth();
  // Dark header bar
  doc.setFillColor(13, 17, 23);
  doc.rect(0, 0, W, 22, 'F');
  // Indigo accent line
  doc.setFillColor(99, 102, 241);
  doc.rect(0, 0, 4, 22, 'F');
  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('TradeVault', 10, 10);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('CRT Performance Lab', 10, 16);
  // Section title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(title, W / 2, 12, { align: 'center' });
  // Right: account + page
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(accountName, W - 10, 9, { align: 'right' });
  doc.text(`Page ${pageNum} of ${totalPages}`, W - 10, 16, { align: 'right' });
}

function statBox(doc: jsPDF, x: number, y: number, w: number, h: number, label: string, value: string, valueColor: [number, number, number]) {
  doc.setFillColor(22, 27, 34);
  doc.setDrawColor(48, 54, 61);
  doc.roundedRect(x, y, w, h, 2, 2, 'FD');
  doc.setFontSize(6);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text(label.toUpperCase(), x + w / 2, y + 5.5, { align: 'center' });
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...valueColor);
  doc.text(value, x + w / 2, y + 13, { align: 'center' });
}

// ─── Page Footer ────────────────────────────────────────────────────────────
function pageFooter(doc: jsPDF, W: number, H: number, page: number, total: number, accountName: string) {
  rgb(doc, C.bg); rect(doc, 0, H - 10, W, 10);
  divider(doc, 0, H - 10, W, C.border);
  // Left: branding
  textColor(doc, C.indigo); bold(doc, 7);
  doc.text('TRADEVAULT', 8, H - 4);
  textColor(doc, C.muted); normal(doc, 6);
  doc.text('CRT Performance Lab · Confidential', 30, H - 4);
  // Center: account
  textColor(doc, C.muted); normal(doc, 6);
  doc.text(accountName, W / 2, H - 4, { align: 'center' });
  // Right: page
  textColor(doc, C.muted); normal(doc, 6);
  doc.text(`Page ${page} / ${total}`, W - 8, H - 4, { align: 'right' });
}

// ─── Page Header ─────────────────────────────────────────────────────────────
function pageHeader(doc: jsPDF, W: number, section: string, date: string) {
  headerBar(doc, W);
  // Logo mark — small indigo square
  rgb(doc, C.indigo); rect(doc, 8, 5, 6, 6, 1);
  textColor(doc, C.white); bold(doc, 7);
  doc.text('TV', 11, 9.5, { align: 'center' });
  // Brand
  textColor(doc, C.white); bold(doc, 9);
  doc.text('TradeVault', 18, 9);
  textColor(doc, C.muted); normal(doc, 6);
  doc.text('CRT Performance Lab', 18, 15);
  // Section title — center
  textColor(doc, C.text); bold(doc, 9);
  doc.text(section.toUpperCase(), W / 2, 12, { align: 'center' });
  // Right: date
  textColor(doc, C.muted); normal(doc, 6);
  doc.text(date, W - 8, 12, { align: 'right' });
}

// ─── KPI Card ────────────────────────────────────────────────────────────────
function kpiCard(doc: jsPDF, x: number, y: number, w: number, h: number,
  label: string, value: string, sub: string,
  valueColor: [number,number,number], accent: [number,number,number]) {
  card(doc, x, y, w, h, accent);
  // Label
  textColor(doc, C.muted); bold(doc, 5.5);
  doc.text(label.toUpperCase(), x + w / 2, y + 6, { align: 'center' });
  // Value
  textColor(doc, valueColor); bold(doc, 13);
  doc.text(value, x + w / 2, y + 14, { align: 'center' });
  // Sub
  if (sub) { textColor(doc, C.muted); normal(doc, 5); doc.text(sub, x + w / 2, y + 19, { align: 'center' }); }
}

export async function generateTradeReport(
  trades: ReportTrade[],
  stats: ReportStats,
  accountName: string,
  accountBalance: number,
  initialBalance: number,
) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const closed = trades.filter(t => t.status === 'Closed' && t.exit_price);
  const now = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const pnlDiff = accountBalance - initialBalance;
  const pnlPct = initialBalance > 0 ? ((pnlDiff / initialBalance) * 100).toFixed(2) : '0.00';
  const isPnlPos = pnlDiff >= 0;
  const TOTAL_PAGES = 3;
  const M = 10; // margin

  // ════════════════════════════════════════════════════════════
  // PAGE 1 — COVER
  // ════════════════════════════════════════════════════════════

  // Full dark background
  rgb(doc, C.bg); rect(doc, 0, 0, W, H);

  // Top decorative indigo band
  rgb(doc, C.indigo); rect(doc, 0, 0, W, 2);

  // Left sidebar accent
  for (let i = 0; i < 6; i++) {
    const alpha = 0.15 - i * 0.02;
    rgb(doc, [Math.round(99 * alpha + 8 * (1-alpha)), Math.round(102 * alpha + 12 * (1-alpha)), Math.round(241 * alpha + 20 * (1-alpha))]);
    rect(doc, 0, 0, (6 - i) * 3, H);
  }
  rgb(doc, C.indigo); rect(doc, 0, 0, 4, H);

  // Watermark
  watermark(doc, W, H);

  // Top-right logo block
  card(doc, W - 55, 12, 46, 16, C.indigo);
  textColor(doc, C.white); bold(doc, 8);
  doc.text('TRADEVAULT', W - 32, 19, { align: 'center' });
  textColor(doc, C.muted); normal(doc, 5.5);
  doc.text('CRT Performance Lab', W - 32, 24, { align: 'center' });

  // Main title block
  const titleX = 20;
  textColor(doc, C.muted); normal(doc, 8);
  doc.text('TRADING PERFORMANCE', titleX, 52);
  textColor(doc, C.white); bold(doc, 32);
  doc.text('Analysis Report', titleX, 68);
  // Indigo underline
  rgb(doc, C.indigo); rect(doc, titleX, 71, 80, 1.5, 0);
  rgb(doc, C.purple); rect(doc, titleX + 80, 71, 30, 1.5, 0);

  // Subtitle
  textColor(doc, C.muted); normal(doc, 8);
  doc.text(`Generated on ${now}`, titleX, 80);

  // Account info strip
  card(doc, titleX, 86, W - titleX - 12, 18, C.indigo);
  const acctItems = [
    ['ACCOUNT', accountName],
    ['INITIAL BALANCE', `$${initialBalance.toLocaleString()}`],
    ['CURRENT BALANCE', `$${accountBalance.toLocaleString()}`],
    ['NET P&L', `${isPnlPos ? '+' : ''}$${Math.abs(pnlDiff).toLocaleString()}`],
    ['RETURN', `${isPnlPos ? '+' : ''}${pnlPct}%`],
    ['TOTAL TRADES', `${stats.totalTrades}`],
  ];
  const acctW = (W - titleX - 12) / acctItems.length;
  acctItems.forEach(([label, value], i) => {
    const ax = titleX + i * acctW + acctW / 2;
    textColor(doc, C.muted); bold(doc, 5.5);
    doc.text(label, ax, 92, { align: 'center' });
    const isPos = value.startsWith('+');
    const isNeg = value.startsWith('-') && !value.startsWith('-$0');
    textColor(doc, i >= 3 ? (isPos ? C.profit : isNeg ? C.loss : C.white) : C.white);
    bold(doc, 9);
    doc.text(value, ax, 99, { align: 'center' });
    if (i < acctItems.length - 1) {
      stroke(doc, C.border); doc.setLineWidth(0.2);
      doc.line(titleX + (i + 1) * acctW, 88, titleX + (i + 1) * acctW, 102);
    }
  });

  // KPI Grid — 3 rows × 4 cols
  const kpiW = 55; const kpiH = 22; const kpiGap = 4;
  const kpiStartX = titleX;
  const kpiStartY = 112;
  const kpiDefs: [string, string, string, [number,number,number], [number,number,number]][] = [
    ['Win Rate', `${stats.winRate}%`, `${closed.length} closed trades`, stats.winRate >= 50 ? C.profit : C.loss, stats.winRate >= 50 ? C.profit : C.loss],
    ['Profit Factor', `${stats.profitFactor}`, stats.profitFactor >= 1 ? 'Profitable system' : 'Unprofitable', stats.profitFactor >= 1 ? C.profit : C.loss, C.indigo],
    ['Avg R / Trade', `${stats.avgRMultiple}R`, 'Mean R-multiple', stats.avgRMultiple >= 0 ? C.profit : C.loss, C.purple],
    ['Expectancy', `$${stats.expectancy}`, 'Expected $ per trade', stats.expectancy >= 0 ? C.profit : C.loss, C.indigo],
    ['Max Drawdown', `$${stats.maxDrawdown}`, 'Peak-to-trough', C.loss, C.loss],
    ['Best Streak', `${stats.consecutiveWins}W`, 'Consecutive wins', C.profit, C.profit],
    ['Worst Streak', `${stats.consecutiveLosses}L`, 'Consecutive losses', C.loss, C.loss],
    ['Open Trades', `${stats.openTrades}`, 'Currently active', C.warning, C.warning],
  ];
  kpiDefs.forEach(([label, value, sub, valColor, accent], i) => {
    const col = i % 4; const row = Math.floor(i / 4);
    kpiCard(doc, kpiStartX + col * (kpiW + kpiGap), kpiStartY + row * (kpiH + kpiGap), kpiW, kpiH, label, value, sub, valColor, accent);
  });

  // Bottom decorative line
  rgb(doc, C.indigo); rect(doc, 0, H - 2, W, 2);

  // Page footer
  pageFooter(doc, W, H, 1, TOTAL_PAGES, accountName);

  // ════════════════════════════════════════════════════════════
  // PAGE 2 — TRADE HISTORY
  // ════════════════════════════════════════════════════════════
  doc.addPage();
  rgb(doc, C.bg); rect(doc, 0, 0, W, H);
  pageHeader(doc, W, 'Trade History', now);
  pageFooter(doc, W, H, 2, TOTAL_PAGES, accountName);

  // ── Summary strip under header ──
  const stripY = 30;
  card(doc, M, stripY, W - M * 2, 12, C.indigo);
  const stripItems = [
    ['CLOSED TRADES', `${closed.length}`],
    ['WIN RATE', `${stats.winRate}%`],
    ['NET P&L', `${isPnlPos ? '+' : ''}$${Math.abs(pnlDiff).toLocaleString()}`],
    ['AVG R', `${stats.avgRMultiple}R`],
    ['PROFIT FACTOR', `${stats.profitFactor}`],
    ['MAX DRAWDOWN', `$${stats.maxDrawdown}`],
  ];
  stripItems.forEach(([label, value], i) => {
    const sw = (W - M * 2) / stripItems.length;
    const sx = M + i * sw + sw / 2;
    textColor(doc, C.muted); bold(doc, 5);
    doc.text(label, sx, stripY + 4.5, { align: 'center' });
    const isPos = value.startsWith('+');
    const isNeg = value.startsWith('-');
    textColor(doc, i === 2 ? (isPnlPos ? C.profit : C.loss) : i === 0 || i === 4 ? C.white : i === 5 ? C.loss : C.white);
    bold(doc, 8);
    doc.text(value, sx, stripY + 10, { align: 'center' });
    if (i < stripItems.length - 1) {
      stroke(doc, C.border); doc.setLineWidth(0.15);
      doc.line(M + (i + 1) * sw, stripY + 2, M + (i + 1) * sw, stripY + 11);
    }
  });

  // ── Trade History Table ──
  const tableRows = closed.map(t => {
    const pips = calculatePips(t.pair, t.entry_price, t.exit_price!, t.direction as 'Buy' | 'Sell');
    const rMult = calculateRMultiple(t.entry_price, t.exit_price!, t.stop_loss, t.direction as 'Buy' | 'Sell');
    const pnl = pipsToDollars(t.pair, Math.abs(pips), t.lot_size) * (pips >= 0 ? 1 : -1);
    return [
      t.date, t.pair, t.direction, t.session || '—',
      t.entry_price.toString(), t.stop_loss.toString(), t.exit_price?.toString() || '—',
      `${pips > 0 ? '+' : ''}${pips}`,
      `${rMult > 0 ? '+' : ''}${rMult}R`,
      `${pnl >= 0 ? '+' : ''}$${Math.round(pnl)}`,
      t.strategy || '—',
      t.entry_type || '—',
      t.trade_location || '—',
    ];
  });

  autoTable(doc, {
    startY: stripY + 16,
    head: [['Date','Pair','Dir','Session','Entry','SL','Exit','Pips','R-Mult','P&L ($)','Strategy','Entry Type','Location']],
    body: tableRows,
    theme: 'plain',
    styles: {
      fontSize: 6.5, cellPadding: { top: 2.5, bottom: 2.5, left: 3, right: 3 },
      font: 'helvetica', textColor: [...C.text] as [number,number,number],
      lineColor: [...C.border] as [number,number,number], lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [...C.surface2] as [number,number,number],
      textColor: [...C.muted] as [number,number,number],
      fontStyle: 'bold', fontSize: 6, halign: 'center',
      lineColor: [...C.border] as [number,number,number], lineWidth: 0.1,
    },
    alternateRowStyles: { fillColor: [...C.surface] as [number,number,number] },
    bodyStyles: { fillColor: [10, 15, 28] as [number,number,number] },
    columnStyles: {
      0: { halign: 'center', cellWidth: 19, textColor: [...C.muted] as [number,number,number] },
      1: { halign: 'center', fontStyle: 'bold', cellWidth: 14, textColor: [...C.white] as [number,number,number] },
      2: { halign: 'center', cellWidth: 11 },
      3: { halign: 'center', cellWidth: 15, textColor: [...C.muted] as [number,number,number] },
      4: { halign: 'right', cellWidth: 17, textColor: [...C.muted] as [number,number,number] },
      5: { halign: 'right', cellWidth: 17, textColor: [...C.muted] as [number,number,number] },
      6: { halign: 'right', cellWidth: 17 },
      7: { halign: 'right', cellWidth: 14 },
      8: { halign: 'right', cellWidth: 14 },
      9: { halign: 'right', fontStyle: 'bold', cellWidth: 18 },
      10: { halign: 'center', cellWidth: 22, textColor: [...C.muted] as [number,number,number] },
      11: { halign: 'center', cellWidth: 20, textColor: [...C.muted] as [number,number,number] },
      12: { halign: 'center', cellWidth: 16, textColor: [...C.muted] as [number,number,number] },
    },
    didParseCell: (data: any) => {
      if (data.section === 'body') {
        const val = String(data.cell.raw);
        if ([7,8,9].includes(data.column.index)) {
          if (val.startsWith('+')) data.cell.styles.textColor = [...C.profit];
          else if (val.startsWith('-')) data.cell.styles.textColor = [...C.loss];
        }
        if (data.column.index === 2) {
          data.cell.styles.textColor = data.cell.raw === 'Buy' ? [...C.profit] : [...C.loss];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
    didDrawPage: (data: any) => {
      // Re-draw bg on new pages
      rgb(doc, C.bg); rect(doc, 0, 0, W, H);
      pageHeader(doc, W, 'Trade History', now);
      pageFooter(doc, W, H, 2, TOTAL_PAGES, accountName);
    },
    margin: { top: 30, left: M, right: M, bottom: 14 },
  });

  // ════════════════════════════════════════════════════════════
  // PAGE 3 — CRT ANALYSIS BREAKDOWN
  // ════════════════════════════════════════════════════════════
  doc.addPage();
  rgb(doc, C.bg); rect(doc, 0, 0, W, H);
  pageHeader(doc, W, 'CRT Analysis Breakdown', now);
  pageFooter(doc, W, H, 3, TOTAL_PAGES, accountName);

  // Build groups
  type GrpData = { wins: number; total: number; pnl: number; avgR: number; rSum: number };
  const groups: Record<string, Record<string, GrpData>> = {
    session: {}, pair: {}, strategy: {}, entryType: {}, location: {}, condition: {},
  };
  closed.forEach(t => {
    const rMult = calculateRMultiple(t.entry_price, t.exit_price!, t.stop_loss, t.direction as 'Buy' | 'Sell');
    const pnl = calculatePnlDollar(t.risk_amount, rMult);
    const isWin = pnl > 0;
    const addTo = (grp: Record<string, GrpData>, key: string | null | undefined) => {
      if (!key) return;
      if (!grp[key]) grp[key] = { wins: 0, total: 0, pnl: 0, avgR: 0, rSum: 0 };
      grp[key].total++;
      grp[key].pnl += pnl;
      grp[key].rSum += rMult;
      grp[key].avgR = grp[key].rSum / grp[key].total;
      if (isWin) grp[key].wins++;
    };
    addTo(groups.session, t.session);
    addTo(groups.pair, t.pair);
    addTo(groups.strategy, t.strategy);
    addTo(groups.entryType, t.entry_type);
    addTo(groups.location, t.trade_location);
    addTo(groups.condition, t.market_condition);
  });

  const makeRows = (grp: Record<string, GrpData>) =>
    Object.entries(grp).sort((a, b) => b[1].pnl - a[1].pnl).map(([name, d]) => {
      const wr = Math.round((d.wins / d.total) * 100);
      const avgR = Math.round(d.avgR * 100) / 100;
      const pnl = Math.round(d.pnl);
      return [name, d.total, d.wins, d.total - d.wins, `${wr}%`, `${avgR >= 0 ? '+' : ''}${avgR}R`, `${pnl >= 0 ? '+' : ''}$${pnl}`];
    });

  const tHead = [['Name', 'Trades', 'Wins', 'Losses', 'Win %', 'Avg R', 'Net P&L']];
  const tStyle = {
    theme: 'plain' as const,
    styles: { fontSize: 6.5, cellPadding: { top: 2, bottom: 2, left: 3, right: 3 }, font: 'helvetica', textColor: [...C.text] as [number,number,number], lineColor: [...C.border] as [number,number,number], lineWidth: 0.1 },
    headStyles: { fillColor: [...C.surface2] as [number,number,number], textColor: [...C.muted] as [number,number,number], fontStyle: 'bold' as const, fontSize: 6 },
    alternateRowStyles: { fillColor: [...C.surface] as [number,number,number] },
    bodyStyles: { fillColor: [10, 15, 28] as [number,number,number] },
    columnStyles: {
      0: { fontStyle: 'bold' as const, textColor: [...C.white] as [number,number,number] },
      1: { halign: 'center' as const, textColor: [...C.muted] as [number,number,number] },
      2: { halign: 'center' as const, textColor: [...C.profit] as [number,number,number], fontStyle: 'bold' as const },
      3: { halign: 'center' as const, textColor: [...C.loss] as [number,number,number], fontStyle: 'bold' as const },
      4: { halign: 'center' as const, fontStyle: 'bold' as const },
      5: { halign: 'right' as const },
      6: { halign: 'right' as const, fontStyle: 'bold' as const },
    },
    didParseCell: (data: any) => {
      if (data.section === 'body') {
        if (data.column.index === 4) {
          const wr = parseInt(data.cell.raw);
          data.cell.styles.textColor = wr >= 60 ? [...C.profit] : wr >= 50 ? [...C.warning] : [...C.loss];
        }
        if (data.column.index === 5 || data.column.index === 6) {
          const val = String(data.cell.raw);
          data.cell.styles.textColor = val.startsWith('+') ? [...C.profit] : [...C.loss];
        }
      }
    },
  };

  // Section label helper
  const sectionLabel = (doc: jsPDF, x: number, y: number, w: number, text: string) => {
    rgb(doc, C.surface2); stroke(doc, C.indigo); rect(doc, x, y, w, 7, 1.5, 'FD');
    rgb(doc, C.indigo); rect(doc, x, y, 2.5, 7, 0);
    textColor(doc, C.indigo); bold(doc, 6.5);
    doc.text(text, x + 7, y + 4.8);
  };

  const gap3 = 4;
  const col3W = (W - M * 2 - gap3) / 2;
  const startY3 = 32;

  // Left column
  let ly = startY3;
  const leftGroups: [string, Record<string, GrpData>][] = [
    ['WIN RATE BY SESSION', groups.session],
    ['WIN RATE BY PAIR', groups.pair],
    ['WIN RATE BY CONDITION', groups.condition],
  ];
  leftGroups.forEach(([label, grp]) => {
    const rows = makeRows(grp);
    if (rows.length === 0) return;
    sectionLabel(doc, M, ly, col3W, label);
    ly += 9;
    autoTable(doc, { ...tStyle, startY: ly, head: tHead, body: rows, tableWidth: col3W, margin: { left: M, right: W - M - col3W }, didParseCell: tStyle.didParseCell });
    ly = (doc as any).lastAutoTable.finalY + 6;
  });

  // Right column
  let ry = startY3;
  const rightGroups: [string, Record<string, GrpData>][] = [
    ['WIN RATE BY STRATEGY', groups.strategy],
    ['WIN RATE BY ENTRY MODEL', groups.entryType],
    ['WIN RATE BY LOCATION', groups.location],
  ];
  rightGroups.forEach(([label, grp]) => {
    const rows = makeRows(grp);
    if (rows.length === 0) return;
    sectionLabel(doc, M + col3W + gap3, ry, col3W, label);
    ry += 9;
    autoTable(doc, { ...tStyle, startY: ry, head: tHead, body: rows, tableWidth: col3W, margin: { left: M + col3W + gap3, right: M }, didParseCell: tStyle.didParseCell });
    ry = (doc as any).lastAutoTable.finalY + 6;
  });

  // ── Save ──
  const filename = `TradeVault_Report_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}

