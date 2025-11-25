import {
  MetricsSnapshot,
  Event,
  ProductRecommendation
} from '@prisma/client';
import { prisma } from '@/l0/db';
import { logEvent } from '@/l0/events';
import { BusinessIntent } from '@/l3/businessIntent';

type FounderSummaryInput = {
  tenantId: string;
  metricsSnapshot: MetricsSnapshot;
  recentEvents: Event[];
  intent: BusinessIntent;
  recommendations: ProductRecommendation[];
  topArchetypes?: Array<{
    id: string;
    label: string;
    totalScore: number | null;
    lastDemandTestVerdict: string | null;
    lastDemandTestAt: Date | null;
  }>;
};

export async function runFounderSummaryAgent({
  tenantId,
  metricsSnapshot,
  recentEvents,
  intent,
  recommendations,
  topArchetypes = []
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

  const recommendationLines = recommendations.length
    ? [
        `Inbox Spend Guardian surfaced ${recommendations.length} pending recommendation${
          recommendations.length === 1 ? '' : 's'
        }.`,
        ...recommendations.slice(0, 3).map((rec) => {
          const savings =
            rec.potentialSavingsCents != null
              ? ` (≈$${(rec.potentialSavingsCents / 100).toFixed(0)} potential savings)`
              : '';
          return `• ${rec.vendorName}: ${rec.type.replace(/_/g, ' ')}${savings}`;
        })
      ]
    : ['Inbox Spend Guardian: no pending recommendations.'];

  const archetypeLines =
    topArchetypes.length > 0
      ? [
          `\nTop Archetype Opportunities:`,
          ...topArchetypes
            .slice(0, 3)
            .map((arch) => {
              const verdict =
                arch.lastDemandTestVerdict === 'PASS'
                  ? '✅ PASS'
                  : arch.lastDemandTestVerdict === 'FAIL'
                    ? '❌ FAIL'
                    : arch.lastDemandTestVerdict === 'INCONCLUSIVE'
                      ? '⚠️ INCONCLUSIVE'
                      : '⏳ NOT TESTED';
              return `• ${arch.label} (score: ${arch.totalScore ?? 'N/A'}) – ${verdict}`;
            })
        ]
      : [];

  const narrative = [
    `Weekly summary for period ending ${metricsSnapshot.periodEnd.toDateString()}.`,
    ...statusLines,
    alerts.length ? `Alerts: ${alerts.join(' ')}` : 'No major alerts.',
    ...recommendationLines,
    ...archetypeLines
  ].join('\n');

  const recommendedActions = buildRecommendedActions(
    metricsSnapshot,
    alerts,
    intent,
    recentEvents,
    recommendations,
    topArchetypes
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
  recentEvents: Event[],
  recommendations: ProductRecommendation[],
  topArchetypes: FounderSummaryInput['topArchetypes'] = []
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

  if (recommendations.length) {
    const highSpend = recommendations.find((rec) => rec.type === 'HIGH_SPEND');
    const upcomingRenewal = recommendations.find(
      (rec) => rec.type === 'UPCOMING_RENEWAL'
    );

    if (highSpend) {
      actions.push(
        `Review ${highSpend.vendorName} spend (Inbox Spend Guardian flagged high spend).`
      );
    }

    if (upcomingRenewal) {
      actions.push(
        `Decide on ${upcomingRenewal.vendorName} before renewal on ${upcomingRenewal.periodEnd.toDateString()}.`
      );
    }
  }

  const topArchetype = topArchetypes
    ?.filter((arch) => arch.totalScore && arch.totalScore >= 10)
    .sort((a, b) => (b.totalScore ?? 0) - (a.totalScore ?? 0))[0];

  if (topArchetype) {
    if (topArchetype.lastDemandTestVerdict === 'PASS') {
      actions.push(
        `Double down on "${topArchetype.label}" – demand test passed. Consider promoting to product.`
      );
    } else if (!topArchetype.lastDemandTestVerdict) {
      actions.push(
        `Run demand test for "${topArchetype.label}" (score: ${topArchetype.totalScore}) to validate market interest.`
      );
    } else if (topArchetype.lastDemandTestVerdict === 'INCONCLUSIVE') {
      actions.push(
        `Refine targeting for "${topArchetype.label}" and rerun demand test.`
      );
    }
  }

  if (!actions.length) {
    actions.push('Stay the course and focus on steady execution.');
  }

  return actions.slice(0, intent.summaryPreferences.maxActions);
}


