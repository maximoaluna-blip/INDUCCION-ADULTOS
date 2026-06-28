// E2E de persistencia profunda del plan-builder (Fase 1a) — AGNOSTICA DE LINEA.
// Descubre en runtime el primer curso del catalogo (.cursos.json, generado por
// _setup-cursos.js) que renderice un plan-builder (.pb-comp-check) y corre la prueba
// contra ese: selecciona una competencia, llena meta/plazo/recursos y compromiso,
// recarga la pagina y verifica que el motor restaura todo (courseProgress en localStorage).
// Si ningun curso del catalogo tiene plan-builder, el test se marca como skipped (no failed).
// Asi la misma spec sirve para Adultos (plan-personal), Programa de Jovenes
// (mi-compromiso-programa-jovenes), etc. Checklist §F (plan-builder persiste en localStorage).
const { test, expect } = require('@playwright/test');
const { stubBackend, porAccion } = require('./_backend');
const { CURSOS } = require('./cursos');

const META = 'Meta concreta de prueba E2E';
const PLAZO = '3 meses';
// Texto neutro multi-linea: "Asesor Personal" es de Adultos y no es valido en
// Programa de Jovenes (GLOSARIO §E). "mi dirigente" sirve en cualquier linea.
const RECURSOS = 'Acompañamiento de mi dirigente';
const COMPROMISO = 'Me comprometo a revisar mi plan cada mes (prueba E2E).';

// Registra al alumno en el curso ya cargado y espera a que el modulo 1 quede activo.
async function registrar(page) {
  await page.locator('#fullName').fill('Participante Plan E2E');
  const email = page.locator('#email');
  if (await email.count()) await email.fill('plan-e2e@example.com');
  await page.locator('#registrationForm button[type="submit"]').click();
  await expect(page.locator('#module-1')).toHaveClass(/active/);
}

test('@solo-escritorio e2e: plan-builder persiste tras recargar', async ({ page }) => {
  const capturado = await stubBackend(page);

  // Descubrir el primer curso del catalogo cuyo DOM contenga un plan-builder.
  // El markup de los modulos es estatico (presente al cargar), asi que basta
  // navegar y contar .pb-comp-check; no hace falta registrarse para detectarlo.
  let target = null;
  for (const curso of CURSOS) {
    await page.goto(curso.file, { waitUntil: 'domcontentloaded' });
    if (await page.locator('.pb-comp-check').count()) { target = curso; break; }
  }

  test.skip(!target, 'ningun curso del catalogo renderiza un plan-builder (.pb-comp-check)');
  const storageKey = `courseProgress_${target.courseId}`;

  // `page` ya esta en el curso target (ultima navegacion del bucle). Registrarse.
  await registrar(page);

  // Localizar el modulo que contiene el plan-builder y abrirlo.
  const moduleId = await page.evaluate(() => {
    const cb = document.querySelector('.pb-comp-check');
    if (!cb) return null;
    const m = cb.closest('.module');
    return m ? Number(m.id.replace('module-', '')) : null;
  });
  expect(moduleId, 'el curso target debe tener un plan-builder en un modulo').not.toBeNull();
  await page.evaluate((m) => showModule(m), moduleId);
  await expect(page.locator(`#module-${moduleId}`)).toHaveClass(/active/);

  // Seleccionar la primera competencia y llenar sus campos.
  const compId = await page.locator('.pb-comp-check').first().getAttribute('data-competence');
  await page.locator(`.pb-comp-check[data-competence="${compId}"]`).check();

  const meta = page.locator(`.pb-field-meta[data-competence="${compId}"]`);
  const plazo = page.locator(`.pb-field-plazo[data-competence="${compId}"]`);
  const recursos = page.locator(`.pb-field-recursos[data-competence="${compId}"]`);
  await meta.fill(META); await meta.blur();       // onchange -> savePlanField
  await plazo.fill(PLAZO); await plazo.blur();
  await recursos.fill(RECURSOS); await recursos.blur();

  const commitment = page.locator('.pb-commitment').first();
  await commitment.fill(COMPROMISO); await commitment.blur();

  // Confirmar que se guardo en localStorage antes de recargar.
  const guardado = await page.evaluate((k) => localStorage.getItem(k), storageKey);
  expect(guardado, 'progreso guardado en localStorage').toContain(META);

  // Recargar: loadProgress() + restorePlanState() deben repoblar todo.
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.evaluate((m) => showModule(m), moduleId);

  await expect(page.locator(`.pb-comp-check[data-competence="${compId}"]`)).toBeChecked();
  await expect(page.locator(`.pb-field-meta[data-competence="${compId}"]`)).toHaveValue(META);
  await expect(page.locator(`.pb-field-plazo[data-competence="${compId}"]`)).toHaveValue(PLAZO);
  await expect(page.locator(`.pb-field-recursos[data-competence="${compId}"]`)).toHaveValue(RECURSOS);
  await expect(page.locator('.pb-commitment').first()).toHaveValue(COMPROMISO);

  // El plan tambien se sincroniza al backend al generarlo (no obligatorio para persistir).
  expect(porAccion(capturado, 'register').length).toBeGreaterThanOrEqual(1);
});
