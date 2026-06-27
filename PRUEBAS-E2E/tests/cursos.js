// Catalogo de cursos del target bajo prueba.
// Por defecto lo provee el globalSetup (_setup-cursos.js), que descarga el
// cursos.json del ASC_BASE_URL y lo escribe en .cursos.json -> la suite es
// AGNOSTICA DE LINEA (Adultos, PJ, DI...).
// Si no hay generado (sin red en globalSetup), se usa el fallback de Adultos.
const fs = require('fs');
const path = require('path');

const GENERADO = path.join(__dirname, '.cursos.json');

// Fallback: espejo de INDUCCION-ADULTOS/02-Plataforma-Web/cursos.json (status: "active").
const FALLBACK = [
  { courseId: 'bienvenida-adultos', file: 'bienvenida-adultos.html', tituloIncluye: 'Bienvenida' },
  { courseId: 'politica-marco', file: 'politica-marco.html', tituloIncluye: 'Política' },
  { courseId: 'ciclo-adulto', file: 'ciclo-adulto.html', tituloIncluye: 'Ciclo' },
  { courseId: 'competencias-esenciales', file: 'competencias-esenciales.html', tituloIncluye: 'Competencias' },
  { courseId: 'plan-personal', file: 'plan-personal.html', tituloIncluye: 'Plan Personal' },
];

let CURSOS = FALLBACK;
try {
  if (fs.existsSync(GENERADO)) {
    const cargados = JSON.parse(fs.readFileSync(GENERADO, 'utf8'));
    if (Array.isArray(cargados) && cargados.length) CURSOS = cargados;
  }
} catch (e) {
  // JSON corrupto o ilegible: usar fallback.
}

module.exports = { CURSOS };
