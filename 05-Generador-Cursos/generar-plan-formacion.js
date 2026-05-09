// ============================================================================
// generar-plan-formacion.js
// Genera el documento Word con el plan completo de formacion de la
// Linea Politica de Adultos (4 niveles, 17 cursos).
// ============================================================================

const path = require('path');
const fs = require('fs');

// Resolver docx desde el global npm root
const NPM_ROOT = 'C:\\Users\\Principal\\AppData\\Roaming\\npm\\node_modules';
const docx = require(path.join(NPM_ROOT, 'docx'));
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, PageOrientation, LevelFormat, BorderStyle,
  WidthType, ShadingType, HeadingLevel, PageNumber, PageBreak, TabStopType,
  TabStopPosition
} = docx;

// --- Constantes de formato ---
const MORADO = '622599';
const AMARILLO = 'FFE675';
const GRIS_TEXTO = '4A4A4A';
const GRIS_HEADER = 'E8E0F0';
const VERDE_OK = '4CAF50';
const NARANJA_PROX = 'FF9800';
const AZUL = '2196F3';

const border = (color = 'CCCCCC') => ({ style: BorderStyle.SINGLE, size: 6, color });
const allBorders = (color = 'CCCCCC') => ({
  top: border(color), bottom: border(color), left: border(color), right: border(color)
});

// Helper: parrafo simple
const p = (text, opts = {}) => new Paragraph({
  children: [new TextRun({ text, ...opts })],
  spacing: { after: 120, ...opts.spacing }
});

// Helper: parrafo con varios runs
const pp = (children, opts = {}) => new Paragraph({
  children, spacing: { after: 120 }, ...opts
});

// Helper: bullet
const bullet = (text, level = 0) => new Paragraph({
  numbering: { reference: 'bullets', level },
  children: [new TextRun({ text, size: 22 })],
  spacing: { after: 80 }
});

// Helper: heading
const h1 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_1,
  children: [new TextRun({ text, color: MORADO })]
});
const h2 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_2,
  children: [new TextRun({ text, color: MORADO })]
});
const h3 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_3,
  children: [new TextRun({ text, color: MORADO })]
});

// Helper: celda
function cell(content, opts = {}) {
  const children = Array.isArray(content) ? content :
    [new Paragraph({ children: [new TextRun({ text: String(content), size: 20, ...opts.run })] })];
  return new TableCell({
    width: { size: opts.width, type: WidthType.DXA },
    borders: allBorders(),
    shading: opts.shading ? { fill: opts.shading, type: ShadingType.CLEAR } : undefined,
    margins: { top: 100, bottom: 100, left: 140, right: 140 },
    children
  });
}

// ============================================================================
// CONTENIDO DEL DOCUMENTO
// ============================================================================

const TODAY = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });

const content = [];

// --- Portada ---
content.push(new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { before: 1200, after: 200 },
  children: [new TextRun({ text: 'Asociación Scouts de Colombia', size: 24, color: GRIS_TEXTO, bold: true })]
}));
content.push(new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { before: 100, after: 600 },
  children: [new TextRun({ text: 'Plataforma de Formación de Adultos', size: 22, color: GRIS_TEXTO })]
}));
content.push(new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { before: 800, after: 200 },
  children: [new TextRun({ text: 'PLAN DE FORMACIÓN', size: 56, color: MORADO, bold: true })]
}));
content.push(new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { after: 600 },
  children: [new TextRun({ text: 'Línea Política de Adultos', size: 36, color: MORADO, bold: true })]
}));
content.push(new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { after: 200 },
  border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: AMARILLO, space: 1 } },
  children: [new TextRun({ text: '' })]
}));
content.push(new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { before: 300, after: 100 },
  children: [new TextRun({ text: '4 niveles · 17 cursos · Ruta progresiva', size: 24, italics: true, color: GRIS_TEXTO })]
}));
content.push(new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { before: 1200, after: 100 },
  children: [new TextRun({ text: 'Versión inicial — ' + TODAY, size: 20, color: '888888' })]
}));
content.push(new Paragraph({ children: [new PageBreak()] }));

