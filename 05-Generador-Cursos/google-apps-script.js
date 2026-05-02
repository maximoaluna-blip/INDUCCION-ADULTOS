// ============================================================================
// BACKEND - PLATAFORMA EDUCATIVA ROVER ASC
// Google Apps Script (se ejecuta en los servidores de Google, NO en Node.js)
//
// Este archivo sirve como backend para los cursos HTML estaticos alojados
// en GitHub Pages. Usa Google Sheets como base de datos y GmailApp para
// notificaciones por correo.
//
// Desplegado como Web App en: https://script.google.com
// Autor: Plataforma Educativa Rover ASC - Asociacion Scouts de Colombia
// ============================================================================

// --- Configuracion global ---
var AUTH_TOKEN = 'ROVER_ASC_2025';
var RATE_LIMIT_MAX = 30;         // maximo de solicitudes por email por minuto
var RATE_LIMIT_WINDOW = 60;      // ventana en segundos
var BRAND_COLOR = '#622599';     // morado institucional scout
var PLATFORM_NAME = 'Plataforma Educativa Rover ASC';

// ============================================================================
// FUNCIONES AUXILIARES (HELPERS)
// ============================================================================

/**
 * Obtiene una hoja por nombre o la crea con los encabezados indicados.
 * @param {string} name - Nombre de la hoja
 * @param {string[]} headers - Encabezados de columna
 * @return {GoogleAppsScript.Spreadsheet.Sheet}
 */
function getOrCreateSheet(name, headers) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    // Aplicar formato a los encabezados
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight('bold');
    headerRange.setBackground(BRAND_COLOR);
    headerRange.setFontColor('#FFFFFF');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/**
 * Valida formato de correo electronico.
 * @param {string} email
 * @return {boolean}
 */
function validateEmail(email) {
  if (!email || typeof email !== 'string') return false;
  var regex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
  return regex.test(email.trim());
}

/**
 * Genera un codigo de certificado unico.
 * Formato: ASC-YYYY-XXXXX (5 caracteres alfanumericos aleatorios)
 * @return {string}
 */
