import type { IdeaExperiment } from '@prisma/client';
import { completeJSON } from '@/lib/llm';

export type ExperimentVerdict = {
  verdict: 'PASSED' | 'FAILED' | 'INCONCLUSIVE';
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  reasoning: string;
  nextSteps?: string[];
};

/**
 * L1 Agent: Experiment Interpreter
 * Analyzes experiment results and suggests verdicts.
 * Uses LLM for intelligent interpretation with keyword-based fallback.
 */
export async function runExperimentInterpreterAgent(
  experiment: IdeaExperiment,
  ideaTitle: string
): Promise<ExperimentVerdict> {
  // Try LLM-based interpretation first
  try {
    const llmVerdict = await interpretWithLLM(experiment, ideaTitle);
    if (llmVerdict) {
      return llmVerdict;
    }
  } catch (error) {
    console.warn('LLM interpretation failed, falling back to keyword-based logic:', error);
  }

  // Fallback to keyword-based logic
  // If result is already set, interpret it
  if (experiment.result && experiment.result !== 'PENDING') {
    return interpretExistingResult(experiment, ideaTitle);
  }

  // Otherwise, analyze the description for patterns
  return analyzeExperimentDescription(experiment, ideaTitle);
}

/**
 * Interpret experiment using LLM
 */
async function interpretWithLLM(
  experiment: IdeaExperiment,
  ideaTitle: string
): Promise<ExperimentVerdict | null> {
  const systemPrompt = `You are an expert product experiment reviewer. Your job is to analyze experiment results and provide clear, actionable verdicts.

You must respond with a JSON object matching this exact structure:
{
  "verdict": "PASSED" | "FAILED" | "INCONCLUSIVE",
  "confidence": "HIGH" | "MEDIUM" | "LOW",
  "reasoning": "1-3 sentences explaining your verdict, be specific about what signals led to this conclusion",
  "nextSteps": ["concrete action 1", "concrete action 2", ...]
}

Guidelines:
- PASSED: Clear positive signals that validate the idea (e.g., strong interest, measurable value, successful automation)
- FAILED: Clear negative signals that invalidate the idea (e.g., no interest, workflow doesn't work, automation fails)
- INCONCLUSIVE: Mixed signals, insufficient data, or unclear results
- HIGH confidence: Very clear signals (e.g., "15 people signed up" vs "some interest")
- MEDIUM confidence: Moderate signals that suggest a direction but need more validation
- LOW confidence: Unclear or insufficient information

For experiment types:
- SIGNAL tests: Look for genuine interest/pain signals (not just polite responses)
- WORKFLOW tests: Look for measurable value (time saved, errors reduced, quality improved)
- AGENT_OWNERSHIP tests: Look for successful automation (70%+ handled, <5% error rate, reliable quality)

Be specific in your reasoning. Reference actual metrics, quotes, or observations from the experiment description.`;

  const userPrompt = `Analyze this experiment and provide a verdict.

Idea: "${ideaTitle}"
Experiment Type: ${experiment.type}
Current Result: ${experiment.result || 'PENDING'}

Experiment Description:
"""
${experiment.description}
"""

Provide your analysis as JSON with verdict, confidence, reasoning, and nextSteps.`;

  try {
    const verdict = await completeJSON<ExperimentVerdict>(
      userPrompt,
      systemPrompt
    );

    // Validate the response structure
    if (
      verdict &&
      typeof verdict === 'object' &&
      ['PASSED', 'FAILED', 'INCONCLUSIVE'].includes(verdict.verdict) &&
      ['HIGH', 'MEDIUM', 'LOW'].includes(verdict.confidence) &&
      typeof verdict.reasoning === 'string'
    ) {
      return {
        verdict: verdict.verdict,
        confidence: verdict.confidence,
        reasoning: verdict.reasoning,
        nextSteps: Array.isArray(verdict.nextSteps) ? verdict.nextSteps : undefined,
      };
    }
  } catch (error) {
    // If LLM call fails or returns invalid structure, return null to trigger fallback
    console.warn('LLM interpretation returned invalid structure:', error);
    return null;
  }

  return null;
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

