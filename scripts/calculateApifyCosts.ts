/**
 * Cost calculation for Apify actors used in Ideas & Validation domain
 * Based on weekly discovery runs (Monday @ 09:00 UTC)
 */

interface ActorCost {
  actorId: string;
  label: string;
  pricingModel: string;
  costPerRun: number;
  runsPerMonth: number;
  monthlyCost: number;
  notes: string;
}

const RUNS_PER_MONTH = 4.33; // Weekly runs (52 weeks / 12 months)

const actors: ActorCost[] = [
  // 1) LinkedIn Job Scrapers (3 sources)
  {
    actorId: 'harvestapi/linkedin-job-search',
    label: 'LinkedIn Job Search (RevOps, Support Ops, Finance Ops)',
    pricingModel: 'Pay-per-event: $0.001/job + $0.001/start',
    costPerRun: 0.24, // 3 sources × 40 items × $0.002 = $0.24
    runsPerMonth: RUNS_PER_MONTH,
    monthlyCost: 0.24 * RUNS_PER_MONTH,
    notes: '3 sources, 40 items each = 120 jobs per run'
  },

  // 2) Reddit Scrapers (2 sources)
  {
    actorId: 'fatihtahta/reddit-scraper-search-fast',
    label: 'Reddit Scraper (Support Pain, Agency Reporting)',
    pricingModel: 'Pay-per-result: $1.49 per 1,000 results',
    costPerRun: 0.0894, // 2 sources × 30 items × $0.00149 = $0.0894
    runsPerMonth: RUNS_PER_MONTH,
    monthlyCost: 0.0894 * RUNS_PER_MONTH,
    notes: '2 sources, 30 items each = 60 posts per run'
  },

  // 3) G2 Explorer (1 source)
  {
    actorId: 'jupri/g2-explorer',
    label: 'G2 Reviews Explorer',
    pricingModel: 'FREE (platform usage only)',
    costPerRun: 0.03, // ~0.1 CU × $0.30/CU (estimated: 512MB × 5min)
    runsPerMonth: RUNS_PER_MONTH,
    monthlyCost: 0.03 * RUNS_PER_MONTH,
    notes: 'Free actor, ~0.1 CU per run (512MB × 5min)'
  }
];

function main() {
  console.log('='.repeat(80));
  console.log('APIFY COST ESTIMATION FOR IDEAS & VALIDATION DOMAIN');
  console.log('='.repeat(80));
  console.log(`\nSchedule: Weekly runs (Monday @ 09:00 UTC)`);
  console.log(`Runs per month: ${RUNS_PER_MONTH.toFixed(2)}\n`);

  let totalMonthly = 0;

  actors.forEach((actor, idx) => {
    console.log(`${idx + 1}. ${actor.label}`);
    console.log(`   Actor: ${actor.actorId}`);
    console.log(`   Pricing: ${actor.pricingModel}`);
    console.log(`   Cost per run: $${actor.costPerRun.toFixed(4)}`);
    console.log(`   Monthly cost: $${actor.monthlyCost.toFixed(2)}`);
    console.log(`   Notes: ${actor.notes}`);
    console.log('');
    totalMonthly += actor.monthlyCost;
  });

  console.log('='.repeat(80));
  console.log(`TOTAL MONTHLY COST: $${totalMonthly.toFixed(2)}`);
  console.log(`TOTAL ANNUAL COST: $${(totalMonthly * 12).toFixed(2)}`);
  console.log('='.repeat(80));

  console.log('\n📊 BREAKDOWN BY ACTOR TYPE:');
  const linkedinTotal = actors[0].monthlyCost;
  const redditTotal = actors[1].monthlyCost;
  const g2Total = actors[2].monthlyCost;

  console.log(`  LinkedIn Job Scrapers: $${linkedinTotal.toFixed(2)}/month (${((linkedinTotal / totalMonthly) * 100).toFixed(1)}%)`);
  console.log(`  Reddit Scrapers: $${redditTotal.toFixed(2)}/month (${((redditTotal / totalMonthly) * 100).toFixed(1)}%)`);
  console.log(`  G2 Explorer: $${g2Total.toFixed(2)}/month (${((g2Total / totalMonthly) * 100).toFixed(1)}%)`);

  console.log('\n💡 COST OPTIMIZATION NOTES:');
  console.log('  • LinkedIn scraper costs scale linearly with job count');
  console.log('  • Reddit scraper costs scale with post count (comments disabled)');
  console.log('  • G2 Explorer is free but has minimal compute costs');
  console.log('  • Consider reducing maxItems if costs become prohibitive');
  console.log('  • Monitor actual usage in Apify Console to refine estimates');
}

main();