function generateCertificateCode() {
  var year = new Date().getFullYear();
  var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  var random = '';
  for (var i = 0; i < 5; i++) {
    random += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return 'ASC-' + year + '-' + random;
}

/**
 * Verifica el limite de tasa de solicitudes por correo electronico.
 * Usa CacheService para rastrear solicitudes por minuto.
 * @param {string} email - Correo del usuario
 * @return {boolean} true si esta limitado (demasiadas solicitudes)
 */
function rateLimitCheck(email) {
  if (!email) return false;
  var cache = CacheService.getScriptCache();
  var key = 'ratelimit_' + email.toLowerCase().trim();
  var current = cache.get(key);
  if (current === null) {
    // Primera solicitud en esta ventana
    cache.put(key, '1', RATE_LIMIT_WINDOW);
    return false;
  }
  var count = parseInt(current, 10);
  if (count >= RATE_LIMIT_MAX) {
    return true; // Limitado
  }
  // Incrementar contador (mantener la expiracion original es imposible con
  // CacheService, asi que re-ponemos la ventana; acepta un margen minimo)
  cache.put(key, String(count + 1), RATE_LIMIT_WINDOW);
  return false;
}

/**
 * Sanitiza un string: recorta espacios y limita longitud.
 * @param {*} str - Valor a sanitizar
 * @param {number} maxLen - Longitud maxima permitida
 * @return {string}
 */
function sanitize(str, maxLen) {
  if (str === null || str === undefined) return '';
  var s = String(str).trim();
  if (maxLen && s.length > maxLen) {
    s = s.substring(0, maxLen);
  }
  return s;
}

/**
 * Construye una respuesta JSON estandarizada.
 * @param {boolean} success
 * @param {object} data
 * @param {string} [error]
 * @return {GoogleAppsScript.Content.TextOutput}
 */
function jsonResponse(success, data, error) {
  var body = { success: success };
  if (data !== undefined && data !== null) body.data = data;
  if (error) body.error = error;
  return ContentService
    .createTextOutput(JSON.stringify(body))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================================
// PLANTILLAS DE CORREO HTML
// ============================================================================

/**
 * Genera el HTML del correo de bienvenida al registrarse.
 * @param {string} name - Nombre del estudiante
 * @param {string} course - Nombre del curso
 * @return {string}
 */
function getWelcomeEmailHtml(name, course) {
  return '<!DOCTYPE html>' +
    '<html><head><meta charset="utf-8"></head>' +
    '<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">' +
    '<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:20px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.1);">' +
    '  <tr><td style="background:' + BRAND_COLOR + ';padding:30px 40px;text-align:center;">' +
    '    <h1 style="color:#ffffff;margin:0;font-size:24px;">&#9884;&#65039; ' + PLATFORM_NAME + '</h1>' +
    '    <p style="color:#e0c8f0;margin:8px 0 0;font-size:14px;">Asociacion Scouts de Colombia</p>' +
    '  </td></tr>' +
    '  <tr><td style="padding:30px 40px;">' +
    '    <h2 style="color:' + BRAND_COLOR + ';margin-top:0;">!Bienvenido/a, ' + sanitize(name, 100) + '!</h2>' +
    '    <p style="color:#333;line-height:1.6;">Te has registrado exitosamente en el curso:</p>' +
    '    <div style="background:#f8f0ff;border-left:4px solid ' + BRAND_COLOR + ';padding:15px 20px;margin:15px 0;border-radius:0 8px 8px 0;">' +
    '      <strong style="color:' + BRAND_COLOR + ';font-size:18px;">' + sanitize(course, 200) + '</strong>' +
    '    </div>' +
    '    <h3 style="color:' + BRAND_COLOR + ';">Instrucciones para comenzar:</h3>' +
    '    <ol style="color:#333;line-height:1.8;">' +
    '      <li>Avanza por los modulos en orden secuencial.</li>' +
    '      <li>Cada modulo tiene una evaluacion: necesitas <strong>70%</strong> para continuar.</li>' +
    '      <li>Completa las reflexiones personales; son parte importante del aprendizaje.</li>' +
    '      <li>Al finalizar todos los modulos, recibiras tu <strong>certificado digital</strong>.</li>' +
    '      <li>Tu progreso se guarda automaticamente. Puedes cerrar y volver cuando quieras.</li>' +
    '    </ol>' +
    '    <p style="color:#333;line-height:1.6;">Recuerda el lema: <strong>"Servir"</strong>. Este curso fortalecera tu capacidad como sinodal o ayudante.</p>' +
    '    <div style="text-align:center;margin:25px 0;">' +
    '      <span style="display:inline-block;background:' + BRAND_COLOR + ';color:#fff;padding:12px 30px;border-radius:25px;font-weight:bold;font-size:16px;">!Siempre Listo!</span>' +
    '    </div>' +
    '  </td></tr>' +
    '  <tr><td style="background:#f8f0ff;padding:15px 40px;text-align:center;border-top:1px solid #e0c8f0;">' +
    '    <p style="color:#888;font-size:12px;margin:0;">' + PLATFORM_NAME + ' | vallescout.org.co</p>' +
    '    <p style="color:#aaa;font-size:11px;margin:5px 0 0;">Este correo fue enviado automaticamente. No es necesario responder.</p>' +
    '  </td></tr>' +
    '</table>' +
    '</body></html>';
}

/**
 * Genera el HTML del correo de felicitaciones con certificado.
 * @param {string} name - Nombre del estudiante
 * @param {string} course - Nombre del curso
 * @param {string} code - Codigo del certificado
 * @param {number} score - Puntuacion promedio
 * @return {string}
 */
function getCertificateEmailHtml(name, course, code, score) {
  return '<!DOCTYPE html>' +
    '<html><head><meta charset="utf-8"></head>' +
    '<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">' +
    '<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:20px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.1);">' +
    '  <tr><td style="background:' + BRAND_COLOR + ';padding:30px 40px;text-align:center;">' +
    '    <h1 style="color:#ffffff;margin:0;font-size:24px;">&#127942; !Felicitaciones!</h1>' +
    '    <p style="color:#e0c8f0;margin:8px 0 0;font-size:14px;">' + PLATFORM_NAME + '</p>' +
    '  </td></tr>' +
    '  <tr><td style="padding:30px 40px;">' +
    '    <h2 style="color:' + BRAND_COLOR + ';margin-top:0;">!Lo lograste, ' + sanitize(name, 100) + '!</h2>' +
    '    <p style="color:#333;line-height:1.6;">Has completado exitosamente el curso:</p>' +
    '    <div style="background:#f8f0ff;border-left:4px solid ' + BRAND_COLOR + ';padding:15px 20px;margin:15px 0;border-radius:0 8px 8px 0;">' +
    '      <strong style="color:' + BRAND_COLOR + ';font-size:18px;">' + sanitize(course, 200) + '</strong>' +
    '    </div>' +
    '    <div style="background:#fafafa;border:2px dashed ' + BRAND_COLOR + ';padding:25px;margin:20px 0;text-align:center;border-radius:12px;">' +
    '      <p style="color:#888;margin:0 0 8px;font-size:13px;text-transform:uppercase;letter-spacing:1px;">Tu codigo de certificado</p>' +
    '      <p style="color:' + BRAND_COLOR + ';font-size:28px;font-weight:bold;margin:0;letter-spacing:3px;">' + sanitize(code, 20) + '</p>' +
    '      <p style="color:#666;margin:10px 0 0;font-size:14px;">Puntuacion promedio: <strong>' + (score || 0) + '%</strong></p>' +
    '    </div>' +
    '    <p style="color:#333;line-height:1.6;">Guarda este codigo. Puedes usarlo para verificar tu certificado en cualquier momento.</p>' +
    '    <p style="color:#333;line-height:1.6;">!Ahora estas mejor preparado/a para servir como sinodal o ayudante en tu grupo scout!</p>' +
    '    <div style="text-align:center;margin:25px 0;">' +
    '      <span style="display:inline-block;background:' + BRAND_COLOR + ';color:#fff;padding:12px 30px;border-radius:25px;font-weight:bold;font-size:16px;">&#9884;&#65039; Siempre Listo para Servir</span>' +
    '    </div>' +
    '  </td></tr>' +
    '  <tr><td style="background:#f8f0ff;padding:15px 40px;text-align:center;border-top:1px solid #e0c8f0;">' +
    '    <p style="color:#888;font-size:12px;margin:0;">' + PLATFORM_NAME + ' | vallescout.org.co</p>' +
    '    <p style="color:#aaa;font-size:11px;margin:5px 0 0;">Este correo fue enviado automaticamente. No es necesario responder.</p>' +
    '  </td></tr>' +
    '</table>' +
    '</body></html>';
}

/**
 * Genera HTML para el correo de recordatorio a estudiantes inactivos.
 * @param {string} name
 * @param {string} course
 * @param {number} daysInactive
 * @return {string}
 */
function getReminderEmailHtml(name, course, daysInactive) {
  return '<!DOCTYPE html>' +
    '<html><head><meta charset="utf-8"></head>' +
    '<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">' +
    '<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:20px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.1);">' +
    '  <tr><td style="background:' + BRAND_COLOR + ';padding:30px 40px;text-align:center;">' +
    '    <h1 style="color:#ffffff;margin:0;font-size:22px;">&#127795; Te extranamos en el camino</h1>' +
    '    <p style="color:#e0c8f0;margin:8px 0 0;font-size:14px;">' + PLATFORM_NAME + '</p>' +
    '  </td></tr>' +
    '  <tr><td style="padding:30px 40px;">' +
    '    <h2 style="color:' + BRAND_COLOR + ';margin-top:0;">Hola, ' + sanitize(name, 100) + '</h2>' +
    '    <p style="color:#333;line-height:1.6;">Hace ' + daysInactive + ' dias que no avanzas en tu curso:</p>' +
    '    <div style="background:#f8f0ff;border-left:4px solid ' + BRAND_COLOR + ';padding:15px 20px;margin:15px 0;border-radius:0 8px 8px 0;">' +
    '      <strong style="color:' + BRAND_COLOR + ';font-size:18px;">' + sanitize(course, 200) + '</strong>' +
    '    </div>' +
    '    <p style="color:#333;line-height:1.6;">Sabemos que la vida rover es activa y llena de compromisos, pero completar tu formacion te prepara para servir mejor a tu grupo scout. !Solo necesitas unos minutos al dia para retomar tu avance!</p>' +
    '    <div style="background:#fffbe6;border-left:4px solid #ffe675;padding:15px 20px;margin:20px 0;border-radius:0 8px 8px 0;">' +
    '      <p style="color:#7a6a00;margin:0;font-size:14px;line-height:1.5;"><strong>&#128161; Consejo:</strong> Tu progreso esta guardado. Al entrar de nuevo con tu email podras continuar justo donde lo dejaste.</p>' +
    '    </div>' +
    '    <div style="text-align:center;margin:25px 0;">' +
    '      <a href="https://maximoaluna-blip.github.io/INDUCCION-ROVER/" style="display:inline-block;background:' + BRAND_COLOR + ';color:#fff;padding:14px 32px;border-radius:25px;font-weight:bold;font-size:16px;text-decoration:none;">Retomar mi curso</a>' +
    '    </div>' +
    '    <p style="color:#888;line-height:1.6;font-size:13px;text-align:center;font-style:italic;">"Siempre Listo para Servir"</p>' +
    '  </td></tr>' +
    '  <tr><td style="background:#f8f0ff;padding:15px 40px;text-align:center;border-top:1px solid #e0c8f0;">' +
    '    <p style="color:#888;font-size:12px;margin:0;">' + PLATFORM_NAME + ' | vallescout.org.co</p>' +
    '    <p style="color:#aaa;font-size:11px;margin:5px 0 0;">Este correo fue enviado automaticamente. Si ya completaste el curso, puedes ignorarlo.</p>' +
    '  </td></tr>' +
    '</table>' +
    '</body></html>';
}

// ============================================================================
// DEFINICION DE HOJAS Y SUS ENCABEZADOS
// ============================================================================

var SHEET_CONFIG = {
  registros: {
    name: 'Registros',
    headers: ['Timestamp', 'Nombre Completo', 'Edad', 'Grupo', 'Region', 'Email', 'Motivacion', 'Curso', 'UserAgent', 'URL']
  },
  progreso: {
    name: 'Progreso',
    headers: ['Timestamp', 'Email', 'Nombre', 'Curso', 'Modulo Completado', 'Nombre Modulo']
  },
  evaluaciones: {
    name: 'Evaluaciones',
    headers: ['Timestamp', 'Email', 'Nombre', 'Curso', 'Modulo', 'Puntuacion']
  },
  certificados: {
    name: 'Certificados',
    headers: ['Timestamp', 'Email', 'Nombre', 'Curso', 'Grupo', 'Region', 'Codigo Certificado', 'Fecha Completacion', 'Puntuacion', 'Tiempo Estudio']
  },
  compromisos: {
    name: 'Compromisos',
    headers: ['Timestamp', 'Email', 'Nombre', 'Curso', 'Compromiso']
  },
  recordatorios: {
    name: 'Recordatorios',
    headers: ['Timestamp', 'Email', 'Nombre', 'Curso', 'Dias Inactivo', 'Tipo']
  }
};

// ============================================================================
// MANEJADOR GET (doGet)
// ============================================================================

/**
 * Maneja solicitudes HTTP GET.
 * Acciones soportadas:
 *   - recover: Recuperar progreso de un estudiante por email
 *   - verify:  Verificar validez de un codigo de certificado
 *   - stats:   Obtener estadisticas generales (dashboard administrativo)
 *
 * @param {object} e - Evento de solicitud con parametros en e.parameter
 * @return {GoogleAppsScript.Content.TextOutput}
 */
function doGet(e) {
  try {
    var params = e.parameter || {};
    var action = params.action;

    if (!action) {
      return jsonResponse(false, null, 'Parametro "action" requerido.');
    }

    switch (action) {

      // --- Recuperar progreso completo del estudiante ---
      case 'recover':
        return handleRecover(params);

      // --- Verificar certificado ---
      case 'verify':
        return handleVerify(params);

      // --- Estadisticas generales ---
      case 'stats':
        return handleStats();

      default:
        return jsonResponse(false, null, 'Accion GET no reconocida: ' + action);
    }

  } catch (error) {
    return jsonResponse(false, null, 'Error interno del servidor: ' + error.message);
  }
}

/**
 * Recupera todos los datos de un estudiante buscando por email.
 */
function handleRecover(params) {
  var email = sanitize(params.email, 200);
  if (!email || !validateEmail(email)) {
    return jsonResponse(false, null, 'Email invalido o faltante.');
  }
  email = email.toLowerCase();

  var result = {
    registration: null,
    modules: [],
    quizzes: [],
    certificates: [],
    commitments: []
  };

  // Buscar en Registros
  try {
    var regSheet = getOrCreateSheet(SHEET_CONFIG.registros.name, SHEET_CONFIG.registros.headers);
    var regData = regSheet.getDataRange().getValues();
    for (var i = 1; i < regData.length; i++) {
      if (String(regData[i][5]).toLowerCase().trim() === email) {
        result.registration = {
          timestamp: regData[i][0],
          fullName: regData[i][1],
          age: regData[i][2],
          group: regData[i][3],
          region: regData[i][4],
          email: regData[i][5],
          motivation: regData[i][6],
          course: regData[i][7]
        };
        break; // Tomar el primer registro
      }
    }
  } catch (err) { /* Hoja puede no existir aun */ }

  // Buscar en Progreso
  try {
    var progSheet = getOrCreateSheet(SHEET_CONFIG.progreso.name, SHEET_CONFIG.progreso.headers);
    var progData = progSheet.getDataRange().getValues();
    for (var j = 1; j < progData.length; j++) {
      if (String(progData[j][1]).toLowerCase().trim() === email) {
        result.modules.push({
          timestamp: progData[j][0],
          course: progData[j][3],
          moduleCompleted: progData[j][4],
          moduleName: progData[j][5]
        });
      }
    }
  } catch (err) { /* Hoja puede no existir aun */ }

  // Buscar en Evaluaciones
  try {
    var evalSheet = getOrCreateSheet(SHEET_CONFIG.evaluaciones.name, SHEET_CONFIG.evaluaciones.headers);
    var evalData = evalSheet.getDataRange().getValues();
    for (var k = 1; k < evalData.length; k++) {
      if (String(evalData[k][1]).toLowerCase().trim() === email) {
        result.quizzes.push({
          timestamp: evalData[k][0],
          course: evalData[k][3],
          module: evalData[k][4],
          score: evalData[k][5]
        });
      }
    }
  } catch (err) { /* Hoja puede no existir aun */ }

  // Buscar en Certificados
  try {
    var certSheet = getOrCreateSheet(SHEET_CONFIG.certificados.name, SHEET_CONFIG.certificados.headers);
    var certData = certSheet.getDataRange().getValues();
    for (var m = 1; m < certData.length; m++) {
      if (String(certData[m][1]).toLowerCase().trim() === email) {
        result.certificates.push({
          timestamp: certData[m][0],
          course: certData[m][3],
          group: certData[m][4],
          region: certData[m][5],
          certificateCode: certData[m][6],
          completionDate: certData[m][7],
          score: certData[m][8],
          studyTime: certData[m][9]
        });
      }
    }
  } catch (err) { /* Hoja puede no existir aun */ }

  // Buscar en Compromisos
  try {
    var comSheet = getOrCreateSheet(SHEET_CONFIG.compromisos.name, SHEET_CONFIG.compromisos.headers);
    var comData = comSheet.getDataRange().getValues();
    for (var n = 1; n < comData.length; n++) {
      if (String(comData[n][1]).toLowerCase().trim() === email) {
        result.commitments.push({
          timestamp: comData[n][0],
          course: comData[n][3],
          commitment: comData[n][4]
        });
      }
    }
  } catch (err) { /* Hoja puede no existir aun */ }

  if (!result.registration && result.modules.length === 0) {
    return jsonResponse(false, null, 'No se encontraron datos para el email: ' + email);
  }

  return jsonResponse(true, result);
}

/**
 * Verifica si un codigo de certificado es valido.
 */
function handleVerify(params) {
  var code = sanitize(params.code, 20);
  if (!code) {
    return jsonResponse(false, null, 'Codigo de certificado requerido.');
  }
  code = code.toUpperCase().trim();

  // Validar formato basico ASC-YYYY-XXXXX
  var codeRegex = /^ASC-\d{4}-[A-Z0-9]{5}$/;
  if (!codeRegex.test(code)) {
    return jsonResponse(false, null, 'Formato de codigo invalido. Debe ser ASC-YYYY-XXXXX.');
  }

  try {
    var certSheet = getOrCreateSheet(SHEET_CONFIG.certificados.name, SHEET_CONFIG.certificados.headers);
    var certData = certSheet.getDataRange().getValues();

    for (var i = 1; i < certData.length; i++) {
      if (String(certData[i][6]).toUpperCase().trim() === code) {
        return jsonResponse(true, {
          valid: true,
          studentName: certData[i][2],
          email: certData[i][1],
          course: certData[i][3],
          group: certData[i][4],
          region: certData[i][5],
          completionDate: certData[i][7],
          score: certData[i][8],
          certificateCode: code
        });
      }
    }

    return jsonResponse(true, { valid: false, certificateCode: code });

  } catch (error) {
    return jsonResponse(false, null, 'Error al verificar certificado: ' + error.message);
  }
}

/**
 * Retorna estadisticas generales para el panel administrativo.
 */
function handleStats() {
  try {
    var stats = {
      totalUsers: 0,
      totalCertificates: 0,
      totalQuizzes: 0,
      totalCommitments: 0,
      completionsByModule: {},
      courseStats: {},
      averageScore: 0,
      generatedAt: new Date().toISOString()
    };

    // Contar registros
    try {
      var regSheet = getOrCreateSheet(SHEET_CONFIG.registros.name, SHEET_CONFIG.registros.headers);
      var regData = regSheet.getDataRange().getValues();
      stats.totalUsers = Math.max(0, regData.length - 1); // Descontar encabezado

      // Estadisticas por curso
      for (var i = 1; i < regData.length; i++) {
        var course = String(regData[i][7] || 'sin-curso');
        if (!stats.courseStats[course]) {
          stats.courseStats[course] = { registrations: 0, certificates: 0, avgScore: 0, scores: [] };
        }
        stats.courseStats[course].registrations++;
      }
    } catch (err) { /* Sin datos aun */ }

    // Contar certificados
    try {
      var certSheet = getOrCreateSheet(SHEET_CONFIG.certificados.name, SHEET_CONFIG.certificados.headers);
      var certData = certSheet.getDataRange().getValues();
      stats.totalCertificates = Math.max(0, certData.length - 1);

      for (var j = 1; j < certData.length; j++) {
        var cCourse = String(certData[j][3] || 'sin-curso');
        if (!stats.courseStats[cCourse]) {
          stats.courseStats[cCourse] = { registrations: 0, certificates: 0, avgScore: 0, scores: [] };
        }
        stats.courseStats[cCourse].certificates++;
      }
    } catch (err) { /* Sin datos aun */ }

    // Completaciones por modulo
    try {
      var progSheet = getOrCreateSheet(SHEET_CONFIG.progreso.name, SHEET_CONFIG.progreso.headers);
      var progData = progSheet.getDataRange().getValues();
      for (var k = 1; k < progData.length; k++) {
        var modKey = String(progData[k][3] || 'curso') + '_modulo_' + String(progData[k][4] || '?');
        stats.completionsByModule[modKey] = (stats.completionsByModule[modKey] || 0) + 1;
      }
    } catch (err) { /* Sin datos aun */ }

    // Estadisticas de evaluaciones
    try {
      var evalSheet = getOrCreateSheet(SHEET_CONFIG.evaluaciones.name, SHEET_CONFIG.evaluaciones.headers);
      var evalData = evalSheet.getDataRange().getValues();
      stats.totalQuizzes = Math.max(0, evalData.length - 1);
      var totalScore = 0;
      var scoreCount = 0;
      for (var m = 1; m < evalData.length; m++) {
        var score = parseFloat(evalData[m][5]);
        if (!isNaN(score)) {
          totalScore += score;
          scoreCount++;
          var eCourse = String(evalData[m][3] || 'sin-curso');
          if (stats.courseStats[eCourse]) {
            stats.courseStats[eCourse].scores.push(score);
          }
        }
      }
      stats.averageScore = scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0;

      // Calcular promedios por curso
      for (var courseKey in stats.courseStats) {
        var cs = stats.courseStats[courseKey];
        if (cs.scores.length > 0) {
          var sum = 0;
          for (var s = 0; s < cs.scores.length; s++) sum += cs.scores[s];
          cs.avgScore = Math.round(sum / cs.scores.length);
        }
        delete cs.scores; // No enviar array crudo
      }
    } catch (err) { /* Sin datos aun */ }

    // Contar compromisos
    try {
      var comSheet = getOrCreateSheet(SHEET_CONFIG.compromisos.name, SHEET_CONFIG.compromisos.headers);
      var comData = comSheet.getDataRange().getValues();
      stats.totalCommitments = Math.max(0, comData.length - 1);
    } catch (err) { /* Sin datos aun */ }

    return jsonResponse(true, stats);

  } catch (error) {
    return jsonResponse(false, null, 'Error al generar estadisticas: ' + error.message);
  }
}

// ============================================================================
// MANEJADOR POST (doPost)
// ============================================================================

/**
 * Maneja solicitudes HTTP POST.
 * Acciones soportadas:
 *   - register:   Registro de nuevo estudiante
 *   - quiz:       Guardar resultado de evaluacion
 *   - progress:   Guardar completacion de modulo
 *   - certificate: Generar y guardar certificado
 *   - commitment: Guardar compromiso final
 *
 * Todas las acciones requieren:
 *   - Campo "token" con el valor AUTH_TOKEN
 *   - Campos especificos segun la accion
 *
 * @param {object} e - Evento de solicitud con datos en e.postData.contents
 * @return {GoogleAppsScript.Content.TextOutput}
 */
function doPost(e) {
  try {
    // Parsear el cuerpo de la solicitud
    var body;
    try {
      body = JSON.parse(e.postData.contents);
    } catch (parseError) {
      return jsonResponse(false, null, 'JSON invalido en el cuerpo de la solicitud.');
    }

    // Verificar token de autenticacion
    if (!body.token || body.token !== AUTH_TOKEN) {
      return jsonResponse(false, null, 'Token de autenticacion invalido o faltante.');
    }

    var action = body.action;
    if (!action) {
      return jsonResponse(false, null, 'Campo "action" requerido.');
    }

    // Verificar rate limiting (si hay email)
    var email = body.email ? sanitize(body.email, 200).toLowerCase() : null;
    if (email && rateLimitCheck(email)) {
      return jsonResponse(false, null, 'Demasiadas solicitudes. Intenta de nuevo en un minuto.');
    }

    // Timestamp comun para todos los registros
    var timestamp = new Date();

    switch (action) {

      case 'register':
        return handleRegister(body, timestamp);

      case 'quiz':
        return handleQuiz(body, timestamp);

      case 'progress':
        return handleProgress(body, timestamp);

      case 'certificate':
        return handleCertificate(body, timestamp);

      case 'commitment':
        return handleCommitment(body, timestamp);

      default:
        return jsonResponse(false, null, 'Accion POST no reconocida: ' + action);
    }

  } catch (error) {
    return jsonResponse(false, null, 'Error interno del servidor: ' + error.message);
  }
}

// ============================================================================
// MANEJADORES DE ACCIONES POST
// ============================================================================

/**
 * Registra un nuevo estudiante.
 * Validaciones:
 *   - fullName: requerido, max 200 caracteres
 *   - email: formato valido
 *   - age: entre 16 y 25
 */
function handleRegister(body, timestamp) {
  // --- Validaciones ---
  var fullName = sanitize(body.fullName, 200);
  if (!fullName) {
    return jsonResponse(false, null, 'El nombre completo es requerido.');
  }

  var email = sanitize(body.email, 200);
  if (!validateEmail(email)) {
    return jsonResponse(false, null, 'El formato del email es invalido.');
  }

  var age = parseInt(body.age, 10);
  if (isNaN(age) || age < 18 || age > 22) {
    return jsonResponse(false, null, 'La edad debe estar entre 18 y 22 anios (rango oficial de rovers ASC).');
  }

  var group = sanitize(body.group, 200);
  var region = sanitize(body.region, 200);
  var motivation = sanitize(body.motivation, 1000);
  var course = sanitize(body.course, 200);
  var userAgent = sanitize(body.userAgent, 500);
  var url = sanitize(body.url, 500);

  try {
    // Guardar en la hoja
    var sheet = getOrCreateSheet(SHEET_CONFIG.registros.name, SHEET_CONFIG.registros.headers);
    sheet.appendRow([
      timestamp, fullName, age, group, region,
      email.toLowerCase(), motivation, course, userAgent, url
    ]);

    // Enviar correo de bienvenida
    try {
      var htmlBody = getWelcomeEmailHtml(fullName, course);
      GmailApp.sendEmail(email, 'Bienvenido/a al curso: ' + course + ' - ' + PLATFORM_NAME, '', {
        htmlBody: htmlBody,
        name: PLATFORM_NAME
      });
    } catch (emailError) {
      // No fallar si el correo no se envia (cuota de Gmail, etc.)
      Logger.log('Error enviando correo de bienvenida a ' + email + ': ' + emailError.message);
    }

    return jsonResponse(true, {
      message: 'Registro exitoso. !Bienvenido/a, ' + fullName + '!',
      email: email.toLowerCase(),
      course: course
    });

  } catch (error) {
    return jsonResponse(false, null, 'Error al guardar registro: ' + error.message);
  }
}

/**
 * Guarda el resultado de una evaluacion (quiz).
 * Validaciones:
 *   - email: formato valido
 *   - module: numero entero
 *   - score: entre 0 y 100
 */
function handleQuiz(body, timestamp) {
  var email = sanitize(body.email, 200);
  if (!validateEmail(email)) {
    return jsonResponse(false, null, 'Email invalido.');
  }

  var name = sanitize(body.name, 200);
  if (!name) {
    return jsonResponse(false, null, 'El nombre es requerido.');
  }

  var course = sanitize(body.course, 200);
  if (!course) {
    return jsonResponse(false, null, 'El curso es requerido.');
  }

  var moduleNum = parseInt(body.module, 10);
  if (isNaN(moduleNum) || moduleNum < 0) {
    return jsonResponse(false, null, 'Numero de modulo invalido.');
  }

  var score = parseFloat(body.score);
  if (isNaN(score) || score < 0 || score > 100) {
    return jsonResponse(false, null, 'La puntuacion debe estar entre 0 y 100.');
  }
  score = Math.round(score);

  try {
    var sheet = getOrCreateSheet(SHEET_CONFIG.evaluaciones.name, SHEET_CONFIG.evaluaciones.headers);
    sheet.appendRow([
      timestamp, email.toLowerCase(), name, course, moduleNum, score
    ]);

    return jsonResponse(true, {
      message: 'Evaluacion guardada.',
      module: moduleNum,
      score: score
    });

  } catch (error) {
    return jsonResponse(false, null, 'Error al guardar evaluacion: ' + error.message);
  }
}

/**
 * Guarda la completacion de un modulo.
 * Validaciones:
 *   - email: formato valido
 *   - moduleCompleted: numero entero
 */
function handleProgress(body, timestamp) {
  var email = sanitize(body.email, 200);
  if (!validateEmail(email)) {
    return jsonResponse(false, null, 'Email invalido.');
  }

  var name = sanitize(body.name, 200);
  if (!name) {
    return jsonResponse(false, null, 'El nombre es requerido.');
  }

  var course = sanitize(body.course, 200);
  if (!course) {
    return jsonResponse(false, null, 'El curso es requerido.');
  }

  var moduleCompleted = parseInt(body.moduleCompleted, 10);
  if (isNaN(moduleCompleted) || moduleCompleted < 0) {
    return jsonResponse(false, null, 'Numero de modulo invalido.');
  }

  var moduleName = sanitize(body.moduleName, 200) || ('Modulo ' + moduleCompleted);

  try {
    var sheet = getOrCreateSheet(SHEET_CONFIG.progreso.name, SHEET_CONFIG.progreso.headers);
    sheet.appendRow([
      timestamp, email.toLowerCase(), name, course, moduleCompleted, moduleName
    ]);

    return jsonResponse(true, {
      message: 'Progreso guardado.',
      moduleCompleted: moduleCompleted
    });

  } catch (error) {
    return jsonResponse(false, null, 'Error al guardar progreso: ' + error.message);
  }
}

/**
 * Genera un certificado de completacion.
 * El codigo se genera en el SERVIDOR (no en el cliente) para garantizar unicidad.
 * Validaciones:
 *   - email: formato valido
 *   - name: requerido
 *   - score: entre 0 y 100
 */
function handleCertificate(body, timestamp) {
  var email = sanitize(body.email, 200);
  if (!validateEmail(email)) {
    return jsonResponse(false, null, 'Email invalido.');
  }

  var name = sanitize(body.name, 200);
  if (!name) {
    return jsonResponse(false, null, 'El nombre es requerido.');
  }

  var course = sanitize(body.course, 200);
  if (!course) {
    return jsonResponse(false, null, 'El curso es requerido.');
  }

  var group = sanitize(body.group, 200);
  var region = sanitize(body.region, 200);
  var score = parseFloat(body.score);
  if (isNaN(score) || score < 0 || score > 100) {
    score = 0;
  }
  score = Math.round(score);

  var studyTime = parseInt(body.studyTime, 10) || 0;
  var completionDate = sanitize(body.completionDate, 50) || timestamp.toISOString();

  try {
    // Verificar si ya tiene certificado para este curso (evitar duplicados)
    var certSheet = getOrCreateSheet(SHEET_CONFIG.certificados.name, SHEET_CONFIG.certificados.headers);
    var existingData = certSheet.getDataRange().getValues();
    for (var i = 1; i < existingData.length; i++) {
      if (String(existingData[i][1]).toLowerCase().trim() === email.toLowerCase() &&
          String(existingData[i][3]).trim() === course) {
        // Ya tiene certificado para este curso, devolver el existente
        return jsonResponse(true, {
          message: 'Ya tienes un certificado para este curso.',
          certificateCode: existingData[i][6],
          alreadyIssued: true
        });
      }
    }

    // Generar codigo unico verificando que no exista
    var certificateCode;
    var codeExists = true;
    var maxAttempts = 10;
    var attempt = 0;
    while (codeExists && attempt < maxAttempts) {
      certificateCode = generateCertificateCode();
      codeExists = false;
      for (var j = 1; j < existingData.length; j++) {
        if (String(existingData[j][6]).toUpperCase() === certificateCode) {
          codeExists = true;
          break;
        }
      }
      attempt++;
    }

    if (codeExists) {
      return jsonResponse(false, null, 'No se pudo generar un codigo unico. Intenta de nuevo.');
    }

    // Guardar certificado
    certSheet.appendRow([
      timestamp, email.toLowerCase(), name, course, group, region,
      certificateCode, completionDate, score, studyTime
    ]);

    // Enviar correo de felicitaciones
    try {
      var htmlBody = getCertificateEmailHtml(name, course, certificateCode, score);
      GmailApp.sendEmail(email, '!Certificado obtenido! ' + course + ' - ' + PLATFORM_NAME, '', {
        htmlBody: htmlBody,
        name: PLATFORM_NAME
      });
    } catch (emailError) {
      Logger.log('Error enviando correo de certificado a ' + email + ': ' + emailError.message);
    }

    return jsonResponse(true, {
      message: '!Certificado generado exitosamente!',
      certificateCode: certificateCode,
      alreadyIssued: false,
      studentName: name,
      course: course,
      completionDate: completionDate,
      score: score
    });

  } catch (error) {
    return jsonResponse(false, null, 'Error al generar certificado: ' + error.message);
  }
}

/**
 * Guarda el compromiso final del estudiante.
 * Validaciones:
 *   - email: formato valido
 *   - commitment: requerido, max 1000 caracteres
 */
function handleCommitment(body, timestamp) {
  var email = sanitize(body.email, 200);
  if (!validateEmail(email)) {
    return jsonResponse(false, null, 'Email invalido.');
  }

  var name = sanitize(body.name, 200);
  if (!name) {
    return jsonResponse(false, null, 'El nombre es requerido.');
  }

  var course = sanitize(body.course, 200);
  if (!course) {
    return jsonResponse(false, null, 'El curso es requerido.');
  }

  var commitment = sanitize(body.commitment, 1000);
  if (!commitment) {
    return jsonResponse(false, null, 'El texto del compromiso es requerido.');
  }

  try {
    var sheet = getOrCreateSheet(SHEET_CONFIG.compromisos.name, SHEET_CONFIG.compromisos.headers);
    sheet.appendRow([
      timestamp, email.toLowerCase(), name, course, commitment
    ]);

    return jsonResponse(true, {
      message: 'Compromiso guardado exitosamente.',
      commitment: commitment
    });

  } catch (error) {
    return jsonResponse(false, null, 'Error al guardar compromiso: ' + error.message);
  }
}

// ============================================================================
// FUNCION DE PRUEBA / INICIALIZACION
// ============================================================================

// ============================================================================
// RECORDATORIOS AUTOMATICOS A ESTUDIANTES INACTIVOS
// ============================================================================

/**
 * Configuracion de los recordatorios. Ajusta segun necesidad.
 */
var REMINDER_CONFIG = {
  minDaysInactive: 7,      // No molestar antes de este umbral
  maxDaysInactive: 60,     // No enviar a quienes llevan demasiado tiempo sin entrar
  cooldownDays: 7,         // Minimo entre dos recordatorios al mismo usuario+curso
  maxEmailsPerRun: 50      // Cap defensivo para cuota Gmail (~100/dia en cuentas gratis)
};

/**
 * Construye un map "email|curso" -> ultima fecha de actividad (Date).
 * Considera tanto progreso de modulos como resultados de evaluaciones.
 * @return {Object}
 */
function buildLastActivityMap() {
  var map = {};

  function ingest(sheetName, emailCol, courseCol) {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
    if (!sheet) return;
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      var ts = row[0];
      var email = String(row[emailCol] || '').toLowerCase().trim();
      var course = String(row[courseCol] || '').trim();
      if (!email || !course || !ts) continue;
      var date = (ts instanceof Date) ? ts : new Date(ts);
      if (isNaN(date.getTime())) continue;
      var key = email + '|' + course;
      if (!map[key] || date > map[key]) {
        map[key] = date;
      }
    }
  }

  // Progreso: [Timestamp, Email, Nombre, Curso, ...]
  ingest(SHEET_CONFIG.progreso.name, 1, 3);
  // Evaluaciones: [Timestamp, Email, Nombre, Curso, ...]
  ingest(SHEET_CONFIG.evaluaciones.name, 1, 3);

  return map;
}

/**
 * Construye un set de "email|curso" con certificado ya emitido.
 * Estos usuarios NO deben recibir recordatorios para ese curso.
 * @return {Object}
 */
function buildCertificatedSet() {
  var set = {};
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_CONFIG.certificados.name);
  if (!sheet) return set;
  var data = sheet.getDataRange().getValues();
  // Certificados: [Timestamp, Email, Nombre, Curso, ...]
  for (var i = 1; i < data.length; i++) {
    var email = String(data[i][1] || '').toLowerCase().trim();
    var course = String(data[i][3] || '').trim();
    if (email && course) set[email + '|' + course] = true;
  }
  return set;
}

