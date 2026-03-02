import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Plus, Wallet, ArrowDownToLine, ArrowUpFromLine, Trash2, Edit, TrendingUp, TrendingDown, DollarSign, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import type { TradingAccount, AccountTransaction } from '@/hooks/use-accounts';

const ACCOUNT_TYPES = ['Personal', 'Funded', 'Demo', 'Prop Firm', 'Challenge'];

interface AccountsProps {
  accounts: TradingAccount[];
  activeAccount: TradingAccount | null;
  transactions: AccountTransaction[];
  onSwitch: (id: string) => void;
  onCreate: (name: string, type: string, broker: string, balance: number) => Promise<any>;
  onUpdate: (id: string, updates: Partial<Pick<TradingAccount, 'name' | 'type' | 'broker'>>) => Promise<any>;
  onDelete: (id: string) => Promise<any>;
  onTransaction: (accountId: string, type: 'deposit' | 'withdrawal', amount: number, note?: string) => Promise<any>;
}

export default function Accounts({ accounts, activeAccount, transactions, onSwitch, onCreate, onUpdate, onDelete, onTransaction }: AccountsProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [showTransaction, setShowTransaction] = useState<'deposit' | 'withdrawal' | null>(null);
  const [showEdit, setShowEdit] = useState<TradingAccount | null>(null);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('Personal');
  const [newBroker, setNewBroker] = useState('');
  const [newBalance, setNewBalance] = useState('');
  const [txAmount, setTxAmount] = useState('');
  const [txNote, setTxNote] = useState('');
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState('');
  const [editBroker, setEditBroker] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await onCreate(newName, newType, newBroker, parseFloat(newBalance) || 0);
    if (!result?.error) {
      toast.success('Account created');
      setShowCreate(false);
      setNewName(''); setNewBroker(''); setNewBalance('');
    } else toast.error(result.error.message);
  };

  const handleTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAccount || !showTransaction) return;
    const amount = parseFloat(txAmount) || 0;
    if (amount <= 0) return toast.error('Enter a valid amount');
    if (showTransaction === 'withdrawal' && amount > activeAccount.current_balance) return toast.error('Insufficient balance');
    const result = await onTransaction(activeAccount.id, showTransaction, amount, txNote);
    if (!result?.error) {
      toast.success(`${showTransaction === 'deposit' ? 'Deposit' : 'Withdrawal'} recorded`);
      setShowTransaction(null);
      setTxAmount(''); setTxNote('');
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEdit) return;
    const result = await onUpdate(showEdit.id, { name: editName, type: editType, broker: editBroker || null });
    if (!result?.error) {
      toast.success('Account updated');
      setShowEdit(null);
    }
  };

  const openEdit = (acc: TradingAccount) => {
    setEditName(acc.name);
    setEditType(acc.type);
    setEditBroker(acc.broker || '');
    setShowEdit(acc);
  };

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-4 w-1 rounded-full bg-indigo-500" />
          <h2 className="text-sm font-bold text-foreground uppercase tracking-widest">Trading Accounts</h2>
          <span className="text-[10px] font-semibold bg-secondary border border-border/60 px-2 py-0.5 rounded-full text-muted-foreground">{accounts.length}</span>
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)}
          className="gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white border-0 shadow-md shadow-indigo-500/20">
          <Plus className="h-4 w-4" /> New Account
        </Button>
      </div>

      {/* ── Account Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map(acc => {
          const diff = acc.current_balance - acc.initial_balance;
          const pct = acc.initial_balance > 0 ? ((diff / acc.initial_balance) * 100).toFixed(2) : '0.00';
          const isPos = diff >= 0;
          const isActive = activeAccount?.id === acc.id;
          return (
            <div key={acc.id} onClick={() => onSwitch(acc.id)}
              className={`rounded-xl border p-5 cursor-pointer transition-all duration-200 relative overflow-hidden group ${
                isActive
                  ? 'border-indigo-500/50 bg-indigo-500/5 ring-1 ring-indigo-500/20 shadow-lg shadow-indigo-500/10'
                  : 'border-border/60 bg-card hover:border-border hover:shadow-md'
              }`}>
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />

              {/* Top row */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${isActive ? 'bg-indigo-500/20' : 'bg-secondary/60'}`}>
                    <Wallet className={`h-4 w-4 ${isActive ? 'text-indigo-400' : 'text-muted-foreground'}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-bold text-sm leading-none">{acc.name}</h3>
                      {isActive && <CheckCircle2 className="h-3.5 w-3.5 text-indigo-400" />}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {acc.type}{acc.broker ? ` · ${acc.broker}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex gap-0.5">
                  <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => { e.stopPropagation(); openEdit(acc); }}>
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                  {accounts.length > 1 && (
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-loss opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={async (e) => { e.stopPropagation(); await onDelete(acc.id); toast.success('Account deleted'); }}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Balance */}
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Current Balance</p>
                  <p className="text-2xl font-mono font-bold tracking-tight">${acc.current_balance.toLocaleString()}</p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-border/40">
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-0.5">Initial</p>
                    <p className="font-mono text-xs text-muted-foreground font-semibold">${acc.initial_balance.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-muted-foreground mb-0.5">Return</p>
                    <p className={`font-mono text-sm font-bold flex items-center gap-1 justify-end ${isPos ? 'text-profit' : 'text-loss'}`}>
                      {isPos ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {isPos ? '+' : ''}{pct}%
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-muted-foreground mb-0.5">Net P&L</p>
                    <p className={`font-mono text-xs font-bold ${isPos ? 'text-profit' : 'text-loss'}`}>
                      {isPos ? '+' : ''}${diff.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Fund Management ── */}
      {activeAccount && (
        <div className="rounded-xl bg-card border border-border/60 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/60 bg-secondary/20">
            <div className="flex items-center gap-2.5">
              <div className="h-4 w-1 rounded-full bg-cyan-500" />
              <DollarSign className="h-3.5 w-3.5 text-cyan-400" />
              <h3 className="text-xs font-bold text-foreground uppercase tracking-widest">{activeAccount.name} — Fund Management</h3>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setShowTransaction('deposit')}
                className="gap-1.5 border-profit/30 text-profit hover:bg-profit/10 hover:border-profit/50 text-xs h-8">
                <ArrowDownToLine className="h-3.5 w-3.5" /> Deposit
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowTransaction('withdrawal')}
                className="gap-1.5 border-loss/30 text-loss hover:bg-loss/10 hover:border-loss/50 text-xs h-8">
                <ArrowUpFromLine className="h-3.5 w-3.5" /> Withdraw
              </Button>
            </div>
          </div>

          {transactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/40 text-[10px] text-muted-foreground uppercase tracking-widest bg-secondary/10">
                    <th className="text-left py-3 px-4">Date</th>
                    <th className="text-left py-3 px-3">Type</th>
                    <th className="text-right py-3 px-3">Amount</th>
                    <th className="text-left py-3 px-3">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx, idx) => (
                    <tr key={tx.id} className={`border-b border-border/30 hover:bg-secondary/20 transition-colors ${idx % 2 === 0 ? '' : 'bg-secondary/10'}`}>
                      <td className="py-3 px-4 font-mono text-xs text-muted-foreground">{new Date(tx.created_at).toLocaleDateString()}</td>
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md ${
                          tx.type === 'deposit' ? 'bg-profit/10 text-profit' : 'bg-loss/10 text-loss'
                        }`}>
                          {tx.type === 'deposit'
                            ? <><ArrowDownToLine className="h-3 w-3" /> Deposit</>
                            : <><ArrowUpFromLine className="h-3 w-3" /> Withdrawal</>}
                        </span>
                      </td>
                      <td className={`py-3 px-3 font-mono text-right font-bold text-sm ${tx.type === 'deposit' ? 'text-profit' : 'text-loss'}`}>
                        {tx.type === 'deposit' ? '+' : '-'}${tx.amount.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-xs text-muted-foreground">{tx.note || <span className="opacity-30">—</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-20" />
              <p className="text-sm">No transactions yet</p>
              <p className="text-xs mt-1 opacity-60">Use Deposit or Withdraw to record fund movements</p>
            </div>
          )}
        </div>
      )}

      {/* ── Create Account Dialog ── */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-sm">
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-8 w-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                <Plus className="h-4 w-4 text-indigo-400" />
              </div>
              <h2 className="text-base font-bold">New Trading Account</h2>
            </div>
            <div className="space-y-1"><Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Account Name</Label><Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="My Funded Account" required /></div>
            <div className="space-y-1"><Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Type</Label>
              <Select value={newType} onValueChange={setNewType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ACCOUNT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Broker</Label><Input value={newBroker} onChange={e => setNewBroker(e.target.value)} placeholder="e.g. FTMO" /></div>
            <div className="space-y-1"><Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Initial Balance ($)</Label><Input type="number" value={newBalance} onChange={e => setNewBalance(e.target.value)} placeholder="10000" required /></div>
            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white">Create Account</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Transaction Dialog ── */}
      <Dialog open={showTransaction !== null} onOpenChange={() => setShowTransaction(null)}>
        <DialogContent className="max-w-sm">
          <form onSubmit={handleTransaction} className="space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${showTransaction === 'deposit' ? 'bg-profit/20' : 'bg-loss/20'}`}>
                {showTransaction === 'deposit'
                  ? <ArrowDownToLine className="h-4 w-4 text-profit" />
                  : <ArrowUpFromLine className="h-4 w-4 text-loss" />}
              </div>
              <h2 className="text-base font-bold">{showTransaction === 'deposit' ? 'Deposit Funds' : 'Withdraw Funds'}</h2>
            </div>
            <div className="space-y-1"><Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Amount ($)</Label><Input type="number" step="0.01" value={txAmount} onChange={e => setTxAmount(e.target.value)} placeholder="1000" required /></div>
            <div className="space-y-1"><Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Note (optional)</Label><Input value={txNote} onChange={e => setTxNote(e.target.value)} placeholder="Monthly deposit" /></div>
            <Button type="submit" className={`w-full text-white ${showTransaction === 'deposit' ? 'bg-profit hover:bg-profit/80' : 'bg-loss hover:bg-loss/80'}`}>
              {showTransaction === 'deposit' ? 'Confirm Deposit' : 'Confirm Withdrawal'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Edit Account Dialog ── */}
      <Dialog open={showEdit !== null} onOpenChange={() => setShowEdit(null)}>
        <DialogContent className="max-w-sm">
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center">
                <Edit className="h-4 w-4 text-muted-foreground" />
              </div>
              <h2 className="text-base font-bold">Edit Account</h2>
            </div>
            <div className="space-y-1"><Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Name</Label><Input value={editName} onChange={e => setEditName(e.target.value)} required /></div>
            <div className="space-y-1"><Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Type</Label>
              <Select value={editType} onValueChange={setEditType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ACCOUNT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Broker</Label><Input value={editBroker} onChange={e => setEditBroker(e.target.value)} /></div>
            <Button type="submit" className="w-full">Save Changes</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
