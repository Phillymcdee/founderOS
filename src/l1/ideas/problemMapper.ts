import type { IdeaSignal } from '@prisma/client';
import type { IdeaFilters } from '@/l3/ideasIntent';
import { callLLM } from '@/lib/llm';

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

/**
 * L1 Agent: Problem Mapper
 * Groups related signals into problem themes and generates idea candidates.
 * 
 * Current implementation: Rule-based keyword matching (fast, deterministic)
 * Future enhancement: Use LLM for semantic clustering and theme extraction
 */
export async function runProblemMapperAgent(params: {
  signals: IdeaSignal[];
  filters: IdeaFilters;
  useLLM?: boolean;
}): Promise<IdeaCandidate[]> {
  const { signals, filters, useLLM = false } = params;

  // Future LLM-based clustering (when LLM is configured)
  if (useLLM) {
    try {
      const signalTexts = signals.map((s) => s.content).join('\n---\n');
      const prompt = `Group these market signals into problem themes. Each theme should represent a distinct problem that could become a product idea.

Signals:
${signalTexts}

Return a JSON array of themes, each with:
- theme: short theme name
- problem: clear problem statement
- signals: array of signal indices that belong to this theme
- icp: who has this problem`;

      const response = await callLLM({
        userPrompt: prompt,
        systemPrompt: 'You are an expert at identifying market problems from signals. Group related signals and extract clear problem statements.',
        responseFormat: 'json'
      });

      // TODO: Parse LLM response and map to IdeaCandidate format
      // For now, fallback to rule-based
    } catch (error) {
      console.warn('LLM clustering failed, falling back to rule-based:', error);
    }
  }

  // Rule-based keyword matching (current implementation)
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

