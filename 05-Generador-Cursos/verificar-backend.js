#!/usr/bin/env node
/**
 * verificar-backend.js — Validación pre-deploy del backend Apps Script.
 *
 * Verifica 6 cosas antes de tocar producción:
 *   1. La URL de `googleScriptUrl` en build-course.js coincide con la URL del
 *      deployment de producción declarado en BACKEND.md.
 *   2. El endpoint responde (no está caído).
 *   3. El JSON del GET publico trae los agregados (modulos[], resumen{}, KPI)
 *      y NO trae identidades: desde el ADR-078 `registros[]` y `certificados[]`
 *      solo se sirven por POST con la clave de administracion. Si vuelven llenos
 *      sin clave, produccion esta sirviendo el padron a quien tenga la URL.
 *   4. Si hay un workspace clasp local, su deployment activo coincide con
 *      el de producción declarado (detecta scripts duplicados).
 *   5. El código que producción SIRVE de verdad conoce ADR-030 (análisis de
 *      ítems). Los pasos 1-4 solo comparan archivos entre sí: un backend
 *      fijado a una versión vieja los pasa todos en verde.
 *   6. Y que ese mismo código desplegado calcula la tasa de completación por
 *      INSCRIPCIONES (ADR-079). Es el otro síntoma de lo mismo: el panel
 *      publicaba 105 % porque dividía certificados entre registros.
 *
 * Uso:
 *   node verificar-backend.js
 *
 * Salida:
 *   - Exit 0 si todo está OK.
 *   - Exit 1 si encuentra una desincronización (con mensaje claro).
 *
 * Convenciones:
 *   - BACKEND.md vive en la raíz del repo de la línea (un nivel arriba de 05-Generador-Cursos/).
 *   - Lee de él: PROD_DEPLOYMENT_URL, PROD_SCRIPT_ID, AUTH_TOKEN.
 *   - build-course.js debe seguir teniendo la línea `googleScriptUrl: "..."`.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// --- Resolver rutas ---
const BASE_DIR = __dirname;
const REPO_ROOT = path.resolve(BASE_DIR, '..');
const BUILD_PATH = path.join(BASE_DIR, 'build-course.js');
const BACKEND_MD_PATH = path.join(REPO_ROOT, 'BACKEND.md');
const CLASP_JSON_PATH = path.join(REPO_ROOT, '.clasp-workspace', '.clasp.json');

const colors = {
  red: s => `\x1b[31m${s}\x1b[0m`,
  green: s => `\x1b[32m${s}\x1b[0m`,
  yellow: s => `\x1b[33m${s}\x1b[0m`,
  cyan: s => `\x1b[36m${s}\x1b[0m`,
  bold: s => `\x1b[1m${s}\x1b[0m`,
};

let failures = 0;
function pass(msg) { console.log(`  ${colors.green('✓')} ${msg}`); }
function fail(msg, detail) {
  console.log(`  ${colors.red('✗')} ${msg}`);
  if (detail) console.log(`    ${colors.yellow(detail)}`);
  failures++;
}
function warn(msg) { console.log(`  ${colors.yellow('⚠')} ${msg}`); }
function step(msg) { console.log(`\n${colors.bold(colors.cyan('▸ ' + msg))}`); }

// --- Parse helpers ---
function extractField(md, label) {
  // Busca el valor del campo en BACKEND.md. Soporta dos formatos:
  //   1) Tabla markdown:  | **LABEL** | `valor` |   (o sin backticks)
  //   2) Bullet:          - **LABEL:** valor
  //   3) Inline:          LABEL: valor
  const esc = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Formato 1: tabla
  let re = new RegExp(`\\|\\s*\\*?\\*?${esc}\\*?\\*?\\s*\\|\\s*\`?([^\`\\n|]+?)\`?\\s*\\|`, 'i');
  let m = md.match(re);
  if (m) return m[1].trim();

  // Formato 2 y 3: bullet o inline
  re = new RegExp(`(?:\\*\\*)?${esc}(?:\\*\\*)?\\s*[:=]\\s*\`?([^\`\\n]+?)\`?\\s*(?:$|\\n)`, 'i');
  m = md.match(re);
  return m ? m[1].trim() : null;
}

function extractGoogleScriptUrl(buildSource) {
  // build-course.js define el URL como default fallback: `'https://script.google.com/macros/s/.../exec'`
  // También puede aparecer dentro de un template literal del HTML generado.
  // Aceptamos cualquiera de los dos.
  const patterns = [
    /googleScriptUrl:\s*["']([^"']+\/macros\/s\/[^"']+)["']/,
    /['"](https:\/\/script\.google\.com\/macros\/s\/[^"']+?\/exec)['"]/,
  ];
  for (const p of patterns) {
    const m = buildSource.match(p);
    if (m) return m[1];
  }
  return null;
}

function deploymentIdFromUrl(url) {
  if (!url) return null;
  // https://script.google.com/macros/s/<DEPLOYMENT_ID>/exec
  const m = url.match(/\/macros\/s\/([^\/]+)\/exec/);
  return m ? m[1] : null;
}

// 45 s, y no 15. El payload de `stats` agrega SEIS hojas -registros, certificados,
// progreso, evaluaciones, items- y hoy tarda decenas de segundos; la primera llamada
// despues de promover una version tarda mas todavia, porque Apps Script recompila.
// Con 15 s este paso salía en rojo con un backend perfectamente sano, y un rojo que
// significa "tardó" se lee igual que uno que significa "está roto".
function fetchUrl(url, timeoutMs = 45000) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { timeout: timeoutMs }, res => {
      // Apps Script suele redirigir a googleusercontent — seguir redirección
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        fetchUrl(res.headers.location, timeoutMs).then(resolve, reject);
        return;
      }
      let body = '';
      res.on('data', c => (body += c));
      res.on('end', () => resolve({ status: res.statusCode, body }));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(new Error('Timeout')); });
  });
}

// --- Main ---
(async function main() {
  console.log(colors.bold('\nverificar-backend.js — validación pre-deploy\n'));

  // -------- Cargar BACKEND.md --------
  step('Paso 1 — Cargar BACKEND.md');
  if (!fs.existsSync(BACKEND_MD_PATH)) {
    fail('No existe BACKEND.md en la raíz del repo.', 'Esperado en: ' + BACKEND_MD_PATH);
    console.log('\n' + colors.yellow('Sin BACKEND.md no puedo validar. Créalo con los campos: PROD_DEPLOYMENT_URL, PROD_SCRIPT_ID, AUTH_TOKEN.'));
    process.exit(1);
  }
  pass('BACKEND.md encontrado.');

  const md = fs.readFileSync(BACKEND_MD_PATH, 'utf-8');
  const prodUrl = extractField(md, 'PROD_DEPLOYMENT_URL') || extractField(md, 'URL de producción') || extractField(md, 'Deployment URL');
  const prodScriptId = extractField(md, 'PROD_SCRIPT_ID') || extractField(md, 'Script ID');
  const authToken = extractField(md, 'AUTH_TOKEN') || extractField(md, 'Token de auth');

  if (!prodUrl) fail('Falta PROD_DEPLOYMENT_URL en BACKEND.md.');
  else pass('PROD_DEPLOYMENT_URL = ' + prodUrl.slice(0, 70) + '...');
  if (!prodScriptId) warn('No se encontró PROD_SCRIPT_ID (opcional pero recomendado).');
  else pass('PROD_SCRIPT_ID = ' + prodScriptId);
  if (!authToken) warn('No se encontró AUTH_TOKEN.');

  // -------- Verificar coherencia build-course.js ↔ BACKEND.md --------
  step('Paso 2 — build-course.js apunta al deployment de producción');
  if (!fs.existsSync(BUILD_PATH)) {
    fail('No existe build-course.js', 'Esperado en: ' + BUILD_PATH);
  } else {
    const buildSrc = fs.readFileSync(BUILD_PATH, 'utf-8');
    const buildUrl = extractGoogleScriptUrl(buildSrc);
    if (!buildUrl) {
      fail('No encontré `googleScriptUrl: "..."` en build-course.js.');
    } else if (prodUrl && buildUrl !== prodUrl) {
      fail('Desincronización: build-course.js apunta a otra URL.',
        'build-course.js: ' + buildUrl + '\n    BACKEND.md:     ' + prodUrl);
    } else {
      pass('build-course.js coincide con BACKEND.md.');
    }
  }

  // -------- Verificar coherencia clasp ↔ BACKEND.md --------
  step('Paso 3 — clasp local apunta al script real de producción');
  if (!fs.existsSync(CLASP_JSON_PATH)) {
    warn('No hay workspace clasp local (.clasp-workspace/.clasp.json). Saltado.');
  } else {
    try {
      const claspCfg = JSON.parse(fs.readFileSync(CLASP_JSON_PATH, 'utf-8'));
      if (prodScriptId && claspCfg.scriptId !== prodScriptId) {
        fail('Desincronización: clasp apunta a OTRO script.',
          'clasp:      ' + claspCfg.scriptId + '\n    BACKEND.md: ' + prodScriptId + '\n\n    Solución: borrar .clasp-workspace y reclonar:\n      rm -rf .clasp-workspace && clasp clone ' + prodScriptId);
      } else {
        pass('clasp scriptId coincide con BACKEND.md.');
      }
    } catch (e) {
      fail('No pude parsear .clasp.json: ' + e.message);
    }
  }

  let statsData = null;

  // -------- Hacer GET al endpoint y validar shape de la respuesta --------
  step('Paso 4 — el endpoint responde, trae agregados y NO identifica a nadie');
  if (!prodUrl) {
    fail('Sin PROD_DEPLOYMENT_URL, no puedo probar.');
  } else {
    const url = prodUrl + (prodUrl.includes('?') ? '&' : '?') + 'action=stats&t=' + Date.now();
    try {
      // Un reintento, y solo ante Timeout: si el endpoint responde mal, que falle a
      // la primera; si tarda, que no invente una averia que no hay.
      let res;
      try {
        res = await fetchUrl(url);
      } catch (e1) {
        if (!/Timeout/i.test(e1.message)) throw e1;
        warn('Primer intento agotado (' + e1.message + '). Reintentando una vez\u2026');
        res = await fetchUrl(url);
      }
      if (res.status !== 200) {
        fail('El endpoint devolvió HTTP ' + res.status, 'Esperado 200.');
      } else {
        let parsed;
        try { parsed = JSON.parse(res.body); }
        catch (e) {
          fail('La respuesta no es JSON válido.',
            'Posible causa: el deployment no es público (acceso denegado).\n    Cuerpo (primeros 200 chars): ' + res.body.slice(0, 200));
        }
        if (parsed) {
          if (!parsed.success) {
            fail('Apps Script reportó error.', parsed.error || JSON.stringify(parsed).slice(0, 200));
          } else {
            const data = parsed.data || {};
            const checks = [
              ['modulos', Array.isArray(data.modulos)],
              ['resumen', typeof data.resumen === 'object' && data.resumen !== null],
              ['totalUsers', typeof data.totalUsers === 'number'],
              ['totalCertificates', typeof data.totalCertificates === 'number'],
            ];
            const missing = checks.filter(c => !c[1]).map(c => c[0]);
            if (missing.length === 0) {
              statsData = data;
              pass('JSON contiene los agregados esperados.');
              pass(`Stats actuales: ${data.totalUsers} registros · ${data.totalCertificates} certificados.`);
            } else {
              fail('El endpoint responde pero NO devuelve los agregados.',
                'Faltan: ' + missing.join(', ') +
                '\n\n    Causa probable: el código del deployment es VIEJO.' +
                '\n    Solución: hacer redeploy del Apps Script con el código actualizado de google-apps-script.js.');
            }

            // --- ADR-078: la parte que de verdad importa de este paso ---
            // Esta llamada NO lleva clave. Si vuelve con gente dentro, cualquiera
            // con la URL del deployment —que viaja en el HTML de los 32 cursos—
            // se lleva el padron. No es un aviso: es la fuga, medida en vivo.
            const nReg = Array.isArray(data.registros) ? data.registros.length : 0;
            const nCert = Array.isArray(data.certificados) ? data.certificados.length : 0;
            if (nReg > 0 || nCert > 0) {
              const muestra = (data.registros && data.registros[0]) || (data.certificados && data.certificados[0]) || {};
              fail('EL PADRÓN ESTÁ ABIERTO: el GET sin clave devolvió datos identificados.',
                [
                  `Vinieron ${nReg} registro(s) y ${nCert} certificado(s) sin pedir nada.`,
                  '    Campos que llegaron: ' + Object.keys(muestra).join(', '),
                  '',
                  '    Causa: producción sirve una versión anterior al ADR-078.',
                  '    Un `clasp push` NO basta — hay que crear versión y reapuntar el deployment.',
                ].join('\n'));
            } else if (data.detalleIncluido === false) {
              pass('El GET público no identifica a nadie, y lo declara (`detalleIncluido: false`).');
            } else {
              warn('El GET público no trajo identidades, pero tampoco declara `detalleIncluido`: ' +
                   'el deployment puede ser anterior al ADR-078 y estar simplemente sin datos.');
            }

            // El correo no sale ni con clave: que no aparezca nunca en este payload.
            const crudo = JSON.stringify(data);
            if (/"email"\s*:/.test(crudo)) {
              fail('El payload de stats trae el campo `email`.',
                'El ADR-078 lo retiró del detalle: el panel nunca lo mostró ni lo exportó.');
            }
          }
        }
      }
    } catch (e) {
      fail('Error al hacer fetch al endpoint.', e.message);
    }
  }

  // -------- El código desplegado conoce ADR-030 --------
  step('Paso 5 — el deployment sirve el análisis de ítems (ADR-030)');
  if (!statsData) {
    warn('Sin respuesta válida en el paso 4, no puedo comprobarlo.');
  } else if (!Array.isArray(statsData.items)) {
    fail('El código desplegado NO conoce el análisis de ítems (ADR-030).',
      [
        'Falta la clave `items` en el payload de stats.',
        '',
        '    Causa: producción está fijada a una versión anterior a ADR-030.',
        '    Los cursos envían action "items", el backend responde "Acción POST no',
        '    reconocida" y el dato se pierde en silencio: el motor ignora la respuesta.',
        '    Un `clasp push` NO basta — hay que crear versión y reapuntar el deployment:',
        '      npx clasp list-deployments',
        '      npx clasp create-deployment -i <deploymentId> -d "<motivo>"',
      ].join('\n'));
  } else {
    pass('El deployment conoce ADR-030 (' + statsData.items.length + ' ítem(s) en el análisis).');

    const conAbandono = (statsData.modulos || []).some(m => typeof m.abandonoPct === 'number');
    if (!conAbandono) {
      warn('Hay `items` pero ningún módulo trae `abandonoPct` — el deployment puede haber quedado a medias.');
    }

    // Los datos de prueba falsean las tasas de acierto reales.
    const pruebas = statsData.items
      .map(i => i && i.curso)
      .filter(c => c && /^zz-|prueba|test/i.test(c));
    const unicos = pruebas.filter((c, i) => pruebas.indexOf(c) === i);
    if (unicos.length) {
      warn('Datos de prueba en producción: ' + unicos.join(', '));
      console.log('    ' + colors.yellow('Bórralos del Sheet antes de que ensucien las tasas de acierto reales.'));
    }
  }

  // -------- La tasa de completacion se mide por inscripciones --------
  step('Paso 6 — el deployment calcula la tasa por inscripciones (ADR-079)');
  if (!statsData) {
    warn('Sin respuesta válida en el paso 4, no puedo comprobarlo.');
  } else {
    const resumen = statsData.resumen || {};
    const tasa = resumen.tasaCompletacion;
    if (typeof resumen.inscripciones !== 'number') {
      fail('El código desplegado NO conoce el ADR-079.',
        [
          'El `resumen` no trae `inscripciones`, así que su `tasaCompletacion` (' + tasa + ')',
          '    sigue siendo `totalCertificates / totalUsers`: una división que cruza cursos y',
          '    que el 21-sep-2026 publicaba 105 % en el panel.',
          '',
          '    Un `clasp push` NO basta — hay que crear versión y reapuntar el deployment:',
          '      npx clasp list-deployments',
          '      npx clasp create-deployment -i <deploymentId> -d "<motivo>"',
        ].join('\n'));
    } else if (typeof tasa !== 'number' || tasa > 100) {
      // Con la formula nueva esto no puede pasar: numerador y denominador son el
      // mismo conjunto de pares persona+curso. Si pasa, algo cuenta de mas.
      fail('La tasa de completación es imposible: ' + tasa + ' %.',
        'Con ' + resumen.inscripcionesCompletadas + ' de ' + resumen.inscripciones +
        ' inscripciones no puede pasar del 100 %.');
    } else {
      pass('Tasa por inscripciones: ' + tasa + ' % (' + resumen.inscripcionesCompletadas +
           ' de ' + resumen.inscripciones + ').');
      if (resumen.certificadosSinInscripcion) {
        warn(resumen.certificadosSinInscripcion + ' certificado(s) sin inscripción que los respalde.');
        console.log('    ' + colors.yellow('Alguien certifica sin pasar por el registro: no inflan la tasa, pero conviene mirarlo.'));
      }
    }
  }

  // -------- Resumen final --------
  console.log('');
  if (failures > 0) {
    console.log(colors.red(colors.bold(`✗ ${failures} verificación(es) fallaron. NO hagas deploy hasta resolverlas.`)));
    process.exit(1);
  } else {
    console.log(colors.green(colors.bold('✓ Todo OK. Backend sincronizado y respondiendo correctamente.')));
    process.exit(0);
  }
})();
