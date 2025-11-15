import { prisma } from '@/l0/db';
import { logEvent } from '@/l0/events';

export type MetricsAggregationInput = {
  tenantId: string;
  periodEnd?: Date;
};

export async function runMetricsAggregationAgent({
  tenantId,
  periodEnd = new Date()
}: MetricsAggregationInput) {
  const subscriptions = await prisma.subscription.findMany({
    where: { tenantId }
  });

  const activeSubscriptions = subscriptions.filter(
    (sub) => sub.status === 'active'
  );

  const mrr = activeSubscriptions.reduce((sum, sub) => sum + sub.mrr, 0);

  const thirtyDaysAgo = new Date(periodEnd);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const newMrr = subscriptions
    .filter(
      (sub) => sub.startedAt >= thirtyDaysAgo && sub.startedAt <= periodEnd
    )
    .reduce((sum, sub) => sum + sub.mrr, 0);

  const churnedMrr = subscriptions
    .filter(
      (sub) =>
        sub.cancelledAt &&
        sub.cancelledAt >= thirtyDaysAgo &&
        sub.cancelledAt <= periodEnd
    )
    .reduce((sum, sub) => sum + sub.mrr, 0);

  const activeCustomers = activeSubscriptions.length;

  const snapshot = await prisma.metricsSnapshot.create({
    data: {
      tenantId,
      periodEnd,
      mrr,
      newMrr,
      churnedMrr,
      activeCustomers,
      runwayMonths: null
    }
  });

  await logEvent({
    tenantId,
    type: 'METRICS_SNAPSHOT_CREATED',
    payload: {
      snapshotId: snapshot.id
    },
    primaryEntityId: snapshot.id
  });

  return snapshot;
}


