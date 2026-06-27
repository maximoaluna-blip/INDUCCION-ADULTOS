// globalSetup — descarga el catalogo de cursos activos del target (ASC_BASE_URL)
// y lo escribe en tests/.cursos.json para que las specs sean AGNOSTICAS DE LINEA.
// Asi la misma suite sirve para Adultos, Programa de Jovenes, Desarrollo Institucional,
// etc.: basta cambiar ASC_BASE_URL. Si falla (sin red o sin cursos.json), borra el
// generado y cursos.js usa su lista fallback (Adultos).
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '.cursos.json');

const DEFAULT_BASE =
  'https://maximoaluna-blip.github.io/INDUCCION-ADULTOS/02-Plataforma-Web/';

module.exports = async () => {
  const base = process.env.ASC_BASE_URL || DEFAULT_BASE;
  const url = (base.endsWith('/') ? base : base + '/') + 'cursos.json';
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const catalogo = await res.json();
    const cursos = (Array.isArray(catalogo) ? catalogo : [])
      .filter((c) => c.status === 'active' || c.status === 'new')
      .map((c) => ({
        courseId: c.courseId,
        // El motor sirve cada curso como <file> o como <folder>/index.html.
        file: c.file || (c.folder ? c.folder + '/index.html' : ''),
        // Titulo libre: smoke solo exige <title> no vacio cuando esto es null.
        tituloIncluye: null,
      }))
      .filter((c) => c.courseId && c.file);
    if (!cursos.length) throw new Error('catalogo sin cursos activos');
    fs.writeFileSync(OUT, JSON.stringify(cursos, null, 2));
    console.log(`[setup] ${cursos.length} curso(s) cargado(s) desde ${url}`);
  } catch (e) {
    try { fs.unlinkSync(OUT); } catch (_) {}
    console.log(`[setup] no se pudo cargar ${url} (${e.message}); cursos.js usara el fallback`);
  }
};
