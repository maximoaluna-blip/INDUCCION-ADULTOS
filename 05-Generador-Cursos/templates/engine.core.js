// ============================================
// engine.core.js — NÚCLEO COMPARTIDO del motor de cursos
// Plataforma de Formación de Adultos — Asociación Scouts de Colombia
//
// ⚠️  NO EDITAR ESTE ARCHIVO DENTRO DE UNA LÍNEA.
//     La fuente vive en el repo raíz, en _MOTOR/engine.core.js, y se propaga con:
//         python sincronizar-motor.py --aplicar
//     Editarlo aquí hace que la línea diverja en silencio — que es exactamente el
//     problema que este archivo existe para resolver (DECISIONES.md ADR-025).
//
// Lo específico de cada línea (textos con el número de curso, componentes propios)
// vive en templates/engine.linea.js, que se concatena ANTES que este archivo.
// ============================================

function guardarLocal(clave, valor) {
    try {
        localStorage.setItem(clave, valor);
        return true;
    } catch (e) {
        if (!_avisoAlmacenamiento) {
            _avisoAlmacenamiento = true;
            if (typeof showNotification === 'function') {
                showNotification('⚠️ No pudimos guardar tu avance en este navegador. Puede ser falta de espacio o el modo privado. Anota lo que escribiste antes de cerrar.', 'warning');
            }
        }
        return false;
    }
}

// --- Registro ---
function handleRegistration(event) {
    event.preventDefault();
    var formData = new FormData(event.target);
    userProfile = {
        fullName: formData.get('fullName'),
        age: formData.get('age'),
        group: formData.get('group'),
        region: formData.get('region'),
        email: formData.get('email'),
        motivation: formData.get('motivation'),
        registrationDate: new Date().toISOString()
    };
    if (!userProfile.fullName || userProfile.fullName.trim() === '') {
        showNotification('⚠️ El nombre es requerido', 'warning');
        return;
    }
    saveProgress();
    saveGlobalUserProfile(userProfile);
    // El curso va explicito: `userProfile` no lo lleva, y sin el la fila queda con la
    // columna Curso vacia y el panel administrativo la cuenta como "sin-curso". Era la
    // unica accion del motor que no lo enviaba — quiz, progress y certificate si lo
    // hacian, por eso los certificados salian bien y los registros no. Detectado el
    // 03-ago-2026: 18 de 20 registros estaban sin curso y el panel de Programa de
    // Jovenes mostraba 0 adultos registrados pese a tener alumnos con cursos completos.
    sendToGoogleSheets({ action: 'register', ...userProfile, course: COURSE_CONFIG.courseId });
    showModule(1);
    var firstName = userProfile.fullName.split(' ')[0];
    var welcomeEl = document.getElementById('welcomeName');
    if (welcomeEl) welcomeEl.textContent = firstName;
    showNotification('¡Bienvenido/a ' + firstName + '! 🎉');
}

// --- Perfil global cross-course (autollenado) ---
function saveGlobalUserProfile(profile) {
    try {
        // Persist only the reusable fields (no per-course state)
        var reusable = {
            fullName: profile.fullName, age: profile.age, group: profile.group,
            region: profile.region, email: profile.email, motivation: profile.motivation,
            updatedAt: new Date().toISOString()
        };
        guardarLocal('globalUserProfile', JSON.stringify(reusable));
    } catch (e) { /* el aviso lo da guardarLocal */ }
}

function prefillFromGlobalProfile() {
    // Skip if user already registered for this specific course
    if (userProfile && userProfile.fullName) return;
    var raw;
    try { raw = localStorage.getItem('globalUserProfile'); } catch (e) { return; }
    if (!raw) return;
    var profile;
    try { profile = JSON.parse(raw); } catch (e) { return; }
    if (!profile || !profile.fullName) return;
    var fields = ['fullName', 'age', 'group', 'region', 'email', 'motivation'];
    var filled = 0;
    fields.forEach(function (id) {
        var input = document.getElementById(id);
        if (input && profile[id]) {
            input.value = profile[id];
            filled++;
        }
    });
    if (filled === 0) return;
    // Insert banner above the form
    var form = document.querySelector('#module-0 form');
    if (form && !document.getElementById('prefill-banner')) {
        var firstName = (profile.fullName || '').split(' ')[0] || 'Adulto';
        var banner = document.createElement('div');
        banner.id = 'prefill-banner';
        banner.className = 'prefill-banner';
        banner.innerHTML =
            '<div class="prefill-banner-content">' +
                '<span class="prefill-banner-icon">✨</span>' +
                '<div>' +
                    '<strong>Hola ' + escapePrefillHtml(firstName) + '. Tus datos están pre-cargados</strong> de un curso anterior.<br>' +
                    '<span class="prefill-banner-hint">Edita lo que haya cambiado o continúa directo.</span>' +
                '</div>' +
                '<button type="button" class="prefill-banner-clear" onclick="clearPrefill()" title="Limpiar y empezar de cero">Limpiar</button>' +
            '</div>';
        form.parentNode.insertBefore(banner, form);
    }
}

