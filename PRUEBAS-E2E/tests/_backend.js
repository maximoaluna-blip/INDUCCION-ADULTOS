// Helper de Fase 1a: intercepta TODAS las llamadas al backend de Apps Script
// (script.google.com/macros/...) para que el flujo del alumno corra contra el
// frontend de prod SIN escribir nada en el Google Sheet de producción.
//
// Además captura los payloads POST para poder verificar el contrato frontend->backend
// (action, token, campos). Devuelve el array `capturado` que se va llenando.
//
// Cuando exista el despliegue de pruebas (Fase 1b), este mismo helper se cambia para
// reenviar al endpoint de pruebas en vez de simular la respuesta.

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

async function stubBackend(page) {
  const capturado = [];
  await page.route('**/macros/s/**', async (route) => {
    const req = route.request();
    const metodo = req.method();

    if (metodo === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: CORS, body: '' });
      return;
    }
    if (metodo === 'POST') {
      try {
        const data = JSON.parse(req.postData() || 'null');
        if (data) capturado.push(data);
      } catch (e) { /* payload no-JSON: ignorar */ }
    }
    await route.fulfill({
      status: 200,
      headers: CORS,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, stub: true }),
    });
  });
  return capturado;
}

function porAccion(capturado, accion) {
  return capturado.filter((p) => p && p.action === accion);
}

module.exports = { stubBackend, porAccion };