/**
 * Construye un map "email|curso" -> fecha del ultimo recordatorio enviado.
 * @return {Object}
 */
function buildLastReminderMap() {
  var map = {};
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_CONFIG.recordatorios.name);
  if (!sheet) return map;
  var data = sheet.getDataRange().getValues();
  // Recordatorios: [Timestamp, Email, Nombre, Curso, Dias Inactivo, Tipo]
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var ts = row[0];
    var email = String(row[1] || '').toLowerCase().trim();
    var course = String(row[3] || '').trim();
    if (!email || !course || !ts) continue;
    var date = (ts instanceof Date) ? ts : new Date(ts);
    if (isNaN(date.getTime())) continue;
    var key = email + '|' + course;
    if (!map[key] || date > map[key]) map[key] = date;
  }
  return map;
}

/**
 * Funcion principal: busca estudiantes inactivos y les envia un recordatorio.
 * Disenada para ejecutarse una vez al dia via trigger temporal.
 *
 * Criterios para enviar recordatorio:
 *   - Estudiante registrado en Registros
 *   - No tiene certificado para ese curso
 *   - minDaysInactive <= dias desde ultima actividad <= maxDaysInactive
 *   - No recibio otro recordatorio en los ultimos cooldownDays
 *   - Tope de maxEmailsPerRun por ejecucion
 *
 * @return {object} Resumen con estadisticas de la ejecucion
 */
