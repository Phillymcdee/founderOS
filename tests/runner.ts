#!/usr/bin/env ts-node
/**
 * Test Runner - Runs all test suites
 * 
 * Usage:
 *   npm test                    # Run all tests
 *   npm run test:integration    # Run integration tests only
 *   npx ts-node tests/runner.ts # Run directly
 */

import 'dotenv/config';
import { spawn } from 'child_process';
import { promisify } from 'util';
import { exec } from 'child_process';

const execAsync = promisify(exec);

const testSuites = [
  {
    name: 'Signal Ingestion',
    file: 'tests/integration/signalIngestion.test.ts'
  },
  {
    name: 'Idea Generation',
    file: 'tests/integration/ideaGeneration.test.ts'
  },
  {
    name: 'Experiment Flow',
    file: 'tests/integration/experimentFlow.test.ts'
  },
  {
    name: 'Database Integrity',
    file: 'tests/integration/databaseIntegrity.test.ts'
  }
];

interface TestSuiteResult {
  name: string;
  passed: boolean;
  duration: number;
  output: string;
}

async function runTestSuite(suite: typeof testSuites[0]): Promise<TestSuiteResult> {
  const startTime = Date.now();
  
  return new Promise((resolve) => {
    const child = spawn('npx', ['ts-node', suite.file], {
      stdio: 'pipe',
      shell: true
    });

    let output = '';
    let errorOutput = '';

    child.stdout.on('data', (data) => {
      output += data.toString();
      process.stdout.write(data);
    });

    child.stderr.on('data', (data) => {
      errorOutput += data.toString();
      process.stderr.write(data);
    });

    child.on('close', (code) => {
      const duration = Date.now() - startTime;
      resolve({
        name: suite.name,
        passed: code === 0,
        duration,
        output: output + errorOutput
      });
    });
  });
}

async function main() {
  const args = process.argv.slice(2);
  const filter = args.find(arg => arg.startsWith('--filter='))?.split('=')[1];

  const suitesToRun = filter
    ? testSuites.filter(s => s.name.toLowerCase().includes(filter.toLowerCase()))
    : testSuites;

  console.log('🧪 Running Test Suites\n');
  console.log('='.repeat(60));
  console.log(`Suites to run: ${suitesToRun.map(s => s.name).join(', ')}\n`);

  const results: TestSuiteResult[] = [];

  for (const suite of suitesToRun) {
    console.log(`\n📦 Running: ${suite.name}`);
    console.log('-'.repeat(60));
    
    const result = await runTestSuite(suite);
    results.push(result);
    
    const icon = result.passed ? '✅' : '❌';
    console.log(`\n${icon} ${suite.name} (${result.duration}ms)`);
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Test Suite Summary\n');

  results.forEach(result => {
    const icon = result.passed ? '✅' : '❌';
    console.log(`${icon} ${result.name} - ${result.duration}ms`);
  });

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

  console.log(`\nTotal: ${total} suites | Passed: ${passed} | Failed: ${failed}`);
  console.log(`Total Duration: ${totalDuration}ms\n`);

  process.exit(failed > 0 ? 1 : 0);
}

// Run if executed directly
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

