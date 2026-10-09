import { test, expect } from '@playwright/test';

test.describe('Main User Flow', () => {
  test('Complete application flow', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await expect(page.locator('text=Punjab AI Education Platform')).toBeVisible();

    await page.click('text=Login');
    await page.fill('input[type="email"]', 'teacher1@school.edu');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/teacher/dashboard');
    await expect(page.locator('text=Teacher Dashboard')).toBeVisible();

    await page.click('text=Create Class');
    await page.fill('input[name="name"]', 'E2E Test Class');
    await page.fill('input[name="grade"]', '8');
    await page.fill('input[name="subject"]', 'Science');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/teacher/classes');
    const joinCodeElement = page.locator('.badge').first();
    const joinCode = await joinCodeElement.textContent();
    console.log('Join Code:', joinCode);

    await page.click('text=Logout');

    await page.fill('input[type="email"]', 'student1@school.edu');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/student/dashboard');
    await expect(page.locator('text=Student Dashboard')).toBeVisible();

    await page.click('text=Join Class');
    await page.fill('input[name="joinCode"]', joinCode || 'MATH7A');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/student/dashboard');
    await expect(page.locator('text=E2E Test Class').or(page.locator('text=Math Class 7A'))).toBeVisible();

    await page.click('text=Logout');

    await page.fill('input[type="email"]', 'teacher1@school.edu');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/teacher/dashboard');
    await page.click('text=Curriculum');
    await expect(page.locator('text=Upload Curriculum')).toBeVisible();

    await page.click('text=Logout');
  });
});