function clearPrefill() {
    var fields = ['fullName', 'age', 'group', 'region', 'email', 'motivation'];
    fields.forEach(function (id) {
        var input = document.getElementById(id);
        if (input) input.value = '';
    });
    var banner = document.getElementById('prefill-banner');
    if (banner) banner.remove();
    var fn = document.getElementById('fullName');
    if (fn) fn.focus();
}

function escapePrefillHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
}

// --- Navegacion de modulos ---
function showModule(moduleIndex) {
    moduleIndex = parseInt(moduleIndex);
    if (moduleIndex > 0 && (!userProfile || !userProfile.fullName)) {
        showNotification('⚠️ Debes completar el registro primero', 'warning');
        return;
    }
    // Pause and unload videos in the previously active module to free memory
    document.querySelectorAll('.module.active video[data-src]').forEach(function (v) {
        try { v.pause(); } catch (e) {}
        if (v.src) { v.removeAttribute('src'); v.load(); }
    });
    document.querySelectorAll('.module').forEach(function (m) { m.classList.remove('active'); });
    var target = document.getElementById('module-' + moduleIndex);
    if (target) {
        target.classList.add('active');
        // Lazy-load videos in the now-active module: copy data-src to src
        target.querySelectorAll('video[data-src]').forEach(function (v) {
            if (!v.src) { v.src = v.getAttribute('data-src'); }
        });
    }

    document.querySelectorAll('.nav-btn').forEach(function (btn, index) {
        btn.classList.remove('active');
        if (index === moduleIndex) btn.classList.add('active');
    });

    var mobileSelect = document.querySelector('.mobile-nav select');
    if (mobileSelect) mobileSelect.value = moduleIndex;

    currentModule = moduleIndex;

    if (moduleIndex === COURSE_CONFIG.totalModules - 1) {
        generateCertificate();
    }
    updateProgress();
    saveProgress();
    window.scrollTo(0, 0);
}

// --- Sistema de evaluaciones ---
function selectOption(element, optionIndex) {
    var question = element.closest('.question');
    // Limpiar marcas previas (selected, correct, incorrect) de TODAS las opciones de la pregunta:
    // permite reintentar sin que queden colores fantasma de un intento anterior.
    question.querySelectorAll('.option').forEach(function (opt) {
        opt.classList.remove('selected', 'correct', 'incorrect');
    });
    element.classList.add('selected');
    element.setAttribute('data-selected-index', optionIndex);
    // Si el boton "Verificar" estaba oculto tras un fallo, lo restauramos en cuanto el usuario cambia de opcion.
    var quizContainer = element.closest('.quiz-container');
    if (quizContainer) {
        var checkBtn = quizContainer.querySelector('[id^="checkBtn-"]');
        if (checkBtn) checkBtn.style.display = '';
    }
}

// Baraja las opciones de cada pregunta una vez por sesion (Fisher-Yates).
// Como cada <label class="option"> conserva su onclick="selectOption(this, oi)" con su indice original,
// QUIZ_ANSWERS sigue siendo valido sin tocar build-course.js.
function shuffleQuizOptions() {
    document.querySelectorAll('.quiz-container .question').forEach(function (question) {
        var options = Array.prototype.slice.call(question.querySelectorAll('.option'));
        if (options.length < 2) return;
        for (var i = options.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var tmp = options[i]; options[i] = options[j]; options[j] = tmp;
        }
        options.forEach(function (opt) { question.appendChild(opt); });
    });
}

function checkQuiz(moduleNum) {
    var quizData = QUIZ_ANSWERS[moduleNum];
    if (!quizData) return;

    var questions = document.querySelectorAll('#module-' + moduleNum + ' .question');
    var correctAnswers = 0;
    var totalQuestions = quizData.length;

    questions.forEach(function (question, qIndex) {
        var selectedOption = question.querySelector('.option.selected');
        if (selectedOption) {
            var selectedIdx = parseInt(selectedOption.getAttribute('data-selected-index'));
            if (selectedIdx === quizData[qIndex]) {
                selectedOption.classList.add('correct');
                correctAnswers++;
            } else {
                selectedOption.classList.add('incorrect');
                // Mostrar la correcta
                var options = question.querySelectorAll('.option');
                if (options[quizData[qIndex]]) options[quizData[qIndex]].classList.add('correct');
            }
        }
    });

    var score = Math.round((correctAnswers / totalQuestions) * 100);
    quizScores[moduleNum] = score;

    var checkBtn = document.getElementById('checkBtn-' + moduleNum);
    if (checkBtn) checkBtn.style.display = 'none';

    if (score >= 70) {
        var nextBtn = document.getElementById('nextBtn-' + moduleNum);
        if (nextBtn) nextBtn.classList.remove('hidden');

        // Desbloquear logros
        COURSE_CONFIG.achievements.forEach(function (ach) {
            if (ach.unlockOnModule === moduleNum) unlockAchievement(ach.id);
        });

        showNotification('¡Excelente! Obtuviste ' + score + '% ✅');
        sendToGoogleSheets({
            action: 'quiz', name: userProfile.fullName, email: userProfile.email,
            module: moduleNum, score: score, course: COURSE_CONFIG.courseId
        });
    } else {
        showNotification('Puntuación: ' + score + '%. Necesitas 70% para continuar. Revisa el contenido y vuelve a intentarlo.', 'warning');
        // No auto-reset: en cuanto el usuario hace clic en una opcion, selectOption() limpia las marcas
        // de esa pregunta y vuelve a mostrar el boton "Verificar". Esto evita que un reset por tiempo
        // borrara la nueva seleccion del usuario antes de que pulsara verificar.
    }
    saveProgress();
}

