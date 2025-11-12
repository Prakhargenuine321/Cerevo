import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-background dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <p className="text-muted-foreground">Loading your dashboard...</p>
      </div>
    </div>
  );
}
