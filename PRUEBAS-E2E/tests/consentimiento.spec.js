// Consentimiento de tratamiento de datos — Ley 1581 de 2012 (Habeas Data).
//
// POR QUE EXISTE (ADR-081):
// La plataforma pide nombre, edad, grupo, region y correo, y manda a una hoja de
// la Asociacion lo que la persona escribe en reflexiones, ejercicios y planes.
// Hasta el 27-sep-2026 lo AVISABA —una caja al pie del registro— pero no pedia
// autorizacion, y la ley exige autorizacion previa, expresa e informada. Medido
// ese dia: 0 de 35 paginas de curso mencionaban la ley, mientras la app hermana
// EVALUACIONES-ASC llevaba desde junio con casilla obligatoria (su D8).
//
// LO QUE VIGILA Y NO ES OBVIO: que la casilla siga siendo OBLIGATORIA. Quitarle
// el `required` no rompe nada visible —la caja se sigue viendo, el texto sigue
// ahi— y el formulario volveria a enviarse sin autorizacion. Un aviso que se
// puede saltar es exactamente lo que habia antes.
//
// Y LA SEGUNDA PUERTA: desde el ADR-080 «Recuperar mi Avance» tambien INSCRIBE.
// Esa caja no vive dentro de un <form>, asi que no hay validacion nativa que la
// cubra: la comprueba el motor a mano, y por eso se prueba aparte.
const { test, expect } = require('@playwright/test');
const { CURSOS } = require('./cursos');

test.describe('@solo-escritorio consentimiento de datos (Ley 1581)', () => {
  for (const curso of CURSOS) {
    test(`consentimiento: ${curso.courseId} lo pide y cita la ley`, async ({ page }) => {
      await page.goto(curso.file, { waitUntil: 'domcontentloaded' });

      const casilla = page.locator('#consent');
      await expect(casilla).toHaveCount(1);
      // Obligatoria, no decorativa.
      await expect(casilla).toHaveAttribute('required', '');

      const caja = page.locator('.consent-box').first();
      await expect(caja).toContainText('Ley 1581 de 2012');
      await expect(caja).toContainText('Asociaci');

      // La otra puerta de entrada: recuperar tambien inscribe (ADR-080).
      await expect(page.locator('#consentRecover')).toHaveCount(1);
    });
  }

  test('sin marcarla, el registro no se envia', async ({ page }) => {
    const curso = CURSOS[0];
    await page.goto(curso.file, { waitUntil: 'domcontentloaded' });

    // Se cuenta lo que saldria hacia el backend, sin que salga nada.
    await page.evaluate(() => {
      window.__enviados = [];
      window.sendToGoogleSheets = (d) => { window.__enviados.push(d && d.action); };
    });

    await page.fill('#fullName', 'Ana Prueba');
    await page.fill('#email', 'ana@example.com');

    const validoSinMarcar = await page.evaluate(
      () => document.getElementById('registrationForm').checkValidity());
    expect(validoSinMarcar).toBe(false);

    await page.click('#registrationForm button[type="submit"]');
    expect(await page.evaluate(() => window.__enviados)).toEqual([]);

    // Marcandola, el formulario ya es valido.
    await page.check('#consent');
    const validoMarcando = await page.evaluate(
      () => document.getElementById('registrationForm').checkValidity());
    expect(validoMarcando).toBe(true);
  });

  test('sin marcarla, recuperar el avance tampoco llama al backend', async ({ page }) => {
    const curso = CURSOS[0];
    await page.goto(curso.file, { waitUntil: 'domcontentloaded' });

    await page.evaluate(() => {
      window.__peticiones = 0;
      window.fetch = async () => {
        window.__peticiones++;
        return { ok: true, json: async () => ({ success: false }) };
      };
    });

    await page.click('#toggleRecover');
    await page.fill('#recoveryEmail', 'ana@example.com');
    // El boton exacto, por su onclick: "Recuperar" tambien aparece en el toggle
    // de arriba, y un selector por texto se lleva el que no es -- que ademas
    // dejaria pasar la prueba por la razon equivocada, con 0 peticiones.
    const boton = page.locator('button[onclick="recoverProgress()"]');
    await boton.click();
    expect(await page.evaluate(() => window.__peticiones)).toBe(0);

    await page.check('#consentRecover');
    await boton.click();
    expect(await page.evaluate(() => window.__peticiones)).toBe(1);
  });
});
