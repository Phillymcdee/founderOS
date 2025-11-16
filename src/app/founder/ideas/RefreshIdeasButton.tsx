'use client';

import { useTransition } from 'react';

export function RefreshIdeasButton() {
  const [isPending, startTransition] = useTransition();

  const callEndpoint = (url: string) => {
    startTransition(async () => {
      await fetch(url, { method: 'POST' });
      window.location.reload();
    });
  };

  return (
    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
      <button
        onClick={() => callEndpoint('/api/ideas/discover')}
        disabled={isPending}
        style={{
          padding: '0.5rem 1rem',
          backgroundColor: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '0.375rem',
          cursor: isPending ? 'not-allowed' : 'pointer',
          opacity: isPending ? 0.6 : 1
        }}
      >
        {isPending ? 'Running discovery…' : 'Discover new ideas'}
      </button>
      <button
        onClick={() => callEndpoint('/api/ideas/refresh')}
        disabled={isPending}
        style={{
          padding: '0.5rem 1rem',
          backgroundColor: '#10b981',
          color: 'white',
          border: 'none',
          borderRadius: '0.375rem',
          cursor: isPending ? 'not-allowed' : 'pointer',
          opacity: isPending ? 0.6 : 1
        }}
      >
        {isPending ? 'Refreshing ideas…' : 'Auto-score all ideas'}
      </button>
      <button
        onClick={() => callEndpoint('/api/ideas/experiment-loop')}
        disabled={isPending}
        style={{
          padding: '0.5rem 1rem',
          backgroundColor: '#8b5cf6',
          color: 'white',
          border: 'none',
          borderRadius: '0.375rem',
          cursor: isPending ? 'not-allowed' : 'pointer',
          opacity: isPending ? 0.6 : 1
        }}
      >
        {isPending ? 'Running experiments…' : 'Run experiment loop'}
      </button>
    </div>
  );
}


