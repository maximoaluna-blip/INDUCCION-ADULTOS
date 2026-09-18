// Calidad de codigo — la parte MECANICA de AUDITORIA.md (checks A, B, C, E-bis).
//
// POR QUE EXISTE (ADR-033):
// AUDITORIA.md se dispara con una frase que tiene que decir el dueno del proyecto
// ("revisa completo el codigo"). Eso significa que la salud del codigo dependia de
// que alguien se acordara. El 03-ago-2026, tras una tanda de cambios en el motor y
// el backend, la auditoria NO se corrio: nadie dijo la frase. Al correrla despues
// aparecieron 4 escrituras a localStorage que se saltaban guardarLocal() —una de
// ellas la del certificado— y un color con contraste por debajo de AA.
//
// El propio ADR-025 ya lo habia diagnosticado: "lo automatizado se cumple, lo que
// depende de acordarse deriva". Esta spec mueve a la primera categoria todo lo que
// es comprobable sin juicio humano. Corre con el resto de la suite en cada push.
//
// LO QUE NO CUBRE, a proposito: si una funcion divergente entre lineas es legitima,
// si un comentario sigue siendo cierto, si la arquitectura es sensata. Eso sigue
// siendo AUDITORIA.md a mano. Esta spec cubre lo mecanico, no el criterio.

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const REPO = path.join(__dirname, '..', '..');
const GEN = path.join(REPO, '05-Generador-Cursos');
const TEMPLATES = path.join(GEN, 'templates');
const WEB = path.join(REPO, '02-Plataforma-Web');

const leer = (p) => (fs.existsSync(p) ? fs.readFileSync(p, 'utf-8') : null);

/** Ficheros de motor que existan en esta linea (engine.linea.js puede no estar). */
function fuentesMotor() {
  return ['engine.core.js', 'engine.linea.js']
    .map((f) => ({ nombre: f, ruta: path.join(TEMPLATES, f) }))
    .filter((x) => fs.existsSync(x.ruta))
    .map((x) => ({ ...x, texto: fs.readFileSync(x.ruta, 'utf-8') }));
}

/** Lineas que casan un patron, con su numero, para que el fallo diga DONDE. */
function coincidencias(texto, regex) {
  return texto
    .split('\n')
    .map((linea, i) => ({ n: i + 1, linea: linea.trim() }))
    .filter((x) => regex.test(x.linea));
}

