# Backend — Línea Política de Adultos

> Documento operativo del Apps Script que sirve de backend a esta línea.
> **Lee esto antes de tocar el Apps Script.** Lo que está acá es la fuente de verdad para evitar deployments huérfanos y desincronización entre código local y producción.

---

## Identificadores clave

| Campo | Valor |
|---|---|
| **PROD_SCRIPT_ID** | `1TTJ2VjNta0Vz4p6gAjwvsXggN8g8YfV-FrZuQtWvnUy0ZFRrYA-gCrqe` |
| **PROD_DEPLOYMENT_URL** | `https://script.google.com/macros/s/AKfycbxxZBp6XpmdRzZS0BXO02WMq31K5FUU8-Mqzc2Sj0PcwB3cMcrhIqbHQA0naUQb5mgBWw/exec` |
| **AUTH_TOKEN** | `ADULTOS_ASC_2026` |
| **Editor del script** | https://script.google.com/u/0/home/projects/1TTJ2VjNta0Vz4p6gAjwvsXggN8g8YfV-FrZuQtWvnUy0ZFRrYA-gCrqe/edit |
| **Sheet asociado** | El contenedor del script `1TTJ2VjN…`, renombrado el 20-jun-2026 a **`Datos Plataforma Adultos ASC - PROD`** (antes tenía el nombre confuso `adultos-backup-2026-05-17`). Es el Sheet VIVO de prod. **Sheet ID:** `1pbp63sqHayUM1MbpvH4smATeeSsaRIX6MOX0f2rMfIo`. |
| **Cuenta Google que es owner** | `maximoaluna@gmail.com` |
| **Despliegue activo** | **`@10`** — "ADR-079: la tasa de completacion cuenta inscripciones" (21-sep-2026). ⚠️ **Este número envejece solo**: esta fila dijo `Versión 6` durante tres meses con producción en `@8`, `@9` y `@10`. **La fuente de verdad es `clasp list-deployments`**, y el Paso 6 de `verificar-backend.js` lo comprueba contra el endpoint vivo. |

---

## Líneas que comparten este backend

Durante el piloto, ambas líneas usan el mismo Apps Script y el mismo Google Sheet. Los registros se diferencian por la columna **`courseId`** (ej. `bienvenida-adultos` vs `bienvenida-desarrollo-institucional`).

- 📜 **Línea Política de Adultos** — 5 cursos activos
- 🏛️ **Línea Desarrollo Institucional** — 1 curso activo (piloto)

Si en el futuro quieres separarlos, hay que: crear nuevo Apps Script + nuevo Sheet + actualizar URL en build-course.js de la línea correspondiente + recompilar todos los cursos de esa línea.

---

## Cómo actualizar el backend (flujo correcto)

### Paso 1 — Editar el código local
Edita `05-Generador-Cursos/google-apps-script.js` con los cambios deseados.

### Paso 2 — Subir el código al script (clasp push)
```bash
# Copiar al workspace clasp
cp 05-Generador-Cursos/google-apps-script.js .clasp-workspace/Código.js

# Push al script
cd .clasp-workspace && clasp push -f
```

Esto actualiza el **HEAD** del script (la "Última versión"). Los deployments existentes NO se actualizan automáticamente.

### Paso 3 — Actualizar el deployment de producción

