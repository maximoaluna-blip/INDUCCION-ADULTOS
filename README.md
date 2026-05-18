# Línea Política de Adultos en el Movimiento · ASC

Plataforma de formación online de la **Línea Política de Adultos** de la Asociación Scouts de Colombia. Cinco cursos cortos sobre el marco filosófico, el ciclo del adulto, las 7 competencias esenciales y el plan personal de desarrollo.

🌐 **Producción:** https://maximoaluna-blip.github.io/INDUCCION-ADULTOS/

## Estado actual

**Nivel 1 — Ruta de Fundamentación** (5 cursos, ~2.5 horas) ya desplegado en piloto.

| # | Curso | courseId | Estado |
|---|-------|----------|--------|
| 1 | 🦸 Bienvenida al Movimiento de Adultos | `bienvenida-adultos` | ✅ Activo |
| 2 | 📜 La Política — Marco y Principios | `politica-marco` | ✅ Activo |
| 3 | 🔄 El Ciclo del Adulto | `ciclo-adulto` | ✅ Activo |
| 4 | 🧠 Las 7 Competencias Esenciales | `competencias-esenciales` | ✅ Activo |
| 5 | 🗺️ Tu Plan Personal de Desarrollo | `plan-personal` | ✅ Activo |

## Estructura del proyecto

```
INDUCCION-ADULTOS/
├── index.html                          # Landing público (GitHub Pages)
├── 404.html
├── assets/                             # Logos, favicon, dark theme
├── 02-Plataforma-Web/                  # HTMLs públicos
│   ├── cursos.json                     # Catálogo
│   ├── *.html                          # Los 5 cursos compilados
│   ├── dashboard-admin.html            # → Redirect al PORTAL-ADMIN-ASC
│   └── verificar-certificado.html
└── 05-Generador-Cursos/                # Pipeline de construcción
    ├── build-course.js                 # JSON → HTML
    ├── preview-course.js               # HTML → preview imprimible
    ├── verificar-backend.js            # Validador pre-deploy
    ├── templates/{engine.js, styles.css}
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
| [`AUDITORIA.md`](AUDITORIA.md) | Proceso de auditoría del código (4 etapas) |
| [`Recomendaciones-Cowork-Diseno-Cursos.md`](Recomendaciones-Cowork-Diseno-Cursos.md) | Guía pedagógica para diseño de cursos en Cowork |
| [`Plan-de-Formacion-Linea-Politica-de-Adultos.docx`](Plan-de-Formacion-Linea-Politica-de-Adultos.docx) | Plan completo de la línea (Tiers 1-4) |

## Pipeline para crear/actualizar un curso

```bash
# 1. Editar el JSON
# 05-Generador-Cursos/borradores/<courseId>.json

# 2. Validar
node 05-Generador-Cursos/verificar-backend.js

# 3. Compilar
node 05-Generador-Cursos/build-course.js <courseId>

# 4. Preview imprimible
node 05-Generador-Cursos/preview-course.js <courseId>

# 5. PDF visual (opcional, Chrome headless)
# 6. Commit + push → GitHub Pages redespliega
```

## Backend

Apps Script + Google Sheets. **Compartido con la Línea Desarrollo Institucional** durante el piloto: los registros se diferencian por `courseId`.

- **PROD_SCRIPT_ID:** `1TTJ2VjN...gCrqe`
- **PROD_DEPLOYMENT_URL:** ver `BACKEND.md`
- **AUTH_TOKEN:** `ADULTOS_ASC_2026`

Detalles completos en [`BACKEND.md`](BACKEND.md).

## Línea hermana y portales

- 🏛️ [`INDUCCION-DESARROLLO-INSTITUCIONAL`](https://github.com/maximoaluna-blip/INDUCCION-DESARROLLO-INSTITUCIONAL) — Línea Desarrollo Institucional (1 curso en piloto, 24 planeados)
- 🚪 [`PORTAL-ADULTOS-ASC`](https://github.com/maximoaluna-blip/PORTAL-ADULTOS-ASC) — Portal público multi-línea para estudiantes
- 🔐 [`PORTAL-ADMIN-ASC`](https://github.com/maximoaluna-blip/PORTAL-ADMIN-ASC) — Dashboard administrativo unificado

---

© 2026 Asociación Scouts de Colombia
