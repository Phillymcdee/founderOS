import type { Idea } from '@prisma/client';

export type ExperimentDesign = {
  type: 'SIGNAL' | 'WORKFLOW' | 'AGENT_OWNERSHIP';
  description: string;
  suggestedSteps?: string[];
};

/**
 * L1 Agent: Experiment Designer
 * Generates cheap test designs for ideas based on the idea's characteristics.
 * Uses rule-based templates that can be enhanced with LLM later.
 */
export function runExperimentDesignerAgent(idea: Idea): ExperimentDesign[] {
  const designs: ExperimentDesign[] = [];

  // Always start with a Signal Test (cheapest, fastest)
  designs.push({
    type: 'SIGNAL',
    description: `Create a simple landing page or LinkedIn post describing "${idea.title}" and measure response rate. Target: ${idea.icpDescription ?? 'target ICP'}. Look for "that's me" responses, not just polite interest.`,
    suggestedSteps: [
      'Draft a 2-3 sentence value proposition',
      'Post on LinkedIn or create a simple landing page',
      'Track responses over 1-2 weeks',
      'Measure: % of responses that show genuine pain vs polite interest'
    ]
  });

  // If idea has strong agent-fit signals, suggest Workflow Test
  const hasAgentFitKeywords =
    idea.description.toLowerCase().includes('agent') ||
    idea.description.toLowerCase().includes('automate') ||
    idea.description.toLowerCase().includes('monitor') ||
    idea.description.toLowerCase().includes('parse');

  if (hasAgentFitKeywords || (idea.agentLeverageScore ?? 0) >= 2) {
    designs.push({
      type: 'WORKFLOW',
      description: `Manually or semi-automate the core workflow for 5-10 real users. Confirm the end-to-end transformation "${idea.description}" delivers measurable value.`,
      suggestedSteps: [
        'Identify 5-10 target users matching ICP',
        'Manually execute the core workflow for each',
        'Measure time saved, errors reduced, or value created',
        'Collect feedback on what worked vs what didn\'t',
        'Estimate: Can this scale with agents handling 70%+ of the work?'
      ]
    });
  }

  // If idea scores high on agent leverage, suggest Agent Ownership Test
  if ((idea.agentLeverageScore ?? 0) >= 2 && (idea.totalScore ?? 0) >= 9) {
    designs.push({
      type: 'AGENT_OWNERSHIP',
      description: `Gradually move steps from human → agent. Start with 1-2 steps, measure quality and error rates. Aim for ~70% of recurring work handled by agents with acceptable quality.`,
      suggestedSteps: [
        'Identify the 3-5 core steps in the workflow',
        'Start with automating 1-2 simplest steps',
        'Measure: accuracy, time saved, error rate',
        'Gradually expand agent ownership',
        'Target: 70%+ of recurring work automated with <5% error rate'
      ]
    });
  }

  return designs;
}

