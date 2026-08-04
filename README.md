# Línea Política de Adultos en el Movimiento · ASC

Plataforma de formación online de la **Línea Política de Adultos** de la Asociación Scouts de Colombia. Cinco cursos cortos sobre el marco filosófico, el ciclo del adulto, las 7 competencias esenciales y el plan personal de desarrollo.

🌐 **Producción:** https://maximoaluna-blip.github.io/INDUCCION-ADULTOS/

## Estado actual

**Nivel 1 — Ruta de Fundamentación** completo: 5 cursos, ~3 horas, los 5 con las **3 auditorías pasadas** (doctrinal + pedagógica + funcional) desde el 02-ago-2026.

| # | Curso | courseId | Duración | Estado |
|---|-------|----------|---|--------|
| 1 | 🦸 Bienvenida al Movimiento de Adultos | `bienvenida-adultos` | 45 min | ✅ Activo |
| 2 | 📜 La Política — Marco y Principios | `politica-marco` | 30 min | ✅ Activo |
| 3 | 🔄 El Ciclo del Adulto | `ciclo-adulto` | 30 min | ✅ Activo |
| 4 | 🧠 Las 7 Competencias Esenciales | `competencias-esenciales` | 40 min | ✅ Activo |
| 5 | 🗺️ Tu Plan Personal de Desarrollo | `plan-personal` | 30 min | ✅ Activo |
| — | 🏛️ Política de Adultos (monográfico) | `politica-adultos` | 90 min | 📝 Borrador, sin publicar |

> **La línea se auditó por primera vez en la Fase 2 del ADR-023 (02-ago-2026)**, y no salió limpia: 11 críticos, 15 mayores y 26 menores. Lo más grave estaba en `competencias-esenciales` (4 de las 7 competencias tenían los grados de dominio en el peldaño equivocado, y el autodiagnóstico calificaba contra esos descriptores) y en `plan-personal` (el rol del Asesor Personal se describía al revés de lo que dice la fuente). Todo corregido y desplegado. Detalle en `AUDITORIA.md` y en `CHANGELOG-DOCTRINA.md` del repo raíz.

## Estructura del proyecto

```
INDUCCION-ADULTOS/
├── index.html                          # Landing público (GitHub Pages)
├── 404.html
├── assets/                             # Logos, favicon, dark theme
├── 02-Plataforma-Web/                  # HTMLs públicos
│   ├── cursos.json                     # Catálogo
│   ├── *.html                          # Los cursos compilados (HTML autocontenido)
│   ├── dashboard-admin.html            # → Redirect al PORTAL-ADMIN-ASC
│   └── verificar-certificado.html
└── 05-Generador-Cursos/                # Pipeline de construcción
    ├── build-course.js                 # JSON → HTML
    ├── preview-course.js               # HTML → preview imprimible
    ├── verificar-backend.js            # Validador pre-deploy
    ├── course-schema.json              # Esquema del JSON de curso (lo valida el build)
    ├── templates/
    │   ├── engine.core.js              # Núcleo compartido — COPIA. Se edita en _MOTOR/ del repo raíz
    │   ├── engine.linea.js             # Lo propio de esta línea (config, escalas, overrides)
    │   └── styles.css
    ├── borradores/                     # Fuentes de verdad (JSON)
    └── google-apps-script.js           # Código del backend (referencia)
```

## Documentación operativa

| Documento | Para qué sirve |
|---|---|
| [`INDICE-PROYECTO.md`](INDICE-PROYECTO.md) | Estado completo del proyecto, arquitectura, URLs |
| [`BACKEND.md`](BACKEND.md) | Script ID, deployment URL, cómo actualizar el backend |
| [`CREAR-CURSO.md`](CREAR-CURSO.md) | Manual paso a paso para crear un curso nuevo |
| [`Manual-Crear-Curso.docx`](Manual-Crear-Curso.docx) | Versión Word del manual anterior |
| [`AUDITORIA.md`](AUDITORIA.md) | Proceso de auditoría operativa del código (4 etapas) + historial |
| [`PRUEBAS-E2E/README.md`](PRUEBAS-E2E/README.md) | Suite funcional (Playwright + axe). La primera del proyecto (ADR-012); el patrón se replicó en las otras líneas |
| [`Recomendaciones-Cowork-Diseno-Cursos.md`](Recomendaciones-Cowork-Diseno-Cursos.md) | Guía pedagógica para diseño de cursos en Cowork |
| [`Plan-de-Formacion-Linea-Politica-de-Adultos.docx`](Plan-de-Formacion-Linea-Politica-de-Adultos.docx) | Plan completo de la línea (Tiers 1-4) |

