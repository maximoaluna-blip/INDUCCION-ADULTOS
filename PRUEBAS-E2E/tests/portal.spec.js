// Smoke del portal central (PORTAL-ADULTOS-ASC).
// Verifica que el portal carga, que su lineas.json es valido, y que cada linea
// "active" con url se renderiza como tarjeta con un enlace "Entrar a la Linea"
// que apunta a la URL correcta. No escribe en ningun backend.
//
// Corre SOLO si ASC_PORTAL_URL esta definido (en otras lineas no aplica) y solo
// en escritorio (revisar el portal una vez basta).
const { test, expect } = require('@playwright/test');

const PORTAL = process.env.ASC_PORTAL_URL || '';

test.describe('@solo-escritorio portal', () => {
  test.skip(!PORTAL, 'ASC_PORTAL_URL no definido — el smoke del portal no aplica a esta linea');

  test('portal: carga, lista lineas activas y enlaces validos', async ({ page, request }) => {
    const erroresJs = [];
    page.on('pageerror', (e) => erroresJs.push(String(e)));

    const resp = await page.goto(PORTAL, { waitUntil: 'domcontentloaded' });
    expect(resp, 'sin respuesta HTTP').toBeTruthy();
    expect(resp.status(), 'status HTTP del portal').toBeLessThan(400);

    // lineas.json carga y es un arreglo.
    const base = PORTAL.endsWith('/') ? PORTAL : PORTAL + '/';
    const cat = await request.get(base + 'lineas.json');
    expect(cat.status(), 'status de lineas.json').toBeLessThan(400);
    const lineas = await cat.json();
    expect(Array.isArray(lineas), 'lineas.json debe ser un arreglo').toBeTruthy();

    const activas = lineas.filter((l) => l.status === 'active' && l.url);
    expect(activas.length, 'no hay lineas activas con url en lineas.json').toBeGreaterThan(0);

    // Se renderiza al menos una tarjeta y no hay excepciones JS.
    await expect(page.locator('.linea-card').first()).toBeVisible();

    // Cada linea activa tiene en el DOM un enlace a su url publica.
    const enlaces = await page.$$eval('a[href]', (as) => as.map((a) => a.href));
    const norm = (u) => u.replace(/\/+$/, '');
    const faltantes = activas
      .filter((l) => !enlaces.some((h) => norm(h) === norm(l.url)))
      .map((l) => `${l.id || l.name} -> ${l.url}`);
    expect(faltantes, `lineas activas sin enlace en el portal:\n${faltantes.join('\n')}`).toEqual([]);

    expect(erroresJs, `excepciones JS: ${erroresJs.join(' | ')}`).toEqual([]);
  });
});