// --- Sección 1: Introducción ---
content.push(h1('1. Introducción'));
content.push(p('Este documento define el plan completo de formación de la Línea Política de Adultos en el Movimiento, dirigida a los adultos voluntarios (consejeros, dirigentes, miembros del consejo de grupo, asesores y demás roles) de la Asociación Scouts de Colombia.', { size: 22 }));
content.push(p('La línea está pensada como una ruta progresiva de cuatro niveles: arranca con una fundamentación conceptual de la política, profundiza por fase del ciclo del adulto, especializa por cargo concreto y cubre temas transversales que aplican a toda persona en el sistema. Los niveles se desarrollan secuencialmente — solo se avanza al siguiente cuando el anterior haya sido validado con piloto y retroalimentación de usuarios reales.', { size: 22 }));

content.push(h2('1.1 ¿Por qué una "Línea Política de Adultos"?'));
content.push(p('La Asociación tiene varias áreas formativas (programa de jóvenes, gestión institucional, participación juvenil, etc.). Esta línea es la específica de "adultos en el movimiento" y se basa exclusivamente en la Política Nacional de Adultos en el Movimiento (PNAM 2022, Acuerdo CSN 176 de 2017) y sus 30 documentos oficiales asociados.', { size: 22 }));
content.push(p('En el futuro pueden coexistir otras líneas (Programa de Jóvenes, Desarrollo Institucional, etc.); la presente trata únicamente la Línea Política de Adultos.', { size: 22 }));

content.push(h2('1.2 Decisiones pedagógicas globales'));
content.push(bullet('Lecciones cortas (5–7 minutos cada una), terminables independientemente.'));
content.push(bullet('Lenguaje práctico aterrizado al día a día del grupo scout, con cita oficial plegable cuando el contenido requiere precisión doctrinal.'));
content.push(bullet('Auto-guardado del progreso en el navegador del estudiante; recuperación cross-device vía correo.'));
content.push(bullet('Evaluación al final de cada lección (mini-quiz de 1–2 preguntas, 70% para pasar).'));
content.push(bullet('Reflexión personal escrita por lección.'));
content.push(bullet('Certificado verificable al completar cada curso (código ASC-AAAA-XXXXX).'));
content.push(bullet('Preview en PDF antes de publicar cualquier curso nuevo, para revisión previa.'));
content.push(bullet('No avanzar a un nivel superior hasta validar el anterior con piloto y retroalimentación.'));

content.push(new Paragraph({ children: [new PageBreak()] }));

// --- Sección 2: Vista panorámica ---
content.push(h1('2. Vista panorámica de la Línea'));

// Tabla de los 4 niveles
const table4Niveles = new Table({
  width: { size: 9360, type: WidthType.DXA },
  columnWidths: [1200, 3200, 1800, 1600, 1560],
  rows: [
    new TableRow({
      tableHeader: true,
      children: [
        cell('Nivel', { width: 1200, shading: GRIS_HEADER, run: { bold: true } }),
        cell('Nombre', { width: 3200, shading: GRIS_HEADER, run: { bold: true } }),
        cell('# de cursos', { width: 1800, shading: GRIS_HEADER, run: { bold: true } }),
        cell('Audiencia', { width: 1600, shading: GRIS_HEADER, run: { bold: true } }),
        cell('Estado', { width: 1560, shading: GRIS_HEADER, run: { bold: true } })
      ]
    }),
    new TableRow({
      children: [
        cell('1', { width: 1200, run: { bold: true, color: MORADO } }),
        cell('Ruta de Fundamentación', { width: 3200 }),
        cell('5 cursos', { width: 1800 }),
        cell('Todo adulto', { width: 1600 }),
        cell('✅ En piloto', { width: 1560, run: { color: VERDE_OK, bold: true } })
      ]
    }),
    new TableRow({
      children: [
        cell('2', { width: 1200, run: { bold: true, color: MORADO } }),
        cell('Profundización por fase del ciclo', { width: 3200 }),
        cell('5 cursos', { width: 1800 }),
        cell('Adultos con experiencia', { width: 1600 }),
        cell('🔮 Siguiente', { width: 1560, run: { color: NARANJA_PROX, bold: true } })
      ]
    }),
    new TableRow({
      children: [
        cell('3', { width: 1200, run: { bold: true, color: MORADO } }),
        cell('Especialización por cargo', { width: 3200 }),
        cell('~7 cursos', { width: 1800 }),
        cell('Adulto en cargo específico', { width: 1600 }),
        cell('📅 Futuro', { width: 1560, run: { color: AZUL } })
      ]
    }),
    new TableRow({
      children: [
        cell('4', { width: 1200, run: { bold: true, color: MORADO } }),
        cell('Transversales', { width: 3200 }),
        cell('3+ cursos', { width: 1800 }),
        cell('Todo adulto', { width: 1600 }),
        cell('📅 Futuro / continuo', { width: 1560, run: { color: AZUL } })
      ]
    })
  ]
});
content.push(table4Niveles);
content.push(p('', { spacing: { after: 200 } }));

