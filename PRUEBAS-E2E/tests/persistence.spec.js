// Persistencia frontend — el tema elegido sobrevive a una recarga.
// Checklist §H (modo claro/oscuro) + §F (estado persiste en localStorage).
// El sitio guarda la preferencia en localStorage['rover-theme'] y la aplica como
// atributo data-theme en <html> al cargar (script anti-FOUC). 100% frontend, sin backend.
//
// Nota: la persistencia profunda del plan-builder (curso plan-personal) requiere pasar
// el registro de modulo 0, que llama al backend de Apps Script -> va en Fase 1.
const { test, expect } = require('@playwright/test');
const { CURSOS } = require('./cursos');

const curso = CURSOS[0]; // basta un curso: el mecanismo de tema es compartido.

test('@solo-escritorio persistencia: tema oscuro sobrevive recarga', async ({ page }) => {
  await page.addInitScript(() => {
    try { localStorage.setItem('rover-theme', 'dark'); } catch (e) {}
  });
  await page.goto(curso.file, { waitUntil: 'domcontentloaded' });

  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  const guardado = await page.evaluate(() => localStorage.getItem('rover-theme'));
  expect(guardado).toBe('dark');

  // Recargar: la preferencia debe seguir aplicada.
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('@solo-escritorio persistencia: tema claro no fija data-theme=dark', async ({ page }) => {
  await page.addInitScript(() => {
    try { localStorage.setItem('rover-theme', 'light'); } catch (e) {}
  });
  await page.goto(curso.file, { waitUntil: 'domcontentloaded' });

  const tema = await page.locator('html').getAttribute('data-theme');
  expect(tema === null || tema === 'light').toBeTruthy();
});
