import { expect, test } from '@playwright/test';

const teacher = { id: 'staff-7', username: 'leleomaker', full_name: 'Léo Maker', grade: 7, class_name: 'STAFF', group_name: null, is_teacher: true };
const teacherSession = { student: teacher, token: '11111111-1111-1111-1111-111111111111', expires_at: new Date(Date.now() + 86400000).toISOString(), settings: null, progress: {} };

const roster = [
  { id: 's7a', username: 'anaalves', full_name: 'Ana Alves', grade: 7, class_name: '7A', group_name: 'amarelo', progress: { python: { best_score: 900, stars: 5, levels_completed: 3 }, swift: { best_score: 0, stars: 0, levels_completed: 0 }, csharp: { best_score: 0, stars: 0, levels_completed: 0 } } },
  { id: 's7b', username: 'brunosouza', full_name: 'Bruno Souza', grade: 7, class_name: '7B', group_name: null, progress: { python: { best_score: 0, stars: 0, levels_completed: 0 }, swift: { best_score: 0, stars: 0, levels_completed: 0 }, csharp: { best_score: 0, stars: 0, levels_completed: 0 } } },
  { id: 's8a', username: 'carladias', full_name: 'Carla Dias', grade: 8, class_name: '8A', group_name: 'branco', progress: { python: { best_score: 0, stars: 0, levels_completed: 0 }, swift: { best_score: 700, stars: 4, levels_completed: 2 }, csharp: { best_score: 0, stars: 0, levels_completed: 0 } } },
  { id: 's9a', username: 'diegocosta', full_name: 'Diego Costa', grade: 9, class_name: '9A', group_name: 'amarelo', progress: { python: { best_score: 0, stars: 0, levels_completed: 0 }, swift: { best_score: 0, stars: 0, levels_completed: 0 }, csharp: { best_score: 500, stars: 3, levels_completed: 1 } } },
];

test('teach dashboard separates years by language and refreshes scores live', async ({ page }) => {
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
  await expect(page.locator('.teacher-row', { hasText: 'Ana Alves' })).toContainText('3 levels · 5 stars');
  await expect(page.locator('.teacher-row', { hasText: 'Carla Dias' })).toHaveCount(0);
  await expect(page.locator('.teacher-total')).toContainText('Python: 3 levels · 900 pts · 5 stars');

  await page.getByRole('button', { name: /8th grade/ }).click();
  await expect(page.getByRole('button', { name: /8th grade/ })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.teacher-row', { hasText: 'Carla Dias' })).toContainText('2 levels · 4 stars');
  await expect(page.locator('.teacher-row', { hasText: 'Ana Alves' })).toHaveCount(0);
  await expect(page.locator('.teacher-total')).toContainText('Swift: 2 levels · 700 pts · 4 stars');

  await page.getByRole('button', { name: /9th grade/ }).click();
  await expect(page.locator('.teacher-row', { hasText: 'Diego Costa' })).toContainText('1 level · 3 stars');
  await expect(page.locator('.teacher-total')).toContainText('C#: 1 level · 500 pts · 3 stars');

  roster[0].progress.python = { best_score: 1500, stars: 6, levels_completed: 4 };
  await page.getByRole('button', { name: /7th grade/ }).click();
  await expect(page.locator('.teacher-row', { hasText: 'Ana Alves' })).toContainText('4 levels · 6 stars');
  await expect(page.locator('.teacher-row', { hasText: 'Ana Alves' })).toContainText('1,500');
});
