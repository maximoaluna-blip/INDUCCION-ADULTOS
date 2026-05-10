// ============================================================================
// generar-manual-crear-curso.js
// Genera Manual-Crear-Curso.docx — manual operativo para crear nuevos cursos.
// ============================================================================

const path = require('path');
const fs = require('fs');

const NPM_ROOT = 'C:\\Users\\Principal\\AppData\\Roaming\\npm\\node_modules';
const docx = require(path.join(NPM_ROOT, 'docx'));
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, LevelFormat, BorderStyle,
  WidthType, ShadingType, HeadingLevel, PageNumber, PageBreak
} = docx;

const MORADO = '622599';
const AMARILLO = 'FFE675';
const GRIS_TEXTO = '4A4A4A';
const GRIS_HEADER = 'E8E0F0';
const GRIS_CODE_BG = 'F5F5F5';

const border = (color = 'CCCCCC') => ({ style: BorderStyle.SINGLE, size: 6, color });
const allBorders = (color = 'CCCCCC') => ({
  top: border(color), bottom: border(color), left: border(color), right: border(color)
});

const p = (text, opts = {}) => new Paragraph({
  children: [new TextRun({ text, ...opts })],
  spacing: { after: 120, ...(opts.spacing || {}) }
});

const bullet = (text, level = 0) => new Paragraph({
  numbering: { reference: 'bullets', level },
  children: [new TextRun({ text, size: 22 })],
  spacing: { after: 80 }
});

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

// Code block: párrafo con fuente monospace, fondo gris, indentado
const code = (lines) => lines.map((line, idx) => new Paragraph({
  shading: { fill: GRIS_CODE_BG, type: ShadingType.CLEAR },
  spacing: { before: idx === 0 ? 100 : 0, after: idx === lines.length - 1 ? 200 : 0 },
  children: [new TextRun({ text: line, font: 'Consolas', size: 18 })]
}));

function cell(content, opts = {}) {
  const children = Array.isArray(content) ? content :
    [new Paragraph({ children: [new TextRun({ text: String(content), size: 20, ...(opts.run || {}) })] })];
  return new TableCell({
    width: { size: opts.width, type: WidthType.DXA },
    borders: allBorders(),
    shading: opts.shading ? { fill: opts.shading, type: ShadingType.CLEAR } : undefined,
    margins: { top: 100, bottom: 100, left: 140, right: 140 },
    children
  });
}

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
  children: [new TextRun({ text: 'MANUAL OPERATIVO', size: 56, color: MORADO, bold: true })]
}));
content.push(new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { after: 600 },
  children: [new TextRun({ text: 'Cómo crear un curso o nivel', size: 36, color: MORADO, bold: true })]
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
  children: [new TextRun({ text: 'Proceso paso a paso · Estructura de la carpeta del generador · Casos especiales', size: 22, italics: true, color: GRIS_TEXTO })]
}));
content.push(new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { before: 1200, after: 100 },
  children: [new TextRun({ text: 'Versión inicial — ' + TODAY, size: 20, color: '888888' })]
}));
content.push(new Paragraph({ children: [new PageBreak()] }));

// --- Sección 1: Estructura de la carpeta ---
content.push(h1('1. Estructura de la carpeta 05-Generador-Cursos/'));
content.push(p('Es el corazón técnico de la plataforma. Cada archivo tiene un rol específico en el flujo de creación de un curso.', { size: 22 }));

content.push(h2('1.1 Inventario y rol de cada archivo'));

