import { BarChart3 } from 'lucide-react';

/** Auth is not used in offline mode — this is a placeholder that should never render. */
export default function Auth() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center space-y-4">
        <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center mx-auto">
          <BarChart3 className="h-6 w-6 text-primary" />
        </div>
        <h1 className="text-2xl font-bold">TradeVault</h1>
        <p className="text-muted-foreground">Offline mode — no login required.</p>
      </div>
    </div>
  );
}
