import { test, expect, type Page } from '@playwright/test';

async function enterArena(page: Page) {
  await page.goto('/python/level/1?qa=1');
  await page.getByRole('button', { name: 'LET’S DRIVE' }).click();
  await expect(page.locator('canvas')).toBeVisible();
  await expect.poll(() => page.evaluate(() => (window as any).__arena.introDone)).toBe(true);
}
async function shoot(page: Page, correct = true) {
  await page.evaluate((correct) => {
    const scene = (window as any).__arena;
    const goal = scene.goals.find((g: any) => g.active && (correct ? g.output === scene.match.targetOutput : g.output !== scene.match.targetOutput));
    const magnitude = Math.hypot(goal.x, goal.y), nx = goal.x / magnitude, ny = goal.y / magnitude;
    scene.player.x = 0; scene.player.y = 110;
    scene.ball.x = goal.x - nx * 57; scene.ball.y = goal.y - ny * 57;
    scene.ball.vx = nx * 500; scene.ball.vy = ny * 500;
  }, correct);
}

test('launcher, locked content, journey, and settings fit iPad landscape', async ({ page }, testInfo) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('/');
  await expect(page.locator('.boot-splash')).toHaveCount(0);
  await expect(page.getByAltText('OUTPUT LEAGUE. Code. Think. Score.')).toBeVisible();
  await page.getByRole('button', { name: /C#.*COMING SOON/ }).click({ force: true });
  await expect(page.getByRole('status')).toContainText('C# — COMING SOON');
  await page.getByRole('button', { name: 'Open settings' }).click();
  await page.getByRole('switch', { name: /Sound effects/ }).click();
  await expect(page.getByRole('switch', { name: /Sound effects/ })).toHaveAttribute('aria-checked', 'false');
  await page.getByRole('button', { name: 'BACK TO IT' }).click();
  await page.getByRole('button', { name: 'PLAY', exact: true }).click();
  await expect(page).toHaveURL(/\/python$/);
  for (const size of [{width:1024,height:768},{width:1180,height:820},{width:1194,height:834}]) {
    await page.setViewportSize(size);
    const nodes = await page.locator('.level-node').evaluateAll(elements => elements.map(element => { const r = element.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.x >= 0 && r.y >= 0 && r.right <= innerWidth && r.bottom <= innerHeight; }));
    expect(nodes).toEqual(Array(8).fill(true));
    expect(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight && document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.getByRole('button', { name: /Level 2:/ }).click({ force: true });
  await expect(page.getByRole('status')).toContainText('SIMPLE VARIABLES — COMING SOON');
  await expect(page).toHaveURL(/\/python$/);
  await page.screenshot({ path: `test-results/journey-${testInfo.project.name}.png` });
  await page.getByRole('button', { name: /Level 1:/ }).click();
  await page.getByRole('button', { name: 'PLAY MATCH' }).click();
  await expect(page.getByRole('dialog', { name: 'How to play' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('real controls, physics goals, all ten rounds, mastery, results and replay', async ({ page }, testInfo) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await enterArena(page);
  await page.screenshot({ path: `test-results/arena-${testInfo.project.name}.png` });
  const startX = await page.evaluate(() => (window as any).__arena.player.x);
  await page.keyboard.down('d');
  await expect.poll(() => page.evaluate(() => (window as any).__arena.player.x)).toBeGreaterThan(startX + 40);
  await page.keyboard.up('d');
  await page.evaluate(() => { const s = (window as any).__arena; s.player.x = 0; s.player.y = 115; s.player.vx = 0; s.player.vy = 0; s.ball.x = 0; s.ball.y = 35; s.ball.vx = 0; s.ball.vy = 0; s.facing = -Math.PI / 2; });
  await page.keyboard.press('Space');
  await expect.poll(() => page.evaluate(() => (window as any).__arena.match.kickCount)).toBe(1);
  await expect.poll(() => page.evaluate(() => (window as any).__arena.match.round)).toBe(1);
  await shoot(page, false);
  await expect(page.getByRole('status')).toContainText('WRONG OUTPUT');
  await expect(page.locator('.spectacle-wrong')).toBeVisible();
  expect(await page.evaluate(() => (window as any).__arena.match.round)).toBe(1);
  expect(await page.evaluate(() => (window as any).__arena.match.streak)).toBe(0);
  await expect.poll(() => page.evaluate(() => (window as any).__arena.transition)).toBeLessThanOrEqual(0);
  // Pause freezes XP and the simulation.
  await page.getByRole('button', { name: 'Pause match', exact: true }).click();
  const pausedXP = await page.evaluate(() => (window as any).__arena.match.elapsed);
  await page.waitForTimeout(350);
  expect(await page.evaluate(() => (window as any).__arena.match.elapsed)).toBe(pausedXP);
  await page.getByRole('button', { name: 'RESUME MATCH' }).click();
  for (let round = 1; round < 9; round++) {
    if (round === 4) expect(await page.evaluate(() => (window as any).__arena.obstacles.some((o: any) => o.kind === 'moving-wall'))).toBe(true);
    if (round === 6) expect(await page.evaluate(() => !!(window as any).__arena.bot)).toBe(true);
    if (round === 7) {
      expect(await page.evaluate(() => (window as any).__arena.goals.filter((g: any) => g.active).length)).toBe(4);
      const before = await page.evaluate(() => (window as any).__arena.goals[6].y); await page.waitForTimeout(200);
      expect(await page.evaluate(() => (window as any).__arena.goals[6].y)).not.toBe(before);
    }
    if (round === 8) expect(await page.evaluate(() => (window as any).__arena.obstacles.some((o: any) => o.kind === 'disappearing-wall'))).toBe(true);
    await shoot(page);
    await expect.poll(() => page.evaluate(() => (window as any).__arena.match.round)).toBe(round + 1);
  }
  await shoot(page); await expect.poll(() => page.evaluate(() => (window as any).__arena.match.phase)).toBe(1);
  await expect(page.locator('.code-line.line-done')).toHaveCount(1);
  await expect.poll(() => page.evaluate(() => (window as any).__arena.transition)).toBeLessThanOrEqual(0); await shoot(page);
  await expect(page.getByRole('dialog', { name: 'PRINT learning recap' })).toBeVisible();
  await page.getByRole('button', { name: 'Run example' }).click();
  await expect(page.locator('.demo-output')).toHaveCount(2);
  await page.getByRole('button', { name: 'SEE MY SCORE' }).click();
  await expect(page.getByRole('dialog', { name: 'Level complete' })).toBeVisible();
  await expect(page.locator('.total-score strong')).not.toHaveText('0XP');
  await page.screenshot({ path: `test-results/results-${testInfo.project.name}.png` });
  await page.getByRole('button', { name: 'REPLAY', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Level complete' })).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => (window as any).__arena.match.round)).toBe(0);
  await expect(page.getByRole('dialog', { name: 'How to play' })).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => (window as any).__arena.introDone)).toBe(true);
  await page.getByRole('button', { name: 'Pause match', exact: true }).click();
  await page.getByRole('button', { name: 'BACK TO JOURNEY', exact: true }).click();
  await expect(page.getByRole('button', { name: /Level 2:/ })).toHaveAttribute('aria-disabled', 'true');
  await expect(page.locator('.node-play')).toContainText('REPLAY · BEST');
  expect(errors).toEqual([]);
});

test('pointer joystick has analog magnitude and boost responds while steering', async ({ page }) => {
  await enterArena(page);
  const joystick = page.locator('.joystick'); const box = (await joystick.boundingBox())!;
  const cx = box.x + box.width / 2, cy = box.y + box.height / 2;
  await page.mouse.move(cx, cy); await page.mouse.down(); await page.mouse.move(cx + box.width * .14, cy);
  const small = await page.evaluate(() => (window as any).__arena.controls.x); expect(small).toBeGreaterThan(.4); expect(small).toBeLessThan(.6);
  await page.mouse.move(cx + box.width, cy); expect(await page.evaluate(() => (window as any).__arena.controls.x)).toBeCloseTo(1);
  await page.keyboard.down('Shift'); await page.waitForTimeout(250);
  expect(await page.evaluate(() => (window as any).__arena.boostEnergy)).toBeLessThan(1);
  await page.keyboard.up('Shift'); await page.mouse.up();
  expect(await page.evaluate(() => (window as any).__arena.controls.x)).toBe(0);
  await page.evaluate(() => { (window as any).__arena.player.x = -300; (window as any).__arena.player.y = 0; });
  await page.keyboard.press('Space'); await expect(page.getByRole('status')).toContainText('GET CLOSER');
});

test('two touch pointers can steer and boost together, then release cleanly', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'Raw multi-touch injection uses Chromium CDP; pointer controls also run in WebKit.');
  await enterArena(page);
  const joystick = (await page.locator('.joystick').boundingBox())!;
  const boost = (await page.locator('.boost-button').boundingBox())!;
  const kick = (await page.locator('.kick-button').boundingBox())!;
  const cdp = await page.context().newCDPSession(page);
  const steering = { id: 1, x: joystick.x + joystick.width * .75, y: joystick.y + joystick.height / 2, radiusX: 5, radiusY: 5, force: 1 };
  const boosting = { id: 2, x: boost.x + boost.width / 2, y: boost.y + boost.height / 2, radiusX: 5, radiusY: 5, force: 1 };
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [steering] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [steering, boosting] });
  await expect.poll(() => page.evaluate(() => { const c = (window as any).__arena.controls; return c.x > .5 && c.boost; })).toBe(true);
  await expect.poll(() => page.evaluate(() => (window as any).__arena.boostEnergy)).toBeLessThan(.95);
  // An exhausted boost must recharge instead of rapidly alternating sound/speed.
  await page.evaluate(() => { (window as any).__arena.boostEnergy = .01; });
  await expect.poll(() => page.evaluate(() => (window as any).__arena.boostExhausted)).toBe(true);
  await expect.poll(() => page.evaluate(() => (window as any).__arena.boostEnergy)).toBeGreaterThan(.08);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect.poll(() => page.evaluate(() => { const c = (window as any).__arena.controls; return c.x === 0 && !c.boost; })).toBe(true);
  await page.evaluate(() => { const s = (window as any).__arena; Object.assign(s.player, { x: 0, y: 100, vx: 0, vy: 0 }); Object.assign(s.ball, { x: 0, y: 35, vx: 0, vy: 0 }); s.facing = -Math.PI / 2; });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ id: 3, x: kick.x + kick.width / 2, y: kick.y + kick.height / 2 }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect.poll(() => page.evaluate(() => (window as any).__arena.match.kickCount)).toBe(1);
});

test('larger octagonal field follows the car, keeps UI fixed, and rolls the ball', async ({ page }) => {
  await enterArena(page);
  const codeBefore = (await page.locator('.code-panel').boundingBox())!;
  await page.keyboard.down('d'); await page.keyboard.down('Shift');
  await expect.poll(() => page.evaluate(() => (window as any).__arena.player.x)).toBeGreaterThan(360);
  await page.keyboard.up('d'); await page.keyboard.up('Shift');
  await expect.poll(() => page.evaluate(() => (window as any).__arena.cameraState.x)).toBeGreaterThan(250);
  const view = await page.evaluate(() => {
    const s = (window as any).__arena;
    return { x: 600 + (s.player.x - s.cameraState.x) * s.cameraState.zoom, y: 400 + (s.player.y - s.cameraState.y) * s.cameraState.zoom, rotation: s.cameras.main.rotation, goals: s.goals.length, normals: s.goals.map((g: any) => g.index), trails: s.trails.length };
  });
  expect(view.x).toBeGreaterThan(350); expect(view.x).toBeLessThan(850);
  expect(view.y).toBeGreaterThan(170); expect(view.y).toBeLessThan(610);
  expect(view.rotation).toBe(0); expect(view.goals).toBe(6); expect(view.normals).toEqual([0, 1, 2, 4, 5, 6]);
  expect(view.trails).toBeGreaterThan(3); expect(view.trails).toBeLessThanOrEqual(240);
  const codeAfter = (await page.locator('.code-panel').boundingBox())!;
  expect(codeAfter.x).toBeCloseTo(codeBefore.x); expect(codeAfter.y).toBeCloseTo(codeBefore.y);
  const rotation = await page.evaluate(() => { const s = (window as any).__arena; Object.assign(s.ball, { x: 0, y: 0, vx: 250, vy: 100 }); return JSON.stringify(s.ballArt.rotation); });
  await expect.poll(() => page.evaluate(() => JSON.stringify((window as any).__arena.ballArt.rotation))).not.toBe(rotation);
  await page.getByRole('button', { name: 'Pause match', exact: true }).click();
  const paused = await page.evaluate(() => JSON.stringify((window as any).__arena.cameraState));
  await page.waitForTimeout(250);
  expect(await page.evaluate(() => JSON.stringify((window as any).__arena.cameraState))).toBe(paused);
});
