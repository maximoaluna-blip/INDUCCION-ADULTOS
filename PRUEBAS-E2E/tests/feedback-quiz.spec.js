// El feedback del quiz, probado de verdad (ADR-061, reescrito por el ADR-127).
//
// POR QUE EXISTE: el defecto que lo motivo (ADR-061) vivio meses en 26 cursos publicados
// sin que ninguna compuerta lo viera, porque `e2e-flujo.spec.js` recorre el flujo
// ACERTANDO. El camino de error no se pisaba nunca.
//
// QUE CAMBIO (ADR-127, decision del dueño): al FALLAR, el motor ya no marca en verde la
// correcta ni la descartada en rojo — con tres opciones, cualquiera de las dos marcas
// regalaba el reintento. Ahora dice que pregunta fallo, la desmarca y la rebaraja. Las
// acertadas quedan en verde. Al APROBAR (p. ej. 3 de 4) si se ensena la buena.
//
// Lo que hace: entra a cada curso del catalogo y, en cada modulo con quiz, acierta la
// primera pregunta y falla las demas. Comprueba que (1) la acertada queda en verde,
// (2) ninguna opcion de una fallada queda marcada (ni verde, ni roja, ni seleccionada),
// y (3) el aviso nombra las preguntas falladas y no habla de porcentajes.

const { test, expect } = require('@playwright/test');
const { CURSOS: LISTA } = require('./cursos');

test.describe('@solo-escritorio feedback del quiz (ADR-061, ADR-127)', () => {
  if (!LISTA.length) {
    // La linea puede no tener nada `active` todavia (ADR-052). Se dice en voz alta
    // en vez de pasar en verde sin haber mirado nada.
    test('el catalogo no tiene cursos activos que probar', () => {
      console.warn('Sin cursos activos: esta compuerta no ha comprobado ningun curso.');
      expect(LISTA).toEqual([]);
    });
    return;
  }

  for (const curso of LISTA) {
    test(`al fallar, ${curso.courseId} no revela la correcta y nombra la pregunta`, async ({ page }) => {
      await page.goto(curso.file, { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(
        () => typeof QUIZ_ANSWERS !== 'undefined' && typeof checkQuiz === 'function'
      );

      const mal = await page.evaluate(() => {
        const fallos = [];
        let avisos = [];
        const original = window.showNotification;
        window.showNotification = (msg, type) => { avisos.push(msg); };
        try {
          for (const m of Object.keys(QUIZ_ANSWERS)) {
            const clave = QUIZ_ANSWERS[m];
            const qs = document.querySelectorAll('#module-' + m + ' .question');
            if (qs.length < 2) continue;
            avisos = [];
            qs.forEach((q, qi) => {
              const opts = Array.from(q.querySelectorAll('.option'));
              const elegida = qi === 0
                ? opts.find((o) => parseInt(o.getAttribute('data-option-index'), 10) === clave[qi])
                : opts.find((o) => parseInt(o.getAttribute('data-option-index'), 10) !== clave[qi]);
              selectOption(elegida, parseInt(elegida.getAttribute('data-option-index'), 10));
            });
            checkQuiz(Number(m));
            const aprobo = Math.round((1 / qs.length) * 100) >= 70;
            if (aprobo) continue;  // ningun quiz real aprueba con 1 de 2 o mas; por si acaso
            qs.forEach((q, qi) => {
              if (qi === 0) {
                const verde = q.querySelector('.option.correct');
                const idx = verde ? parseInt(verde.getAttribute('data-option-index'), 10) : null;
                if (idx !== clave[0]) fallos.push(`modulo ${m}, pregunta 1 (acertada): no quedo en verde la buena`);
                return;
              }
              const marcadas = q.querySelectorAll('.option.correct, .option.incorrect, .option.selected');
              if (marcadas.length) fallos.push(`modulo ${m}, pregunta ${qi + 1} (fallada): quedaron ${marcadas.length} opciones marcadas`);
              const radios = Array.from(q.querySelectorAll('input[type="radio"]')).filter((r) => r.checked);
              if (radios.length) fallos.push(`modulo ${m}, pregunta ${qi + 1} (fallada): quedo un radio marcado`);
            });
            const aviso = avisos[avisos.length - 1] || '';
            if (!/Fallaste/.test(aviso) || !aviso.includes(String(qs.length))) {
              fallos.push(`modulo ${m}: el aviso no nombra la pregunta fallada: «${aviso}»`);
            }
            if (/%/.test(aviso)) fallos.push(`modulo ${m}: el aviso habla de porcentajes: «${aviso}»`);
            // ADR-135: el resultado queda escrito DENTRO del quiz (el aviso flotante se va solo).
            const fijo = document.querySelector('#module-' + m + ' .quiz-container .quiz-resultado');
            if (!fijo || fijo.textContent !== aviso) {
              fallos.push(`modulo ${m}: el resultado no quedo escrito dentro del quiz: «${fijo ? fijo.textContent : '(no hay)'}»`);
            }
            // Concordancia (ADR-129): una fallada, «esa parte»; varias, «esas partes».
            const plural = qs.length - 1 > 1;
            if (plural ? !/esas partes/.test(aviso) : !/esa parte /.test(aviso)) {
              fallos.push(`modulo ${m}: el aviso no concuerda en numero: «${aviso}»`);
            }
          }
        } finally {
          window.showNotification = original;
        }
        return fallos;
      });

      expect(
        mal,
        `Al fallar el quiz, el curso revela la respuesta o no dice que pregunta fallo.\n${mal.join('\n')}`
      ).toEqual([]);
    });
  }

  // ADR-138: el aviso de fallo tiene que leerse. Blanco sobre #FF9800 daba 2,2:1 (WCAG AA pide 4,5:1).
  test('el aviso de fallo tiene contraste AA', async ({ page }) => {
    await page.goto(LISTA[0].file, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => typeof showNotification === 'function');
    const ratio = await page.evaluate(() => {
      showNotification('Fallaste la pregunta 2. Revisa esa parte de la lección.', 'warning');
      const n = document.querySelector('.notification');
      const cs = getComputedStyle(n);
      const rgb = (c) => c.match(/\d+(\.\d+)?/g).slice(0, 3).map(Number);
      const lum = ([r, g, b]) => [r, g, b].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); })
        .reduce((acc, v, k) => acc + v * [0.2126, 0.7152, 0.0722][k], 0);
      const a = lum(rgb(cs.color)), b = lum(rgb(cs.backgroundColor));
      return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    });
    expect(ratio, `contraste del aviso de fallo: ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5);
  });
});