function enviarRecordatoriosInactivos() {
  var startTime = new Date();
  Logger.log('=== Recordatorios automaticos: inicio ' + startTime.toISOString() + ' ===');

  var registrosSheet = getOrCreateSheet(SHEET_CONFIG.registros.name, SHEET_CONFIG.registros.headers);
  var recordatoriosSheet = getOrCreateSheet(SHEET_CONFIG.recordatorios.name, SHEET_CONFIG.recordatorios.headers);

  var registros = registrosSheet.getDataRange().getValues();
  if (registros.length <= 1) {
    Logger.log('No hay registros. Nada que hacer.');
    return { enviados: 0, candidatos: 0, registros: 0 };
  }

  var lastActivity = buildLastActivityMap();
  var certificados = buildCertificatedSet();
  var lastReminder = buildLastReminderMap();

  var now = new Date();
  var DAY_MS = 24 * 60 * 60 * 1000;
  var enviados = 0;
  var candidatos = 0;
  var errores = 0;

  // Deduplicar por email+curso (un usuario puede aparecer varias veces en Registros
  // si se inscribio a distintos cursos).
  var procesados = {};

  for (var i = 1; i < registros.length; i++) {
    if (enviados >= REMINDER_CONFIG.maxEmailsPerRun) {
      Logger.log('Cap de ' + REMINDER_CONFIG.maxEmailsPerRun + ' emails alcanzado; se detiene.');
      break;
    }

    var row = registros[i];
    var regTs = row[0];
    var fullName = String(row[1] || '').trim();
    var email = String(row[5] || '').toLowerCase().trim();
    var course = String(row[7] || '').trim();

    if (!email || !course || !fullName || !validateEmail(email)) continue;

    var key = email + '|' + course;
    if (procesados[key]) continue;
    procesados[key] = true;

    // Ya tiene certificado: no molestar
    if (certificados[key]) continue;

    // Determinar "ultima actividad": progreso/evaluacion o, en su defecto, la fecha de registro
    var lastDate = lastActivity[key];
    if (!lastDate) {
      lastDate = (regTs instanceof Date) ? regTs : new Date(regTs);
    }
    if (!lastDate || isNaN(lastDate.getTime())) continue;

    var daysInactive = Math.floor((now - lastDate) / DAY_MS);
    if (daysInactive < REMINDER_CONFIG.minDaysInactive) continue;
    if (daysInactive > REMINDER_CONFIG.maxDaysInactive) continue;

    // Cool-down
    var prevReminder = lastReminder[key];
    if (prevReminder) {
      var daysSinceReminder = Math.floor((now - prevReminder) / DAY_MS);
      if (daysSinceReminder < REMINDER_CONFIG.cooldownDays) continue;
    }

    candidatos++;

    // Enviar correo
    try {
      var htmlBody = getReminderEmailHtml(fullName, course, daysInactive);
      GmailApp.sendEmail(email, 'Te extranamos en tu curso: ' + course + ' - ' + PLATFORM_NAME, '', {
        htmlBody: htmlBody,
        name: PLATFORM_NAME
      });

      recordatoriosSheet.appendRow([
        now, email, fullName, course, daysInactive, 'inactividad'
      ]);

      enviados++;
      Logger.log('Recordatorio enviado a ' + email + ' (' + daysInactive + ' dias sin actividad en "' + course + '")');
    } catch (err) {
      errores++;
      Logger.log('Error enviando recordatorio a ' + email + ': ' + err.message);
    }
  }

  var duration = Math.round((new Date() - startTime) / 1000);
  Logger.log('=== Recordatorios: ' + enviados + ' enviados, ' + candidatos + ' candidatos, ' + errores + ' errores, ' + duration + 's ===');
  return { enviados: enviados, candidatos: candidatos, errores: errores, duration: duration };
}

