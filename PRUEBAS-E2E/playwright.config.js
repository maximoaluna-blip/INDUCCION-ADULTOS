// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * Configuracion Fase 0 — pruebas contra el sitio PUBLICO (GitHub Pages).
 * Ningun test de esta fase escribe en el backend de Apps Script.
 * La URL base apunta a la carpeta de cursos de la linea Politica de Adultos.
 */
const BASE_URL =
  process.env.ASC_BASE_URL ||
  'https://maximoaluna-blip.github.io/INDUCCION-ADULTOS/02-Plataforma-Web/';

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
  projects: [
    {
      name: 'desktop-chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'movil-android',
      use: { ...devices['Pixel 5'] },
      // El test de accesibilidad corre solo en escritorio para no duplicar.
      grepInvert: /@solo-escritorio/,
    },
  ],
});
