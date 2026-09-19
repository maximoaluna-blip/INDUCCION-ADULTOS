// Puntuacion impresa en el certificado — compuerta nacida del defecto del 19-sep-2026.
//
// POR QUE EXISTE: `quizScores` se indexa por NUMERO DE MODULO, y los modulos con quiz
// empiezan en el 2, asi que los indices bajos quedan VACIOS. El promedio se calculaba
// `reduce(...) / length`: reduce() se salta los huecos pero length los CUENTA. Un curso
// de seis lecciones con TODO acertado imprimia 600/8 = **75 %**. Vivio asi en las 5
// lineas y los 33 cursos.
//
// Es hermana de feedback-quiz.spec.js y nace por el mismo motivo: el flujo E2E recorria
// registro -> quizzes -> certificado y comprobaba el CODIGO del certificado, nunca su
// PUNTUACION. Lo que no se mira, deriva.
const { test, expect } = require('@playwright/test');
const { CURSOS } = require('./cursos');
const { stubBackend } = require('./_backend');

async function registrarse(page) {
  await page.locator('#fullName').fill('Participante E2E De Prueba');
  const email = page.locator('#email');
  if (await email.count()) await email.fill('e2e-prueba@example.com');
  await page.locator('#registrationForm button[type="submit"]').click();
  await expect(page.locator('#module-1')).toHaveClass(/active/);
}

async function responderBien(page, moduleId, correctas) {
  await page.evaluate((m) => showModule(m), moduleId);
  await expect(page.locator(`#module-${moduleId}`)).toHaveClass(/active/);
  const preguntas = page.locator(`#module-${moduleId} .question`);
  for (let qi = 0; qi < correctas.length; qi++) {
    await preguntas.nth(qi)
      .locator(`.option[onclick="selectOption(this, ${correctas[qi]})"]`).click();
  }
  await page.locator(`#checkBtn-${moduleId}`).click();
  await expect(page.locator(`#nextBtn-${moduleId}`)).toBeVisible();
  await page.locator(`#nextBtn-${moduleId}`).click();
}

test.describe('@solo-escritorio puntuacion del certificado', () => {
  for (const curso of CURSOS) {
    test(`acertando TODO, ${curso.courseId} certifica 100 %`, async ({ page }) => {
      await stubBackend(page);
      await page.goto(curso.file, { waitUntil: 'domcontentloaded' });
      await registrarse(page);

      const respuestas = await page.evaluate(() => QUIZ_ANSWERS);
      const idsQuiz = Object.keys(respuestas).map(Number).sort((a, b) => a - b);
      expect(idsQuiz.length, 'el curso debe tener al menos un quiz').toBeGreaterThan(0);

      for (const m of idsQuiz) await responderBien(page, m, respuestas[m]);

      await page.evaluate(() => showModule(COURSE_CONFIG.totalModules - 1));
      const impreso = (await page.locator('#finalScore').textContent()).trim();

      expect(
        impreso,
        `${curso.courseId}: se acertaron las ${idsQuiz.length} evaluaciones y el certificado ` +
        `imprime "${impreso} %". Si dice 75 u 83, el promedio esta contando los huecos del ` +
        `array quizScores (ver la cabecera de este archivo).`
      ).toBe('100');
    });
  }
});
