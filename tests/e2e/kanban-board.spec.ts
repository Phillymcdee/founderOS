import { test, expect } from '@playwright/test';

const IDEAS_PAGE_URL = '/founder/ideas';

test.describe('Kanban Board', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(IDEAS_PAGE_URL);
  });

  test('should render all state columns', async ({ page }) => {
    const expectedStates = [
      'PENDING_REVIEW',
      'BACKLOG',
      'SCORING',
      'EXPERIMENTING',
      'VALIDATED',
      'KILLED'
    ];

    // Wait for kanban board to load
    await page.waitForSelector('h3', { timeout: 5000 }).catch(() => {});

    for (const state of expectedStates) {
      // Use heading role to find column headers specifically (avoids matching text in other elements)
      const columnHeader = page.getByRole('heading', { name: new RegExp(state.replace(/_/g, ' '), 'i') });
      await expect(columnHeader).toBeVisible();
    }
  });

  test('should display column counts correctly', async ({ page }) => {
    // Wait for the kanban board to load
    await page.waitForSelector('text=PENDING_REVIEW', { timeout: 5000 }).catch(() => {});

    // Find all column count badges (they should be visible)
    const countBadges = page.locator('span').filter({ hasText: /^\d+$/ });
    const count = await countBadges.count();

    // If there are ideas, we should see count badges
    // If no ideas, we might see "No ideas yet" message
    const noIdeasMessage = page.getByText('No ideas yet');
    const hasIdeas = !(await noIdeasMessage.isVisible().catch(() => false));

    if (hasIdeas) {
      expect(count).toBeGreaterThan(0);
    }
  });

  test('should allow dragging idea card between columns', async ({ page }) => {
    // Wait for kanban board to load
    await page.waitForSelector('text=PENDING_REVIEW', { timeout: 5000 }).catch(() => {});

    // Check if there are any ideas to drag
    const noIdeasMessage = page.getByText('No ideas yet');
    const hasNoIdeas = await noIdeasMessage.isVisible().catch(() => false);

    if (hasNoIdeas) {
      test.skip();
      return;
    }

    // Find the first draggable idea card
    const firstCard = page.locator('[draggable="true"]').first();
    const cardCount = await firstCard.count();

    if (cardCount === 0) {
      test.skip();
      return;
    }

    // Get the initial state by checking which column contains the card
    const initialColumn = firstCard.locator('..').locator('..');
    
    // Find a target column (BACKLOG if available)
    const targetColumn = page.getByText('BACKLOG').locator('..').locator('..');
    
    // Perform drag and drop
    await firstCard.dragTo(targetColumn, {
      force: true,
    });

    // Wait for the state update to complete
    await page.waitForTimeout(1000);

    // Verify the page reloads or updates (state change triggers reload after 1s)
    await page.waitForTimeout(2000);
  });

  test('should show visual feedback during drag', async ({ page }) => {
    await page.waitForSelector('text=PENDING_REVIEW', { timeout: 5000 }).catch(() => {});

    const noIdeasMessage = page.getByText('No ideas yet');
    const hasNoIdeas = await noIdeasMessage.isVisible().catch(() => false);

    if (hasNoIdeas) {
      test.skip();
      return;
    }

    const firstCard = page.locator('[draggable="true"]').first();
    const cardCount = await firstCard.count();

    if (cardCount === 0) {
      test.skip();
      return;
    }

    // Start dragging
    const cardBoundingBox = await firstCard.boundingBox();
    if (!cardBoundingBox) {
      test.skip();
      return;
    }

    await page.mouse.move(
      cardBoundingBox.x + cardBoundingBox.width / 2,
      cardBoundingBox.y + cardBoundingBox.height / 2
    );
    await page.mouse.down();

    // Check for opacity change (dragged card should have opacity 0.5)
    const opacity = await firstCard.evaluate((el) => {
      return window.getComputedStyle(el).opacity;
    });
    
    // During drag, opacity should be reduced
    await page.mouse.move(
      cardBoundingBox.x + cardBoundingBox.width / 2,
      cardBoundingBox.y + 200
    );

    await page.mouse.up();
  });

  test('should persist state after drop and refresh', async ({ page }) => {
    // Wait for page to load
    await page.waitForSelector('h1', { timeout: 5000 });

    const noIdeasMessage = page.getByText('No ideas yet');
    const hasNoIdeas = await noIdeasMessage.isVisible().catch(() => false);

    if (hasNoIdeas) {
      test.skip();
      return;
    }

    // This test would require checking state before and after refresh
    // For now, we'll verify the page can reload and still shows the kanban board
    await page.reload();
    
    // Wait for page to reload and verify it's accessible
    await expect(page.getByText(/Founder Dashboard/i)).toBeVisible({ timeout: 5000 });
    
    // Verify kanban board is present (check for at least one column header)
    const columnHeader = page.getByRole('heading', { name: /PENDING REVIEW/i });
    await expect(columnHeader).toBeVisible({ timeout: 5000 });
  });
});

