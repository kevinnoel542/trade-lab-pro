import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useAccounts } from '@/hooks/use-accounts';
import { useTrades, DbTrade } from '@/hooks/use-trades';
import { StatsGrid } from '@/components/StatsGrid';
import { TradeForm } from '@/components/TradeForm';
import { TradeTable } from '@/components/TradeTable';
import TradeView from '@/components/TradeView';
import { CsvExportImport } from '@/components/CsvExportImport';
import Analytics from '@/pages/Analytics';
import Accounts from '@/pages/Accounts';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, BarChart3, BookOpen, LineChart, Wallet, TrendingUp, TrendingDown, DollarSign, Activity, ChevronRight, Sun, Moon } from 'lucide-react';
import { toast } from 'sonner';
import { useTheme } from '@/hooks/use-theme';

const Index = () => {
  const { user } = useAuth();
  const { accounts, activeAccount, transactions, loading: accLoading, switchAccount, createAccount, updateAccount, deleteAccount, addTransaction, refreshBalances } = useAccounts(user?.id);
  const { trades, loading: tradesLoading, addTrade, updateTrade, deleteTrade, getStats } = useTrades(user?.id, activeAccount?.id);

  const [showForm, setShowForm] = useState(false);
  const [editTrade, setEditTrade] = useState<DbTrade | null>(null);
  const [viewTrade, setViewTrade] = useState<DbTrade | null>(null);
  const [activeTab, setActiveTab] = useState<'journal' | 'analytics' | 'accounts'>('journal');

  if (accLoading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Activity className="h-8 w-8 text-primary animate-pulse" />
        <span className="text-sm text-muted-foreground">Loading accounts...</span>
      </div>
    </div>
  );

  // If no accounts, show account creation
  if (accounts.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-6 text-center">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-500/30 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/10">
            <Wallet className="h-8 w-8 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Welcome to TradeVault</h1>
            <p className="text-muted-foreground mt-1 text-sm">Create your first trading account to get started.</p>
          </div>
          <Accounts
            accounts={accounts} activeAccount={activeAccount} transactions={transactions}
            onSwitch={switchAccount} onCreate={createAccount} onUpdate={updateAccount}
            onDelete={deleteAccount} onTransaction={addTransaction}
          />
        </div>
      </div>
    );
  }

  const stats = getStats();

  const handleSubmit = async (trade: Omit<DbTrade, 'id' | 'created_at' | 'updated_at'>) => {
    if (editTrade) {
      await updateTrade(editTrade.id, trade);
      setEditTrade(null);
      toast.success('Trade updated');
    } else {
      await addTrade(trade);
      setShowForm(false);
      toast.success('Trade logged successfully');
    }
    await refreshBalances();
  };

  const handleDelete = async (id: string) => {
    await deleteTrade(id);
    await refreshBalances();
    toast.success('Trade deleted');
  };

  const handleEdit = (trade: DbTrade) => {
    setEditTrade(trade);
  };

  // Convert DbTrade to analytics-compatible format
  const analyticsData = trades.map(t => ({
    ...t,
    entryPrice: t.entry_price,
    exitPrice: t.exit_price,
    stopLoss: t.stop_loss,
    riskAmount: t.risk_amount,
    direction: t.direction as 'Buy' | 'Sell',
    tradeLocation: t.trade_location as any,
    keyLevels: t.key_levels,
    liquiditySweepType: t.liquidity_sweep_type,
    entryType: t.entry_type,
    marketCondition: t.market_condition as any,
    strategy: t.strategy,
    session: t.session as any,
    status: t.status as 'Open' | 'Closed',
  }));

  const { theme, toggleTheme } = useTheme();
  const pnlDiff = activeAccount ? activeAccount.current_balance - activeAccount.initial_balance : 0;
  const pnlPct = activeAccount && activeAccount.initial_balance > 0
    ? ((pnlDiff / activeAccount.initial_balance) * 100).toFixed(2)
    : '0.00';
  const isPnlPositive = pnlDiff >= 0;

  const tabs = [
    { key: 'journal', icon: BookOpen, label: 'Journal' },
    { key: 'analytics', icon: LineChart, label: 'Analytics' },
    { key: 'accounts', icon: Wallet, label: 'Accounts' },
  ] as const;

  return (
    <div className="min-h-screen bg-background">
      {/* ── Header ── */}
      <header className="border-b border-border/60 bg-card/70 backdrop-blur-md sticky top-0 z-40">
        {/* Top row: logo + right actions */}
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 flex items-center justify-between gap-2">
          {/* Logo */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-indigo-500/40 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center shadow-md shadow-indigo-500/10">
              <BarChart3 className="h-4 w-4 text-indigo-400" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-sm font-bold tracking-tight leading-none">TradeVault</h1>
              <p className="text-[10px] text-muted-foreground mt-0.5">CRT Lab · Offline</p>
            </div>
          </div>

          {/* Right: account switcher + theme + new trade */}
          <div className="flex items-center gap-1.5 shrink-0">
            <Select value={activeAccount?.id || ''} onValueChange={switchAccount}>
              <SelectTrigger className="text-xs h-8 w-28 sm:w-40 border-border/60 bg-secondary/30">
                <SelectValue placeholder="Account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map(a => (
                  <SelectItem key={a.id} value={a.id}>
                    <span className="flex items-center gap-2">
                      <span>{a.name}</span>
                      <span className="text-muted-foreground font-mono text-xs hidden sm:inline">${a.current_balance.toLocaleString()}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* Theme toggle */}
            <Button variant="ghost" size="icon" onClick={toggleTheme}
              className="h-8 w-8 rounded-lg border border-border/60 bg-secondary/30 hover:bg-secondary/60"
              title={theme === 'dark' ? 'Light mode' : 'Dark mode'}>
              {theme === 'dark'
                ? <Sun className="h-4 w-4 text-yellow-400" />
                : <Moon className="h-4 w-4 text-indigo-400" />}
            </Button>
            {activeTab === 'journal' && (
              <Button onClick={() => setShowForm(true)} size="sm"
                className="gap-1 bg-indigo-600 hover:bg-indigo-500 text-white border-0 shadow-md shadow-indigo-500/20 px-2.5 sm:px-3">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">New Trade</span>
              </Button>
            )}
          </div>
        </div>

        {/* Bottom row: tab bar (full width on mobile) */}
        <div className="max-w-7xl mx-auto px-3 sm:px-4 pb-2">
          <div className="flex rounded-xl border border-border/60 overflow-hidden bg-secondary/30 p-0.5 gap-0.5 w-full">
            {tabs.map(({ key, icon: Icon, label }) => (
              <button key={key} onClick={() => setActiveTab(key)}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 flex items-center justify-center gap-1.5 ${
                  activeTab === key
                    ? 'bg-card text-foreground shadow-sm border border-border/60'
                    : 'text-muted-foreground hover:text-foreground'
                }`}>
                <Icon className="h-3.5 w-3.5" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-5">
        {activeTab === 'journal' ? (
          <>
            {/* ── Balance Hero Card ── */}
            {activeAccount && (
              <div className="rounded-xl bg-card border border-border/60 p-5 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 pointer-events-none" />
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

                  {/* Left: account info + balance */}
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-500/30 to-purple-500/20 border border-indigo-500/20 flex items-center justify-center shadow-lg shadow-indigo-500/10">
                      <DollarSign className="h-6 w-6 text-indigo-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">{activeAccount.name}</p>
                        <span className="text-[10px] bg-secondary px-2 py-0.5 rounded-full text-muted-foreground border border-border/60">{activeAccount.type}</span>
                      </div>
                      <p className="text-3xl font-mono font-bold tracking-tight mt-0.5">
                        ${activeAccount.current_balance.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Right: stats row */}
                  <div className="grid grid-cols-4 gap-3 sm:flex sm:items-center sm:gap-8 w-full sm:w-auto">
                    {[
                      { label: 'Initial', value: `$${activeAccount.initial_balance.toLocaleString()}`, color: '' },
                      { label: 'Net P&L', value: `${isPnlPositive ? '+' : ''}$${pnlDiff.toLocaleString()}`, color: isPnlPositive ? 'text-profit' : 'text-loss' },
                      { label: 'Return', value: `${isPnlPositive ? '+' : ''}${pnlPct}%`, color: isPnlPositive ? 'text-profit' : 'text-loss' },
                      { label: 'Trades', value: trades.length, color: '' },
                    ].map(s => (
                      <div key={s.label} className="text-center sm:text-right">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">{s.label}</p>
                        <p className={`font-mono text-xs sm:text-sm font-bold ${s.color}`}>{s.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── Stats Grid ── */}
            <StatsGrid stats={stats} />

            {/* ── Trade History ── */}
            <div className="rounded-xl bg-card border border-border/60 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border/60 bg-secondary/20">
                <div className="flex items-center gap-2.5">
                  <div className="h-4 w-1 rounded-full bg-indigo-500" />
                  <h2 className="text-xs font-bold text-foreground uppercase tracking-widest">Trade History</h2>
                  <span className="text-[10px] font-semibold text-muted-foreground bg-secondary border border-border/60 px-2 py-0.5 rounded-full font-mono">
                    {trades.length} trades
                  </span>
                </div>
                <CsvExportImport
                  trades={trades}
                  userId={user.id}
                  accountId={activeAccount!.id}
                  accountBalance={activeAccount!.current_balance}
                  onImport={addTrade}
                />
              </div>
              <div className="p-0">
                <TradeTable trades={trades} onDelete={handleDelete} onView={setViewTrade} onEdit={handleEdit} />
              </div>
            </div>
          </>
        ) : activeTab === 'analytics' ? (
          <Analytics
            trades={analyticsData}
            rawTrades={trades}
            accountName={activeAccount?.name || 'My Account'}
            accountBalance={activeAccount?.current_balance || 0}
            initialBalance={activeAccount?.initial_balance || 0}
          />
        ) : (
          <Accounts
            accounts={accounts} activeAccount={activeAccount} transactions={transactions}
            onSwitch={switchAccount} onCreate={createAccount} onUpdate={updateAccount}
            onDelete={deleteAccount} onTransaction={addTransaction}
          />
        )}
      </main>

      {/* New Trade Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden mx-0 sm:mx-auto rounded-none sm:rounded-xl top-auto sm:top-1/2 bottom-0 sm:bottom-auto translate-y-0 sm:-translate-y-1/2">
          <TradeForm
            onSubmit={handleSubmit} onCancel={() => setShowForm(false)}
            userId={user.id} accountId={activeAccount!.id} accountBalance={activeAccount!.current_balance}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Trade Dialog */}
      <Dialog open={editTrade !== null} onOpenChange={() => setEditTrade(null)}>
        <DialogContent className="w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden mx-0 sm:mx-auto rounded-none sm:rounded-xl top-auto sm:top-1/2 bottom-0 sm:bottom-auto translate-y-0 sm:-translate-y-1/2">
          {editTrade && (
            <TradeForm
              onSubmit={handleSubmit} onCancel={() => setEditTrade(null)}
              userId={user.id} accountId={activeAccount!.id} accountBalance={activeAccount!.current_balance}
              initialData={editTrade}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* View Trade Dialog */}
      <Dialog open={viewTrade !== null} onOpenChange={() => setViewTrade(null)}>
        <DialogContent className="w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden mx-0 sm:mx-auto rounded-none sm:rounded-xl top-auto sm:top-1/2 bottom-0 sm:bottom-auto translate-y-0 sm:-translate-y-1/2">
          {viewTrade && <TradeView trade={viewTrade} onClose={() => setViewTrade(null)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
