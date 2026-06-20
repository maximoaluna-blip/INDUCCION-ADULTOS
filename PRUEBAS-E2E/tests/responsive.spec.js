// Responsive — el curso renderiza sin desbordamiento horizontal en movil y escritorio.
// Checklist §H (funciona en movil y escritorio). El viewport lo fija el "project"
// (movil-android = Pixel 5, desktop-chromium = escritorio), asi que este test
// corre en ambos automaticamente.
const { test, expect } = require('@playwright/test');
const { CURSOS } = require('./cursos');

for (const curso of CURSOS) {
  test(`responsive: ${curso.courseId} sin scroll horizontal`, async ({ page }, testInfo) => {
    await page.goto(curso.file, { waitUntil: 'domcontentloaded' });

    const encabezado = page.locator('h1, h2').first();
    await expect(encabezado).toBeVisible();

    // No debe haber desbordamiento horizontal (tolerancia de 2px por redondeo).
    const desborde = await page.evaluate(() => {
      const el = document.documentElement;
      return el.scrollWidth - el.clientWidth;
    });
    expect(
      desborde,
      `desbordamiento horizontal de ${desborde}px en ${testInfo.project.name}`
    ).toBeLessThanOrEqual(2);
  });
}
