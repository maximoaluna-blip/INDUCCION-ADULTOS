#!/usr/bin/env python3
"""Corrige tildes/acentos en el JSON del curso."""
import json
import sys

filepath = sys.argv[1] if len(sys.argv) > 1 else '05-Generador-Cursos/borradores/caracteristicas-educativas.json'

with open(filepath, 'r', encoding='utf-8') as f:
    raw = f.read()

original = raw

# Mapping: (sin_tilde, con_tilde) — orden importa: mas especificos primero
replacements = [
    # ñ
    ('desempenan', 'desempeñan'),
    ('acompanamiento', 'acompañamiento'),
    ('acompana', 'acompaña'),
    ('ninos', 'niños'),
    ('Nino', 'Niño'),
    ('pequenos', 'pequeños'),
    ('Pequenos', 'Pequeños'),

    # -cion / -sion
    ('Organizacion', 'Organización'),
    ('organizacion', 'organización'),
    ('Constitucion', 'Constitución'),
    ('constitucion', 'constitución'),
    ('Formacion', 'Formación'),
    ('formacion', 'formación'),
    ('Educacion', 'Educación'),
    ('educacion', 'educación'),
    ('Evaluacion', 'Evaluación'),
    ('evaluacion', 'evaluación'),
    ('Reflexion', 'Reflexión'),
    ('reflexion', 'reflexión'),
    ('Participacion', 'Participación'),
    ('participacion', 'participación'),
    ('motivacion', 'motivación'),
    ('comprension', 'comprensión'),
    ('decision', 'decisión'),
    ('interaccion', 'interacción'),
    ('experimentacion', 'experimentación'),
    ('innovacion', 'innovación'),
    ('Progresion', 'Progresión'),
    ('progresion', 'progresión'),
    ('cooperacion', 'cooperación'),
    ('cohesion', 'cohesión'),
    ('socializacion', 'socialización'),
    ('especializacion', 'especialización'),
    ('Adaptacion', 'Adaptación'),
    ('adaptacion', 'adaptación'),
    ('discriminacion', 'discriminación'),
    ('Proteccion', 'Protección'),
    ('proteccion', 'protección'),
    ('Religion', 'Religión'),
    ('religion', 'religión'),
    ('comunicacion', 'comunicación'),
    ('Declaracion', 'Declaración'),
    ('obligacion', 'obligación'),
    ('construccion', 'construcción'),
    ('distincion', 'distinción'),
    ('relacion', 'relación'),
    ('contradiccion', 'contradicción'),
    ('percepcion', 'percepción'),
    ('descripcion', 'descripción'),
    ('autoeducacion', 'autoeducación'),
    ('memorizacion', 'memorización'),
    ('instruccion', 'instrucción'),
    ('dimension', 'dimensión'),
    ('adhesion', 'adhesión'),
    ('imposicion', 'imposición'),
    ('expresion', 'expresión'),
    ('transicion', 'transición'),
    ('eleccion', 'elección'),
    ('aceptacion', 'aceptación'),
    ('posicion', 'posición'),
    ('identificacion', 'identificación'),
    ('Duracion', 'Duración'),
    ('duracion', 'duración'),
    ('accion', 'acción'),

    # Acentos en a/e/i/o/u
    ('Caracteristicas', 'Características'),
    ('caracteristicas', 'características'),
    ('Proposito', 'Propósito'),
    ('proposito', 'propósito'),
    ('Metodo', 'Método'),
    ('metodo', 'método'),
    ('unico', 'único'),
    ('unica', 'única'),
    ('fisicas', 'físicas'),
    ('fisico', 'físico'),
    ('autonomia', 'autonomía'),
    ('autonomos', 'autónomos'),
    ('jovenes', 'jóvenes'),
    ('Jovenes', 'Jóvenes'),
    ('Simbolico', 'Simbólico'),
    ('simbolico', 'simbólico'),
    ('simbolos', 'símbolos'),
    ('modulos', 'módulos'),
    ('modulo', 'módulo'),
    ('minimo', 'mínimo'),
    ('codigo', 'código'),
    ('politico', 'político'),
    ('politica', 'política'),
    ('holistica', 'holística'),
    ('practicas', 'prácticas'),
    ('practica', 'práctica'),
    ('basica', 'básica'),
    ('economicas', 'económicas'),
    ('psicologico', 'psicológico'),
    ('espontaneo', 'espontáneo'),
    ('sistematica', 'sistemática'),
    ('especificos', 'específicos'),
    ('especificas', 'específicas'),
    ('especifica', 'específica'),
    ('Especifica', 'Específica'),
    ('democraticamente', 'democráticamente'),
    ('dialogo', 'diálogo'),
    ('Enfasis', 'Énfasis'),
    ('enfasis', 'énfasis'),
    ('obstaculo', 'obstáculo'),
    ('solidos', 'sólidos'),
    ('academico', 'académico'),
    ('comun', 'común'),
    ('segun', 'según'),
    ('Segun', 'Según'),
    ('ademas', 'además'),
    ('Ademas', 'Además'),
    ('tambien', 'también'),
    ('También', 'También'),
    ('preparara', 'preparará'),
    ('llevara', 'llevará'),
    ('raices', 'raíces'),
    ('pais', 'país'),
    ('areas', 'áreas'),
    ('traves', 'través'),
    ('egoismo', 'egoísmo'),
    ('MISION', 'MISIÓN'),
    ('Mision', 'Misión'),
    ('ayudandoles', 'ayudándoles'),
    ('titulos', 'títulos'),
    ('desafios', 'desafíos'),
    ('Desafios', 'Desafíos'),
    ('empatia', 'empatía'),
    ('ciudadania', 'ciudadanía'),
    ('Sabiduria', 'Sabiduría'),
    ('sabiduria', 'sabiduría'),
    ('busqueda', 'búsqueda'),
    ('creia', 'creía'),
    ('exito', 'éxito'),
    ('interes', 'interés'),
    ('numero', 'número'),
    ('caracter ', 'carácter '),
    ('mas amplio', 'más amplio'),
    ('mas lo necesitan', 'más lo necesitan'),
    ('mas que', 'más que'),
    ('mas grande', 'más grande'),
    ('mas complejas', 'más complejas'),
    ('mas valiosa', 'más valiosa'),
    ('cada vez mas', 'cada vez más'),
    (' mas,', ' más,'),
    (' mas.', ' más.'),
    (' mas<', ' más<'),

    # Interrogativos
    ('¿Cuales', '¿Cuáles'),
    ('¿Cual ', '¿Cuál '),
    ('¿Cuantos', '¿Cuántos'),
    ('¿Que ', '¿Qué '),
    ('¿Como', '¿Cómo'),
    ('¿A que', '¿A qué'),
    ('¿Por que', '¿Por qué'),
    ('que referencia', 'qué referencia'),
    ('que funcion', 'qué función'),
    ('que papel', 'qué papel'),
    ('que significa', 'qué significa'),
    ('que tipo', 'qué tipo'),
    ('que debe', 'qué debe'),
    ('¿Sabias que', '¿Sabías que'),

    # Verbos con acento
    ('esta abierto', 'está abierto'),
    ('esta formado', 'está formado'),
    ('estan vinculados', 'están vinculados'),
    ('estan activamente', 'están activamente'),
    ('se estan', 'se están'),

    # guia con tilde
    ('guia y', 'guía y'),
    ('guias y', 'guías y'),
    ('Guia y', 'Guía y'),

    # por que (causal, no interrogativo) -> no tocar
    # como (no interrogativo) -> no tocar

    # ano -> año (careful)
    ('por ano', 'por año'),
]

for old, new in replacements:
    raw = raw.replace(old, new)

# Verify valid JSON
try:
    data = json.loads(raw)
    print('JSON valido despues de correcciones')
except json.JSONDecodeError as e:
    print(f'ERROR JSON: {e}')
    sys.exit(1)

# Count lines changed
orig_lines = original.splitlines()
new_lines = raw.splitlines()
changed = sum(1 for a, b in zip(orig_lines, new_lines) if a != b)
print(f'{changed} lineas modificadas de {len(orig_lines)} total')

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(raw)
print('Archivo guardado con tildes corregidas')
