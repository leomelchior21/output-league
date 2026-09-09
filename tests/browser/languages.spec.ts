import { expect, test } from '@playwright/test';

test('three language cards fit supported iPad landscape sizes and launch their journeys', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.boot-splash')).toHaveCount(0);
  for (const size of [{ width: 1024, height: 768 }, { width: 1180, height: 820 }, { width: 1194, height: 834 }]) {
    await page.setViewportSize(size);
    const cards = await page.locator('.language-card').evaluateAll(elements => elements.map(element => {
      const box = element.getBoundingClientRect();
      return box.width > 0 && box.height > 0 && box.left >= 0 && box.top >= 0 && box.right <= innerWidth && box.bottom <= innerHeight;
    }));
    expect(cards).toEqual([true, true, true]);
    expect(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight)).toBe(true);
  }
  for (const language of [{ name: /C#.*CHOOSE JOURNEY/, route: 'csharp', heading: 'Your C# journey' }, { name: /Swift.*CHOOSE JOURNEY/, route: 'swift', heading: 'Your Swift journey' }]) {
    await page.goto('/');
    await page.getByRole('button', { name: language.name }).click();
    await page.getByRole('button', { name: 'PLAY', exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/${language.route}$`));
    await expect(page.getByRole('heading', { name: `${language.heading}.` })).toBeVisible();
    await expect(page.locator('.level-node')).toHaveCount(8);
    await expect(page.locator('.coming-soon-label')).toHaveCount(4);
  }
});

test('C# and Swift progress stay independent', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('output-league:csharp:level-progress', JSON.stringify({ 1: { bestScore: 800, stars: 2, complete: true } })));
  await page.goto('/csharp');
  await expect(page.getByRole('button', { name: /Level 2:/ })).toHaveAttribute('aria-disabled', 'false');
  await page.goto('/swift');
  await expect(page.getByRole('button', { name: /Level 2:/ })).toHaveAttribute('aria-disabled', 'true');
});

test('all three Level 4 arenas load the correct language content', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('output-league:tutorial', '1');
    localStorage.setItem('output-league:settings', JSON.stringify({ reducedMotion: true, sound: false }));
    const unlocked = JSON.stringify({ 1: { complete: true }, 2: { complete: true }, 3: { complete: true } });
    localStorage.setItem('output-league:level-progress', unlocked);
    localStorage.setItem('output-league:csharp:level-progress', unlocked);
    localStorage.setItem('output-league:swift:level-progress', unlocked);
  });
  const cases = [
    { route: 'python', label: 'PYTHON', output: '5.0', code: 'energy = energy / 4' },
    { route: 'csharp', label: 'C#', output: '2', code: 'Console.WriteLine(x / y);' },
    { route: 'swift', label: 'SWIFT', output: '2', code: 'print(x / y)' },
  ];
  for (const item of cases) {
    await page.goto(`/${item.route}/level/4?qa=1`);
    await expect.poll(() => page.evaluate(() => Boolean((window as any).__arena))).toBe(true);
    await expect(page.locator('.code-panel-label').first()).toContainText(`${item.label} · LEVEL 04`);
    const division = await page.evaluate(() => {
      const round = (window as any).__arena.match.rounds[3];
      return { output: round.outputs[0], code: round.code.join('\n'), count: (window as any).__arena.match.rounds.length };
    });
    expect(division).toEqual({ output: item.output, code: expect.stringContaining(item.code), count: 10 });
  }
});

test('language feedback and content-sized code panels follow the active pack', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('output-league:tutorial', '1');
    localStorage.setItem('output-league:settings', JSON.stringify({ reducedMotion: true, sound: false }));
  });
  for (const item of [{ route: 'csharp', feedback: 'C# EXECUTED ✓' }, { route: 'swift', feedback: 'SWIFT EXECUTED ✓' }]) {
    await page.goto(`/${item.route}/level/1?qa=1`);
    await expect.poll(() => page.evaluate(() => (window as any).__arena?.introDone && (window as any).__arena?.spawnElapsed >= 1)).toBe(true);
    const panel = (await page.locator('.code-panel').boundingBox())!;
    expect(panel.width).toBeLessThan(330);
    await page.evaluate(() => {
      const scene = (window as any).__arena;
      scene.scene.pause();
      scene.scoreGoal(scene.goals.find((goal: any) => goal.active && goal.output === scene.match.targetOutput));
    });
    await expect(page.getByRole('status')).toContainText(item.feedback);
    await expect(page.getByRole('status')).not.toContainText('PYTHON EXECUTED');
  }
});

test('desktop pointer direction and distance provide analog steering', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('output-league:tutorial', '1');
    localStorage.setItem('output-league:settings', JSON.stringify({ reducedMotion: true, sound: false }));
  });
  await page.goto('/python/level/1?qa=1');
  await expect.poll(() => page.evaluate(() => (window as any).__arena?.introDone && (window as any).__arena?.spawnElapsed >= 1)).toBe(true);
  const car = await page.evaluate(() => {
    const scene = (window as any).__arena, bounds = document.querySelector('canvas')!.getBoundingClientRect();
    return { x: bounds.left + (600 + (scene.player.x - scene.cameraState.x) * scene.cameraState.zoom) * bounds.width / 1200, y: bounds.top + (400 + (scene.player.y - scene.cameraState.y) * scene.cameraState.zoom) * bounds.height / 800, scale: bounds.width / 1200, startX: scene.player.x };
  });
  await page.mouse.move(car.x + 280 * car.scale, car.y);
  await expect.poll(() => page.evaluate(() => (window as any).__arena.controls.pointer?.active)).toBe(true);
  expect(await page.evaluate(() => (window as any).__arena.pointerDriveVector().magnitude)).toBeGreaterThan(.9);
  await expect.poll(() => page.evaluate(() => (window as any).__arena.player.x)).toBeGreaterThan(car.startX + 45);
  const nearCar = await page.evaluate(() => {
    const scene = (window as any).__arena, bounds = document.querySelector('canvas')!.getBoundingClientRect();
    return { x: bounds.left + (600 + (scene.player.x - scene.cameraState.x) * scene.cameraState.zoom) * bounds.width / 1200, y: bounds.top + (400 + (scene.player.y - scene.cameraState.y) * scene.cameraState.zoom) * bounds.height / 800 };
  });
  await page.mouse.move(nearCar.x + 8, nearCar.y);
  await expect.poll(() => page.evaluate(() => (window as any).__arena.pointerDriveVector().magnitude)).toBeLessThan(.05);
});
