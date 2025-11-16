# End-to-End (E2E) Tests

Browser-based tests for UI and user workflows.

## Setup

These tests require:
1. Dev server running (`npm run dev`)
2. Browser automation (Playwright recommended)

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

## Future: Playwright Setup

To set up automated browser tests:

```bash
npm install -D @playwright/test playwright
npx playwright install
```

Then create test files in this directory following Playwright patterns.

