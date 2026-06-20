// Accesibilidad con axe-core — WCAG 2.0/2.1 nivel A y AA. Checklist §H.
// Corre cada curso en modo claro y oscuro. Solo en escritorio.
// Reporta violaciones de impacto serious/critical (las de mayor senal).
const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
const { CURSOS } = require('./cursos');

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];
const IMPACTOS = new Set(['serious', 'critical']);

async function auditar(page, file, tema) {
  // Fijar tema antes de cargar (el sitio lee localStorage['rover-theme'] al inicio).
  await page.addInitScript((t) => {
    try { localStorage.setItem('rover-theme', t); } catch (e) {}
  }, tema);
  await page.goto(file, { waitUntil: 'domcontentloaded' });

  const r = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  const graves = r.violations.filter((v) => IMPACTOS.has(v.impact));
  const resumen = graves
    .map((v) => `[${v.impact}] ${v.id}: ${v.help} (${v.nodes.length} nodo/s)`)
    .join('\n');
  return { graves, resumen };
}

test.describe('@solo-escritorio accesibilidad', () => {
  for (const curso of CURSOS) {
    for (const tema of ['light', 'dark']) {
      test(`a11y: ${curso.courseId} [${tema}]`, async ({ page }, testInfo) => {
        const { graves, resumen } = await auditar(page, curso.file, tema);
        if (graves.length) {
          testInfo.annotations.push({ type: 'a11y', description: resumen });
        }
        expect(graves, `violaciones serious/critical:\n${resumen}`).toEqual([]);
      });
    }
  }
});
