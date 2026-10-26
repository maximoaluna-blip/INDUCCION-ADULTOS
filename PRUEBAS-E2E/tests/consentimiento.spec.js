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

  // ADR-139. Hasta aqui la suite comprobaba que la casilla fuera obligatoria, no que
  // la autorizacion LLEGARA: el backend no la recibia y ninguna hoja la guardaba.
  // Lo que se mira ahora es lo que sale hacia el backend, campo por campo.
  test('la caja dice a quien se pide la eliminacion y enlaza la politica', async ({ page }) => {
    const curso = CURSOS[0];
    await page.goto(curso.file, { waitUntil: 'domcontentloaded' });
    for (const caja of [page.locator('#registrationForm .consent-box'), page.locator('#recoverySection .consent-box')]) {
      await expect(caja).toContainText('adultos.valle@scout.org.co');
      await expect(caja.locator('a[href="https://scout.org.co/politica-privacidad/"]')).toHaveCount(1);
    }
  });

  test('el registro enviado lleva la version del texto autorizado', async ({ page }) => {
    const curso = CURSOS[0];
    await page.goto(curso.file, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      window.__enviados = [];
      window.sendToGoogleSheets = (d) => { window.__enviados.push(d); };
    });
    await page.fill('#fullName', 'Ana Prueba');
    await page.fill('#email', 'ana@example.com');
    await page.check('#consent');
    await page.click('#registrationForm button[type="submit"]');
    const reg = (await page.evaluate(() => window.__enviados)).find((d) => d && d.action === 'register');
    expect(reg, 'no salio ningun register').toBeTruthy();
    expect(reg.consent && reg.consent.version).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test('recuperar no muestra nada sin el codigo, y el codigo lleva la autorizacion', async ({ page }) => {
    const curso = CURSOS[0];
    await page.goto(curso.file, { waitUntil: 'domcontentloaded' });
    // Backend simulado: el primer paso solo dice "te enviamos un codigo"; el
    // segundo devuelve el avance. Si la pagina pintara datos en el primero, o no
    // mandara el codigo en el segundo, esta prueba lo ve.
    await page.evaluate(() => {
      window.__urls = [];
      window.sendToGoogleSheets = () => {};
      window.fetch = async (url) => {
        window.__urls.push(String(url));
        const conCodigo = /[?&]code=/.test(String(url));
        const cuerpo = conCodigo
          ? { success: true, data: { registration: { fullName: 'Ana Prueba', email: 'ana@example.com' },
              registeredInCourse: true, modules: [], quizzes: [], certificates: [], saved: {} } }
          : { success: true, data: { codeSent: true, message: 'Si ese correo tiene avance, te enviamos un codigo.' } };
        return { ok: true, json: async () => cuerpo };
      };
    });
    await page.click('#toggleRecover');
    await page.fill('#recoveryEmail', 'ana@example.com');
    await page.check('#consentRecover');
    await page.click('button[onclick="recoverProgress()"]');

    await expect(page.locator('#recoveryCodeGroup')).toBeVisible();
    let urls = await page.evaluate(() => window.__urls);
    expect(urls).toHaveLength(1);
    expect(urls[0]).toContain('v=2');
    expect(urls[0]).not.toContain('code=');
    // Sin codigo, nadie entro: la bienvenida no tiene nombre.
    await expect(page.locator('#welcomeName')).not.toHaveText('Ana');

    await page.fill('#recoveryCode', '000000');
    await page.click('button[onclick="confirmarCodigoRecuperacion()"]');
    await expect.poll(() => page.evaluate(() => window.__urls.length)).toBe(2);
    urls = await page.evaluate(() => window.__urls);
    expect(urls[1]).toContain('code=000000');
    expect(urls[1]).toMatch(/consentVersion=\d{4}-\d{2}-\d{2}/);
    await expect(page.locator('#welcomeName')).toHaveText('Ana');
  });
});
