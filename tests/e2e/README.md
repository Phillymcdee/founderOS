# End-to-End (E2E) Tests

Browser-based tests for UI and user workflows.

## Setup

These tests require:
1. **Database running** - Start PostgreSQL with Docker Compose:
   ```bash
   docker compose up -d db
   ```
2. **Database migrations** - Ensure migrations are applied:
   ```bash
   npm run prisma:migrate
   ```
3. Browser automation (Playwright - already installed)

## Manual Testing Guide

Since we don't have Playwright set up yet, use this guide for manual testing:

### 1. Kanban Board Tests
1. Navigate to `http://localhost:3000/founder/ideas`
2. Verify all state columns render (PENDING_REVIEW, BACKLOG, SCORING, EXPERIMENTING, VALIDATED, KILLED)
3. Verify column counts display correctly
4. Drag an idea card from one column to another
5. Verify visual feedback during drag (opacity change, border highlight)
6. Verify state persists after drop (refresh page)
7. Verify notification appears for VALIDATED state

### 2. Idea Card Tests
1. Click an idea card to expand details
2. Click "Source Signals" section to expand/collapse
3. Click "Experiments" section to expand/collapse
4. Verify score badges display with correct colors
5. Verify filter statuses show ✅/❌ correctly

### 3. Button Tests
1. Click "Discover new ideas" button
2. Verify loading state shows
3. Verify page updates after completion
4. Click "Run experiment loop" button
5. Verify experiments are created for ideas in EXPERIMENTING state

### 4. Notification Tests
1. Drag an idea to VALIDATED state
2. Verify success notification appears (top-right)
3. Wait 5 seconds, verify auto-dismiss
4. Manually dismiss notification (click X)

## Automated Testing with Playwright

Playwright is now set up and ready to use. Test files are located in this directory:

- `kanban-board.spec.ts` - Tests for Kanban board functionality
- `idea-card.spec.ts` - Tests for idea card interactions
- `buttons.spec.ts` - Tests for button actions
- `notifications.spec.ts` - Tests for notification system

### Running E2E Tests

**Important**: Make sure the database is running before running tests:
```bash
docker compose up -d db
```

Then run the tests:
```bash
# Run all e2e tests (automatically starts dev server)
npm run test:e2e

# Run tests in headed mode (see browser)
npx playwright test --headed

# Run a specific test file
npx playwright test kanban-board

# Run tests in a specific browser
npx playwright test --project=chromium

# Generate test report
npx playwright show-report
```

### Configuration

Playwright configuration is in `playwright.config.ts` at the project root. The config:
- Automatically starts the dev server before tests
- Runs tests on Chromium, Firefox, and WebKit
- Uses `http://localhost:3000` as the base URL
- Generates HTML reports for test results

### Flaky Tests

Some tests are marked as flaky and are automatically skipped in CI environments (when `CI` environment variable is set):

- **Button loading state tests** (3 tests): Timing issues with React `useTransition` - button state changes happen too quickly to reliably detect in automated tests
- **Notification tests** (3 tests): Drag-and-drop timing issues - notifications appear briefly before page reloads, making them hard to catch consistently

These tests will still run locally for manual verification but won't cause CI failures. To run all tests including flaky ones, ensure `CI` environment variable is not set.

