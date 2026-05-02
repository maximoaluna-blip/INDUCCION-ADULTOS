#!/usr/bin/env node
// ============================================
// PREVIEW-COURSE.JS - Genera documento visual de preview del curso
// Uso: node preview-course.js <nombre-curso>
// Produce un HTML full-color con todas las pantallas del curso
// para revision antes de publicar. Abrir en Chrome → Imprimir → PDF.
// Sin dependencias externas — solo modulos nativos de Node.js
// ============================================

const fs = require('fs');
const path = require('path');

const BASE_DIR = __dirname;
const BORRADORES_DIR = path.join(BASE_DIR, 'borradores');
const TEMPLATES_DIR = path.join(BASE_DIR, 'templates');
const PREVIEW_DIR = path.join(BASE_DIR, 'previews');

const courseName = process.argv[2];
if (!courseName) {
    console.error('❌ Uso: node preview-course.js <nombre-curso>');
    console.error('   Ejemplo: node preview-course.js caracteristicas-educativas');
    console.error('\n   Cursos disponibles en borradores/:');
    try {
        const files = fs.readdirSync(BORRADORES_DIR).filter(f => f.endsWith('.json'));
        files.forEach(f => console.error('   - ' + f.replace('.json', '')));
    } catch (e) { console.error('   (ninguno)'); }
    process.exit(1);
}

const jsonPath = path.join(BORRADORES_DIR, courseName + '.json');
if (!fs.existsSync(jsonPath)) {
    console.error('❌ No se encontró: ' + jsonPath);
    process.exit(1);
}

const course = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
const cssContent = fs.readFileSync(path.join(TEMPLATES_DIR, 'styles.css'), 'utf-8');
console.log('📖 Generando preview de: ' + course.title);

// --- Departamentos colombianos (para form preview) ---
const DEPARTAMENTOS = [
    'Amazonas', 'Antioquia', 'Arauca', 'Atlántico', 'Bogotá D.C.', 'Bolívar',
    'Boyacá', 'Caldas', 'Caquetá', 'Casanare', 'Cauca', 'Cesar', 'Chocó',
    'Córdoba', 'Cundinamarca', 'Guainía', 'Guaviare', 'Huila', 'La Guajira',
    'Magdalena', 'Meta', 'Nariño', 'Norte de Santander', 'Putumayo', 'Quindío',
    'Risaralda', 'San Andrés y Providencia', 'Santander', 'Sucre', 'Tolima',
    'Valle del Cauca', 'Vaupés', 'Vichada'
];

