import { MetricsSnapshot, Event } from '@prisma/client';
import { prisma } from '@/l0/db';
import { logEvent } from '@/l0/events';
import { BusinessIntent } from '@/l3/businessIntent';

type FounderSummaryInput = {
  tenantId: string;
  metricsSnapshot: MetricsSnapshot;
  recentEvents: Event[];
  intent: BusinessIntent;
};

export async function runFounderSummaryAgent({
  tenantId,
  metricsSnapshot,
  recentEvents,
  intent
}: FounderSummaryInput) {
  const churnRate =
    metricsSnapshot.mrr === 0
      ? 0
      : metricsSnapshot.churnedMrr / metricsSnapshot.mrr;

  const statusLines = [
    `MRR: $${metricsSnapshot.mrr.toLocaleString()}`,
    `New MRR (30d): $${metricsSnapshot.newMrr.toLocaleString()}`,
    `Churned MRR (30d): $${metricsSnapshot.churnedMrr.toLocaleString()} (${(
      churnRate * 100
    ).toFixed(1)}%)`,
    `Active customers: ${metricsSnapshot.activeCustomers}`
  ];

  const alerts: string[] = [];
  if (churnRate > intent.alertThresholds.churnRate) {
    alerts.push('Churn rate above guardrail.');
  }
  if (
    intent.alertThresholds.runwayMonths &&
    metricsSnapshot.runwayMonths &&
    metricsSnapshot.runwayMonths < intent.alertThresholds.runwayMonths
  ) {
    alerts.push('Runway below preferred threshold.');
  }

  const narrative = [
    `Weekly summary for period ending ${metricsSnapshot.periodEnd.toDateString()}.`,
    ...statusLines,
    alerts.length ? `Alerts: ${alerts.join(' ')}` : 'No major alerts.'
  ].join('\n');

  const recommendedActions = buildRecommendedActions(
    metricsSnapshot,
    alerts,
    intent,
    recentEvents
  ).join('\n');

  const summary = await prisma.founderSummary.create({
    data: {
      tenantId,
      metricsSnapshotId: metricsSnapshot.id,
      periodEnd: metricsSnapshot.periodEnd,
      narrative,
      recommendedActions,
      state: 'DRAFT'
    }
  });

  await logEvent({
    tenantId,
    type: 'FOUNDERSUMMARY_GENERATED',
    payload: { founderSummaryId: summary.id },
    primaryEntityId: summary.id
  });

  return summary;
}

function buildRecommendedActions(
  metrics: MetricsSnapshot,
  alerts: string[],
  intent: BusinessIntent,
  recentEvents: Event[]
) {
  const actions: string[] = [];

  if (metrics.newMrr < intent.targetMrr * 0.05) {
    actions.push('Increase top-of-funnel activity to boost new MRR.');
  }

  if (alerts.length) {
    actions.push('Review churned accounts and identify root causes.');
  }

  const interestingEvents = recentEvents
    .filter((event) => event.type.startsWith('GTM_'))
    .slice(0, 2)
    .map((event) => `Follow up on ${event.type.toLowerCase()}.`);

  actions.push(...interestingEvents);

  if (!actions.length) {
    actions.push('Stay the course and focus on steady execution.');
  }

  return actions.slice(0, intent.summaryPreferences.maxActions);
}


