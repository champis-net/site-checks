import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  workers: 4,
  // Un test raté est relancé une fois avant de compter comme une panne,
  // pour ne pas alerter sur une lenteur passagère.
  retries: 1,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: [
    ['list'],
    ['json', { outputFile: 'results/results.json' }],
    ['html', { outputFolder: 'results/report', open: 'never' }],
  ],
  outputDir: 'results/artifacts',
  use: {
    ...devices['Desktop Chrome'],
    locale: 'fr-CH',
    navigationTimeout: 30_000,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
});
