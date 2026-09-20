// render.plan-builder.js — renderizador COMPARTIDO del componente plan-builder.
//
// POR QUE EXISTE (ADR-034, Fase 1 parte B):
// El plan-builder estaba escrito dentro del build-course.js de cada linea, con su
// vocabulario cocido en el codigo: "Selecciona 2 a 3 competencias... Curso 4" en
// Politica de Adultos, y ese mismo texto copiado tal cual a Programa de Jovenes, donde
// el ejercicio es sobre las 6 areas de crecimiento del joven. Llego a publicarse.
//
// REGLA DE ESTE ARCHIVO: no contiene ninguna palabra de dominio. Todo lo que el
// estudiante lee y que pertenece a un plano (competencia / area de crecimiento /
// grado / Curso N / Asesor Personal...) viene de `section.labels`, que escribe el
// autor del curso en su JSON — el archivo que la auditoria doctrinal SI lee. Si un
// plan-builder no trae sus labels, el build falla: no hay defaults con vocabulario.
//
// Vive en _MOTOR/ (fuente unica) y sincronizar-motor.py lo copia a
// <linea>/05-Generador-Cursos/templates/. NO editar la copia de una linea.
'use strict';

// Etiquetas que DEBEN venir del curso: todas llevan vocabulario del plano.
const OBLIGATORIAS = [
  'intro',            // parrafo de instruccion (puede llevar <strong>)
  'placeholderMeta',  // ejemplo de meta
  'botonGenerar',     // texto del boton principal
  'titulo',           // titulo del plan generado
  'cierre',           // nota final bajo el plan generado
  'avisoMinimo',      // aviso si faltan elementos por seleccionar
  'avisoCampos',      // aviso si hay campos vacios
];

// Rotulos genericos (sin plano): el curso puede sobreescribirlos si quiere.
const GENERICAS = {
  campoMeta: '🎯 Meta concreta (qué quieres lograr)',
  campoPlazo: '⏰ Plazo (en cuánto tiempo)',
  campoRecursos: '📚 Recursos (cómo lo vas a desarrollar)',
  campoCompromiso: '💚 Mi compromiso personal con este plan',
  placeholderPlazo: 'Ej: 6 meses',
  placeholderRecursos: '',
  placeholderCompromiso: '',
  subtituloPrioridades: 'Mis prioridades',
  minimo: 1,
};

