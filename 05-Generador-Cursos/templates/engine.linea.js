// ============================================
// engine.linea.js — EXTENSIÓN de la línea Política de Adultos en el Movimiento
// Se concatena ANTES de engine.core.js (aquí viven las variables globales).
//
// Qué va aquí: lo que NO es idéntico en las 3 líneas — textos propios (el número
// del curso al que se remite, el pie del PDF) y componentes exclusivos de la línea.
// Lo demás está en el núcleo compartido; si tocas algo que también usan las otras
// líneas, va en _MOTOR/engine.core.js del repo raíz, no aquí.
// ============================================

// ============================================
// MOTOR DE CURSOS - PLATAFORMA DE FORMACION DE ADULTOS ASC
// Este archivo es generado automaticamente por build-course.js
// Las variables COURSE_CONFIG y QUIZ_ANSWERS son inyectadas por el builder
// ============================================

// --- Variables globales ---
let currentModule = 0;
let moduleProgress = [];
let quizScores = [];
let startTime = new Date();
let studyTime = 0;
let sessionStartTime = null;
let reflections = {};
let photos = {};
let selfAssessments = {};
let personalPlans = {};
let userProfile = {};

// Version de la escala de grados de dominio del autodiagnostico de competencias.
// Subir este numero cuando cambien los criterios de los grados: invalida los perfiles
// ya guardados, que quedarian describiendo peldanos distintos a los que el adulto eligio.
// v2 (02-ago-2026): correccion doctrinal de los grados en 4 de las 7 competencias
// (DECISIONES.md raiz ADR-023, Fase 2). Ver ESTADO-AUDITORIA.md.
const COMPETENCY_SCALE_VERSION = 2;

// --- Escritura segura en localStorage ---
// saveProgress() no manejaba el fallo en absoluto y mostraba el indicador de "guardado"
// sin comprobar que la escritura hubiera funcionado. Si localStorage falla (cuota llena,
// modo privado de Safari, almacenamiento bloqueado por politica del navegador), el
// estudiante veia el visto verde y perdia su trabajo sin enterarse. Ahora se entera.
var _avisoAlmacenamiento = false;



// --- Inicializacion ---
window.addEventListener('DOMContentLoaded', function () {
    moduleProgress = new Array(COURSE_CONFIG.totalModules).fill(false);
    sessionStartTime = new Date();
    shuffleQuizOptions();
    loadProgress();
    prefillFromGlobalProfile();
    updateElapsedTime();
});

window.addEventListener('beforeunload', function () {
    saveProgress();
});

// --- Persistencia ---
function saveProgress() {
    var key = 'courseProgress_' + COURSE_CONFIG.courseId;
    var progress = {
        userProfile: userProfile, moduleProgress: moduleProgress,
        quizScores: quizScores, studyTime: studyTime, reflections: reflections, photos: photos, selfAssessments: selfAssessments, personalPlans: personalPlans,
        currentModule: currentModule, startTime: startTime.toISOString(),
        lastSaved: new Date().toISOString(), version: '3.0'
    };
    // Solo confirmar visualmente si la escritura funciono de verdad.
    if (!guardarLocal(key, JSON.stringify(progress))) return;
    var indicator = document.getElementById('saveIndicator');
    if (indicator) { indicator.classList.add('show'); setTimeout(function () { indicator.classList.remove('show'); }, 2000); }
}

function loadProgress() {
    var key = 'courseProgress_' + COURSE_CONFIG.courseId;
    var saved = localStorage.getItem(key);
    if (saved) {
        var p = JSON.parse(saved);
        userProfile = p.userProfile || {};
        moduleProgress = p.moduleProgress || new Array(COURSE_CONFIG.totalModules).fill(false);
        quizScores = p.quizScores || [];
        studyTime = p.studyTime || 0;
        reflections = p.reflections || {};
        photos = p.photos || {};
        selfAssessments = p.selfAssessments || {};
        personalPlans = p.personalPlans || {};
        currentModule = p.currentModule || 0;
        startTime = new Date(p.startTime || new Date());
        if (userProfile.fullName) {
            showModule(currentModule);
            var welcomeEl = document.getElementById('welcomeName');
            if (welcomeEl) welcomeEl.textContent = userProfile.fullName.split(' ')[0];
            showNotification('¡Bienvenido de vuelta, ' + userProfile.fullName.split(' ')[0] + '! 👋');
        }
        Object.keys(reflections).forEach(function (k) {
            var ta = document.getElementById('reflection-' + k);
            if (ta) ta.value = reflections[k];
        });
        Object.keys(photos).forEach(function (k) {
            var preview = document.getElementById('photo-preview-' + k);
            var actions = document.getElementById('photo-actions-' + k);
            if (preview && photos[k] && photos[k].dataUrl) {
                preview.innerHTML = '<img src="' + photos[k].dataUrl + '" alt="Imagen guardada">';
                if (actions) actions.classList.remove('hidden');
            }
        });
        if (typeof restoreAssessmentSelections === 'function') restoreAssessmentSelections();
        if (typeof restorePlanState === 'function') restorePlanState();
        if (typeof initPlanBuilders === 'function') initPlanBuilders();
        updateStats();
        updateProgress();
    }
}