content.push(h2('2.1 Recorrido del adulto a través de la Línea'));
content.push(p('El adulto típico ingresa por el Nivel 1, lo completa para tener la base conceptual común, y a partir de ahí su recorrido se vuelve modular: puede tomar cursos del Nivel 2 según los temas que le interesen, del Nivel 3 según el cargo que esté ejerciendo, y los Transversales (Nivel 4) en cualquier momento. Los Niveles 2, 3 y 4 no son secuenciales entre sí.', { size: 22 }));

content.push(new Paragraph({ children: [new PageBreak()] }));

// --- Sección 3: Nivel 1 ---
content.push(h1('3. Nivel 1 — Ruta de Fundamentación'));
content.push(p('Es la ruta común. Toda persona que se inscribe en la plataforma pasa por estos 5 cursos para construir un marco compartido sobre qué dice la política, cómo se evalúa al adulto y cómo se planea su desarrollo.', { size: 22 }));
content.push(p('Duración total aproximada: 2 horas 30 minutos, distribuidas en lecciones cortas (5–8 minutos cada una).', { size: 22 }));

const tableN1 = new Table({
  width: { size: 9360, type: WidthType.DXA },
  columnWidths: [600, 2700, 1200, 4860],
  rows: [
    new TableRow({
      tableHeader: true,
      children: [
        cell('#', { width: 600, shading: GRIS_HEADER, run: { bold: true } }),
        cell('Curso', { width: 2700, shading: GRIS_HEADER, run: { bold: true } }),
        cell('Duración', { width: 1200, shading: GRIS_HEADER, run: { bold: true } }),
        cell('Hitos pedagógicos', { width: 4860, shading: GRIS_HEADER, run: { bold: true } })
      ]
    }),
    new TableRow({
      children: [
        cell('1', { width: 600, run: { bold: true } }),
        cell('🦸 Bienvenida al Movimiento de Adultos', { width: 2700 }),
        cell('25 min', { width: 1200 }),
        cell('Hook Avengers, desarmar mitos, dibujo del consejero ideal, primer compromiso.', { width: 4860 })
      ]
    }),
    new TableRow({
      children: [
        cell('2', { width: 600, run: { bold: true } }),
        cell('📜 La Política — Marco y Principios', { width: 2700 }),
        cell('30 min', { width: 1200 }),
        cell('13 principios oficiales, las 12 herramientas del modelo, definición Spencer-Spencer de competencia.', { width: 4860 })
      ]
    }),
    new TableRow({
      children: [
        cell('3', { width: 600, run: { bold: true } }),
        cell('🔄 El Ciclo del Adulto en el Movimiento', { width: 2700 }),
        cell('30 min', { width: 1200 }),
        cell('Atracción y vinculación, desempeño con formación básica y perfeccionamiento continuo, decisiones para el futuro.', { width: 4860 })
      ]
    }),
    new TableRow({
      children: [
        cell('4', { width: 600, run: { bold: true } }),
        cell('🧠 Las 7 Competencias Esenciales', { width: 2700 }),
        cell('35 min', { width: 1200 }),
        cell('Autodiagnóstico interactivo (sliders 1–4 por competencia) que produce el perfil personal del adulto.', { width: 4860 })
      ]
    }),
    new TableRow({
      children: [
        cell('5', { width: 600, run: { bold: true } }),
        cell('🗺️ Tu Plan Personal de Desarrollo', { width: 2700 }),
        cell('30 min', { width: 1200 }),
        cell('Plan-builder interactivo (lee el perfil del Curso 4) + PDF imprimible para firmar con el asesor. Cierre de la ruta.', { width: 4860 })
      ]
    })
  ]
});
content.push(tableN1);
content.push(p('', { spacing: { after: 100 } }));

