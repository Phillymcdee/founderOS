import { z } from 'zod';

const ArchetypeScoreHeuristicsSchema = z.object({
  monetization: z.number().int().min(1).max(3),
  dataSurface: z.number().int().min(1).max(3),
  agentLeverage: z.number().int().min(1).max(3),
  reachability: z.number().int().min(1).max(3),
  osFit: z.number().int().min(1).max(3)
});

const ArchetypeIcpSchema = z.object({
  key: z.string(),
  label: z.string(),
  icpDescription: z.string(),
  heuristics: ArchetypeScoreHeuristicsSchema
});

const ArchetypePatternSchema = z.object({
  key: z.string(),
  label: z.string(),
  description: z.string(),
  transformationTemplate: z.string(),
  dataSurfaces: z.array(z.string()),
  icpOptions: z.array(ArchetypeIcpSchema)
});

const ArchetypeFrameworkSchema = z.object({
  patterns: z.array(ArchetypePatternSchema)
});

export type ArchetypeScoreHeuristics = z.infer<typeof ArchetypeScoreHeuristicsSchema>;
export type ArchetypeIcp = z.infer<typeof ArchetypeIcpSchema>;
export type ArchetypePattern = z.infer<typeof ArchetypePatternSchema>;
export type ArchetypeFramework = z.infer<typeof ArchetypeFrameworkSchema>;

export type ArchetypeFrameworkResponse = {
  framework: ArchetypeFramework;
  version: string;
};

export const DEFAULT_ARCHETYPE_FRAMEWORK: ArchetypeFramework = {
  patterns: [
    {
      key: 'cashflow_guardian',
      label: 'Cashflow Guardian',
      description:
        'Connect to Stripe/bank/inbox to surface weekly spend, renewals, and pricing moves.',
      transformationTemplate:
        'We connect to {dataSurfaces}, monitor every transaction for {icp}, and deliver a weekly cashflow decision pack that protects runway and finds savings.',
      dataSurfaces: ['stripe', 'bank', 'gmail', 'accounting'],
      icpOptions: [
        {
          key: 'solo_saas',
          label: 'Solo / 2-person SaaS',
          icpDescription: 'Bootstrapped SaaS founders doing $10k–$50k MRR.',
          heuristics: {
            monetization: 3,
            dataSurface: 3,
            agentLeverage: 3,
            reachability: 2,
            osFit: 3
          }
        },
        {
          key: 'agencies',
          label: 'Lean Agencies',
          icpDescription: 'Productized service & agency operators <20 headcount.',
          heuristics: {
            monetization: 2,
            dataSurface: 2,
            agentLeverage: 3,
            reachability: 2,
            osFit: 3
          }
        },
        {
          key: 'creators',
          label: 'High-ticket creators / course builders',
          icpDescription: 'Creators with recurring course/cohort revenue that need FP&A help.',
          heuristics: {
            monetization: 2,
            dataSurface: 2,
            agentLeverage: 2,
            reachability: 2,
            osFit: 2
          }
        }
      ]
    },
    {
      key: 'revops_signal_watch',
      label: 'RevOps Signal Watch',
      description:
        'Tap CRM + inbox to keep pipeline healthy, flag risks, and draft follow-ups.',
      transformationTemplate:
        'We watch {dataSurfaces} for {icp} and deliver a weekly revenue actions brief that keeps the pipeline clean and moving.',
      dataSurfaces: ['hubspot', 'salesforce', 'gmail'],
      icpOptions: [
        {
          key: 'seed_ae_teams',
          label: 'Seed/Series A AE teams',
          icpDescription: 'B2B SaaS teams with <10 AEs and no RevOps headcount.',
          heuristics: {
            monetization: 3,
            dataSurface: 2,
            agentLeverage: 2,
            reachability: 2,
            osFit: 3
          }
        },
        {
          key: 'cs_ops',
          label: 'Customer success / CS Ops',
          icpDescription: 'Post-sales orgs that need ticket / renewal intelligence.',
          heuristics: {
            monetization: 2,
            dataSurface: 2,
            agentLeverage: 2,
            reachability: 2,
            osFit: 2
          }
        }
      ]
    },
    {
      key: 'ops_control_panel',
      label: 'Ops Control Panel',
      description:
        'Aggregate Notion/Sheets/Project tools into a weekly decision cockpit for operators.',
      transformationTemplate:
        'We connect to {dataSurfaces} and compile a founder/ops control panel that highlights blockers and next bets for {icp}.',
      dataSurfaces: ['notion', 'linear', 'slack'],
      icpOptions: [
        {
          key: 'agency_leads',
          label: 'Agency leads',
          icpDescription: 'Agencies juggling retainers and delivery teams in Notion/Sheets.',
          heuristics: {
            monetization: 2,
            dataSurface: 2,
            agentLeverage: 2,
            reachability: 2,
            osFit: 2
          }
        },
        {
          key: 'ops_heads',
          label: 'Ops leaders',
          icpDescription: 'Fractional COOs that manage multiple clients.',
          heuristics: {
            monetization: 3,
            dataSurface: 1,
            agentLeverage: 2,
            reachability: 1,
            osFit: 2
          }
        }
      ]
    }
  ]
};

export async function getArchetypeFramework(): Promise<ArchetypeFrameworkResponse> {
  // In the future this can read from tenant-specific config in the database.
  return {
    framework: DEFAULT_ARCHETYPE_FRAMEWORK,
    version: 'default'
  };
}

