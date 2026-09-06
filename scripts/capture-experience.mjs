import { chromium, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
await mkdir('artifacts', { recursive: true });
const browser = await chromium.launch({ args: ['--disable-gpu'] });
try {
  const page = await browser.newPage({ viewport: { width: 1194, height: 834 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('http://127.0.0.1:5186/');
  await page.waitForTimeout(650); await page.screenshot({ path: 'artifacts/logo-intro.png' });
  await expect(page.locator('.boot-splash')).toHaveCount(0);
  await page.getByRole('button', { name: 'Open settings' }).click();
  await page.getByRole('button', { name: 'Coral comet', exact: true }).click();
  await page.getByRole('button', { name: /bolt/ }).click();
  await page.getByRole('button', { name: 'Solar gold', exact: true }).click();
  await page.screenshot({ path: 'artifacts/garage.png' });
  await page.getByRole('button', { name: 'BACK TO IT' }).click();
  await page.goto('http://127.0.0.1:5186/python/level/1?qa=1');
  await page.getByRole('button', { name: 'Run example' }).click();
  await page.waitForTimeout(550); await page.screenshot({ path: 'artifacts/tutorial.png' });
  await page.getByRole('button', { name: 'LET’S DRIVE' }).click();
  await page.waitForTimeout(350); await page.screenshot({ path: 'artifacts/stadium-reveal.png' });
  for (const pitch of ['alpine', 'rain', 'ice', 'worn']) {
    await page.evaluate(pitch => { const s = JSON.parse(localStorage.getItem('output-league:settings')); s.pitch = pitch; localStorage.setItem('output-league:settings', JSON.stringify(s)); }, pitch);
    await page.reload();
    try { await expect.poll(() => page.evaluate(() => window.__arena?.introDone), { timeout: 15000 }).toBe(true); } catch (error) { console.log(await page.evaluate(() => ({ paused: window.__arena?.controls.paused, intro: window.__arena?.introElapsed, dialogs: [...document.querySelectorAll('dialog')].map(d => d.textContent) }))); await page.screenshot({ path: 'artifacts/experience-error.png' }); throw error; }
    await page.evaluate(() => { const s = window.__arena, g = s.goals[0]; Object.assign(s.player, { x: g.x - g.nx * 220, y: g.y - g.ny * 220, vx: 0, vy: 0 }); Object.assign(s.ball, { x: g.x - g.nx * 150, y: g.y - g.ny * 150, vx: 0, vy: 0 }); s.facing = Math.atan2(g.ny, g.nx); });
    await page.waitForTimeout(800); await page.screenshot({ path: `artifacts/pitch-${pitch}.png` });
  }
  for (const correct of [false, true]) {
    await page.evaluate(correct => { const s = window.__arena, g = s.goals.find(g => g.active && (correct ? g.output === s.match.targetOutput : g.output !== s.match.targetOutput)); Object.assign(s.ball, { x: g.x - g.nx * 35, y: g.y - g.ny * 35, vx: g.nx * 500, vy: g.ny * 500 }); }, correct);
    await expect(page.locator(correct ? '.spectacle-correct' : '.spectacle-wrong')).toBeVisible();
    await page.waitForTimeout(300); await page.screenshot({ path: `artifacts/goal-${correct ? 'celebration' : 'wrong'}.png` });
    await expect.poll(() => page.evaluate(() => window.__arena.transition)).toBeLessThanOrEqual(0);
  }
  expect(errors).toEqual([]);
  console.log('Captured garage, tutorial, reveal, four pitches, and both goal reactions without browser errors.');
} finally { await browser.close(); }
