import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Plus, Wallet, ArrowDownToLine, ArrowUpFromLine, Trash2, Edit } from 'lucide-react';
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
      {/* Account Cards */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Trading Accounts</h2>
        <Button size="sm" onClick={() => setShowCreate(true)} className="gap-1.5">
          <Plus className="h-4 w-4" /> New Account
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map(acc => (
          <div
            key={acc.id}
            onClick={() => onSwitch(acc.id)}
            className={`rounded-lg border p-4 cursor-pointer transition-all ${
              activeAccount?.id === acc.id ? 'border-primary bg-primary/5 ring-1 ring-primary/30' : 'border-border bg-card hover:border-muted-foreground/30'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold">{acc.name}</h3>
                <p className="text-xs text-muted-foreground">{acc.type} {acc.broker ? `· ${acc.broker}` : ''}</p>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); openEdit(acc); }}>
                  <Edit className="h-3.5 w-3.5" />
                </Button>
                {accounts.length > 1 && (
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-loss" onClick={async (e) => { e.stopPropagation(); await onDelete(acc.id); toast.success('Account deleted'); }}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Balance</span>
                <span>Initial</span>
              </div>
              <div className="flex justify-between">
                <span className="font-mono font-bold text-lg">${acc.current_balance.toLocaleString()}</span>
                <span className="font-mono text-sm text-muted-foreground">${acc.initial_balance.toLocaleString()}</span>
              </div>
              {acc.initial_balance > 0 && (
                <div className={`text-xs font-mono font-semibold ${acc.current_balance >= acc.initial_balance ? 'text-profit' : 'text-loss'}`}>
                  {acc.current_balance >= acc.initial_balance ? '+' : ''}{((acc.current_balance - acc.initial_balance) / acc.initial_balance * 100).toFixed(2)}%
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Active Account Actions */}
      {activeAccount && (
        <div className="rounded-lg bg-card border border-border p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-primary" />
              <h3 className="font-semibold">{activeAccount.name} — Fund Management</h3>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setShowTransaction('deposit')} className="gap-1.5">
                <ArrowDownToLine className="h-3.5 w-3.5 text-profit" /> Deposit
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowTransaction('withdrawal')} className="gap-1.5">
                <ArrowUpFromLine className="h-3.5 w-3.5 text-loss" /> Withdraw
              </Button>
            </div>
          </div>

          {/* Transaction History */}
          {transactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground uppercase">
                    <th className="text-left py-2 px-2">Date</th>
                    <th className="text-left py-2 px-2">Type</th>
                    <th className="text-right py-2 px-2">Amount</th>
                    <th className="text-left py-2 px-2">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(tx => (
                    <tr key={tx.id} className="border-b border-border/50">
                      <td className="py-2 px-2 font-mono text-xs">{new Date(tx.created_at).toLocaleDateString()}</td>
                      <td className="py-2 px-2">
                        <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${tx.type === 'deposit' ? 'bg-profit/10 text-profit' : 'bg-loss/10 text-loss'}`}>
                          {tx.type === 'deposit' ? '↓ Deposit' : '↑ Withdrawal'}
                        </span>
                      </td>
                      <td className={`py-2 px-2 font-mono text-right font-semibold ${tx.type === 'deposit' ? 'text-profit' : 'text-loss'}`}>
                        {tx.type === 'deposit' ? '+' : '-'}${tx.amount.toLocaleString()}
                      </td>
                      <td className="py-2 px-2 text-xs text-muted-foreground">{tx.note || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No transactions yet</p>
          )}
        </div>
      )}

      {/* Create Account Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-sm">
          <form onSubmit={handleCreate} className="space-y-4">
            <h2 className="text-lg font-semibold">New Trading Account</h2>
            <div className="space-y-1"><Label className="text-xs">Account Name</Label><Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="My Funded Account" required /></div>
            <div className="space-y-1"><Label className="text-xs">Type</Label>
              <Select value={newType} onValueChange={setNewType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ACCOUNT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label className="text-xs">Broker</Label><Input value={newBroker} onChange={e => setNewBroker(e.target.value)} placeholder="e.g. FTMO" /></div>
            <div className="space-y-1"><Label className="text-xs">Initial Balance ($)</Label><Input type="number" value={newBalance} onChange={e => setNewBalance(e.target.value)} placeholder="10000" required /></div>
            <Button type="submit" className="w-full">Create Account</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Transaction Dialog */}
      <Dialog open={showTransaction !== null} onOpenChange={() => setShowTransaction(null)}>
        <DialogContent className="max-w-sm">
          <form onSubmit={handleTransaction} className="space-y-4">
            <h2 className="text-lg font-semibold">{showTransaction === 'deposit' ? 'Deposit Funds' : 'Withdraw Funds'}</h2>
            <div className="space-y-1"><Label className="text-xs">Amount ($)</Label><Input type="number" step="0.01" value={txAmount} onChange={e => setTxAmount(e.target.value)} placeholder="1000" required /></div>
            <div className="space-y-1"><Label className="text-xs">Note (optional)</Label><Input value={txNote} onChange={e => setTxNote(e.target.value)} placeholder="Monthly deposit" /></div>
            <Button type="submit" className="w-full">{showTransaction === 'deposit' ? 'Deposit' : 'Withdraw'}</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Account Dialog */}
      <Dialog open={showEdit !== null} onOpenChange={() => setShowEdit(null)}>
        <DialogContent className="max-w-sm">
          <form onSubmit={handleEdit} className="space-y-4">
            <h2 className="text-lg font-semibold">Edit Account</h2>
            <div className="space-y-1"><Label className="text-xs">Name</Label><Input value={editName} onChange={e => setEditName(e.target.value)} required /></div>
            <div className="space-y-1"><Label className="text-xs">Type</Label>
              <Select value={editType} onValueChange={setEditType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ACCOUNT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label className="text-xs">Broker</Label><Input value={editBroker} onChange={e => setEditBroker(e.target.value)} /></div>
            <Button type="submit" className="w-full">Save Changes</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
