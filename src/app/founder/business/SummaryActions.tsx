'use client';

import { useTransition } from 'react';

export function SummaryActions({
  pendingSummaryId
}: {
  pendingSummaryId?: string;
}) {
  const [isRunning, startRun] = useTransition();
  const [isApproving, startApprove] = useTransition();

  const runFlow = () => {
    startRun(async () => {
      await fetch('/api/weekly-summary', { method: 'POST' });
    });
  };

  const approve = () => {
    if (!pendingSummaryId) return;
    startApprove(async () => {
      await fetch(`/api/founder-summary/${pendingSummaryId}/approve`, {
        method: 'POST'
      });
    });
  };

  return (
    <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
      <button onClick={runFlow} disabled={isRunning}>
        {isRunning ? 'Running...' : 'Generate Weekly Summary'}
      </button>
      <button
        onClick={approve}
        disabled={!pendingSummaryId || isApproving}
        style={{ backgroundColor: '#059669' }}
      >
        {isApproving ? 'Approving...' : 'Approve Latest Summary'}
      </button>
    </div>
  );
}


