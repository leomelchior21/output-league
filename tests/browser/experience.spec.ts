import { test, expect } from '@playwright/test';

test('garage choices persist and update the live rover, tutorial teaches output, reveal protects XP', async ({ page }) => {
  await page.addInitScript(() => {
    (window as any).__bootSeen = false;
    new MutationObserver(() => { if (document.querySelector('.boot-splash')) (window as any).__bootSeen = true; }).observe(document, { childList: true, subtree: true });
  });
  await page.goto('/');
  await expect(page.locator('.boot-splash')).toHaveCount(0);
  expect(await page.evaluate(() => (window as any).__bootSeen)).toBe(true);
  await page.getByRole('button', { name: 'Open settings' }).click();
  await page.getByRole('button', { name: 'Coral comet', exact: true }).click();
  await page.getByRole('button', { name: /bolt/ }).click();
  await page.getByRole('button', { name: 'Solar gold', exact: true }).click();
  await page.getByRole('button', { name: 'Polar circuit', exact: true }).click();
  await page.getByRole('button', { name: 'BACK TO IT' }).click();
  await page.goto('/python/level/1?qa=1');
  await page.getByRole('button', { name: 'Run example' }).click();
  await expect(page.locator('.demo-output')).toHaveText('HI!');
  expect(await page.evaluate(() => (window as any).__arena.match.elapsed)).toBe(0);
  // Observe the brief reveal in the browser, avoiding round-trip races on slow WebKit hosts.
  await page.evaluate(() => {
    const s = (window as any).__arena, record = { seen: false, frozen: true, minimumZoom: 1 };
    (window as any).__reveal = record;
    const sample = () => { if (s.introDone) return; if (!s.controls.paused) { record.seen = true; record.frozen &&= s.match.elapsed === 0; record.minimumZoom = Math.min(record.minimumZoom, s.cameraState.zoom); } requestAnimationFrame(sample); };
    requestAnimationFrame(sample);
  });
  await page.getByRole('button', { name: 'LET’S DRIVE' }).click();
  await expect.poll(() => page.evaluate(() => (window as any).__arena.introDone)).toBe(true);
  const reveal = await page.evaluate(() => (window as any).__reveal);
  expect(reveal.seen).toBe(true); expect(reveal.frozen).toBe(true); expect(reveal.minimumZoom).toBeLessThan(.6);
  const scene = await page.evaluate(() => { const s = (window as any).__arena; return { style: s.pitchStyle, car: s.carKey, trail: s.trailColor, radar: s.guidance.radarTitle.x }; });
  expect(scene).toEqual({ style: 'ice', car: 'coral-bolt', trail: 0xffd079, radar: 357 });
  await page.getByRole('button', { name: 'Pause match', exact: true }).click();
  await page.getByRole('button', { name: 'SETTINGS', exact: true }).click();
  await page.getByRole('button', { name: 'Mint circuit', exact: true }).click();
  await expect.poll(() => page.evaluate(() => (window as any).__arena.carKey)).toBe('mint-bolt');
  await page.getByRole('button', { name: 'BACK TO IT' }).click();
  await page.getByRole('button', { name: 'RESUME MATCH' }).click();
  const oldCode = await page.evaluate(() => (window as any).__arena.match.rounds.map((r: any) => r.code));
  await page.reload();
  await expect.poll(() => page.evaluate(() => (window as any).__arena?.introDone)).toBe(true);
  await expect(page.getByRole('dialog', { name: 'How to play' })).toHaveCount(0);
  expect(await page.evaluate(() => (window as any).__arena.carKey)).toBe('mint-bolt');
  expect(await page.evaluate(() => (window as any).__arena.match.rounds.map((r: any) => r.code))).not.toEqual(oldCode);
});

test('all pitch atmospheres load and reduced motion skips the camera sweep', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('/');
  for (const pitch of ['alpine', 'rain', 'ice', 'worn']) {
    await page.evaluate(pitch => { localStorage.setItem('output-league:tutorial', '1'); localStorage.setItem('output-league:settings', JSON.stringify({ pitch, reducedMotion: true, sound: false })); }, pitch);
    await page.goto('/python/level/1?qa=1');
    await expect.poll(() => page.evaluate(() => (window as any).__arena?.introDone)).toBe(true);
    expect(await page.evaluate(() => (window as any).__arena.pitchStyle)).toBe(pitch);
    expect(await page.evaluate(() => (window as any).__arena.cameraState.zoom)).toBeCloseTo(1.08);
    await expect(page.locator('.code-panel')).toBeVisible();
  }
  expect(errors).toEqual([]);
});

test('repair pit returns the ball and portal rover releases its brief steal without a penalty', async ({ page }) => {
  await page.addInitScript(() => { localStorage.setItem('output-league:tutorial', '1'); localStorage.setItem('output-league:settings', JSON.stringify({ pitch: 'alpine', reducedMotion: true, sound: false })); });
  await page.goto('/python/level/1?qa=1');
  await expect.poll(() => page.evaluate(() => (window as any).__arena?.introDone)).toBe(true);
  const pit = await page.evaluate(() => {
    const s = (window as any).__arena; s.match.round = 8; s.configureRound();
    const o = s.obstacles.find((o: any) => o.kind === 'pothole'); Object.assign(s.ball, { x: o.x, y: o.y, vx: 0, vy: 0 });
    return { x: o.x, y: o.y };
  });
  await expect(page.getByRole('status')).toContainText('POP! BACK IN PLAY');
  expect(await page.evaluate(p => Math.hypot((window as any).__arena.ball.x - p.x, (window as any).__arena.ball.y - p.y), pit)).toBeGreaterThan(60);
  await page.evaluate(() => {
    const s = (window as any).__arena, record = { warned: false, active: false, carried: false, released: false };
    (window as any).__cameo = record; s.botClock = 6;
    const observe = () => {
      if (s.botPhase === 'warning') record.warned = true;
      if (s.botPhase === 'active' && !record.active) { record.active = true; Object.assign(s.bot, { x: 0, y: 0, vx: 0, vy: 0 }); Object.assign(s.ball, { x: 12, y: 0, vx: 0, vy: 0 }); }
      if (s.botCarrying) record.carried = true;
      if (record.active && s.botPhase === 'quiet') { record.released = !s.botCarrying; s.events.off('postupdate', observe); }
    };
    s.events.on('postupdate', observe);
  });
  await expect.poll(() => page.evaluate(() => (window as any).__cameo.released)).toBe(true);
  expect(await page.evaluate(() => (window as any).__cameo)).toEqual({ warned: true, active: true, carried: true, released: true });
  expect(await page.evaluate(() => (window as any).__arena.botCarrying)).toBe(false);
  expect(await page.evaluate(() => (window as any).__arena.match.totalWrong)).toBe(0);
});