// --- Renderers (reutilizados de build-course.js) ---
function renderSection(section) {
    switch (section.type) {
        case 'paragraph':
            return `<p>${section.text}</p>`;
        case 'heading':
            return `<h${section.level || 3}>${section.text}</h${section.level || 3}>`;
        case 'info-box':
            return `<div class="info-box">${section.text}</div>`;
        case 'mission-box':
            return `<div class="mission-box">${section.text}</div>`;
        case 'blockquote':
            return `<blockquote style="font-size: 1.1rem; font-style: italic; text-align: center; margin: 20px 0; color: #1a4b6b;">${section.text}</blockquote>`;
        case 'list':
            const tag = section.ordered ? 'ol' : 'ul';
            const items = section.items.map(item => `<li>${item}</li>`).join('\n');
            return `<${tag}>${items}</${tag}>`;
        case 'timeline':
            const tItems = section.items.map(item => {
                let sub = '';
                if (item.subitems) {
                    sub = '<ul>' + item.subitems.map(s => `<li>${s}</li>`).join('') + '</ul>';
                }
                return `<div class="timeline-item"><h4>${item.title}</h4><p>${item.description}</p>${sub}</div>`;
            }).join('');
            return `<div class="timeline">${tItems}</div>`;
        case 'method-grid':
            const mItems = section.items.map(item => {
                const bg = item.color || '#f5f5f5';
                const bc = item.borderColor || '#ddd';
                return `<div class="method-element" style="background: linear-gradient(135deg, ${bg}, ${bg}dd); border-color: ${bc};"><h4>${item.title}</h4><p>${item.description}</p></div>`;
            }).join('');
            return `<div class="method-elements">${mItems}</div>`;
        case 'course-objectives':
            return `<h3>🎯 Objetivos del Curso</h3>\n` + renderSection({ type: 'list', ordered: false, items: section.items });
        case 'video':
            const cap = section.caption || '';
            return `<div class="video-placeholder" style="margin:20px 0;background:#1a1a1a;color:#fff;border-radius:8px;padding:30px;text-align:center;border:2px dashed #622599;">
                    <div style="font-size:3em;margin-bottom:8px;">🎬</div>
                    <div style="font-weight:600;margin-bottom:6px;">Video</div>
                    <div style="font-size:0.85em;color:#ccc;margin-bottom:6px;font-family:monospace;">${section.src}</div>
                    ${cap ? `<div style="font-style:italic;color:#aaa;font-size:0.9em;">${cap}</div>` : ''}
                </div>`;
        case 'policy-quote':
            const pqLab = section.label || '📋 Cita oficial';
            const pqSrc = section.source || '';
            return `<div class="policy-quote-preview" style="margin:16px 0;border-left:4px solid #622599;background:#f8f5fc;padding:14px 18px;border-radius:4px;">
                    <div style="font-weight:600;color:#622599;font-size:0.9em;margin-bottom:8px;">${pqLab}</div>
                    <blockquote style="font-style:italic;color:#333;margin:0;font-size:0.95em;line-height:1.6;">${section.text}</blockquote>
                    ${pqSrc ? `<p style="font-size:0.8em;color:#888;margin:8px 0 0 0;text-align:right;">— ${pqSrc}</p>` : ''}
                </div>`;
        case 'photo-upload':
            return `<div class="photo-upload-preview" style="margin:20px 0;background:#f8f5fc;border:2px dashed #622599;border-radius:8px;padding:24px;text-align:center;">
                    <div style="font-size:2.5em;margin-bottom:8px;">📷</div>
                    <div style="font-weight:600;color:#622599;margin-bottom:6px;">${section.prompt || 'Subir imagen'}</div>
                    <div style="font-size:0.9em;color:#666;margin-bottom:10px;">${section.hint || 'Zona de subida de foto'}</div>
                    <div style="font-size:0.85em;color:#888;font-style:italic;">[En el curso real, aparece un botón para subir desde el dispositivo, una vista previa y opciones de descargar/quitar]</div>
                </div>`;
        case 'plan-builder':
            const pbComps = (section.competences || []).map(c =>
                `<div style="margin:8px 0;padding:10px;background:#fff;border-left:3px solid #622599;border-radius:4px;font-size:0.85em;">
                    <div style="font-weight:600;color:#622599;">☐ ${c.name}</div>
                    <div style="font-size:0.85em;color:#666;margin-top:4px;font-style:italic;">[Si selecciona: 3 campos — Meta · Plazo · Recursos]</div>
                </div>`
            ).join('');
            return `<div class="plan-builder-preview" style="margin:20px 0;background:#f8f5fc;border:2px solid #622599;border-radius:8px;padding:18px;">
                    <div style="font-weight:600;color:#622599;font-size:1em;margin-bottom:6px;">📋 Constructor de Plan Personal interactivo</div>
                    <p style="font-size:0.9em;color:#555;margin:0 0 12px 0;">El estudiante selecciona 2-3 competencias (las áreas de oportunidad del Curso 3 vienen pre-seleccionadas), escribe meta, plazo y recursos por cada una, y un compromiso general. Botón "Generar mi Plan" produce vista imprimible.</p>
                    <div>${pbComps}</div>
                    <div style="margin-top:12px;padding:10px;background:#fff;border-radius:4px;font-size:0.85em;color:#666;font-style:italic;">[Compromiso general] [Generar mi Plan Personal] [Cargar perfil del Curso 3]</div>
                </div>`;
        case 'self-assessment':
            const saComps = (section.competences || []).map((c, idx) => {
                const grades = (c.grades || []).map(g => `<li><strong>Grado ${g.level}:</strong> ${g.criterion}</li>`).join('');
                return `<div style="margin:14px 0;padding:12px;background:#fff;border-radius:6px;">
                    <h4 style="color:#622599;margin:0 0 4px 0;">${idx + 1}. ${c.name}</h4>
                    <p style="font-size:0.85em;color:#666;margin:0 0 8px 0;font-style:italic;">${c.definition || ''}</p>
                    <ul style="margin:0;padding-left:20px;font-size:0.85em;">${grades}</ul>
                </div>`;
            }).join('');
            return `<div class="self-assessment-preview" style="margin:20px 0;background:#f8f5fc;border:2px solid #622599;border-radius:8px;padding:18px;">
                    <div style="font-weight:600;color:#622599;font-size:1em;margin-bottom:6px;">📊 Autodiagnóstico interactivo</div>
                    <p style="font-size:0.9em;color:#555;margin:0 0 12px 0;">${section.intro || 'El estudiante elige su grado en cada competencia.'}</p>
                    ${saComps}
                    <div style="margin-top:14px;padding:12px;background:#fff3e0;border-radius:6px;font-size:0.85em;color:#666;font-style:italic;">[En el curso real: el estudiante selecciona su grado en cada competencia, y al hacer click en "Calcular mi perfil" obtiene visualmente sus 3 fortalezas y 3 áreas de oportunidad. El resultado se guarda y queda disponible para el Curso 4.]</div>
                </div>`;
        default:
            return `<p>${section.text || ''}</p>`;
    }
}

