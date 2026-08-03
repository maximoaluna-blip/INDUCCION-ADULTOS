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
- Inputs y `<select>` sin `<label>` asociado. ⚠️ Un `<label>` **sin `for=`** y que no envuelve al campo **no cuenta**; el `placeholder` **tampoco**. Usar `aria-label`.
- Contraste de colores. **Correr la suite `PRUEBAS-E2E` (axe), no revisar a ojo.**
- Atributos ARIA mal aplicados.

> **Dos trampas al auditar contraste, aprendidas el 03-ago-2026:**
> 1. **axe solo ve lo visible.** Los cursos cargan con todos los módulos en el DOM pero solo `module-0` (registro) activo. Auditar la página tal cual equivale a auditar el formulario de registro: ~10 % de la interfaz. `a11y.spec.js` ya recorre los módulos activándolos uno a uno.
> 2. **Desactivar las animaciones antes de medir.** `.module` trae `animation: fadeIn 0.5s`, que arranca en `opacity: 0`. Auditar sin esperar produce **falsos positivos masivos** de `color-contrast` (178 en la primera corrida). El spec inyecta `animation:none` y espera a que el módulo esté opaco.
>
> **Regla de estilo derivada:** no poner `color:` en estilos **inline** desde `build-course.js`. El tema oscuro no puede sobrescribirlo y el elemento queda ilegible en dark. Los colores van en `styles.css` con su variante `html[data-theme="dark"]`. Así se colaron el `blockquote` (1.65:1) y el pie de video (2.06:1).

#### E. Consistencia
- Nombres y branding: ¿quedan referencias a "Rover" en archivos donde no debería?
- Token: ¿quedan referencias al token viejo `ROVER_ASC_2025`?
- URL del backend: ¿hay URLs hardcodeadas inconsistentes entre archivos?
- Estilo de código: indentación, comillas, naming, etc.
- **Divergencia del motor entre líneas** — `python ../verificar-motor.py`.
  `engine.js`, `build-course.js` y `styles.css` están **copiados** en las 3 líneas y se separan solos: una corrección se aplica en una y se olvida en dos. Ya pasó con el `status` del catálogo (arreglado en DI, roto en PA y PJ durante semanas). **Correr siempre después de tocar el motor.**

#### E-bis. Escritura de datos del estudiante
- Toda escritura en `localStorage` pasa por `guardarLocal()`, que avisa si falla.
  **No usar `localStorage.setItem` directo ni envolverlo en `catch {}` vacío:** si la cuota se llena o el navegador bloquea el almacenamiento, el estudiante pierde su trabajo sin enterarse. `saveProgress()` llegó a mostrar el visto de "guardado" sin comprobar que la escritura hubiera funcionado.
- Si un curso produce datos que otro consume (perfil de autodiagnóstico, plan), la escala debe estar **versionada** (`COMPETENCY_SCALE_VERSION`): al cambiar los criterios, los datos viejos se invalidan con aviso en vez de arrastrarse.

#### F. Integridad esquema/contrato
- Cada JSON de curso (`borradores/*.json`) cumple `course-schema.json` — ⚙️ ya lo verifica `build-course.js` antes de compilar; si no cumple, no genera nada.
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

---

## Herramientas de apoyo

| Comando | Qué revisa |
|---|---|
| `cd PRUEBAS-E2E && npx playwright test` | Flujo del alumno, enlaces, responsive, y **accesibilidad de todos los módulos** |
| `python ../verificar-motor.py` | Divergencia de `engine.js`/`build-course.js`/`styles.css` entre líneas |
| `python ../verificar-consistencia.py` | Catálogo ↔ portal ↔ panel admin ↔ `ESTADO-AUDITORIA.md` |
| `node 05-Generador-Cursos/build-course.js <curso>` | Esquema del JSON, reglas de quiz y sesgo de longitud |

_Última revisión del proceso: 03-ago-2026 (auditoría de código completa; ver `DECISIONES.md` ADR-025)._
