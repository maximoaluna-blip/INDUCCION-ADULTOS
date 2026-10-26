#!/usr/bin/env node
/**
 * probar-consentimiento.js — compuerta local del ADR-139 (puntos 1 y 2), sin red.
 *
 * QUÉ VIGILA.
 *  1. Que `register` guarde la autorización con hora del servidor y versión del
 *     texto, y que la RECHACE cuando falte si CONSENT_OBLIGATORIO está encendido.
 *  2. Que `recover` con v=2 no entregue NADA de la persona sin un código enviado a
 *     su correo, y que el código valga una vez, 10 minutos y 3 intentos.
 *  3. Que la respuesta del primer paso sea IGUAL exista o no el correo: si no lo
 *     fuera, el endpoint diría quién hace los cursos.
 *  4. Que el tope diario global y la reserva de cuota corten el código antes de
 *     enviarlo: la cuota de correo es compartida con Rover y con los certificados.
 *  5. Que durante la transición un curso viejo (sin v=2) siga recuperando, y que
 *     con RECOVER_SIN_CODIGO apagado se le pida recargar en vez de darle datos.
 *
 * Uso:   node probar-consentimiento.js [ruta/a/backend.js]
 * Salida: exit 0 si todo pasa, exit 1 si algo falla.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const SCRIPT_PATH = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(__dirname, 'google-apps-script.js');

const REG_HEAD = ['Timestamp', 'Nombre Completo', 'Edad', 'Grupo', 'Region', 'Email', 'Motivacion', 'Curso', 'UserAgent', 'URL'];

function mundo() {
  // La hoja Registros tiene la forma de ANTES del ADR-139 (10 columnas), como la real.
  const SHEETS = {
    Registros: [REG_HEAD.slice(),
      ['2026-09-01', 'Ana Real', 34, 'Grupo 12', 'Valle', 'ana@scouts.test', 'm', 'ciclo-adulto', 'UA', 'u'],
      ['2026-09-05', 'Ana Real', 34, 'Grupo 12', 'Valle', 'ana@scouts.test', 'm', 'plan-personal', 'UA', 'u', '2026-10-01', '2026-09-27'],
      ['2026-09-02', 'Eva Prueba', 30, 'Grupo 1', 'Valle', 'eva@example.com', 'm', 'ciclo-adulto', 'UA', 'u']],
    Progreso: [['Timestamp', 'Email', 'Nombre', 'Curso', 'Modulo Completado', 'Nombre Modulo'],
      ['2026-09-01', 'ana@scouts.test', 'Ana Real', 'ciclo-adulto', 1, 'L1']],
  };
  const rows = (n) => SHEETS[n];
  const sheet = (n) => ({
    getDataRange: () => ({ getValues: () => rows(n).map((r) => r.slice()) }),
    appendRow: (r) => rows(n).push(r),
    getRange: (r, c, nr, nc) => ({
      getValues: () => { const out = []; for (let i = 0; i < (nr || 1); i++) { const row = rows(n)[r - 1 + i] || []; out.push(Array.from({ length: nc || 1 }, (_, j) => row[c - 1 + j] === undefined ? '' : row[c - 1 + j])); } return out; },
      setValues: (v) => { v.forEach((vr, i) => { const row = rows(n)[r - 1 + i]; vr.forEach((x, j) => { row[c - 1 + j] = x; }); }); },
      setFontWeight() { return this; }, setBackground() { return this; }, setFontColor() { return this; },
    }),
    setFrozenRows() {}, getLastRow: () => rows(n).length,
  });
  const cache = {}; const props = {}; const enviados = []; let cuota = 100;
  const ctx = vm.createContext({
    console,
    SpreadsheetApp: { getActiveSpreadsheet: () => ({ getSheetByName: (n) => (SHEETS[n] ? sheet(n) : null), insertSheet: (n) => { SHEETS[n] = []; return sheet(n); } }) },
    PropertiesService: { getScriptProperties: () => ({ getProperty: (k) => (k in props ? props[k] : null), setProperty: (k, v) => { props[k] = v; }, deleteProperty: (k) => { delete props[k]; }, getKeys: () => Object.keys(props) }) },
    CacheService: { getScriptCache: () => ({ get: (k) => (k in cache ? cache[k] : null), put: (k, v) => { cache[k] = v; }, remove: (k) => { delete cache[k]; } }) },
    LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock() {} }) },
    ContentService: { MimeType: { JSON: 'json' }, createTextOutput: (t) => ({ _t: t, setMimeType() { return this; }, getContent() { return this._t; } }) },
    Logger: { log() {} },
    Utilities: { formatDate: () => '2026-10-25' },
    Session: { getScriptTimeZone: () => 'America/Bogota' },
    GmailApp: { sendEmail: (to, subj, txt, o) => { enviados.push({ to, html: o.htmlBody }); cuota--; } },
    MailApp: { getRemainingDailyQuota: () => cuota, sendEmail() {} },
    ScriptApp: { getProjectTriggers: () => [] },
  });
  vm.runInContext(fs.readFileSync(SCRIPT_PATH, 'utf8'), ctx, { filename: SCRIPT_PATH });
  const get = (p) => JSON.parse(ctx.doGet({ parameter: Object.assign({ action: 'recover' }, p) }).getContent());
  const post = (b) => JSON.parse(ctx.doPost({ postData: { contents: JSON.stringify(Object.assign({ token: ctx.AUTH_TOKEN }, b)) } }).getContent());
  const codigoDe = (email) => JSON.parse(cache['recover_code_' + email]).c;
  return { SHEETS, cache, props, enviados, ctx, get, post, codigoDe, setCuota: (n) => { cuota = n; } };
}

// Las fechas nacen dentro del vm: `instanceof Date` de aqui afuera no las reconoce.
const esFecha = (x) => Object.prototype.toString.call(x) === '[object Date]';
const results = []; let failed = 0;
const check = (label, cond, detail) => { results.push({ label, ok: !!cond, detail }); if (!cond) failed++; };
const nuevo = { action: 'register', fullName: 'Leo Nuevo', age: 20, email: 'leo@scouts.test', course: 'ciclo-adulto' };

// --- 1. register --------------------------------------------------------------
let w = mundo();
let r = w.post(Object.assign({}, nuevo, { consent: { version: '2026-10-25' } }));
let fila = w.SHEETS.Registros[w.SHEETS.Registros.length - 1];
check('register con consent guarda la hora del servidor y la versión del texto',
  r.success && esFecha(fila[10]) && fila[11] === '2026-10-25', JSON.stringify(fila.slice(10)));
check('...y pone los encabezados nuevos en la hoja que ya existía',
  w.SHEETS.Registros[0][10] === 'Autorizacion' && w.SHEETS.Registros[0][11] === 'VersionTexto', JSON.stringify(w.SHEETS.Registros[0]));

w = mundo();
r = w.post(nuevo);
fila = w.SHEETS.Registros[w.SHEETS.Registros.length - 1];
check('En transición, register sin consent entra con la autorización VACÍA (no inventada)',
  r.success && fila[10] === '' && fila[11] === '', JSON.stringify(fila.slice(10)));

w = mundo(); w.ctx.CONSENT_OBLIGATORIO = true;
const antes = w.SHEETS.Registros.length;
r = w.post(nuevo);
check('Con CONSENT_OBLIGATORIO, register sin consent se rechaza y no escribe',
  r.success === false && w.SHEETS.Registros.length === antes, r.error);
r = w.post(Object.assign({}, nuevo, { consent: 'si' }));
check('...y un consent que no trae versión tampoco cuenta', r.success === false, r.error);

// --- 2. recover en dos pasos -----------------------------------------------------
w = mundo();
const conocido = w.get({ v: '2', email: 'ana@scouts.test', course: 'ciclo-adulto' });
const desconocido = w.get({ v: '2', email: 'nadie@scouts.test', course: 'ciclo-adulto' });
check('Paso 1: manda UN correo al conocido y ninguno al desconocido',
  w.enviados.length === 1 && w.enviados[0].to === 'ana@scouts.test', JSON.stringify(w.enviados.map((e) => e.to)));
check('Paso 1: la respuesta es idéntica exista o no el correo (no enumera)',
  JSON.stringify(conocido) === JSON.stringify(desconocido), JSON.stringify([conocido, desconocido]));
check('Paso 1: no entrega nada de la persona', JSON.stringify(conocido).indexOf('Ana') === -1, JSON.stringify(conocido));
const cod = w.codigoDe('ana@scouts.test');
check('El código va en el correo y tiene 6 dígitos', /^\d{6}$/.test(cod) && w.enviados[0].html.indexOf(cod) !== -1);

r = w.get({ v: '2', email: 'ana@scouts.test', course: 'ciclo-adulto', code: cod === '111111' ? '222222' : '111111' });
check('Código incorrecto: no entrega datos y dice cuántos intentos quedan',
  r.success === false && r.data && r.data.codeError === 'incorrecto' && /2 intento/.test(r.error), JSON.stringify(r));
r = w.get({ v: '2', email: 'ana@scouts.test', course: 'ciclo-adulto', code: cod, consentVersion: '2026-10-25' });
const reg = w.SHEETS.Registros;
check('Código correcto: devuelve el avance', r.success && r.data.registration && r.data.registration.fullName === 'Ana Real', JSON.stringify(r).slice(0, 200));
check('...escribe la autorización en la fila de Ana que no la tenía',
  esFecha(reg[1][10]) && reg[1][11] === '2026-10-25', JSON.stringify(reg[1].slice(10)));
check('...y NO pisa la que ya tenía, ni toca filas de otra persona',
  reg[2][10] === '2026-10-01' && reg[2][11] === '2026-09-27' && reg[3][10] === undefined, JSON.stringify([reg[2].slice(10), reg[3].slice(10)]));
r = w.get({ v: '2', email: 'ana@scouts.test', course: 'ciclo-adulto', code: cod });
check('El código sirve UNA vez', r.success === false && r.data.codeError === 'vencido', JSON.stringify(r));

w = mundo();
w.get({ v: '2', email: 'ana@scouts.test' });
const c2 = w.codigoDe('ana@scouts.test'); const malo = c2 === '000001' ? '000002' : '000001';
w.get({ v: '2', email: 'ana@scouts.test', code: malo }); w.get({ v: '2', email: 'ana@scouts.test', code: malo });
r = w.get({ v: '2', email: 'ana@scouts.test', code: malo });
check('Al tercer fallo el código se invalida', r.data && r.data.codeError === 'agotado', JSON.stringify(r));
r = w.get({ v: '2', email: 'ana@scouts.test', code: c2 });
check('...y ya ni el correcto entra', r.success === false, JSON.stringify(r));

// --- 3. topes ------------------------------------------------------------------
w = mundo(); w.props['recover_codigos_2026-10-25'] = String(w.ctx.RECOVER_CODIGOS_DIA);
r = w.get({ v: '2', email: 'ana@scouts.test' });
check('Con el tope diario gastado no se envía el código', r.success === false && r.data.codeError === 'limite' && w.enviados.length === 0, JSON.stringify(r));
w = mundo(); w.setCuota(w.ctx.RECOVER_RESERVA_CUOTA - 1);
r = w.get({ v: '2', email: 'ana@scouts.test' });
check('Con poca cuota de correo el código es lo primero que deja de salir', r.success === false && w.enviados.length === 0, JSON.stringify(r));
w = mundo(); w.props['recover_codigos_2026-10-24'] = '7';
w.get({ v: '2', email: 'ana@scouts.test' });
check('Cuenta el envío y borra el contador de días anteriores',
  w.props['recover_codigos_2026-10-25'] === '1' && !('recover_codigos_2026-10-24' in w.props), JSON.stringify(w.props));

// --- 4. correos de prueba --------------------------------------------------------
w = mundo();
w.get({ v: '2', email: 'eva@example.com' });
r = w.get({ v: '2', email: 'eva@example.com', code: '000000' });
check('@example.com: código fijo 000000, sin enviar correo ni gastar el tope',
  r.success && w.enviados.length === 0 && !('recover_codigos_2026-10-25' in w.props), JSON.stringify(r).slice(0, 160));
w.get({ v: '2', email: 'ana@scouts.test' });
r = w.get({ v: '2', email: 'ana@scouts.test', code: '000000' });
check('...y ese código fijo NO sirve para un correo real', !(r.success && r.data && r.data.registration), JSON.stringify(r).slice(0, 160));

// --- 5. transición ---------------------------------------------------------------
w = mundo();
r = w.get({ email: 'ana@scouts.test', course: 'ciclo-adulto' });
check('En transición, un curso viejo (sin v=2) recupera como antes', r.success && r.data.registration.fullName === 'Ana Real');
w.ctx.RECOVER_SIN_CODIGO = false;
r = w.get({ email: 'ana@scouts.test', course: 'ciclo-adulto' });
check('Con RECOVER_SIN_CODIGO apagado, sin v=2 no hay datos: se pide recargar',
  r.success === false && r.data && r.data.needsReload === true && JSON.stringify(r).indexOf('Ana') === -1, JSON.stringify(r));

// --- Informe -------------------------------------------------------------------
const c = { v: '\x1b[32m', r: '\x1b[31m', g: '\x1b[90m', f: '\x1b[0m' };
console.log('\nADR-139 — autorización con prueba y recuperar con código\n');
results.forEach((x) => console.log(`  ${x.ok ? c.v + 'OK  ' : c.r + 'FALLA'}${c.f} ${x.label}${!x.ok && x.detail ? ` ${c.g}(${x.detail})${c.f}` : ''}`));
console.log(`\n  ${results.length - failed} de ${results.length} comprobaciones en verde.\n`);
process.exit(failed ? 1 : 0);