content.push(h2('3.1 Estado actual'));
content.push(bullet('Los 5 cursos están desplegados en producción.'));
content.push(bullet('URL pública: https://maximoaluna-blip.github.io/INDUCCION-ADULTOS/'));
content.push(bullet('Backend conectado (Google Apps Script + Sheets) con backup nocturno automático.'));
content.push(bullet('Dashboard administrativo con KPIs activos.'));
content.push(bullet('En piloto con grupo de adultos voluntarios reales para recoger retroalimentación.'));

content.push(new Paragraph({ children: [new PageBreak()] }));

// --- Sección 4: Nivel 2 ---
content.push(h1('4. Nivel 2 — Profundización por fase del ciclo'));
content.push(p('Una vez consolidado el Nivel 1, este nivel atiende las tres fases del ciclo del adulto con cursos dedicados, en lugar del panorama general que da el Curso 3 del Nivel 1. Cubre la práctica concreta de cada fase con sus documentos oficiales y herramientas asociadas.', { size: 22 }));

content.push(h2('4.1 Prioridad 1 — Las 3 fases del ciclo (cubrir primero)'));
content.push(p('Cubren las fases que en el Curso 3 del Nivel 1 solo se mencionan panoramicamente. Son los tres cursos más críticos para la operación real de los grupos.', { size: 22 }));

const tableN2P1 = new Table({
  width: { size: 9360, type: WidthType.DXA },
  columnWidths: [600, 2900, 2200, 3660],
  rows: [
    new TableRow({
      tableHeader: true,
      children: [
        cell('#', { width: 600, shading: GRIS_HEADER, run: { bold: true } }),
        cell('Curso', { width: 2900, shading: GRIS_HEADER, run: { bold: true } }),
        cell('Sirve a quién', { width: 2200, shading: GRIS_HEADER, run: { bold: true } }),
        cell('Fase del ciclo', { width: 3660, shading: GRIS_HEADER, run: { bold: true } })
      ]
    }),
    new TableRow({
      children: [
        cell('6', { width: 600, run: { bold: true } }),
        cell('🚪 Cómo vincular nuevos adultos al grupo', { width: 2900 }),
        cell('Jefes de grupo, presidentes, asesores que reclutan', { width: 2200 }),
        cell('Atracción y Vinculación (las 5 sub-fases oficiales)', { width: 3660 })
      ]
    }),
    new TableRow({
      children: [
        cell('7', { width: 600, run: { bold: true } }),
        cell('🤝 Cómo ser asesor personal', { width: 2900 }),
        cell('Adultos con experiencia que acompañan a otros', { width: 2200 }),
        cell('Desempeño (Asesoría como competencia específica)', { width: 3660 })
      ]
    }),
    new TableRow({
      children: [
        cell('10', { width: 600, run: { bold: true } }),
        cell('🏁 Cierre y reinicio de ciclo', { width: 2900 }),
        cell('Adultos al final de su nombramiento', { width: 2200 }),
        cell('Decisiones para el Futuro (renovación, reubicación, retiro)', { width: 3660 })
      ]
    })
  ]
});
content.push(tableN2P1);
content.push(p('', { spacing: { after: 200 } }));

content.push(h2('4.2 Prioridad 2 — Profundización adicional en Desempeño'));
content.push(p('Después de consolidar la Prioridad 1, se agregan dos cursos más enfocados en herramientas prácticas durante la fase de Desempeño.', { size: 22 }));

