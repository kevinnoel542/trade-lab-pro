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
import Auth from '@/pages/Auth';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, BarChart3, BookOpen, LineChart, Wallet, LogOut, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

const Index = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { accounts, activeAccount, transactions, loading: accLoading, switchAccount, createAccount, updateAccount, deleteAccount, addTransaction, refreshBalances } = useAccounts(user?.id);
  const { trades, loading: tradesLoading, addTrade, updateTrade, deleteTrade, getStats } = useTrades(user?.id, activeAccount?.id);

  const [showForm, setShowForm] = useState(false);
  const [editTrade, setEditTrade] = useState<DbTrade | null>(null);
  const [viewTrade, setViewTrade] = useState<DbTrade | null>(null);
  const [activeTab, setActiveTab] = useState<'journal' | 'analytics' | 'accounts'>('journal');

  if (authLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><span className="text-muted-foreground">Loading...</span></div>;
  if (!user) return <Auth />;
  if (accLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><span className="text-muted-foreground">Loading accounts...</span></div>;

  // If no accounts, show account creation
  if (accounts.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-6 text-center">
          <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center mx-auto"><Wallet className="h-6 w-6 text-primary" /></div>
          <h1 className="text-2xl font-bold">Welcome to TradeVault</h1>
          <p className="text-muted-foreground">Create your first trading account to get started.</p>
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

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <BarChart3 className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">TradeVault</h1>
              <p className="text-xs text-muted-foreground">CRT Performance Lab</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Account Switcher */}
            <Select value={activeAccount?.id || ''} onValueChange={switchAccount}>
              <SelectTrigger className="text-xs h-8 w-40">
                <SelectValue placeholder="Account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map(a => (
                  <SelectItem key={a.id} value={a.id}>
                    <span className="flex items-center gap-2">
                      <span>{a.name}</span>
                      <span className="text-muted-foreground font-mono">${a.current_balance.toLocaleString()}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex rounded-lg border border-border overflow-hidden mr-2">
              {([['journal', BookOpen, 'Journal'], ['analytics', LineChart, 'Analytics'], ['accounts', Wallet, 'Accounts']] as const).map(([key, Icon, label]) => (
                <button key={key} onClick={() => setActiveTab(key as any)}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1.5 ${activeTab === key ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                  <Icon className="h-3.5 w-3.5" />{label}
                </button>
              ))}
            </div>
            {activeTab === 'journal' && (
              <Button onClick={() => setShowForm(true)} size="sm" className="gap-1.5"><Plus className="h-4 w-4" />New Trade</Button>
            )}
            <Button variant="ghost" size="icon" onClick={signOut} className="h-8 w-8"><LogOut className="h-4 w-4" /></Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {activeTab === 'journal' ? (
          <>
            {/* Balance Card */}
            {activeAccount && (
              <div className="rounded-lg bg-card border border-border p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{activeAccount.name} Balance</p>
                    <p className="text-2xl font-mono font-bold">${activeAccount.current_balance.toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-[10px] text-muted-foreground uppercase">Initial</p>
                    <p className="font-mono text-sm text-muted-foreground">${activeAccount.initial_balance.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-muted-foreground uppercase">P&L</p>
                    {(() => {
                      const diff = activeAccount.current_balance - activeAccount.initial_balance;
                      const isPositive = diff >= 0;
                      return (
                        <p className={`font-mono text-sm font-semibold flex items-center gap-1 ${isPositive ? 'text-profit' : 'text-loss'}`}>
                          {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          {isPositive ? '+' : ''}${diff.toLocaleString()}
                        </p>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}
            <StatsGrid stats={stats} />
            <div className="rounded-lg bg-card border border-border">
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <h2 className="font-semibold">Trade History</h2>
                  <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full font-mono">{trades.length}</span>
                </div>
                <CsvExportImport
                  trades={trades}
                  userId={user.id}
                  accountId={activeAccount!.id}
                  accountBalance={activeAccount!.current_balance}
                  onImport={addTrade}
                />
              </div>
              <TradeTable trades={trades} onDelete={handleDelete} onView={setViewTrade} onEdit={handleEdit} />
            </div>
          </>
        ) : activeTab === 'analytics' ? (
          <Analytics trades={analyticsData} />
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
          <TradeForm
            onSubmit={handleSubmit} onCancel={() => setShowForm(false)}
            userId={user.id} accountId={activeAccount!.id} accountBalance={activeAccount!.current_balance}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Trade Dialog */}
      <Dialog open={editTrade !== null} onOpenChange={() => setEditTrade(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
          {viewTrade && <TradeView trade={viewTrade} onClose={() => setViewTrade(null)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
