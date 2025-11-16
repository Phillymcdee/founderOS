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

export type FeedlySourceConfig = {
  id: string;
  label: string;
  streamId?: string;
  query?: string;
  maxEntries?: number;
  note?: string;
};

export type ApifySourceConfig = {
  id: string;
  label: string;
  actorId: string;
  input?: Record<string, unknown>;
  summaryField?: string;
  maxItems?: number;
};

export type IdeaSourceConfig = {
  feedlySources: FeedlySourceConfig[];
  apifySources: ApifySourceConfig[];
};

export const DEFAULT_IDEA_SOURCES: IdeaSourceConfig = {
  // Feedly sources disabled until enterprise API access is available
  feedlySources: [],

  apifySources: [
    //
    // 1) RevOps & Sales Ops hiring demand (validates RevOps Signal Watch)
    //
    {
      id: 'apify-revops-jobs',
      label: 'RevOps & Sales Ops Jobs',
      actorId: 'harvestapi/linkedin-job-search',
      input: {
        jobTitles: [
          'Revenue Operations Manager',
          'RevOps Analyst',
          'Sales Operations Analyst'
        ],
        locations: ['United States', 'United Kingdom', 'Remote'],
        maxItems: 120,
        sortBy: 'date'
      },
      summaryField: 'title',
      maxItems: 40
    },

    //
    // 2) Customer Support / CS Ops hiring (validates Support Intelligence Compressor)
    //
    {
      id: 'apify-support-ops-jobs',
      label: 'Support & CS Ops Jobs',
      actorId: 'harvestapi/linkedin-job-search',
      input: {
        jobTitles: [
          'Customer Support Operations Manager',
          'Customer Success Operations Manager',
          'Head of Support Operations'
        ],
        locations: ['United States', 'United Kingdom', 'Remote'],
        maxItems: 120,
        sortBy: 'date'
      },
      summaryField: 'title',
      maxItems: 40
    },

    //
    // 3) Finance / MRR explanation roles (validates AI Finance Briefing Partner)
    //
    {
      id: 'apify-finance-ops-jobs',
      label: 'SaaS FP&A & Finance Ops Jobs',
      actorId: 'harvestapi/linkedin-job-search',
      input: {
        jobTitles: [
          'FP&A Analyst',
          'Finance Operations Analyst',
          'Revenue Analyst'
        ],
        locations: ['United States', 'United Kingdom', 'Remote'],
        maxItems: 120,
        sortBy: 'date'
      },
      summaryField: 'title',
      maxItems: 40
    },

    //
    // 4) Support ticket / CS complaints (validates Support Intelligence Compressor)
    //
    {
      id: 'apify-reddit-support-pain',
      label: 'Support & CS Ticket Complaints',
      actorId: 'fatihtahta/reddit-scraper-search-fast',
      input: {
        queries: [
          'SaaS "support tickets" backlog',
          '"zendesk" "too many tickets"',
          '"intercom" feature requests',
          '"customer success" NPS CSAT'
        ],
        sort: 'top',
        timeframe: 'month',
        maxPosts: 80,
        scrapeComments: false,
        includeNsfw: false
      },
      summaryField: 'title',
      maxItems: 30
    },

    //
    // 5) Agency client reporting pain (validates Client Growth Copilot / Delivery QA)
    //
    {
      id: 'apify-reddit-agency-reporting',
      label: 'Agency Client Reporting & QA Pain',
      actorId: 'fatihtahta/reddit-scraper-search-fast',
      input: {
        queries: [
          '"client reporting" agency weekly status',
          '"status report" SaaS agency',
          '"reporting dashboard" for clients',
          '"retain(er)" marketing agency reporting'
        ],
        sort: 'top',
        timeframe: 'year',
        maxPosts: 80,
        scrapeComments: false,
        includeNsfw: false
      },
      summaryField: 'title',
      maxItems: 30
    },

    //
    // 6) G2 reviews for ops / RevOps / support tools (validates all ops ideas)
    //
    {
      id: 'apify-g2-ops-reviews',
      label: 'G2 Reviews – Ops & RevOps Tools',
      actorId: 'jupri/g2-explorer',
      input: {
        query:
          'Revenue Operations OR Sales Analytics OR Customer Success Platforms OR Help Desk OR Support Ticketing',
        mode: 'review',
        limit: 50
      },
      maxItems: 50
    }
  ]
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

export type IdeaIntentResponse = IdeaFiltersResponse & {
  sources: IdeaSourceConfig;
};

export async function getIdeaIntent(
  tenantId: string
): Promise<IdeaIntentResponse> {
  const filtersResponse = await getIdeaFilters(tenantId);

  return {
    ...filtersResponse,
    sources: DEFAULT_IDEA_SOURCES
  };
}