function escaparAtributo(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

function renderPlanBuilder(section) {
  const pbId = section.builderId || 'plan-personal';
  const labels = section.labels || {};
  const faltan = OBLIGATORIAS.filter((k) => labels[k] === undefined || labels[k] === '');
  if (faltan.length) {
    throw new Error(
      `plan-builder "${pbId}": faltan labels obligatorias en el JSON del curso: ${faltan.join(', ')}.\n` +
      `  Este componente no trae textos por defecto a proposito (ADR-034): el vocabulario\n` +
      `  del plano lo declara el curso, no el motor.`
    );
  }
  const L = Object.assign({}, GENERICAS, labels);

  // "elementos" y no el nombre del plano: hasta un identificador viaja por copia, y la
  // compuerta de lexico de PJ lo delato en la primera corrida.
  const elementos = (section.competences || []).map((c) =>
    `<div class="pb-competence" data-competence="${c.id}">
                    <label class="pb-comp-header">
                        <input type="checkbox" class="pb-comp-check" data-competence="${c.id}" data-name="${escaparAtributo(c.name)}" onchange="togglePlanCompetence('${pbId}', '${c.id}')">
                        <span class="pb-comp-name">${c.name}</span>
                        <span class="pb-comp-grade" id="pb-grade-${c.id}"></span>
                    </label>
                    <div class="pb-comp-fields hidden" id="pb-fields-${c.id}">
                        <label class="pb-field-label">${L.campoMeta}</label>
                        <textarea class="pb-field-meta" data-competence="${c.id}" aria-label="Meta concreta para ${escaparAtributo(c.name)}" placeholder="${escaparAtributo(L.placeholderMeta)}" onchange="savePlanField('${pbId}', '${c.id}', 'meta', this.value)"></textarea>
                        <label class="pb-field-label">${L.campoPlazo}</label>
                        <input type="text" class="pb-field-plazo" data-competence="${c.id}" aria-label="Plazo para ${escaparAtributo(c.name)}" placeholder="${escaparAtributo(L.placeholderPlazo)}" onchange="savePlanField('${pbId}', '${c.id}', 'plazo', this.value)">
                        <label class="pb-field-label">${L.campoRecursos}</label>
                        <textarea class="pb-field-recursos" data-competence="${c.id}" aria-label="Recursos para ${escaparAtributo(c.name)}" placeholder="${escaparAtributo(L.placeholderRecursos)}" onchange="savePlanField('${pbId}', '${c.id}', 'recursos', this.value)"></textarea>
                    </div>
                </div>`
  ).join('');

  // Solo las lineas que consumen un perfil (lo declaran con botonPerfil) llevan el
  // banner: initPlanBuilders lo busca por id y solo existe en la extension de esa linea.
  const banner = L.botonPerfil ? `<div class="pb-profile-banner" id="pb-profile-${pbId}"></div>\n                    ` : '';
  const botonPerfil = L.botonPerfil
    ? `\n                        <button type="button" class="btn-secondary" onclick="loadProfileIntoPlan('${pbId}')">${L.botonPerfil}</button>`
    : '';

  // Las etiquetas que necesita el motor en tiempo de ejecucion (generatePlan) viajan
  // en el HTML como JSON: asi el nucleo compartido no tiene que conocerlas.
  const runtime = {
    minimo: Number(L.minimo) || 1,
    avisoMinimo: L.avisoMinimo,
    avisoCampos: L.avisoCampos,
    titulo: L.titulo,
    subtituloPrioridades: L.subtituloPrioridades,
    cierre: L.cierre,
  };

  // Los rotulos de los tres campos y el del compromiso viajan tambien al runtime, o lo
  // que se IMPRIME dice otra cosa que la PANTALLA donde se escribio (19-sep-2026,
  // hallazgo H4 de una auditoria pedagogica y M4 de la doctrinal, que coincidieron):
  // generatePlan los llevaba cocidos y no miraba estas labels.
  // Solo se envian si el curso los DECLARO. Si no, generatePlan imprime su rotulo
  // generico corto y el plan sale identico al de siempre: el default del formulario
  // trae ademas la ayuda entre parentesis ("...que quieres lograr"), que es una
  // instruccion para rellenar, no un titulo para el papel.
  ['campoMeta', 'campoPlazo', 'campoRecursos', 'campoCompromiso'].forEach((k) => {
    if (labels[k]) runtime[k] = labels[k];
  });
  const runtimeJson = JSON.stringify(runtime).replace(/</g, '\\u003c');

  return `<div class="plan-builder" id="pb-${pbId}" data-minimo="${runtime.minimo}">
                    <script type="application/json" id="pb-labels-${pbId}">${runtimeJson}</script>
                    ${banner}<p class="pb-intro">${L.intro}</p>
                    <div class="pb-competences">${elementos}</div>
                    <div class="pb-commitment-block">
                        <label class="pb-field-label pb-commitment-label">${L.campoCompromiso}</label>
                        <textarea id="pb-commitment-${pbId}" class="pb-commitment" aria-label="Mi compromiso personal con este plan" placeholder="${escaparAtributo(L.placeholderCompromiso)}" onchange="savePlanCommitment('${pbId}', this.value)"></textarea>
                    </div>
                    <div class="pb-actions">
                        <button type="button" class="btn-primary" onclick="generatePlan('${pbId}')">${L.botonGenerar}</button>${botonPerfil}
                    </div>
                    <div id="pb-output-${pbId}" class="pb-output hidden"></div>
                </div>`;
}

module.exports = renderPlanBuilder;
module.exports.OBLIGATORIAS = OBLIGATORIAS;