function completeModule(moduleNum) {
    moduleProgress[moduleNum] = true;
    sendToGoogleSheets({
        action: 'progress', name: userProfile.fullName, email: userProfile.email,
        moduleCompleted: moduleNum, course: COURSE_CONFIG.courseId
    });
    var navBtns = document.querySelectorAll('.nav-btn');
    if (navBtns[moduleNum]) navBtns[moduleNum].classList.add('completed');
    showModule(moduleNum + 1);
    saveProgress();
    updateProgress();
    updateStats();
}

// --- Progreso ---
function updateProgress() {
    var completed = moduleProgress.filter(Boolean).length;
    var total = COURSE_CONFIG.contentModules;
    var pct = Math.round((completed / total) * 100);
    var bar = document.getElementById('progressBar');
    var text = document.getElementById('progressText');
    if (bar) bar.style.width = pct + '%';
    if (text) text.textContent = pct + '%';

    updateElapsedTime();
}

function updateElapsedTime() {
    var timeEl = document.getElementById('elapsedTime');
    if (!timeEl || !sessionStartTime) return;
    var totalMinutes = studyTime;
    if (totalMinutes < 60) {
        timeEl.textContent = totalMinutes + ' min';
    } else {
        var hours = Math.floor(totalMinutes / 60);
        var mins = totalMinutes % 60;
        timeEl.textContent = hours + 'h ' + (mins < 10 ? '0' : '') + mins + 'min';
    }
}

function updateStats() {
    var completed = moduleProgress.filter(Boolean).length;
    var quizzes = quizScores.filter(function (s) { return s >= 70; }).length;
    var el1 = document.getElementById('modulesCompleted');
    var el2 = document.getElementById('quizzesCompleted');
    var el3 = document.getElementById('studyTime');
    if (el1) el1.textContent = completed;
    if (el2) el2.textContent = quizzes;
    if (el3) el3.textContent = studyTime;
}

// --- Logros ---
function unlockAchievement(achievementId) {
    var el = document.getElementById(achievementId);
    if (el && !el.classList.contains('earned')) {
        el.classList.add('earned');
        showNotification('¡Logro desbloqueado: ' + el.textContent + '! 🏆');
    }
}

// --- Notificaciones ---
function showNotification(message, type) {
    var n = document.createElement('div');
    n.className = 'notification';
    if (type === 'warning') n.style.background = '#FF9800';
    n.textContent = message;
    document.body.appendChild(n);
    setTimeout(function () {
        n.style.animation = 'slideOut 0.3s';
        setTimeout(function () { n.remove(); }, 300);
    }, 3000);
}

// --- Reflexiones ---
function saveReflection(moduleNum, text) {
    reflections[moduleNum] = text;
    saveProgress();
    // Sincronizacion en segundo plano al backend (fire-and-forget)
    if (userProfile && userProfile.email && typeof sendToGoogleSheets === 'function') {
        sendToGoogleSheets({
            action: 'reflection',
            email: userProfile.email,
            name: userProfile.fullName,
            course: COURSE_CONFIG.courseId,
            moduleId: String(moduleNum),
            texto: text || ''
        });
    }
}

function saveCommitment(text) {
    localStorage.setItem('commitment_' + COURSE_CONFIG.courseId, text);
}

