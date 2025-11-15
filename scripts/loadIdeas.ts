import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ideas = [
  {
    id: 'idea-inbox-spend',
    title: 'Inbox Spend Guardian',
    description:
      'Connect email inboxes, parse invoices/receipts, and maintain a live view of recurring SaaS spend with concrete cancel/downgrade/renegotiate recommendations.',
    icpDescription: 'Finance/Ops leads at agencies and small B2B services firms',
    arpuEstimate: 150
  },
  {
    id: 'idea-vendor-risk',
    title: 'Vendor Risk & Compliance Monitor',
    description:
      'Monitor contracts, SLAs, SOC2/ISO docs, renewal terms, and security notices from key vendors and flag compliance/risk issues for ops and IT teams.',
    icpDescription: 'IT / Security / GRC leaders managing 20-200 vendors',
    arpuEstimate: 400
  },
  {
    id: 'idea-founder-copilot',
    title: 'Founder Ops Copilot (“Founder OS”)',
    description:
      'Pull from billing, product analytics, CRM, and support to generate weekly/monthly founder briefs showing what changed, what’s breaking, and what to do next.',
    icpDescription: 'Founders/CEOs of SaaS companies between $10k-$200k MRR',
    arpuEstimate: 250
  },
  {
    id: 'idea-revops-signal',
    title: 'RevOps Signal Engine',
    description:
      'Watch CRM, email, calendar, product usage, and support tickets to surface deal risk, expansion signals, and next-best actions for sales/CS teams.',
    icpDescription: 'Revenue Operations teams at B2B SaaS companies',
    arpuEstimate: 350
  },
  {
    id: 'idea-partner-intel',
    title: 'Partner Intelligence OS',
    description:
      'Aggregate partner portals, release notes, usage data, and public signals to maintain live partner dossiers, surface co-sell opportunities, and draft joint plays.',
    icpDescription: 'Partnerships / BizDev teams with 10+ strategic partners',
    arpuEstimate: 300
  },
  {
    id: 'idea-customer-research',
    title: 'Customer Research Synthesizer',
    description:
      'Ingest customer interviews, call transcripts, surveys, and support threads to continuously cluster problems, surface themes, and propose top jobs-to-be-done for product teams.',
    icpDescription: 'Product research / UX teams at growth-stage SaaS companies',
    arpuEstimate: 200
  },
  {
    id: 'idea-experiment-orchestrator',
    title: 'Experiment Orchestrator (Growth Lab)',
    description:
      'Coordinate growth experiments end-to-end: define hypotheses, draft copy/assets, launch simple tests, and interpret results into kill/iterate/scale decisions.',
    icpDescription: 'Growth/marketing teams running 5-20 concurrent experiments',
    arpuEstimate: 220
  },
  {
    id: 'idea-hiring-copilot',
    title: 'Hiring Pipeline Copilot',
    description:
      'Read inbound candidates, profiles, and structured assessments; score them against role criteria, draft interviewer guides, and surface the top candidates per role.',
    icpDescription: 'Talent teams filling 5-50 roles per quarter',
    arpuEstimate: 280
  },
  {
    id: 'idea-delivery-qa',
    title: 'Delivery QA & Status Agent',
    description:
      'Watch project docs, tickets, PRs, and status notes for consulting/dev/service teams to detect misalignment, scope creep, and risks; draft weekly client updates and internal QA summaries.',
    icpDescription: 'Services / consulting firms delivering client projects',
    arpuEstimate: 240
  },
  {
    id: 'idea-idea-thesis',
    title: 'Idea & Thesis Tracker (Idea OS)',
    description:
      'Ingest signals (market news, job posts, social, customer feedback), cluster them into themes, score opportunities, and propose validation experiments automatically.',
    icpDescription: 'Founders / strategy teams running opportunity backlogs',
    arpuEstimate: 180
  }
];

async function main() {
  const tenant = await prisma.tenant.findFirst({
    where: { id: 'demo-tenant' }
  });

  if (!tenant) {
    throw new Error('Demo tenant not found. Run prisma:seed first.');
  }

  for (const idea of ideas) {
    await prisma.idea.upsert({
      where: { id: idea.id },
      update: {
        title: idea.title,
        description: idea.description,
        icpDescription: idea.icpDescription,
        arpuEstimate: idea.arpuEstimate,
        regulatedConcern: false,
        manualWorkHeavy: false,
        founderFitSignal: true
      },
      create: {
        id: idea.id,
        tenantId: tenant.id,
        title: idea.title,
        description: idea.description,
        icpDescription: idea.icpDescription,
        arpuEstimate: idea.arpuEstimate,
        regulatedConcern: false,
        manualWorkHeavy: false,
        founderFitSignal: true
      }
    });
  }

  console.log(`Loaded ${ideas.length} ideas for tenant ${tenant.id}.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


