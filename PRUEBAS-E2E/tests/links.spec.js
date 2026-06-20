// Link checker — 0 enlaces internos rotos. Checklist §M (revisar enlaces sin rotos).
// Enlaces internos (mismo host github.io): fallo duro si >= 400.
// Enlaces externos (scout.org.co, google, etc.): se reportan como anotacion, NO fallan
// la suite (muchos sitios bloquean peticiones automatizadas con 403/405).
const { test, expect } = require('@playwright/test');
const { CURSOS } = require('./cursos');

const IGNORAR = /^(mailto:|tel:|javascript:|#)/i;

async function revisar(request, url) {
  // HEAD primero; si el servidor no lo soporta, GET.
  try {
    let r = await request.head(url, { timeout: 15000, maxRedirects: 5 });
    if (r.status() === 405 || r.status() === 501) {
      r = await request.get(url, { timeout: 15000, maxRedirects: 5 });
    }
    return r.status();
  } catch (e) {
    return 0; // 0 = no se pudo conectar
  }
}

// Solo en escritorio: revisar enlaces una vez es suficiente.
test.describe('@solo-escritorio enlaces', () => {
  for (const curso of CURSOS) {
    test(`enlaces: ${curso.courseId}`, async ({ page, request }, testInfo) => {
      await page.goto(curso.file, { waitUntil: 'domcontentloaded' });

      const hrefs = await page.$$eval('a[href]', (as) =>
        Array.from(new Set(as.map((a) => a.href)))
      );

      const host = new URL(page.url()).host;
      const internosRotos = [];
      const externosFallidos = [];

      for (const href of hrefs) {
        if (IGNORAR.test(href)) continue;
        const esInterno = new URL(href).host === host;
        const status = await revisar(request, href);
        const roto = status === 0 || status >= 400;
        if (!roto) continue;
        if (esInterno) internosRotos.push(`${status}  ${href}`);
        else externosFallidos.push(`${status}  ${href}`);
      }

      if (externosFallidos.length) {
        testInfo.annotations.push({
          type: 'externos-no-verificables',
          description: externosFallidos.join('\n'),
        });
      }

      expect(
        internosRotos,
        `enlaces internos rotos:\n${internosRotos.join('\n')}`
      ).toEqual([]);
    });
  }
});
