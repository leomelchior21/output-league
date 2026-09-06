import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser', timeout: 180000, expect: { timeout: 25000 }, fullyParallel: false,
  use: { baseURL: 'http://127.0.0.1:5186', trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], launchOptions: { args: ['--disable-gpu'] }, viewport: { width: 1194, height: 834 } } },
    { name: 'webkit-ipad', use: { ...devices['iPad Pro 11 landscape'], defaultBrowserType: 'webkit', viewport: { width: 1194, height: 834 } } },
  ],
  webServer: { command: 'npm run dev -- --port 5186 --strictPort', url: 'http://127.0.0.1:5186', reuseExistingServer: true },
});