**Opción A — Desde la UI web (más confiable):**
1. Abre el [editor del script](https://script.google.com/u/0/home/projects/1TTJ2VjNta0Vz4p6gAjwvsXggN8g8YfV-FrZuQtWvnUy0ZFRrYA-gCrqe/edit)
2. Click **"Implementar" → "Administrar implementaciones"**
3. Busca el deployment con URL terminando en `KFdAtlE/exec` (el de PROD_DEPLOYMENT_URL arriba)
4. Click en el lápiz ✏️
5. En "Versión": selecciona **"Nueva versión"** → descripción → **Implementar**

**Opción B — Desde clasp:**
```bash
cd .clasp-workspace && npx clasp list-deployments
```

Salida real (verificada el 23-ago-2026) — hay **3 deployments**:

| Deployment ID | Versión | Qué es |
|---|---|---|
| `AKfycbxDK0Ty_IzrZ4QoJ3LAS70hcCtPhac_cnPxTh6_M2rO` | `@HEAD` | Sirve el código actual del editor. **Exige autenticación del dueño**, así que no sirve para los cursos |
| `AKfycbz8QNiUMo7CzBb2iM3D-Hy7ER6kNMdKOpJpub4mZ4lNm4WhzP9f-DmJF-P8KByu-rGQow` | `@1` | Pruebas |
| `AKfycbxxZBp6XpmdRzZS0BXO02WMq31K5FUU8-Mqzc2Sj0PcwB3cMcrhIqbHQA0naUQb5mgBWw` | **`@10`** | **PRODUCCIÓN** — es el ID que va en `PROD_DEPLOYMENT_URL` |

```bash
npx clasp push                       # sube el código, pero NO cambia lo que sirve producción
npx clasp create-deployment -i AKfycbxxZBp6XpmdRzZS0BXO02WMq31K5FUU8-Mqzc2Sj0PcwB3cMcrhIqbHQA0naUQb5mgBWw -d "descripción del cambio"
```

> 🚨 **Producción está fijada a una versión concreta (hoy `@10`, promovida el 21-sep-2026), no a `@HEAD`.** Un `clasp push` (o editar en el navegador y guardar) **no llega a los estudiantes**: hay que crear una versión nueva y reapuntar ese deployment. Es la causa más probable de "arreglé el backend y sigue fallando igual".
>
> **No te fíes del número que dice esta tabla** — se desactualiza sola. La fuente de verdad es `clasp list-deployments`, y `verificar-backend.js` (Paso 5) comprueba contra el endpoint vivo si el código desplegado conoce ADR-030.

> ⚠️ **Web App URL vs. Deployment ID.** Son conceptos distintos, pero **para el deployment de producción de este proyecto la cadena es la misma**: el `AKfycbxxZBp6...` de la URL es literalmente el ID que espera `clasp deploy -i`. (El de `@HEAD` sí es otra cadena, más corta.) No salir a buscar un identificador distinto.

### Paso 4 — Verificar
```bash
node 05-Generador-Cursos/verificar-backend.js
```

Debe reportar **6/6 pasos OK**. Si el Paso 4 falla diciendo "el deployment es VIEJO", es que el Paso 3 quedó incompleto. Los **Pasos 5 y 6 preguntan al endpoint vivo** si el código desplegado conoce el ADR-030 y el ADR-079: son los únicos que distinguen "lo subí" de "lo promoví".

---

## Endpoints expuestos

| Método | Acción | Parámetros | Auth | Propósito |
|---|---|---|---|---|
| GET | `?action=stats` | — | ❌ Público, **y ya no identifica a nadie** (ADR-078) | **Solo agregados**: conteos, medias, completaciones por módulo, abandono y análisis de ítems. `registros[]` y `certificados[]` vuelven **vacíos**, con `detalleIncluido: false` para que un cero no se lea como «no hay nadie». ⚠️ **`resumen.tasaCompletacion` se mide por INSCRIPCIONES** (ADR-079): `inscripcionesCompletadas / inscripciones`, emparejando persona+curso, y viaja con las dos cifras de las que sale más `certificadosSinInscripcion`. **No** es `certificados / registros`: esa división cruzaba cursos y publicaba **105 %** |
| POST | `action=stats` | token + `adminKey` | ✅ AUTH_TOKEN **+ `ADMIN_KEY`** | Lo anterior **más** `registros[]` y `certificados[]`. ⚠️ **La clave no es `AUTH_TOKEN`**: ese viaja en el HTML publicado de los 32 cursos y por eso no protege nada. `ADMIN_KEY` vive en las **propiedades del script** — no en este repo, no en el HTML del panel — y si no está configurada el detalle **no se sirve**. **Ni así viaja el correo** |
| GET | `?action=recover&email=...` | email | ❌ **y no puede estarlo**: el token va en el HTML publicado | **Solo avance** (ADR-074): registro básico sin motivación, módulos, puntajes y certificados, más `saved` con **qué** hay guardado (ids y conteos). **Nunca** reflexiones, compromisos, planes, catálogo ni grados. ⚠️ **Y desde el ADR-080 dice si hay inscripción para el curso que se le pregunta** (`registeredInCourse`; `null` si no se preguntó): el motor crea el alta **por POST** cuando falta. **Este GET sigue sin escribir nada**, y `probar-recover.js` cuenta las filas antes y después para que siga siendo verdad |
| GET | `?action=verify&code=...` | código | ❌ | Verificar validez de un certificado. **No devuelve el correo** del titular (ADR-074) |
| POST | `action=register` | token + datos del registro | ✅ AUTH_TOKEN | Crear nuevo registro de inscripción |
| POST | `action=progress` | token + datos del módulo | ✅ AUTH_TOKEN | Guardar completación de módulo |
| POST | `action=quiz` | token + datos del quiz | ✅ AUTH_TOKEN | Guardar resultado de mini-quiz |
| POST | `action=certificate` | token + datos del cert | ✅ AUTH_TOKEN | Emitir certificado |
| POST | `action=commitment` | token + datos del compromiso | ✅ AUTH_TOKEN | Guardar compromiso final. ⚠️ **Existe pero no lo llama nadie**: `saveCommitment()` del motor escribe solo en `localStorage` (el compromiso es local por diseño, ADR-040). La hoja está vacía desde siempre |

---

## Hojas del Google Sheet

| Hoja | Columnas |
|---|---|
| `Registros` | Timestamp, Nombre Completo, Edad, Grupo, Region, Email, Motivacion, Curso, UserAgent, URL |
| `Progreso` | Timestamp, Email, Nombre, Curso, Modulo Completado, Nombre Modulo |
| `Evaluaciones` | Timestamp, Email, Nombre, Curso, Modulo, Puntuacion |
| `Certificados` | Timestamp, Email, Nombre, Curso, Grupo, Region, Codigo Certificado, Fecha Completacion, Puntuacion, Tiempo Estudio |
| `Compromisos` | Timestamp, Email, Nombre, Curso, Compromiso — ⚠️ **vacía**: ningún curso envía `action=commitment` |
| `Recordatorios` | Timestamp, Email, Nombre, Curso, Dias Inactivo, Tipo |

---

## Historial de incidentes

| Fecha | Incidente | Lección aprendida |
|---|---|---|
| 2026-05-17 | Dashboard mostraba solo agregados, no detalle. `handleStats()` no devolvía arrays. | Crear `verificar-backend.js` + este documento BACKEND.md. Documentar diferencia entre Web App URL y Deployment ID. |
| 2026-05-17 (cont.) | El Script ID que se creía como producción era de otro proyecto de pruebas. El clasp local apuntaba al script equivocado. | Verificar el script de producción es el que está vinculado al Google Sheet vivo (Extensiones → Apps Script desde el sheet). El Script ID real es `1TTJ2VjN...gCrqe`, no `1x151jip...`. Reconfigurado `.clasp.json` y aplicado el parche de `handleStats()` al script correcto. |
| 2026-06-20 | El script de prod `1TTJ2VjN…` **y su Sheet contenedor estaban en la papelera de Drive**. La web app seguía sirviendo, pero Drive purga la papelera a los 30 días → habría tumbado el backend y borrado los datos. Causa probable: borrado accidental (el frontend nunca cambió de URL). Además, prod tenía una validación `edad >= 18` en `handleRegister` que **no estaba en el repo** (drift por edición directa). | **Restaurado** desde la papelera (Apps Script → "Recuperar de la papelera"; al ser script vinculado, restaura también el Sheet contenedor). Redeploy **Versión 6** con el fix de código de certificado (el backend ahora honra el `certificateCode` del frontend). Repo `google-apps-script.js` **sincronizado con prod** (se incorporó la validación edad>=18). Pendiente: anotar arriba el ID/URL del Sheet vivo. |
| 2026-09-21 | **Hallazgo C4** de la auditoría de plataforma. `handleStats()` publicaba `totalCommitments`, contado sobre la hoja `Compromisos`, que está vacía desde siempre: `saveCommitment()` del motor escribe solo en `localStorage` y ningún curso envía `action=commitment`. Con 20 usuarios y 21 certificados, la métrica valía **0**. **Retirada del payload** en los dos backends (plataforma y Rover) en vez de conectarla: sincronizar el compromiso significaría guardar en una hoja lo que cada adulto se compromete a hacer, que es lo contrario de lo que decidió el ADR-074 el mismo día. `handleCommitment()` y la hoja se conservan por si el dueño decide lo otro. | **Una métrica que nadie alimenta no es un cero: es una afirmación falsa.** El panel no la pintaba, así que nadie la echó en falta — y por eso llevaba meses publicándose. |
| 2026-09-21 | **ADR-074.** `recover` devolvía, con solo un correo y sin autenticación, todo lo que la persona había escrito; `verify` devolvía su correo. Reescritos los dos: `recover` entrega **avance** y señales de existencia, `verify` ya no da el correo. Probado en local con un Sheets simulado (18 comprobaciones) y **probado disparando** contra la versión anterior. ⚠️ **Falta el despliegue**: el fuente está en `.clasp-workspace/`, pero producción sigue fijada a `@8` y promoverla es del dueño. |
| 2026-09-21 (cierre) | **ADR-078.** `?action=stats` entregaba `registros[]` con **nombre, correo, grupo, región y curso de todas** las personas inscritas **sin pedir nada**, y la URL del despliegue viaja en el HTML de los 32 cursos. ⚠️ **El remedio que este documento proponía desde hacía meses —«validar `params.token === AUTH_TOKEN`»— no habría cerrado nada**, porque ese token está impreso en cada curso publicado. | GET público → **solo agregados**; detalle por **POST** con `adminKey` de las propiedades del script, **falla cerrada** si no está configurada, y **sin correo ni con clave**. Nace `probar-stats.js` (22 comprobaciones sin red, probada disparando) y el **Paso 4 de `verificar-backend.js` pasa a exigir lo contrario de lo que exigía**. Promovido a **`@9`** el mismo día, junto con el ADR-074, y medido en vivo. |
| 2026-09-21 (cierre) | **ADR-079.** El panel publicaba una **«Tasa de Completación» del 105 %**: `handleStats()` la calculaba como `totalCertificates / totalUsers`, y esa división **cruza cursos** — quien termina tres suma tres al numerador y uno al denominador. ⚠️ **Y al medirlo no era solo eso: 7 de los 21 certificados no tienen fila de inscripción**, así que sumar `courseStats` habría dado el mismo 105 %. | Ahora cuenta **inscripciones con certificado sobre inscripciones** (par persona+curso), con el **mismo cruce** que ya marcaba «Completado» en el panel: **no puede pasar del 100 %**. Se publican `inscripciones`, `inscripcionesCompletadas` y `certificadosSinInscripcion` — los huérfanos se dicen en vez de esconderse en el numerador. `probar-stats.js` pasa de 22 a **28 comprobaciones** (5 fallan contra el código anterior) y nace el **Paso 6** de `verificar-backend.js`. ✅ **Promovido a `@10` el mismo día y medido en vivo:** la tasa real es **70 %** — **14 de 20** inscripciones con certificado y **7 certificados sin inscripción**, que el Paso 6 avisa. Los 6 pasos en verde. ⚠️ Y al medirlo hubo que arreglar el propio verificador: su `fetchUrl` daba **15 s** y el payload de `stats` agrega seis hojas, así que el Paso 4 salió en **rojo tres veces con un backend sano**. Subido a **45 s con un reintento** — *un rojo que significa «tardó» se lee igual que uno que significa «está roto»*. |
| 2026-08-23 | **Este documento decía `@6` cuando producción llevaba en `@8` desde el 03-ago.** La memoria del proyecto repetía el mismo dato viejo, así que una consulta de estado concluyó "el deploy de ADR-030 sigue pendiente" cuando llevaba tres semanas hecho. `verificar-backend.js` daba 4/4 verde: sus pasos comprueban coherencia entre archivos, no contra el código realmente desplegado. | **El número de versión escrito en un `.md` no es fuente de verdad.** Añadido el **Paso 5** a `verificar-backend.js`: pregunta al endpoint vivo si el payload de `stats` trae la clave `items` (solo existe desde ADR-030). Un doc desactualizado ya no puede afirmar que producción está al día. |

---

## Convenciones futuras

1. **Antes de cada deploy a producción**, correr `node 05-Generador-Cursos/verificar-backend.js`.
2. **Cada vez que se cambie el deployment de producción** (raro, solo si se renueva permisos o URL), actualizar `PROD_DEPLOYMENT_URL` aquí y en `build-course.js`, luego recompilar todos los cursos de la línea.
3. **No crear deployments duplicados** desde la UI sin documentar. Si se hace, anotar el ID nuevo aquí.
4. **Si se necesita cambiar el AUTH_TOKEN**, actualizar en: este archivo + Apps Script + `build-course.js` + recompilar cursos.

---

_Última actualización: 2026-09-21 (ADR-079, producción en `@10`)._
