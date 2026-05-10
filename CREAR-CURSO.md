# Manual: Cómo Crear un Curso o Nivel

> Manual operativo de la Plataforma de Formación de Adultos ASC.
> Documenta el proceso completo desde el diseño de un curso hasta su despliegue en producción.

---

## Trigger

Cuando el usuario diga frases como:
- _"vamos a crear el curso N"_
- _"creemos un curso sobre X"_
- _"arranquemos el nivel 2"_
- _"construyamos el módulo de Y"_

…seguir el proceso aquí documentado.

---

## Tabla de contenidos

1. [Estructura de la carpeta `05-Generador-Cursos/`](#1-estructura-de-la-carpeta-05-generador-cursos)
2. [Caso A — Crear UN curso nuevo](#2-caso-a--crear-un-curso-nuevo)
3. [Caso B — Crear un NIVEL completo](#3-caso-b--crear-un-nivel-completo)
4. [Casos especiales](#4-casos-especiales)
5. [Checklist final antes de publicar](#5-checklist-final-antes-de-publicar)
6. [La filosofía de diseño](#6-la-filosofía-de-diseño)
7. [Tabla de referencia rápida](#7-tabla-de-referencia-rápida)

---

## 1. Estructura de la carpeta `05-Generador-Cursos/`

Es el corazón técnico de la plataforma. Cada archivo tiene un rol específico en el flujo de creación de un curso.

```
05-Generador-Cursos/
├── SKILL.md                              ← Instrucciones para el AI generador
├── INSTRUCCIONES-GOOGLE-APPS-SCRIPT.md   ← Guía para configurar el backend
│
├── build-course.js                       ← Constructor JSON → HTML
├── preview-course.js                     ← Generador de preview (mockups)
├── generar-plan-formacion.js             ← Genera el Plan-de-Formacion.docx
├── generar-manual-crear-curso.js         ← Genera Manual-Crear-Curso.docx
├── google-apps-script.js                 ← Código del backend (desplegado)
├── backup-automatico.js                  ← Módulo standalone de backup
├── limpiar-base-datos.js                 ← Utilidad para limpiar el Sheet
├── fix-tildes.py                         ← Utilidad para corregir acentos
│
├── course-schema.json                    ← Esquema de validación
├── course-schema.example.json            ← Ejemplo completo de curso
│
├── templates/
│   ├── styles.css                        ← CSS compartido por todos los cursos
│   └── engine.js                         ← Motor JS (inlined en cada curso)
│
├── borradores/                           ← JSONs fuente de cada curso
│   └── <courseId>.json
│
├── input/        (gitignored)            ← PDFs/MDs fuente para cursos nuevos
└── previews/     (gitignored)            ← HTMLs/PDFs de preview
```

### Roles de cada archivo

| Archivo | Rol |
|---|---|
| `SKILL.md` | Instrucciones para que la IA genere cursos consistentes |
| `course-schema.json` | Define los tipos de sección permitidos y la estructura JSON válida |
| `course-schema.example.json` | Curso completo de referencia (estilo y nivel de detalle) |
| `build-course.js` | Lee un JSON, le inyecta `templates/styles.css` y `templates/engine.js`, produce un HTML autocontenido |
| `preview-course.js` | Genera un HTML con mockups visuales para imprimir como PDF (no es funcional, es solo para revisión) |
| `templates/engine.js` | Motor JavaScript que se inyecta dentro de cada HTML: registro, quizzes, autoguardado, recovery, certificados, etc. |
| `templates/styles.css` | CSS de toda la plataforma. Cambiarlo afecta a todos los cursos. |
| `borradores/*.json` | Fuente de verdad de cada curso |
| `google-apps-script.js` | Backend desplegado en Google Apps Script. Recibe registros, progreso, certificados |
| `backup-automatico.js` | Módulo standalone de respaldo automático del Sheet |
| `INSTRUCCIONES-GOOGLE-APPS-SCRIPT.md` | Manual para configurar el backend desde cero |
| `input/` | Carpeta donde se pone documentación fuente cuando se va a generar un curso desde docs |
| `previews/` | Carpeta donde se generan los HTMLs y PDFs de preview |

---

## 2. Caso A — Crear UN curso nuevo

| # | Paso | Quién | Tiempo | Detalle |
|---|---|---|---|---|
| 1 | **Diseñar** la estructura del curso | Yo (propongo) → Tú (apruebas) | 5–15 min | Definir: # de lecciones, tiempos por lección, hitos pedagógicos, audiencia, fuentes oficiales que aterriza |
| 2 | **Conseguir multimedia** (videos, imágenes) si los necesita | Tú entregas archivos | depende | Copiar a `02-Plataforma-Web/<courseId>/videos/` o `<courseId>/imgs/` |
| 3 | **Escribir el JSON** | Yo | 20–40 min | En `05-Generador-Cursos/borradores/<courseId>.json` siguiendo `course-schema.json` |
| 4 | **Validar JSON** | Yo | 10 seg | `python -c "import json; json.load(open('...json', encoding='utf-8'))"` |
| 5 | **Generar HTML** | Yo | 5 seg | `node 05-Generador-Cursos/build-course.js <courseId>` |
| 6 | **Generar preview PDF** | Yo | 1 min | `node preview-course.js <courseId>` + Chrome headless → PDF |
| 7 | **Entregar PDF** para revisión | — | — | Política registrada: siempre preview antes de publicar |
| 8 | **Aplicar ajustes** según observaciones | Yo | varía | Editar JSON → rebuild → regenerar PDF |
| 9 | **Verificar catálogo** | Yo | 10 seg | `02-Plataforma-Web/cursos.json` se actualiza solo, pero verificar orden |
| 10 | **Commit + push** | Yo | 1 min | Mensaje descriptivo |
| 11 | **Verificar deploy** | Yo (con `Monitor`) | 1–2 min | GitHub Pages redespliega y URL responde HTTP 200 |
| 12 | **Anunciar** a piloto / usuarios | Tú | — | Compartir URL del curso |

**Tiempo total para un curso simple: ~30–60 min de trabajo activo + tu revisión.**

### Diagrama del flujo

```
Diseño  →  JSON  →  build-course.js  →  HTML
                          ↓
                  preview-course.js  →  HTML preview  →  Chrome → PDF
                          ↓
                    Revisión y ajustes
                          ↓
                    git push → GitHub Pages
                          ↓
                  Verificar HTTP 200 en producción
```

---

## 3. Caso B — Crear un NIVEL completo

Mismo proceso que Caso A pero con planificación previa de coherencia entre cursos del nivel.

### Pasos extra al inicio

| # | Paso | Detalle |
|---|---|---|
| **0a** | **Diseñar el nivel completo** primero | # de cursos, agrupación de temas, secuencia, audiencia común |
| **0b** | **Documento de propuesta del nivel** | Generar un PDF (similar al `Plan-de-Formacion.docx`) que liste los X cursos antes de empezar a escribir cada uno |
| **0c** | **Construir UN curso completo primero** | "Vertical slice" — uno completo del nivel sirve de prueba de concepto |
| **0d** | **Validar el primer curso con piloto** | Antes de replicar el patrón, asegurar que la estructura funciona con usuarios reales |

### Pasos extra al final

| # | Paso | Detalle |
|---|---|---|
| **Z1** | **Cross-references entre cursos** | Cada curso del nivel debe mencionar correctamente a los otros (ej. "En el siguiente curso vas a ver…") |
| **Z2** | **Hooks pedagógicos** | Si Curso N produce un dato (perfil, plan, foto) que Curso N+1 lee, garantizar la integración técnica |
| **Z3** | **Actualizar documentación** | `INDICE-PROYECTO.md` y `Plan-de-Formacion-Linea-Politica-de-Adultos.docx` con el nuevo nivel desplegado |
| **Z4** | **Auditoría completa** | Trigger _"revisa completo el codigo"_ después de tener el nivel completo (proceso documentado en `AUDITORIA.md`) |

---

## 4. Casos especiales

### C1 — El curso requiere un tipo de sección NUEVO

Ejemplos del proyecto: `photo-upload` (Curso 1), `self-assessment` (Curso 4), `plan-builder` (Curso 5).

| # | Paso adicional | Archivo a tocar |
|---|---|---|
| C1.1 | Diseñar el tipo: qué inputs acepta, cómo se renderiza, dónde guarda datos | (diseño en papel) |
| C1.2 | Agregarlo al renderer | `build-course.js` (nuevo `case 'tipo'`) |
| C1.3 | Agregarlo al schema | `course-schema.json` (enum de tipos) |
| C1.4 | Agregar render placeholder | `preview-course.js` (versión visible para PDF) |
| C1.5 | Agregar handlers JS | `templates/engine.js` (si es interactivo) |
| C1.6 | Agregar CSS | `templates/styles.css` |
| C1.7 | Documentar | `SKILL.md` (tabla de tipos disponibles) |
| C1.8 | Rebuild masivo | **Rebuild de TODOS los cursos** (porque `engine.js` se inlinea en cada HTML) |

### C2 — El curso requiere un endpoint NUEVO en el backend

Ejemplos: `/stats`, `/recover`, `/verify`, o uno futuro como `/data` para detalle del dashboard.

| # | Paso adicional | Archivo a tocar |
|---|---|---|
| C2.1 | Diseñar el endpoint: qué request, qué response | (diseño en papel) |
| C2.2 | Agregar el case en `doGet` o `doPost` | `google-apps-script.js` |
| C2.3 | Implementar el handler | `google-apps-script.js` |
| C2.4 | Sincronizar al GAS | `cp google-apps-script.js .clasp-workspace/Código.js` + `cd .clasp-workspace && clasp push --force` |
| C2.5 | Probar el endpoint | `curl` o desde el frontend |
| C2.6 | Si es para dashboard u otra UI | Actualizar el frontend para consumirlo |

### C3 — Curso del Nivel 3 (por cargo específico)

Sigue Caso A, pero con elementos adicionales:

| # | Paso adicional | Detalle |
|---|---|---|
| C3.1 | Identificar las **competencias específicas** del cargo | Diccionario de Competencias (PNAM Doc 3) |
| C3.2 | Tomar las **funciones del cargo** | Manual de Cargos (PNAM Doc 4) |
| C3.3 | **Una lección por competencia específica** | Típicamente 2–4 competencias por cargo |
| C3.4 | **Caso real / ejemplo de grupo** | Cómo se vive ese cargo en un consejo concreto |

### C4 — Curso transversal (Nivel 4)

| # | Paso adicional | Detalle |
|---|---|---|
| C4.1 | Verificar material oficial OMMS / WOSM | Safe from Harm sí lo tiene |
| C4.2 | Tomar el documento oficial PNAM correspondiente | Doc 21 para Motivación, Docs 22-23 para SFH |
| C4.3 | Considerar requisitos de certificación adicional | SFH puede tener requisitos del nivel mundial |
| C4.4 | No conectar a otros cursos | Transversales son standalone |

---

## 5. Checklist final antes de publicar

Independiente del caso:

- [ ] JSON valida sintácticamente: `python -c "import json; json.load(...)"`
- [ ] HTML generado más reciente que el JSON fuente (build limpio)
- [ ] Preview PDF aprobado por el dueño del proyecto
- [ ] Si hubo tipo de sección nuevo → renderer + schema + preview + engine + CSS + SKILL.md actualizados
- [ ] Si hubo endpoint nuevo → `clasp push` realizado y verificado
- [ ] Cross-references entre cursos consistentes (Curso N apunta a Curso N+1 correcto)
- [ ] `cursos.json` con orden correcto y status `active`
- [ ] Commit con mensaje descriptivo
- [ ] Push a GitHub
- [ ] GitHub Pages redespliega (verificar HTTP 200 en URL pública)
- [ ] `INDICE-PROYECTO.md` actualizado si cambia el alcance del proyecto
- [ ] `Plan-de-Formacion-Linea-Politica-de-Adultos.docx` actualizado si cambia la roadmap
- [ ] Auditoría (trigger _"revisa completo el codigo"_) si fueron cambios sustanciales

---

## 6. La filosofía de diseño

**Toda la inteligencia está en el JSON del curso.**

Si quieres editar la lección 3 del Curso 1, solo abres `borradores/bienvenida-adultos.json`, encuentras el módulo, cambias el texto, guardas, rebuild, push. **No tocas HTML directamente jamás.**

Los HTMLs en `02-Plataforma-Web/` son **artefactos generados** — si los editas a mano, el próximo rebuild los pisa y pierdes los cambios. El JSON es la fuente de verdad.

### Implicaciones

1. **Cambios pequeños son baratos** — editar un quiz son 30 segundos: editar JSON + 1 build + push.
2. **Cambios visuales globales son baratos** — `templates/styles.css` afecta a todos al rebuild.
3. **El motor de comportamiento es centralizado** — `engine.js` se inlinea en cada curso, así que actualizarlo y rebuild propaga el cambio a todos.
4. **El backend está separado del frontend** — el backend (Apps Script) puede actualizarse sin tocar el frontend, vía `clasp push`.

---

## 7. Tabla de referencia rápida

| Para… | Tocas… |
|---|---|
| Cambiar **contenido** de un curso | Solo el JSON en `borradores/` + rebuild |
| Cambiar **apariencia** de TODOS los cursos | `templates/styles.css` + rebuild de todos |
| Cambiar **comportamiento JS** de TODOS los cursos | `templates/engine.js` + rebuild de todos |
| Agregar un **tipo nuevo de sección** | `build-course.js` + `course-schema.json` + `engine.js` + `styles.css` + `SKILL.md` + `preview-course.js` |
| Cambiar **lógica del backend** | `google-apps-script.js` + `clasp push` |
| Cambiar **catálogo** de cursos | `02-Plataforma-Web/cursos.json` (auto-actualizado al hacer build, pero verificar orden manualmente) |
| Generar **plan de formación** Word | `node generar-plan-formacion.js` |
| Generar **manual de creación de curso** Word | `node generar-manual-crear-curso.js` |
| **Auditoría** completa del código | Trigger _"revisa completo el codigo"_ → ejecutar `AUDITORIA.md` |

---

## Apéndice — Documentos de referencia del proyecto

- [`INDICE-PROYECTO.md`](INDICE-PROYECTO.md) — Estado actual del proyecto, cuentas, URLs, dependencias
- [`AUDITORIA.md`](AUDITORIA.md) — Proceso de auditoría/depuración del código a demanda
- [`Plan-de-Formacion-Linea-Politica-de-Adultos.docx`](Plan-de-Formacion-Linea-Politica-de-Adultos.docx) — Plan completo de los 4 niveles y 17 cursos
- [`05-Generador-Cursos/SKILL.md`](05-Generador-Cursos/SKILL.md) — Manual del generador de cursos para la IA
- [`05-Generador-Cursos/INSTRUCCIONES-GOOGLE-APPS-SCRIPT.md`](05-Generador-Cursos/INSTRUCCIONES-GOOGLE-APPS-SCRIPT.md) — Setup del backend