const tableEstructura = new Table({
  width: { size: 9360, type: WidthType.DXA },
  columnWidths: [3200, 6160],
  rows: [
    new TableRow({
      tableHeader: true,
      children: [
        cell('Archivo', { width: 3200, shading: GRIS_HEADER, run: { bold: true } }),
        cell('Rol', { width: 6160, shading: GRIS_HEADER, run: { bold: true } })
      ]
    }),
    new TableRow({ children: [
      cell('SKILL.md', { width: 3200, run: { bold: true, color: MORADO } }),
      cell('Instrucciones para que la IA genere cursos consistentes (rol pedagógico, criterios, schema, ejemplos de uso).', { width: 6160 })
    ]}),
    new TableRow({ children: [
      cell('course-schema.json', { width: 3200, run: { bold: true, color: MORADO } }),
      cell('Define los tipos de sección permitidos y la estructura JSON válida.', { width: 6160 })
    ]}),
    new TableRow({ children: [
      cell('course-schema.example.json', { width: 3200, run: { bold: true, color: MORADO } }),
      cell('Curso completo de referencia (estilo y nivel de detalle esperados).', { width: 6160 })
    ]}),
    new TableRow({ children: [
      cell('build-course.js', { width: 3200, run: { bold: true, color: MORADO } }),
      cell('Lee un JSON, le inyecta templates/styles.css y templates/engine.js, produce un HTML autocontenido.', { width: 6160 })
    ]}),
    new TableRow({ children: [
      cell('preview-course.js', { width: 3200, run: { bold: true, color: MORADO } }),
      cell('Genera un HTML con mockups visuales para imprimir como PDF (no funcional, solo revisión).', { width: 6160 })
    ]}),
    new TableRow({ children: [
      cell('templates/engine.js', { width: 3200, run: { bold: true, color: MORADO } }),
      cell('Motor JavaScript inyectado en cada HTML: registro, quizzes, autoguardado, recovery, certificados, photo-upload, self-assessment, plan-builder.', { width: 6160 })
    ]}),
    new TableRow({ children: [
      cell('templates/styles.css', { width: 3200, run: { bold: true, color: MORADO } }),
      cell('CSS de toda la plataforma. Cambiarlo y rebuild propaga el cambio a todos los cursos.', { width: 6160 })
    ]}),
    new TableRow({ children: [
      cell('borradores/*.json', { width: 3200, run: { bold: true, color: MORADO } }),
      cell('Fuente de verdad de cada curso. Un archivo por curso.', { width: 6160 })
    ]}),
    new TableRow({ children: [
      cell('google-apps-script.js', { width: 3200, run: { bold: true, color: MORADO } }),
      cell('Backend desplegado en Google Apps Script. Recibe registros, progreso, certificados, evaluaciones, compromisos.', { width: 6160 })
    ]}),
    new TableRow({ children: [
      cell('backup-automatico.js', { width: 3200, run: { bold: true, color: MORADO } }),
      cell('Módulo standalone de respaldo automático nocturno del Google Sheet a Drive.', { width: 6160 })
    ]}),
    new TableRow({ children: [
      cell('INSTRUCCIONES-GOOGLE-APPS-SCRIPT.md', { width: 3200, run: { bold: true, color: MORADO } }),
      cell('Manual paso a paso para configurar el backend desde cero.', { width: 6160 })
    ]}),
    new TableRow({ children: [
      cell('input/  (gitignored)', { width: 3200, run: { bold: true, color: MORADO } }),
      cell('Carpeta donde se pone documentación fuente cuando se va a generar un curso desde docs (PDFs, MDs).', { width: 6160 })
    ]}),
    new TableRow({ children: [
      cell('previews/  (gitignored)', { width: 3200, run: { bold: true, color: MORADO } }),
      cell('Carpeta donde se generan los HTMLs y PDFs de preview, para revisión antes de publicar.', { width: 6160 })
    ]}),
    new TableRow({ children: [
      cell('generar-plan-formacion.js', { width: 3200, run: { bold: true, color: MORADO } }),
      cell('Genera el documento Word con el plan completo de formación (los 4 niveles, 17 cursos).', { width: 6160 })
    ]}),
    new TableRow({ children: [
      cell('generar-manual-crear-curso.js', { width: 3200, run: { bold: true, color: MORADO } }),
      cell('Genera este mismo manual operativo en formato Word.', { width: 6160 })
    ]})
  ]
});
content.push(tableEstructura);

content.push(new Paragraph({ children: [new PageBreak()] }));

// --- Sección 2: Caso A ---
content.push(h1('2. Caso A — Crear UN curso nuevo'));
content.push(p('Proceso completo de 12 pasos desde el diseño hasta el despliegue en producción.', { size: 22 }));

