import { prisma } from '@/l0/db';
import { logEvent } from '@/l0/events';
import { getIdeaFilters } from '@/l3/ideasIntent';
import { runExperimentDesignerAgent } from '@/l1/ideas/experimentDesigner';
import { runExperimentInterpreterAgent } from '@/l1/ideas/experimentInterpreter';

/**
 * L2 Flow: Experiment Loop
 * Orchestrates the experiment lifecycle for top-scoring ideas.
 *
 * Trigger: IDEA_EXPERIMENT_REVIEW_DUE or manual
 * Steps:
 * 1. Select top ideas that need experiments (EXPERIMENTING state, no experiments or pending experiments)
 * 2. For each idea, design experiments if none exist
 * 3. Interpret any completed experiments
 * 4. Update idea state based on experiment results
 */
export async function runExperimentLoopFlow(tenantId: string) {
  const flowInstanceId = `experiment-loop-${Date.now()}`;
  const filtersResponse = await getIdeaFilters(tenantId);

  await logEvent({
    tenantId,
    type: 'FLOW_STARTED',
    flowInstanceId,
    payload: {
      flow: 'experimentLoop',
      ideaIntentVersion: filtersResponse.version
    }
  });

  // Find ideas in EXPERIMENTING state that need attention
  const ideasNeedingExperiments = await prisma.idea.findMany({
    where: {
      tenantId,
      state: 'EXPERIMENTING'
    },
    include: {
      experiments: true
    }
  });

  const results = [];

  for (const idea of ideasNeedingExperiments) {
    // Step 1: Design experiments if none exist
    if (idea.experiments.length === 0) {
      const designs = runExperimentDesignerAgent(idea);

      for (const design of designs) {
        const experiment = await prisma.ideaExperiment.create({
          data: {
            tenantId,
            ideaId: idea.id,
            type: design.type,
            description: design.description,
            result: 'PENDING'
          }
        });

        await logEvent({
          tenantId,
          type: 'IDEA_EXPERIMENT_DESIGNED',
          primaryEntityId: idea.id,
          payload: {
            experimentId: experiment.id,
            type: design.type
          }
        });

        results.push({
          ideaId: idea.id,
          action: 'designed_experiment',
          experimentId: experiment.id
        });
      }
    }

    // Step 2: Interpret completed experiments
    const pendingExperiments = idea.experiments.filter(
      (exp) => exp.result === 'PENDING'
    );

    const completedExperiments = idea.experiments.filter(
      (exp) => exp.result && exp.result !== 'PENDING'
    );

    // If there are completed experiments, interpret them
    if (completedExperiments.length > 0) {
      let allPassed = true;
      let anyFailed = false;
      let highestConfidence = 'LOW' as 'HIGH' | 'MEDIUM' | 'LOW';

      for (const experiment of completedExperiments) {
        const interpretation = runExperimentInterpreterAgent(
          experiment,
          idea.title
        );

        // Track highest confidence level
        if (
          interpretation.confidence === 'HIGH' ||
          (interpretation.confidence === 'MEDIUM' &&
            highestConfidence === 'LOW')
        ) {
          highestConfidence = interpretation.confidence;
        }

        // Update experiment with interpretation if it differs
        if (
          interpretation.verdict !== experiment.result &&
          interpretation.confidence === 'HIGH'
        ) {
          await prisma.ideaExperiment.update({
            where: { id: experiment.id },
            data: { result: interpretation.verdict }
          });
        }

        if (interpretation.verdict === 'FAILED') {
          anyFailed = true;
        }
        if (interpretation.verdict !== 'PASSED') {
          allPassed = false;
        }
      }

      // Step 3: Update idea state based on results
      let newState = idea.state;

      if (anyFailed && highestConfidence === 'HIGH') {
        newState = 'KILLED';
      } else if (
        allPassed &&
        completedExperiments.length >= 2 &&
        completedExperiments.some((e) => e.type === 'AGENT_OWNERSHIP')
      ) {
        // If all experiments passed and we have agent ownership test, validate
        newState = 'VALIDATED';
      }

      if (newState !== idea.state) {
        await prisma.idea.update({
          where: { id: idea.id },
          data: { state: newState }
        });

        await logEvent({
          tenantId,
          type: 'IDEA_STATE_CHANGED',
          primaryEntityId: idea.id,
          payload: {
            state: newState,
            reason: 'experiment_results',
            experimentCount: completedExperiments.length
          }
        });

        results.push({
          ideaId: idea.id,
          action: 'state_updated',
          newState
        });
      }
    }
  }

  await logEvent({
    tenantId,
    type: 'FLOW_COMPLETED',
    flowInstanceId,
    payload: {
      flow: 'experimentLoop',
      results,
      ideaIntentVersion: filtersResponse.version
    }
  });

  return results;
}