/**
 * Configura un trigger temporal diario que ejecuta enviarRecordatoriosInactivos.
 * Ejecutar manualmente desde el editor de Apps Script UNA sola vez.
 * Antes de crear el nuevo trigger elimina los duplicados existentes.
 */
function configurarTriggerRecordatorios() {
  var existentes = ScriptApp.getProjectTriggers();
  var eliminados = 0;
  for (var i = 0; i < existentes.length; i++) {
    if (existentes[i].getHandlerFunction() === 'enviarRecordatoriosInactivos') {
      ScriptApp.deleteTrigger(existentes[i]);
      eliminados++;
    }
  }

  ScriptApp.newTrigger('enviarRecordatoriosInactivos')
    .timeBased()
    .everyDays(1)
    .atHour(9)  // 09:00 hora del proyecto (configurable en File > Project properties)
    .create();

  Logger.log('Trigger configurado: enviarRecordatoriosInactivos se ejecutara diariamente a las 09:00.');
  if (eliminados > 0) {
    Logger.log('Triggers duplicados eliminados: ' + eliminados);
  }
}

// ============================================================================
// BACKUP AUTOMATICO DE GOOGLE SHEETS
// ============================================================================

/**
 * Configuracion del backup automatico.
 */
var BACKUP_CONFIG = {
  folderName: 'Backups Plataforma Rover ASC',  // Carpeta en Google Drive raiz
  retentionCount: 12                            // Conservar ultimos N backups (resto se borra)
};