const tableCasoA = new Table({
  width: { size: 9360, type: WidthType.DXA },
  columnWidths: [600, 2400, 1500, 1300, 3560],
  rows: [
    new TableRow({
      tableHeader: true,
      children: [
        cell('#', { width: 600, shading: GRIS_HEADER, run: { bold: true } }),
        cell('Paso', { width: 2400, shading: GRIS_HEADER, run: { bold: true } }),
        cell('Quién', { width: 1500, shading: GRIS_HEADER, run: { bold: true } }),
        cell('Tiempo', { width: 1300, shading: GRIS_HEADER, run: { bold: true } }),
        cell('Detalle', { width: 3560, shading: GRIS_HEADER, run: { bold: true } })
      ]
    }),
    new TableRow({ children: [
      cell('1', { width: 600, run: { bold: true } }),
      cell('Diseñar la estructura', { width: 2400 }),
      cell('Yo (propongo) → Tú (apruebas)', { width: 1500 }),
      cell('5–15 min', { width: 1300 }),
      cell('# de lecciones, tiempos, hitos pedagógicos, audiencia, fuentes oficiales', { width: 3560 })
    ]}),
    new TableRow({ children: [
      cell('2', { width: 600, run: { bold: true } }),
      cell('Conseguir multimedia', { width: 2400 }),
      cell('Tú entregas archivos', { width: 1500 }),
      cell('depende', { width: 1300 }),
      cell('Copiar a 02-Plataforma-Web/<courseId>/videos/', { width: 3560 })
    ]}),
    new TableRow({ children: [
      cell('3', { width: 600, run: { bold: true } }),
      cell('Escribir el JSON', { width: 2400 }),
      cell('Yo', { width: 1500 }),
      cell('20–40 min', { width: 1300 }),
      cell('En 05-Generador-Cursos/borradores/<courseId>.json', { width: 3560 })
    ]}),
    new TableRow({ children: [
      cell('4', { width: 600, run: { bold: true } }),
      cell('Validar JSON', { width: 2400 }),
      cell('Yo', { width: 1500 }),
      cell('10 seg', { width: 1300 }),
      cell('python -c "import json; json.load(...)"', { width: 3560 })
    ]}),
    new TableRow({ children: [
      cell('5', { width: 600, run: { bold: true } }),
      cell('Generar HTML', { width: 2400 }),
      cell('Yo', { width: 1500 }),
      cell('5 seg', { width: 1300 }),
      cell('node 05-Generador-Cursos/build-course.js <courseId>', { width: 3560 })
    ]}),
    new TableRow({ children: [
      cell('6', { width: 600, run: { bold: true } }),
      cell('Generar preview PDF', { width: 2400 }),
      cell('Yo', { width: 1500 }),
      cell('1 min', { width: 1300 }),
      cell('node preview-course.js <courseId> + Chrome headless → PDF', { width: 3560 })
    ]}),
    new TableRow({ children: [
      cell('7', { width: 600, run: { bold: true } }),
      cell('Entregar PDF para revisión', { width: 2400 }),
      cell('—', { width: 1500 }),
      cell('—', { width: 1300 }),
      cell('Política registrada: siempre preview antes de publicar', { width: 3560 })
    ]}),
    new TableRow({ children: [
      cell('8', { width: 600, run: { bold: true } }),
      cell('Aplicar ajustes', { width: 2400 }),
      cell('Yo', { width: 1500 }),
      cell('varía', { width: 1300 }),
      cell('Editar JSON → rebuild → regenerar PDF', { width: 3560 })
    ]}),
    new TableRow({ children: [
      cell('9', { width: 600, run: { bold: true } }),
      cell('Verificar catálogo', { width: 2400 }),
      cell('Yo', { width: 1500 }),
      cell('10 seg', { width: 1300 }),
      cell('cursos.json se auto-actualiza, verificar orden manualmente', { width: 3560 })
    ]}),
    new TableRow({ children: [
      cell('10', { width: 600, run: { bold: true } }),
      cell('Commit + push', { width: 2400 }),
      cell('Yo', { width: 1500 }),
      cell('1 min', { width: 1300 }),
      cell('Mensaje descriptivo', { width: 3560 })
    ]}),
    new TableRow({ children: [
      cell('11', { width: 600, run: { bold: true } }),
      cell('Verificar deploy', { width: 2400 }),
      cell('Yo (con Monitor)', { width: 1500 }),
      cell('1–2 min', { width: 1300 }),
      cell('Pages redespliega y URL responde HTTP 200', { width: 3560 })
    ]}),
    new TableRow({ children: [
      cell('12', { width: 600, run: { bold: true } }),
      cell('Anunciar a piloto', { width: 2400 }),
      cell('Tú', { width: 1500 }),
      cell('—', { width: 1300 }),
      cell('Compartir URL del curso', { width: 3560 })
    ]})
  ]
});
content.push(tableCasoA);
content.push(p('', { spacing: { after: 100 } }));
content.push(p('Tiempo total para un curso simple: ~30–60 min de trabajo activo + tu revisión.', { size: 22, italics: true, color: GRIS_TEXTO }));

