import type { IdeaSignal } from '@prisma/client';
import type { IdeaFilters } from '@/l3/ideasIntent';

export type IdeaCandidate = {
  title: string;
  description: string;
  icpDescription?: string;
  arpuEstimate?: number;
  sourceSignalIds: string[];
};

type CategoryTemplate = {
  id: string;
  keywords: string[];
  build: (signals: IdeaSignal[], filters: IdeaFilters) => IdeaCandidate;
};

const CATEGORY_TEMPLATES: CategoryTemplate[] = [
  {
    id: 'inbox-spend',
    keywords: ['invoice', 'vendor', 'renewal', 'spend', 'auto-renew'],
    build: (signals, filters) => ({
      title: 'Inbox Spend Guardian Autopilot',
      description:
        'Agents monitor inboxes for invoices, flag risky renewals, and push curated savings actions with evidence.',
      icpDescription:
        'Agencies and finance leads juggling 20+ SaaS vendors via Gmail/Outlook.',
      arpuEstimate: Math.max(filters.arpuFloor, 150),
      sourceSignalIds: signals.map((s) => s.id)
    })
  },
  {
    id: 'mrr-briefing',
    keywords: ['mrr', 'stripe', 'cfo', 'quickbooks', 'forecast'],
    build: (signals, filters) => ({
      title: 'AI Finance Briefing Partner',
      description:
        'Pulls Stripe + billing data, drafts weekly CFO-ready narratives, and highlights churn / expansion anomalies.',
      icpDescription: 'Fractional CFOs and founders < $5M ARR.',
      arpuEstimate: Math.max(filters.arpuFloor, 120),
      sourceSignalIds: signals.map((s) => s.id)
    })
  },
  {
    id: 'revops-guardian',
    keywords: ['crm', 'pipeline', 'revops', 'salesforce', 'hubspot'],
    build: (signals, filters) => ({
      title: 'RevOps Signal Watch',
      description:
        'Agents watch CRM hygiene, pipeline risk, and ops alerts, then recommend playbooks for AEs/CSMs.',
      icpDescription: 'Seed/Series A B2B teams with lean RevOps.',
      arpuEstimate: Math.max(filters.arpuFloor, 100),
      sourceSignalIds: signals.map((s) => s.id)
    })
  },
  {
    id: 'support-compressor',
    keywords: ['support', 'tickets', 'feedback', 'feature request'],
    build: (signals, filters) => ({
      title: 'Support Intelligence Compressor',
      description:
        'Summarizes support tickets, groups themes, and powers weekly product/CS actions.',
      icpDescription: 'B2B teams with >200 monthly tickets.',
      arpuEstimate: filters.arpuFloor,
      sourceSignalIds: signals.map((s) => s.id)
    })
  },
  {
    id: 'partner-copilot',
    keywords: ['partner', 'upsell', 'client account'],
    build: (signals, filters) => ({
      title: 'Client Growth Copilot',
      description:
        'Monitors client accounts for renewals, usage drops, upsell triggers, and drafts outreach.',
      icpDescription: 'Agencies and services firms with recurring retainers.',
      arpuEstimate: Math.max(filters.arpuFloor, 130),
      sourceSignalIds: signals.map((s) => s.id)
    })
  }
];

export function runProblemMapperAgent(params: {
  signals: IdeaSignal[];
  filters: IdeaFilters;
}): IdeaCandidate[] {
  const { signals, filters } = params;
  const buckets: Record<string, IdeaSignal[]> = {};

  for (const template of CATEGORY_TEMPLATES) {
    buckets[template.id] = [];
  }

  for (const signal of signals) {
    const lower = signal.content.toLowerCase();
    const matchedTemplate = CATEGORY_TEMPLATES.find((template) =>
      template.keywords.some((keyword) => lower.includes(keyword))
    );

    if (matchedTemplate) {
      buckets[matchedTemplate.id].push(signal);
    }
  }

  const candidates: IdeaCandidate[] = [];

  for (const template of CATEGORY_TEMPLATES) {
    const bucketSignals = buckets[template.id];
    if (!bucketSignals.length) continue;

    const candidate = template.build(bucketSignals, filters);
    candidates.push(candidate);
  }

  return candidates;
}

