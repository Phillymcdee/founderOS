'use client';

import { useTransition, useState } from 'react';
import { colors, spacing, typography, borderRadius, shadows, transitions } from './styles';

export function RefreshIdeasButton() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const callEndpoint = (url: string) => {
    console.log('Button clicked, calling endpoint:', url);
    setError(null);
    startTransition(() => {
      console.log('Transition started');
      fetch(url, { method: 'POST' })
        .then(async (response) => {
          console.log('Response received:', response.status);
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || `Failed: ${response.status} ${response.statusText}`);
          }
          // Small delay to show success state before reload
          setTimeout(() => {
            window.location.reload();
          }, 500);
        })
        .catch((err) => {
          console.error('Error calling endpoint:', err);
          setError(err instanceof Error ? err.message : 'An error occurred');
        });
    });
  };

  const buttonBaseStyle = {
    padding: `${spacing.sm} ${spacing.md}`,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: 'white',
    border: 'none',
    borderRadius: borderRadius.md,
    cursor: isPending ? 'not-allowed' : 'pointer',
    opacity: isPending ? 0.6 : 1,
    transition: `all ${transitions.normal}`,
    boxShadow: shadows.sm,
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.sm,
      }}
    >
      {error && (
        <div
          style={{
            padding: spacing.sm,
            backgroundColor: '#fee2e2',
            color: '#991b1b',
            borderRadius: borderRadius.sm,
            fontSize: typography.sizes.sm,
            border: '1px solid #fecaca',
          }}
        >
          Error: {error}
        </div>
      )}
      <div
        style={{
          display: 'flex',
          gap: spacing.md,
          flexWrap: 'wrap',
        }}
      >
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          console.log('Discover button clicked');
          callEndpoint('/api/ideas/discover');
        }}
        disabled={isPending}
        style={{
          ...buttonBaseStyle,
          backgroundColor: colors.ui.accent,
        }}
        onMouseEnter={(e) => {
          if (!isPending) {
            e.currentTarget.style.boxShadow = shadows.md;
            e.currentTarget.style.transform = 'translateY(-1px)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isPending) {
            e.currentTarget.style.boxShadow = shadows.sm;
            e.currentTarget.style.transform = 'translateY(0)';
          }
        }}
      >
        {isPending ? 'Running discovery…' : 'Discover new ideas'}
      </button>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          callEndpoint('/api/ideas/refresh');
        }}
        disabled={isPending}
        style={{
          ...buttonBaseStyle,
          backgroundColor: colors.score.high,
        }}
        onMouseEnter={(e) => {
          if (!isPending) {
            e.currentTarget.style.boxShadow = shadows.md;
            e.currentTarget.style.transform = 'translateY(-1px)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isPending) {
            e.currentTarget.style.boxShadow = shadows.sm;
            e.currentTarget.style.transform = 'translateY(0)';
          }
        }}
      >
        {isPending ? 'Refreshing ideas…' : 'Auto-score all ideas'}
      </button>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          callEndpoint('/api/ideas/experiment-loop');
        }}
        disabled={isPending}
        style={{
          ...buttonBaseStyle,
          backgroundColor: '#8b5cf6',
        }}
        onMouseEnter={(e) => {
          if (!isPending) {
            e.currentTarget.style.boxShadow = shadows.md;
            e.currentTarget.style.transform = 'translateY(-1px)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isPending) {
            e.currentTarget.style.boxShadow = shadows.sm;
            e.currentTarget.style.transform = 'translateY(0)';
          }
        }}
      >
        {isPending ? 'Running experiments…' : 'Run experiment loop'}
      </button>
      </div>
    </div>
  );
}