content.push(new Paragraph({ children: [new PageBreak()] }));

// --- Sección 3: Caso B ---
content.push(h1('3. Caso B — Crear un NIVEL completo'));
content.push(p('Mismo proceso que Caso A, pero con planificación previa de coherencia entre cursos del nivel.', { size: 22 }));

content.push(h2('3.1 Pasos extra al inicio'));
content.push(bullet('0a — Diseñar el nivel completo: # de cursos, agrupación de temas, secuencia, audiencia común.'));
content.push(bullet('0b — Documento de propuesta del nivel: PDF que liste los X cursos antes de empezar a escribir cada uno.'));
content.push(bullet('0c — Construir UN curso completo primero como "vertical slice" o prueba de concepto.'));
content.push(bullet('0d — Validar el primer curso con piloto antes de replicar el patrón a los demás.'));

content.push(h2('3.2 Pasos extra al final'));
content.push(bullet('Z1 — Cross-references entre cursos: cada curso del nivel debe mencionar correctamente a los otros.'));
content.push(bullet('Z2 — Hooks pedagógicos: si Curso N produce un dato que Curso N+1 lee, garantizar la integración técnica.'));
content.push(bullet('Z3 — Actualizar INDICE-PROYECTO.md y Plan-de-Formacion-Linea-Politica-de-Adultos.docx.'));
content.push(bullet('Z4 — Auditoría completa con el trigger "revisa completo el codigo" después de tener el nivel completo.'));

content.push(new Paragraph({ children: [new PageBreak()] }));

// --- Sección 4: Casos especiales ---
content.push(h1('4. Casos especiales'));

content.push(h2('4.1 C1 — Tipo de sección NUEVO'));
content.push(p('Ejemplos del proyecto: photo-upload (Curso 1), self-assessment (Curso 4), plan-builder (Curso 5).', { size: 22 }));
content.push(bullet('C1.1 — Diseñar el tipo: qué inputs acepta, cómo se renderiza, dónde guarda datos.'));
content.push(bullet('C1.2 — Agregarlo al renderer en build-course.js (nuevo case "tipo").'));
content.push(bullet('C1.3 — Agregarlo al schema (course-schema.json, enum de tipos).'));
content.push(bullet('C1.4 — Agregar render placeholder en preview-course.js (versión visible para PDF).'));
content.push(bullet('C1.5 — Agregar handlers JS en templates/engine.js (si es interactivo).'));
content.push(bullet('C1.6 — Agregar CSS en templates/styles.css.'));
content.push(bullet('C1.7 — Documentar en SKILL.md (tabla de tipos disponibles).'));
content.push(bullet('C1.8 — Rebuild masivo de TODOS los cursos (porque engine.js se inlinea en cada HTML).'));

content.push(h2('4.2 C2 — Endpoint NUEVO en el backend'));
content.push(p('Ejemplos: /stats, /recover, /verify, o uno futuro como /data para el detalle del dashboard.', { size: 22 }));
content.push(bullet('C2.1 — Diseñar el endpoint: qué request, qué response.'));
content.push(bullet('C2.2 — Agregar el case en doGet o doPost de google-apps-script.js.'));
content.push(bullet('C2.3 — Implementar el handler en el mismo archivo.'));
content.push(bullet('C2.4 — Sincronizar al GAS: copiar a .clasp-workspace/Código.js + clasp push --force.'));
content.push(bullet('C2.5 — Probar el endpoint con curl o desde el frontend.'));
content.push(bullet('C2.6 — Si es para dashboard u otra UI: actualizar el frontend para consumirlo.'));

