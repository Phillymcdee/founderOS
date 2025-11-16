/**
 * Integration Tests: Idea Generation Flow
 * 
 * Tests the complete idea generation pipeline:
 * - Problem mapper agent
 * - Auto-scoring
 * - State assignment
 * - Database persistence
 */

import 'dotenv/config';
import { runProblemMapperAgent } from '../../src/l1/ideas/problemMapper';
import { runWeeklyDiscoverAndCompressFlow } from '../../src/l2/ideas/discoverAndCompress';
import { getIdeaIntent } from '../../src/l3/ideasIntent';
import {
  cleanupTestData,
  createTestSignal,
  TEST_TENANT_ID,
  assertTestResult,
  closeTestDb,
  getTestPrisma,
  ensureTestTenant
} from '../helpers/setup';

const results: ReturnType<typeof assertTestResult>[] = [];

async function testProblemMapper() {
  // Create test signals with keywords that match templates
  await createTestSignal(
    TEST_TENANT_ID,
    'RevOps Manager needed for SaaS company to manage CRM pipeline',
    'LinkedIn Jobs'
  );
  await createTestSignal(
    TEST_TENANT_ID,
    'Customer support tickets piling up, need automation',
    'Reddit'
  );

  const signals = await getTestPrisma().ideaSignal.findMany({
    where: { tenantId: TEST_TENANT_ID }
  });

  const intent = await getIdeaIntent(TEST_TENANT_ID);
  const candidates = await runProblemMapperAgent({
    signals,
    filters: intent.filters
  });

  results.push(
    assertTestResult(
      'Problem mapper generates candidates',
      candidates.length > 0,
      `Expected candidates, got ${candidates.length}`,
      { inputSignals: signals.length, outputCandidates: candidates.length }
    )
  );
}

async function testEmptySignalSet() {
  const intent = await getIdeaIntent(TEST_TENANT_ID);
  const candidates = await runProblemMapperAgent({
    signals: [],
    filters: intent.filters
  });

  results.push(
    assertTestResult(
      'Problem mapper handles empty signals',
      candidates.length === 0,
      `Expected 0 candidates for empty signals, got ${candidates.length}`,
      { result: candidates.length }
    )
  );
}

async function testAutoScoring() {
  // Run discovery flow which includes auto-scoring
  const result = await runWeeklyDiscoverAndCompressFlow(TEST_TENANT_ID);

  if (result.createdIdeas.length === 0) {
    results.push(
      assertTestResult('Auto-scoring (no ideas created)', false, 'No ideas were created')
    );
    return;
  }

  const idea = result.createdIdeas[0];
  const hasScoring =
    idea.totalScore !== null &&
    idea.painFrequencyScore !== null &&
    idea.agentLeverageScore !== null &&
    idea.dataSurfaceScore !== null &&
    idea.repeatabilityScore !== null;

  results.push(
    assertTestResult(
      'Ideas are auto-scored',
      hasScoring,
      'Missing scoring fields',
      {
        totalScore: idea.totalScore,
        hasAllScores: hasScoring
      }
    )
  );

  const hasFilters =
    idea.passesMarket !== null &&
    idea.passesRegulation !== null &&
    idea.passesAgentFit !== null &&
    idea.passesFounderFit !== null;

  results.push(
    assertTestResult(
      'Hard filters are applied',
      hasFilters,
      'Missing filter results',
      {
        passesMarket: idea.passesMarket,
        passesRegulation: idea.passesRegulation,
        passesAgentFit: idea.passesAgentFit,
        passesFounderFit: idea.passesFounderFit
      }
    )
  );

  // Verify state is set correctly
  const validStates = ['KILLED', 'SCORING', 'EXPERIMENTING', 'PENDING_REVIEW'];
  const hasValidState = validStates.includes(idea.state);

  results.push(
    assertTestResult(
      'Initial state is set correctly',
      hasValidState,
      `Invalid initial state: ${idea.state}`,
      { state: idea.state, validStates }
    )
  );
}

async function main() {
  console.log('🧪 Running Idea Generation Integration Tests\n');
  console.log('='.repeat(60));

  try {
    await ensureTestTenant(TEST_TENANT_ID);
    await cleanupTestData(TEST_TENANT_ID);
    await testProblemMapper();
    await testEmptySignalSet();
    await testAutoScoring();

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('\n📊 Test Results\n');
    
    results.forEach(result => {
      const icon = result.passed ? '✅' : '❌';
      console.log(`${icon} ${result.name}`);
      if (result.error) console.log(`   Error: ${result.error}`);
      if (result.details) console.log(`   Details:`, JSON.stringify(result.details, null, 2));
    });

    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    const total = results.length;

    console.log(`\nTotal: ${total} | Passed: ${passed} | Failed: ${failed}`);

    // Cleanup
    await cleanupTestData(TEST_TENANT_ID);
    await closeTestDb();

    process.exit(failed > 0 ? 1 : 0);
  } catch (error: any) {
    console.error('Fatal error:', error);
    await cleanupTestData(TEST_TENANT_ID);
    await closeTestDb();
    process.exit(1);
  }
}

// Run if executed directly
main();

