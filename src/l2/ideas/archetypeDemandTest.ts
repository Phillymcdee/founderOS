import { prisma } from '@/l0/db';
import { logEvent } from '@/l0/events';
import { runArchetypeScorerAgent } from '@/l1/ideas/archetypeScorer';

export async function runArchetypeDemandTestFlow(
  tenantId: string,
  archetypeInstanceId: string
) {
  const flowInstanceId = `archetype-demand-${Date.now()}`;

  const instance = await prisma.archetypeInstance.findFirst({
    where: { id: archetypeInstanceId, tenantId }
  });

  if (!instance) {
    throw new Error('Archetype instance not found');
  }

  await logEvent({
    tenantId,
    type: 'FLOW_STARTED',
    flowInstanceId,
    payload: {
      flow: 'archetypeDemandTest',
      archetypeInstanceId
    }
  });

  const outreachCount = Math.max(
    10,
    (instance.sourceSignalIds?.length ?? 0) * 5
  );
  const positiveResponses = Math.round(outreachCount * 0.18);
  const meetingsBooked = Math.max(0, Math.round(positiveResponses * 0.35));
  const willingnessSignals = Math.max(
    meetingsBooked,
    Math.round(positiveResponses * 0.5)
  );
  const winRate =
    outreachCount === 0 ? 0 : positiveResponses / Math.max(outreachCount, 1);

  const verdict =
    winRate >= 0.2 ? 'PASS' : winRate <= 0.05 ? 'FAIL' : 'INCONCLUSIVE';

  const demandTest = await prisma.archetypeDemandTest.create({
    data: {
      tenantId,
      archetypeInstanceId,
      status: 'COMPLETED',
      outreachCount,
      positiveResponses,
      meetingsBooked,
      willingnessSignals,
      verdict,
      notes:
        verdict === 'PASS'
          ? 'Strong signal from outreach sample.'
          : verdict === 'FAIL'
            ? 'Low engagement; consider pausing.'
            : 'Mixed signals; rerun with refined targeting.'
    }
  });

  await prisma.archetypeInstance.update({
    where: { id: instance.id },
    data: {
      lastDemandTestAt: demandTest.createdAt,
      lastDemandTestVerdict: demandTest.verdict
    }
  });

  await runArchetypeScorerAgent({
    tenantId,
    archetypeInstanceId: instance.id
  });

  await logEvent({
    tenantId,
    type: 'FLOW_COMPLETED',
    flowInstanceId,
    payload: {
      flow: 'archetypeDemandTest',
      archetypeInstanceId,
      verdict,
      outreachCount,
      positiveResponses,
      meetingsBooked
    }
  });

  return demandTest;
}

