// E2E del hilo de datos autodiagnostico -> perfil de competencias -> plan personal.
//
// POR QUE EXISTE (ADR-034, Fase 1): este es el unico flujo cross-course vivo de la
// plataforma con usuarios reales, y no tenia prueba automatica. El plan-builder se
// probaba (persiste tras recargar), pero nadie verificaba que el Curso 4 dejara un
// perfil y que el Curso 5 lo precargara. La Fase 1 mueve justo ese bloque del nucleo
// compartido a la extension de esta linea; sin esta prueba, la unica garantia de que
// el refactor no rompio el flujo seria la lectura de quien lo hizo.
//
// AGNOSTICA DE LINEA como las demas: descubre por el DOM el curso con self-assessment
// y el curso con plan-builder. En una linea sin autodiagnostico se marca skipped.
const { test, expect } = require('@playwright/test');
const { stubBackend } = require('./_backend');
const { CURSOS } = require('./cursos');

async function registrar(page) {
  await page.locator('#fullName').fill('Participante Perfil E2E');
  const email = page.locator('#email');
  if (await email.count()) await email.fill('perfil-e2e@example.com');
  await page.locator('#registrationForm button[type="submit"]').click();
  await expect(page.locator('#module-1')).toHaveClass(/active/);
}

async function moduloQueContiene(page, selector) {
  return page.evaluate((sel) => {
    const el = document.querySelector(sel);
    const m = el && el.closest('.module');
    return m ? Number(m.id.replace('module-', '')) : null;
  }, selector);
}

async function abrirModulo(page, moduleId) {
  await page.evaluate((m) => showModule(m), moduleId);
  await expect(page.locator(`#module-${moduleId}`)).toHaveClass(/active/);
}

async function descubrir(page, selector) {
  for (const curso of CURSOS) {
    await page.goto(curso.file, { waitUntil: 'domcontentloaded' });
    if (await page.locator(selector).count()) return curso;
  }
  return null;
}

test('@solo-escritorio e2e: el autodiagnostico deja un perfil y el plan personal lo precarga', async ({ page }) => {
  await stubBackend(page);

  // --- 1. El curso con autodiagnostico ---------------------------------------
  const cursoSA = await descubrir(page, '.self-assessment');
  test.skip(!cursoSA, 'ningun curso del catalogo renderiza un self-assessment');
  await registrar(page);
  await abrirModulo(page, await moduloQueContiene(page, '.self-assessment'));

  const aid = await page.evaluate(() => document.querySelector('.self-assessment').id.replace(/^sa-/, ''));
  const competencias = await page.locator('.self-assessment .competence-block').evaluateAll(
    (bs) => bs.map((b) => b.getAttribute('data-competence'))
  );
  expect(competencias.length, 'el autodiagnostico tiene competencias').toBeGreaterThanOrEqual(4);

  // Tres con el grado mas bajo (seran las areas de oportunidad) y el resto con el mas alto.
  const bajas = competencias.slice(0, 3);
  for (const compId of competencias) {
    const nivel = bajas.includes(compId) ? 1 : 4;
    await page.locator(`input[name="sa-${aid}-${compId}"][value="${nivel}"]`).check();
  }

  // Recargar: restoreAssessmentSelections() debe devolver las marcas.
  await page.reload({ waitUntil: 'domcontentloaded' });
  await abrirModulo(page, await moduloQueContiene(page, '.self-assessment'));
  await expect(page.locator(`input[name="sa-${aid}-${bajas[0]}"][value="1"]`)).toBeChecked();
  await expect(page.locator(`input[name="sa-${aid}-${competencias[competencias.length - 1]}"][value="4"]`)).toBeChecked();

  // Calcular el perfil.
  await page.locator(`#sa-${aid} .self-assessment-actions button`).click();
  await expect(page.locator(`#sa-result-${aid}`)).not.toHaveClass(/hidden/);

  // Clave con apellido de linea (ADR-034 Fase 1 B2).
  const perfil = await page.evaluate(() => JSON.parse(localStorage.getItem('politica-adultos:competencyProfile') || 'null'));
  expect(perfil, 'perfil guardado bajo la clave con apellido de linea').not.toBeNull();
  expect(perfil.sourceCourse).toBe(cursoSA.courseId);
  expect(typeof perfil.scaleVersion).toBe('number');
  expect(new Set(perfil.opportunities)).toEqual(new Set(bajas));

  // --- 2. El curso con plan-builder lo precarga ------------------------------
  const cursoPB = await descubrir(page, '.pb-comp-check');
  test.skip(!cursoPB, 'ningun curso del catalogo renderiza un plan-builder');
  await registrar(page);
  await abrirModulo(page, await moduloQueContiene(page, '.pb-comp-check'));

  const banner = page.locator('[id^="pb-profile-"]').first();
  await expect(banner).not.toHaveClass(/no-profile/);
  await expect(banner).toContainText(/cargado/i);

  for (const compId of bajas) {
    await expect(page.locator(`.pb-comp-check[data-competence="${compId}"]`)).toBeChecked();
    await expect(page.locator(`#pb-grade-${compId}`)).toContainText('Grado 1');
  }
  // Y las fuertes NO vienen preseleccionadas.
  const fuerte = competencias[competencias.length - 1];
  await expect(page.locator(`.pb-comp-check[data-competence="${fuerte}"]`)).not.toBeChecked();
});

