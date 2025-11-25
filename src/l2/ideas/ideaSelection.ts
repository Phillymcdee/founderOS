import { prisma } from '@/l0/db';
import { logEvent } from '@/l0/events';
import { getIdeaFilters, type IdeaFiltersResponse } from '@/l3/ideasIntent';
import {
  draftTransformationStatement,
  runHardFilters,
  scoreIdea
} from '@/l1/ideas/ideaScoring';

export async function evaluateIdea(
  tenantId: string,
  ideaId: string,
  filtersInput?: IdeaFiltersResponse
) {
  const idea = await prisma.idea.findFirst({
    where: { id: ideaId, tenantId }
  });
  if (!idea) throw new Error('Idea not found');

  const { filters, version: filtersVersion } =
    filtersInput ?? (await getIdeaFilters(tenantId));

  const transformation =
    idea.transformation ?? draftTransformationStatement(idea);

  const hardFilters = runHardFilters(idea, filters);

  let state = 'BACKLOG';
  let scores = {
    painFrequencyScore: idea.painFrequencyScore ?? 1,
    agentLeverageScore: idea.agentLeverageScore ?? 1,
    dataSurfaceScore: idea.dataSurfaceScore ?? 1,
    repeatabilityScore: idea.repeatabilityScore ?? 1,
    totalScore: idea.totalScore ?? 4
  };

  const passesAll = Object.values(hardFilters).every(Boolean);
  if (passesAll) {
    scores = scoreIdea(idea, filters);
    const meetsScoreThreshold = scores.totalScore >= filters.minScoreForExperiment;

    if (meetsScoreThreshold) {
      // Enforce a cap on how many ideas can be in EXPERIMENTING at once, if configured.
      if (filters.maxExperimentingIdeas != null) {
        const currentlyExperimentingCount = await prisma.idea.count({
          where: {
            tenantId,
            state: 'EXPERIMENTING'
          }
        });

        state =
          currentlyExperimentingCount < filters.maxExperimentingIdeas
            ? 'EXPERIMENTING'
            : 'SCORING';
      } else {
        state = 'EXPERIMENTING';
      }
    } else {
      state = 'SCORING';
    }
  } else {
    state = 'KILLED';
  }

  const updated = await prisma.idea.update({
    where: { id: ideaId },
    data: {
      transformation,
      ...hardFilters,
      ...scores,
      state
    }
  });

  await logEvent({
    tenantId,
    type: 'IDEA_SCORED',
    primaryEntityId: ideaId,
    payload: {
      hardFilters,
      scores,
      state,
      ideaIntentVersion: filtersVersion
    }
  });

  return updated;
}

export async function updateIdeaState(
  tenantId: string,
  ideaId: string,
  state: string
) {
  const updated = await prisma.idea.update({
    where: { id: ideaId, tenantId },
    data: { state }
  });

  await logEvent({
    tenantId,
    type: 'IDEA_STATE_CHANGED',
    primaryEntityId: ideaId,
    payload: { state }
  });

  return updated;
}

export async function logIdeaExperiment(params: {
  tenantId: string;
  ideaId: string;
  type: 'SIGNAL' | 'WORKFLOW' | 'AGENT_OWNERSHIP';
  description: string;
  result?: 'PENDING' | 'PASSED' | 'FAILED' | 'INCONCLUSIVE';
}) {
  const experiment = await prisma.ideaExperiment.create({
    data: {
      tenantId: params.tenantId,
      ideaId: params.ideaId,
      type: params.type,
      description: params.description,
      result: params.result ?? 'PENDING'
    }
  });

  await logEvent({
    tenantId: params.tenantId,
    type: 'IDEA_EXPERIMENT_LOGGED',
    primaryEntityId: params.ideaId,
    payload: {
      experimentId: experiment.id,
      type: params.type,
      result: experiment.result
    }
  });

  return experiment;
}

export async function runIdeasRefreshFlow(tenantId: string) {
  const flowInstanceId = `ideas-refresh-${Date.now()}`;
  const filtersResponse = await getIdeaFilters(tenantId);

  await logEvent({
    tenantId,
    type: 'FLOW_STARTED',
    flowInstanceId,
    payload: {
      flow: 'ideasRefreshFlow',
      ideaIntentVersion: filtersResponse.version
    }
  });

  const ideas = await prisma.idea.findMany({
    where: { tenantId }
  });

  const results = [];

  for (const idea of ideas) {
    const updated = await evaluateIdea(tenantId, idea.id, filtersResponse);
    results.push({ ideaId: idea.id, state: updated.state });
  }

  await logEvent({
    tenantId,
    type: 'FLOW_COMPLETED',
    flowInstanceId,
    payload: {
      flow: 'ideasRefreshFlow',
      results,
      ideaIntentVersion: filtersResponse.version
    }
  });

  return results;
}


