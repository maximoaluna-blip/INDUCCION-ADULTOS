// Accesibilidad con axe-core — WCAG 2.0/2.1 nivel A y AA. Checklist §H.
// Corre cada curso en modo claro y oscuro. Solo en escritorio.
// Reporta violaciones de impacto serious/critical (las de mayor senal).
//
// IMPORTANTE — por que se recorren los modulos:
// axe solo analiza lo que esta renderizado y visible. Los cursos cargan con TODOS los
// modulos en el DOM pero solo `module-0` (el registro) activo; el resto esta oculto.
// Auditar la pagina tal cual la carga el navegador equivale a auditar el formulario de
// registro y nada mas — ~10% de la interfaz. Verificado el 02-ago-2026: 7 campos del
// plan-builder estaban en el DOM con 0 px visibles, y sus etiquetas faltantes pasaban
// desapercibidas con la suite en verde. Por eso ahora se activa cada modulo y se audita.
const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
const { CURSOS } = require('./cursos');

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];
const IMPACTOS = new Set(['serious', 'critical']);

async function auditarModulo(page, etiqueta) {
  const r = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  return r.violations
    .filter((v) => IMPACTOS.has(v.impact))
    .map((v) => `${etiqueta} → [${v.impact}] ${v.id}: ${v.help} (${v.nodes.length} nodo/s)`);
}

// No auditar un modulo hasta que sea de verdad visible y opaco: axe mide el contraste sobre
// lo que hay en pantalla, y un elemento a medio aparecer da falsos `color-contrast`.
async function esperarOpaco(page, id) {
  return page
    .waitForFunction(
      (mid) => {
        const e = document.getElementById(mid);
        if (!e) return false;
        const cs = getComputedStyle(e);
        return cs.display !== 'none' && parseFloat(cs.opacity) > 0.99 && e.getBoundingClientRect().height > 0;
      },
      id,
      { timeout: 3000 }
    )
    .then(() => true)
    .catch(() => false);
}

async function auditar(page, file, tema) {
  // Fijar tema antes de cargar (el sitio lee localStorage['rover-theme'] al inicio).
  await page.addInitScript((t) => {
    try { localStorage.setItem('rover-theme', t); } catch (e) {}
  }, tema);
  await page.goto(file, { waitUntil: 'domcontentloaded' });

  // Desactivar las animaciones ANTES de la primera auditoria.
  //
  // `.module` trae `animation: fadeIn 0.5s`, que arranca en opacity:0. Si se audita nada
  // mas anadir la clase `.active`, axe mide el contraste sobre texto todavia transparente
  // y reporta color-contrast en TODO — 178 falsos positivos en la primera corrida. Por eso
  // se desactivan las animaciones y se espera a que el modulo este realmente opaco.
  //
  // 16-sep-2026: este bloque estaba DESPUES de auditar `module-0`, asi que el registro —y
  // solo el registro— se medía con su fadeIn todavia corriendo. En una maquina rapida la
  // animacion ya habia terminado y pasaba; en el runner de CI, no: 13 de 125 pruebas de la
  // linea Programa de Jovenes fallaban y pasaban al reintentar, siempre con el mismo
  // `color-contrast serious en module-0, 7 nodos`. Una compuerta que cria lobos uno de cada
  // diez intentos se acaba ignorando, y entonces deja de ser compuerta. Las cuatro lineas
  // arrastraban el mismo orden desde el 02-ago-2026.
  await page.addStyleTag({
    content: '*, *::before, *::after { animation: none !important; transition: none !important; }',
  });

  const graves = [];

  // `module-0` (el registro) ya viene activo al cargar, pero se le exige la misma prueba de
  // opacidad que a los demas. Y si no la pasa NO se salta en silencio: un modulo que no se
  // audito no puede parecer un modulo limpio.
  if (await esperarOpaco(page, 'module-0')) {
    graves.push(...(await auditarModulo(page, 'module-0 (registro)')));
  } else {
    graves.push('module-0 (registro) → [critical] no-auditado: el modulo nunca llego a ser opaco en 3 s');
  }

  // Recorrer el resto de modulos activandolos uno por uno, para que axe los vea.

  const ids = await page.$$eval('[id^="module-"]', (els) => els.map((e) => e.id));
  for (const id of ids) {
    if (id === 'module-0') continue;
    const activado = await page.evaluate((mid) => {
      const objetivo = document.getElementById(mid);
      if (!objetivo) return false;
      document.querySelectorAll('[id^="module-"]').forEach((m) => m.classList.remove('active'));
      objetivo.classList.add('active');
      return true;
    }, id);
    if (!activado) continue;

    if (!(await esperarOpaco(page, id))) continue;

    graves.push(...(await auditarModulo(page, id)));
  }
  return graves;
}

test.describe('@solo-escritorio accesibilidad', () => {
  for (const curso of CURSOS) {
    for (const tema of ['light', 'dark']) {
      test(`a11y: ${curso.courseId} [${tema}]`, async ({ page }, testInfo) => {
        const graves = await auditar(page, curso.file, tema);
        const resumen = graves.join('\n');
        if (graves.length) {
          testInfo.annotations.push({ type: 'a11y', description: resumen });
        }
        expect(graves, `violaciones serious/critical:\n${resumen}`).toEqual([]);
      });
    }
  }
});