// --- Build cover page ---
function buildCoverPage(course) {
    const date = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
    return `
    <div class="preview-page cover-page">
        <div class="cover-content">
            <div class="cover-logos">
                <div class="cover-logo-placeholder">ASC</div>
                <div class="cover-separator"></div>
                <div class="cover-logo-placeholder">VALLE</div>
            </div>
            <div class="cover-icon">${course.icon}</div>
            <h1 class="cover-title">${course.title}</h1>
            <p class="cover-subtitle">${course.subtitle || 'Formación de Adultos Voluntarios — Asociación Scouts de Colombia'}</p>
            <div class="cover-divider"></div>
            <p class="cover-description">${course.description}</p>
            <div class="cover-meta">
                <div class="cover-meta-item">
                    <span class="cover-meta-icon">⏱️</span>
                    <span>Duración: ${course.duration}</span>
                </div>
                <div class="cover-meta-item">
                    <span class="cover-meta-icon">📊</span>
                    <span>${course.totalContentModules} módulos de contenido</span>
                </div>
                <div class="cover-meta-item">
                    <span class="cover-meta-icon">🧪</span>
                    <span>${course.modules.filter(m => m.quiz).length} evaluaciones</span>
                </div>
                <div class="cover-meta-item">
                    <span class="cover-meta-icon">🏆</span>
                    <span>${course.achievements.length} logros desbloqueables</span>
                </div>
            </div>
            <div class="cover-footer">
                <p><strong>DOCUMENTO DE PREVIEW</strong></p>
                <p>Generado el ${date}</p>
                <p style="margin-top: 10px; font-size: 0.85em; color: #999;">
                    Plataforma de Formación de Adultos — Asociación Scouts de Colombia
                </p>
            </div>
        </div>
    </div>`;
}

