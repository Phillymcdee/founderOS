import { z } from 'zod';
import { prisma } from '@/l0/db';

const IdeaFiltersSchema = z.object({
  arpuFloor: z.number(),
  excludedDomains: z.array(z.string()),
  founderStrengths: z.array(z.string()),
  agentFitKeywords: z.array(z.string()),
  minScoreForExperiment: z.number()
});

export type IdeaFilters = z.infer<typeof IdeaFiltersSchema>;

export const DEFAULT_IDEA_FILTERS: IdeaFilters = {
  arpuFloor: 50,
  excludedDomains: ['medical', 'securities', 'gambling'],
  founderStrengths: ['gtm', 'ops', 'partnerships'],
  agentFitKeywords: [
    'inbox',
    'email',
    'crm',
    'ticket',
    'document',
    'schedule',
    'summary'
  ],
  minScoreForExperiment: 9
};

export type IdeaFiltersResponse = {
  filters: IdeaFilters;
  version: string;
};

export async function getIdeaFilters(
  tenantId: string
): Promise<IdeaFiltersResponse> {
  const config = await prisma.ideaIntentConfig.findUnique({
    where: { tenantId }
  });

  if (!config) {
    return {
      filters: DEFAULT_IDEA_FILTERS,
      version: 'default'
    };
  }

  const filters: IdeaFilters = {
    arpuFloor: config.arpuFloor,
    excludedDomains: config.excludedDomains,
    founderStrengths: config.founderStrengths,
    agentFitKeywords: config.agentFitKeywords,
    minScoreForExperiment: config.minScoreForExperiment
  };

  return {
    filters,
    version: config.updatedAt.toISOString()
  };
}


