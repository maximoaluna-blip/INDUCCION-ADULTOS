// E2E de persistencia profunda del plan-builder (Fase 1a) — curso plan-personal.
// Tras registrarse, seleccionar una competencia, llenar meta/plazo/recursos y compromiso,
// recargar la pagina y verificar que el motor restaura todo (personalPlans en localStorage).
// Checklist §F (plan-builder persiste correctamente en localStorage).
const { test, expect } = require('@playwright/test');
const { stubBackend, porAccion } = require('./_backend');

const META = 'Meta concreta de prueba E2E';
const PLAZO = '3 meses';
const RECURSOS = 'Acompañamiento del Asesor Personal';
const COMPROMISO = 'Me comprometo a revisar mi plan cada mes (prueba E2E).';

test('@solo-escritorio e2e: plan-builder persiste tras recargar', async ({ page }) => {
  const capturado = await stubBackend(page);
  await page.goto('plan-personal.html', { waitUntil: 'domcontentloaded' });

  // Registro.
  await page.locator('#fullName').fill('Participante Plan E2E');
  const email = page.locator('#email');
  if (await email.count()) await email.fill('plan-e2e@example.com');
  await page.locator('#registrationForm button[type="submit"]').click();
  await expect(page.locator('#module-1')).toHaveClass(/active/);

  // Localizar el modulo que contiene el plan-builder y abrirlo.
  const moduleId = await page.evaluate(() => {
    const cb = document.querySelector('.pb-comp-check');
    if (!cb) return null;
    const m = cb.closest('.module');
    return m ? Number(m.id.replace('module-', '')) : null;
  });
  expect(moduleId, 'el curso plan-personal debe tener un plan-builder').not.toBeNull();
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
  const guardado = await page.evaluate(() => localStorage.getItem('courseProgress_plan-personal'));
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
