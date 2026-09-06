import { webkit, devices, expect } from '@playwright/test';
const browser = await webkit.launch();
try {
  const page = await browser.newPage({ ...devices['iPad Pro 11 landscape'], viewport: { width: 1194, height: 834 } });
  await page.goto('http://127.0.0.1:5186/python/level/1?qa=1');
  await page.getByRole('button', { name: 'LET’S DRIVE' }).click();
  await expect.poll(() => page.evaluate(() => window.__arena?.introDone), { timeout: 15000 }).toBe(true);
  for (let i = 0; i < 4; i++) {
    await page.waitForTimeout(1500);
    console.log(await page.evaluate(() => { const s = window.__arena; return { fps: s.game.loop.actualFps, delta: s.game.loop.delta, raw: s.game.loop.rawDelta, elapsed: s.elapsed, matchTime: s.match.elapsed, paused: s.controls.paused, visibility: document.visibilityState, frames: s.game.loop.frame }; }));
  }
} finally { await browser.close(); }
