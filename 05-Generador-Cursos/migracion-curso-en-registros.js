/**
 * migracion-curso-en-registros.js — reparación puntual, se ejecuta a mano UNA vez.
 *
 * Contexto (DECISIONES.md ADR-026): hasta el 03-ago-2026 el motor no enviaba el
 * `course` al registrar — era la única acción que no lo hacía. La columna "Curso" de
 * la hoja Registros quedó vacía en 18 de 20 filas, y como el panel administrativo
 * filtra los registros por `courseId`, la línea Programa de Jóvenes mostraba
 * 0 adultos registrados pese a tener alumnos con cursos completos.
 *
 * Qué hace: para cada fila de Registros con la columna Curso vacía, busca la PRIMERA
 * actividad posterior de ese mismo correo (quiz, módulo completado o certificado) y
 * toma su curso. Un registro es el inicio de un curso, así que la primera actividad
 * que le sigue pertenece a ese curso.
 *
 * Qué NO hace: si un correo no tiene ninguna actividad posterior al registro, la fila
 * se deja como está. No se inventa un curso.
 *
 * Cómo ejecutarla: desde el editor de Apps Script, seleccionar `migrarCursoEnRegistros`
 * y pulsar Ejecutar. Primero con SIMULAR = true (no escribe, solo informa en el log);
 * después con SIMULAR = false.
 *
 * EJECUTADA el 03-ago-2026 sobre el Sheet de producción: 15 filas recuperadas, 2 que ya
 * tenían curso, 3 sin evidencia (personas que se inscribieron y no empezaron; se dejaron
 * como estaban). Las 15 asignaciones se verificaron una por una contra la actividad real
 * de cada correo. Se conserva el archivo por si hiciera falta repetirla.
 *
 * ⚠️ AL INVOCARLA DESDE UN ROUTER, cuidado con la semántica del parámetro: la función
 *    recibe SIMULAR, no "aplicar". Pasarle `aplicar === 'si'` la ejecuta de verdad cuando
 *    se pretendía simular. Es exactamente el error que se cometió el 03-ago: la primera
 *    llamada, que debía ser una simulación, escribió en el Sheet. El resultado fue
 *    correcto, pero por suerte, no por diseño.
 */

var MIGRACION_SIMULAR = true; // ← poner en false para que escriba de verdad

function migrarCursoEnRegistros() {
  // El backend usa siempre getActiveSpreadsheet() (el script está vinculado al Sheet),
  // no openById: se hace igual aquí para no depender de un id suelto.
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  var hojaReg = ss.getSheetByName(SHEET_CONFIG.registros.name);
  if (!hojaReg) { Logger.log('No existe la hoja de Registros.'); return; }

  var COL_TIMESTAMP = 0, COL_EMAIL = 5, COL_CURSO = 7;

  // --- Reunir toda la actividad por correo: [timestamp, curso] ---
  var actividad = {};
  function recolectar(nombreHoja, colTs, colEmail, colCurso) {
    var h = ss.getSheetByName(nombreHoja);
    if (!h) return;
    var datos = h.getDataRange().getValues();
    for (var i = 1; i < datos.length; i++) {
      var email = String(datos[i][colEmail] || '').toLowerCase().trim();
      var curso = String(datos[i][colCurso] || '').trim();
      var ts = datos[i][colTs];
      if (!email || !curso || !ts) continue;
      if (!actividad[email]) actividad[email] = [];
      actividad[email].push({ ts: new Date(ts).getTime(), curso: curso });
    }
  }
  // Evaluaciones y Progreso: Timestamp, Email, Nombre, Curso → curso en la col 3
  recolectar(SHEET_CONFIG.evaluaciones.name, 0, 1, 3);
  recolectar(SHEET_CONFIG.progreso.name, 0, 1, 3);
  // Certificados: Timestamp, Email, Nombre, Curso → curso en la col 3
  recolectar(SHEET_CONFIG.certificados.name, 0, 1, 3);

  for (var e in actividad) {
    actividad[e].sort(function (a, b) { return a.ts - b.ts; });
  }

  // --- Recorrer los registros sin curso ---
  var datosReg = hojaReg.getDataRange().getValues();
  var arreglados = 0, sinEvidencia = 0, yaTenian = 0;
  var usados = {}; // email -> índices de actividad ya asignados

  for (var f = 1; f < datosReg.length; f++) {
    var curso = String(datosReg[f][COL_CURSO] || '').trim();
    if (curso) { yaTenian++; continue; }

    var email = String(datosReg[f][COL_EMAIL] || '').toLowerCase().trim();
    var tsReg = datosReg[f][COL_TIMESTAMP] ? new Date(datosReg[f][COL_TIMESTAMP]).getTime() : null;
    var evs = actividad[email];
    if (!email || !tsReg || !evs) { sinEvidencia++; continue; }

    if (!usados[email]) usados[email] = {};
    var elegido = null;
    for (var k = 0; k < evs.length; k++) {
      if (usados[email][k]) continue;
      if (evs[k].ts < tsReg) continue;
      elegido = evs[k].curso;
      // marcar como usadas todas las actividades de ese curso posteriores al registro,
      // para que el siguiente registro no vuelva a emparejar con el mismo curso
      for (var z = 0; z < evs.length; z++) {
        if (evs[z].curso === elegido && evs[z].ts >= tsReg) usados[email][z] = true;
      }
      break;
    }

    if (!elegido) { sinEvidencia++; continue; }

    Logger.log('Fila %s · %s · %s → %s', f + 1, email, '(vacío)', elegido);
    if (!MIGRACION_SIMULAR) {
      hojaReg.getRange(f + 1, COL_CURSO + 1).setValue(elegido);
    }
    arreglados++;
  }

  Logger.log('----------------------------------------');
  Logger.log(MIGRACION_SIMULAR ? 'SIMULACIÓN (no se escribió nada)' : 'APLICADO');
  Logger.log('Filas con curso asignado : %s', arreglados);
  Logger.log('Ya tenían curso          : %s', yaTenian);
  Logger.log('Sin evidencia (se dejan) : %s', sinEvidencia);
}
