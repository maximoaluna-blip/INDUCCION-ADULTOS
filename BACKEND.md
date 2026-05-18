# Backend — Línea Política de Adultos

> Documento operativo del Apps Script que sirve de backend a esta línea.
> **Lee esto antes de tocar el Apps Script.** Lo que está acá es la fuente de verdad para evitar deployments huérfanos y desincronización entre código local y producción.

---

## Identificadores clave

| Campo | Valor |
|---|---|
| **PROD_SCRIPT_ID** | `1x151jipDy7V2zed9uz9GMIYgmnB8LBhiKdX61Pmj3amWzY83n0Bbji4i` |
| **PROD_DEPLOYMENT_URL** | `https://script.google.com/macros/s/AKfycbzs1IveYZc5i2hrH4P6NYtmMAasmVJ3gpIwRKb4SKEvWT6kFmuOsRcglZzNCkFdaTlE/exec` |
| **AUTH_TOKEN** | `ADULTOS_ASC_2026` |
| **Editor del script** | https://script.google.com/u/0/home/projects/1x151jipDy7V2zed9uz9GMIYgmnB8LBhiKdX61Pmj3amWzY83n0Bbji4i/edit |
| **Sheet asociado** | _(Lo abres desde el menú **Recursos / Proyecto vinculado** del editor del script. Anotar URL aquí cuando lo confirmes.)_ |
| **Cuenta Google que es owner** | _(anotar la cuenta — ej. `maximoaluna@gmail.com`)_ |

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
1. Abre el [editor del script](https://script.google.com/u/0/home/projects/1x151jipDy7V2zed9uz9GMIYgmnB8LBhiKdX61Pmj3amWzY83n0Bbji4i/edit)
2. Click **"Implementar" → "Administrar implementaciones"**
3. Busca el deployment con URL terminando en `KFdAtlE/exec` (el de PROD_DEPLOYMENT_URL arriba)
4. Click en el lápiz ✏️
5. En "Versión": selecciona **"Nueva versión"** → descripción → **Implementar**

**Opción B — Desde clasp (requiere conocer el Deployment ID interno):**
```bash
# El Deployment ID interno NO es la Web App URL. Se obtiene de:
cd .clasp-workspace && clasp deployments
# Busca el que corresponde a producción y guárdalo aquí:
# PROD_DEPLOYMENT_INTERNAL_ID = (anotar cuando se confirme)

clasp deploy -i <PROD_DEPLOYMENT_INTERNAL_ID> -d "descripción del cambio"
```

> ⚠️ **No confundir Web App URL con Deployment ID:**
> - Web App URL: `https://script.google.com/macros/s/{ID_PUBLICO}/exec` — para clientes HTTP.
> - Deployment ID interno: `AKfycb{...otra cadena...}` — para `clasp deploy -i`.
> Aunque ambos empiezan con `AKfycb`, **son distintos**.

### Paso 4 — Verificar
```bash
node 05-Generador-Cursos/verificar-backend.js
```

Debe reportar 4/4 pasos OK. Si el Paso 4 falla diciendo "el deployment es VIEJO", es que el Paso 3 quedó incompleto.

---

## Endpoints expuestos

| Método | Acción | Parámetros | Auth | Propósito |
|---|---|---|---|---|
| GET | `?action=stats` | — | ❌ Público (TODO: agregar token) | Indicadores y arrays detallados para el dashboard |
| GET | `?action=recover&email=...` | email | ❌ | Recuperar progreso de un estudiante |
| GET | `?action=verify&code=...` | código | ❌ | Verificar validez de un certificado |
| POST | `action=register` | token + datos del registro | ✅ AUTH_TOKEN | Crear nuevo registro de inscripción |
| POST | `action=progress` | token + datos del módulo | ✅ AUTH_TOKEN | Guardar completación de módulo |
| POST | `action=quiz` | token + datos del quiz | ✅ AUTH_TOKEN | Guardar resultado de mini-quiz |
| POST | `action=certificate` | token + datos del cert | ✅ AUTH_TOKEN | Emitir certificado |
| POST | `action=commitment` | token + datos del compromiso | ✅ AUTH_TOKEN | Guardar compromiso final |

---

## Hojas del Google Sheet

| Hoja | Columnas |
|---|---|
| `Registros` | Timestamp, Nombre Completo, Edad, Grupo, Region, Email, Motivacion, Curso, UserAgent, URL |
| `Progreso` | Timestamp, Email, Nombre, Curso, Modulo Completado, Nombre Modulo |
| `Evaluaciones` | Timestamp, Email, Nombre, Curso, Modulo, Puntuacion |
| `Certificados` | Timestamp, Email, Nombre, Curso, Grupo, Region, Codigo Certificado, Fecha Completacion, Puntuacion, Tiempo Estudio |
| `Compromisos` | Timestamp, Email, Nombre, Curso, Compromiso |
| `Recordatorios` | Timestamp, Email, Nombre, Curso, Dias Inactivo, Tipo |

---

## Historial de incidentes

| Fecha | Incidente | Lección aprendida |
|---|---|---|
| 2026-05-17 | Dashboard mostraba solo agregados, no detalle. `handleStats()` no devolvía arrays. | Crear `verificar-backend.js` + este documento BACKEND.md. Documentar diferencia entre Web App URL y Deployment ID. |

---

## Convenciones futuras

1. **Antes de cada deploy a producción**, correr `node 05-Generador-Cursos/verificar-backend.js`.
2. **Cada vez que se cambie el deployment de producción** (raro, solo si se renueva permisos o URL), actualizar `PROD_DEPLOYMENT_URL` aquí y en `build-course.js`, luego recompilar todos los cursos de la línea.
3. **No crear deployments duplicados** desde la UI sin documentar. Si se hace, anotar el ID nuevo aquí.
4. **Si se necesita cambiar el AUTH_TOKEN**, actualizar en: este archivo + Apps Script + `build-course.js` + recompilar cursos.

---

_Última actualización: 2026-05-17_
