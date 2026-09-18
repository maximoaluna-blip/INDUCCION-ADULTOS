// El feedback del quiz, probado de verdad (ADR-061).
//
// POR QUE EXISTE: el defecto que lo motiva vivio meses en 26 cursos publicados de 4
// lineas sin que ninguna compuerta lo viera, porque `e2e-flujo.spec.js` recorre el
// flujo ACERTANDO. El camino de error no se pisaba nunca — y en un curso el error es
// justo donde se ensena: es el unico momento en que el motor dice cual era la buena.
//
// Lo que hace: entra a cada curso del catalogo, FALLA a proposito todas las preguntas
// de todos los modulos y comprueba que la opcion que queda en verde es la correcta de
// verdad, no la que cae en esa posicion del DOM ya barajado.
//
// Probado que dispara: sobre una copia con el arreglo deshecho a mano dio 9 de 14.

const { test, expect } = require('@playwright/test');
const { CURSOS: LISTA } = require('./cursos');

test.describe('@solo-escritorio feedback del quiz (ADR-061)', () => {
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
    test(`al fallar, ${curso.courseId} marca en verde la correcta`, async ({ page }) => {
      await page.goto(curso.file, { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(
        () => typeof QUIZ_ANSWERS !== 'undefined' && typeof checkQuiz === 'function'
      );

      const mal = await page.evaluate(() => {
        const fallos = [];
        for (const m of Object.keys(QUIZ_ANSWERS)) {
          const clave = QUIZ_ANSWERS[m];
          const qs = document.querySelectorAll('#module-' + m + ' .question');
          if (!qs.length) continue;
          qs.forEach((q, qi) => {
            const opts = Array.from(q.querySelectorAll('.option'));
            if (!opts.length) return;
            const mala =
              opts.find((o) => parseInt(o.getAttribute('data-option-index'), 10) !== clave[qi]) ||
              opts[0];
            selectOption(mala, parseInt(mala.getAttribute('data-option-index'), 10));
          });
          checkQuiz(Number(m));
          qs.forEach((q, qi) => {
            const verde = q.querySelector('.option.correct');
            const idx = verde ? parseInt(verde.getAttribute('data-option-index'), 10) : null;
            if (idx !== clave[qi]) {
              fallos.push(`modulo ${m}, pregunta ${qi + 1}: la buena es la ${clave[qi]} y marco la ${idx}`);
            }
          });
        }
        return fallos;
      });

      expect(
        mal,
        `Al fallar el quiz, el curso senala en VERDE una opcion equivocada.\n${mal.join('\n')}`
      ).toEqual([]);
    });
  }
});
