# INDUCCION-ADULTOS — Plataforma de Formación de Adultos en el Movimiento

## Asociación Scouts de Colombia

**Proyecto:** Formación digital gratuita para adultos voluntarios del movimiento scout (consejeros, dirigentes, miembros del consejo de grupo, asesores) en Colombia.

**URL Producción:** https://maximoaluna-blip.github.io/INDUCCION-ADULTOS/
**Repositorio:** https://github.com/maximoaluna-blip/INDUCCION-ADULTOS

**Plataforma hermana:** [INDUCCION-ROVER](../INDUCCION-ROVER/) — formación para rovers 18-22 años.

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
│   ├── bienvenida-adultos.html   ← Curso 1 (generado)
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
│       └── politica-adultos.json      ← v1 archivada (gitignored, sólo respaldo local)
│
└── .clasp-workspace/                  ← (gitignored) workspace para clasp push del Apps Script
```

---

## Ruta de fundamentación — 5 cursos

| # | Curso | courseId | Duración | Lecciones | Hitos pedagógicos |
|---|---|---|---|---|---|
| 1 | 🦸 Bienvenida al Movimiento de Adultos | `bienvenida-adultos` | 25 min | 6 | Hook Avengers, mitos, dibujo del consejero ideal, primer compromiso |
| 2 | 📜 La Política — Marco y Principios | `politica-marco` | 30 min | 6 | 13 principios, 12 herramientas, definición Spencer-Spencer de competencia |
| 3 | 🔄 El Ciclo del Adulto | `ciclo-adulto` | 30 min | 6 | Atracción y vinculación, desempeño, decisiones para el futuro |
| 4 | 🧠 Las 7 Competencias Esenciales | `competencias-esenciales` | 35 min | 6 | Autodiagnóstico interactivo (sliders 1-4) + perfil cross-course |
| 5 | 🗺️ Tu Plan Personal de Desarrollo | `plan-personal` | 30 min | 6 | Plan-builder interactivo + PDF imprimible + cierre de la ruta |

**Curso archivado:** `politica-adultos` (v1 monolítica de 90 min, reemplazada por la ruta).

---

## Features de plataforma activas

- ✅ Lecciones cortas (3-8 min cada una) con auto-guardado en `localStorage`.
- ✅ **Pre-llenado del registro** entre cursos (clave global `globalUserProfile`).
- ✅ **Recuperación de avance** vía email (botón "Recuperar mi Avance" → consulta al Apps Script).
- ✅ **Subida de foto** (Curso 1, dibujo del consejero ideal) — comprime a 1200px JPEG, guarda en localStorage.
- ✅ **Autodiagnóstico de competencias** (Curso 4) — guarda perfil en clave global `competencyProfile` para que el Curso 5 lo lea.
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

1. Editar `05-Generador-Cursos/build-course.js` o `05-Generador-Cursos/templates/{styles.css,engine.js}`.
2. Rebuild de **todos** los cursos (porque el engine.js se inlinea en cada HTML):
   ```bash
   for c in bienvenida-adultos politica-marco ciclo-adulto competencias-esenciales plan-personal; do
     node 05-Generador-Cursos/build-course.js $c
   done
   ```
3. Push.

### Cambio de backend (Apps Script)

1. Editar `05-Generador-Cursos/google-apps-script.js`.
2. Copiar el archivo a `.clasp-workspace/Código.js`.
3. `cd .clasp-workspace && clasp push --force` → actualiza el Apps Script en producción (URL del web app no cambia).

---

## Cuentas y credenciales

- **GitHub:** `maximoaluna-blip` — autenticado vía `gh` CLI.
- **Google (Apps Script + Sheets + Drive):** `maximoaluna@gmail.com` — autenticado vía `clasp`.
- **Token de auth backend:** `ADULTOS_ASC_2026` (hardcodeado en `google-apps-script.js` y `engine.js`, validado server-side).
- **URL del web app:** `https://script.google.com/macros/s/AKfycbzs1IveYZc5i2hrH4P6NYtmMAasmVJ3gpIwRKb4SKEvWT6kFmuOsRcglZzNCkFdaTlE/exec`
- **Script ID:** `1x151jipDy7V2zed9uz9GMIYgmnB8LBhiKdX61Pmj3amWzY83n0Bbji4i`

---

## Pendientes / próximas etapas

### Fase actual (lista para piloto)
- Compartir URL pública con 5-10 adultos voluntarios.
- Recoger retroalimentación durante 1-2 semanas.
- Aplicar ajustes de contenido según observaciones.

### Fase siguiente (post-piloto)
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

Las definiciones doctrinales (principios, competencias, ciclo) provienen de los documentos oficiales de la Política Nacional de Adultos en el Movimiento (PNAM 2022 v. Acuerdo CSN 176 de 2017), conservados en `../DOCUMENTOS BASE/Información para CRAM/Documentos Oficiales PNAM 2022/`.

---

## Auditoría del código

Cuando el dueño del proyecto diga _"revisa completo el código"_ se ejecutan las 4 etapas documentadas en [`AUDITORIA.md`](AUDITORIA.md): scan → report → apply → verify.