// --- Build TOC page ---
function buildTOCPage(course) {
    const certModuleId = course.modules[course.modules.length - 1].id + 1;
    let contentIdx = 0;

    const rows = [];
    rows.push({ emoji: '📝', title: 'Registro al Curso', type: 'Formulario', page: 'Pantalla 1' });

    course.modules.forEach(mod => {
        if (mod.isIntro) {
            rows.push({ emoji: mod.emoji, title: mod.title, type: 'Bienvenida', page: `Pantalla 2` });
        } else {
            contentIdx++;
            const hasQuiz = mod.quiz ? '✅' : '—';
            const hasReflection = mod.reflection ? '✅' : '—';
            rows.push({
                emoji: mod.emoji,
                title: `Módulo ${contentIdx}: ${mod.title}`,
                type: `Quiz: ${hasQuiz} | Reflexión: ${hasReflection}`,
                page: `Pantalla ${contentIdx + 2}`
            });
        }
    });

    rows.push({ emoji: '🏆', title: 'Certificado de Completación', type: 'Certificado + Logros', page: `Pantalla ${rows.length + 1}` });

    const tableRows = rows.map(r =>
        `<tr><td style="font-size:1.3em;">${r.emoji}</td><td><strong>${r.title}</strong></td><td>${r.type}</td><td style="text-align:center;">${r.page}</td></tr>`
    ).join('');

    const achList = course.achievements.map(a =>
        `<span class="toc-achievement">${a.emoji} ${a.name} <small>(módulo ${a.unlockOnModule})</small></span>`
    ).join('');

    return `
    <div class="preview-page toc-page">
        <h2 class="screen-label">📑 Tabla de Contenidos</h2>
        <table class="toc-table">
            <thead><tr><th></th><th>Pantalla</th><th>Contenido</th><th>Referencia</th></tr></thead>
            <tbody>${tableRows}</tbody>
        </table>

        <h3 style="margin-top: 30px; color: #622599;">🏆 Logros del Curso</h3>
        <div class="toc-achievements">${achList}</div>

        <h3 style="margin-top: 30px; color: #622599;">📜 Certificado</h3>
        <div class="info-box">
            <strong>${course.certificate.courseName}</strong><br>
            ${course.certificate.description}
        </div>
    </div>`;
}

// --- Build registration screen ---
function buildRegistrationScreen(course) {
    const deptOptions = DEPARTAMENTOS.slice(0, 5).map(d => `<option>${d}</option>`).join('') + '<option>...</option>';

    return `
    <div class="preview-page">
        <div class="screen-label">📝 PANTALLA 1: Registro al Curso</div>
        <div class="screen-frame">
            <div class="screen-header">
                <div class="screen-topbar">
                    <span class="screen-topbar-logos">🏕️ ASC | VALLE</span>
                    <span class="screen-topbar-link">← Volver al catálogo</span>
                </div>
                <div class="header">
                    <h1>${course.icon} ${course.title}</h1>
                    <p>${course.subtitle || 'Formación de Adultos Voluntarios — Asociación Scouts de Colombia'}</p>
                    <div class="progress-container"><div class="progress-bar" style="width: 0%;"></div><div class="progress-text">0%</div></div>
                </div>
            </div>
            <div class="screen-body">
                <h2>📝 Registro al Curso</h2>
                <div class="info-box">
                    <strong>🎯 Objetivo del Curso:</strong><br>
                    ${course.description}
                </div>
                <div class="preview-form">
                    <div class="form-group"><label>Nombre Completo *</label><input type="text" placeholder="Ej: Juan Carlos Pérez Gómez" disabled></div>
                    <div class="form-group"><label>Edad</label><input type="number" placeholder="Ej: 19" disabled></div>
                    <div class="form-group"><label>Grupo Scout</label><input type="text" placeholder="Ej: Grupo Scout 25" disabled></div>
                    <div class="form-group"><label>Región/Departamento</label><select disabled><option>Seleccionar...</option>${deptOptions}</select></div>
                    <div class="form-group"><label>Correo Electrónico</label><input type="email" placeholder="Ej: juan.perez@email.com" disabled></div>
                    <div class="form-group"><label>¿Cuál es tu motivación para participar en el movimiento como adulto voluntario?</label><textarea placeholder="Describe brevemente tu motivación..." disabled></textarea></div>
                    <div style="text-align: center; margin-top: 20px;">
                        <button class="btn" disabled style="font-size: 1.1rem; padding: 15px 30px;">🚀 Comenzar Curso</button>
                    </div>
                </div>
                <div class="data-privacy">
                    <h4>📊 Información sobre tus datos</h4>
                    <p>Este curso guarda tu progreso localmente y en Google Sheets para verificación de certificados.</p>
                </div>
            </div>
        </div>
    </div>`;
}

