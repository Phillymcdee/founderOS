import { Idea } from '@prisma/client';
import { IdeaFilters } from '@/l3/ideasIntent';

export type HardFilterResult = {
  passesMarket: boolean;
  passesRegulation: boolean;
  passesAgentFit: boolean;
  passesFounderFit: boolean;
};

export type IdeaScores = {
  painFrequencyScore: number;
  agentLeverageScore: number;
  dataSurfaceScore: number;
  repeatabilityScore: number;
  totalScore: number;
};

export function draftTransformationStatement(idea: Idea) {
  const inputs = idea.icpDescription
    ? `${idea.icpDescription} operations`
    : 'customer workflows';
  const capabilities = idea.title.toLowerCase().includes('agent')
    ? 'specialized agents'
    : 'agents that parse emails, docs, and events';
  const outcomes = idea.description.split('.')[0] ?? idea.title;

  return `We take ${inputs}, apply ${capabilities}, and deliver ${outcomes} for the target buyer.`;
}

export function runHardFilters(
  idea: Idea,
  filters: IdeaFilters
): HardFilterResult {
  const arpu = idea.arpuEstimate ?? 0;
  const description = `${idea.title} ${idea.description}`.toLowerCase();

  const excludedHit = filters.excludedDomains.some((domain) =>
    description.includes(domain)
  );

  return {
    passesMarket: arpu >= filters.arpuFloor,
    passesRegulation: !idea.regulatedConcern && !excludedHit,
    passesAgentFit: !idea.manualWorkHeavy,
    passesFounderFit: idea.founderFitSignal
  };
}

export function scoreIdea(
  idea: Idea,
  filters: IdeaFilters
): IdeaScores {
  const description = `${idea.title} ${idea.description}`.toLowerCase();

  const painFrequencyScore = computeScore(description, [
    'recurring',
    'weekly',
    'daily',
    'pain',
    'always'
  ]);

  const agentLeverageScore = Math.min(
    3,
    filters.agentFitKeywords.filter((keyword) =>
      description.includes(keyword)
    ).length
  );

  const dataSurfaceScore = computeScore(description, [
    'email',
    'inbox',
    'crm',
    'ticket',
    'doc'
  ]);

  const repeatabilityScore = computeScore(description, [
    'workflow',
    'process',
    'monitor',
    'review'
  ]);

  const totalScore =
    painFrequencyScore +
    agentLeverageScore +
    dataSurfaceScore +
    repeatabilityScore;

  return {
    painFrequencyScore,
    agentLeverageScore,
    dataSurfaceScore,
    repeatabilityScore,
    totalScore
  };
}

function computeScore(description: string, keywords: string[]) {
  const hits = keywords.filter((keyword) =>
    description.includes(keyword)
  ).length;
  if (hits >= 3) return 3;
  if (hits >= 1) return 2;
  return 1;
}


