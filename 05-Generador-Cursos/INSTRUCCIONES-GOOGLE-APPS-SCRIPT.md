# Instrucciones: Backend con Google Apps Script

## Plataforma Educativa Rover ASC - Asociacion Scouts de Colombia

Este documento explica paso a paso como configurar el backend en Google Apps Script
para que los cursos HTML (alojados en GitHub Pages) puedan guardar datos en Google Sheets.

---

## Requisitos previos

- Una cuenta de Google (Gmail)
- Acceso a Google Sheets y Google Apps Script
- Los archivos HTML de los cursos ya generados con `build-course.js`

---

## Paso 1: Crear la hoja de calculo en Google Sheets

1. Ve a [Google Sheets](https://sheets.google.com) e inicia sesion.
2. Crea una nueva hoja de calculo en blanco.
3. Renombrala como: **"Plataforma Educativa Rover ASC - Base de Datos"** (o el nombre que prefieras).
4. Copia la URL de la hoja; la necesitaras mas adelante.
5. **No necesitas crear las pestanias manualmente.** El script las creara automaticamente la primera vez que se ejecute.

> Las hojas que se crearan automaticamente son:
> - `Registros` - Datos de inscripcion de estudiantes
> - `Progreso` - Modulos completados
> - `Evaluaciones` - Resultados de quizzes
> - `Certificados` - Certificados emitidos con codigos unicos
> - `Compromisos` - Compromisos finales de los estudiantes

---

## Paso 2: Abrir Google Apps Script

1. Ve a [script.google.com](https://script.google.com).
2. Haz clic en **"Nuevo proyecto"** (boton azul en la esquina superior izquierda).
3. Se abrira el editor con un archivo `Codigo.gs` vacio.

---

## Paso 3: Pegar el codigo

1. Selecciona todo el contenido del archivo `Codigo.gs` en el editor (Ctrl+A).
2. Eliminalo (tecla Suprimir o Backspace).
3. Abre el archivo `google-apps-script.js` de esta carpeta con cualquier editor de texto.
4. Copia todo el contenido (Ctrl+A, luego Ctrl+C).
5. Pegalo en el editor de Apps Script (Ctrl+V).
6. Renombra el proyecto haciendo clic en "Proyecto sin titulo" en la parte superior.
   Sugerencia: **"Backend Plataforma Rover ASC"**.
7. Guarda con Ctrl+S.

---

## Paso 4: Conectar el script con Google Sheets

El script necesita saber cual hoja de calculo usar. Hay dos formas:

### Opcion A: Abrir el script DESDE la hoja de calculo (recomendado)

1. Ve a tu hoja de calculo creada en el Paso 1.
2. Menu: **Extensiones > Apps Script**.
3. Se abrira el editor de Apps Script ya vinculado a esa hoja.
4. Elimina el contenido predeterminado y pega el codigo del archivo `google-apps-script.js`.
5. Guarda (Ctrl+S).

> Esta opcion vincula automaticamente el script con la hoja de calculo.
> `SpreadsheetApp.getActiveSpreadsheet()` funcionara sin configuracion adicional.

### Opcion B: Si creaste el script directamente en script.google.com

Si ya creaste el proyecto en script.google.com (Paso 2), necesitas vincularlo manualmente:

1. En el editor de Apps Script, busca la linea:
   ```javascript
   var ss = SpreadsheetApp.getActiveSpreadsheet();
   ```
2. Reemplazala por:
   ```javascript
   var ss = SpreadsheetApp.openById('TU_ID_DE_HOJA_AQUI');
   ```
3. Para obtener el ID de tu hoja, toma la URL de Google Sheets:
   ```
   https://docs.google.com/spreadsheets/d/ESTE_ES_EL_ID/edit
   ```
   El ID es la cadena larga entre `/d/` y `/edit`.

---

## Paso 5: Probar el script (opcional pero recomendado)

1. En el editor de Apps Script, selecciona la funcion `inicializarHojas` en el menu desplegable
   de funciones (junto al boton de ejecutar).
2. Haz clic en **Ejecutar** (icono de play).
3. La primera vez te pedira permisos:
   - Haz clic en **"Revisar permisos"**.
   - Selecciona tu cuenta de Google.
   - Aparecera una advertencia: "Esta app no esta verificada". Haz clic en **"Avanzada"** y luego en **"Ir a Backend Plataforma Rover ASC (no seguro)"**.
   - Haz clic en **"Permitir"**.
4. Verifica en el **registro de ejecucion** (Ver > Registros) que aparezcan mensajes de exito.
5. Ve a tu hoja de calculo y verifica que se crearon las 5 pestanias con sus encabezados.

---

## Paso 6: Desplegar como aplicacion web

1. En el editor de Apps Script, ve a **Implementar > Nueva implementacion**.
2. Haz clic en el icono de engranaje y selecciona **"Aplicacion web"**.
3. Configura:
   - **Descripcion:** "Backend Plataforma Educativa Rover ASC v1.0" (o la version que corresponda).
   - **Ejecutar como:** "Yo" (tu cuenta de correo).
   - **Quien tiene acceso:** "Cualquier persona".
4. Haz clic en **"Implementar"**.
5. Copia la **URL de la aplicacion web**. Se vera asi:
   ```
   https://script.google.com/macros/s/XXXXXXXXXXXXXX/exec
   ```
6. **Guarda esta URL.** La necesitaras en el siguiente paso.

> **IMPORTANTE:** Cada vez que modifiques el codigo, necesitas crear una **nueva implementacion**
> o actualizar la existente:
> - **Implementar > Administrar implementaciones > Editar (icono de lapiz) > Version: Nueva version > Implementar**

---

## Paso 7: Actualizar la URL en los cursos HTML

### Opcion A: En el JSON del curso (antes de generar el HTML)

1. Abre el archivo JSON del curso en `05-Generador-Cursos/borradores/`.
2. Agrega o actualiza el campo `googleScriptUrl`:
   ```json
   {
     "courseId": "fundamentos-scout",
     "title": "Fundamentos del Movimiento Scout",
     "googleScriptUrl": "https://script.google.com/macros/s/TU_URL_AQUI/exec",
     ...
   }
   ```
3. Regenera el HTML:
   ```bash
   node 05-Generador-Cursos/build-course.js fundamentos-scout
   ```

### Opcion B: Directamente en el HTML generado

1. Abre el archivo HTML del curso en `02-Plataforma-Web/`.
2. Busca la variable `COURSE_CONFIG` (cerca del inicio del bloque `<script>`).
3. Actualiza `googleScriptUrl`:
   ```javascript
   var COURSE_CONFIG = {
     googleScriptUrl: 'https://script.google.com/macros/s/TU_URL_AQUI/exec',
     ...
   };
   ```
4. Guarda el archivo.

---

## Paso 8: Actualizar el frontend para leer respuestas (opcional)

El motor actual (`engine.js`) envia datos con `mode: 'no-cors'` (solo envia, no lee respuestas).
Para aprovechar la generacion de certificados del lado del servidor y la verificacion de datos,
puedes actualizar la funcion `sendToGoogleSheets` en `templates/engine.js`:

```javascript
// ANTES (fire-and-forget):
fetch(COURSE_CONFIG.googleScriptUrl, {
    method: 'POST', mode: 'no-cors',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
});

// DESPUES (con lectura de respuesta):
fetch(COURSE_CONFIG.googleScriptUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify(payload)
}).then(function(response) {
    return response.json();
}).then(function(result) {
    if (result.success) {
        console.log('Datos sincronizados:', result.data);
        // Si es certificado, usar el codigo del servidor
        if (result.data && result.data.certificateCode) {
            var el = document.getElementById('certCode');
            if (el) el.textContent = result.data.certificateCode;
        }
    } else {
        console.warn('Error del servidor:', result.error);
    }
}).catch(function(err) {
    console.log('Datos guardados localmente');
});
```

> **Nota:** Al usar Google Apps Script como Web App desplegado con "Cualquier persona" tiene acceso,
> Google maneja automaticamente el CORS a traves de redirecciones. Usar `Content-Type: text/plain`
> evita la solicitud preflight OPTIONS y permite leer la respuesta.

---

## Paso 9: Agregar el token de autenticacion al frontend

El backend requiere un campo `token` en cada solicitud POST. Actualiza la funcion
`sendToGoogleSheets` para incluirlo:

```javascript
var payload = Object.assign({}, data, {
    timestamp: new Date().toISOString(),
    url: window.location.href,
    token: 'ROVER_ASC_2025'  // Token de autenticacion
});
```

> **Nota de seguridad:** Este token es una proteccion basica contra bots y solicitudes externas.
> No es seguridad de nivel empresarial (el token es visible en el codigo fuente del navegador).
> Para una plataforma educativa interna es suficiente.

---

## Uso de las funciones GET (verificacion y recuperacion)

El backend tambien soporta solicitudes GET para consultar datos:

### Recuperar progreso de un estudiante

```
GET https://script.google.com/macros/s/TU_URL/exec?action=recover&email=estudiante@correo.com
```

Retorna: datos de registro, modulos completados, evaluaciones, certificados y compromisos.

### Verificar un certificado

```
GET https://script.google.com/macros/s/TU_URL/exec?action=verify&code=ASC-2025-AB1CD
```

Retorna: validez del codigo, nombre del estudiante, curso y fecha.

### Estadisticas generales (panel administrativo)

```
GET https://script.google.com/macros/s/TU_URL/exec?action=stats
```

Retorna: total de usuarios, certificados, evaluaciones, promedios y completaciones por modulo.

---

## Estructura de la base de datos

| Hoja | Contenido | Columnas |
|------|-----------|----------|
| `Registros` | Inscripciones | Timestamp, Nombre, Edad, Grupo, Region, Email, Motivacion, Curso, UserAgent, URL |
| `Progreso` | Modulos completados | Timestamp, Email, Nombre, Curso, Modulo Completado, Nombre Modulo |
| `Evaluaciones` | Resultados de quizzes | Timestamp, Email, Nombre, Curso, Modulo, Puntuacion |
| `Certificados` | Certificados emitidos | Timestamp, Email, Nombre, Curso, Grupo, Region, Codigo, Fecha, Puntuacion, Tiempo |
| `Compromisos` | Compromisos finales | Timestamp, Email, Nombre, Curso, Compromiso |

---

## Solucion de problemas comunes

### "No tengo permisos" al ejecutar
- Ve a Implementar > Administrar implementaciones y verifica que el acceso sea "Cualquier persona".
- Si cambiaste el codigo, crea una nueva version de la implementacion.

### Los datos no llegan a la hoja
- Verifica que la URL en el HTML sea correcta y termine en `/exec`.
- Revisa la consola del navegador (F12) para ver errores de red.
- Verifica que el token `ROVER_ASC_2025` este incluido en las solicitudes.

### Error "SpreadsheetApp.getActiveSpreadsheet() is null"
- Esto ocurre si creaste el script desde script.google.com en lugar de desde la hoja.
- Usa `SpreadsheetApp.openById('ID')` como se explica en el Paso 4, Opcion B.

### El correo de bienvenida no se envia
- Google tiene limites de envio: 100 correos/dia para cuentas gratuitas.
- Verifica que no estes en el limite revisando los registros (Ver > Registros en Apps Script).
- El registro del estudiante se guarda aunque falle el correo.

### "Demasiadas solicitudes"
- El backend tiene un limite de 30 solicitudes por email por minuto.
- Esto protege contra abusos. Espera un minuto e intenta de nuevo.

---

## Cambiar el token de autenticacion

Si necesitas cambiar el token (por ejemplo, por seguridad):

1. En el script de Apps Script, cambia la variable:
   ```javascript
   var AUTH_TOKEN = 'TU_NUEVO_TOKEN_AQUI';
   ```
2. Crea una nueva version de la implementacion.
3. Actualiza el token en todos los archivos HTML de cursos o en `templates/engine.js`.
4. Regenera los cursos con `build-course.js`.

---

## Backup automatico del Google Sheet

El sistema incluye un modulo de backup automatico que crea una copia diaria del Google Sheet en tu Google Drive. Es **critico** activarlo: si el sheet se borra accidentalmente, los datos de los Rovers se perderian.

### Que hace
- Cada noche a las **2:00 AM** copia el sheet completo a una carpeta `Backups_Plataforma_Rover_ASC` en tu Drive.
- Nombra cada copia con la fecha: `rover-backup-2026-04-25`.
- Conserva los **ultimos 30 backups** y elimina automaticamente los mas antiguos.
- Si falla, te envia un correo de alerta a la cuenta propietaria del script.

### Instalacion (una sola vez)

1. Abre el editor de Apps Script (Extensiones > Apps Script desde tu Sheet).
2. Verifica que el codigo de `google-apps-script.js` ya incluye al final el bloque `BACKUP AUTOMATICO`. Si actualizaste solo desde el repo, copia el contenido completo del archivo nuevamente.
3. En el menu desplegable de funciones (parte superior del editor), selecciona **`instalarTriggerBackup`**.
4. Pulsa **Ejecutar**.
5. Acepta los permisos solicitados:
   - Acceso a tu Google Drive (para crear la carpeta y copias).
   - Acceso a Gmail (para notificaciones de error).
   - Acceso al Spreadsheet.
6. Revisa el log (`Ver > Registros de ejecucion`). Debe decir:
   `✅ Trigger instalado: backupAutomatico se ejecutara cada dia a las 2:00`
7. Verifica el trigger: en el panel izquierdo del editor, click en el icono de reloj. Debes ver `backupAutomatico` programado diariamente.

### Hacer un backup manual ahora mismo

1. En el editor, selecciona la funcion **`backupAutomatico`** y pulsa **Ejecutar**.
2. Revisa el log: vera el URL del backup recien creado.
3. Abre tu Drive y busca la carpeta `Backups_Plataforma_Rover_ASC` para confirmar.

### Listar backups existentes

Ejecuta la funcion **`listarBackups`** desde el editor. El log mostrara todos los backups con fecha, tamano y URL.

### Restaurar desde un backup

Si necesitas restaurar (caso de borrado accidental):
1. Abre la carpeta `Backups_Plataforma_Rover_ASC` en Drive.
2. Click derecho sobre el backup deseado > **Hacer una copia** o **Mover** al lugar del sheet original.
3. Asegurate de que el sheet restaurado tenga el mismo `Id` o actualiza la implementacion del Web App si cambio.

### Desinstalar

Ejecuta la funcion **`eliminarTriggerBackup`** una sola vez. Detendra todos los backups automaticos. Las copias ya creadas se mantienen en Drive.

### Configuracion

En la parte superior del bloque de backup en `google-apps-script.js` puedes ajustar:

| Variable | Valor por defecto | Descripcion |
|----------|-------------------|-------------|
| `BACKUP_FOLDER_NAME` | `Backups_Plataforma_Rover_ASC` | Nombre de la carpeta en Drive |
| `BACKUP_RETENTION_DAYS` | `30` | Cuantos dias conservar backups |
| `BACKUP_HOUR` | `2` | Hora del dia en que se ejecuta (0-23) |
| `BACKUP_FILENAME_PREFIX` | `rover-backup-` | Prefijo del nombre de cada copia |

---

## Resumen de archivos

| Archivo | Ubicacion | Funcion |
|---------|-----------|---------|
| `google-apps-script.js` | `05-Generador-Cursos/` | Codigo backend para Google Apps Script (incluye backup) |
| `backup-automatico.js` | `05-Generador-Cursos/` | Modulo standalone de backup (referencia) |
| `INSTRUCCIONES-GOOGLE-APPS-SCRIPT.md` | `05-Generador-Cursos/` | Este documento de instrucciones |
| `build-course.js` | `05-Generador-Cursos/` | Generador de HTML para cursos |
| `templates/engine.js` | `05-Generador-Cursos/templates/` | Motor JavaScript del frontend |
