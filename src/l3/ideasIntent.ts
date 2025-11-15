import { z } from 'zod';

const IdeaFiltersSchema = z.object({
  arpuFloor: z.number(),
  excludedDomains: z.array(z.string()),
  founderStrengths: z.array(z.string()),
  agentFitKeywords: z.array(z.string()),
  minScoreForExperiment: z.number()
});

export type IdeaFilters = z.infer<typeof IdeaFiltersSchema>;

const DEFAULT_IDEA_FILTERS: IdeaFilters = {
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

export async function getIdeaFilters(
  _tenantId: string
): Promise<IdeaFilters> {
  return DEFAULT_IDEA_FILTERS;
}


