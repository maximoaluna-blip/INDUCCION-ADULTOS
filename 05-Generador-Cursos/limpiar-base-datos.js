/**
 * SCRIPT DE LIMPIEZA - Plataforma Educativa Rover ASC
 *
 * Elimina TODOS los datos de prueba de las 6 hojas del Google Sheet,
 * manteniendo los encabezados (fila 1) intactos.
 *
 * INSTRUCCIONES:
 * 1. Abre tu Google Sheet de la plataforma
 * 2. Menu: Extensiones → Apps Script
 * 3. Pega esta funcion al final del archivo Code.gs
 * 4. Ejecuta la funcion "limpiarBaseDeDatos" desde el menu de ejecucion
 * 5. Revisa el log (Ver → Registros de ejecucion) para confirmar
 * 6. ELIMINA esta funcion del codigo cuando termines (no dejarla en produccion)
 */

function limpiarBaseDeDatos() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hojas = ['Registros', 'Progreso', 'Evaluaciones', 'Certificados', 'Compromisos', 'Recordatorios'];
  var totalEliminadas = 0;

  hojas.forEach(function(nombre) {
    var sheet = ss.getSheetByName(nombre);
    if (!sheet) {
      Logger.log('⚠️ Hoja "' + nombre + '" no encontrada, saltando...');
      return;
    }

    var lastRow = sheet.getLastRow();
    if (lastRow <= 1) {
      Logger.log('✅ Hoja "' + nombre + '" ya esta vacia (solo encabezados)');
      return;
    }

    var filasAEliminar = lastRow - 1;
    sheet.deleteRows(2, filasAEliminar);
    totalEliminadas += filasAEliminar;
    Logger.log('🗑️ Hoja "' + nombre + '": ' + filasAEliminar + ' filas eliminadas');
  });

  Logger.log('');
  Logger.log('========================================');
  Logger.log('✅ Limpieza completada: ' + totalEliminadas + ' filas eliminadas en total');
  Logger.log('📋 Encabezados preservados en todas las hojas');
  Logger.log('========================================');
}
