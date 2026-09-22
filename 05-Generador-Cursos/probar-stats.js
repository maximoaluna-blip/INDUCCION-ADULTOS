#!/usr/bin/env node
/**
 * probar-stats.js — compuerta local del ADR-078, sin red y sin producción.
 *
 * QUÉ VIGILA. Que `?action=stats` no vuelva a entregar el padrón. Hasta el
 * 21-sep-2026 ese endpoint devolvía nombre, correo, grupo, región y curso de
 * cada persona registrada a quien tuviera la URL del deployment — y esa URL
 * viaja en el HTML publicado de los 32 cursos. Desde el ADR-078:
 *   - el GET público trae SOLO agregados;
 *   - el detalle identificado va por POST con `adminKey`, que vive en las
 *     propiedades del script y no en ningún repositorio;
 *   - el correo no sale NUNCA, ni con clave.
 *
 * POR QUÉ ESTA PRUEBA Y NO SOLO `verificar-backend.js`. Aquel mide producción:
 * dice la verdad, pero solo después de desplegar, y no corre sin red. Esta
 * carga `google-apps-script.js` en un sandbox con hojas simuladas y responde
 * antes de tocar nada. Las dos hacen falta: una vigila el código, la otra lo
 * que Google sirve de verdad.
 *
 * LA COMPROBACIÓN MENOS OBVIA es la del estado «Completado»: el cruce entre un
 * registro y su certificado se hacía POR CORREO, así que al sacar el correo del
 * payload lo que podía romperse en silencio era la columna Estado del panel.
 *
 * Uso:   node probar-stats.js
 * Salida: exit 0 si todo pasa, exit 1 al primer fallo real.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

// Acepta una ruta como argumento para poder correrla contra una version ANTERIOR
// del backend y comprobar que la compuerta dispara (ver cabecera: "probada disparando").
const SCRIPT_PATH = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(__dirname, 'google-apps-script.js');

// --- Hojas simuladas -------------------------------------------------------
// Fila 0 = encabezados, como en el Sheet real. Los valores son inventados.
const SHEETS = {
  'Registros': [
    ['Timestamp', 'Nombre Completo', 'Edad', 'Grupo', 'Region', 'Email', 'Motivacion', 'Curso', 'UserAgent', 'URL'],
    ['2026-09-01', 'Ana Prueba', 34, 'Grupo 12 Cali', 'Valle', 'ana@example.com', 'me interesa', 'bienvenida-adultos', 'UA', 'u'],
    ['2026-09-02', 'Luis Prueba', 41, 'Grupo 3 Bogota', 'Bogota', 'luis@example.com', 'por el grupo', 'ciclo-adulto', 'UA', 'u'],
  ],
  'Certificados': [
    ['Timestamp', 'Email', 'Nombre', 'Curso', 'Grupo', 'Region', 'Codigo Certificado', 'Fecha Completacion', 'Puntuacion', 'Tiempo Estudio'],
    ['2026-09-03', 'ana@example.com', 'Ana Prueba', 'bienvenida-adultos', 'Grupo 12 Cali', 'Valle', 'ASC-CERT-0001', '2026-09-03', 100, '35'],
  ],
  'Progreso': [
    ['Timestamp', 'Email', 'Nombre', 'Curso', 'Modulo Completado', 'Nombre Modulo'],
    ['2026-09-01', 'ana@example.com', 'Ana Prueba', 'bienvenida-adultos', 0, 'Introduccion'],
    ['2026-09-02', 'ana@example.com', 'Ana Prueba', 'bienvenida-adultos', 1, 'Leccion 1'],
    ['2026-09-02', 'luis@example.com', 'Luis Prueba', 'ciclo-adulto', 0, 'Introduccion'],
  ],
  'Evaluaciones': [
    ['Timestamp', 'Email', 'Nombre', 'Curso', 'Modulo', 'Puntuacion'],
    ['2026-09-02', 'ana@example.com', 'Ana Prueba', 'bienvenida-adultos', 1, 100],
    ['2026-09-02', 'luis@example.com', 'Luis Prueba', 'ciclo-adulto', 0, 50],
  ],
};

// Las hojas que el código pida y no estén aquí nacen vacías, con encabezados.
function sheetRows(name, headers) {
  if (!SHEETS[name]) SHEETS[name] = [headers.slice()];
  return SHEETS[name];
}

// --- Sandbox: lo mínimo de Apps Script para que `stats` corra --------------
let scriptProperties = {};

function makeSandbox() {
  const noop = () => {};
  const chainable = new Proxy({}, { get: () => () => chainable });

  return {
    console,
    SpreadsheetApp: {
      getActiveSpreadsheet: () => ({
        getSheetByName: (name) => (SHEETS[name] ? makeSheet(name) : null),
        insertSheet: (name) => { SHEETS[name] = []; return makeSheet(name); },
      }),
    },
    PropertiesService: {
      getScriptProperties: () => ({
        getProperty: (k) => (k in scriptProperties ? scriptProperties[k] : null),
      }),
    },
    CacheService: { getScriptCache: () => ({ get: () => null, put: noop }) },
    ContentService: {
      MimeType: { JSON: 'application/json' },
      createTextOutput: (txt) => ({ _t: txt, setMimeType() { return this; }, getContent() { return this._t; } }),
    },
    Logger: { log: noop },
    Utilities: { formatDate: () => '2026-09-21', getUuid: () => 'uuid', sleep: noop },
    Session: { getActiveUser: () => ({ getEmail: () => '' }), getScriptTimeZone: () => 'America/Bogota' },
    ScriptApp: { getService: () => ({ getUrl: () => 'https://example.invalid/exec' }), newTrigger: () => chainable, getProjectTriggers: () => [] },
    GmailApp: { sendEmail: noop },
    MailApp: { sendEmail: noop },
    DriveApp: { getFileById: () => chainable, getRootFolder: () => chainable },
  };
}

function makeSheet(name) {
  const headers = (SHEETS[name] && SHEETS[name][0]) || [];
  return {
    getDataRange: () => ({ getValues: () => sheetRows(name, headers) }),
    appendRow: (row) => sheetRows(name, headers).push(row),
    getRange: () => ({
      setFontWeight() { return this; }, setBackground() { return this; },
      setFontColor() { return this; }, setValues() { return this; }, getValues: () => [],
    }),
    setFrozenRows: () => {},
    getLastRow: () => sheetRows(name, headers).length,
  };
}

function loadBackend() {
  const src = fs.readFileSync(SCRIPT_PATH, 'utf8');
  const ctx = vm.createContext(makeSandbox());
  vm.runInContext(src, ctx, { filename: SCRIPT_PATH });
  return ctx;
}

function unwrap(output) {
  return JSON.parse(output.getContent());
}

// --- Aserciones ------------------------------------------------------------
const results = [];
let failed = 0;

function check(label, condition, detail) {
  results.push({ label, ok: !!condition, detail });
  if (!condition) failed++;
}

// --- La prueba -------------------------------------------------------------
const ctx = loadBackend();

// 1. GET público: el que cualquiera puede hacer con solo la URL.
scriptProperties = { ADMIN_KEY: 'clave-de-prueba' };
const publico = unwrap(ctx.doGet({ parameter: { action: 'stats' } }));
const pub = publico.data || {};
const crudoPublico = JSON.stringify(pub);

check('El GET público responde con éxito', publico.success === true, publico.error);
check('...y trae los agregados que el panel necesita',
  pub.totalUsers === 2 && pub.totalCertificates === 1 && pub.resumen && Array.isArray(pub.modulos),
  `totalUsers=${pub.totalUsers} totalCertificates=${pub.totalCertificates}`);
check('...y `registros[]` viene VACÍO', Array.isArray(pub.registros) && pub.registros.length === 0,
  `length=${pub.registros && pub.registros.length}`);
check('...y `certificados[]` viene VACÍO', Array.isArray(pub.certificados) && pub.certificados.length === 0,
  `length=${pub.certificados && pub.certificados.length}`);
check('...y lo declara con `detalleIncluido: false`', pub.detalleIncluido === false, String(pub.detalleIncluido));
check('...y NO aparece ningún nombre en todo el payload', !/Ana Prueba|Luis Prueba/.test(crudoPublico));
check('...ni ningún correo', !/@example\.com/.test(crudoPublico));
check('...ni ningún grupo o región', !/Grupo 12 Cali|Grupo 3 Bogota/.test(crudoPublico));
check('...ni ningún código de certificado', !/ASC-CERT-0001/.test(crudoPublico));

// 2. POST sin la clave configurada en el script: falla CERRADA.
scriptProperties = {};
const sinConfigurar = unwrap(ctx.doPost({ postData: { contents: JSON.stringify({
  token: 'ADULTOS_ASC_2026', action: 'stats', adminKey: 'lo-que-sea' }) } }));
check('Sin ADMIN_KEY configurada, el detalle NO se sirve', sinConfigurar.success === false, sinConfigurar.error);
check('...y no se cuela nada en la respuesta de error', !/Ana Prueba|@example\.com/.test(JSON.stringify(sinConfigurar)));

// 3. POST con la clave equivocada.
scriptProperties = { ADMIN_KEY: 'clave-de-prueba' };
const claveMala = unwrap(ctx.doPost({ postData: { contents: JSON.stringify({
  token: 'ADULTOS_ASC_2026', action: 'stats', adminKey: 'clave-equivocada' }) } }));
check('Con la clave equivocada, el detalle NO se sirve', claveMala.success === false, claveMala.error);
check('...y tampoco se cuela nada', !/Ana Prueba|@example\.com/.test(JSON.stringify(claveMala)));

// 4. POST sin el token del backend: la puerta de siempre sigue cerrada.
const sinToken = unwrap(ctx.doPost({ postData: { contents: JSON.stringify({
  action: 'stats', adminKey: 'clave-de-prueba' }) } }));
check('Sin token de backend, el POST se rechaza antes de mirar la clave', sinToken.success === false, sinToken.error);

// 5. POST con la clave correcta: aquí SÍ hay detalle.
const conClave = unwrap(ctx.doPost({ postData: { contents: JSON.stringify({
  token: 'ADULTOS_ASC_2026', action: 'stats', adminKey: 'clave-de-prueba' }) } }));
const det = conClave.data || {};
const crudoDetalle = JSON.stringify(det);

check('Con la clave correcta, el detalle llega', conClave.success === true, conClave.error);
check('...con los 2 registros y el 1 certificado',
  det.registros && det.registros.length === 2 && det.certificados && det.certificados.length === 1,
  `registros=${det.registros && det.registros.length} certificados=${det.certificados && det.certificados.length}`);
check('...y lo declara con `detalleIncluido: true`', det.detalleIncluido === true, String(det.detalleIncluido));
check('...y trae lo que el panel pinta (nombre, grupo, región)',
  /Ana Prueba/.test(crudoDetalle) && /Grupo 12 Cali/.test(crudoDetalle));
check('...y NI ASÍ trae el correo', !/@example\.com/.test(crudoDetalle));
check('...ni el `_email` interno se escapa en la serialización', !/_email/.test(crudoDetalle));

// 6. La que podía romperse en silencio: el cruce registro↔certificado.
const ana = (det.registros || []).find((r) => r.nombre === 'Ana Prueba') || {};
const luis = (det.registros || []).find((r) => r.nombre === 'Luis Prueba') || {};
check('El estado «Completado» sigue calculándose sin el correo en el payload',
  ana.estado === 'Completado', `Ana: ${ana.estado}`);
check('...y quien no tiene certificado sigue «En progreso»',
  luis.estado === 'En progreso', `Luis: ${luis.estado}`);

// --- Informe ---------------------------------------------------------------
const c = { verde: '\x1b[32m', rojo: '\x1b[31m', gris: '\x1b[90m', fin: '\x1b[0m' };
console.log('\nADR-078 — el padrón no sale sin clave\n');
results.forEach((r) => {
  const marca = r.ok ? `${c.verde}OK  ${c.fin}` : `${c.rojo}FALLA${c.fin}`;
  const extra = !r.ok && r.detail ? ` ${c.gris}(${r.detail})${c.fin}` : '';
  console.log(`  ${marca} ${r.label}${extra}`);
});
console.log(`\n  ${results.length - failed} de ${results.length} comprobaciones en verde.\n`);
process.exit(failed > 0 ? 1 : 0);
