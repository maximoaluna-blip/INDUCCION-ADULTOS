// Donde se verifica un certificado — compuerta del ADR-128.
//
// POR QUE EXISTE: el pie del PDF decia «Verifica este certificado ingresando el codigo
// en la plataforma web» y no decia cual. La pagina existia desde el ADR-070, pero quien
// tenia el certificado en la mano no podia llegar. Ahora el pie imprime la direccion de
// verificacion de la linea y, en el PDF, la enlaza con el codigo ya puesto.
//
// Lo que hace: (1) en cada curso genera el PDF con jsPDF espiado y comprueba que el pie
// enlaza a <repo>/verificar-certificado.html?codigo=<el codigo del certificado>, y que
// esa pagina existe; (2) abre la pagina con ?codigo= y comprueba que lo pone en el
// campo y consulta el backend con ese codigo, sin que nadie escriba nada.
const { test, expect } = require('@playwright/test');
const { CURSOS } = require('./cursos');
const { stubBackend } = require('./_backend');

const CODIGO = 'ASC-2026-PRUEB';

test.describe('@solo-escritorio verificacion del certificado (ADR-128)', () => {
  for (const curso of CURSOS) {
    test(`${curso.courseId}: el pie del PDF enlaza la verificacion con el codigo`, async ({ page, request }) => {
      await stubBackend(page);
      await page.goto(curso.file, { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => typeof downloadCertificatePDF === 'function' && window.jspdf);

      const enlace = await page.evaluate(async (codigo) => {
        const el = document.getElementById('certCode');
        if (el) el.textContent = codigo;
        window.isMobileDevice = () => false;
        const P = window.jspdf.jsPDF.API;
        let capturado = null;
        const orig = P.textWithLink;
        P.textWithLink = function (texto, x, y, opts) {
          if (/Verifica este certificado/.test(texto)) capturado = { texto, url: opts && opts.url };
          return orig.apply(this, arguments);
        };
        P.save = function () { return this; };
        downloadCertificatePDF();
        for (let i = 0; i < 50 && !capturado; i++) await new Promise((r) => setTimeout(r, 100));
        return capturado;
      }, CODIGO);

      expect(enlace, 'el pie del PDF no imprimio un enlace de verificacion').not.toBeNull();
      expect(enlace.url).toMatch(new RegExp('/verificar-certificado\\.html\\?codigo=' + CODIGO + '$'));
      expect(enlace.texto).toContain('verificar-certificado.html');
      const pagina = await request.get(enlace.url.replace(/\?.*$/, ''));
      expect(pagina.status(), `la pagina ${enlace.url} no existe`).toBe(200);
    });
  }

  // Respuestas con la forma REAL del backend (handleVerify): success solo dice que la
  // consulta corrio; si el codigo existe lo dice data.valid. Hasta el ADR-128 la pagina
  // miraba solo success y daba por VALIDO cualquier codigo bien escrito (lo encontro DI).
  async function backendVerify(page, respuesta) {
    const consultas = [];
    await page.route('**/macros/s/**', async (route) => {
      consultas.push(route.request().url());
      await route.fulfill({
        status: 200, contentType: 'application/json',
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify(respuesta),
      });
    });
    return consultas;
  }

  test('la pagina de verificacion lee ?codigo= y consulta sola', async ({ page }) => {
    const consultas = await backendVerify(page, { success: true, data: { valid: false, certificateCode: CODIGO } });
    await page.goto('../verificar-certificado.html?codigo=' + CODIGO.toLowerCase(), { waitUntil: 'domcontentloaded' });
    await expect.poll(() => consultas.length, { timeout: 10000 }).toBeGreaterThan(0);
    expect(consultas[0]).toContain('code=' + CODIGO);
    await expect(page.locator('#cert-code')).toHaveValue(CODIGO);
  });

  test('un codigo que no existe sale como NO encontrado', async ({ page }) => {
    await backendVerify(page, { success: true, data: { valid: false, certificateCode: CODIGO } });
    await page.goto('../verificar-certificado.html?codigo=' + CODIGO, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#result-area')).toContainText(/No Encontrado/i, { timeout: 10000 });
    await expect(page.locator('#result-area')).not.toContainText(/Certificado V[aá]lido/i);
  });

  test('un codigo valido muestra sus datos, no guiones', async ({ page }) => {
    await backendVerify(page, { success: true, data: {
      valid: true, certificateCode: CODIGO, studentName: 'Participante E2E', course: 'Curso de prueba',
      group: 'Grupo 1', region: 'Region de prueba', completionDate: '2026-10-03T10:00:00.000Z', score: 100,
    } });
    await page.goto('../verificar-certificado.html?codigo=' + CODIGO, { waitUntil: 'domcontentloaded' });
    const area = page.locator('#result-area');
    await expect(area).toContainText(/Certificado V[aá]lido/i, { timeout: 10000 });
    await expect(area).toContainText('Participante E2E');
    await expect(area).toContainText('Curso de prueba');
    await expect(area).toContainText('2026-10-03');
  });
});