const tableN2P2 = new Table({
  width: { size: 9360, type: WidthType.DXA },
  columnWidths: [600, 2900, 2200, 3660],
  rows: [
    new TableRow({
      tableHeader: true,
      children: [
        cell('#', { width: 600, shading: GRIS_HEADER, run: { bold: true } }),
        cell('Curso', { width: 2900, shading: GRIS_HEADER, run: { bold: true } }),
        cell('Sirve a quién', { width: 2200, shading: GRIS_HEADER, run: { bold: true } }),
        cell('Foco', { width: 3660, shading: GRIS_HEADER, run: { bold: true } })
      ]
    }),
    new TableRow({
      children: [
        cell('8', { width: 600, run: { bold: true } }),
        cell('📋 Acompañamiento y Evaluación 360° práctica', { width: 2900 }),
        cell('Cualquier adulto', { width: 2200 }),
        cell('Las 4 modalidades 360° + bitácora + encuestas oficiales (padres, scouts, lobatos)', { width: 3660 })
      ]
    }),
    new TableRow({
      children: [
        cell('9', { width: 600, run: { bold: true } }),
        cell('💻 Talento 360° práctico', { width: 2900 }),
        cell('Todos los adultos', { width: 2200 }),
        cell('Cómo usar la plataforma oficial Talento 360° (registro, hoja de vida, plan personal, certificación)', { width: 3660 })
      ]
    })
  ]
});
content.push(tableN2P2);

content.push(new Paragraph({ children: [new PageBreak()] }));

// --- Sección 5: Nivel 3 ---
content.push(h1('5. Nivel 3 — Especialización por cargo'));
content.push(p('Una vez Niveles 1 y 2 estén operando con varias generaciones de adultos, este nivel aterriza las competencias específicas de cada cargo del consejo de grupo. Se basa en el Manual de Cargos, Funciones y Perfiles por Competencias (PNAM 2022 doc 4) y el Diccionario de Competencias (doc 3), que tipifica 29 competencias específicas por cargo.', { size: 22 }));

const tableN3 = new Table({
  width: { size: 9360, type: WidthType.DXA },
  columnWidths: [600, 3200, 5560],
  rows: [
    new TableRow({
      tableHeader: true,
      children: [
        cell('#', { width: 600, shading: GRIS_HEADER, run: { bold: true } }),
        cell('Curso', { width: 3200, shading: GRIS_HEADER, run: { bold: true } }),
        cell('Competencias específicas que aterriza', { width: 5560, shading: GRIS_HEADER, run: { bold: true } })
      ]
    }),
    new TableRow({
      children: [
        cell('11', { width: 600, run: { bold: true } }),
        cell('🏛️ Cargos del Consejo (panorama)', { width: 3200 }),
        cell('Visión general de los 11 cargos oficiales del consejo de grupo y su articulación.', { width: 5560 })
      ]
    }),
    new TableRow({
      children: [
        cell('12', { width: 600, run: { bold: true } }),
        cell('💰 Tesorero y vigilancia financiera', { width: 3200 }),
        cell('Vigilancia y control financiero, Administración de recursos, Gestión y administración de recursos.', { width: 5560 })
      ]
    }),
    new TableRow({
      children: [
        cell('13', { width: 600, run: { bold: true } }),
        cell('📝 Secretario y gestión documental', { width: 3200 }),
        cell('Elaboración y gestión de documentos, Generación de contenido.', { width: 5560 })
      ]
    }),
    new TableRow({
      children: [
        cell('14', { width: 600, run: { bold: true } }),
        cell('🪪 Asesor Personal (deep dive)', { width: 3200 }),
        cell('Asesoría Personal con sus 4 grados de dominio y conductas observables.', { width: 5560 })
      ]
    }),
    new TableRow({
      children: [
        cell('15', { width: 600, run: { bold: true } }),
        cell('🛡️ Canciller y reconocimientos', { width: 3200 }),
        cell('Garante del debido proceso y gestión de estímulos / reconocimientos.', { width: 5560 })
      ]
    }),
    new TableRow({
      children: [
        cell('16', { width: 600, run: { bold: true } }),
        cell('👤 Consejero juvenil', { width: 3200 }),
        cell('Habilidades y conocimientos Scouts, articulación con la Política Nacional de Participación Juvenil.', { width: 5560 })
      ]
    }),
    new TableRow({
      children: [
        cell('17', { width: 600, run: { bold: true } }),
        cell('🦸 Jefe de grupo (curso integrador)', { width: 3200 }),
        cell('Administración y gestión del grupo, Garante del debido proceso, Liderazgo. Cierre del Nivel 3.', { width: 5560 })
      ]
    })
  ]
});
content.push(tableN3);
content.push(p('', { spacing: { after: 200 } }));

