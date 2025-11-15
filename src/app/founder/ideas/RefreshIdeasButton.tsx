'use client';

import { useTransition } from 'react';

export function RefreshIdeasButton() {
  const [isPending, startTransition] = useTransition();

  const refresh = () => {
    startTransition(async () => {
      await fetch('/api/ideas/refresh', {
        method: 'POST'
      });
    });
  };

  return (
    <button onClick={refresh} disabled={isPending}>
      {isPending ? 'Refreshing ideas…' : 'Auto-score all ideas'}
    </button>
  );
}


