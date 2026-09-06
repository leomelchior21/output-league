import { chromium, expect } from '@playwright/test';
const browser = await chromium.launch({ args: ['--disable-gpu'] });
try {
  const page = await browser.newPage({ viewport: { width: 1024, height: 768 } });
  const errors = [], external = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('request', request => { if (!request.url().startsWith('http://127.0.0.1:5187') && !request.url().startsWith('data:')) external.push(request.url()); });
  await page.goto('http://127.0.0.1:5187/');
  await expect(page.locator('.boot-splash')).toHaveCount(0);
  await page.getByRole('button', { name: 'PLAY', exact: true }).click();
  await page.getByRole('button', { name: /Level 1:/ }).click();
  await page.getByRole('button', { name: 'PLAY MATCH' }).click();
  await page.getByRole('button', { name: 'LET’S DRIVE' }).click();
  await expect(page.locator('canvas')).toBeVisible();
  await expect(page.locator('.arena-intro-active')).toHaveCount(0, { timeout: 15000 });
  await expect(page.locator('.code-line')).toContainText(/print\([2-9]\)/);
  expect(await page.evaluate(() => typeof window.__arena)).toBe('undefined');
  expect(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight)).toBe(true);
  expect(errors).toEqual([]); expect(external).toEqual([]);
  await page.screenshot({ path: 'artifacts/arena-production-1024.png' });
  console.log('Production smoke passed: full navigation, canvas, code, 1024×768 fit, no external requests, no QA hook, no browser errors.');
} finally { await browser.close(); }