/**
 * Obtiene (o crea) la carpeta de backups en el Drive del usuario propietario.
 * @return {GoogleAppsScript.Drive.Folder}
 */
function getOrCreateBackupFolder() {
  var iter = DriveApp.getFoldersByName(BACKUP_CONFIG.folderName);
  if (iter.hasNext()) return iter.next();
  return DriveApp.createFolder(BACKUP_CONFIG.folderName);
}

/**
 * Hace una copia del spreadsheet activo en la carpeta de backups.
 * El nombre del archivo incluye timestamp YYYY-MM-DD-HHmm.
 * Despues elimina backups antiguos si excede retentionCount.
 *
 * Disenada para ejecutarse semanalmente via trigger temporal.
 * @return {object} Resumen con el archivo creado y backups eliminados
 */
function backupSheets() {
  var startTime = new Date();
  Logger.log('=== Backup Sheets: inicio ' + startTime.toISOString() + ' ===');

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sourceFile = DriveApp.getFileById(ss.getId());
    var folder = getOrCreateBackupFolder();

    // Timestamp formateado sin caracteres invalidos para nombres de archivo
    var tz = ss.getSpreadsheetTimeZone() || 'America/Bogota';
    var stamp = Utilities.formatDate(startTime, tz, 'yyyy-MM-dd-HHmm');
    var backupName = 'Backup Rover ASC - ' + stamp;

    var copy = sourceFile.makeCopy(backupName, folder);
    Logger.log('Backup creado: ' + backupName + ' (id=' + copy.getId() + ')');

    // Retencion: borrar los mas antiguos si excedemos el tope
    var eliminados = applyBackupRetention(folder);

    var duration = Math.round((new Date() - startTime) / 1000);
    Logger.log('=== Backup Sheets: OK, eliminados ' + eliminados + ' antiguos, ' + duration + 's ===');

    return {
      success: true,
      backupName: backupName,
      backupId: copy.getId(),
      eliminados: eliminados,
      duration: duration
    };
  } catch (err) {
    Logger.log('ERROR en backupSheets: ' + err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Borra los archivos de backup mas antiguos cuando el total supera retentionCount.
 * Solo considera archivos dentro de la carpeta de backups.
 * Usa setTrashed (papelera) en vez de borrado permanente para permitir recuperacion.
 *
 * @param {GoogleAppsScript.Drive.Folder} folder
 * @return {number} Cantidad de archivos enviados a la papelera
 */
function applyBackupRetention(folder) {
  var files = [];
  var iter = folder.getFiles();
  while (iter.hasNext()) {
    var f = iter.next();
    files.push({ file: f, created: f.getDateCreated().getTime() });
  }

  if (files.length <= BACKUP_CONFIG.retentionCount) return 0;

  // Mas reciente primero
  files.sort(function(a, b) { return b.created - a.created; });

  var toDelete = files.slice(BACKUP_CONFIG.retentionCount);
  var eliminados = 0;
  for (var i = 0; i < toDelete.length; i++) {
    try {
      toDelete[i].file.setTrashed(true);
      eliminados++;
    } catch (err) {
      Logger.log('No se pudo enviar a papelera: ' + err.message);
    }
  }
  return eliminados;
}

/**
 * Configura un trigger temporal semanal que ejecuta backupSheets cada lunes 02:00.
 * Ejecutar manualmente desde el editor de Apps Script UNA sola vez.
 * Elimina duplicados existentes del mismo handler antes de crear uno nuevo.
 */
function configurarTriggerBackup() {
  var existentes = ScriptApp.getProjectTriggers();
  var eliminados = 0;
  for (var i = 0; i < existentes.length; i++) {
    if (existentes[i].getHandlerFunction() === 'backupSheets') {
      ScriptApp.deleteTrigger(existentes[i]);
      eliminados++;
    }
  }

  ScriptApp.newTrigger('backupSheets')
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.MONDAY)
    .atHour(2)
    .create();

  Logger.log('Trigger configurado: backupSheets se ejecutara los lunes a las 02:00.');
  if (eliminados > 0) {
    Logger.log('Triggers duplicados eliminados: ' + eliminados);
  }
}

// ============================================================================
// FUNCIONES DE UTILIDAD Y TEST
// ============================================================================

/**
 * Funcion para probar que todo funciona correctamente.
 * Ejecutar manualmente desde el editor de Apps Script.
 * Crea todas las hojas necesarias si no existen.
 */
function inicializarHojas() {
  Logger.log('=== Inicializando hojas de la Plataforma Educativa Rover ASC ===');

  for (var key in SHEET_CONFIG) {
    var config = SHEET_CONFIG[key];
    var sheet = getOrCreateSheet(config.name, config.headers);
    Logger.log('Hoja "' + config.name + '": OK (' + sheet.getLastRow() + ' filas)');
  }

  Logger.log('=== Inicializacion completa ===');
  Logger.log('Ahora despliega como Web App:');
  Logger.log('1. Menu > Implementar > Nueva implementacion');
  Logger.log('2. Tipo: Aplicacion web');
  Logger.log('3. Ejecutar como: Yo');
  Logger.log('4. Acceso: Cualquier persona');
}

/**
 * Funcion de prueba para verificar que el formato JSON funciona.
 * Ejecutar manualmente desde el editor de Apps Script.
 */
function testJsonResponse() {
  var response = jsonResponse(true, { test: 'OK', timestamp: new Date().toISOString() });
  Logger.log(response.getContent());
}

/**
 * Funcion de prueba para verificar la generacion de codigos.
 * Ejecutar manualmente desde el editor de Apps Script.
 */
function testCertificateCode() {
  for (var i = 0; i < 5; i++) {
    Logger.log('Codigo generado: ' + generateCertificateCode());
  }
}
// ============================================================================
// BACKUP AUTOMATICO - Plataforma Educativa Rover ASC
// ============================================================================
//
// Este modulo se agrega al final de google-apps-script.js y crea una copia
// completa del Google Sheet cada noche a las 2:00 AM (zona horaria del script).
//
// CARACTERISTICAS:
//  - Crea una carpeta "Backups_Plataforma_Rover_ASC" en tu Google Drive
//  - Genera una copia del sheet con timestamp: rover-backup-YYYY-MM-DD.xlsx
//  - Conserva los ultimos 30 backups y borra los mas antiguos automaticamente
//  - Envia correo al propietario del script si la copia falla
//
// INSTALACION (una sola vez):
//  1. Pega este codigo al final de tu archivo Code.gs en Apps Script
//  2. Ejecuta MANUALMENTE la funcion: instalarTriggerBackup
//  3. Acepta los permisos solicitados (Drive, Gmail, Spreadsheet)
//  4. Verifica que el trigger quedo instalado: menu Triggers (reloj a la izquierda)
//
// PRUEBA MANUAL:
//  Ejecuta backupAutomatico() desde el editor para hacer una copia inmediata.
//
// DESINSTALAR:
//  Ejecuta eliminarTriggerBackup() y se removeran todos los triggers de backup.
// ============================================================================

// --- Configuracion ---
var BACKUP_FOLDER_NAME = 'Backups_Plataforma_Rover_ASC';
var BACKUP_RETENTION_DAYS = 30;     // numero de backups a conservar
var BACKUP_HOUR = 2;                // hora del dia para el backup (0-23)
var BACKUP_FILENAME_PREFIX = 'rover-backup-';

/**
 * Obtiene (o crea) la carpeta de backups en Drive.
 * @return {GoogleAppsScript.Drive.Folder}
 */
function obtenerCarpetaBackup() {
  var folders = DriveApp.getFoldersByName(BACKUP_FOLDER_NAME);
  if (folders.hasNext()) {
    return folders.next();
  }
  var folder = DriveApp.createFolder(BACKUP_FOLDER_NAME);
  Logger.log('📁 Carpeta de backups creada: ' + folder.getUrl());
  return folder;
}

/**
 * Crea un backup del Google Sheet activo y lo guarda en Drive.
 * Esta funcion se ejecuta automaticamente cada noche por el trigger.
 *
 * Tambien puede invocarse manualmente desde el editor para probar.
 */
function backupAutomatico() {
  var inicio = new Date();
  Logger.log('🔄 Iniciando backup automatico: ' + inicio.toISOString());

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) {
      throw new Error('No hay un Google Sheet activo asociado a este script.');
    }

    // Construir nombre del backup con fecha (formato: rover-backup-2026-04-25)
    var fecha = Utilities.formatDate(inicio, Session.getScriptTimeZone(), 'yyyy-MM-dd');
    var nombreBackup = BACKUP_FILENAME_PREFIX + fecha;

    var carpeta = obtenerCarpetaBackup();

    // Si ya existe un backup con la misma fecha, agregar timestamp con hora
    var existentes = carpeta.getFilesByName(nombreBackup);
    if (existentes.hasNext()) {
      var hora = Utilities.formatDate(inicio, Session.getScriptTimeZone(), 'HH-mm');
      nombreBackup = BACKUP_FILENAME_PREFIX + fecha + '-' + hora;
    }

    // Hacer copia del archivo del sheet en la carpeta de backups
    var archivoOriginal = DriveApp.getFileById(ss.getId());
    var copia = archivoOriginal.makeCopy(nombreBackup, carpeta);

    Logger.log('✅ Backup creado: ' + copia.getName() + ' (' + copia.getUrl() + ')');

    // Limpiar backups antiguos
    var eliminados = limpiarBackupsAntiguos(carpeta);

    // Estadisticas
    var duracion = Math.round((new Date() - inicio) / 1000);
    var totalBackups = contarBackupsEnCarpeta(carpeta);

    Logger.log('📊 Resumen del backup:');
    Logger.log('   - Duracion: ' + duracion + 's');
    Logger.log('   - Backups antiguos eliminados: ' + eliminados);
    Logger.log('   - Backups totales en carpeta: ' + totalBackups);

    return {
      ok: true,
      archivo: copia.getName(),
      url: copia.getUrl(),
      eliminados: eliminados,
      totalBackups: totalBackups,
      duracionSegundos: duracion
    };

  } catch (err) {
    Logger.log('❌ ERROR en backup automatico: ' + err.message);
    Logger.log(err.stack || '(sin stack trace)');

    // Notificar al propietario del script por correo
    try {
      var emailPropietario = Session.getEffectiveUser().getEmail();
      if (emailPropietario) {
        MailApp.sendEmail({
          to: emailPropietario,
          subject: '⚠️ Falla en backup - Plataforma Rover ASC',
          body: 'El backup automatico del Google Sheet fallo a las ' + inicio.toISOString() + '.\n\n' +
                'Error: ' + err.message + '\n\n' +
                'Stack: ' + (err.stack || '(no disponible)') + '\n\n' +
                'Por favor revisa el editor de Apps Script.'
        });
        Logger.log('📧 Notificacion de error enviada a: ' + emailPropietario);
      }
    } catch (mailErr) {
      Logger.log('No se pudo enviar el correo de notificacion: ' + mailErr.message);
    }

    return { ok: false, error: err.message };
  }
}

