'use client';

import { useTransition } from 'react';

export function RefreshIdeasButton() {
  const [isPending, startTransition] = useTransition();

  const callEndpoint = (url: string) => {
    startTransition(async () => {
      await fetch(url, { method: 'POST' });
    });
  };

  return (
    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
      <button
        onClick={() => callEndpoint('/api/ideas/discover')}
        disabled={isPending}
      >
        {isPending ? 'Running discovery…' : 'Discover new ideas'}
      </button>
      <button
        onClick={() => callEndpoint('/api/ideas/refresh')}
        disabled={isPending}
      >
        {isPending ? 'Refreshing ideas…' : 'Auto-score all ideas'}
      </button>
    </div>
  );
}


