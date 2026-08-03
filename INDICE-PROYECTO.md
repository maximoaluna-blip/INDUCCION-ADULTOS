# INDUCCION-ADULTOS — Plataforma de Formación de Adultos en el Movimiento

## Asociación Scouts de Colombia

**Proyecto:** Formación digital gratuita para adultos voluntarios del movimiento scout (consejeros, dirigentes, miembros del consejo de grupo, asesores) en Colombia.

**URL Producción:** https://maximoaluna-blip.github.io/INDUCCION-ADULTOS/
**Repositorio:** https://github.com/maximoaluna-blip/INDUCCION-ADULTOS

**Línea hermana:** [INDUCCION-DESARROLLO-INSTITUCIONAL](https://github.com/maximoaluna-blip/INDUCCION-DESARROLLO-INSTITUCIONAL) — Línea Desarrollo Institucional (PNDI 2017).
**Portal madre:** [PORTAL-ADULTOS-ASC](https://maximoaluna-blip.github.io/PORTAL-ADULTOS-ASC/) — landing pública de las 4 líneas.
**Panel administrativo:** [PORTAL-ADMIN-ASC](https://maximoaluna-blip.github.io/PORTAL-ADMIN-ASC/) — dashboard unificado.

---

## Arquitectura

```
Usuario  →  GitHub Pages (HTML estático)  →  Google Apps Script  →  Google Sheets
                                          ←─  JSON responses    ←─
```

- **Frontend:** HTML5 + CSS3 + JavaScript vanilla (sin frameworks).
- **Hosting:** GitHub Pages, branch `main`, deploy automático.
- **Backend datos:** Google Sheets vía Google Apps Script (web app desplegada).
- **Generación de cursos:** Node.js (`build-course.js`) — JSON → HTML.
- **Despliegue del backend:** `clasp` (Google Apps Script CLI) — push automatizado del código del Apps Script.
- **Certificados PDF:** html2pdf.js + html2canvas + jsPDF (cliente).
- **Tema oscuro:** CSS variables + localStorage (`rover-theme`, compartido con Rover).
- **Backup nocturno:** trigger Apps Script copia el Sheet a Drive cada noche a las 2:00 AM (carpeta `Backups_Plataforma_Adultos_ASC`, retención 30 días).

---

## Estructura de carpetas

```
INDUCCION-ADULTOS/
├── index.html                    ← Landing principal (catálogo de cursos)
├── 404.html                      ← Página de error
├── dashboard-admin.html          ← Panel administrativo (KPIs)
├── verificar-certificado.html    ← Verificador público de certificados
├── AUDITORIA.md                  ← Proceso de auditoría/depuración del código
├── INDICE-PROYECTO.md            ← Este archivo
│
├── assets/
│   ├── logo-asc.png
│   ├── logo-vallescout.png
│   ├── favicon.svg
│   ├── dark-theme.css
│   └── theme-toggle.js
│
├── 02-Plataforma-Web/
│   ├── cursos.json               ← Catálogo de cursos
│   ├── bienvenida-adultos.html   ← Curso 1 (generado, 7 lecciones)
│   ├── bienvenida-adultos/videos/   (4 videos)
│   ├── politica-marco.html       ← Curso 2 (generado)
│   ├── politica-marco/videos/       (3 videos)
│   ├── ciclo-adulto.html         ← Curso 3 (generado, sin videos)
│   ├── competencias-esenciales.html ← Curso 4 (generado, sin videos)
│   └── plan-personal.html        ← Curso 5 (generado, sin videos)
│
├── 05-Generador-Cursos/
│   ├── SKILL.md                       ← Instrucciones del skill /generate-course-adultos
│   ├── build-course.js                ← Constructor JSON → HTML (con tipos: video, policy-quote, photo-upload, self-assessment, plan-builder)
│   ├── preview-course.js              ← Genera HTML de preview (placeholders) para revisión PDF
│   ├── course-schema.json             ← Esquema de validación de cursos
│   ├── course-schema.example.json     ← Ejemplo completo
│   ├── google-apps-script.js          ← Backend desplegado al GAS via clasp
│   ├── backup-automatico.js           ← Módulo standalone de backup (referencia)
│   ├── INSTRUCCIONES-GOOGLE-APPS-SCRIPT.md  ← Setup del backend
│   ├── templates/
│   │   ├── styles.css                 ← CSS compartido por todos los cursos
│   │   └── engine.js                  ← Motor JS (registro, quizzes, photo upload, self-assessment, plan-builder, prefill, recovery, certificado PDF)
│   └── borradores/                    ← JSONs fuente de cursos
│       ├── bienvenida-adultos.json
│       ├── politica-marco.json
│       ├── ciclo-adulto.json
│       ├── competencias-esenciales.json
│       ├── plan-personal.json
│       └── politica-adultos.json      ← v1 monolítica archivada (el JSON sí se versiona; su HTML y videos están gitignored, por eso no se publica)
│
├── .github/workflows/
│   └── pruebas-e2e.yml               ← GitHub Actions: corre la suite en cada push/PR a main
├── PRUEBAS-E2E/                      ← Suite Playwright + axe (smoke, a11y, enlaces, responsive, E2E del alumno) + integración Fase 1b
│
└── .clasp-workspace/                  ← (gitignored) workspace para clasp push del Apps Script
```

---

## Ruta de fundamentación — 5 cursos

| # | Curso | courseId | Duración | Lecciones | Hitos pedagógicos |
|---|---|---|---|---|---|
| 1 | 🦸 Bienvenida al Movimiento de Adultos | `bienvenida-adultos` | 45 min | 7 | Hook Avengers, mitos, dibujo del consejero ideal, voces de la comunidad, primer compromiso |
| 2 | 📜 La Política — Marco y Principios | `politica-marco` | 30 min | 6 | 13 principios, 12 herramientas, definición Spencer-Spencer de competencia |
| 3 | 🔄 El Ciclo del Adulto | `ciclo-adulto` | 30 min | 6 | Atracción y vinculación, desempeño, decisiones para el futuro |
| 4 | 🧠 Las 7 Competencias Esenciales | `competencias-esenciales` | 40 min | 6 | Autodiagnóstico interactivo (4 grados por competencia) + perfil cross-course versionado |
| 5 | 🗺️ Tu Plan Personal de Desarrollo | `plan-personal` | 30 min | 6 | Plan-builder interactivo + PDF imprimible + cierre de la ruta |

**Curso archivado:** `politica-adultos` (v1 monolítica de 90 min, reemplazada por la ruta).

---

## Features de plataforma activas

- ✅ Lecciones cortas (5-8 min; la de "Voces de la comunidad" llega a 12 por su video) con auto-guardado en `localStorage` **verificado** — si la escritura falla, se avisa al estudiante en vez de perder su trabajo en silencio.
- ✅ **Pre-llenado del registro** entre cursos (clave global `globalUserProfile`).
- ✅ **Recuperación de avance** vía email (botón "Recuperar mi Avance" → consulta al Apps Script).
- ✅ **Subida de foto** (Curso 1, dibujo del consejero ideal) — comprime a 1200px JPEG, guarda en localStorage.
- ✅ **Autodiagnóstico de competencias** (Curso 4) — guarda perfil en clave global `competencyProfile` para que el Curso 5 lo lea, **versionado con `COMPETENCY_SCALE_VERSION`**: si cambian los criterios de los grados, los perfiles viejos se invalidan con aviso en vez de arrastrarse.
- ✅ **Plan-builder interactivo** (Curso 5) — produce PDF imprimible.
- ✅ **5 certificados acumulables** + verificación pública por código `ASC-AAAA-XXXXX`.
- ✅ **Citas oficiales plegables** (`policy-quote`) en cada lección con redacción literal de la política.
- ✅ **Lazy loading de videos** — solo el módulo activo carga sus videos.
- ✅ **Modo oscuro** (clave `rover-theme` compartida con plataforma Rover).
- ✅ **Backup nocturno** del Sheet a las 2 AM, retención 30 días.
- ✅ **Dashboard admin** con KPIs agregados.

---

## Tipos de sección soportados (renderer)

`paragraph`, `heading`, `info-box`, `mission-box`, `list`, `timeline`, `method-grid`, `blockquote`, `course-objectives`, `video`, `policy-quote`, `photo-upload`, `self-assessment`, `plan-builder`.

Documentación detallada de cada uno en `05-Generador-Cursos/SKILL.md`.

---

## Workflow de cambios

### Cambio de contenido (texto, quiz, lección)

1. Editar `05-Generador-Cursos/borradores/<courseId>.json`.
2. `node 05-Generador-Cursos/build-course.js <courseId>` → regenera el HTML.
3. (Opcional) `node 05-Generador-Cursos/preview-course.js <courseId>` → genera preview HTML para revisión PDF.
4. `git add` + `commit` + `push` → GitHub Pages redespliega automáticamente.

### Cambio de motor o template

> ⚠️ **El motor está copiado en las 3 líneas** (`engine.js` PA↔PJ es 97 % idéntico). Un arreglo aplicado aquí **no viaja solo** a Desarrollo Institucional ni a Programa de Jóvenes — ya pasó con el `status` del catálogo, que quedó arreglado en DI y roto aquí durante semanas. Ver `DECISIONES.md` ADR-025.

1. Editar `05-Generador-Cursos/build-course.js` o `05-Generador-Cursos/templates/{styles.css,engine.js}`.
2. **Aplicar el mismo cambio en las otras dos líneas** si es del núcleo común (no si es de un componente propio).
3. Rebuild de **todos** los cursos (el `engine.js` se inlinea en cada HTML):
   ```bash
   for c in bienvenida-adultos politica-marco ciclo-adulto competencias-esenciales plan-personal; do
     node 05-Generador-Cursos/build-course.js $c
   done
   ```
4. **Verificar que no quedó divergencia:**
   ```bash
   python ../verificar-motor.py
   ```
5. Correr `cd PRUEBAS-E2E && npx playwright test` y push.

> **Regla de estilo:** no poner `color:` en estilos **inline** desde `build-course.js`. El tema oscuro no puede sobrescribirlo y el elemento queda ilegible en modo oscuro (así se colaron el `blockquote` a 1.65:1 y el pie de video a 2.06:1). Los colores van en `styles.css` con su variante `html[data-theme="dark"]`.

### Cambio de backend (Apps Script)

**Importante:** el backend es compartido con la Línea Desarrollo Institucional. Cualquier cambio afecta a ambas líneas.

1. **Antes:** `node 05-Generador-Cursos/verificar-backend.js` → debe estar 4/4 OK.
2. Editar `05-Generador-Cursos/google-apps-script.js`.
3. Copiar el archivo a `.clasp-workspace/Código.js`.
4. `cd .clasp-workspace && clasp push --force` → actualiza el HEAD del script.
5. **Para que el deployment público use el código nuevo**, hay dos opciones:
   - **Opción A (sin cambiar URLs):** Si el deployment activo se puede editar desde la UI web, abrirlo, seleccionar "Nueva versión" y desplegar.
   - **Opción B (URL nueva):** Crear deployment nuevo desde la UI ("Implementar → Implementación nueva" con permisos "Cualquier usuario"), copiar la nueva URL, actualizar `BACKEND.md` + `build-course.js` + recompilar HTMLs de ambas líneas. (Es el flujo que se usó la última vez por deployments zombie.)
6. **Después:** `node 05-Generador-Cursos/verificar-backend.js` → 4/4 OK.

Detalles operativos en [`BACKEND.md`](BACKEND.md).

### Pruebas automatizadas y CI

La suite `PRUEBAS-E2E/` (Playwright + `@axe-core/playwright`) valida el portal:
- **Fase 0/1a** (sin backend): smoke, enlaces, accesibilidad WCAG AA (claro+oscuro), responsive (móvil+escritorio), persistencia y el **flujo E2E del alumno** (registro → quiz ≥70% → certificado) con el backend **interceptado** (no escribe en Sheets).
- **Fase 1b** (integración real): `register→recover` y `certificate→verify` contra un Apps Script de pruebas; se activa con `TEST_SCRIPT_URL` y se auto-omite sin ella. Setup en `PRUEBAS-E2E/SETUP-FASE-1B.md`.

Correr local: `cd PRUEBAS-E2E && npm test`. En **GitHub Actions** corre sola en cada push/PR a `main` (`.github/workflows/pruebas-e2e.yml`). Ver `DECISIONES.md` ADR-012.

---

## Cuentas y credenciales

- **GitHub:** `maximoaluna-blip` — autenticado vía `gh` CLI.
- **Google (Apps Script + Sheets + Drive):** `maximoaluna@gmail.com` — autenticado vía `clasp`.
- **Token de auth backend:** `ADULTOS_ASC_2026` (compartido durante el piloto con la Línea Desarrollo Institucional, validado server-side).
- **PROD_DEPLOYMENT_URL:** `https://script.google.com/macros/s/AKfycbxxZBp6XpmdRzZS0BXO02WMq31K5FUU8-Mqzc2Sj0PcwB3cMcrhIqbHQA0naUQb5mgBWw/exec`
- **PROD_SCRIPT_ID:** `1TTJ2VjNta0Vz4p6gAjwvsXggN8g8YfV-FrZuQtWvnUy0ZFRrYA-gCrqe`
- **PROD_SHEET_ID (datos vivos):** `1pbp63sqHayUM1MbpvH4smATeeSsaRIX6MOX0f2rMfIo` — "Datos Plataforma Adultos ASC - PROD" (renombrado el 20-jun-2026; ese día el backend se **restauró de la papelera** de Drive — ver `BACKEND.md`).

> Para detalles completos del backend (cómo actualizar, cómo crear deployments, etc.) ver [`BACKEND.md`](BACKEND.md).
> Para validar la sincronización del backend antes de cualquier deploy: `node 05-Generador-Cursos/verificar-backend.js`.

---

## Estado actual (03-ago-2026)

**Nivel 1 completo, en producción y con las 3 auditorías pasadas.** Los 5 cursos están `active` y verificados en vivo.

| Auditoría | Estado | Detalle |
|---|---|---|
| **Doctrinal** (`/auditar-curso`) | ✅ 02-ago-2026 | Los 3 cursos que nunca se habían auditado dieron **11 críticos, 15 mayores, 26 menores**. Todos corregidos con fuente oficial. Ver `ESTADO-AUDITORIA.md` del repo raíz |
| **Pedagógica** (`/auditar-pedagogia`) | ✅ 02-ago-2026 | Primera de la línea. ~30 quizzes reescritos de memoria a escenario; el Curso 1 pasó de 6 a 7 lecciones al partir una que declaraba 5 min y tenía 23 reales |
| **Funcional** (`PRUEBAS-E2E`) | ✅ en CI | 43 tests. Desde el 03-ago la auditoría de accesibilidad recorre **todos los módulos**, no solo el registro |

> **El piloto humano dejó de ser bloqueante** (ADR-019): las 3 auditorías son la compuerta. Sigue siendo recomendable para validar recepción real — plantilla en `INFORME-PILOTO.md`.

## Pendientes / próximas etapas

### Fase siguiente
- **Tier 2 — Cursos de profundización por fase del ciclo:**
  - Curso 6 — Vinculación de nuevos adultos al grupo.
  - Curso 7 — Cómo ser asesor personal.
  - Curso 8 — Acompañamiento y Evaluación 360° práctica.
  - Curso 9 — Talento 360° práctico.
  - Curso 10 — Cierre y reinicio de ciclo (decisiones para el futuro).
- **Endpoint adicional en el Apps Script** (`?action=data`) que devuelva los rows completos para que el dashboard muestre tabla de detalle, filtros y exportación a CSV.

### Fase futura
- **Tier 3 — Cursos por cargo específico** (Tesorero, Secretario, Asesor Personal, etc., apoyados en el Manual de Cargos y las 29 competencias específicas).
- **Tier 4 — Cursos transversales** (Safe from Harm, Diversidad e Inclusión, Gestión para la Motivación).
- Polishes de los videos del Curso 1: subtítulos quemados, intros/outros, audio limpio.

---

## Contenido de origen

Los videos del Curso 1 (Bienvenida) y los testimonios incrustados se construyeron a partir del **Taller Flor de Lis 2 — Sesión 1**, dictado por dirigentes de la Regional Valle del Cauca el 30 de abril de 2026. Los segmentos originales están en `../flor de lis 2/segmentos/` (fuera del repo, respaldo local).

Las definiciones doctrinales (principios, competencias, ciclo) provienen de los documentos oficiales de la Política Nacional de Adultos en el Movimiento (PNAM 2017, Acuerdo CSN 176; la carpeta local se llama "PNAM 2022" por el año de compilación, no de la política), conservados en `../DOCUMENTOS BASE/Información para CRAM/Documentos Oficiales PNAM 2022/`.

---

## Auditoría del código

Cuando el dueño del proyecto diga _"revisa completo el código"_ se ejecutan las 4 etapas documentadas en [`AUDITORIA.md`](AUDITORIA.md): scan → report → apply → verify.

**Última ejecución completa: 03-ago-2026** (`DECISIONES.md` ADR-025). Resultado: limpio en 6 de los 8 checks (0 funciones muertas, sin XSS, sin código huérfano, producción sincronizada). Dos hallazgos de fondo: el **motor triplicado** que ya divergió, y la **auditoría de accesibilidad que solo cubría el módulo de registro** — al ampliarla aparecieron 5 bugs de contraste reales, ya corregidos.

### Herramientas de verificación

| Comando | Qué revisa |
|---|---|
| `node 05-Generador-Cursos/build-course.js <curso>` | Esquema del JSON, reglas de quiz, sesgo de longitud |
| `cd PRUEBAS-E2E && npx playwright test` | Flujo del alumno, enlaces, responsive y accesibilidad de **todos** los módulos |
| `python ../verificar-motor.py` | Divergencia del motor entre las 3 líneas |
| `python ../verificar-consistencia.py` | Catálogo ↔ portal ↔ panel admin ↔ ledger de auditorías |
| `node 05-Generador-Cursos/verificar-backend.js` | Sincronización con el Apps Script |

---

## Cómo trabaja Claude Code sobre este proyecto

Todos los cambios se aplican **end-to-end automáticamente** (edit → validate → build → preview → verify → commit → push → verify deploy). El usuario no tiene que pedir cada paso del pipeline.

Inventario completo de scripts (`build-course.js`, `preview-course.js`, `verificar-backend.js`, etc.), triggers que activan procesos automáticos, y patrón de "self-applying changes" documentado en [`FLUJOS-AUTONOMOS-Y-SCRIPTS.md`](https://github.com/maximoaluna-blip/PORTAL-ADULTOS-ASC/blob/main/FLUJOS-AUTONOMOS-Y-SCRIPTS.md) (vive en PORTAL-ADULTOS-ASC porque aplica al ecosistema completo).

---

_Revisado el 03-ago-2026 contra el estado real (auditoría de código, `DECISIONES.md` ADR-025). Correcciones: Curso 1 a **45 min y 7 lecciones** y Curso 4 a **40 min** (las duraciones no contaban el video); sección de estado con las 3 auditorías en vez de "lista para piloto", derogado por ADR-019; el workflow de motor advierte que el cambio **no viaja solo** a las otras líneas y suma `verificar-motor.py`; añadida la tabla de herramientas de verificación; cita de la PNAM unificada como 2017._
