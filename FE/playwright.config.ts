import { defineConfig, devices } from '@playwright/test';
import { ENTORNO_API, URL_API, URL_FE } from './e2e/entorno';

const enCI = !!process.env['CI'];

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.e2e.ts',
  globalSetup: './e2e/global-setup.ts',
  fullyParallel: true,
  forbidOnly: enCI,
  retries: enCI ? 2 : 0,
  workers: enCI ? 2 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: URL_FE,
    actionTimeout: 10_000,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      // Recrea la base de pruebas y levanta la API contra ella. Nunca reutiliza una API
      // ya abierta para no escribir en la base de desarrollo.
      command: 'node e2e/preparar-api.mjs',
      url: `${URL_API}/api/alimentos`,
      reuseExistingServer: false,
      timeout: 240_000,
      env: ENTORNO_API,
      stdout: 'pipe',
      stderr: 'pipe'
    },
    {
      command: 'npm run start -- --port 4200',
      url: URL_FE,
      reuseExistingServer: !enCI,
      timeout: 180_000
    }
  ]
});
