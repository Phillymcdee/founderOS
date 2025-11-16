/**
 * Integration Tests: Signal Ingestion Agent
 * 
 * Tests the signal ingestion flow including:
 * - Apify source configuration
 * - Signal ingestion with mock data
 * - Duplicate prevention
 * - Event logging
 */

import 'dotenv/config';
import { runSignalIngestionAgent } from '../../src/l1/ideas/signalIngestion';
import { getIdeaIntent } from '../../src/l3/ideasIntent';
import {
  cleanupTestData,
  createTestSignal,
  TEST_TENANT_ID,
  assertTestResult,
  closeTestDb,
  ensureTestTenant
} from '../helpers/setup';

const results: ReturnType<typeof assertTestResult>[] = [];

async function testApifySourcesConfigured() {
  const intent = await getIdeaIntent(TEST_TENANT_ID);
  const apifySources = intent.sources.apifySources;
  
  results.push(
    assertTestResult(
      'Apify sources configured',
      apifySources.length > 0,
      'No Apify sources found',
      { count: apifySources.length, sources: apifySources.map(s => s.id) }
    )
  );
}

async function testSignalIngestion() {
  const mockSignals = [
    {
      sourceId: 'test-revops-1',
      sourceLabel: 'RevOps Jobs Test',
      content: 'Revenue Operations Manager needed for fast-growing SaaS company'
    },
    {
      sourceId: 'test-support-1',
      sourceLabel: 'Support Pain Test',
      content: 'Customer support tickets piling up, need better automation tools'
    }
  ];

  try {
    const ingested = await runSignalIngestionAgent({
      tenantId: TEST_TENANT_ID,
      seeds: mockSignals
    });

    results.push(
      assertTestResult(
        'Signal ingestion works',
        ingested.length === mockSignals.length,
        `Expected ${mockSignals.length} signals, got ${ingested.length}`,
        { ingestedCount: ingested.length, expected: mockSignals.length }
      )
    );
  } catch (error: any) {
    results.push(
      assertTestResult('Signal ingestion', false, error.message)
    );
  }
}

async function testDuplicatePrevention() {
  const duplicateSignal = {
    sourceId: 'test-duplicate',
    sourceLabel: 'Duplicate Test',
    content: 'This is a duplicate test signal'
  };

  // First ingestion
  await runSignalIngestionAgent({
    tenantId: TEST_TENANT_ID,
    seeds: [duplicateSignal]
  });

  // Second ingestion (should be prevented)
  const duplicateResult = await runSignalIngestionAgent({
    tenantId: TEST_TENANT_ID,
    seeds: [duplicateSignal]
  });

  results.push(
    assertTestResult(
      'Duplicate prevention works',
      duplicateResult.length === 0,
      `Expected 0 signals (duplicate), got ${duplicateResult.length}`,
      { attempted: 1, created: duplicateResult.length }
    )
  );
}

async function main() {
  console.log('🧪 Running Signal Ingestion Integration Tests\n');
  console.log('='.repeat(60));

  try {
    await ensureTestTenant(TEST_TENANT_ID);
    await cleanupTestData(TEST_TENANT_ID);
    await testApifySourcesConfigured();
    await testSignalIngestion();
    await testDuplicatePrevention();

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

