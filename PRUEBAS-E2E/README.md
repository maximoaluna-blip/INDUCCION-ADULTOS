# PRUEBAS-E2E — Pruebas automatizadas del portal de formación ASC

> ⚠️ **Sin `ASC_BASE_URL`, esta suite corre contra PRODUCCIÓN** (la URL pública de GitHub Pages), no contra el HTML que acabas de compilar. Un «todo en verde» en local sin esa variable valida lo publicado, no tu cambio. Para probar el repo local haz lo que hace el CI: `python -m http.server 8099` en la raíz del repo y `ASC_BASE_URL=http://127.0.0.1:8099/02-Plataforma-Web/ npx playwright test`. (Aprendido el 14-sep-2026, ADR-034 Fase 1.)


Suite de [Playwright](https://playwright.dev) que verifica el portal de formación de forma
repetible. Sustituye verificación manual del `CHECKLIST-CALIDAD-CURSO.md` por chequeos
automáticos. **No reemplaza el piloto humano** (Parte L del checklist): prueba que la
máquina funciona, no la pedagogía.

## Estado: Fase 0 + Fase 1a (sin backend real)

Corre contra el sitio **público** (GitHub Pages). **No escribe nada** en el backend de
Apps Script: en Fase 1a las llamadas se interceptan con `page.route()` (`tests/_backend.js`).

### Suite AGNÓSTICA DE LÍNEA

La parte estática (Fase 0) sirve para **cualquier línea**: el `globalSetup`
(`tests/_setup-cursos.js`) descarga el `cursos.json` del `ASC_BASE_URL` que se le pase y
arma la lista de cursos al vuelo (`tests/.cursos.json`, ignorado por git). Si no hay red,
`tests/cursos.js` cae a un fallback con los cursos de Adultos. Así, cambiar `ASC_BASE_URL`
cubre Adultos, Programa de Jóvenes o Desarrollo Institucional sin tocar código.

El workflow [`revision-plataforma.yml`](../.github/workflows/revision-plataforma.yml)
corre esta suite contra las **3 líneas activas en producción** (matriz) + un smoke del
**portal central**. Se lanza a mano desde la pestaña *Actions* (`workflow_dispatch`).

> La Fase 1a (flujo del alumno con backend) sigue siendo específica de **Política de Adultos**.

**Fase 0 — verificación estática (cualquier línea):**

| Archivo | Qué verifica | Checklist |
|---|---|---|
| `tests/smoke.spec.js` | Cada curso carga, título no vacío, sin excepciones JS | §G |
| `tests/links.spec.js` | 0 enlaces internos rotos (externos: solo se reportan) | §M |
| `tests/a11y.spec.js` | Accesibilidad axe WCAG A/AA, claro + oscuro | §H |
| `tests/responsive.spec.js` | Sin scroll horizontal en móvil (Pixel 5) y escritorio | §H |
| `tests/persistence.spec.js` | La preferencia de tema sobrevive a recarga (localStorage) | §F, §H |
| `tests/portal.spec.js` | El portal carga, `lineas.json` válido y enlaces de líneas activas (solo si `ASC_PORTAL_URL`) | §G, §M |

**Fase 1a — flujo del alumno (backend interceptado, sin escribir en prod):**

| Archivo | Qué verifica | Checklist |
|---|---|---|
| `tests/e2e-flujo.spec.js` | Registro → responder cada quiz ≥70% → recorrer módulos → certificado `ASC-AAAA-XXXXX`. Verifica el contrato POST (`register`/`quiz`/`progress`/`certificate` + `token` + `course`). | §F, §G |
| `tests/e2e-plan-builder.spec.js` | El plan-builder (meta/plazo/recursos/compromiso) persiste tras recargar | §F |
| `tests/e2e-perfil-competencias.spec.js` | El plan-builder (meta/plazo/recursos/compromiso) persiste tras recargar | Hilo autodiagnóstico → perfil de competencias → plan personal, incluida la primera visita y el aviso de escala vieja (ADR-034 Fase 1) |
| `tests/_backend.js` | Helper: intercepta y captura las llamadas a Apps Script | — |

**Fase 2 — compuertas de regresión (cada una nació de un defecto real que las otras no vieron):**

| Archivo | Qué verifica | Nació de |
|---|---|---|
| `tests/codigo.spec.js` | La parte **mecánica** de `AUDITORIA.md` (checks A, B, C, E-bis) sobre el HTML **ya compilado**: cubre también los cursos en `draft` y caza el «no se recompiló». Desde el ADR-067 exige además que **ninguna sección compilada salga vacía**. | ADR-033 |
| `tests/feedback-quiz.spec.js` | Falla **a propósito** cada pregunta de cada curso y comprueba que el motor marca en verde **la opción correcta**, no otra. | ADR-061 — el motor señalaba una opción equivocada al fallar, en 26 cursos de 4 líneas: `e2e-flujo` solo recorre el camino de acierto |
| `tests/certificado-puntuacion.spec.js` | Completa cada curso **acertando todo** y exige que el certificado imprima **100**. | ADR-065 — `quizScores` se indexa por número de módulo: `reduce` se salta los huecos y `length` los cuenta, así que seis quizzes perfectos daban **75 %** |
| `tests/landing.spec.js` | Que la **landing de la línea** pinte el catálogo completo agrupado por nivel, con `level`/`levelName`/`order`. | ADR-058 — ninguna prueba tocaba esa página: las demás se parametrizan por el catálogo de **cursos**, así que lo que no es un curso quedaba fuera **por construcción** |
| `tests/panel-a11y.spec.js` | Accesibilidad axe (WCAG A/AA) del **panel administrativo** y del **portal central** — la suite de a11y audita los cursos, y estas dos páginas quedaban fuera. | ADR-033 |
| `tests/e2e-integracion.spec.js` | Escritura y lectura reales contra un **backend de pruebas** (Fase 1b). Opcional: se salta si no hay `ASC_TEST_BACKEND`. | — |

> ⚠️ **Lo que estas compuertas enseñan junto:** *una suite verde prueba lo que recorre, no lo que existe.*
> Las tres primeras nacieron de defectos que vivieron **meses en producción** con el CI en verde, y la de la
> landing, de una página que simplemente **no estaba en ninguna lista**. Al añadir una página o un artefacto a
> la línea, preguntar **qué spec lo recorre** — si la respuesta es «ninguna», no hay compuerta. El 20-sep-2026
> la auditoría de plataforma encontró exactamente eso con `verificar-certificado.html` (**ADR-070**).

> **Resuelto:** el certificado es ahora **idempotente** — se emite una sola vez por curso y
> revisitar el módulo reusa el mismo código sin reenviar al backend (antes duplicaba filas).
> El test `e2e-flujo.spec.js` lo verifica revisitando el módulo y exigiendo `certificate === 1`.

## Dos trampas de esta suite (verde no siempre significa probado)

**1. Un curso en `draft` se salta la suite entera (ADR-052).** El catálogo dinámico filtra
por `status: "active"/"new"`, así que un curso en `draft` **no entra en la lista y la suite
pasa en verde sin haberlo tocado**. Es la forma más silenciosa de creer que hay compuerta
cuando no la hay. Para probar un curso **antes** de activarlo:

1. Copiar `02-Plataforma-Web/`, `assets/`, `index.html` y `404.html` a una carpeta temporal.
2. Voltear el `status` **en la copia** — nunca en el catálogo real; ya se quedó puesto una vez.
3. Servir esa copia con **`ThreadingHTTPServer`**, no con `python -m http.server`: el segundo
   es monohilo y obliga a `--workers=1`; con hilos la suite corre en paralelo.
4. Comprobar que **el número de pruebas subió**. Si no subió, no se probó nada.
5. Al terminar, verificar que el catálogo real quedó como estaba.

**2. Una compuerta intermitente deja de ser compuerta (ADR-051).** Hasta el 16-sep-2026 el CI
se veía «en verde» con **13 de 125 pruebas intermitentes**, todas `color-contrast` sobre
`module-0`, y el mismo cuadro en las cuatro líneas — `tests/a11y.spec.js` era **byte-idéntico**
en todas. La causa no era de accesibilidad sino de **orden de las aserciones**: el spec auditaba
`module-0` **antes** de desactivar las animaciones con `addStyleTag`, mientras seguía en su
`fadeIn`, y axe medía el contraste de un texto semitransparente. Los demás módulos sí esperaban
a que el elemento fuera opaco.

Corregido en las cuatro: `addStyleTag` va **por encima** de la primera auditoría, `module-0`
recibe la misma espera de opacidad que sus hermanos, y **una espera fallida es ruidosa** — si el
módulo no llega a ser opaco en 3 s, la prueba registra `no-auditado` como hallazgo **grave** en
vez de saltárselo en silencio. Esa tercera parte es la que impide que el arreglo se convierta en
el defecto siguiente.

> **La regla:** un test que parpadea se arregla o se borra. No falla el CI, pero enseña a
> ignorarlo — y una compuerta que se ignora ya no es una compuerta. Y antes de descartar un
> hallazgo de a11y como ruido, **comprobar si la prueba mide lo que cree medir**.

## Instalación

```bash
cd PRUEBAS-E2E
npm install
npx playwright install chromium
```

## Uso

```bash
npm test              # toda la suite
npm run smoke         # solo smoke
npm run links         # solo enlaces
npm run a11y          # solo accesibilidad
npm run responsive    # solo responsive
npm run persistence   # solo persistencia
npm run report        # abrir el último reporte HTML
```

Apuntar a otra línea o entorno (la suite estática es agnóstica de línea):

```bash
# Otra línea en producción (p. ej. Programa de Jóvenes)
ASC_BASE_URL="https://maximoaluna-blip.github.io/INDUCCION-PROGRAMA-JOVENES/02-Plataforma-Web/" \
  npm run smoke && npm run a11y && npm run responsive

# Desarrollo Institucional
ASC_BASE_URL="https://maximoaluna-blip.github.io/INDUCCION-DESARROLLO-INSTITUCIONAL/02-Plataforma-Web/" npm test

# Smoke del portal central
ASC_PORTAL_URL="https://maximoaluna-blip.github.io/PORTAL-ADULTOS-ASC/" npx playwright test portal

# Un build local servido en localhost
ASC_BASE_URL="http://localhost:8080/INDUCCION-ADULTOS/02-Plataforma-Web/" npm test
```

## Proyectos (navegadores/viewports)

- `desktop-chromium` — Chrome de escritorio.
- `movil-android` — Pixel 5 (audiencia principal). Los tests marcados
  `@solo-escritorio` (enlaces, a11y, persistencia) no se duplican en móvil.

## Pendiente — Fase 1b (persistencia real en un Sheet de pruebas)

Lo que falta es lo único que **necesita backend real**: comprobar que los datos se
**escriben** de verdad y que los flujos de **lectura** (`recover`, `verify`) responden.
Requiere tu login de Google una vez. Pasos (ver `SETUP-FASE-1B.md`):

1. Crear un Apps Script de pruebas + su Google Sheet (con `clasp`).
2. En `tests/_backend.js`, cambiar el modo de "simular respuesta" a "reenviar al endpoint
   de pruebas" (variable `TEST_SCRIPT_URL`).
3. Añadir un test de integración: POST real → leer con `?action=recover` / `?action=verify`
   y verificar la fila escrita. Verificar también la idempotencia del certificado.