// --- Build module screen ---
function buildModuleScreen(mod, course, contentIndex, totalContent, screenNumber) {
    const badge = mod.isIntro ? '' : `<div class="badge">Módulo ${contentIndex}/${totalContent}</div>`;
    const sectionsHtml = mod.sections.map(s => renderSection(s)).join('\n');

    let introExtras = '';
    if (mod.isIntro) {
        const achHtml = course.achievements.map(a =>
            `<div class="achievement">${a.emoji} ${a.name}</div>`
        ).join('');

        introExtras = `
            <h3>🏆 Logros por Desbloquear</h3>
            <div class="achievements">${achHtml}</div>
            <div class="stats">
                <div class="stat-card"><h4>0</h4><p>Módulos Completados</p></div>
                <div class="stat-card"><h4>0</h4><p>Evaluaciones Aprobadas</p></div>
                <div class="stat-card"><h4>0</h4><p>Minutos de Estudio</p></div>
            </div>
            <button class="btn" disabled>🚀 Comenzar el Curso</button>`;
    }

    let reflectionHtml = '';
    if (mod.reflection) {
        reflectionHtml = `
            <div class="reflection-area">
                <h4>🤔 Reflexión Personal</h4>
                <p>${mod.reflection.prompt}</p>
                <textarea placeholder="Escribe tu reflexión aquí..." disabled></textarea>
            </div>`;
    }

    let quizHtml = '';
    if (mod.quiz) {
        let qNum = 0;
        const questionsHtml = mod.quiz.questions.map((q, qi) => {
            qNum++;
            const correctIdx = q.correctIndex;
            const optionsHtml = q.options.map((opt, oi) => {
                const isCorrect = oi === correctIdx;
                const marker = isCorrect ? ' ✅' : '';
                const cls = isCorrect ? ' style="border: 2px solid #4caf50; background: #e8f5e9;"' : '';
                return `<label class="option"${cls}><input type="radio" disabled> ${opt}${marker}</label>`;
            }).join('');
            return `<div class="question"><h4>${qNum}. ${q.text}</h4>${optionsHtml}</div>`;
        }).join('');

        quizHtml = `
            <div class="quiz-container">
                <h3>🧪 ${mod.quiz.title}</h3>
                <div class="preview-note">Las respuestas correctas están marcadas con ✅ y borde verde para revisión.</div>
                ${questionsHtml}
                <button class="btn" disabled>Verificar Respuestas</button>
                <button class="btn hidden-preview" disabled>${mod.quiz.nextLabel || 'Continuar ➡️'}</button>
            </div>`;
    }

    const moduleLabel = mod.isIntro ? 'Bienvenida' : `Módulo ${contentIndex}: ${mod.title}`;
    const progress = mod.isIntro ? 0 : Math.round((contentIndex / totalContent) * 100);

    return `
    <div class="preview-page">
        <div class="screen-label">${mod.emoji} PANTALLA ${screenNumber}: ${moduleLabel}</div>
        <div class="screen-frame">
            <div class="screen-header">
                <div class="screen-topbar">
                    <span class="screen-topbar-logos">🏕️ ASC | VALLE</span>
                    <span class="screen-topbar-link">← Volver al catálogo</span>
                </div>
                <div class="header">
                    <h1>${course.icon} ${course.title}</h1>
                    <p>${course.subtitle || 'Formación de Adultos Voluntarios — Asociación Scouts de Colombia'}</p>
                    <div class="progress-container"><div class="progress-bar" style="width: ${progress}%;"></div><div class="progress-text">${progress}%</div></div>
                </div>
            </div>
            <div class="screen-body">
                <h2>${mod.emoji} ${mod.title}</h2>
                ${badge}
                ${sectionsHtml}
                ${introExtras}
                ${reflectionHtml}
                ${quizHtml}
            </div>
        </div>
    </div>`;
}

