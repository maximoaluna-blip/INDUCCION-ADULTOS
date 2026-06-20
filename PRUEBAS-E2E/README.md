# PRUEBAS-E2E — Pruebas automatizadas del portal de formación ASC

Suite de [Playwright](https://playwright.dev) que verifica el portal de formación de forma
repetible. Sustituye verificación manual del `CHECKLIST-CALIDAD-CURSO.md` por chequeos
automáticos. **No reemplaza el piloto humano** (Parte L del checklist): prueba que la
máquina funciona, no la pedagogía.

## Estado: Fase 0 + Fase 1a (sin backend real)

Corre contra el sitio **público** (GitHub Pages). **No escribe nada** en el backend de
Apps Script: en Fase 1a las llamadas se interceptan con `page.route()` (`tests/_backend.js`).
Cubre la línea **Política de Adultos** (5 cursos activos).

**Fase 0 — verificación estática:**

| Archivo | Qué verifica | Checklist |
|---|---|---|
| `tests/smoke.spec.js` | Cada curso carga, título correcto, sin excepciones JS | §G |
| `tests/links.spec.js` | 0 enlaces internos rotos (externos: solo se reportan) | §M |
| `tests/a11y.spec.js` | Accesibilidad axe WCAG A/AA, claro + oscuro | §H |
| `tests/responsive.spec.js` | Sin scroll horizontal en móvil (Pixel 5) y escritorio | §H |
| `tests/persistence.spec.js` | La preferencia de tema sobrevive a recarga (localStorage) | §F, §H |

**Fase 1a — flujo del alumno (backend interceptado, sin escribir en prod):**

| Archivo | Qué verifica | Checklist |
|---|---|---|
| `tests/e2e-flujo.spec.js` | Registro → responder cada quiz ≥70% → recorrer módulos → certificado `ASC-AAAA-XXXXX`. Verifica el contrato POST (`register`/`quiz`/`progress`/`certificate` + `token` + `course`). | §F, §G |
| `tests/e2e-plan-builder.spec.js` | El plan-builder (meta/plazo/recursos/compromiso) persiste tras recargar | §F |
| `tests/_backend.js` | Helper: intercepta y captura las llamadas a Apps Script | — |

> **Resuelto:** el certificado es ahora **idempotente** — se emite una sola vez por curso y
> revisitar el módulo reusa el mismo código sin reenviar al backend (antes duplicaba filas).
> El test `e2e-flujo.spec.js` lo verifica revisitando el módulo y exigiendo `certificate === 1`.

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

Apuntar a otro entorno (p. ej. un build local servido en localhost):

```bash
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
