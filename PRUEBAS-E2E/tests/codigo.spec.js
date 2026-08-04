// Calidad de codigo — la parte MECANICA de AUDITORIA.md (checks A, B, C, E-bis).
//
// POR QUE EXISTE (ADR-033):
// AUDITORIA.md se dispara con una frase que tiene que decir el dueno del proyecto
// ("revisa completo el codigo"). Eso significa que la salud del codigo dependia de
// que alguien se acordara. El 03-ago-2026, tras una tanda de cambios en el motor y
// el backend, la auditoria NO se corrio: nadie dijo la frase. Al correrla despues
// aparecieron 4 escrituras a localStorage que se saltaban guardarLocal() —una de
// ellas la del certificado— y un color con contraste por debajo de AA.
//
// El propio ADR-025 ya lo habia diagnosticado: "lo automatizado se cumple, lo que
// depende de acordarse deriva". Esta spec mueve a la primera categoria todo lo que
// es comprobable sin juicio humano. Corre con el resto de la suite en cada push.
//
// LO QUE NO CUBRE, a proposito: si una funcion divergente entre lineas es legitima,
// si un comentario sigue siendo cierto, si la arquitectura es sensata. Eso sigue
// siendo AUDITORIA.md a mano. Esta spec cubre lo mecanico, no el criterio.

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const REPO = path.join(__dirname, '..', '..');
const GEN = path.join(REPO, '05-Generador-Cursos');
const TEMPLATES = path.join(GEN, 'templates');
const WEB = path.join(REPO, '02-Plataforma-Web');

const leer = (p) => (fs.existsSync(p) ? fs.readFileSync(p, 'utf-8') : null);

/** Ficheros de motor que existan en esta linea (engine.linea.js puede no estar). */
function fuentesMotor() {
  return ['engine.core.js', 'engine.linea.js']
    .map((f) => ({ nombre: f, ruta: path.join(TEMPLATES, f) }))
    .filter((x) => fs.existsSync(x.ruta))
    .map((x) => ({ ...x, texto: fs.readFileSync(x.ruta, 'utf-8') }));
}

/** Lineas que casan un patron, con su numero, para que el fallo diga DONDE. */
function coincidencias(texto, regex) {
  return texto
    .split('\n')
    .map((linea, i) => ({ n: i + 1, linea: linea.trim() }))
    .filter((x) => regex.test(x.linea));
}

test.describe('Calidad de codigo (AUDITORIA.md mecanico)', () => {
  // --- E-bis. Escritura de datos del estudiante -----------------------------
  // La regla: toda escritura a localStorage pasa por guardarLocal(), que avisa al
  // alumno si falla. Una escritura directa —o envuelta en un catch vacio— hace que
  // el estudiante pierda su trabajo en silencio cuando la cuota esta llena o el
  // navegador bloquea el almacenamiento. Fue el bug de saveProgress() (ADR-025) y
  // reaparecio en saveCommitment y en la escritura del certificado (ADR-033).
  test('toda escritura a localStorage pasa por guardarLocal()', () => {
    const infractores = [];
    for (const { nombre, texto } of fuentesMotor()) {
      coincidencias(texto, /localStorage\.setItem/).forEach(({ n, linea }) => {
        // La unica escritura directa legitima es la de dentro de guardarLocal().
        const dentroDelHelper = nombre === 'engine.core.js' && /^localStorage\.setItem\(clave, valor\);$/.test(linea);
        if (!dentroDelHelper) infractores.push(`${nombre}:${n}  ${linea}`);
      });
    }
    expect(infractores, `Usar guardarLocal(clave, valor) en vez de localStorage.setItem directo.\n${infractores.join('\n')}`).toEqual([]);
  });

  test('ninguna escritura de datos queda tragada por un catch vacio', () => {
    const infractores = [];
    for (const { nombre, texto } of fuentesMotor()) {
      // catch vacio (o solo con comentario) en la MISMA linea que un setItem
      coincidencias(texto, /localStorage\.setItem.*catch\s*\([^)]*\)\s*\{\s*(\/\*.*\*\/)?\s*\}/).forEach(({ n, linea }) => {
        infractores.push(`${nombre}:${n}  ${linea}`);
      });
    }
    expect(infractores, `Un catch vacio sobre una escritura pierde el dato del alumno sin avisar.\n${infractores.join('\n')}`).toEqual([]);
  });

  // --- A. Limpieza ----------------------------------------------------------
  test('el motor no lleva console.log ni debugger de depuracion', () => {
    const infractores = [];
    for (const { nombre, texto } of fuentesMotor()) {
      coincidencias(texto, /\bdebugger\b|console\.(log|debug)\s*\(/).forEach(({ n, linea }) => {
        infractores.push(`${nombre}:${n}  ${linea}`);
      });
    }
    // console.error y console.warn si valen: informan de fallos reales en produccion.
    expect(infractores, `Restos de depuracion en el motor.\n${infractores.join('\n')}`).toEqual([]);
  });

  // --- B. Seguridad y consistencia -----------------------------------------
  test('no queda rastro del token viejo de la plataforma Rover', () => {
    const sospechosos = [];
    for (const { nombre, texto } of fuentesMotor()) {
      if (texto.includes('ROVER_ASC_2025')) sospechosos.push(nombre);
    }
    const build = leer(path.join(GEN, 'build-course.js'));
    if (build && build.includes('ROVER_ASC_2025')) sospechosos.push('build-course.js');
    expect(sospechosos, 'El token viejo no debe sobrevivir en ningun archivo.').toEqual([]);
  });

  // --- C. Performance -------------------------------------------------------
  test('ningun curso compilado supera los 500 KB', () => {
    if (!fs.existsSync(WEB)) test.skip();
    const pesados = fs
      .readdirSync(WEB)
      .filter((f) => f.endsWith('.html'))
      .map((f) => ({ f, kb: Math.round(fs.statSync(path.join(WEB, f)).size / 1024) }))
      .filter((x) => x.kb > 500)
      .map((x) => `${x.f} — ${x.kb} KB`);
    expect(pesados, `HTML por encima del limite de 500 KB.\n${pesados.join('\n')}`).toEqual([]);
  });

  // --- F. Integridad del catalogo ------------------------------------------
  // Que cada curso publicado tenga su JSON fuente. Un HTML sin JSON es una entrada
  // huerfana: se compilo y despues se borro el origen, asi que nadie puede rehacerlo.
  test('cada curso activo del catalogo conserva su JSON fuente', () => {
    const catalogo = leer(path.join(WEB, 'cursos.json'));
    if (!catalogo) test.skip();
    const huerfanos = JSON.parse(catalogo)
      .filter((c) => ['active', 'new'].includes(c.status))
      .filter((c) => !fs.existsSync(path.join(GEN, 'borradores', `${c.courseId}.json`)))
      .map((c) => c.courseId);
    expect(huerfanos, `Cursos publicados sin JSON fuente en borradores/.\n${huerfanos.join('\n')}`).toEqual([]);
  });
});