function calculateAssessment(assessmentId) {
    var data = selfAssessments[assessmentId];
    var container = document.getElementById('sa-' + assessmentId);
    if (!container) return;
    var blocks = container.querySelectorAll('.competence-block');
    if (!data || !data.grades || Object.keys(data.grades).length < blocks.length) {
        showNotification('⚠️ Te falta marcar el grado en alguna competencia. Revisa que las hayas calificado todas.', 'warning');
        return;
    }
    // Build entries with name + grade for ranking
    var entries = [];
    blocks.forEach(function (b) {
        var compId = b.getAttribute('data-competence');
        var compName = b.querySelector('.competence-name')?.textContent.trim() || compId;
        var grade = data.grades[compId];
        entries.push({ id: compId, name: compName, grade: grade });
    });
    entries.sort(function (a, b) { return b.grade - a.grade; });
    var topN = Math.min(3, entries.length);
    var bottomN = Math.min(3, entries.length);
    var strengths = entries.slice(0, topN);
    var opportunities = entries.slice(-bottomN).reverse();
    // Save final result
    data.strengths = strengths.map(function (e) { return e.id; });
    data.opportunities = opportunities.map(function (e) { return e.id; });
    data.completedAt = new Date().toISOString();
    saveProgress();
    // Save to global key for cross-course consumption.
    // Por guardarLocal, no en un catch vacio (AUDITORIA.md check E-bis): este perfil
    // lo consume el Curso 5 para precargar el plan personal. Si se pierde en silencio,
    // el alumno rehace el autodiagnostico sin saber por que.
    guardarLocal('competencyProfile', JSON.stringify({
        grades: data.grades,
        strengths: data.strengths,
        opportunities: data.opportunities,
        completedAt: data.completedAt,
        sourceCourse: COURSE_CONFIG.courseId,
        scaleVersion: COMPETENCY_SCALE_VERSION
    }));
    // Sincronizacion en segundo plano al backend (persistencia hibrida)
    if (userProfile && userProfile.email && typeof sendToGoogleSheets === 'function') {
        sendToGoogleSheets({
            action: 'assessment',
            email: userProfile.email,
            name: userProfile.fullName,
            course: COURSE_CONFIG.courseId,
            assessmentId: assessmentId,
            grades: data.grades
        });
    }
    // Render result
    var avgGrade = (entries.reduce(function (s, e) { return s + e.grade; }, 0) / entries.length).toFixed(1);
    var resultEl = document.getElementById('sa-result-' + assessmentId);
    if (resultEl) {
        resultEl.innerHTML =
            '<h3>📊 Tu perfil de competencias</h3>' +
            '<p style="text-align:center;color:#555;margin-bottom:8px;">Grado promedio: <strong style="color:#622599;font-size:1.2em;">' + avgGrade + ' / 4</strong></p>' +
            '<div class="profile-summary">' +
                '<div class="profile-strengths"><h4>💪 Tus fortalezas</h4><ul>' +
                    strengths.map(function (e) { return '<li><strong>' + e.name + '</strong> — Grado ' + e.grade + '</li>'; }).join('') +
                '</ul></div>' +
                '<div class="profile-opportunities"><h4>🌱 Tus áreas de oportunidad</h4><ul>' +
                    opportunities.map(function (e) { return '<li><strong>' + e.name + '</strong> — Grado ' + e.grade + '</li>'; }).join('') +
                '</ul></div>' +
            '</div>' +
            '<div class="profile-recommendation">' +
                '<strong>💡 Recomendación:</strong> tus áreas de oportunidad son las que conviene priorizar en tu <em>Plan Personal de Desarrollo</em>. Cuando tomes el <strong>Curso 5 — Tu Plan Personal</strong>, este perfil quedará pre-cargado para sugerirte por dónde empezar.' +
            '</div>';
        resultEl.classList.remove('hidden');
        resultEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    showNotification('✅ Perfil calculado y guardado');
}

function loadProfileIntoPlan(builderId) {
    var profile = getCompetencyProfile();
    var banner = document.getElementById('pb-profile-' + builderId);
    if (!profile || !profile.opportunities) {
        if (banner) {
            banner.classList.add('no-profile');
            banner.innerHTML = '<strong>ℹ️ No encontramos tu perfil del Curso 4.</strong><br>Si todavía no has hecho el autodiagnóstico, te recomendamos hacerlo primero — pero puedes construir tu plan igual marcando manualmente las competencias que quieres trabajar.';
        }
        return;
    }
    if (isProfileStale(profile)) {
        if (banner) {
            banner.classList.add('no-profile');
            banner.innerHTML = '<strong>🔄 Actualizamos el autodiagnóstico del Curso 4.</strong><br>Corregimos los grados de varias competencias para que coincidan con el Diccionario de Competencias oficial, así que tu perfil anterior ya no describe los mismos peldaños. <strong>Vuelve al Curso 4 y repite el autodiagnóstico</strong> — son pocos minutos y tu plan quedará bien calibrado. Mientras tanto puedes marcar las competencias a mano.';
        }
        return;
    }
    if (banner) {
        banner.classList.remove('no-profile');
        banner.innerHTML = '<strong>✅ Tu perfil del Curso 4 está cargado.</strong><br>Tus 3 áreas de oportunidad ya vienen pre-seleccionadas. Puedes cambiarlas si quieres.';
    }
    // Pre-check the 3 opportunities and show their grade
    var grades = profile.grades || {};
    profile.opportunities.forEach(function (compId) {
        var checkbox = document.querySelector('.pb-comp-check[data-competence="' + compId + '"]');
        if (checkbox) {
            checkbox.checked = true;
            togglePlanCompetence(builderId, compId);
        }
    });
    Object.keys(grades).forEach(function (compId) {
        var gradeEl = document.getElementById('pb-grade-' + compId);
        if (gradeEl) {
            gradeEl.textContent = 'Grado ' + grades[compId];
            if (profile.opportunities.indexOf(compId) >= 0) gradeEl.classList.add('priority');
        }
    });
    showNotification('✅ Perfil del Curso 4 cargado');
}

function generatePlan(builderId) {
    var plan = personalPlans[builderId];
    if (!plan || !plan.competences || Object.keys(plan.competences).length === 0) {
        showNotification('⚠️ Selecciona al menos 1 competencia y completa sus campos antes de generar el plan.', 'warning');
        return;
    }
    // Validate fields
    var entries = Object.keys(plan.competences);
    var incomplete = entries.filter(function (compId) {
        var d = plan.competences[compId];
        return !d.meta || !d.meta.trim() || !d.plazo || !d.plazo.trim() || !d.recursos || !d.recursos.trim();
    });
    if (incomplete.length > 0) {
        showNotification('⚠️ Hay campos vacíos. Completa meta, plazo y recursos en todas las competencias seleccionadas.', 'warning');
        return;
    }
    // Get competence names from checkboxes
    var nameByCompId = {};
    document.querySelectorAll('.pb-comp-check').forEach(function (cb) {
        nameByCompId[cb.getAttribute('data-competence')] = cb.getAttribute('data-name');
    });
    var profile = getCompetencyProfile();
    var grades = (profile && profile.grades) || {};
    var fullName = (userProfile && userProfile.fullName) || 'Adulto del Movimiento';
    var groupName = (userProfile && userProfile.group) || '—';
    var dateStr = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
    var prioritiesHtml = entries.map(function (compId, idx) {
        var d = plan.competences[compId];
        var name = nameByCompId[compId] || compId;
        var grade = grades[compId] ? ' (Grado actual: ' + grades[compId] + ')' : '';
        return '<div class="pb-priority"><h3>' + (idx + 1) + '. ' + name + grade + '</h3>' +
            '<dt>🎯 Meta concreta</dt><dd>' + escapeHtml(d.meta) + '</dd>' +
            '<dt>⏰ Plazo</dt><dd>' + escapeHtml(d.plazo) + '</dd>' +
            '<dt>📚 Recursos</dt><dd>' + escapeHtml(d.recursos) + '</dd></div>';
    }).join('');
    var commitmentHtml = (plan.commitment || '').trim() ?
        '<div class="pb-final-commitment"><h3>💚 Mi compromiso</h3><p style="margin:0;white-space:pre-wrap;">' + escapeHtml(plan.commitment) + '</p></div>' : '';
    var output = document.getElementById('pb-output-' + builderId);
    if (output) {
        output.innerHTML =
            '<h2>📋 Plan Personal de Desarrollo</h2>' +
            '<p class="pb-output-meta"><strong>' + escapeHtml(fullName) + '</strong> · Grupo ' + escapeHtml(groupName) + ' · ' + dateStr + '</p>' +
            '<h3 style="margin-top:24px;color:#622599;">Mis prioridades de desarrollo</h3>' +
            prioritiesHtml +
            commitmentHtml +
            '<button class="pb-print-btn" onclick="printPlan()">🖨️ Imprimir / Guardar como PDF</button>' +
            '<p style="text-align:center;color:#666;font-size:0.85em;margin:14px 0 0 0;font-style:italic;">Imprime este plan y llévalo a tu conversación con tu Asesor Personal. Tu plan definitivo se escribe dentro de Talento 360°.</p>';
        output.classList.remove('hidden');
        output.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    showNotification('✅ Plan generado. Puedes imprimirlo.');
    // Sincronizacion en segundo plano al backend (persistencia hibrida)
    if (userProfile && userProfile.email && typeof sendToGoogleSheets === 'function') {
        sendToGoogleSheets({
            action: 'plan',
            email: userProfile.email,
            name: userProfile.fullName,
            course: COURSE_CONFIG.courseId,
            planId: builderId,
            planType: 'plan-builder-v1',
            contenido: plan
        });
    }
}

// --- Recovery from server ---
function recoverProgress() {
    var emailInput = document.getElementById('recoveryEmail');
    var email = emailInput.value.trim();
    var msgDiv = document.getElementById('recoveryMessage');

    if (!email) {
        showNotification('⚠️ Ingresa tu correo electronico', 'warning');
        return;
    }

    msgDiv.style.display = 'block';
    msgDiv.innerHTML = '<p style="color: #622599; font-weight: 600;">🔄 Buscando tu avance...</p>';

    var url = COURSE_CONFIG.googleScriptUrl +
        '?action=recover&email=' + encodeURIComponent(email) +
        '&course=' + encodeURIComponent(COURSE_CONFIG.courseId) +
        '&token=ADULTOS_ASC_2026';

    fetch(url, { redirect: 'follow' })
        .then(function(response) {
            if (!response.ok) throw new Error('HTTP ' + response.status);
            return response.json();
        })
        .then(function(data) {

            // El Apps Script devuelve: { success: true, data: { registration, modules, quizzes, certificates } }
            var isFound = (data && data.found) || (data && data.success && data.data);

            if (isFound) {
                var serverData = data.data || data;
                var reg = serverData.registration || data.userProfile || {};
                var mods = serverData.modules || [];
                var quizzes = serverData.quizzes || [];

                // Reconstruir userProfile desde registration
                if (reg.fullName || reg.name) {
                    userProfile = {
                        fullName: reg.fullName || reg.name || '',
                        age: reg.age || '',
                        group: reg.group || '',
                        region: reg.region || '',
                        email: reg.email || email,
                        motivation: reg.motivation || '',
                        registrationDate: reg.registrationDate || reg.timestamp || ''
                    };
                } else if (data.userProfile) {
                    userProfile = data.userProfile;
                }

                // Reconstruir moduleProgress desde modules array
                if (mods.length > 0) {
                    moduleProgress = new Array(COURSE_CONFIG.totalModules).fill(false);
                    mods.forEach(function(m) {
                        var modNum = m.moduleCompleted || m.module;
                        if (modNum !== undefined && modNum < moduleProgress.length) {
                            moduleProgress[modNum] = true;
                        }
                    });
                } else if (data.moduleProgress) {
                    moduleProgress = data.moduleProgress;
                }

                // Reconstruir quizScores desde quizzes array
                if (quizzes.length > 0) {
                    quizScores = [];
                    quizzes.forEach(function(q) {
                        var modNum = q.module;
                        var score = q.score;
                        if (modNum !== undefined && score !== undefined) {
                            quizScores[modNum] = parseInt(score);
                        }
                    });
                } else if (data.quizScores) {
                    quizScores = data.quizScores;
                }

                // StudyTime y reflections (si vienen directamente)
                if (data.studyTime) studyTime = data.studyTime;
                if (data.reflections) {
                    reflections = data.reflections;
                    Object.keys(reflections).forEach(function(k) {
                        var ta = document.getElementById('reflection-' + k);
                        if (ta) ta.value = reflections[k];
                    });
                }

                // Reflexiones por curso (persistencia hibrida): hidratar cada curso en localStorage
                if (serverData.reflectionsByCourse && typeof serverData.reflectionsByCourse === 'object') {
                    Object.keys(serverData.reflectionsByCourse).forEach(function (cid) {
                        var courseReflections = serverData.reflectionsByCourse[cid] || {};
                        if (cid === COURSE_CONFIG.courseId) {
                            reflections = courseReflections;
                            Object.keys(reflections).forEach(function (k) {
                                var ta = document.getElementById('reflection-' + k);
                                if (ta) ta.value = reflections[k];
                            });
                        } else {
                            try {
                                var key = 'courseProgress_' + cid;
                                var raw = localStorage.getItem(key);
                                var existing = raw ? JSON.parse(raw) : {};
                                existing.reflections = courseReflections;
                                existing.lastSaved = new Date().toISOString();
                                guardarLocal(key, JSON.stringify(existing));
                            } catch (e) { /* el aviso lo da guardarLocal */ }
                        }
                    });
                }

                // Autodiagnósticos: restaurar grados desde el backend
                if (serverData.assessments && typeof serverData.assessments === 'object') {
                    Object.keys(serverData.assessments).forEach(function (aid) {
                        var saved = serverData.assessments[aid] || {};
                        if (!selfAssessments[aid]) selfAssessments[aid] = { grades: {} };
                        if (saved.grades) selfAssessments[aid].grades = saved.grades;
                    });
                    if (typeof restoreAssessmentSelections === 'function') restoreAssessmentSelections();
                }

                // Planes personales: restaurar plan-builder
                if (serverData.plans && typeof serverData.plans === 'object') {
                    Object.keys(serverData.plans).forEach(function (pid) {
                        var savedPlan = serverData.plans[pid] || {};
                        var contenido = savedPlan.contenido;
                        if (contenido && typeof contenido === 'object') {
                            personalPlans[pid] = contenido;
                        }
                    });
                    if (typeof restorePlanState === 'function') restorePlanState();
                }

                saveProgress();
                updateStats();
                updateProgress();

                // Determinar último módulo completado
                var lastModule = data.currentModule || 0;
                if (!lastModule && moduleProgress.length > 0) {
                    for (var i = moduleProgress.length - 1; i >= 0; i--) {
                        if (moduleProgress[i]) { lastModule = i + 1; break; }
                    }
                }

                var firstName = userProfile.fullName ? userProfile.fullName.split(' ')[0] : 'Scout';
                var welcomeEl = document.getElementById('welcomeName');
                if (welcomeEl) welcomeEl.textContent = firstName;

                var completedCount = moduleProgress.filter(Boolean).length;
                showNotification('¡Avance recuperado, ' + firstName + '! ' + completedCount + ' módulos completados 🎉');
                showModule(lastModule > 0 ? lastModule : 1);
            } else {
                var reason = (data && data.message) ? data.message : 'No se encontro avance asociado a este correo.';
                msgDiv.innerHTML = '<p style="color: #FF9800; font-weight: 600;">⚠️ ' + escapeHtml(reason) + '</p>' +
                    '<p style="color: #636363; margin-top: 10px;">Puedes registrarte como nuevo usuario.</p>' +
                    '<button class="btn" style="margin-top: 10px;" onclick="toggleRegistrationMode(\'new\')">🆕 Registrarme</button>';
            }
        })
        .catch(function(err) {
            if (typeof console !== 'undefined') console.error('[Recovery] Error:', err);
            msgDiv.innerHTML = '<p style="color: #f44336; font-weight: 600;">❌ Error al conectar con el servidor.</p>' +
                '<p style="color: #636363; margin-top: 10px;">Error: ' + escapeHtml(err && err.message ? err.message : String(err)) + '</p>' +
                '<p style="color: #636363; margin-top: 5px;">Verifica tu conexion a internet e intenta de nuevo.</p>';
        });
}
