import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const ideas = await prisma.idea.findMany({
    where: { tenantId: 'demo-tenant' },
    include: {
      experiments: true
    },
    orderBy: {
      totalScore: 'desc'
    }
  });

  const summary = ideas.map((idea) => ({
    title: idea.title,
    state: idea.state,
    filters: {
      market: idea.passesMarket,
      regulation: idea.passesRegulation,
      agentFit: idea.passesAgentFit,
      founderFit: idea.passesFounderFit
    },
    scores: {
      pain: idea.painFrequencyScore,
      agentLeverage: idea.agentLeverageScore,
      dataSurface: idea.dataSurfaceScore,
      repeatability: idea.repeatabilityScore,
      total: idea.totalScore
    },
    experiments: idea.experiments.map((exp) => ({
      type: exp.type,
      result: exp.result
    }))
  }));

  console.table(
    summary.map((item) => ({
      Title: item.title,
      State: item.state,
      Total: item.scores.total ?? '-',
      Pain: item.scores.pain ?? '-',
      Agent: item.scores.agentLeverage ?? '-',
      Data: item.scores.dataSurface ?? '-',
      Repeatability: item.scores.repeatability ?? '-',
      'Filters OK':
        Object.values(item.filters).every(Boolean) ? 'Yes' : 'No'
    }))
  );

  console.log(
    '\nFull detail:\n',
    JSON.stringify(summary, null, 2)
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


