'use client';

import { useTransition } from 'react';
import { colors, spacing, typography, borderRadius, shadows, transitions } from './styles';

export function RefreshIdeasButton() {
  const [isPending, startTransition] = useTransition();

  const callEndpoint = (url: string) => {
    startTransition(async () => {
      await fetch(url, { method: 'POST' });
      window.location.reload();
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
        gap: spacing.md,
        flexWrap: 'wrap',
      }}
    >
      <button
        onClick={() => callEndpoint('/api/ideas/discover')}
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
        onClick={() => callEndpoint('/api/ideas/refresh')}
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
        onClick={() => callEndpoint('/api/ideas/experiment-loop')}
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
  );
}


