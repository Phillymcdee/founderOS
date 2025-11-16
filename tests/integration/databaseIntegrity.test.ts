/**
 * Integration Tests: Database Integrity
 * 
 * Tests data consistency and integrity:
 * - Required fields
 * - Foreign key relationships
 * - Event logging
 * - State consistency
 */

import 'dotenv/config';
import {
  cleanupTestData,
  createTestIdea,
  createTestSignal,
  TEST_TENANT_ID,
  assertTestResult,
  closeTestDb,
  getTestPrisma,
  ensureTestTenant
} from '../helpers/setup';

const results: ReturnType<typeof assertTestResult>[] = [];

async function testRequiredFields() {
  const ideas = await getTestPrisma().idea.findMany({
    where: { tenantId: TEST_TENANT_ID }
  });

  const invalidIdeas = ideas.filter(
    idea => !idea.title || !idea.description || !idea.state
  );

  results.push(
    assertTestResult(
      'All ideas have required fields',
      invalidIdeas.length === 0,
      `${invalidIdeas.length} ideas missing required fields`,
      { totalIdeas: ideas.length, invalidCount: invalidIdeas.length }
    )
  );
}

async function testSourceSignalIds() {
  const signal = await createTestSignal(
    TEST_TENANT_ID,
    'Test signal for reference test'
  );

  const idea = await createTestIdea(TEST_TENANT_ID, {
    sourceSignalIds: [signal.id]
  });

  const signals = await getTestPrisma().ideaSignal.findMany({
    where: { id: { in: idea.sourceSignalIds } }
  });

  const allSignalsExist = idea.sourceSignalIds.every(id =>
    signals.some(s => s.id === id)
  );

  results.push(
    assertTestResult(
      'Source signal IDs are valid',
      allSignalsExist,
      `Some signal IDs don't exist`,
      {
        ideaSignalIds: idea.sourceSignalIds,
        foundSignals: signals.map(s => s.id)
      }
    )
  );
}

async function testExperimentLinks() {
  const idea = await createTestIdea(TEST_TENANT_ID);

  const experiment = await getTestPrisma().ideaExperiment.create({
    data: {
      tenantId: TEST_TENANT_ID,
      ideaId: idea.id,
      type: 'SIGNAL',
      description: 'Test experiment'
    }
  });

  const linkedIdea = await getTestPrisma().idea.findUnique({
    where: { id: experiment.ideaId }
  });

  results.push(
    assertTestResult(
      'Experiments linked correctly',
      linkedIdea !== null && linkedIdea.id === idea.id,
      'Experiment not linked to idea',
      { experimentId: experiment.id, ideaId: idea.id }
    )
  );
}

async function testEventLogging() {
  const idea = await createTestIdea(TEST_TENANT_ID);

  await getTestPrisma().event.create({
    data: {
      tenantId: TEST_TENANT_ID,
      type: 'IDEA_CREATED',
      payload: { ideaId: idea.id },
      primaryEntityId: idea.id
    }
  });

  const events = await getTestPrisma().event.findMany({
    where: {
      tenantId: TEST_TENANT_ID,
      type: 'IDEA_CREATED'
    }
  });

  results.push(
    assertTestResult(
      'Events are logged',
      events.length > 0,
      'No events found',
      { eventsCount: events.length, eventTypes: [...new Set(events.map(e => e.type))] }
    )
  );
}

async function testStateConsistency() {
  const validStates = [
    'PENDING_REVIEW',
    'BACKLOG',
    'SCORING',
    'EXPERIMENTING',
    'VALIDATED',
    'KILLED'
  ];

  const ideas = await getTestPrisma().idea.findMany({
    where: { tenantId: TEST_TENANT_ID }
  });

  const invalidStates = ideas.filter(idea => !validStates.includes(idea.state));

  results.push(
    assertTestResult(
      'All ideas have valid states',
      invalidStates.length === 0,
      `${invalidStates.length} ideas with invalid states`,
      {
        totalIdeas: ideas.length,
        invalidStates: invalidStates.map(i => ({ id: i.id, state: i.state }))
      }
    )
  );
}

async function main() {
  console.log('🧪 Running Database Integrity Tests\n');
  console.log('='.repeat(60));

  try {
    await ensureTestTenant(TEST_TENANT_ID);
    await cleanupTestData(TEST_TENANT_ID);
    await testRequiredFields();
    await testSourceSignalIds();
    await testExperimentLinks();
    await testEventLogging();
    await testStateConsistency();

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

if (require.main === module) {
  main();
}

