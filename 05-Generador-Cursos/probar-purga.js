#!/usr/bin/env node
// Compuerta de purgarPersona (ADR-139): hojas simuladas, sin red. Uso: node probar-purga.js [backend.js]
const fs = require('fs'), vm = require('vm'), crypto = require('crypto');
const src = fs.readFileSync(process.argv[2] || require('path').join(__dirname, 'google-apps-script.js'), 'utf8');
let fallas = 0;
const ok = (c, m) => { console.log((c ? '  OK  ' : '  FALLA ') + m); if (!c) fallas++; };

function crearMundo(hojas, correo) {
  const logs = [];
  const sheets = Object.entries(hojas).map(([name, rows]) => ({
    rows, getName: () => name,
    getLastRow() { return this.rows.length; },
    getLastColumn() { return this.rows[0] ? this.rows[0].length : 0; },
    getRange(r, c, nr, nc) { const s = this; return { getValues: () => s.rows.slice(r - 1, r - 1 + nr).map(x => x.slice(c - 1, c - 1 + nc)),
      setFontWeight() {}, setBackground() {}, setFontColor() {} }; },
    deleteRows(i, n) { this.rows.splice(i - 1, n); },
    appendRow(a) { this.rows.push(a); }, setFrozenRows() {}
  }));
  const props = { PURGA_CORREO: correo };
  const ss = { getSheets: () => sheets, getSheetByName: n => sheets.find(s => s.getName() === n) || null,
    insertSheet(n) { const s = Object.assign(Object.create(Object.getPrototypeOf(sheets[0])), sheets[0], { rows: [] }); s.getName = () => n; sheets.push(s); return s; } };
  const ctx = {
    Logger: { log: m => logs.push(String(m)) },
    SpreadsheetApp: { getActiveSpreadsheet: () => ss },
    PropertiesService: { getScriptProperties: () => ({ getProperty: k => props[k] || null, deleteProperty: k => { delete props[k]; } }) },
    LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock() {} }) },
    Utilities: { DigestAlgorithm: { SHA_256: 1 }, Charset: { UTF_8: 1 },
      computeDigest: (_, s) => Array.from(crypto.createHash('sha256').update(s, 'utf8').digest()).map(b => b > 127 ? b - 256 : b) },
    ScriptApp: { getProjectTriggers: () => [] }, CacheService: {}, GmailApp: {}, MailApp: {}, ContentService: {}, Session: {}, DriveApp: {}, MimeType: {}
  };
  vm.createContext(ctx); vm.runInContext(src, ctx);
  return { ctx, sheets, props, logs, ss };
}

const X = 'Ana@Example.org', x = 'ana@example.org';
const base = () => ({
  Registros: [['Timestamp','Nombre Completo','Edad','Grupo','Region','Email'], [1,'A',30,'g','r',x], [2,'B',30,'g','r','otro@e.org'], [3,'A2',30,'g','r',' ANA@example.org ']],
  Progreso: [['Timestamp','Email','Nombre'], [1,x,'A'], [2,x,'A'], [3,'otro@e.org','B'], [4,x,'A'], [5,x,'A']],
  Items: [['Timestamp','Curso','Modulo','Pregunta'], [1,'c','m','ana@example.org']],
  Vacia: [['Timestamp','Email']]
});

console.log('Simulacro');
let w = crearMundo(base(), X);
let r = w.ctx.purgarPersonaSimulacro();
ok(r.total === 6 && r.porHoja.Registros === 2 && r.porHoja.Progreso === 4, 'cuenta 2 en Registros y 4 en Progreso');
ok(w.sheets.find(s => s.getName()==='Registros').rows.length === 4, 'no borra nada');
ok(w.props.PURGA_CORREO === X, 'no quita la propiedad');
ok(!w.ss.getSheetByName('Supresiones'), 'no crea Supresiones');

console.log('Ejecutar');
w = crearMundo(base(), X);
r = w.ctx.purgarPersonaEjecutar();
const g = n => w.ss.getSheetByName(n).rows;
ok(g('Registros').length === 2 && g('Registros')[1][5] === 'otro@e.org', 'Registros: queda solo la otra persona');
ok(g('Progreso').length === 2 && g('Progreso')[1][1] === 'otro@e.org', 'Progreso: borra filas contiguas y sueltas sin correr indices');
ok(g('Items').length === 2, 'Items (sin Email) intacta aunque el texto contenga el correo');
const sup = g('Supresiones');
ok(sup.length === 2 && sup[1][1] === crypto.createHash('sha256').update(x).digest('hex') && sup[1][2] === 6, 'Supresiones: hash del correo normalizado y total');
ok(!JSON.stringify(sup).includes('ana@'), 'Supresiones no guarda el correo en claro');
ok(!('PURGA_CORREO' in w.props), 'elimina PURGA_CORREO');
ok(!w.logs.join('\n').toLowerCase().includes('ana@'), 'el registro de ejecucion no muestra el correo');

console.log('Sin propiedad');
w = crearMundo(base(), '');
ok(w.ctx.purgarPersonaEjecutar() === null, 'sin PURGA_CORREO no hace nada');
ok(w.ss.getSheetByName('Registros').rows.length === 4, 'y no borra');

console.log(fallas ? `\n${fallas} FALLAS` : '\nTodo en verde.');
process.exit(fallas ? 1 : 0);
