import { Prisma } from '@prisma/client';
import { prisma } from '@/l0/db';
import {
  DEFAULT_ARCHETYPE_FRAMEWORK,
  type ArchetypeIcp,
  type ArchetypeFramework,
  type ArchetypePattern
} from '@/l3/archetypeFramework';

export type ArchetypeScorerInput = {
  tenantId: string;
  archetypeInstanceId: string;
  framework?: ArchetypeFramework;
};

export type ArchetypeScorerOutput = {
  monetizationScore: number;
  dataSurfaceScore: number;
  agentLeverageScore: number;
  reachabilityScore: number;
  osFitScore: number;
  totalScore: number;
  explanation: Record<string, string>;
};

const DEFAULT_AXIS = {
  monetization: 1,
  dataSurface: 1,
  agentLeverage: 1,
  reachability: 1,
  osFit: 1
};

export async function runArchetypeScorerAgent({
  tenantId,
  archetypeInstanceId,
  framework = DEFAULT_ARCHETYPE_FRAMEWORK
}: ArchetypeScorerInput): Promise<ArchetypeScorerOutput | null> {
  const instance = await prisma.archetypeInstance.findFirst({
    where: { id: archetypeInstanceId, tenantId }
  });

  if (!instance) {
    return null;
  }

  const pattern = framework.patterns.find(
    (candidate) => candidate.key === instance.patternKey
  );

  if (!pattern) {
    return null;
  }

  const icp =
    pattern.icpOptions.find((option) => option.key === instance.icpKey) ??
    pattern.icpOptions[0];

  const heuristics = icp?.heuristics ?? DEFAULT_AXIS;

  const explanation: Record<string, string> = {
    monetization: `Based on ${icp?.label ?? 'default ICP'} willingness to pay.`,
    dataSurface: `Requires ${pattern.dataSurfaces.join(', ')} which ${
      instance.dataSurfaces.length ? 'were referenced' : 'still need validation'
    }.`,
    agentLeverage: `Workflow described as ${
      instance.summary ?? 'agent-native'
    } giving leverage.`,
    reachability: 'Derived from ICP specificity and known channels.',
    osFit: 'Pattern leverages existing Inbox Spend / Ops flows.'
  };

  const scores = {
    monetizationScore: heuristics.monetization,
    dataSurfaceScore: heuristics.dataSurface,
    agentLeverageScore: heuristics.agentLeverage,
    reachabilityScore: heuristics.reachability,
    osFitScore: heuristics.osFit
  };

  const totalScore =
    scores.monetizationScore +
    scores.dataSurfaceScore +
    scores.agentLeverageScore +
    scores.reachabilityScore +
    scores.osFitScore;

  const scoreRecord = await prisma.archetypeScore.create({
    data: {
      tenantId,
      archetypeInstanceId: instance.id,
      monetizationScore: scores.monetizationScore,
      dataSurfaceScore: scores.dataSurfaceScore,
      agentLeverageScore: scores.agentLeverageScore,
      reachabilityScore: scores.reachabilityScore,
      osFitScore: scores.osFitScore,
      totalScore,
      explanation: explanation as Prisma.InputJsonValue
    }
  });

  await prisma.archetypeInstance.update({
    where: { id: instance.id },
    data: {
      monetizationScore: scoreRecord.monetizationScore,
      dataSurfaceScore: scoreRecord.dataSurfaceScore,
      agentLeverageScore: scoreRecord.agentLeverageScore,
      reachabilityScore: scoreRecord.reachabilityScore,
      osFitScore: scoreRecord.osFitScore,
      totalScore: scoreRecord.totalScore,
      scoreUpdatedAt: new Date()
    }
  });

  return {
    ...scores,
    totalScore,
    explanation
  };
}