/**
 * Cuenta cuantos backups hay actualmente en la carpeta.
 * @param {GoogleAppsScript.Drive.Folder} carpeta
 * @return {number}
 */
function contarBackupsEnCarpeta(carpeta) {
  var count = 0;
  var iter = carpeta.getFilesByType(MimeType.GOOGLE_SHEETS);
  while (iter.hasNext()) { iter.next(); count++; }
  return count;
}

/**
 * Elimina backups mas antiguos que BACKUP_RETENTION_DAYS dias.
 * @param {GoogleAppsScript.Drive.Folder} carpeta
 * @return {number} cantidad de archivos eliminados
 */
function limpiarBackupsAntiguos(carpeta) {
  var limite = new Date();
  limite.setDate(limite.getDate() - BACKUP_RETENTION_DAYS);

  var eliminados = 0;
  var archivos = carpeta.getFiles();

  while (archivos.hasNext()) {
    var archivo = archivos.next();
    if (archivo.getName().indexOf(BACKUP_FILENAME_PREFIX) === 0) {
      var fechaCreacion = archivo.getDateCreated();
      if (fechaCreacion < limite) {
        Logger.log('🗑️ Eliminando backup antiguo: ' + archivo.getName() +
                   ' (creado ' + Utilities.formatDate(fechaCreacion, Session.getScriptTimeZone(), 'yyyy-MM-dd') + ')');
        archivo.setTrashed(true);  // mover a papelera (recuperable 30 dias)
        eliminados++;
      }
    }
  }

  return eliminados;
}

