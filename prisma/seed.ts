import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { id: 'demo-tenant' },
    update: {},
    create: {
      id: 'demo-tenant',
      name: 'Demo Tenant'
    }
  });

  const account = await prisma.account.upsert({
    where: { id: 'demo-account' },
    update: {},
    create: {
      id: 'demo-account',
      tenantId: tenant.id,
      name: 'Demo Account'
    }
  });

  await prisma.subscription.upsert({
    where: { id: 'demo-subscription' },
    update: {},
    create: {
      id: 'demo-subscription',
      tenantId: tenant.id,
      accountId: account.id,
      mrr: 1500,
      plan: 'Pro',
      status: 'active',
      startedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      cancelledAt: null
    }
  });

  await prisma.businessIntentConfig.upsert({
    where: { tenantId: tenant.id },
    update: {},
    create: {
      tenantId: tenant.id,
      targetMrr: 20000,
      acceptableChurnRate: 0.05,
      alertChurnRate: 0.08,
      alertRunwayMonths: 6,
      summaryTone: 'concise',
      summaryMaxActions: 4
    }
  });

  await prisma.ideaIntentConfig.upsert({
    where: { tenantId: tenant.id },
    update: {},
    create: {
      tenantId: tenant.id,
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
    }
  });

  await prisma.ideaSignal.upsert({
    where: { id: 'demo-signal' },
    update: {},
    create: {
      id: 'demo-signal',
      tenantId: tenant.id,
      source: 'manual',
      content: 'Agencies struggle to monitor recurring SaaS spend.'
    }
  });

  await prisma.idea.upsert({
    where: { id: 'demo-idea' },
    update: {},
    create: {
      id: 'demo-idea',
      tenantId: tenant.id,
      title: 'Inbox Spend Guardian',
      description:
        'Monitor agency email inboxes for invoices/receipts, aggregate recurring SaaS spend, and surface savings actions.',
      icpDescription: 'Agencies with 5-50 clients using Gmail + Stripe',
      arpuEstimate: 150,
      regulatedConcern: false,
      manualWorkHeavy: false,
      founderFitSignal: true
    }
  });

  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