content.push(h2('5.1 Nota sobre la oferta del Nivel 3'));
content.push(p('Algunos adultos tomarán solo el curso del cargo que ejercen actualmente. Otros tomarán varios para entender mejor el funcionamiento del consejo en conjunto. La plataforma no impondrá orden — cada adulto elige según su rol.', { size: 22 }));

content.push(new Paragraph({ children: [new PageBreak()] }));

// --- Sección 6: Nivel 4 ---
content.push(h1('6. Nivel 4 — Cursos transversales'));
content.push(p('No están atados a una fase del ciclo ni a un cargo específico. Aplican a todos los adultos del movimiento de manera continua y se actualizan según las directrices nacionales y mundiales.', { size: 22 }));

const tableN4 = new Table({
  width: { size: 9360, type: WidthType.DXA },
  columnWidths: [800, 3000, 5560],
  rows: [
    new TableRow({
      tableHeader: true,
      children: [
        cell('Tema', { width: 800, shading: GRIS_HEADER, run: { bold: true } }),
        cell('Curso', { width: 3000, shading: GRIS_HEADER, run: { bold: true } }),
        cell('Justificación', { width: 5560, shading: GRIS_HEADER, run: { bold: true } })
      ]
    }),
    new TableRow({
      children: [
        cell('🛡️', { width: 800, run: { bold: true } }),
        cell('Safe from Harm / A Salvo del Peligro', { width: 3000 }),
        cell('Módulo obligatorio del Movimiento Mundial. Protege a los menores y al adulto. Mencionado en Cap. 5.2.1 de la Política Nacional.', { width: 5560 })
      ]
    }),
    new TableRow({
      children: [
        cell('🌈', { width: 800, run: { bold: true } }),
        cell('Diversidad e Inclusión', { width: 3000 }),
        cell('Módulo oficial PNAM. Sensibiliza al adulto sobre prácticas inclusivas en grupo y región.', { width: 5560 })
      ]
    }),
    new TableRow({
      children: [
        cell('💪', { width: 800, run: { bold: true } }),
        cell('Gestión para la Motivación', { width: 3000 }),
        cell('Capítulo 6 de la Política. Aborda el agotamiento del voluntario y cómo prevenirlo. Doc oficial 21.', { width: 5560 })
      ]
    })
  ]
});
content.push(tableN4);
content.push(p('', { spacing: { after: 100 } }));
content.push(p('Pueden agregarse otros cursos transversales según necesidades emergentes (por ejemplo, un curso sobre comunicaciones del grupo, otro sobre sostenibilidad financiera, etc.).', { size: 22 }));

content.push(new Paragraph({ children: [new PageBreak()] }));

// --- Sección 7: Roadmap ---
content.push(h1('7. Roadmap'));
content.push(h2('7.1 Estado actual (mayo 2026)'));
content.push(bullet('Nivel 1 desplegado en producción y en piloto con usuarios reales.'));
content.push(bullet('Plataforma técnica completa: frontend en GitHub Pages, backend en Google Apps Script con backup nocturno, dashboard administrativo.'));
content.push(bullet('Esperando retroalimentación del piloto durante 1–2 semanas para aplicar ajustes finales.'));

content.push(h2('7.2 Próximos hitos'));
content.push(bullet('Hito A — Cierre del piloto: aplicar ajustes derivados de la retroalimentación, dejar Nivel 1 estable.'));
content.push(bullet('Hito B — Lanzar Nivel 2 Prioridad 1 (Cursos 6, 7 y 10): cubre las tres fases del ciclo en profundidad.'));
content.push(bullet('Hito C — Validar Nivel 2 con piloto similar.'));
content.push(bullet('Hito D — Lanzar Nivel 2 Prioridad 2 (Cursos 8 y 9).'));
content.push(bullet('Hito E — Iniciar Nivel 3 con el curso integrador (Cargos del Consejo) y los cargos más demandados.'));
content.push(bullet('Hito F — Completar Nivel 3 según demanda.'));
content.push(bullet('Hito G — Lanzar Nivel 4 (Safe from Harm como prioridad por su carácter obligatorio).'));

