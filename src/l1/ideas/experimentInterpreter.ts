import type { IdeaExperiment } from '@prisma/client';

export type ExperimentVerdict = {
  verdict: 'PASSED' | 'FAILED' | 'INCONCLUSIVE';
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  reasoning: string;
  nextSteps?: string[];
};

/**
 * L1 Agent: Experiment Interpreter
 * Analyzes experiment results and suggests verdicts.
 * Uses rule-based logic that can be enhanced with LLM later.
 */
export function runExperimentInterpreterAgent(
  experiment: IdeaExperiment,
  ideaTitle: string
): ExperimentVerdict {
  // If result is already set, interpret it
  if (experiment.result && experiment.result !== 'PENDING') {
    return interpretExistingResult(experiment, ideaTitle);
  }

  // Otherwise, analyze the description for patterns
  return analyzeExperimentDescription(experiment, ideaTitle);
}

function interpretExistingResult(
  experiment: IdeaExperiment,
  ideaTitle: string
): ExperimentVerdict {
  const description = experiment.description.toLowerCase();
  const result = experiment.result!;

  if (result === 'PASSED') {
    // Check for strong positive signals
    const hasStrongSignals =
      description.includes('strong') ||
      description.includes('exceeded') ||
      description.includes('multiple') ||
      description.includes('high response');

    return {
      verdict: 'PASSED',
      confidence: hasStrongSignals ? 'HIGH' : 'MEDIUM',
      reasoning: `Experiment passed. ${hasStrongSignals ? 'Strong positive signals observed.' : 'Positive results, but consider running additional tests.'}`,
      nextSteps: hasStrongSignals
        ? ['Move to next experiment type', 'Consider moving idea to VALIDATED state']
        : ['Run additional validation', 'Gather more data points']
    };
  }

  if (result === 'FAILED') {
    const hasClearFailure =
      description.includes('no response') ||
      description.includes('low interest') ||
      description.includes('not a fit') ||
      description.includes('rejected');

    return {
      verdict: 'FAILED',
      confidence: hasClearFailure ? 'HIGH' : 'MEDIUM',
      reasoning: `Experiment failed. ${hasClearFailure ? 'Clear negative signals.' : 'Results suggest idea may not be viable.'}`,
      nextSteps: [
        'Consider pivoting the idea',
        'Or move idea to KILLED state',
        'Document learnings for future ideas'
      ]
    };
  }

  // INCONCLUSIVE
  return {
    verdict: 'INCONCLUSIVE',
    confidence: 'MEDIUM',
    reasoning: 'Results are unclear. Need more data or a different test approach.',
    nextSteps: [
      'Run experiment again with clearer success criteria',
      'Try a different experiment type',
      'Gather more qualitative feedback'
    ]
  };
}

function analyzeExperimentDescription(
  experiment: IdeaExperiment,
  ideaTitle: string
): ExperimentVerdict {
  const description = experiment.description.toLowerCase();

  // Signal test patterns
  if (experiment.type === 'SIGNAL') {
    const hasPositiveSignals =
      description.includes('response') ||
      description.includes('interest') ||
      description.includes('signup') ||
      description.includes('inquiry');

    const hasNegativeSignals =
      description.includes('no response') ||
      description.includes('low') ||
      description.includes('rejected') ||
      description.includes('not interested');

    if (hasPositiveSignals && !hasNegativeSignals) {
      return {
        verdict: 'PASSED',
        confidence: 'MEDIUM',
        reasoning: 'Positive signals detected. Consider running workflow test next.',
        nextSteps: ['Proceed to WORKFLOW test', 'Document specific pain points mentioned']
      };
    }

    if (hasNegativeSignals) {
      return {
        verdict: 'FAILED',
        confidence: 'MEDIUM',
        reasoning: 'Negative signals detected. Idea may not resonate with target ICP.',
        nextSteps: ['Consider pivoting', 'Or test with different ICP segment']
      };
    }
  }

  // Workflow test patterns
  if (experiment.type === 'WORKFLOW') {
    const hasValue =
      description.includes('saved') ||
      description.includes('reduced') ||
      description.includes('improved') ||
      description.includes('valuable') ||
      description.includes('works');

    const hasIssues =
      description.includes('difficult') ||
      description.includes('too complex') ||
      description.includes('not worth') ||
      description.includes('manual');

    if (hasValue && !hasIssues) {
      return {
        verdict: 'PASSED',
        confidence: 'HIGH',
        reasoning: 'Workflow delivers measurable value. Ready for agent automation test.',
        nextSteps: ['Proceed to AGENT_OWNERSHIP test', 'Document workflow steps']
      };
    }

    if (hasIssues) {
      return {
        verdict: 'FAILED',
        confidence: 'MEDIUM',
        reasoning: 'Workflow has issues that prevent value delivery.',
        nextSteps: ['Simplify workflow', 'Or pivot idea']
      };
    }
  }

  // Agent ownership test patterns
  if (experiment.type === 'AGENT_OWNERSHIP') {
    const hasAutomationSuccess =
      description.includes('automated') ||
      description.includes('70%') ||
      description.includes('error rate') ||
      description.includes('quality') ||
      description.includes('accurate');

    const hasAutomationIssues =
      description.includes('too many errors') ||
      description.includes('low quality') ||
      description.includes('not reliable') ||
      description.includes('manual');

    if (hasAutomationSuccess && !hasAutomationIssues) {
      return {
        verdict: 'PASSED',
        confidence: 'HIGH',
        reasoning: 'Agent automation successful. Idea is validated and ready to build.',
        nextSteps: ['Move idea to VALIDATED state', 'Begin product development']
      };
    }

    if (hasAutomationIssues) {
      return {
        verdict: 'INCONCLUSIVE',
        confidence: 'MEDIUM',
        reasoning: 'Automation has quality issues. May need refinement or different approach.',
        nextSteps: ['Refine automation approach', 'Consider hybrid human-agent workflow']
      };
    }
  }

  // Default: inconclusive
  return {
    verdict: 'INCONCLUSIVE',
    confidence: 'LOW',
    reasoning: 'Unable to determine verdict from description. Need more specific results.',
    nextSteps: ['Update experiment with specific metrics', 'Run additional tests']
  };
}

