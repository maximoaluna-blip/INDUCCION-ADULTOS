# Proceso de Auditoría, Revisión y Depuración

Este documento describe el proceso que se debe ejecutar cuando el usuario diga la frase trigger:

> **"revisa completo el codigo"**

(o variaciones: "audita el código", "haz limpieza", "optimiza todo")

El objetivo es mantener la plataforma sana después de cada ronda de cambios — encontrar inconsistencias, código muerto, problemas de seguridad o calidad, y aplicar mejoras incrementales sin romper lo que funciona.

---

## Stages del proceso

### Stage 1 — Scan (escaneo)

Recorrer el código aplicando estos checks:

#### A. Limpieza y código muerto
- Archivos no referenciados desde `cursos.json`, `index.html` o cualquier otro código activo.
- Funciones JS no llamadas desde ningún lado (búsqueda con grep).
- `console.log`/`console.warn`/`debugger` que quedaron de debugging.
- Comentarios `TODO`/`FIXME`/`XXX` que apunten a problemas reales (no notas de diseño).
- Strings que referencian la plataforma antigua de Rover (en archivos que NO deberían).

#### B. Seguridad
- Credenciales o tokens hardcodeados en archivos públicos de manera incorrecta.
  - El `AUTH_TOKEN` del Apps Script SÍ va hardcodeado por diseño — verificar que esté solo en `google-apps-script.js` y `engine.js`, no en otros lugares.
- Uso de `innerHTML` con datos de usuario sin sanitizar (XSS).
- URLs expuestas que no deberían ser públicas.
- Datos sensibles guardados en `localStorage` sin necesidad.

#### C. Performance
- Archivos grandes sin razón (HTML > 500 KB, JS > 500 KB).
- Videos sin `preload="none"` o sin lazy loading.
- Imágenes sin compresión adecuada.
- Loops o renders innecesariamente costosos.

#### D. Accesibilidad (a11y)
- Imágenes `<img>` sin atributo `alt`.
- Botones sin etiqueta accesible.
- Inputs sin `<label>`.
- Contraste de colores manifiestamente bajo (spot check).
- Atributos ARIA mal aplicados.

#### E. Consistencia
- Nombres y branding: ¿quedan referencias a "Rover" en archivos donde no debería?
- Token: ¿quedan referencias al token viejo `ROVER_ASC_2025`?
- URL del backend: ¿hay URLs hardcodeadas inconsistentes entre archivos?
- Estilo de código: indentación, comillas, naming, etc.

#### F. Integridad esquema/contrato
- Cada JSON de curso (`borradores/*.json`) cumple `course-schema.json`.
- Todos los tipos de sección usados en los JSONs están soportados por el renderer en `build-course.js`.
- `cursos.json` (catálogo) tiene entries cuyos `file` y `folder` existen en el filesystem.
- Las rutas `src` de los videos en cada curso apuntan a archivos que existen.

#### G. Documentación
- `INDICE-PROYECTO.md` refleja el estado actual del proyecto.
- `INSTRUCCIONES-GOOGLE-APPS-SCRIPT.md` está al día con el código actual.
- `SKILL.md` del generador documenta los tipos de sección actuales.
- Comentarios en código que explican _por qué_ (no qué) están vigentes.

#### H. Build & deploy health
- Los HTML generados están sincronizados con los JSONs fuente.
- Los HTML desplegados en GitHub Pages coinciden con el último build local.
- El `cursos.json` en producción coincide con el local.

---

### Stage 2 — Report (reporte categorizado)

Producir un reporte con hallazgos clasificados por severidad:

| Símbolo | Categoría | Significado | Acción por defecto |
|---|---|---|---|
| 🔴 | **Crítico** | Bug funcional, problema de seguridad real, o algo que rompe la experiencia | Aplicar fix automáticamente, reportar después |
| 🟡 | **Recomendado** | Violación de buenas prácticas, código muerto, inconsistencia, riesgo bajo | Proponer fix, esperar OK del usuario |
| 🟢 | **Opcional** | Mejora cosmética, micro-optimización, sugerencia de refactor | Solo mencionar; no aplicar salvo petición explícita |

Cada hallazgo debe incluir:
- Categoría (🔴 / 🟡 / 🟢)
- Archivo y línea (cuando aplica)
- Descripción breve del problema
- Descripción breve del fix propuesto

---

### Stage 3 — Apply (aplicación)

- 🔴 Críticos: aplicar siempre.
- 🟡 Recomendados: aplicar tras OK del usuario (puede ser global "aplica todos los amarillos" o selectivo).
- 🟢 Opcionales: solo si el usuario pide.

---

### Stage 4 — Verify (verificación)

Después de aplicar fixes:
- Validar JSONs (`python -c "import json; json.load(open(...))"`).
- Rebuild de los cursos afectados.
- Diff con producción (curl HTTP HEAD a las URLs públicas para confirmar que siguen vivas).
- Si hay cambios sustanciales, push a GitHub y esperar redeploy.
- Reportar al usuario qué se aplicó y qué queda pendiente.

---

## Política sobre el código generado

Los archivos en `02-Plataforma-Web/*.html` son **generados** desde `05-Generador-Cursos/borradores/*.json` mediante `build-course.js`. **Nunca editar los HTML directamente** — siempre el JSON fuente y rebuild. La auditoría debe verificar que el HTML generado coincida con la última versión del JSON.

## Política sobre el Apps Script

El backend en `05-Generador-Cursos/google-apps-script.js` se despliega vía `clasp push` a la cuenta de Google del dueño del repo. La auditoría puede modificar este archivo libremente; pushearlo al GAS requiere `clasp push --force` desde `.clasp-workspace/`.

## Política sobre el contenido educativo

La auditoría **no modifica el texto pedagógico** de los cursos sin permiso explícito. Solo arregla:
- Errores ortográficos manifiestos
- Referencias rotas (a cursos / lecciones que no existen)
- HTML mal formado dentro de los strings de texto
- Inconsistencias de numeración entre cursos cruzados

Cualquier sugerencia de re-redacción se reporta como 🟢 (opcional) y no se aplica sin permiso.