content.push(h2('7.3 Criterio para avanzar entre niveles'));
content.push(p('No se inicia el siguiente nivel hasta que el nivel anterior haya sido validado con un piloto real (al menos 5–10 adultos completándolo) y los ajustes de retroalimentación hayan sido aplicados. Esto evita acumular cursos sin verificar y permite aprender del uso real entre cada lanzamiento.', { size: 22 }));

content.push(new Paragraph({ children: [new PageBreak()] }));

// --- Sección 8: Documentos fuente ---
content.push(h1('8. Documentos fuente'));
content.push(p('Toda la línea se basa en los documentos oficiales de la Política Nacional de Adultos en el Movimiento (PNAM 2022, Acuerdo CSN N° 176 del 22 de abril de 2017, ratificado por Resolución CSN N° 021-17 del 5 de junio de 2017). Los más relevantes:', { size: 22 }));

content.push(h2('8.1 Documentos doctrinales centrales'));
content.push(bullet('Doc 1 — Política Nacional de Adultos en el Movimiento (texto oficial completo).'));
content.push(bullet('Doc 2 — Cartilla Metodológica.'));
content.push(bullet('Doc 3 — Diccionario de Competencias (7 esenciales + 29 específicas con grados de dominio y conductas observables).'));
content.push(bullet('Doc 4 — Manual de Cargos, Funciones y Perfiles por Competencias.'));

content.push(h2('8.2 Documentos operativos por fase'));
content.push(bullet('Docs 5, 6, 8, 9, 10 — Atracción y vinculación, requisición, convocatoria, ingreso, nombramiento.'));
content.push(bullet('Docs 11, 12, 13 — Desempeño, certificación, acompañamiento y evaluación.'));
content.push(bullet('Docs 15, 16, 17, 18, 20 — Bitácora y encuestas de percepción (padres, scouts, lobatos).'));
content.push(bullet('Docs 19, 26, 30 — Asesor personal: tips, aval, cómo realizar una asesoría.'));
content.push(bullet('Doc 21 — Gestión para la Motivación.'));
content.push(bullet('Docs 22, 23 — Safe from Harm (A Salvo del Peligro).'));
content.push(bullet('Doc 27 — Guía de inducción para adultos voluntarios nuevos.'));
content.push(bullet('Doc 29 — Guía: cómo desarrollarse en el cargo.'));

content.push(h2('8.3 Tutoriales de plataforma'));
content.push(bullet('Tutorial — Postulación a cargos en Talento 360°.'));
content.push(bullet('Tutorial — Registro y validación de datos en Talento 360°.'));

content.push(h2('8.4 Documentos referenciales mundiales'));
content.push(bullet('Política Interamericana "Los adultos que necesitamos" (origen interamericano de la política).'));
content.push(bullet('Mental Health Matters (OMMS).'));
content.push(bullet('Supporting Leaders (OMMS).'));

content.push(new Paragraph({ children: [new PageBreak()] }));

// --- Sección 9: Glosario ---
content.push(h1('9. Glosario rápido'));

