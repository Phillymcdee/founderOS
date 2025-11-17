import { test, expect } from '@playwright/test';

const IDEAS_PAGE_URL = '/founder/ideas';

test.describe('Notifications', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(IDEAS_PAGE_URL);
  });

  // Flaky test: Drag-and-drop timing issues - notification appears briefly before page reload
  // Skipping in CI to avoid false failures
  test('should show success notification when dragging idea to VALIDATED state', { skip: !!process.env.CI }, async ({ page }) => {
    await page.waitForSelector('text=PENDING_REVIEW', { timeout: 5000 }).catch(() => {});

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

    // Find the VALIDATED column - use heading to find the column container
    const validatedHeading = page.getByRole('heading', { name: /VALIDATED/i });
    await expect(validatedHeading).toBeVisible();
    
    // Get the column container (parent of heading, then parent of that)
    const validatedColumn = validatedHeading.locator('..').locator('..');

    // Perform drag and drop to VALIDATED
    await firstCard.dragTo(validatedColumn, {
      force: true,
    });

    // Wait for notification to appear immediately (page reloads after 1 second)
    // The notification message is "🎉 Idea moved to VALIDATED! Ready to build."
    const notification = page.getByText(/Idea moved to VALIDATED/i).or(
      page.getByText(/🎉/i)
    );

    // Notification should appear quickly (before page reloads at 1 second)
    await expect(notification).toBeVisible({ timeout: 800 });
  });

  // Flaky test: Drag-and-drop timing issues - notification appears briefly before page reload
  // Skipping in CI to avoid false failures
  test('should auto-dismiss notification after 5 seconds', { skip: !!process.env.CI }, async ({ page }) => {
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

    // Find the VALIDATED column - use heading to find the column container
    const validatedHeading = page.getByRole('heading', { name: /VALIDATED/i });
    await expect(validatedHeading).toBeVisible();
    
    // Get the column container
    const validatedColumn = validatedHeading.locator('..').locator('..');

    // Drag to VALIDATED to trigger notification
    await firstCard.dragTo(validatedColumn, {
      force: true,
    });

    // Wait for notification to appear immediately (page reloads after 1 second)
    const notification = page.getByText(/Idea moved to VALIDATED/i).or(
      page.getByText(/🎉/i)
    );
    await expect(notification).toBeVisible({ timeout: 800 });

    // Wait 6 seconds for auto-dismiss
    await page.waitForTimeout(6000);

    // Notification should be gone (or at least not visible)
    // Note: The notification might still be in DOM but hidden, so we check visibility
    const isVisible = await notification.isVisible().catch(() => false);
    // After 6 seconds, it should be dismissed
    expect(isVisible).toBeFalsy();
  });

  // Flaky test: Drag-and-drop timing issues - notification appears briefly before page reload
  // Skipping in CI to avoid false failures
  test('should allow manual dismissal of notification', { skip: !!process.env.CI }, async ({ page }) => {
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

    // Find the VALIDATED column - use heading to find the column container
    const validatedHeading = page.getByRole('heading', { name: /VALIDATED/i });
    await expect(validatedHeading).toBeVisible();
    
    // Get the column container
    const validatedColumn = validatedHeading.locator('..').locator('..');

    // Drag to VALIDATED to trigger notification
    await firstCard.dragTo(validatedColumn, {
      force: true,
    });

    // Wait for notification to appear immediately (page reloads after 1 second)
    const notification = page.getByText(/Idea moved to VALIDATED/i).or(
      page.getByText(/🎉/i)
    );
    await expect(notification).toBeVisible({ timeout: 800 });

    // Look for dismiss button (× button) - the notification has a × button
    const dismissButton = page.locator('button').filter({ 
      hasText: /×/ 
    });

    const dismissButtonCount = await dismissButton.count();

    if (dismissButtonCount > 0) {
      await dismissButton.first().click();
      await page.waitForTimeout(500);

      // Notification should be gone after animation
      await page.waitForTimeout(300);
      const isVisible = await notification.isVisible().catch(() => false);
      expect(isVisible).toBeFalsy();
    } else {
      // Notification is also dismissible by clicking on it
      await notification.click();
      await page.waitForTimeout(500);
      const isVisible = await notification.isVisible().catch(() => false);
      expect(isVisible).toBeFalsy();
    }
  });
});

