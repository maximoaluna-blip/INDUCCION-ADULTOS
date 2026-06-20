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

1. En `tests/_backend.js`, cambiar el modo: en vez de `route.fulfill()` con respuesta
   simulada, hacer `route.continue({ url: TEST_SCRIPT_URL })` para los POST (reenviar al
   endpoint de pruebas) o reconstruir el `fetch` hacia `TEST_SCRIPT_URL`.
2. Añadir `tests/e2e-integracion.spec.js`:
   - Correr el flujo de `e2e-flujo` apuntando al backend de pruebas.
   - Luego `GET ?action=recover&email=...&token=...` y verificar que devuelve el registro.
   - `GET ?action=verify&code=<certificado>` y verificar que el certificado existe.
   - **Idempotencia:** revisitar el módulo de certificado no debe crear una 2.ª fila
     (hallazgo de Fase 1a).
3. Limpieza: usar correos/cursos de prueba reconocibles (p. ej. `*@example.com`) para poder
   borrar filas de prueba de la hoja fácilmente.

> Mientras no exista el endpoint de pruebas, la Fase 1a ya valida todo el flujo del alumno
> y el contrato POST sin escribir en ningún lado.