// --- Foto-upload (resize + persist + descargar) ---
function handlePhotoUpload(input, photoId) {
    var file = input.files && input.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
        showNotification('⚠️ Solo se aceptan imágenes (JPG, PNG, etc.)', 'warning');
        return;
    }
    if (file.size > 10 * 1024 * 1024) {
        showNotification('⚠️ La imagen pesa más de 10 MB. Intenta con una más pequeña.', 'warning');
        return;
    }
    var reader = new FileReader();
    reader.onload = function (e) {
        var img = new Image();
        img.onload = function () {
            var MAX = 1200;
            var ratio = Math.min(1, MAX / Math.max(img.width, img.height));
            var w = Math.round(img.width * ratio);
            var h = Math.round(img.height * ratio);
            var canvas = document.createElement('canvas');
            canvas.width = w; canvas.height = h;
            canvas.getContext('2d').drawImage(img, 0, 0, w, h);
            var dataUrl = canvas.toDataURL('image/jpeg', 0.85);
            var preview = document.getElementById('photo-preview-' + photoId);
            var actions = document.getElementById('photo-actions-' + photoId);
            if (preview) preview.innerHTML = '<img src="' + dataUrl + '" alt="Tu imagen">';
            if (actions) actions.classList.remove('hidden');
            photos[photoId] = {
                dataUrl: dataUrl,
                fileName: (file.name || 'imagen') + '.jpg',
                savedAt: new Date().toISOString()
            };
            try {
                saveProgress();
                showNotification('✅ Imagen guardada en tu progreso');
            } catch (err) {
                showNotification('⚠️ La imagen es muy pesada para guardar localmente. Descárgala para no perderla.', 'warning');
            }
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function downloadPhoto(photoId) {
    var photo = photos[photoId];
    if (!photo || !photo.dataUrl) {
        showNotification('⚠️ No hay imagen guardada para descargar', 'warning');
        return;
    }
    var a = document.createElement('a');
    a.href = photo.dataUrl;
    a.download = photo.fileName || 'imagen.jpg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

function clearPhoto(photoId) {
    if (!confirm('¿Seguro que quieres quitar esta imagen? Se borrará de tu progreso guardado.')) return;
    delete photos[photoId];
    saveProgress();
    var preview = document.getElementById('photo-preview-' + photoId);
    var actions = document.getElementById('photo-actions-' + photoId);
    var input = document.getElementById('photo-input-' + photoId);
    if (preview) preview.innerHTML = '';
    if (actions) actions.classList.add('hidden');
    if (input) input.value = '';
    showNotification('Imagen quitada');
}

// --- Autodiagnóstico de competencias (self-assessment) ---
function recordAssessmentGrade(assessmentId, competenceId, level) {
    if (!selfAssessments[assessmentId]) selfAssessments[assessmentId] = { grades: {} };
    selfAssessments[assessmentId].grades[competenceId] = level;
    selfAssessments[assessmentId].updatedAt = new Date().toISOString();
    selfAssessments[assessmentId].scaleVersion = COMPETENCY_SCALE_VERSION;
}

// Restore selection state if user has saved assessment grades
function restoreAssessmentSelections() {
    Object.keys(selfAssessments).forEach(function (aid) {
        var saved = selfAssessments[aid] || {};
        // Selecciones hechas con una escala anterior: los grados ya no describen los
        // mismos peldanos, asi que se descartan en vez de restaurarse en silencio.
        if (saved.grades && Object.keys(saved.grades).length &&
            saved.scaleVersion !== COMPETENCY_SCALE_VERSION) {
            selfAssessments[aid] = { grades: {} };
            var container = document.getElementById('sa-' + aid);
            if (container && !container.querySelector('.sa-scale-notice')) {
                var notice = document.createElement('div');
                notice.className = 'info-box sa-scale-notice';
                notice.innerHTML = '<strong>🔄 Actualizamos este autodiagnóstico.</strong><br>Corregimos los grados de varias competencias para que coincidan con el Diccionario de Competencias oficial. Como los peldaños cambiaron, tus respuestas anteriores se borraron: <strong>vuelve a calificarte</strong> con los criterios nuevos.';
                container.insertBefore(notice, container.firstChild);
            }
            saveProgress();
            return;
        }
        var grades = saved.grades || {};
        Object.keys(grades).forEach(function (compId) {
            var radio = document.querySelector('input[name="sa-' + aid + '-' + compId + '"][value="' + grades[compId] + '"]');
            if (radio) radio.checked = true;
        });
    });
}

// --- Plan Personal Builder ---
function getCompetencyProfile() {
    try {
        var raw = localStorage.getItem('competencyProfile');
        return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
}

// Un perfil guardado con una escala anterior describe peldanos distintos a los que el
// adulto eligio: sus grados ya no significan lo mismo. No se puede reinterpretar, hay
// que rehacer el autodiagnostico.
function isProfileStale(profile) {
    return !!profile && profile.scaleVersion !== COMPETENCY_SCALE_VERSION;
}

function togglePlanCompetence(builderId, compId) {
    var fields = document.getElementById('pb-fields-' + compId);
    var checkbox = document.querySelector('.pb-comp-check[data-competence="' + compId + '"]');
    if (!fields) return;
    if (checkbox && checkbox.checked) {
        fields.classList.remove('hidden');
        if (!personalPlans[builderId]) personalPlans[builderId] = { competences: {}, commitment: '' };
        if (!personalPlans[builderId].competences[compId]) {
            personalPlans[builderId].competences[compId] = { meta: '', plazo: '', recursos: '' };
        }
    } else {
        fields.classList.add('hidden');
        if (personalPlans[builderId] && personalPlans[builderId].competences) {
            delete personalPlans[builderId].competences[compId];
        }
    }
    saveProgress();
}

function savePlanField(builderId, compId, field, value) {
    if (!personalPlans[builderId]) personalPlans[builderId] = { competences: {}, commitment: '' };
    if (!personalPlans[builderId].competences[compId]) personalPlans[builderId].competences[compId] = {};
    personalPlans[builderId].competences[compId][field] = value;
    saveProgress();
}

function savePlanCommitment(builderId, value) {
    if (!personalPlans[builderId]) personalPlans[builderId] = { competences: {}, commitment: '' };
    personalPlans[builderId].commitment = value;
    saveProgress();
}

// El perfil del Curso 4 debe aparecer solo, sin depender de que el adulto pulse el boton
// "Cargar mi perfil": si no lo pulsa, ve el constructor vacio y pierde la precarga que el
// Curso 4 le prometio (y tampoco se entera de que su perfil quedo con una escala vieja).
// Si ya empezo a llenar su plan, no se pisa lo que escribio: solo se evalua el aviso.
function initPlanBuilders() {
    var banners = document.querySelectorAll('[id^="pb-profile-"]');
    [].forEach.call(banners, function (banner) {
        var builderId = banner.id.replace('pb-profile-', '');
        var plan = personalPlans[builderId];
        var yaEmpezo = !!(plan && plan.competences && Object.keys(plan.competences).length);
        if (!yaEmpezo) {
            loadProfileIntoPlan(builderId);
            return;
        }
        // Plan en curso: respetar lo escrito, pero avisar si el perfil quedo obsoleto.
        var profile = getCompetencyProfile();
        if (isProfileStale(profile)) {
            banner.classList.add('no-profile');
            banner.innerHTML = '<strong>🔄 Actualizamos el autodiagnóstico del Curso 4.</strong><br>Corregimos los grados de varias competencias, así que el perfil con el que empezaste este plan ya no describe los mismos peldaños. Tu plan sigue intacto — pero conviene <strong>repetir el autodiagnóstico</strong> del Curso 4 y revisar si tus prioridades siguen siendo esas.';
        }
    });
}

function restorePlanState() {
    Object.keys(personalPlans).forEach(function (bid) {
        var plan = personalPlans[bid];
        if (!plan) return;
        // Commitment
        var ta = document.getElementById('pb-commitment-' + bid);
        if (ta && plan.commitment) ta.value = plan.commitment;
        // Competences
        Object.keys(plan.competences || {}).forEach(function (compId) {
            var checkbox = document.querySelector('.pb-comp-check[data-competence="' + compId + '"]');
            if (checkbox) {
                checkbox.checked = true;
                togglePlanCompetence(bid, compId);
                var data = plan.competences[compId];
                ['meta', 'plazo', 'recursos'].forEach(function (f) {
                    var input = document.querySelector('.pb-field-' + f + '[data-competence="' + compId + '"]');
                    if (input && data[f]) input.value = data[f];
                });
            }
        });
    });
}

function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
}

function printPlan() {
    document.body.classList.add('printing-plan');
    var afterPrint = function () {
        document.body.classList.remove('printing-plan');
        window.removeEventListener('afterprint', afterPrint);
    };
    window.addEventListener('afterprint', afterPrint);
    setTimeout(function () { window.print(); }, 50);
    // Safety: remove class after 30s in case afterprint doesn't fire
    setTimeout(function () { document.body.classList.remove('printing-plan'); }, 30000);
}

// --- Certificado ---
function generateCertificate() {
    var date = new Date();
    var el = function (id) { return document.getElementById(id); };

    // Idempotencia: el certificado se emite UNA sola vez por curso. Si ya existe, se reusa
    // (no se genera codigo nuevo ni se reenvia al backend -> evita filas duplicadas en el Sheet).
    var courseKey = 'certificate_issued_' + COURSE_CONFIG.courseId;
    var issued = null;
    try { issued = JSON.parse(localStorage.getItem(courseKey) || 'null'); } catch (e) { issued = null; }

    var esNuevo = !(issued && issued.code);
    var code = esNuevo
        ? 'ASC-' + date.getFullYear() + '-' + Math.random().toString(36).substr(2, 5).toUpperCase()
        : issued.code;
    var avg = esNuevo
        ? (quizScores.length > 0 ? Math.round(quizScores.reduce(function (a, b) { return a + b; }, 0) / quizScores.length) : 100)
        : issued.score;
    var fechaISO = esNuevo ? date.toISOString() : (issued.date || date.toISOString());

    if (el('studentName')) el('studentName').textContent = userProfile.fullName || 'Adulto Scout';
    if (el('certDate')) el('certDate').textContent = new Date(fechaISO).toLocaleDateString('es-CO');
    if (el('totalTime')) el('totalTime').textContent = studyTime;
    if (el('certGroup')) el('certGroup').textContent = userProfile.group || 'N/A';
    if (el('certRegion')) el('certRegion').textContent = userProfile.region || 'Colombia';
    if (el('certCode')) el('certCode').textContent = code;
    if (el('finalScore')) el('finalScore').textContent = avg;

    unlockAchievement('achievement-5');
    var bar = document.getElementById('progressBar');
    var text = document.getElementById('progressText');
    if (bar) bar.style.width = '100%';
    if (text) text.textContent = '100%';

    // Solo la primera emision escribe en localStorage y sincroniza al backend.
    if (esNuevo) {
        sendToGoogleSheets({
            action: 'certificate', name: userProfile.fullName, email: userProfile.email,
            group: userProfile.group, region: userProfile.region, certificateCode: code,
            completionDate: fechaISO, score: avg, studyTime: studyTime,
            course: COURSE_CONFIG.courseId
        });
        var registro = JSON.stringify({
            name: userProfile.fullName, code: code, date: fechaISO,
            score: avg, course: COURSE_CONFIG.courseId
        });
        localStorage.setItem('certificate_' + code, registro); // lookup por codigo (verify)
        localStorage.setItem(courseKey, registro);              // puntero estable por curso
    }
}

// --- Descargar certificado como PDF ---
function isMobileDevice() {
    return /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
        || (window.innerWidth <= 768);
}

// --- Utilidades internas para el PDF ---
function _txt(id, fallback) {
    var el = document.getElementById(id);
    return el ? (el.textContent || '').trim() : (fallback || '');
}

function _imgToDataURL(imgEl) {
    return new Promise(function(resolve) {
        if (!imgEl) { resolve(null); return; }
        try {
            var canvas = document.createElement('canvas');
            var w = imgEl.naturalWidth || imgEl.width || 200;
            var h = imgEl.naturalHeight || imgEl.height || 200;
            canvas.width = w; canvas.height = h;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(imgEl, 0, 0, w, h);
            resolve({ data: canvas.toDataURL('image/png'), w: w, h: h });
        } catch (e) { resolve(null); }
    });
}

function _wrapText(pdf, text, maxWidth) {
    return pdf.splitTextToSize(text || '', maxWidth);
}

function downloadCertificatePDF() {
    var certModule = document.getElementById('module-' + (COURSE_CONFIG.totalModules - 1));
    var cert = certModule ? certModule.querySelector('.certificate') : null;
    if (!cert) {
        showNotification('El certificado aún no está disponible.');
        return;
    }

    // Localizar jsPDF (viene incluido en el bundle de html2pdf)
    var JsPDF = (window.jspdf && window.jspdf.jsPDF) || (typeof jsPDF !== 'undefined' ? jsPDF : null);
    if (!JsPDF) {
        showNotification('La librería de PDF no cargó. Verifica tu conexión.');
        if (confirm('¿Deseas usar la opción de Imprimir en su lugar?')) { window.print(); }
        return;
    }

    var code = _txt('certCode', 'certificado');
    var filename = 'Certificado-' + code + '.pdf';
    var mobile = isMobileDevice();
    showNotification('Generando PDF...');

    // Datos del certificado
    var student = _txt('studentName', 'Estudiante');
    var date = _txt('certDate', '');
    var score = _txt('finalScore', '');
    var group = _txt('certGroup', '');
    var region = _txt('certRegion', '');
    var totalTime = _txt('totalTime', '');
    var courseName = (COURSE_CONFIG.certificateCourseName || COURSE_CONFIG.title || '').toUpperCase();
    var courseDescription = COURSE_CONFIG.certificateDescription ||
        'ha completado exitosamente el curso de formación de la Plataforma de Formación de Adultos ASC';

    // Cargar logos
    var ascImg = cert.querySelector('img[src*="logo-asc"]');
    var valleImg = cert.querySelector('img[src*="logo-vallescout"]');

    Promise.all([_imgToDataURL(ascImg), _imgToDataURL(valleImg)]).then(function(logos) {
        var logoASC = logos[0], logoValle = logos[1];

        // A4 portrait: 210 x 297 mm
        var pdf = new JsPDF('p', 'mm', 'a4');
        var pageW = 210, pageH = 297;

        // --- Marco morado exterior ---
        pdf.setDrawColor(98, 37, 153);
        pdf.setLineWidth(1.2);
        pdf.rect(8, 8, pageW - 16, pageH - 16);

        // --- Esquinas decorativas amarillas ---
        pdf.setDrawColor(255, 230, 117);
        pdf.setLineWidth(2);
        var cs = 20; // corner size
        // Top-left
        pdf.line(8, 8, 8 + cs, 8);
        pdf.line(8, 8, 8, 8 + cs);
        // Top-right
        pdf.line(pageW - 8, 8, pageW - 8 - cs, 8);
        pdf.line(pageW - 8, 8, pageW - 8, 8 + cs);
        // Bottom-left
        pdf.line(8, pageH - 8, 8 + cs, pageH - 8);
        pdf.line(8, pageH - 8, 8, pageH - 8 - cs);
        // Bottom-right
        pdf.line(pageW - 8, pageH - 8, pageW - 8 - cs, pageH - 8);
        pdf.line(pageW - 8, pageH - 8, pageW - 8, pageH - 8 - cs);

        var y = 30; // cursor vertical

        // --- Logos ---
        var logoH = 18;
        var logoGap = 8;
        var logoASCw = logoASC ? logoH * (logoASC.w / logoASC.h) : 0;
        var logoValleW = logoValle ? logoH * (logoValle.w / logoValle.h) : 0;
        var totalLogosW = logoASCw + logoGap + logoValleW;
        var logosX = (pageW - totalLogosW) / 2;
        if (logoASC) pdf.addImage(logoASC.data, 'PNG', logosX, y, logoASCw, logoH);
        if (logoValle) pdf.addImage(logoValle.data, 'PNG', logosX + logoASCw + logoGap, y, logoValleW, logoH);
        y += logoH + 6;

        // --- Encabezado institucional ---
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10);
        pdf.setTextColor(98, 37, 153);
        pdf.text('ASOCIACIÓN SCOUTS DE COLOMBIA', pageW / 2, y, { align: 'center' });
        y += 5;
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
        pdf.setTextColor(120, 120, 120);
        pdf.text('Formación de Adultos en el Movimiento', pageW / 2, y, { align: 'center' });
        y += 5;

        // --- Línea divisoria morada ---
        pdf.setDrawColor(98, 37, 153);
        pdf.setLineWidth(0.6);
        pdf.line(40, y, pageW - 40, y);
        y += 10;

        // --- Título "CERTIFICADO DE APROBACIÓN" ---
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(22);
        pdf.setTextColor(98, 37, 153);
        pdf.text('CERTIFICADO DE APROBACIÓN', pageW / 2, y, { align: 'center' });
        y += 12;

        // --- Banner morado con nombre del curso ---
        pdf.setFillColor(98, 37, 153);
        pdf.rect(20, y, pageW - 40, 14, 'F');
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(13);
        pdf.setTextColor(255, 255, 255);
        var courseLines = _wrapText(pdf, courseName, pageW - 50);
        if (courseLines.length > 1) {
            pdf.setFontSize(11);
        }
        pdf.text(courseLines[0], pageW / 2, y + 9, { align: 'center' });
        y += 20;

        // --- "Se otorga a" ---
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(11);
        pdf.setTextColor(99, 99, 99);
        pdf.text('Se otorga el presente certificado a', pageW / 2, y, { align: 'center' });
        y += 10;

        // --- Nombre del estudiante ---
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(20);
        pdf.setTextColor(98, 37, 153);
        pdf.text(student, pageW / 2, y, { align: 'center' });
        // Subrayado amarillo bajo el nombre
        var nameW = pdf.getTextWidth(student);
        pdf.setDrawColor(255, 230, 117);
        pdf.setLineWidth(1.5);
        pdf.line((pageW - nameW) / 2 - 5, y + 2, (pageW + nameW) / 2 + 5, y + 2);
        y += 12;

        // --- Descripción ---
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
        pdf.setTextColor(99, 99, 99);
        var descLines = _wrapText(pdf, courseDescription, pageW - 60);
        for (var i = 0; i < descLines.length && i < 3; i++) {
            pdf.text(descLines[i], pageW / 2, y, { align: 'center' });
            y += 5;
        }
        y += 5;

        // --- Tarjeta de detalles ---
        var detX = 25, detW = pageW - 50, detH = 38;
        pdf.setFillColor(249, 247, 252);
        pdf.rect(detX, y, detW, detH, 'F');
        pdf.setFillColor(98, 37, 153);
        pdf.rect(detX, y, 2, detH, 'F'); // borde izquierdo morado

        var colX1 = detX + 8;
        var colX2 = detX + detW / 2 + 5;
        var rowY = y + 8;
        var rowGap = 7;

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9);
        pdf.setTextColor(60, 60, 60);

        function _detail(label, value, x, yy) {
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(98, 37, 153);
            pdf.text(label, x, yy);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(60, 60, 60);
            pdf.text(String(value || '-'), x + pdf.getTextWidth(label) + 2, yy);
        }

        _detail('Fecha: ', date, colX1, rowY);
        _detail('Puntuación: ', score + '%', colX2, rowY);
        _detail('Grupo Scout: ', group, colX1, rowY + rowGap);
        _detail('Región: ', region, colX2, rowY + rowGap);
        _detail('Tiempo: ', totalTime + ' min', colX1, rowY + rowGap * 2);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(98, 37, 153);
        pdf.text('Estado: ', colX2, rowY + rowGap * 2);
        pdf.setTextColor(46, 125, 50);
        pdf.text('APROBADO', colX2 + pdf.getTextWidth('Estado: ') + 2, rowY + rowGap * 2);

        y += detH + 8;

        // --- Código de verificación ---
        var codeBoxH = 14;
        pdf.setDrawColor(98, 37, 153);
        pdf.setLineWidth(0.4);
        pdf.setLineDashPattern([1.5, 1.5], 0);
        pdf.setFillColor(250, 248, 253);
        pdf.rect(50, y, pageW - 100, codeBoxH, 'FD');
        pdf.setLineDashPattern([], 0);

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(7);
        pdf.setTextColor(140, 140, 140);
        pdf.text('CÓDIGO DE VERIFICACIÓN', pageW / 2, y + 5, { align: 'center' });
        pdf.setFont('courier', 'bold');
        pdf.setFontSize(11);
        pdf.setTextColor(98, 37, 153);
        pdf.text(code, pageW / 2, y + 11, { align: 'center' });
        y += codeBoxH + 6;

        // --- Footer ---
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(7);
        pdf.setTextColor(150, 150, 150);
        pdf.text('Plataforma de Formación de Adultos ASC', pageW / 2, pageH - 16, { align: 'center' });
        pdf.setFontSize(6);
        pdf.text('Verifica este certificado ingresando el código en la plataforma web', pageW / 2, pageH - 12, { align: 'center' });

        // --- Guardar ---
        if (mobile) {
            var blob = pdf.output('blob');
            var url = URL.createObjectURL(blob);
            var link = document.createElement('a');
            link.href = url; link.download = filename; link.target = '_blank';
            document.body.appendChild(link); link.click();
            setTimeout(function() { document.body.removeChild(link); URL.revokeObjectURL(url); }, 5000);
        } else {
            pdf.save(filename);
        }
        showNotification('PDF descargado: ' + filename + ' 📥');
    }).catch(function(err) {
        if (typeof console !== 'undefined') console.error('Error PDF:', err);
        showNotification('Error al generar PDF. Intenta con Imprimir.', 'warning');
        if (confirm('¿Deseas usar la opción de Imprimir?')) { window.print(); }
    });
}

// --- Compartir ---
function shareResults() {
    var text = '¡He completado el curso ' + COURSE_CONFIG.title + '! 🏕️\n\n' +
        'Certificado: ' + document.getElementById('certCode').textContent + '\n' +
        'Puntuación: ' + document.getElementById('finalScore').textContent + '%\n\n' +
        '#ScoutsSiempreListos #AdultosEnElMovimiento #ASC';
    if (navigator.share) {
        navigator.share({ title: COURSE_CONFIG.title + ' Completado', text: text });
    } else {
        navigator.clipboard.writeText(text);
        showNotification('¡Texto copiado al portapapeles! 📋');
    }
}

function restartCourse() {
    if (confirm('¿Estás seguro de que quieres reiniciar el curso? Se perderá todo el progreso.')) {
        localStorage.removeItem('courseProgress_' + COURSE_CONFIG.courseId);
        localStorage.removeItem('commitment_' + COURSE_CONFIG.courseId);
        location.reload();
    }
}

// --- Registration mode toggle ---
function toggleRegistrationMode(mode) {
    var newRegBtn = document.getElementById('toggleNewReg');
    var recoverBtn = document.getElementById('toggleRecover');
    var recoverySection = document.getElementById('recoverySection');
    var registrationForm = document.getElementById('registrationForm');

    if (mode === 'recover') {
        newRegBtn.classList.remove('active');
        recoverBtn.classList.add('active');
        recoverySection.classList.remove('hidden');
        registrationForm.style.display = 'none';
    } else {
        newRegBtn.classList.add('active');
        recoverBtn.classList.remove('active');
        recoverySection.classList.add('hidden');
        registrationForm.style.display = '';
    }
}

// --- Google Sheets ---
function sendToGoogleSheets(data) {
    if (!COURSE_CONFIG.googleScriptUrl) return;
    try {
        var indicator = document.getElementById('syncIndicator');
        if (indicator) indicator.classList.add('show');
        var payload = Object.assign({}, data, {
            token: 'ADULTOS_ASC_2026',
            timestamp: new Date().toISOString(),
            url: window.location.href
        });

        // Try CORS first, fall back to no-cors
        fetch(COURSE_CONFIG.googleScriptUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }).then(function (response) {
            if (indicator) {
                indicator.textContent = '☁️ Guardado en la nube';
                indicator.classList.add('show');
                setTimeout(function () { indicator.classList.remove('show'); }, 2000);
            }
            return response.json().catch(function() { return {}; });
        }).catch(function () {
            // Fallback to no-cors mode for older Apps Script deployments
            fetch(COURSE_CONFIG.googleScriptUrl, {
                method: 'POST', mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            }).then(function () {
                if (indicator) {
                    indicator.textContent = '☁️ Sincronizado con Google Sheets';
                    indicator.classList.add('show');
                    setTimeout(function () { indicator.classList.remove('show'); }, 2000);
                }
            }).catch(function () {
                if (indicator) {
                    indicator.textContent = '💾 Guardado localmente';
                    indicator.classList.add('show');
                    setTimeout(function () { indicator.classList.remove('show'); }, 2000);
                }
                // Datos guardados localmente (fallback silencioso)
            });
        });
    } catch (e) {
        // Google Sheets no disponible, progreso guardado localmente
        var indicator = document.getElementById('syncIndicator');
        if (indicator) {
            indicator.textContent = '💾 Guardado localmente';
            indicator.classList.add('show');
            setTimeout(function () { indicator.classList.remove('show'); }, 2000);
        }
    }
}



// --- Timers ---
// Incrementar studyTime cada minuto y guardar progreso (solo si esta en un modulo de contenido)
setInterval(function () {
    if (currentModule > 0) {
        studyTime += 1;
        updateStats();
        updateElapsedTime();
    }
    saveProgress();
}, 60000);
