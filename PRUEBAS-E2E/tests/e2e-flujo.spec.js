// E2E del flujo completo del alumno (Fase 1a) — sin escribir en prod.
// Registro -> responder cada quiz con >=70% -> recorrer modulos -> certificado.
// Verifica tambien que el frontend POSTea el contrato correcto al backend
// (action + token + course), interceptado por _backend.js.
//
// Checklist: §F (mecanica de componentes), §G (flujo y certificado).
// El codigo de certificado se genera en el cliente (engine.js generateCertificate).
const { test, expect } = require('@playwright/test');
const { CURSOS } = require('./cursos');
const { stubBackend, porAccion } = require('./_backend');

const CODIGO_CERT = /^ASC-\d{4}-[A-Z0-9]{5}$/;
const TOKEN = 'ADULTOS_ASC_2026';

async function registrarse(page) {
  await page.locator('#fullName').fill('Participante E2E De Prueba');
  // age/group/region/motivation no son obligatorios; email se usa en payloads.
  const email = page.locator('#email');
  if (await email.count()) await email.fill('e2e-prueba@example.com');
  const age = page.locator('#age');
  if (await age.count()) await age.fill('30');
  await page.locator('#registrationForm button[type="submit"]').click();
  // Tras el registro el motor muestra el modulo 1 (bienvenida).
  await expect(page.locator('#module-1')).toHaveClass(/active/);
}

async function responderQuiz(page, moduleId, correctas) {
  await page.evaluate((m) => showModule(m), moduleId);
  await expect(page.locator(`#module-${moduleId}`)).toHaveClass(/active/);

  const preguntas = page.locator(`#module-${moduleId} .question`);
  for (let qi = 0; qi < correctas.length; qi++) {
    const idx = correctas[qi];
    // Las opciones se barajan, pero conservan su onclick con el indice original.
    await preguntas.nth(qi).locator(`.option[onclick="selectOption(this, ${idx})"]`).click();
  }
  await page.locator(`#checkBtn-${moduleId}`).click();
  // El boton "siguiente" solo aparece si se aprobo (>=70%).
  await expect(page.locator(`#nextBtn-${moduleId}`)).toBeVisible();
  await page.locator(`#nextBtn-${moduleId}`).click(); // completeModule -> POST progress
}

for (const curso of CURSOS) {
  test(`@solo-escritorio e2e: ${curso.courseId} registro -> quizzes -> certificado`, async ({ page }) => {
    const capturado = await stubBackend(page);

    await page.goto(curso.file, { waitUntil: 'domcontentloaded' });
    await registrarse(page);

    const respuestas = await page.evaluate(() => QUIZ_ANSWERS);
    const cfg = await page.evaluate(() => COURSE_CONFIG);
    const idsQuiz = Object.keys(respuestas).map(Number).sort((a, b) => a - b);
    expect(idsQuiz.length, 'el curso debe tener al menos un quiz').toBeGreaterThan(0);

    for (const m of idsQuiz) {
      await responderQuiz(page, m, respuestas[m]);
    }

    // Ir al certificado y REVISITARLO a proposito: la emision debe ser idempotente
    // (mismo codigo, sin segundo POST).
    await page.evaluate(() => showModule(COURSE_CONFIG.totalModules - 1));
    await expect(page.locator('#certCode')).toHaveText(CODIGO_CERT);
    const codigo1 = await page.locator('#certCode').textContent();
    await page.evaluate(() => showModule(1));
    await page.evaluate(() => showModule(COURSE_CONFIG.totalModules - 1));
    await expect(page.locator('#certCode')).toHaveText(codigo1); // mismo codigo tras revisitar

    // --- Contrato frontend -> backend ---
    expect(porAccion(capturado, 'register').length, 'POST register').toBeGreaterThanOrEqual(1);
    expect(porAccion(capturado, 'quiz').length, 'POST quiz').toBeGreaterThanOrEqual(1);
    expect(porAccion(capturado, 'progress').length, 'POST progress').toBeGreaterThanOrEqual(1);

    // Idempotencia: aunque se revisite el modulo, el certificado se emite UNA sola vez.
    const certs = porAccion(capturado, 'certificate');
    expect(certs.length, 'POST certificate (idempotente)').toBe(1);
    expect(certs[0].certificateCode).toMatch(CODIGO_CERT);
    expect(certs[0].course).toBe(cfg.courseId);

    // Todo envio lleva el token de autenticacion.
    for (const p of capturado) {
      expect(p.token, `token en payload ${p.action}`).toBe(TOKEN);
    }
  });
}