## Pipeline para crear/actualizar un curso

```bash
# 1. Editar el JSON
# 05-Generador-Cursos/borradores/<courseId>.json

# 2. Validar
node 05-Generador-Cursos/verificar-backend.js

# 3. Compilar (valida contra course-schema.json y rechaza sesgos conocidos)
node 05-Generador-Cursos/build-course.js <courseId>

# 4. Preview imprimible
node 05-Generador-Cursos/preview-course.js <courseId>

# 5. Las 3 auditorías — ninguna es opcional (ADR-019)
#    doctrinal   → /auditar-curso <courseId>
#    pedagógica  → /auditar-pedagogia <courseId>
#    funcional   → cd PRUEBAS-E2E && npx playwright test

# 6. Commit + push → GitHub Pages redespliega
```

⚠️ **El curso nace `draft`.** `build-course.js` lo agrega al catálogo con el `status` del JSON (por defecto `draft`) y **respeta el `status` que ya tuviera** en `cursos.json` al recompilar. Publicar es un acto deliberado: poner `active` a mano. Antes del 03-ago-2026 el build lo forzaba a `active`, de modo que compilar un borrador lo publicaba sin querer.

### Antes de anunciar "publicado"

```bash
python ../verificar-consistencia.py
```

Compara el catálogo de la línea contra `lineas.json` del portal, el panel administrativo y el ledger de auditorías. Publicar toca **dos repos** (este y `PORTAL-ADULTOS-ASC`), y hay un tercero (`PORTAL-ADMIN-ASC`) que también lista los cursos.

## Backend

Apps Script + Google Sheets. **Compartido con Desarrollo Institucional y Programa de Jóvenes**: los registros se diferencian por `courseId`.

> Que se diferencien por `courseId` **exige que el motor lo envíe**. Hasta el 03-ago-2026 la acción `register` era la única que no lo hacía: 18 de 20 registros quedaron con la columna Curso vacía y el panel administrativo mostraba 0 adultos en Programa de Jóvenes. Corregido en el núcleo y reparados los datos históricos (ADR-026).

- **PROD_SCRIPT_ID:** `1TTJ2VjN...gCrqe`
- **PROD_DEPLOYMENT_URL:** ver `BACKEND.md`
- **AUTH_TOKEN:** `ADULTOS_ASC_2026`

Detalles completos en [`BACKEND.md`](BACKEND.md).

## Línea hermana y portales

- 🏛️ [`INDUCCION-DESARROLLO-INSTITUCIONAL`](https://github.com/maximoaluna-blip/INDUCCION-DESARROLLO-INSTITUCIONAL) — Desarrollo Institucional (6 activos de 24 planeados)
- 🎒 [`INDUCCION-PROGRAMA-JOVENES`](https://github.com/maximoaluna-blip/INDUCCION-PROGRAMA-JOVENES) — Programa de Jóvenes (8 activos de 25 planeados)
- 🚪 [`PORTAL-ADULTOS-ASC`](https://github.com/maximoaluna-blip/PORTAL-ADULTOS-ASC) — Portal público multi-línea para estudiantes
- 🔐 [`PORTAL-ADMIN-ASC`](https://github.com/maximoaluna-blip/PORTAL-ADMIN-ASC) — Dashboard administrativo unificado
- 📚 `DOCS-MAESTRAS-ASC` (privado) — documentación rectora, el núcleo del motor (`_MOTOR/`) y los scripts de verificación

---

_Actualizado el 03-ago-2026: primera auditoría completa de la línea (ADR-023 Fase 2), motor migrado al núcleo compartido (ADR-025) y corrección del registro sin `courseId` (ADR-026)._

© 2026 Asociación Scouts de Colombia
