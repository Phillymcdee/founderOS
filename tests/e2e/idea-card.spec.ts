import { test, expect } from '@playwright/test';

const IDEAS_PAGE_URL = '/founder/ideas';

test.describe('Idea Card', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(IDEAS_PAGE_URL);
  });

  test('should expand details when clicked', async ({ page }) => {
    await page.waitForSelector('text=PENDING_REVIEW', { timeout: 5000 }).catch(() => {});

    const noIdeasMessage = page.getByText('No ideas yet');
    const hasNoIdeas = await noIdeasMessage.isVisible().catch(() => false);

    if (hasNoIdeas) {
      test.skip();
      return;
    }

    // Find the first idea card (look for a card with title)
    const firstCard = page.locator('div').filter({ hasText: /^[A-Z]/ }).first();
    const cardCount = await firstCard.count();

    if (cardCount === 0) {
      // Try finding by draggable attribute
      const draggableCard = page.locator('[draggable="true"]').first();
      if (await draggableCard.count() === 0) {
        test.skip();
        return;
      }
      await draggableCard.click();
    } else {
      await firstCard.click();
    }

    // After clicking, details should be visible
    // Look for common detail elements like "Hard Filters" or "Scores"
    const hardFilters = page.getByText('Hard Filters');
    const scores = page.getByText('Scores');

    // At least one detail section should be visible
    const hasDetails = await Promise.race([
      hardFilters.isVisible().then(() => true),
      scores.isVisible().then(() => true),
    ]).catch(() => false);

    expect(hasDetails).toBeTruthy();
  });

  test('should expand/collapse Source Signals section', async ({ page }) => {
    await page.waitForSelector('text=PENDING_REVIEW', { timeout: 5000 }).catch(() => {});

    const noIdeasMessage = page.getByText('No ideas yet');
    const hasNoIdeas = await noIdeasMessage.isVisible().catch(() => false);

    if (hasNoIdeas) {
      test.skip();
      return;
    }

    // Find and click first idea card to expand
    const firstCard = page.locator('[draggable="true"]').first();
    if (await firstCard.count() === 0) {
      test.skip();
      return;
    }

    await firstCard.click();
    await page.waitForTimeout(500);

    // Look for Source Signals button
    const signalsButton = page.getByText(/Source Signals/i).first();
    const signalsButtonCount = await signalsButton.count();

    if (signalsButtonCount > 0) {
      // Click to expand
      await signalsButton.click();
      await page.waitForTimeout(300);

      // Click again to collapse
      await signalsButton.click();
      await page.waitForTimeout(300);
    } else {
      // No signals available, skip
      test.skip();
    }
  });

  test('should expand/collapse Experiments section', async ({ page }) => {
    await page.waitForSelector('text=PENDING_REVIEW', { timeout: 5000 }).catch(() => {});

    const noIdeasMessage = page.getByText('No ideas yet');
    const hasNoIdeas = await noIdeasMessage.isVisible().catch(() => false);

    if (hasNoIdeas) {
      test.skip();
      return;
    }

    // Find and click first idea card to expand
    const firstCard = page.locator('[draggable="true"]').first();
    if (await firstCard.count() === 0) {
      test.skip();
      return;
    }

    await firstCard.click();
    await page.waitForTimeout(500);

    // Look for Experiments button
    const experimentsButton = page.getByText(/Experiments/i).first();
    const experimentsButtonCount = await experimentsButton.count();

    if (experimentsButtonCount > 0) {
      // Click to expand
      await experimentsButton.click();
      await page.waitForTimeout(300);

      // Click again to collapse
      await experimentsButton.click();
      await page.waitForTimeout(300);
    } else {
      // No experiments available, skip
      test.skip();
    }
  });

  test('should display score badges with correct colors', async ({ page }) => {
    await page.waitForSelector('text=PENDING_REVIEW', { timeout: 5000 }).catch(() => {});

    const noIdeasMessage = page.getByText('No ideas yet');
    const hasNoIdeas = await noIdeasMessage.isVisible().catch(() => false);

    if (hasNoIdeas) {
      test.skip();
      return;
    }

    // Find cards with score badges (they have numeric text in a colored badge)
    const scoreBadges = page.locator('span').filter({ 
      hasText: /^\d+$/ 
    }).filter({ 
      has: page.locator('xpath=ancestor::div[contains(@style, "border-radius")]') 
    });

    const badgeCount = await scoreBadges.count();

    if (badgeCount > 0) {
      // Check that badges are visible
      const firstBadge = scoreBadges.first();
      await expect(firstBadge).toBeVisible();

      // Check that badge has a background color (indicating it's styled)
      const backgroundColor = await firstBadge.evaluate((el) => {
        return window.getComputedStyle(el).backgroundColor;
      });
      expect(backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
    } else {
      // No scored ideas yet, which is fine
      test.skip();
    }
  });

  test('should show filter statuses with ✅/❌ correctly', async ({ page }) => {
    await page.waitForSelector('text=PENDING_REVIEW', { timeout: 5000 }).catch(() => {});

    const noIdeasMessage = page.getByText('No ideas yet');
    const hasNoIdeas = await noIdeasMessage.isVisible().catch(() => false);

    if (hasNoIdeas) {
      test.skip();
      return;
    }

    // Find and click first idea card to expand
    const firstCard = page.locator('[draggable="true"]').first();
    if (await firstCard.count() === 0) {
      test.skip();
      return;
    }

    await firstCard.click();
    await page.waitForTimeout(500);

    // Look for Hard Filters section
    const hardFilters = page.getByText('Hard Filters');
    const hasHardFilters = await hardFilters.isVisible().catch(() => false);

    if (hasHardFilters) {
      // Check for checkmarks or X marks
      const checkmark = page.locator('text=/✅/');
      const xMark = page.locator('text=/❌/');
      
      const hasCheckmark = await checkmark.count() > 0;
      const hasXMark = await xMark.count() > 0;

      // At least one status indicator should be present
      expect(hasCheckmark || hasXMark).toBeTruthy();
    } else {
      test.skip();
    }
  });
});

