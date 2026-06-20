// Catalogo de cursos activos de la linea Politica de Adultos.
// Espejo de INDUCCION-ADULTOS/02-Plataforma-Web/cursos.json (status: "active").
// Si cambia cursos.json, actualizar aqui.

const CURSOS = [
  { courseId: 'bienvenida-adultos', file: 'bienvenida-adultos.html', tituloIncluye: 'Bienvenida' },
  { courseId: 'politica-marco', file: 'politica-marco.html', tituloIncluye: 'Política' },
  { courseId: 'ciclo-adulto', file: 'ciclo-adulto.html', tituloIncluye: 'Ciclo' },
  { courseId: 'competencias-esenciales', file: 'competencias-esenciales.html', tituloIncluye: 'Competencias' },
  { courseId: 'plan-personal', file: 'plan-personal.html', tituloIncluye: 'Plan Personal' },
];

module.exports = { CURSOS };
