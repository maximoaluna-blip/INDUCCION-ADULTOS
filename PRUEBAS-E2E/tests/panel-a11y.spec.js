// Accesibilidad del PANEL ADMINISTRATIVO y del PORTAL con axe (WCAG A/AA).
//
// POR QUE EXISTE (ADR-033):
// La suite de a11y audita los CURSOS. El panel administrativo y el portal central
// no los miraba nadie. El 03-ago-2026 se publico en el panel una tabla cuyo color
// de umbral daba 3.08:1 sobre blanco —por debajo del 4.5:1 de AA— y paso porque
// no habia ninguna prueba apuntando ahi. Los 160 tests de la suite estaban en verde.
//
// Ambas paginas son estaticas y sin login: se auditan tal cual, sin recorrer
// modulos como en los cursos. Solo escritorio: son herramientas de gestion.
//
// Corre contra PRODUCCION. Si la URL no esta definida, el test se salta.

const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];
const IMPACTOS = new Set(['serious', 'critical']);

const PANEL = process.env.ASC_PANEL_URL || 'https://maximoaluna-blip.github.io/PORTAL-ADMIN-ASC/';
const PORTAL = process.env.ASC_PORTAL_URL || '';

/** Devuelve las violaciones serias/criticas, ya formateadas para el mensaje de fallo. */
async function auditar(page) {
  const r = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  return r.violations
    .filter((v) => IMPACTOS.has(v.impact))
    .map((v) => `[${v.impact}] ${v.id}: ${v.help} (${v.nodes.length} elemento(s))\n    ${v.nodes[0] ? v.nodes[0].target.join(' ') : ''}`);
}

test.describe('@solo-escritorio a11y de las herramientas de gestion', () => {
  for (const pagina of ['index.html', 'dashboard.html']) {
    test(`panel admin — ${pagina} sin violaciones serias`, async ({ page }) => {
      const resp = await page.goto(PANEL + pagina, { waitUntil: 'domcontentloaded' });
      test.skip(!resp || resp.status() >= 400, `${pagina} no disponible`);

      // El panel pinta tablas al recibir datos del backend. Se espera a que la
      // pagina se asiente para auditar tambien lo renderizado, no solo el esqueleto.
      await page.waitForTimeout(1500);

      const violaciones = await auditar(page);
      expect(violaciones, `Violaciones en ${pagina}:\n${violaciones.join('\n')}`).toEqual([]);
    });
  }

  test('portal central sin violaciones serias', async ({ page }) => {
    test.skip(!PORTAL, 'ASC_PORTAL_URL no definido');
    const resp = await page.goto(PORTAL, { waitUntil: 'domcontentloaded' });
    test.skip(!resp || resp.status() >= 400, 'portal no disponible');
    await page.waitForTimeout(800);

    const violaciones = await auditar(page);
    expect(violaciones, `Violaciones en el portal:\n${violaciones.join('\n')}`).toEqual([]);
  });
});