content.push(h2('4.3 C3 — Curso del Nivel 3 (por cargo específico)'));
content.push(bullet('C3.1 — Identificar las competencias específicas del cargo (Diccionario de Competencias, PNAM Doc 3).'));
content.push(bullet('C3.2 — Tomar las funciones del cargo del Manual de Cargos (PNAM Doc 4).'));
content.push(bullet('C3.3 — Una lección por competencia específica (típicamente 2–4 competencias por cargo).'));
content.push(bullet('C3.4 — Caso real / ejemplo de grupo: cómo se vive ese cargo en un consejo concreto.'));

content.push(h2('4.4 C4 — Curso transversal (Nivel 4)'));
content.push(bullet('C4.1 — Verificar si OMMS / WOSM tiene material oficial (Safe from Harm sí lo tiene).'));
content.push(bullet('C4.2 — Tomar el documento oficial PNAM correspondiente (Doc 21 para Motivación, Docs 22-23 para SFH).'));
content.push(bullet('C4.3 — Considerar si requiere certificación adicional (SFH puede tener requisitos del nivel mundial).'));
content.push(bullet('C4.4 — No conectar a otros cursos (transversales son standalone).'));

content.push(new Paragraph({ children: [new PageBreak()] }));

// --- Sección 5: Checklist ---
content.push(h1('5. Checklist final antes de publicar'));
content.push(p('Independiente del caso, antes de declarar un curso listo:', { size: 22 }));

const checklist = [
  'JSON valida sintácticamente: python -c "import json; json.load(...)"',
  'HTML generado más reciente que el JSON fuente (build limpio)',
  'Preview PDF aprobado por el dueño del proyecto',
  'Si hubo tipo de sección nuevo → renderer + schema + preview + engine + CSS + SKILL.md actualizados',
  'Si hubo endpoint nuevo → clasp push realizado y verificado',
  'Cross-references entre cursos consistentes (Curso N apunta a Curso N+1 correcto)',
  'cursos.json con orden correcto y status active',
  'Commit con mensaje descriptivo',
  'Push a GitHub',
  'GitHub Pages redespliega (verificar HTTP 200 en URL pública)',
  'INDICE-PROYECTO.md actualizado si cambia el alcance del proyecto',
  'Plan-de-Formacion-Linea-Politica-de-Adultos.docx actualizado si cambia la roadmap',
  'Auditoría (trigger "revisa completo el codigo") si fueron cambios sustanciales'
];
checklist.forEach(item => content.push(new Paragraph({
  children: [
    new TextRun({ text: '☐ ', size: 24, bold: true, color: MORADO }),
    new TextRun({ text: item, size: 22 })
  ],
  spacing: { after: 100 },
  indent: { left: 360 }
})));

content.push(new Paragraph({ children: [new PageBreak()] }));

// --- Sección 6: Filosofía ---
content.push(h1('6. Filosofía de diseño'));
content.push(new Paragraph({
  children: [new TextRun({
    text: 'Toda la inteligencia está en el JSON del curso.',
    size: 26, bold: true, color: MORADO
  })],
  spacing: { after: 200 }
}));
content.push(p('Si quieres editar la lección 3 del Curso 1, solo abres borradores/bienvenida-adultos.json, encuentras el módulo, cambias el texto, guardas, rebuild, push. NO se tocan los HTML directamente jamás.', { size: 22 }));
content.push(p('Los HTMLs en 02-Plataforma-Web/ son artefactos generados — si los editas a mano, el próximo rebuild los pisa y pierdes los cambios. El JSON es la fuente de verdad.', { size: 22 }));

