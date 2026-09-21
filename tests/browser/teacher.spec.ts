import { expect, test } from '@playwright/test';

const teacher = { id: 'staff-7', username: 'leleomaker', full_name: 'Léo Maker', grade: 7, class_name: 'STAFF', group_name: null, is_teacher: true };
const teacherSession = { student: teacher, token: '11111111-1111-1111-1111-111111111111', expires_at: new Date(Date.now() + 86400000).toISOString(), settings: null, progress: {} };

const level = (best_score: number, stars: number) => ({ best_score, stars, complete: true });
const emptyLanguage = { best_score: 0, stars: 0, levels_completed: 0, levels: {} };

const roster = [
  { id: 's7a', username: 'anaalves', full_name: 'Ana Alves', grade: 7, class_name: '7A', group_name: 'amarelo', progress: { python: { best_score: 900, stars: 5, levels_completed: 3, levels: { 1: level(400, 2), 2: level(300, 2), 3: level(200, 1) } }, swift: emptyLanguage, csharp: emptyLanguage } },
  { id: 's7b', username: 'brunosouza', full_name: 'Bruno Souza', grade: 7, class_name: '7B', group_name: null, progress: { python: emptyLanguage, swift: emptyLanguage, csharp: emptyLanguage } },
  { id: 's8a', username: 'carladias', full_name: 'Carla Dias', grade: 8, class_name: '8A', group_name: 'branco', progress: { python: emptyLanguage, swift: { best_score: 700, stars: 4, levels_completed: 2, levels: { 1: level(400, 2), 2: level(300, 2) } }, csharp: emptyLanguage } },
  { id: 's9a', username: 'diegocosta', full_name: 'Diego Costa', grade: 9, class_name: '9A', group_name: 'amarelo', progress: { python: emptyLanguage, swift: emptyLanguage, csharp: { best_score: 500, stars: 3, levels_completed: 1, levels: { 1: level(500, 3) } } } },
];

test('teach dashboard separates years, lists every level score, and refreshes live', async ({ page }) => {
  await page.route('**/rest/v1/rpc/login_student', route => route.fulfill({ json: teacherSession }));
  await page.route('**/rest/v1/rpc/get_student_state', route => route.fulfill({ json: teacherSession }));
  await page.route('**/rest/v1/rpc/save_student_settings', route => route.fulfill({ json: null }));
  await page.route('**/rest/v1/rpc/get_teacher_dashboard', route => route.fulfill({ json: { students: roster } }));
  await page.addInitScript(() => {
    localStorage.setItem('output-league:tutorial', '1');
    localStorage.setItem('output-league:settings', JSON.stringify({ reducedMotion: true, sound: false }));
  });

  await page.goto('/');
  await page.getByPlaceholder('firstnamelastname').fill('leleomaker');
  await page.getByRole('button', { name: /ENTER MY JOURNEY/ }).click();
  await page.getByRole('button', { name: 'TEACH DASHBOARD' }).click();

  await expect(page.getByRole('heading', { name: /Teach dashboard/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /7th grade/ })).toHaveAttribute('aria-pressed', 'true');
  const ana = page.locator('.teacher-row', { hasText: 'Ana Alves' });
  await expect(ana.locator('.teacher-progress')).toHaveCount(4);
  await expect(ana.locator('.teacher-progress').nth(0)).toContainText('400');
  await expect(ana.locator('.teacher-progress').nth(0)).toContainText('2 stars');
  await expect(ana.locator('.teacher-progress').nth(1)).toContainText('300');
  await expect(ana.locator('.teacher-progress').nth(2)).toContainText('200');
  await expect(ana.locator('.teacher-progress').nth(3)).toContainText('—');
  await expect(page.locator('.teacher-row', { hasText: 'Bruno Souza' }).locator('.teacher-progress').nth(0)).toContainText('—');
  await expect(page.locator('.teacher-row', { hasText: 'Carla Dias' })).toHaveCount(0);
  await expect(page.locator('.teacher-total')).toContainText('Python: 3 levels · 900 pts · 5 stars');

  await page.getByRole('button', { name: /8th grade/ }).click();
  await expect(page.getByRole('button', { name: /8th grade/ })).toHaveAttribute('aria-pressed', 'true');
  const carla = page.locator('.teacher-row', { hasText: 'Carla Dias' });
  await expect(carla.locator('.teacher-progress').nth(0)).toContainText('400');
  await expect(carla.locator('.teacher-progress').nth(1)).toContainText('300');
  await expect(carla.locator('.teacher-progress').nth(2)).toContainText('—');
  await expect(page.locator('.teacher-row', { hasText: 'Ana Alves' })).toHaveCount(0);
  await expect(page.locator('.teacher-total')).toContainText('Swift: 2 levels · 700 pts · 4 stars');

  await page.getByRole('button', { name: /9th grade/ }).click();
  await expect(page.locator('.teacher-row', { hasText: 'Diego Costa' }).locator('.teacher-progress').nth(0)).toContainText('500');
  await expect(page.locator('.teacher-total')).toContainText('C#: 1 level · 500 pts · 3 stars');

  roster[0].progress.python = { best_score: 2100, stars: 6, levels_completed: 4, levels: { 1: level(400, 2), 2: level(300, 2), 3: level(200, 1), 4: level(1500, 1) } };
  await page.getByRole('button', { name: /7th grade/ }).click();
  await expect(ana.locator('.teacher-progress').nth(3)).toContainText('1,500');
  await expect(ana.locator('.teacher-progress').nth(3)).toContainText('1 star');
});

test('all-time leaders list every level score for each student', async ({ page }) => {
  await page.route('**/rest/v1/rpc/get_all_time_leaders', route => route.fulfill({ json: [
    { language: 'python', rank: 1, display_name: 'Ana A.', total_score: 1350, total_stars: 6, levels_completed: 3, levels: { 1: 500, 2: 450, 3: 400 } },
    { language: 'python', rank: 2, display_name: 'Bruno S.', total_score: 300, total_stars: 1, levels_completed: 1, levels: { 1: 300 } },
    { language: 'swift', rank: 1, display_name: 'Carla D.', total_score: 700, total_stars: 4, levels_completed: 2, levels: { 1: 400, 2: 300 } },
    { language: 'csharp', rank: 1, display_name: 'Diego C.', total_score: 500, total_stars: 3, levels_completed: 1, levels: { 1: 500 } },
  ] }));
  await page.addInitScript(() => {
    localStorage.setItem('output-league:tutorial', '1');
    localStorage.setItem('output-league:settings', JSON.stringify({ reducedMotion: true, sound: false }));
  });

  await page.goto('/');
  await page.getByRole('button', { name: /ALL-TIME LEADERS/ }).click();
  const first = page.locator('.leaderboard-column.lang-python li').first();
  await expect(first).toContainText('Ana A.');
  await expect(first.locator('.leader-levels > span')).toHaveCount(4);
  await expect(first.locator('.leader-levels > span').nth(0)).toContainText('L1');
  await expect(first.locator('.leader-levels > span').nth(0)).toContainText('500');
  await expect(first.locator('.leader-levels > span').nth(1)).toContainText('450');
  await expect(first.locator('.leader-levels > span').nth(2)).toContainText('400');
  await expect(first.locator('.leader-levels > span').nth(3)).toContainText('—');
  await expect(first).toContainText('1,350');
  await expect(page.locator('.leaderboard-column.lang-python li').nth(1).locator('.leader-levels > span').nth(0)).toContainText('300');
  await expect(page.locator('.leaderboard-column.lang-swift li').first().locator('.leader-levels > span').nth(1)).toContainText('300');
});
