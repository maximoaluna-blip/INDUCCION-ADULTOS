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

  // --- El panel CONECTADO y con datos (27-sep-2026) --------------------------
  // La prueba de arriba carga `dashboard.html` y audita lo que se ve: la pantalla de
  // conexion. Las tarjetas, los filtros y las tablas quedan DETRAS del modal, asi que
  // ese test pasa en verde sin haber mirado lo que un administrador usa. Ese dia se midio
  // lo que escondia: cinco filtros cuya <label> no llevaba `for` -un lector de pantalla
  // anunciaba desplegables sin nombre, axe CRITICAL-, cuatro grises entre 2.32:1 y 3.54:1
  // y un enlace que solo se distinguia por el color. Diecisiete nodos, todos invisibles
  // para la version desconectada. El panel de Rover, copia de este, tenia los mismos.
  //
  // Aqui el panel se conecta de verdad: URL de backend en localStorage y el backend
  // INTERCEPTADO con un payload realista -nada sale a produccion-. Y antes de auditar se
  // exige que la tasa este pintada: si no, se volveria a mirar la pantalla equivocada.
  for (const tema of ['light', 'dark']) {
    test(`panel admin — dashboard.html CONECTADO y con datos [${tema}]`, async ({ page }) => {
      const PAYLOAD = { success: true, data: {
        totalUsers: 20, totalCertificates: 21, totalQuizzes: 118, completionsByModule: {},
        modulos: [
          { curso: 'bienvenida-adultos', modulo: '0', nombre: 'Introduccion', completados: 6, abandono: 0, abandonoPct: 0 },
          { curso: 'bienvenida-adultos', modulo: '1', nombre: 'Leccion 1', completados: 4, abandono: 2, abandonoPct: 33 },
        ],
        items: [
          { curso: 'bienvenida-adultos', modulo: '2', pregunta: '0', intentos: 10, aciertos: 4, tasaAcierto: 40 },
        ],
        courseStats: { 'bienvenida-adultos': { registrations: 6, certificates: 3, avgScore: 100 } },
        averageScore: 100, registros: [], certificados: [], detalleIncluido: false,
        resumen: { totalRovers: 20, totalCertificados: 21, inscripciones: 20, inscripcionesCompletadas: 14,
                   tasaCompletacion: 70, certificadosSinInscripcion: 7, promedioPuntuacion: 100 },
      } };
      await page.route('**/macros/s/**', (route) => route.fulfill({
        status: 200, contentType: 'application/json',
        headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify(PAYLOAD),
      }));
      await page.addInitScript((t) => {
        try {
          localStorage.setItem('dashboard_gas_url', 'https://script.google.com/macros/s/PRUEBA/exec');
          localStorage.setItem('asc-theme', t);
        } catch (e) {}
      }, tema);

      const resp = await page.goto(PANEL + 'dashboard.html', { waitUntil: 'domcontentloaded' });
      test.skip(!resp || resp.status() >= 400, 'dashboard.html no disponible');
      await page.addStyleTag({ content: '*, *::before, *::after { animation: none !important; transition: none !important; }' });

      // Conectado de verdad, o la auditoria no significa nada.
      await expect(page.locator('#completionRate')).toHaveText('70%', { timeout: 15000 });

      const violaciones = await auditar(page);
      expect(violaciones, `Violaciones en el panel conectado [${tema}]:\n${violaciones.join('\n')}`).toEqual([]);
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
