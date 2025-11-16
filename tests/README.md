# Testing Documentation

This directory contains all tests for the Ideas & Validation domain and the broader FounderOS system.

## Test Structure

```
tests/
├── unit/              # Unit tests for individual agents/functions
├── integration/       # Integration tests for flows and API endpoints
├── e2e/              # End-to-end tests (browser-based)
├── fixtures/         # Test data and fixtures
└── helpers/          # Test utilities and helpers
```

## Running Tests

### All Tests
```bash
npm test
```

### By Category
```bash
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only
npm run test:e2e           # E2E tests (requires dev server)
npm run test:watch         # Watch mode for development
```

### Specific Test File
```bash
npx ts-node tests/integration/signalIngestion.test.ts
```

## Test Coverage

- **Unit Tests**: Test individual functions/agents in isolation
- **Integration Tests**: Test flows and API endpoints with database
- **E2E Tests**: Test full user workflows in browser

## Writing Tests

### Unit Test Example
```typescript
import { runProblemMapperAgent } from '@/l1/ideas/problemMapper';
import { DEFAULT_IDEA_FILTERS } from '@/l3/ideasIntent';

describe('Problem Mapper Agent', () => {
  it('should generate candidates from signals', async () => {
    const signals = [/* test signals */];
    const candidates = await runProblemMapperAgent({
      signals,
      filters: DEFAULT_IDEA_FILTERS
    });
    expect(candidates.length).toBeGreaterThan(0);
  });
});
```

### Integration Test Example
```typescript
import { runWeeklyDiscoverAndCompressFlow } from '@/l2/ideas/discoverAndCompress';

describe('Weekly Discover Flow', () => {
  it('should ingest signals and create ideas', async () => {
    const result = await runWeeklyDiscoverAndCompressFlow('test-tenant');
    expect(result.ingestedSignals.length).toBeGreaterThan(0);
  });
});
```

## Test Database

Tests use the same database as development. Each test should:
- Clean up after itself
- Use unique tenant IDs when possible
- Not rely on existing data

## CI/CD

Tests run automatically on:
- Pre-commit hooks (unit tests only)
- Pull requests (all tests)
- Main branch merges (full test suite)