// --- Build certificate screen ---
function buildCertificateScreen(course, screenNumber) {
    const achHtml = course.achievements.map(a =>
        `<div class="achievement earned">${a.emoji} ${a.name}</div>`
    ).join('');

    return `
    <div class="preview-page">
        <div class="screen-label">🏆 PANTALLA ${screenNumber}: Certificado de Completación</div>
        <div class="screen-frame">
            <div class="screen-header">
                <div class="screen-topbar">
                    <span class="screen-topbar-logos">🏕️ ASC | VALLE</span>
                    <span class="screen-topbar-link">← Volver al catálogo</span>
                </div>
                <div class="header">
                    <h1>${course.icon} ${course.title}</h1>
                    <div class="progress-container"><div class="progress-bar" style="width: 100%;"></div><div class="progress-text">100%</div></div>
                </div>
            </div>
            <div class="screen-body">
                <div class="certificate">
                    <h2>🏆 ¡FELICITACIONES!</h2>
                    <h3>Certificado de Completación</h3>
                    <h2 style="color: #1a4b6b; margin: 20px 0;">${course.certificate.courseName}</h2>
                    <p style="font-size: 1.1rem; margin: 20px 0;">Certificamos que</p>
                    <h3 style="color: #ffc107; font-size: 1.8rem; margin: 15px 0;">[Nombre del Estudiante]</h3>
                    <p style="margin: 20px 0;">${course.certificate.description}</p>
                    <div class="certificate-code">
                        Código de Verificación: <strong>ASC-2025-XXXXX</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-top: 30px; font-size: 0.9rem;">
                        <div style="text-align: left;">
                            <p><strong>Fecha:</strong> DD/MM/AAAA</p>
                            <p><strong>Duración:</strong> XX minutos</p>
                            <p><strong>Grupo Scout:</strong> Grupo XX</p>
                        </div>
                        <div style="text-align: right;">
                            <p><strong>Puntuación:</strong> XX%</p>
                            <p><strong>Estado:</strong> APROBADO ✅</p>
                            <p><strong>Región:</strong> Valle del Cauca</p>
                        </div>
                    </div>
                </div>

                <h3>🎯 Logros Desbloqueados</h3>
                <div class="achievements">${achHtml}</div>

                <div style="text-align: center; margin: 30px 0;">
                    <button class="btn" disabled>📥 Descargar PDF</button>
                    <button class="btn" disabled>🖨️ Imprimir Certificado</button>
                    <button class="btn" disabled>📤 Compartir Logros</button>
                    <button class="btn" disabled>🔄 Reiniciar Curso</button>
                </div>

                <div class="reflection-area">
                    <h4>🎯 Compromiso Personal</h4>
                    <p>Escribe tu compromiso como adulto certificado para servir a tu grupo scout y al movimiento:</p>
                    <textarea placeholder="Mi compromiso como adulto del movimiento es..." disabled></textarea>
                </div>
            </div>
        </div>
    </div>`;
}

