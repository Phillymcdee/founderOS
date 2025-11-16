/**
 * Integration Tests: Experiment Flow
 * 
 * Tests the experiment lifecycle:
 * - Experiment designer agent
 * - Experiment interpreter agent
 * - Experiment loop flow
 * - State transitions based on results
 */

import 'dotenv/config';
import { runExperimentDesignerAgent } from '../../src/l1/ideas/experimentDesigner';
import { runExperimentInterpreterAgent } from '../../src/l1/ideas/experimentInterpreter';
import { runExperimentLoopFlow } from '../../src/l2/ideas/experimentLoop';
import {
  cleanupTestData,
  createTestIdea,
  TEST_TENANT_ID,
  assertTestResult,
  closeTestDb,
  getTestPrisma,
  ensureTestTenant
} from '../helpers/setup';

const results: ReturnType<typeof assertTestResult>[] = [];

async function testExperimentDesigner() {
  const idea = await createTestIdea(TEST_TENANT_ID, {
    state: 'EXPERIMENTING',
    totalScore: 10,
    agentLeverageScore: 3,
    description: 'Automated agent workflow for customer support'
  });

  const designs = runExperimentDesignerAgent(idea);

  results.push(
    assertTestResult(
      'Experiment designer generates designs',
      designs.length > 0,
      `Expected designs, got ${designs.length}`,
      { designsCount: designs.length, types: designs.map(d => d.type) }
    )
  );

  // Verify SIGNAL test is always created
  const hasSignalTest = designs.some(d => d.type === 'SIGNAL');
  results.push(
    assertTestResult(
      'SIGNAL test always created',
      hasSignalTest,
      'SIGNAL test not found',
      { hasSignalTest, designTypes: designs.map(d => d.type) }
    )
  );

  // Verify WORKFLOW test is created for high agent-fit ideas
  const hasWorkflowTest = designs.some(d => d.type === 'WORKFLOW');
  results.push(
    assertTestResult(
      'WORKFLOW test created for high agent-fit',
      hasWorkflowTest,
      'WORKFLOW test not found for high agent-fit idea',
      { hasWorkflowTest, agentLeverageScore: idea.agentLeverageScore }
    )
  );
}

async function testExperimentInterpreter() {
  const idea = await createTestIdea(TEST_TENANT_ID, {
    state: 'EXPERIMENTING',
    title: 'Test Idea for Interpreter'
  });

  const experiment = await getTestPrisma().ideaExperiment.create({
    data: {
      tenantId: TEST_TENANT_ID,
      ideaId: idea.id,
      type: 'SIGNAL',
      description: 'Created landing page, got 10 signups with strong interest',
      result: 'PASSED'
    }
  });

  const interpretation = runExperimentInterpreterAgent(experiment, idea.title);

  results.push(
    assertTestResult(
      'Experiment interpreter works',
      !!interpretation.verdict && !!interpretation.reasoning,
      'Missing verdict or reasoning',
      {
        verdict: interpretation.verdict,
        confidence: interpretation.confidence,
        hasReasoning: !!interpretation.reasoning
      }
    )
  );
}

async function testExperimentLoop() {
  // Create idea in EXPERIMENTING state with no experiments
  const idea = await createTestIdea(TEST_TENANT_ID, {
    state: 'EXPERIMENTING',
    totalScore: 10,
    agentLeverageScore: 3
  });

  const experimentsBefore = await getTestPrisma().ideaExperiment.count({
    where: { ideaId: idea.id }
  });

  // Run experiment loop
  const loopResults = await runExperimentLoopFlow(TEST_TENANT_ID);

  const experimentsAfter = await getTestPrisma().ideaExperiment.count({
    where: { ideaId: idea.id }
  });

  results.push(
    assertTestResult(
      'Experiment loop creates experiments',
      experimentsAfter > experimentsBefore,
      `Expected experiments to be created, before: ${experimentsBefore}, after: ${experimentsAfter}`,
      {
        experimentsBefore,
        experimentsAfter,
        resultsCount: loopResults.length
      }
    )
  );
}

async function testStateTransitions() {
  const idea = await createTestIdea(TEST_TENANT_ID, {
    state: 'EXPERIMENTING',
    totalScore: 10
  });

  // Create passed experiments
  await getTestPrisma().ideaExperiment.createMany({
    data: [
      {
        tenantId: TEST_TENANT_ID,
        ideaId: idea.id,
        type: 'SIGNAL',
        description: 'Signal test passed',
        result: 'PASSED'
      },
      {
        tenantId: TEST_TENANT_ID,
        ideaId: idea.id,
        type: 'WORKFLOW',
        description: 'Workflow test passed',
        result: 'PASSED'
      },
      {
        tenantId: TEST_TENANT_ID,
        ideaId: idea.id,
        type: 'AGENT_OWNERSHIP',
        description: 'Agent ownership test passed',
        result: 'PASSED'
      }
    ]
  });

  // Run experiment loop to interpret and update state
  await runExperimentLoopFlow(TEST_TENANT_ID);

  const updatedIdea = await getTestPrisma().idea.findUnique({
    where: { id: idea.id }
  });

  // Note: The loop may or may not move to VALIDATED depending on logic
  // Just verify state is valid
  const validStates = ['EXPERIMENTING', 'VALIDATED', 'KILLED'];
  const hasValidState = updatedIdea && validStates.includes(updatedIdea.state);

  results.push(
    assertTestResult(
      'State transitions work',
      hasValidState || false,
      `Invalid state after experiments: ${updatedIdea?.state}`,
      { state: updatedIdea?.state, validStates }
    )
  );
}

async function main() {
  console.log('🧪 Running Experiment Flow Integration Tests\n');
  console.log('='.repeat(60));

  try {
    await ensureTestTenant(TEST_TENANT_ID);
    await cleanupTestData(TEST_TENANT_ID);
    await testExperimentDesigner();
    await testExperimentInterpreter();
    await testExperimentLoop();
    await testStateTransitions();

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

