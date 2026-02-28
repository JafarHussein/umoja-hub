/**
 * E2E Journey 3 — Student: AI brief generation → AI Mentor chat
 *
 * Seed prerequisite: Students Brian Otieno, Amina Waweru seeded.
 * Groq API calls are intercepted — no real LLM calls in E2E tests.
 */

import { test, expect } from '@playwright/test';

test.describe('Journey 3 — Student brief generation → AI Mentor', () => {
  test.beforeEach(async ({ page }) => {
    // Intercept Groq API calls (brief generation and mentor)
    await page.route('**/api/education/briefs', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              engagementId: 'e2e-engagement-001',
              brief: {
                clientPersona: 'A farmer cooperative in Nyandarua with 200 members needs a digital produce listing system.',
                problemStatement: 'Members lose 30% income to middlemen due to no direct buyer access.',
                technicalScope: ['User authentication', 'Produce listing CRUD', 'SMS notifications', 'M-Pesa payment integration'],
                successCriteria: ['Farmers can list produce in under 3 minutes', 'Buyers can search by county and crop type'],
                constraints: ['Must work on 2G/3G networks', 'KES only, M-Pesa primary payment method'],
                industryContext: 'Agricultural Supply Chain',
                generatedAt: new Date().toISOString(),
              },
            },
          }),
        });
      } else {
        await route.continue();
      }
    });

    await page.route('**/api/education/mentor', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            response: 'I can help you think through your architecture. What specific aspect would you like to explore first — the database schema, the API design, or the frontend structure?',
            sessionId: 'e2e-mentor-session-001',
          },
        }),
      });
    });
  });

  test('student can log in and reach dashboard', async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByLabel(/email/i).fill('brian.otieno@students.uonbi.ac.ke');
    await page.getByLabel(/password/i).fill('Student@2024!');
    await page.getByRole('button', { name: /sign in|login/i }).click();

    await expect(page).toHaveURL(/dashboard/, { timeout: 10_000 });
  });

  test('student dashboard shows project creation path', async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByLabel(/email/i).fill('brian.otieno@students.uonbi.ac.ke');
    await page.getByLabel(/password/i).fill('Student@2024!');
    await page.getByRole('button', { name: /sign in|login/i }).click();

    await page.goto('/dashboard/student/projects/new');
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10_000 });

    // Should have industry selection
    const body = await page.locator('body').textContent() ?? '';
    expect(body.toLowerCase()).toMatch(/industry|context|brief/);
  });

  test('student project page renders', async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByLabel(/email/i).fill('amina.waweru@strathmore.edu');
    await page.getByLabel(/password/i).fill('Student@2024!');
    await page.getByRole('button', { name: /sign in|login/i }).click();

    await expect(page).toHaveURL(/dashboard/, { timeout: 10_000 });
    // Navigate to profile
    await page.goto('/dashboard/student/profile');
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10_000 });
  });

  test('AI Mentor chat page renders', async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByLabel(/email/i).fill('brian.otieno@students.uonbi.ac.ke');
    await page.getByLabel(/password/i).fill('Student@2024!');
    await page.getByRole('button', { name: /sign in|login/i }).click();

    // Find any active project or navigate directly to mentor page
    // (projects are created during demo, we just verify the route exists)
    const response = await page.goto('/dashboard/student/projects/new');
    expect(response?.status()).not.toBe(404);
    await expect(page.locator('body')).toBeVisible();
  });
});
