#!/usr/bin/env node
/**
 * verificar-backend.js — Validación pre-deploy del backend Apps Script.
 *
 * Verifica 4 cosas antes de tocar producción:
 *   1. La URL de `googleScriptUrl` en build-course.js coincide con la URL del
 *      deployment de producción declarado en BACKEND.md.
 *   2. El endpoint responde (no está caído).
 *   3. El JSON de respuesta tiene los campos detallados esperados
 *      (registros[], certificados[], modulos[], resumen{}) — no solo los KPI.
 *   4. Si hay un workspace clasp local, su deployment activo coincide con
 *      el de producción declarado (detecta scripts duplicados).
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

function fetchUrl(url, timeoutMs = 15000) {
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

  // -------- Hacer GET al endpoint y validar shape de la respuesta --------
  step('Paso 4 — endpoint responde y devuelve los campos detallados');
  if (!prodUrl) {
    fail('Sin PROD_DEPLOYMENT_URL, no puedo probar.');
  } else {
    const url = prodUrl + (prodUrl.includes('?') ? '&' : '?') + 'action=stats&t=' + Date.now();
    try {
      const res = await fetchUrl(url);
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
              ['registros', Array.isArray(data.registros)],
              ['certificados', Array.isArray(data.certificados)],
              ['modulos', Array.isArray(data.modulos)],
              ['resumen', typeof data.resumen === 'object' && data.resumen !== null],
              ['totalUsers', typeof data.totalUsers === 'number'],
              ['totalCertificates', typeof data.totalCertificates === 'number'],
            ];
            const missing = checks.filter(c => !c[1]).map(c => c[0]);
            if (missing.length === 0) {
              pass('JSON contiene todos los campos detallados.');
              pass(`Stats actuales: ${data.totalUsers} registros · ${data.totalCertificates} certificados.`);
            } else {
              fail('El endpoint responde pero NO devuelve los campos detallados.',
                'Faltan: ' + missing.join(', ') +
                '\n\n    Causa probable: el código del deployment es VIEJO.' +
                '\n    Solución: hacer redeploy del Apps Script con el código actualizado de google-apps-script.js.');
            }
          }
        }
      }
    } catch (e) {
      fail('Error al hacer fetch al endpoint.', e.message);
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