/**
 * Instala el trigger diario que ejecuta backupAutomatico().
 * Ejecutar UNA SOLA VEZ desde el editor.
 *
 * Si ya existe un trigger de backup, lo elimina antes de crear el nuevo
 * para evitar duplicados.
 */
function instalarTriggerBackup() {
  // Eliminar triggers existentes de backupAutomatico para evitar duplicados
  var triggers = ScriptApp.getProjectTriggers();
  var eliminados = 0;
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'backupAutomatico') {
      ScriptApp.deleteTrigger(triggers[i]);
      eliminados++;
    }
  }

  if (eliminados > 0) {
    Logger.log('🗑️ Triggers anteriores eliminados: ' + eliminados);
  }

  // Crear nuevo trigger diario
  ScriptApp.newTrigger('backupAutomatico')
    .timeBased()
    .everyDays(1)
    .atHour(BACKUP_HOUR)
    .create();

  Logger.log('✅ Trigger instalado: backupAutomatico se ejecutara cada dia a las ' + BACKUP_HOUR + ':00');
  Logger.log('');
  Logger.log('Verifica el trigger en el menu lateral izquierdo del editor (icono de reloj).');
  Logger.log('Para hacer una prueba inmediata, ejecuta: backupAutomatico');
  Logger.log('Para desinstalar: eliminarTriggerBackup');
}

/**
 * Elimina todos los triggers de backupAutomatico.
 * Usar solo si quieres detener los backups automaticos.
 */
function eliminarTriggerBackup() {
  var triggers = ScriptApp.getProjectTriggers();
  var eliminados = 0;

  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'backupAutomatico') {
      ScriptApp.deleteTrigger(triggers[i]);
      eliminados++;
    }
  }

  Logger.log('✅ Triggers de backup eliminados: ' + eliminados);
  if (eliminados === 0) {
    Logger.log('No habia triggers de backup instalados.');
  }
}

/**
 * Lista todos los backups existentes en la carpeta de Drive.
 * Util para verificar el estado del sistema de backup.
 */
function listarBackups() {
  var carpeta = obtenerCarpetaBackup();
  var archivos = carpeta.getFilesByType(MimeType.GOOGLE_SHEETS);
  var lista = [];

  while (archivos.hasNext()) {
    var archivo = archivos.next();
    if (archivo.getName().indexOf(BACKUP_FILENAME_PREFIX) === 0) {
      lista.push({
        nombre: archivo.getName(),
        fecha: Utilities.formatDate(archivo.getDateCreated(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm'),
        tamano: Math.round(archivo.getSize() / 1024) + ' KB',
        url: archivo.getUrl()
      });
    }
  }

  // Ordenar por fecha descendente (mas reciente primero)
  lista.sort(function(a, b) { return b.fecha.localeCompare(a.fecha); });

  Logger.log('📂 Backups encontrados: ' + lista.length);
  Logger.log('Carpeta: ' + carpeta.getUrl());
  Logger.log('');

  for (var i = 0; i < lista.length; i++) {
    Logger.log((i + 1) + '. ' + lista[i].nombre + ' | ' + lista[i].fecha + ' | ' + lista[i].tamano);
  }

  return lista;
}