const glosario = [
  ['Adulto del movimiento', 'Toda persona mayor de edad (voluntario o profesional) que ejerce un cargo o función en la ASC.'],
  ['Asesor Personal', 'Adulto que acompaña formalmente el desarrollo de otro adulto durante su nombramiento.'],
  ['Acuerdo Mutuo', 'Documento formal entre el adulto y la asociación que establece compromisos, vigencia, evaluación e inducción.'],
  ['Ciclo de vida del adulto', 'Sucesión cíclica de tres fases: atracción y vinculación, desempeño, decisiones para el futuro.'],
  ['Competencia esencial', 'Una de las 7 competencias que aplican a todo adulto del movimiento (Adaptabilidad, Aprendizaje, Compromiso, Conciencia organizacional, Planeamiento, Relaciones interpersonales, Trabajo en equipo).'],
  ['Competencia específica', 'Una de las 29 competencias técnicas asociadas a cargos concretos (Asesoría Personal, Vigilancia financiera, Gestión de grupo, etc.).'],
  ['Evaluación 360°', 'Modelo de evaluación con 4 modalidades: autoevaluación, coevaluación, heteroevaluación y evaluación formal del asesor.'],
  ['Insignia de Madera', 'Símbolo mundial oficial de certificación de la formación básica del adulto.'],
  ['Plan Personal de Desarrollo (PPD)', 'Plan acordado entre el adulto y su asesor que define competencias a desarrollar y evidencias.'],
  ['PNAM', 'Política Nacional de Adultos en el Movimiento.'],
  ['Talento 360°', 'Plataforma oficial de la ASC que centraliza la hoja de vida del adulto, su PPD y sus evaluaciones.']
];
const tableGloss = new Table({
  width: { size: 9360, type: WidthType.DXA },
  columnWidths: [2700, 6660],
  rows: [
    new TableRow({
      tableHeader: true,
      children: [
        cell('Término', { width: 2700, shading: GRIS_HEADER, run: { bold: true } }),
        cell('Definición', { width: 6660, shading: GRIS_HEADER, run: { bold: true } })
      ]
    }),
    ...glosario.map(([k, v]) => new TableRow({
      children: [
        cell(k, { width: 2700, run: { bold: true, color: MORADO } }),
        cell(v, { width: 6660 })
      ]
    }))
  ]
});
content.push(tableGloss);

// --- Cierre ---
content.push(p('', { spacing: { after: 600 } }));
content.push(new Paragraph({
  alignment: AlignmentType.CENTER,
  children: [new TextRun({ text: '— Fin del documento —', size: 20, italics: true, color: '888888' })]
}));

// ============================================================================
// CONFIGURACION DEL DOCUMENTO
// ============================================================================

const doc = new Document({
  creator: 'Plataforma de Formación de Adultos ASC',
  title: 'Plan de Formación — Línea Política de Adultos',
  description: 'Plan de formación de la Línea Política de Adultos, ASC',
  styles: {
    default: { document: { run: { font: 'Arial', size: 22 } } },
    paragraphStyles: [
      {
        id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 36, bold: true, font: 'Arial', color: MORADO },
        paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 }
      },
      {
        id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 28, bold: true, font: 'Arial', color: MORADO },
        paragraph: { spacing: { before: 280, after: 160 }, outlineLevel: 1 }
      },
      {
        id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 24, bold: true, font: 'Arial', color: MORADO },
        paragraph: { spacing: { before: 220, after: 140 }, outlineLevel: 2 }
      }
    ]
  },
  numbering: {
    config: [
      {
        reference: 'bullets',
        levels: [
          { level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } } }
        ]
      }
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
      }
    },
    headers: {
      default: new Header({
        children: [new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [new TextRun({
            text: 'Plan de Formación — Línea Política de Adultos · ASC',
            size: 16, color: '888888', italics: true
          })]
        })]
      })
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: 'Página ', size: 16, color: '888888' }),
            new TextRun({ children: [PageNumber.CURRENT], size: 16, color: '888888' }),
            new TextRun({ text: ' de ', size: 16, color: '888888' }),
            new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, color: '888888' })
          ]
        })]
      })
    },
    children: content
  }]
});

// ============================================================================
// ESCRIBIR ARCHIVO
// ============================================================================

const OUT = path.join(
  'C:\\Users\\Principal\\Documents\\APP APRENDIZAJE\\APP PARA APRENDIZAJE\\INDUCCION-ADULTOS',
  'Plan-de-Formacion-Linea-Politica-de-Adultos.docx'
);

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync(OUT, buf);
  const sz = (fs.statSync(OUT).size / 1024).toFixed(1);
  console.log('OK ' + sz + ' KB -> ' + OUT);
}).catch(err => {
  console.error('ERROR: ' + err.message);
  process.exit(1);
});