test.describe('Calidad de codigo (AUDITORIA.md mecanico)', () => {
  // --- E-bis. Escritura de datos del estudiante -----------------------------
  // La regla: toda escritura a localStorage pasa por guardarLocal(), que avisa al
  // alumno si falla. Una escritura directa —o envuelta en un catch vacio— hace que
  // el estudiante pierda su trabajo en silencio cuando la cuota esta llena o el
  // navegador bloquea el almacenamiento. Fue el bug de saveProgress() (ADR-025) y
  // reaparecio en saveCommitment y en la escritura del certificado (ADR-033).
  test('toda escritura a localStorage pasa por guardarLocal()', () => {
    const infractores = [];
    for (const { nombre, texto } of fuentesMotor()) {
      coincidencias(texto, /localStorage\.setItem/).forEach(({ n, linea }) => {
        // La unica escritura directa legitima es la de dentro de guardarLocal().
        const dentroDelHelper = nombre === 'engine.core.js' && /^localStorage\.setItem\(clave, valor\);$/.test(linea);
        if (!dentroDelHelper) infractores.push(`${nombre}:${n}  ${linea}`);
      });
    }
    expect(infractores, `Usar guardarLocal(clave, valor) en vez de localStorage.setItem directo.\n${infractores.join('\n')}`).toEqual([]);
  });

  test('ninguna escritura de datos queda tragada por un catch vacio', () => {
    const infractores = [];
    for (const { nombre, texto } of fuentesMotor()) {
      // catch vacio (o solo con comentario) en la MISMA linea que un setItem
      coincidencias(texto, /localStorage\.setItem.*catch\s*\([^)]*\)\s*\{\s*(\/\*.*\*\/)?\s*\}/).forEach(({ n, linea }) => {
        infractores.push(`${nombre}:${n}  ${linea}`);
      });
    }
    expect(infractores, `Un catch vacio sobre una escritura pierde el dato del alumno sin avisar.\n${infractores.join('\n')}`).toEqual([]);
  });

  // --- A. Limpieza ----------------------------------------------------------
  test('el motor no lleva console.log ni debugger de depuracion', () => {
    const infractores = [];
    for (const { nombre, texto } of fuentesMotor()) {
      coincidencias(texto, /\bdebugger\b|console\.(log|debug)\s*\(/).forEach(({ n, linea }) => {
        infractores.push(`${nombre}:${n}  ${linea}`);
      });
    }
    // console.error y console.warn si valen: informan de fallos reales en produccion.
    expect(infractores, `Restos de depuracion en el motor.\n${infractores.join('\n')}`).toEqual([]);
  });

  // --- B. Seguridad y consistencia -----------------------------------------
  test('no queda rastro del token viejo de la plataforma Rover', () => {
    const sospechosos = [];
    for (const { nombre, texto } of fuentesMotor()) {
      if (texto.includes('ROVER_ASC_2025')) sospechosos.push(nombre);
    }
    const build = leer(path.join(GEN, 'build-course.js'));
    if (build && build.includes('ROVER_ASC_2025')) sospechosos.push('build-course.js');
    expect(sospechosos, 'El token viejo no debe sobrevivir en ningun archivo.').toEqual([]);
  });

  // --- B-bis. Logros --------------------------------------------------------
  // La convencion: el logro que se gana al TERMINAR el curso se declara con
  // `unlockOnModule: -1`. El bucle del quiz no puede encenderlo —compara contra el
  // numero de modulo, que nunca vale -1—, asi que le toca a generateCertificate().
  // Ahi estuvo cableado `unlockAchievement('achievement-5')` hasta el 15-sep-2026
  // (ADR-046): acertaba solo en los 7 cursos cuyo logro final se llamaba asi, y en
  // los otros 16 dejaba la insignia culminante gris para siempre, ademas de
  // encender una que el alumno podia no haber ganado. Nadie lo vio en meses porque
  // ninguna prueba miraba los logros. Un id literal aqui es ese defecto volviendo.
  test('el motor no desbloquea logros por id cableado (ADR-046)', () => {
    const infractores = [];
    for (const { nombre, texto } of fuentesMotor()) {
      coincidencias(texto, /unlockAchievement\(\s*['"`]/).forEach(({ n, linea }) => {
        infractores.push(`${nombre}:${n}  ${linea}`);
      });
    }
    const detalle = ['El logro final se resuelve por unlockOnModule === -1, nunca por su id.']
      .concat(infractores)
      .join('\n');
    expect(infractores, detalle).toEqual([]);
  });

  test('el certificado barre los logros con unlockOnModule === -1 (ADR-046)', () => {
    const core = leer(path.join(TEMPLATES, 'engine.core.js'));
    expect(core, 'Esta linea deberia tener engine.core.js sincronizado desde _MOTOR/.').not.toBeNull();
    expect(
      core,
      'generateCertificate() debe encender el logro final barriendo unlockOnModule === -1.'
    ).toMatch(/unlockOnModule === -1\)\s*unlockAchievement\(ach\.id\)/);
  });

  // --- C. Performance -------------------------------------------------------
  test('ningun curso compilado supera los 500 KB', () => {
    if (!fs.existsSync(WEB)) test.skip();
    const pesados = fs
      .readdirSync(WEB)
      .filter((f) => f.endsWith('.html'))
      .map((f) => ({ f, kb: Math.round(fs.statSync(path.join(WEB, f)).size / 1024) }))
      .filter((x) => x.kb > 500)
      .map((x) => `${x.f} — ${x.kb} KB`);
    expect(pesados, `HTML por encima del limite de 500 KB.\n${pesados.join('\n')}`).toEqual([]);
  });

  // --- F. Integridad del catalogo ------------------------------------------
  // Que cada curso publicado tenga su JSON fuente. Un HTML sin JSON es una entrada
  // huerfana: se compilo y despues se borro el origen, asi que nadie puede rehacerlo.
  test('cada curso activo del catalogo conserva su JSON fuente', () => {
    const catalogo = leer(path.join(WEB, 'cursos.json'));
    if (!catalogo) test.skip();
    const huerfanos = JSON.parse(catalogo)
      .filter((c) => ['active', 'new'].includes(c.status))
      .filter((c) => !fs.existsSync(path.join(GEN, 'borradores', `${c.courseId}.json`)))
      .map((c) => c.courseId);
    expect(huerfanos, `Cursos publicados sin JSON fuente en borradores/.\n${huerfanos.join('\n')}`).toEqual([]);
  });

  // --- C-bis. Estructura de modulos ------------------------------------------
  // `isIntro` marca el modulo de registro: sin ella el build no pinta el panel de
  // logros con sus ids -asi que NINGUN logro puede encenderse-, no pinta el nombre
  // del alumno, y numera el primer modulo como si fuera de contenido, con lo que el
  // ultimo acaba mostrando un badge imposible («Modulo 8/7»). Le paso al Curso 11 de
  // PJ el 16-sep-2026 y no lo vio nadie: ni el build, ni las tres auditorias, ni esta
  // suite. Es mecanico, asi que desde hoy lo mira una prueba.
  test('cada curso tiene exactamente un modulo de intro, y es el primero', () => {
    const malos = [];
    for (const f of fs.readdirSync(path.join(GEN, 'borradores')).filter((x) => x.endsWith('.json'))) {
      const curso = JSON.parse(fs.readFileSync(path.join(GEN, 'borradores', f), 'utf-8'));
      const mods = curso.modules || [];
      const intros = mods.filter((m) => m.isIntro === true).length;
      if (intros !== 1) malos.push(`${f}: ${intros} modulos con isIntro (debe ser 1)`);
      else if (mods[0].isIntro !== true) malos.push(`${f}: el modulo de intro no es el primero`);
    }
    expect(malos, ['Sin isIntro no hay logros ni nombre del alumno, y la numeracion se desborda.']
      .concat(malos).join(String.fromCharCode(10))).toEqual([]);
  });

  test('totalContentModules coincide con los modulos que no son intro', () => {
    const malos = [];
    for (const f of fs.readdirSync(path.join(GEN, 'borradores')).filter((x) => x.endsWith('.json'))) {
      const curso = JSON.parse(fs.readFileSync(path.join(GEN, 'borradores', f), 'utf-8'));
      const reales = (curso.modules || []).filter((m) => !m.isIntro).length;
      if (curso.totalContentModules !== reales) {
        malos.push(`${f}: declara ${curso.totalContentModules} y tiene ${reales}`);
      }
    }
    expect(malos, ['El badge de cada modulo sale de este numero: si no cuadra, el alumno ve «Modulo N/M» imposible.']
      .concat(malos).join(String.fromCharCode(10))).toEqual([]);
  });
  // --- ADR-034. Vocabulario de dominio ---------------------------------------
  // POR QUE: el motor se propaga por copia entre lineas, y con el viajo el
  // vocabulario del plano del ADULTO hasta Programa de Jovenes, donde se publico:
  // el ejercicio sobre las 6 AREAS DE CRECIMIENTO del joven le pedia al estudiante
  // "selecciona 2 a 3 competencias" y le ofrecia "pasar del grado 2 al 3".
  //
  // Ninguna de las 3 auditorias lo detecto y ninguna fallo: la doctrinal y la
  // pedagogica leen el JSON del curso, y la de codigo se aparta del texto por
  // decision explicita de AUDITORIA.md. El texto visible que vive en el codigo
  // quedaba en la costura. Este check cierra esa costura.
  //
  // MIRA solo las cadenas de texto VISIBLES de los TRES ARCHIVOS DEL MOTOR
  // (engine.linea.js, build-course.js, render.plan-builder.js). NO barre el HTML
  // compilado: eso se probo, produjo puro ruido y se descarto a proposito -- ver el
  // comentario de mas abajo. La prosa de los cursos la juzga el auditor doctrinal.
  // Los comentarios de codigo quedan fuera: documentan el porque de una decision y
  // no le llegan a nadie que curse.
  test('el motor no usa vocabulario de otro plano (ADR-034)', () => {
    const lexicoPath = path.join(__dirname, '..', 'lexico.json');
    if (!fs.existsSync(lexicoPath)) test.skip();
    const lexico = JSON.parse(fs.readFileSync(lexicoPath, 'utf-8'));

    // Quita comentarios de linea y de bloque antes de buscar.
    const sinComentarios = (js) =>
      js.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/^[ \t]*\/\/.*$/gm, ' ');

    // Cadenas entre comillas simples, dobles o backticks que contengan prosa.
    const cadenasVisibles = (js) => {
      const out = [];
      const re = /'([^'\\\n]{4,400})'|"([^"\\\n]{4,400})"|`([^`\\]{4,400})`/g;
      let m;
      while ((m = re.exec(js)) !== null) {
        const t = m[1] || m[2] || m[3];
        if (/[a-zaeiouñ]\s+[a-zaeiouñ]/i.test(t)) out.push(t);
      }
      return out;
    };

    // ALCANCE — deliberadamente acotado a las ETIQUETAS DEL COMPONENTE, no al
    // contenido de los cursos.
    //
    // Un primer intento barrio tambien la prosa del HTML compilado y produjo puro
    // ruido: senalo "el marco de competencias UNESCO" y "competencias terminales e
    // intermedias" en pnpj-gran-juego, que son doctrina correcta, y "competencia"
    // como rivalidad en educacion-por-el-amor, que es la cuarta acepcion legitima
    // del GLOSARIO seccion E-bis. Es el mismo error que el ADR-033 ya habia evitado al
    // descartar el check de "cero color: inline": automatizar el DANO MEDIBLE, no
    // su proxy.
    //
    // El dano medible aqui es el vocabulario cocido dentro del motor y del
    // generador — las etiquetas que el componente le impone al curso, que ningun
    // autor de contenido escribio y que viajan por copia entre lineas. La prosa de
    // los cursos la juzga el auditor doctrinal, que sabe distinguir las cuatro
    // acepciones; un spec no.
    const objetivos = [];

    // render.plan-builder.js es compartido y NO debe tener vocabulario: barrerlo lo demuestra.
    for (const f of ['engine.linea.js', '../build-course.js', 'render.plan-builder.js']) {
      const ruta = path.join(TEMPLATES, f);
      const js = leer(ruta);
      if (!js) continue;
      cadenasVisibles(sinComentarios(js)).forEach((t) =>
        objetivos.push({ origen: path.basename(f), texto: t })
      );
    }

    // Deuda declarada de la Fase 1: cadenas del plano del adulto que viven en el
    // nucleo compartido y no son alcanzables en esta linea (el guard de
    // initPlanBuilders corta antes, y PJ no tiene ningun curso con
    // self-assessment). NO son un permiso: solo tapan el texto EXACTO listado,
    // asi que cualquier vocabulario nuevo sigue rompiendo la compuerta. Se
    // retiran cuando la Fase 1 saque ese bloque del nucleo.
    const deuda = (lexico.excepcionesDeudaFase1 || []).map((d) => d.texto);
    const esDeudaConocida = (contexto) => deuda.some((d) => contexto.includes(d));

    const infracciones = [];
    for (const regla of lexico.prohibido) {
      const re = new RegExp(regla.patron, 'gi');
      for (const { origen, texto } of objetivos) {
        const hits = texto.match(re);
        if (!hits) continue;
        for (const hit of new Set(hits)) {
          const ctx = texto.slice(Math.max(0, texto.indexOf(hit) - 60), texto.indexOf(hit) + 80);
          if (esDeudaConocida(ctx)) continue;
          infracciones.push(
            `  [${origen}] "${hit.trim()}"\n` +
              `     contexto: ...${ctx.replace(/\s+/g, ' ').trim()}...\n` +
              `     por que:  ${regla.porQue}\n` +
              `     usa:      ${regla.enSuLugar}`
          );
        }
      }
    }

    const unicas = [...new Set(infracciones)];
    expect(
      unicas,
      `Vocabulario de otro plano en la linea "${lexico.linea}" (plano: ${lexico.plano}).\n` +
        `Ver GLOSARIO-ASC.md seccion E-bis y ADR-034.\n\n${unicas.join('\n\n')}\n`
    ).toEqual([]);
  });


  // --- ADR-034. Claves de localStorage: documento vs codigo ------------------
  // POR QUE: CREAR-CURSO.md de esta linea prescribia desde su diseno una clave
  // propia (dirigenteProfile) para no leer el perfil del ADULTO de otra linea.
  // Nunca se implemento. Y el manual, ademas, la daba por hecha. Nadie lo noto
  // en meses porque NINGUNA compuerta compara lo que los manuales prescriben
  // contra lo que el codigo hace: el CHECKLIST seccion I tiene la casilla
  // —"los hilos de datos usan las claves declaradas en CREAR-CURSO.md"— y se
  // marcaba en verde sin ejecutarla.
  //
  // Las lineas comparten dominio, asi que comparten localStorage. Una clave sin
  // apellido de linea es legible por las otras tres y por las dos apps: no es
  // un detalle de estilo, es la frontera entre planos conceptuales.
  test('las claves de localStorage coinciden con lo declarado (ADR-034)', () => {
    const declPath = path.join(__dirname, '..', 'claves-localstorage.json');
    if (!fs.existsSync(declPath)) test.skip();
    const decl = JSON.parse(fs.readFileSync(declPath, 'utf-8'));

    // Claves que el motor usa de verdad.
    const enCodigo = new Set();
    for (const { texto } of fuentesMotor()) {
      const re = /(?:guardarLocal|leerLocal|localStorage\.(?:getItem|setItem|removeItem))\(\s*'([^']+)'/g;
      let m;
      while ((m = re.exec(texto)) !== null) enCodigo.add(m[1]);
    }

    const declaradas = decl.claves.map((k) => k.patron);
    const problemas = [];

    // (a) El codigo hace algo que nadie documento. Es el caso peligroso: un dato
    //     del estudiante viajando por un canal que no esta en ningun manual.
    for (const k of enCodigo) {
      if (!declaradas.includes(k)) {
        problemas.push(
          `  SIN DECLARAR: el motor usa '${k}' y no esta en claves-localstorage.json.\n` +
            `     Declarala con su proposito y su alcance, o quitala del codigo.`
        );
      }
    }

    for (const k of decl.claves) {
      const presente = enCodigo.has(k.patron);

      // (b) El documento miente: dice que existe y no existe.
      if (k.estado === 'implementada' && !presente) {
        problemas.push(
          `  DECLARADA PERO AUSENTE: '${k.patron}' figura como implementada y el motor no la usa.\n` +
            `     O el codigo la perdio, o la declaracion esta de mas. Fue el caso de dirigenteProfile.`
        );
      }

      // (c) Se implemento algo que estaba solo planeado, sin documentarlo bien.
      if (k.estado === 'planeada' && presente) {
        problemas.push(
          `  PLANEADA PERO YA EN USO: '${k.patron}' aparece en el motor.\n` +
            `     Promuevela a "implementada" y describe que guarda y quien la lee.`
        );
      }
    }

    expect(
      problemas,
      `Desajuste entre los manuales y el motor en la linea "${decl.linea}".\n` +
        `Ver ADR-034 y CREAR-CURSO.md seccion 5.\n\n${problemas.join('\n\n')}\n`
    ).toEqual([]);
  });


  // --- G. El feedback del quiz (ADR-061) -------------------------------------
  // El motor se INLINEA en tiempo de build, asi que arreglarlo no arregla nada hasta
  // recompilar cada curso. Esta prueba mira el HTML YA COMPILADO -incluidos los que
  // estan en `draft`, que la suite se salta por el ADR-052- y exige que la opcion
  // correcta se busque por el atributo sellado y no por su posicion en un DOM barajado.
  test('ningun curso compilado marca la correcta por posicion (ADR-061)', () => {
    if (!fs.existsSync(WEB)) test.skip();
    const rotos = [];
    for (const f of fs.readdirSync(WEB).filter((x) => x.endsWith('.html'))) {
      const html = fs.readFileSync(path.join(WEB, f), 'utf-8');
      if (!html.includes('shuffleQuizOptions')) continue;   // sin barajado no hay defecto
      if (/options\s*\[\s*quizData\s*\[\s*qIndex\s*\]\s*\]/.test(html)) {
        rotos.push(`${f} — indexa el DOM barajado con el indice del JSON`);
      } else if (!html.includes('data-option-index')) {
        rotos.push(`${f} — sin data-option-index: compilado antes del arreglo`);
      }
    }
    expect(
      rotos,
      'Al fallar un quiz, estos cursos marcan en VERDE una opcion equivocada.\n' +
        'Casi siempre significa que el curso no se recompilo tras tocar el motor.\n' +
        rotos.join('\n')
    ).toEqual([]);
  });

});
