# Fase 1b — Despliegue de pruebas (persistencia real)

Objetivo: comprobar que los datos **se escriben de verdad** en una hoja y que los flujos de
**lectura** (`recover`, `verify`) responden — sin tocar el Sheet de producción.

El backend usa `SpreadsheetApp.getActiveSpreadsheet()`, así que el script de pruebas debe
estar **vinculado a una Google Sheet nueva** (no standalone). Esto requiere tu cuenta de
Google una sola vez. Hay dos caminos; el A (UI web) es el más rápido.

---

## Camino A — UI web (recomendado, ~10 min, sin instalar nada)

1. **Crea una Google Sheet nueva**, p. ej. `ASC Backend PRUEBAS`. Crea estas 6 pestañas
   (mismas columnas que producción, ver `INDUCCION-ADULTOS/BACKEND.md`):
   `Registros`, `Progreso`, `Evaluaciones`, `Certificados`, `Compromisos`, `Recordatorios`.
2. En esa hoja: **Extensiones → Apps Script**.
3. Borra el contenido y **pega** el código de
   `INDUCCION-ADULTOS/05-Generador-Cursos/google-apps-script.js`. Guarda.
   - El `AUTH_TOKEN` ya es `ADULTOS_ASC_2026` (igual que el frontend): no lo cambies.
4. **Implementar → Nueva implementación → Aplicación web**:
   - Ejecutar como: **Yo**.
   - Quién tiene acceso: **Cualquier persona**.
   - Implementar → autoriza los permisos → copia la **URL `…/exec`**.
5. Pega esa URL en `PRUEBAS-E2E/tests/_backend.js` (constante `TEST_SCRIPT_URL`) y activa el
   modo reenvío (ver abajo).

---

## Camino B — clasp (si prefieres CLI)

```bash
npm install -g @google/clasp
clasp login
# Crea la hoja primero (Camino A paso 1), abre su Apps Script y copia su Script ID, luego:
clasp clone <SCRIPT_ID_DE_PRUEBAS>
# copia el código y sube:
cp INDUCCION-ADULTOS/05-Generador-Cursos/google-apps-script.js <carpeta-clon>/Código.js
cd <carpeta-clon> && clasp push -f && clasp deploy -d "backend pruebas E2E"
```

---

## Tras tener la URL de pruebas

El test de integración **ya está escrito** (`tests/e2e-integracion.spec.js`). Solo falta
darle la URL. Se auto-omite si la variable no está definida (CI sigue verde).

```bash
cd INDUCCION-ADULTOS/PRUEBAS-E2E
TEST_SCRIPT_URL="https://script.google.com/macros/s/XXX/exec" npm test
```

El test hace `register → recover` (el registro debe aparecer) y `certificate → verify`
(el certificado debe ser válido), escribiendo de verdad en el Sheet de pruebas.
Usa correos `e2e-<timestamp>@example.com`, fáciles de filtrar y borrar.

Si corres la suite **sin** la variable, ese test aparece como **skipped** (es lo esperado).

### Opcional — activarlo también en CI

Añade la URL como **secret** del repo (`Settings → Secrets → Actions`, nombre
`TEST_SCRIPT_URL`) y en `.github/workflows/pruebas-e2e.yml`, en el paso de tests:
`env: TEST_SCRIPT_URL: ${{ secrets.TEST_SCRIPT_URL }}`.

> Mientras no exista el endpoint de pruebas, la Fase 1a ya valida todo el flujo del alumno
> y el contrato POST sin escribir en ningún lado; este test solo añade la verificación de
> persistencia real.