// --- Build full preview HTML ---
function buildPreview(course) {
    const totalContent = course.totalContentModules;
    let screenNumber = 1;

    // Registration screen
    const registrationPage = buildRegistrationScreen(course);
    screenNumber++;

    // Module screens
    let contentIndex = 0;
    const modulePages = course.modules.map(mod => {
        if (!mod.isIntro) contentIndex++;
        const page = buildModuleScreen(mod, course, contentIndex, totalContent, screenNumber);
        screenNumber++;
        return page;
    }).join('\n');

    // Certificate screen
    const certificatePage = buildCertificateScreen(course, screenNumber);

    const date = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
    const totalScreens = screenNumber;

    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PREVIEW — ${course.title}</title>
    <style>
/* === Course styles (identical to production) === */
${cssContent}

/* === Preview-specific overrides === */
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&display=swap');

@page {
    size: A4;
    margin: 15mm;
}

@media print {
    body { background: white !important; }
    .preview-page { break-before: page; box-shadow: none !important; border: 1px solid #ddd !important; }
    .cover-page { break-before: auto; }
    .preview-watermark { display: none; }
    .preview-toolbar { display: none !important; }
}

body {
    background: #e8e8e8;
    padding: 20px;
    font-family: 'Montserrat', sans-serif;
}

/* --- Toolbar --- */
.preview-toolbar {
    position: sticky;
    top: 0;
    z-index: 1000;
    background: #622599;
    color: white;
    padding: 12px 25px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    box-shadow: 0 4px 15px rgba(0,0,0,0.3);
    margin: -20px -20px 30px -20px;
    font-size: 0.9em;
}
.preview-toolbar h3 { font-weight: 700; }
.preview-toolbar .toolbar-info { display: flex; gap: 20px; align-items: center; }
.preview-toolbar .toolbar-badge {
    background: #ffe675; color: #622599; padding: 4px 12px;
    font-weight: 700; font-size: 0.85em; letter-spacing: 1px;
}
.preview-toolbar button {
    background: #ffe675; color: #622599; border: none; padding: 8px 20px;
    font-weight: 700; cursor: pointer; font-family: 'Montserrat', sans-serif;
    font-size: 0.9em;
}
.preview-toolbar button:hover { background: #fff; }

/* --- Page container --- */
.preview-page {
    max-width: 1000px;
    margin: 0 auto 40px;
    background: white;
    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    padding: 40px;
    position: relative;
}

/* --- Cover page --- */
.cover-page {
    text-align: center;
    padding: 60px 40px;
    background: linear-gradient(135deg, #622599 0%, #3d1660 100%);
    color: white;
    min-height: 700px;
    display: flex;
    align-items: center;
    justify-content: center;
}
.cover-content { max-width: 600px; }
.cover-logos {
    display: flex; align-items: center; justify-content: center; gap: 20px;
    margin-bottom: 40px;
}
.cover-logo-placeholder {
    width: 80px; height: 80px; background: rgba(255,255,255,0.15);
    border-radius: 10px; display: flex; align-items: center; justify-content: center;
    font-weight: 700; font-size: 0.9em; letter-spacing: 2px;
}
.cover-separator {
    width: 2px; height: 60px; background: rgba(255,255,255,0.3);
}
.cover-icon { font-size: 4em; margin-bottom: 20px; }
.cover-title { font-size: 2.2em; font-weight: 700; margin-bottom: 10px; line-height: 1.2; }
.cover-subtitle { font-size: 1.1em; opacity: 0.85; margin-bottom: 30px; }
.cover-divider {
    width: 80px; height: 4px; background: #ffe675; margin: 0 auto 30px;
}
.cover-description { font-size: 0.95em; opacity: 0.9; line-height: 1.7; margin-bottom: 40px; }
.cover-meta {
    display: grid; grid-template-columns: 1fr 1fr; gap: 15px;
    text-align: left; margin-bottom: 40px;
}
.cover-meta-item {
    display: flex; align-items: center; gap: 10px;
    background: rgba(255,255,255,0.1); padding: 12px 15px; border-radius: 8px;
    font-size: 0.9em;
}
.cover-meta-icon { font-size: 1.3em; }
.cover-footer { margin-top: 30px; font-size: 0.9em; opacity: 0.8; }

/* --- TOC page --- */
.toc-page { padding: 40px; }
.toc-table {
    width: 100%; border-collapse: collapse; margin: 20px 0;
    font-size: 0.9em;
}
.toc-table th {
    background: #622599; color: white; padding: 12px 15px; text-align: left;
    font-weight: 600;
}
.toc-table td { padding: 10px 15px; border-bottom: 1px solid #eee; }
.toc-table tr:hover td { background: #f8f5fc; }
.toc-achievements {
    display: flex; flex-wrap: wrap; gap: 10px; margin: 15px 0;
}
.toc-achievement {
    background: #f8f5fc; border: 1px solid #e0d4f0; padding: 8px 15px;
    border-radius: 20px; font-size: 0.85em;
}

/* --- Screen frame --- */
.screen-label {
    background: #622599; color: white; padding: 10px 20px;
    font-weight: 700; font-size: 1.1em; margin: -40px -40px 25px -40px;
}
.screen-frame {
    border: 2px solid #ddd; border-radius: 4px; overflow: hidden;
}
.screen-topbar {
    background: #622599; padding: 8px 15px; display: flex;
    justify-content: space-between; align-items: center;
    font-size: 0.8em; color: white;
}
.screen-topbar-logos { font-weight: 600; }
.screen-topbar-link { color: #ffe675; font-weight: 600; }
.screen-header .header {
    margin-bottom: 0; border-radius: 0;
}
.screen-body {
    padding: 25px;
    /* Override module visibility */
}
.screen-body .module { display: block !important; }
.screen-body .hidden { display: none; }

/* --- Preview form styling --- */
.preview-form .form-group { margin-bottom: 15px; }
.preview-form label { display: block; font-weight: 600; margin-bottom: 5px; font-size: 0.9em; color: #622599; }
.preview-form input, .preview-form select, .preview-form textarea {
    width: 100%; padding: 10px; border: 2px solid #e0e0e0;
    font-family: 'Montserrat', sans-serif; font-size: 0.9em; background: #f9f9f9;
}
.preview-form textarea { min-height: 80px; resize: vertical; }

/* --- Preview note --- */
.preview-note {
    background: #fff3cd; border: 1px solid #ffc107; padding: 10px 15px;
    margin-bottom: 20px; font-size: 0.85em; font-weight: 600; color: #856404;
}

/* --- Hidden preview button --- */
.hidden-preview {
    opacity: 0.5; margin-top: 10px;
}

/* --- Watermark --- */
.preview-watermark {
    position: fixed; bottom: 20px; right: 20px; background: #622599;
    color: white; padding: 8px 16px; font-size: 0.75em; font-weight: 600;
    z-index: 999; box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    letter-spacing: 1px;
}

/* Ensure progress bar shows correctly */
.progress-bar {
    background: linear-gradient(90deg, #622599, #00afef) !important;
    height: 100%;
    transition: width 0.3s;
}
    </style>
</head>
<body>
    <div class="preview-toolbar">
        <div>
            <h3>📋 PREVIEW — ${course.title}</h3>
        </div>
        <div class="toolbar-info">
            <span class="toolbar-badge">BORRADOR</span>
            <span>${totalScreens} pantallas</span>
            <span>|</span>
            <span>${date}</span>
            <button onclick="window.print()">🖨️ Imprimir / Guardar PDF</button>
        </div>
    </div>

${buildCoverPage(course)}
${buildTOCPage(course)}
${registrationPage}
${modulePages}
${certificatePage}

    <div class="preview-watermark">PREVIEW — NO PUBLICADO</div>
</body>
</html>`;
}

// --- Generate and save ---
if (!fs.existsSync(PREVIEW_DIR)) {
    fs.mkdirSync(PREVIEW_DIR, { recursive: true });
}

const previewHtml = buildPreview(course);
const outputPath = path.join(PREVIEW_DIR, 'preview-' + courseName + '.html');
fs.writeFileSync(outputPath, previewHtml, 'utf-8');

console.log('✅ Preview generado: ' + outputPath);
console.log('');
console.log('📌 Para revisar:');
console.log('   1. Abre el archivo en Chrome/Edge');
console.log('   2. Revisa todas las pantallas del curso');
console.log('   3. Para guardar como PDF: Ctrl+P → "Guardar como PDF"');
console.log('');
console.log('📝 Las respuestas correctas de los quizzes están marcadas con ✅');
