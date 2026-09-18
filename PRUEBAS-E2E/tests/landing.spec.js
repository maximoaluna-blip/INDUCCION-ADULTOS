// La LANDING de la linea: que pinte el catalogo completo, agrupado por nivel.
//
// POR QUE EXISTE (17-sep-2026):
// Ninguna prueba tocaba esta pagina. `smoke`, `links`, `a11y` y `responsive` recorren
// los CURSOS; `panel-a11y` cubre el panel admin y el portal central. La landing de la
// linea -que es el punto de entrada de todo visitante y la unica pagina que lee
// `cursos.json` en vivo- no la miraba nadie. Se descubrio al portar la agrupacion por
// nivel de Programa de Jovenes a Politica de Adultos y Desarrollo Institucional: se
// cambio el camino de renderizado de dos landings publicadas y la suite siguio en
// verde sin haber cargado ninguna de las dos.
//
// Lo que vigila, y por que cada cosa:
//  1. que no se quede en "Cargando..." ni muestre "Error al cargar" — un fallo del
//     fetch de `cursos.json` deja la pagina vacia y nadie se entera;
//  2. que haya UNA tarjeta por curso activo del catalogo — el modo de fallo real es
//     que un curso publicado no aparezca en la landing aunque exista su HTML;
//  3. que cada tarjeta viva dentro de una seccion de nivel, y que el primer nivel
//     este abierto — si `level` faltara en el catalogo, todo caeria en un solo grupo
//     y esto lo delata;
//  4. que el contador de la cabecera coincida con lo pintado;
//  5. axe sobre la pagina ya renderizada.
//
// La URL sale de ASC_BASE_URL subiendo un nivel: la base apunta a 02-Plataforma-Web/
// y la landing vive en la raiz del repo.

const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];
const IMPACTOS = new Set(['serious', 'critical']);

const BASE =
  process.env.ASC_BASE_URL ||
  'https://maximoaluna-blip.github.io/INDUCCION-ADULTOS/02-Plataforma-Web/';
const LANDING = new URL('../', BASE.endsWith('/') ? BASE : BASE + '/').toString();
const CATALOGO = new URL('cursos.json', BASE.endsWith('/') ? BASE : BASE + '/').toString();

/** Cursos que el catalogo declara visibles, que es lo que la landing debe pintar. */
async function activosDelCatalogo(request) {
  const r = await request.get(CATALOGO, { timeout: 20000 });
  expect(r.status(), `${CATALOGO} deberia responder 200`).toBe(200);
  const cat = await r.json();
  return (Array.isArray(cat) ? cat : []).filter(
    (c) => c.status === 'active' || c.status === 'new'
  );
}

test.describe('@solo-escritorio landing de la linea', () => {
  test('pinta el catalogo completo, agrupado por nivel', async ({ page, request }, testInfo) => {
    const activos = await activosDelCatalogo(request);

    const resp = await page.goto(LANDING, { waitUntil: 'domcontentloaded' });
    expect(resp && resp.status(), `${LANDING} deberia responder 200`).toBeLessThan(400);

    // Linea todavia sin cursos publicados: el estado vacio TAMBIEN hay que probarlo.
    // No se da por buena la pagina sin mirarla —eso seria el fallo del ADR-051—: se
    // comprueba que muestre el mensaje de catalogo vacio y NO un error de carga.
    if (!activos.length) {
      await page.waitForFunction(
        () => !document.body.innerText.includes('Cargando catalogo'),
        null,
        { timeout: 15000 }
      );
      const vacio = await page.locator('body').innerText();
      expect(vacio, 'la landing muestra un error de carga del catalogo').not.toContain('Error al cargar');
      expect(vacio, 'con el catalogo vacio deberia decirlo explicitamente').toContain('No hay cursos disponibles');
      expect(await page.locator('.level-section').count(), 'sin cursos activos no deberia pintar niveles').toBe(0);
      testInfo.annotations.push({ type: 'estado', description: 'linea sin cursos activos: probado el estado vacio' });
      return;
    }

    // El catalogo se pide por fetch: esperar a que el contenedor deje de estar vacio.
    await page.waitForFunction(
      () => {
        const c = document.getElementById('levelsContainer');
        return c && c.querySelectorAll('.level-section').length > 0;
      },
      null,
      { timeout: 15000 }
    );

    const texto = await page.locator('body').innerText();
    expect(texto, 'la landing muestra un error de carga del catalogo').not.toContain('Error al cargar');
    expect(texto, 'la landing se quedo en el mensaje de carga').not.toContain('Cargando catalogo');

    // 2 · una tarjeta por curso activo, y son los mismos.
    const enlaces = await page.$$eval('.level-section .courses-grid a[href]', (as) =>
      as.map((a) => a.getAttribute('href'))
    );
    for (const c of activos) {
      const esperado = c.file || (c.folder ? c.folder + '/index.html' : '');
      expect(
        enlaces.some((h) => h && h.indexOf(esperado) !== -1),
        `el curso ${c.courseId} esta activo en el catalogo pero no aparece en la landing`
      ).toBe(true);
    }

    // 3 · toda tarjeta dentro de una seccion de nivel; el primer nivel, abierto.
    const fuera = await page.$$eval(
      '.courses-grid',
      (grids) => grids.filter((g) => !g.closest('.level-section')).length
    );
    expect(fuera, 'hay tarjetas fuera de cualquier seccion de nivel').toBe(0);
    expect(
      await page.locator('.level-section').first().evaluate((d) => d.open),
      'el primer nivel deberia venir expandido'
    ).toBe(true);

    // 4 · el contador de la cabecera no puede mentir.
    const stat = (await page.locator('#statCursos').innerText()).trim();
    expect(Number(stat), 'el contador de la cabecera no coincide con el catalogo').toBe(activos.length);
  });

  test('sin violaciones serias de accesibilidad', async ({ page }) => {
    await page.goto(LANDING, { waitUntil: 'domcontentloaded' });
    // Vale igual con catalogo vacio: la pagina se audita cuando deja de cargar.
    await page.waitForFunction(
      () => !document.body.innerText.includes('Cargando catalogo'),
      null,
      { timeout: 15000 }
    );
    // Las tarjetas entran con fadeIn desde opacity 0: sin esto axe mide contraste
    // sobre texto transparente y da falsos positivos (la trampa del ADR-033).
    await page.addStyleTag({ content: '*, *::before, *::after { animation: none !important; transition: none !important; }' });
    await page.waitForTimeout(300);

    const r = await new AxeBuilder({ page }).withTags(TAGS).analyze();
    const graves = r.violations
      .filter((v) => IMPACTOS.has(v.impact))
      .map((v) => `[${v.impact}] ${v.id}: ${v.help} (${v.nodes.length})`);
    expect(graves, `violaciones en ${LANDING}:\n  ${graves.join('\n  ')}`).toHaveLength(0);
  });
});
