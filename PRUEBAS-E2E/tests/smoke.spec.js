// Smoke — cada curso carga, tiene <title> correcto y no lanza excepciones JS.
// Checklist §G (el curso renderiza, no solo responde 200).
const { test, expect } = require('@playwright/test');
const { CURSOS } = require('./cursos');

for (const curso of CURSOS) {
  test(`smoke: ${curso.courseId} carga y renderiza`, async ({ page }) => {
    const erroresJs = [];
    page.on('pageerror', (e) => erroresJs.push(String(e)));

    const resp = await page.goto(curso.file, { waitUntil: 'domcontentloaded' });
    expect(resp, 'sin respuesta HTTP').toBeTruthy();
    expect(resp.status(), 'status HTTP').toBeLessThan(400);

    // El <title> menciona el curso (si hay palabra clave); si no, basta que exista.
    await expect(page).toHaveTitle(
      curso.tituloIncluye ? new RegExp(curso.tituloIncluye, 'i') : /.+/
    );

    // Hay contenido visible (al menos un h1/h2 con texto).
    const encabezado = page.locator('h1, h2').first();
    await expect(encabezado).toBeVisible();

    // No hay excepciones JS no capturadas durante la carga.
    expect(erroresJs, `excepciones JS: ${erroresJs.join(' | ')}`).toEqual([]);
  });
}