content.push(h2('6.1 Implicaciones'));
content.push(bullet('Cambios pequeños son baratos — editar un quiz son 30 segundos: editar JSON + 1 build + push.'));
content.push(bullet('Cambios visuales globales son baratos — templates/styles.css afecta a todos al rebuild.'));
content.push(bullet('El motor de comportamiento es centralizado — engine.js se inlinea en cada curso, así que actualizarlo y rebuild propaga el cambio a todos.'));
content.push(bullet('El backend está separado del frontend — el backend (Apps Script) puede actualizarse sin tocar el frontend, vía clasp push.'));

content.push(new Paragraph({ children: [new PageBreak()] }));

// --- Sección 7: Tabla de referencia rápida ---
content.push(h1('7. Tabla de referencia rápida'));

const tableRef = new Table({
  width: { size: 9360, type: WidthType.DXA },
  columnWidths: [4200, 5160],
  rows: [
    new TableRow({
      tableHeader: true,
      children: [
        cell('Para…', { width: 4200, shading: GRIS_HEADER, run: { bold: true } }),
        cell('Tocas…', { width: 5160, shading: GRIS_HEADER, run: { bold: true } })
      ]
    }),
    new TableRow({ children: [
      cell('Cambiar contenido de un curso', { width: 4200 }),
      cell('Solo el JSON en borradores/ + rebuild', { width: 5160 })
    ]}),
    new TableRow({ children: [
      cell('Cambiar apariencia de TODOS los cursos', { width: 4200 }),
      cell('templates/styles.css + rebuild de todos', { width: 5160 })
    ]}),
    new TableRow({ children: [
      cell('Cambiar comportamiento JS de TODOS los cursos', { width: 4200 }),
      cell('templates/engine.js + rebuild de todos', { width: 5160 })
    ]}),
    new TableRow({ children: [
      cell('Agregar un tipo nuevo de sección', { width: 4200 }),
      cell('build-course.js + course-schema.json + engine.js + styles.css + SKILL.md + preview-course.js', { width: 5160 })
    ]}),
    new TableRow({ children: [
      cell('Cambiar lógica del backend', { width: 4200 }),
      cell('google-apps-script.js + clasp push', { width: 5160 })
    ]}),
    new TableRow({ children: [
      cell('Cambiar catálogo de cursos', { width: 4200 }),
      cell('02-Plataforma-Web/cursos.json (auto-actualizado al hacer build, pero verificar orden manualmente)', { width: 5160 })
    ]}),
    new TableRow({ children: [
      cell('Generar plan de formación Word', { width: 4200 }),
      cell('node generar-plan-formacion.js', { width: 5160 })
    ]}),
    new TableRow({ children: [
      cell('Generar este manual en Word', { width: 4200 }),
      cell('node generar-manual-crear-curso.js', { width: 5160 })
    ]}),
    new TableRow({ children: [
      cell('Auditoría completa del código', { width: 4200 }),
      cell('Trigger "revisa completo el codigo" → ejecutar AUDITORIA.md', { width: 5160 })
    ]})
  ]
});
content.push(tableRef);

content.push(p('', { spacing: { after: 600 } }));
content.push(new Paragraph({
  alignment: AlignmentType.CENTER,
  children: [new TextRun({ text: '— Fin del manual —', size: 20, italics: true, color: '888888' })]
}));

// ============================================================================
// CONFIGURACION DEL DOCUMENTO
// ============================================================================

const doc = new Document({
  creator: 'Plataforma de Formación de Adultos ASC',
  title: 'Manual: Cómo Crear un Curso o Nivel',
  description: 'Manual operativo para crear cursos en la Plataforma de Formación de Adultos ASC',
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
            text: 'Manual: Cómo Crear un Curso · Plataforma de Adultos ASC',
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

const OUT = path.join(
  'C:\\Users\\Principal\\Documents\\APP APRENDIZAJE\\APP PARA APRENDIZAJE\\INDUCCION-ADULTOS',
  'Manual-Crear-Curso.docx'
);

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync(OUT, buf);
  const sz = (fs.statSync(OUT).size / 1024).toFixed(1);
  console.log('OK ' + sz + ' KB -> ' + OUT);
}).catch(err => {
  console.error('ERROR: ' + err.message);
  process.exit(1);
});
