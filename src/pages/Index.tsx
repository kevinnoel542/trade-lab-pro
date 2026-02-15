import { useState } from 'react';
import { useTrades } from '@/hooks/use-trades';
import { StatsGrid } from '@/components/StatsGrid';
import { TradeForm } from '@/components/TradeForm';
import { TradeTable } from '@/components/TradeTable';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Plus, BarChart3, BookOpen } from 'lucide-react';
import { toast } from 'sonner';

const Index = () => {
  const { trades, addTrade, deleteTrade, getStats } = useTrades();
  const [showForm, setShowForm] = useState(false);
  const stats = getStats();

  const handleSubmit = (trade: Parameters<typeof addTrade>[0]) => {
    addTrade(trade);
    setShowForm(false);
    toast.success('Trade logged successfully');
  };

  const handleDelete = (id: string) => {
    deleteTrade(id);
    toast.success('Trade deleted');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <BarChart3 className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">TradeVault</h1>
              <p className="text-xs text-muted-foreground">Performance Laboratory</p>
            </div>
          </div>
          <Button onClick={() => setShowForm(true)} size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" />
            New Trade
          </Button>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <StatsGrid stats={stats} />

        {/* Trade List */}
        <div className="rounded-lg bg-card border border-border">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <h2 className="font-semibold">Trade History</h2>
              <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full font-mono">{trades.length}</span>
            </div>
          </div>
          <TradeTable trades={trades} onDelete={handleDelete} />
        </div>
      </main>

      {/* Trade Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
          <TradeForm onSubmit={handleSubmit} onCancel={() => setShowForm(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
