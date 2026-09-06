import { chromium, expect } from '@playwright/test';
const browser = await chromium.launch({ args: ['--disable-gpu'] });
try {
  const page = await browser.newPage({ viewport: { width: 1194, height: 834 } });
  await page.goto('http://127.0.0.1:5186/python/level/1?qa=1');
  await page.getByRole('button', { name: 'LET’S DRIVE' }).click();
  await expect.poll(() => page.evaluate(() => window.__arena?.introDone), { timeout: 15000 }).toBe(true);
  await page.evaluate(() => {
    const s = window.__arena, goal = s.goals.find(g => g.output === s.match.targetOutput);
    Object.assign(s.player, { x: goal.x - goal.nx * 210, y: goal.y - goal.ny * 210, vx: 0, vy: 0 });
    Object.assign(s.ball, { x: goal.x - goal.nx * 140, y: goal.y - goal.ny * 140, vx: 0, vy: 0 });
    s.facing = Math.atan2(goal.ny, goal.nx);
  });
  await page.waitForTimeout(700); await page.screenshot({ path: 'artifacts/goal-approach.png' });
  await page.evaluate(() => {
    const s = window.__arena, goal = s.goals[0];
    Object.assign(s.player, { x: goal.x - goal.nx * 235, y: goal.y - goal.ny * 235, vx: 0, vy: 0 });
    Object.assign(s.ball, { x: goal.x - goal.nx * 150, y: goal.y - goal.ny * 150, vx: 0, vy: 0 });
    s.facing = Math.atan2(goal.ny, goal.nx);
  });
  await page.waitForTimeout(850); await page.screenshot({ path: 'artifacts/angled-goal.png' });
  await page.evaluate(() => { const s = window.__arena; s.resetPositions(); });
  await page.keyboard.down('d'); await page.keyboard.down('Shift'); await page.waitForTimeout(700);
  await page.keyboard.up('d'); await page.keyboard.down('w'); await page.waitForTimeout(250);
  await page.screenshot({ path: 'artifacts/boost-drift.png' });
  await page.keyboard.up('w'); await page.keyboard.up('Shift');
  console.log('Captured top-down goal approach, angled net, and boost/drift.');
} finally { await browser.close(); }
