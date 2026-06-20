// Fase 1b — Integración REAL contra el backend de pruebas (escribe y lee de un Sheet).
// Complementa a Fase 1a: allí se verificó que el FRONTEND emite el contrato correcto;
// aquí se verifica que el BACKEND lo PERSISTE y lo devuelve (recover/verify).
//
// Se ejecuta SOLO si defines TEST_SCRIPT_URL (la /exec del despliegue de pruebas).
// Sin esa variable, los tests se omiten (CI sigue verde). Ver SETUP-FASE-1B.md.
//
//   TEST_SCRIPT_URL="https://script.google.com/macros/s/XXX/exec" npm test
//
// Usa correos *@example.com con marca de tiempo -> fáciles de filtrar/borrar del Sheet.
const { test, expect } = require('@playwright/test');

const TEST_URL = process.env.TEST_SCRIPT_URL;
const TOKEN = 'ADULTOS_ASC_2026';

function codigoCertValido(stamp) {
  // Formato exigido por el backend: ASC-YYYY-XXXXX (5 chars A-Z0-9).
  const cinco = stamp.toString(36).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(-5).padStart(5, 'A');
  return `ASC-2026-${cinco}`;
}

test.describe('@solo-escritorio Fase 1b — backend de pruebas (integración real)', () => {
  test.skip(!TEST_URL, 'Define TEST_SCRIPT_URL para correr (ver SETUP-FASE-1B.md)');

  test('register→recover y certificate→verify persisten en el Sheet de pruebas', async ({ request }) => {
    const stamp = Date.now();
    const email = `e2e-${stamp}@example.com`;
    const course = 'bienvenida-adultos';
    const fullName = `Integración E2E ${stamp}`;
    const code = codigoCertValido(stamp);

    // 1. Registro (POST con token).
    const reg = await request.post(TEST_URL, {
      headers: { 'Content-Type': 'application/json' },
      data: { action: 'register', token: TOKEN, fullName, email, age: '30', group: 'Grupo Prueba', region: 'Bogotá', motivation: 'E2E', course },
    });
    expect(reg.ok(), 'HTTP register').toBeTruthy();
    expect((await reg.json()).success, 'register success').toBe(true);

    // 2. Recover: el registro recién creado debe aparecer.
    const rec = await request.get(`${TEST_URL}?action=recover&email=${encodeURIComponent(email)}&course=${course}&token=${TOKEN}`);
    const recJson = await rec.json();
    expect(recJson.success, 'recover success').toBe(true);
    expect(recJson.data && recJson.data.registration, 'registro recuperado').toBeTruthy();

    // 3. Emitir certificado. OJO: el backend IGNORA el certificateCode del payload y
    //    genera el suyo propio (server-side). Tomamos el que devuelve la respuesta.
    const cert = await request.post(TEST_URL, {
      headers: { 'Content-Type': 'application/json' },
      data: {
        action: 'certificate', token: TOKEN, name: fullName, email,
        group: 'Grupo Prueba', region: 'Bogotá', certificateCode: code,
        completionDate: new Date().toISOString(), score: 90, studyTime: 20, course,
      },
    });
    const certJson = await cert.json();
    expect(certJson.success, 'certificate success').toBe(true);
    const codigoServidor = certJson.data && certJson.data.certificateCode;
    expect(codigoServidor, 'el backend devuelve un código de certificado').toMatch(/^ASC-\d{4}-[A-Z0-9]{5}$/);

    // 4. Verify: el certificado emitido (código del SERVIDOR) debe ser válido.
    const ver = await request.get(`${TEST_URL}?action=verify&code=${codigoServidor}&token=${TOKEN}`);
    const verJson = await ver.json();
    expect(verJson.success, 'verify success').toBe(true);
    expect(verJson.data && verJson.data.valid, 'certificado válido').toBe(true);
    expect(verJson.data.certificateCode).toBe(codigoServidor);
  });
});
