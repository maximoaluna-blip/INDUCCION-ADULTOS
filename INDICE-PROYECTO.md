# INDUCCION-ADULTOS — Plataforma Educativa de Formacion de Adultos

## Asociacion Scouts de Colombia

**Proyecto:** Formacion digital gratuita para adultos voluntarios del movimiento scout (consejeros, dirigentes, miembros del consejo de grupo) en Colombia.

**Estado:** Plataforma local — pendiente de deploy a GitHub Pages y conexion a backend Google Apps Script.

**Plataforma hermana (no afectada):** [INDUCCION-ROVER](../INDUCCION-ROVER/) — formacion para rovers 18-22 anos.

---

## Arquitectura

Identica a la plataforma Rover (clonada como base):

```
Usuario -> GitHub Pages (HTML estatico) -> Google Apps Script -> Google Sheets
                                        <- JSON responses    <-
```

- **Frontend:** HTML5 + CSS3 + JavaScript vanilla (sin frameworks)
- **Hosting:** GitHub Pages (cuando se cree el repo `INDUCCION-ADULTOS`)
- **Backend datos:** Google Sheets independiente del de Rover (a crear)
- **Generacion de cursos:** Node.js (`05-Generador-Cursos/build-course.js`) desde JSON a HTML
- **Certificados PDF:** html2pdf.js + html2canvas + jsPDF (client-side)

---

## Estructura

```
INDUCCION-ADULTOS/
├── index.html                          <- Landing principal (catalogo de cursos)
├── 404.html                            <- Pagina de error
├── dashboard-admin.html                <- Panel administrativo
├── verificar-certificado.html          <- Verificador publico de certificados
│
├── assets/
│   ├── logo-asc.png
│   ├── favicon.svg
│   ├── dark-theme.css
│   └── theme-toggle.js
│
├── 02-Plataforma-Web/
│   ├── cursos.json                     <- Catalogo de cursos (solo politica-adultos por ahora)
│   ├── politica-adultos.html           <- Curso generado
│   └── politica-adultos/
│       └── videos/                     <- 15 videos del curso (185 MB)
│
└── 05-Generador-Cursos/
    ├── SKILL.md                        <- Instrucciones del skill /generate-course
    ├── build-course.js                 <- Constructor JSON -> HTML (con soporte tipo `video`)
    ├── preview-course.js               <- Generador de preview pre-publicacion
    ├── course-schema.json              <- Esquema de cursos
    ├── course-schema.example.json
    ├── google-apps-script.js           <- Codigo del backend (para Google Apps Script)
    ├── backup-automatico.js
    ├── INSTRUCCIONES-GOOGLE-APPS-SCRIPT.md
    ├── templates/
    │   ├── styles.css                  <- CSS compartido para cursos generados
    │   └── engine.js                   <- Motor JS (con lazy-load de videos)
    └── borradores/
        └── politica-adultos.json       <- JSON fuente del curso
```

---

## Cursos

| # | Curso | ID | Modulos | Duracion | Estado |
|---|-------|----|---------|----------|--------|
| 1 | La Politica de Adultos en el Movimiento | `politica-adultos` | 6 (intro + 5 contenido) | ~1.5 horas | Activo (local) |

---

## Como generar/regenerar un curso

```bash
node 05-Generador-Cursos/build-course.js politica-adultos
```

El HTML resultante queda en `02-Plataforma-Web/politica-adultos.html` y el catalogo `02-Plataforma-Web/cursos.json` se actualiza automaticamente.

---

## Pendientes para puesta en produccion

1. **Crear repositorio GitHub** `INDUCCION-ADULTOS` y hacer push (lo hace el dueno del proyecto).
2. **Activar GitHub Pages** sobre la rama `main`.
3. **Crear Google Sheet** independiente para registros de adultos.
4. **Crear Google Apps Script** con el codigo en `05-Generador-Cursos/google-apps-script.js` (instrucciones en `INSTRUCCIONES-GOOGLE-APPS-SCRIPT.md`).
5. **Pegar URL del Apps Script** en `05-Generador-Cursos/templates/engine.js` (constante `GOOGLE_SCRIPT_URL`) y regenerar el curso.
6. **(Opcional)** Conectar dominio propio o subdominio.

---

## Polishes pendientes del curso politica-adultos

1. Subtitulos quemados en los 15 videos (.srt -> ffmpeg).
2. Intros/outros con marca ASC en cada video.
3. Limpieza de audio (reduccion de ruido del Zoom).
4. Unidad 0 (Bienvenida) como video corto con TTS y diapositivas.
5. Fichas PDF descargables por unidad.

---

## Origen del contenido

El curso se construyo a partir del **Taller Flor de Lis 2 - Sesion 1** dictado por dirigentes de la Regional Valle del Cauca el 30 de abril de 2026. Los videos originales estan en `../flor de lis 2/segmentos/`.

Las copias usadas por la plataforma estan en `02-Plataforma-Web/politica-adultos/videos/` (15 archivos, 185 MB).
