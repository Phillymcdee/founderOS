import { prisma } from '@/l0/db';
import { logEvent } from '@/l0/events';

type SignalSeed = {
  sourceId: string;
  sourceLabel: string;
  content: string;
};

const SAMPLE_SIGNAL_FEEDS: SignalSeed[] = [
  {
    sourceId: 'ops-email-noise',
    sourceLabel: 'Founder DMs',
    content:
      'Agency founders complaining that vendor invoices get lost in flooded inboxes and no one notices auto-renewals.'
  },
  {
    sourceId: 'finance-slack',
    sourceLabel: 'Finance Slack',
    content:
      'Fractional CFOs still paste Stripe + QuickBooks exports into Google Sheets every week to explain MRR changes.'
  },
  {
    sourceId: 'gtm-job-post',
    sourceLabel: 'GTM Job Posts',
    content:
      'Multiple startups hiring “AI revops analyst” to watch CRM hygiene and pipeline risk daily.'
  },
  {
    sourceId: 'support-forums',
    sourceLabel: 'Support Forums',
    content:
      'B2B product teams asking for better ways to summarize support tickets + feature requests into a single action list.'
  },
  {
    sourceId: 'partnerships-news',
    sourceLabel: 'Partner Newsletters',
    content:
      'Agencies want a co-pilot that monitors client accounts for renewals, usage drops, and new upsell triggers.'
  }
];

export async function runSignalIngestionAgent(params: {
  tenantId: string;
  seeds?: SignalSeed[];
}) {
  const { tenantId, seeds = SAMPLE_SIGNAL_FEEDS } = params;
  const createdIds: string[] = [];

  for (const seed of seeds) {
    const exists = await prisma.ideaSignal.findFirst({
      where: {
        tenantId,
        content: seed.content
      }
    });

    if (exists) continue;

    const signal = await prisma.ideaSignal.create({
      data: {
        tenantId,
        source: seed.sourceLabel,
        content: seed.content
      }
    });
    createdIds.push(signal.id);

    await logEvent({
      tenantId,
      type: 'IDEA_SIGNAL_INGESTED',
      primaryEntityId: signal.id,
      payload: {
        sourceId: seed.sourceId,
        sourceLabel: seed.sourceLabel
      }
    });
  }

  return prisma.ideaSignal.findMany({
    where: { id: { in: createdIds } }
  });
}

