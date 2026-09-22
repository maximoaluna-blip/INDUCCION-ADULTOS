#!/usr/bin/env node
/**
 * probar-recover.js — compuerta local del ADR-080, sin red y sin producción.
 *
 * QUÉ VIGILA. Que `?action=recover` diga si la persona está inscrita **en el curso
 * que se le pregunta**, y que ese GET público **no escriba nada**.
 *
 * DE DÓNDE SALE. El 21-sep-2026, al investigar los 7 `certificadosSinInscripcion`
 * que publicó el ADR-079, se midió esto: `handleRecover()` recibía `params.course`
 * y **lo tiraba**. Buscaba por correo, devolvía la **primera** fila que encontrara
 * —del curso que fuera— y el motor entraba con ese registro ajeno. La persona hacía
 * el curso, y al terminar se escribía su certificado pero **nunca su inscripción**.
 * No era un caso raro: **6 de los 7 eran la línea Desarrollo Institucional entera**,
 * seis cursos con certificado, cero inscripciones y 5-6 módulos completados cada uno.
 * El panel llevaba meses diciendo que esa línea no la estaba haciendo nadie.
 *
 * LA COMPROBACIÓN MENOS OBVIA es la de que **no escribe**. La forma barata de
 * arreglar el defecto era que `handleRecover()` creara la fila él mismo: una línea y
 * un solo despliegue. Se descartó porque convierte un **GET público y sin autenticar
 * en uno que escribe** —cualquiera que sepa un correo crearía inscripciones—, que es
 * la dirección contraria al ADR-074 y al ADR-078. Esa decisión no se sostiene sola:
 * hay que vigilarla, y por eso la prueba cuenta las filas antes y después.
 *
 * LA OTRA: `registeredInCourse` vale **null** cuando no se preguntó por ningún curso.
 * No es `false`. «No se preguntó» y «no está inscrita» son cosas distintas, y el motor
 * solo inscribe ante un `false` explícito — si un despliegue viejo no manda el campo,
 * no puede leerse como «vuelve a inscribirla».
 *
 * Uso:   node probar-recover.js [ruta/a/google-apps-script.js]
 * Salida: exit 0 si todo pasa, exit 1 al primer fallo real.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const SCRIPT_PATH = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(__dirname, 'google-apps-script.js');

// --- Hojas simuladas -------------------------------------------------------
// Ana está inscrita en DOS cursos; Luis en uno. Los valores son inventados.
const SHEETS = {
  'Registros': [
    ['Timestamp', 'Nombre Completo', 'Edad', 'Grupo', 'Region', 'Email', 'Motivacion', 'Curso', 'UserAgent', 'URL'],
    ['2026-09-01', 'Ana Prueba', 34, 'Grupo 12 Cali', 'Valle', 'ana@example.com', 'me interesa', 'bienvenida-adultos', 'UA', 'u'],
    ['2026-09-05', 'Ana Prueba', 34, 'Grupo 12 Cali', 'Valle', 'ana@example.com', 'sigo', 'ciclo-adulto', 'UA', 'u'],
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
  ],
  'Evaluaciones': [
    ['Timestamp', 'Email', 'Nombre', 'Curso', 'Modulo', 'Puntuacion'],
    ['2026-09-02', 'ana@example.com', 'Ana Prueba', 'bienvenida-adultos', 1, 100],
  ],
};

function sheetRows(name, headers) {
  if (!SHEETS[name]) SHEETS[name] = [headers.slice()];
  return SHEETS[name];
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
    PropertiesService: { getScriptProperties: () => ({ getProperty: () => null }) },
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

const ctx = vm.createContext(makeSandbox());
vm.runInContext(fs.readFileSync(SCRIPT_PATH, 'utf8'), ctx, { filename: SCRIPT_PATH });

function recover(params) {
  return JSON.parse(ctx.doGet({ parameter: Object.assign({ action: 'recover' }, params) }).getContent());
}
function filasRegistros() {
  return SHEETS['Registros'].length - 1;
}

// --- Aserciones ------------------------------------------------------------
const results = [];
let failed = 0;
function check(label, condition, detail) {
  results.push({ label, ok: !!condition, detail });
  if (!condition) failed++;
}

const filasAntes = filasRegistros();

// 1. Curso AJENO: Ana no tiene fila en `pndi-marco-y-principios`.
const ajeno = recover({ email: 'ana@example.com', course: 'pndi-marco-y-principios' });
const dAjeno = ajeno.data || {};
check('En un curso donde NO está inscrita, lo dice: `registeredInCourse: false`',
  dAjeno.registeredInCourse === false, String(dAjeno.registeredInCourse));
check('...y aun así devuelve el registro, que es lo que le deja continuar',
  !!(dAjeno.registration && dAjeno.registration.fullName),
  JSON.stringify(dAjeno.registration));

// 2. Curso PROPIO: Ana sí tiene fila en `ciclo-adulto`.
const propio = recover({ email: 'ana@example.com', course: 'ciclo-adulto' });
const dPropio = propio.data || {};
check('En un curso donde SÍ está inscrita, también lo dice: `registeredInCourse: true`',
  dPropio.registeredInCourse === true, String(dPropio.registeredInCourse));
check('...y devuelve la inscripción DE ESE curso, no la primera que encuentre',
  dPropio.registration && dPropio.registration.course === 'ciclo-adulto',
  dPropio.registration && dPropio.registration.course);

// 3. Sin curso: no se preguntó, así que no se responde.
const sinCurso = recover({ email: 'ana@example.com' });
const dSin = sinCurso.data || {};
check('Sin preguntar por un curso, `registeredInCourse` es null y no false',
  dSin.registeredInCourse === null, String(dSin.registeredInCourse));

// 4. La que sostiene la decisión: este GET no escribe.
check('Recuperar NO escribe: las filas de Registros no cambian',
  filasRegistros() === filasAntes,
  `antes=${filasAntes} despues=${filasRegistros()}`);

// 5. Un correo desconocido no hidrata a nadie.
const nadie = recover({ email: 'nadie@example.com', course: 'ciclo-adulto' });
check('Un correo desconocido no devuelve datos', nadie.success === false, nadie.error);

// 6. Sigue vigente el ADR-074: nada de lo que la persona escribió.
const crudo = JSON.stringify(dPropio);
check('Y sigue sin devolver nada de lo escrito (ADR-074): ni la motivación',
  crudo.indexOf('me interesa') === -1 && crudo.indexOf('sigo') === -1);

// --- Informe ---------------------------------------------------------------
const c = { verde: '\x1b[32m', rojo: '\x1b[31m', gris: '\x1b[90m', fin: '\x1b[0m' };
console.log('\nADR-080 — recuperar dice si hay inscripción, y no escribe\n');
results.forEach((r) => {
  const marca = r.ok ? `${c.verde}OK  ${c.fin}` : `${c.rojo}FALLA${c.fin}`;
  const extra = !r.ok && r.detail ? ` ${c.gris}(${r.detail})${c.fin}` : '';
  console.log(`  ${marca} ${r.label}${extra}`);
});
console.log(`\n  ${results.length - failed} de ${results.length} comprobaciones en verde.\n`);
process.exit(failed > 0 ? 1 : 0);
