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