test('@solo-escritorio e2e: un perfil con escala vieja avisa y no preselecciona nada', async ({ page }) => {
  await stubBackend(page);
  const cursoPB = await descubrir(page, '.pb-comp-check');
  test.skip(!cursoPB, 'ningun curso del catalogo renderiza un plan-builder');

  const compIds = await page.locator('.pb-comp-check').evaluateAll((cs) => cs.map((c) => c.getAttribute('data-competence')));

  // Perfil calibrado con una escala anterior (scaleVersion que no coincide).
  await page.evaluate((ids) => {
    localStorage.setItem('competencyProfile', JSON.stringify({
      grades: Object.fromEntries(ids.map((id) => [id, 2])),
      strengths: ids.slice(-3), opportunities: ids.slice(0, 3),
      completedAt: new Date().toISOString(), sourceCourse: 'x', scaleVersion: -1,
    }));
  }, compIds);

  await page.reload({ waitUntil: 'domcontentloaded' });
  await registrar(page);
  const moduleId = await moduloQueContiene(page, '.pb-comp-check');
  await abrirModulo(page, moduleId);

  // Plan sin empezar: loadProfileIntoPlan detecta la escala vieja.
  const banner = page.locator('[id^="pb-profile-"]').first();
  await expect(banner).toHaveClass(/no-profile/);
  await expect(banner).toContainText(/Actualizamos/);
  for (const id of compIds.slice(0, 3)) {
    await expect(page.locator(`.pb-comp-check[data-competence="${id}"]`)).not.toBeChecked();
  }

  // Plan ya empezado: initPlanBuilders respeta lo escrito y solo avisa.
  await page.locator(`.pb-comp-check[data-competence="${compIds[0]}"]`).check();
  const meta = page.locator(`.pb-field-meta[data-competence="${compIds[0]}"]`);
  await meta.fill('Meta escrita antes del aviso'); await meta.blur();

  await page.reload({ waitUntil: 'domcontentloaded' });
  await abrirModulo(page, moduleId);
  await expect(page.locator(`.pb-comp-check[data-competence="${compIds[0]}"]`)).toBeChecked();
  await expect(page.locator(`.pb-field-meta[data-competence="${compIds[0]}"]`)).toHaveValue('Meta escrita antes del aviso');
  await expect(page.locator('[id^="pb-profile-"]').first()).toContainText(/Actualizamos el autodiagn/);
});

test('@solo-escritorio e2e: un perfil guardado con la clave vieja migra solo y sigue precargando', async ({ page }) => {
  // ADR-034 Fase 1 B2: la clave paso a llevar apellido de linea. Un estudiante que
  // hizo el Curso 4 ANTES del cambio tiene su perfil bajo 'competencyProfile' a secas.
  // No puede perderlo: getCompetencyProfile lo lee una vez y lo copia a la clave nueva.
  await stubBackend(page);
  const cursoPB = await descubrir(page, '.pb-comp-check');
  test.skip(!cursoPB, 'ningun curso del catalogo renderiza un plan-builder');

  const compIds = await page.locator('.pb-comp-check').evaluateAll((cs) => cs.map((c) => c.getAttribute('data-competence')));
  const version = await page.evaluate(() => COMPETENCY_SCALE_VERSION);

  // Sembrar SOLO la clave vieja, con la escala vigente (perfil valido, formato anterior).
  await page.evaluate(({ ids, version }) => {
    localStorage.removeItem('politica-adultos:competencyProfile');
    localStorage.setItem('competencyProfile', JSON.stringify({
      grades: Object.fromEntries(ids.map((id, i) => [id, i < 3 ? 1 : 4])),
      strengths: ids.slice(-3), opportunities: ids.slice(0, 3),
      completedAt: new Date().toISOString(), sourceCourse: 'competencias-esenciales', scaleVersion: version,
    }));
  }, { ids: compIds, version });

  await page.reload({ waitUntil: 'domcontentloaded' });
  await registrar(page);
  await abrirModulo(page, await moduloQueContiene(page, '.pb-comp-check'));

  // Precarga como si nada hubiera cambiado...
  const banner = page.locator('[id^="pb-profile-"]').first();
  await expect(banner).not.toHaveClass(/no-profile/);
  await expect(banner).toContainText(/cargado/i);
  for (const id of compIds.slice(0, 3)) {
    await expect(page.locator(`.pb-comp-check[data-competence="${id}"]`)).toBeChecked();
  }
  // ...y el perfil quedo copiado bajo la clave nueva.
  const migrado = await page.evaluate(() => JSON.parse(localStorage.getItem('politica-adultos:competencyProfile') || 'null'));
  expect(migrado, 'perfil copiado a la clave con apellido de linea').not.toBeNull();
  expect(new Set(migrado.opportunities)).toEqual(new Set(compIds.slice(0, 3)));
});
