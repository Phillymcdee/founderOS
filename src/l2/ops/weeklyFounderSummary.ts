import { prisma } from '@/l0/db';
import { logEvent } from '@/l0/events';
import { getBusinessIntent } from '@/l3/businessIntent';
import { runMetricsAggregationAgent } from '@/l1/ops/metricsAggregation';
import { runFounderSummaryAgent } from '@/l1/ops/founderSummary';

export async function runWeeklyFounderSummaryFlow(tenantId: string) {
  const flowInstanceId = `weekly-founder-summary-${Date.now()}`;
  const { intent, version: intentVersion } = await getBusinessIntent(tenantId);

  await logEvent({
    tenantId,
    type: 'FLOW_STARTED',
    flowInstanceId,
    payload: {
      flow: 'weeklyFounderSummaryFlow',
      businessIntentVersion: intentVersion
    }
  });

  const snapshot = await runMetricsAggregationAgent({
    tenantId
  });

  const recentEvents = await prisma.event.findMany({
    where: {
      tenantId,
      createdAt: {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 20
  });

  const pendingSpendRecommendations =
    await prisma.productRecommendation.findMany({
      where: {
        tenantId,
        status: 'PENDING_REVIEW'
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

  const topArchetypes = await prisma.archetypeInstance.findMany({
    where: { tenantId },
    orderBy: [
      { totalScore: 'desc' },
      { updatedAt: 'desc' }
    ],
    take: 5,
    select: {
      id: true,
      label: true,
      totalScore: true,
      lastDemandTestVerdict: true,
      lastDemandTestAt: true
    }
  });

  const summary = await runFounderSummaryAgent({
    tenantId,
    metricsSnapshot: snapshot,
    recentEvents,
    intent,
    recommendations: pendingSpendRecommendations,
    topArchetypes
  });

  await prisma.founderSummary.update({
    where: { id: summary.id },
    data: {
      state: 'PENDING_APPROVAL'
    }
  });

  await logEvent({
    tenantId,
    type: 'FOUNDERSUMMARY_APPROVAL_REQUESTED',
    flowInstanceId,
    primaryEntityId: summary.id,
    payload: { businessIntentVersion: intentVersion }
  });

  await logEvent({
    tenantId,
    type: 'FLOW_COMPLETED',
    flowInstanceId,
    payload: { summaryId: summary.id }
  });

  return summary.id;
}

export async function approveFounderSummary(summaryId: string, tenantId: string) {
  const summary = await prisma.founderSummary.update({
    where: { id: summaryId },
    data: {
      state: 'PUBLISHED'
    }
  });

  await logEvent({
    tenantId,
    type: 'FOUNDERSUMMARY_APPROVED',
    primaryEntityId: summaryId
  });

  await logEvent({
    tenantId,
    type: 'FOUNDERSUMMARY_PUBLISHED',
    primaryEntityId: summaryId
  });

  return summary;
}


