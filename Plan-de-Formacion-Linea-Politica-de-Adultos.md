# Plan de Formación — Línea Política de Adultos en el Movimiento

> **Versión 1.2 — 28-09-2026 (ADR-107): Nivel 3 replanteado.** Versión 1.1 — 27-09-2026 (ADR-098). Transcripción a Markdown del `Plan-de-Formacion-Linea-Politica-de-Adultos.docx`
> (versión inicial, 09-05-2026) **más el Plan del Nivel 2 detallado**. Desde hoy **este `.md` es el plan vigente**: el `.docx`
> queda como histórico y no se edita. Se pasó a Markdown porque un `.docx` no lo lee ningún `grep` ni ningún barrido de
> términos, y el plan está aguas arriba de todo diseño (`CLAUDE.md` raíz §3).

## 1. Qué es la línea

Formación de los adultos voluntarios de la Asociación Scouts de Colombia (consejeros, dirigentes, asesores y demás roles)
sobre la **Política Nacional de Adultos en el Movimiento** (PNAM, Acuerdo C.S.N. 176 de 2017; rediseño de agosto de 2020) y
sus documentos complementarios. Cuatro niveles: fundamentación, profundización por fase del ciclo, especialización por cargo
y temas transversales.

### 1.1 Decisiones globales que siguen vigentes

- Lecciones cortas (banda de 3 a 8 minutos, óptimo 5–7; ADR-069), terminables por separado.
- Lenguaje práctico con la cita oficial plegable (`policy-quote`) donde el contenido exige precisión.
- Mini-quiz por lección (70 % para pasar), reflexión escrita por lección, certificado verificable `ASC-AAAA-XXXXX`.

### 1.2 Decisiones del `.docx` que ya NO rigen

- *«No avanzar a un nivel superior hasta validar el anterior con piloto»* (docx §1.2 y §7.3): **superada por el ADR-019**.
  El piloto es recomendado, no bloqueante; la compuerta son las tres auditorías (doctrinal, pedagógica y funcional).
- *«Preview en PDF antes de publicar»*: la revisión humana previa la sustituye la compuerta de las tres auditorías con
  autonomía delegada por el dueño (27-09-2026).
- El **Nivel 4** (A Salvo del Peligro, Diversidad e Inclusión, Gestión para la Motivación) **lo cubre la línea Políticas
  Transversales**, publicada el 18-09-2026. PA no lo duplica.

## 2. Recorrido

El adulto entra por el Nivel 1, común a todos. Después el recorrido es modular: el Nivel 2 según la fase del ciclo que esté
viviendo o acompañando, el Nivel 3 según su cargo. **Los niveles 2 y 3 no son secuenciales entre sí** y ningún curso bloquea a
otro (ADR-019): cada curso **recomienda** los previos.

| Nivel | Nombre (`levelName`) | Cursos | Audiencia |
|---|---|---|---|
| 1 | Ruta de Fundamentación | 5 (1–5) | Todo adulto |
| 2 | Profundización por fase del ciclo | 5 (6–10) | Adultos con experiencia y quienes acompañan a otros |
| 3 | Especialización por cargo | 5 (11–15) | Adulto en un cargo específico |
| 4 | Transversales | — | Cubierto por la línea Políticas Transversales |

## 3. Nivel 1 — Ruta de Fundamentación (publicado)

| # | Curso | `courseId` |
|---|---|---|
| 1 | 🦸 Bienvenida al Movimiento de Adultos | `bienvenida-adultos` |
| 2 | 📜 La Política — Marco y Principios | `politica-marco` |
| 3 | 🔄 El Ciclo del Adulto en el Movimiento | `ciclo-adulto` |
| 4 | 🧠 Las 7 Competencias Esenciales | `competencias-esenciales` |
| 5 | 🗺️ Tu Plan Personal de Desarrollo | `plan-personal` |

Diseños (reconstruidos desde el JSON el 27-09-2026): `01-Diseno-Cursos/Curso-01…05`.

## 4. Nivel 2 — Profundización por fase del ciclo

El Curso 3 recorre el ciclo **en panorama**; el Nivel 2 baja a la práctica de cada fase con sus documentos oficiales y sus
herramientas. **Mira desde el otro lado**: el Nivel 1 habla al adulto que entra y hace su plan; el Nivel 2 habla sobre todo a
**quien vincula, acompaña, evalúa y decide** —y al adulto que vive esa fase—.

| # | Curso | `courseId` | Fase | Fuentes angulares |
|---|---|---|---|---|
| 6 | 🚪 Vincular nuevos adultos al grupo | `vinculacion-adultos` | Atracción y Vinculación | PNAM §5.1; *Atracción y Vinculación* (2020); *Procedimiento para Requisición, Convocatoria y Selección Objetiva* (2020); *Ingreso del Adulto*; *Compromiso de Acuerdo Mutuo* V3.0 (28-06-2025); *Nombramiento*; *Guía — Fase de inducción de Adultos Voluntarios Nuevos* (mar-2025) |
| 7 | 🤝 Ser asesor personal | `asesor-personal` | Desempeño | PNAM §3 y §5.2; *Guía de Acompañamiento y Evaluación del Adulto* (2020) §4.2; *Diccionario de Competencias* 2.4; *Tips para encontrar tu asesor personal*; *Aval asesor personal*; *Guía cómo realizar una asesoría personal* (2025); *Desempeño* (2020); circular DNAM-C-098-2024 |
| 8 | 📋 Acompañamiento y Evaluación 360° en la práctica | `evaluacion-360` | Desempeño | PNAM §5.2.2 y §5.2.4; *Guía de Acompañamiento y Evaluación* §3–§5; *Bitácora de Acompañamiento*; las tres *Encuestas de percepción*; *Recomendaciones para aplicar las encuestas*; *Consentimiento informado* |
| 9 | 💻 Talento 360° en la práctica | `talento-360` | Desempeño (herramienta) | Tutoriales *Registro y Validación de Datos* y *Postulación a Cargos* (DNAM, 2024); *Procedimiento… Selección Objetiva* §1; circular DNAM-C-098-2024; *Guía cómo desarrollarse en el cargo* (2025) |
| 10 | 🏁 Cierre y reinicio de ciclo | `decisiones-para-el-futuro` | Decisiones para el Futuro | PNAM §5.3 y §5.2.1; *Desempeño* §5; *Guía de Acompañamiento y Evaluación* §4.1 (Momento 3) y §5.1; *Compromiso de Acuerdo Mutuo* V3.0; *Nombramiento* |

**Duración:** 6 lecciones de 5–7 min más la bienvenida → **35–45 min por curso**.

**Por qué los cinco a la vez.** El `.docx` separaba Prioridad 1 (6, 7, 10) y Prioridad 2 (8, 9). Se construyen juntos porque
se sostienen entre sí: el 7 (asesor) y el 8 (evaluación) comparten la misma evaluación 360° vista desde dos lados, el 9 es
donde ambos se registran, y el 10 no se entiende sin la evaluación final del 8. Publicar el 10 sin el 8 dejaría una remisión
a un curso inexistente.

### 4.1 Lo que las fuentes corrigen del `.docx`

1. **El asesor personal no es un cargo, es un rol** (*Guía de Acompañamiento y Evaluación*, §4.2, p. 13 impresa). El Curso 7
   no lo presenta como cargo ni le atribuye funciones del *Manual de Cargos*.
2. **Las competencias específicas no tienen grados de dominio** en el *Diccionario de Competencias*: traen criterio y conductas
   observables. Los cuatro grados son de las **esenciales** (PNAM §4.1). El `.docx` atribuía «4 grados» a la Asesoría Personal
   (tabla del Nivel 3, Curso 14): **corregir antes de construir el Nivel 3**.
3. **Las «4 modalidades» de la 360°** (autoevaluación, coevaluación, heteroevaluación y evaluación) son las de la PNAM §5.2.2;
   la *Guía* las opera con **dos instrumentos**: la evaluación por competencias (autoevaluación, jefe inmediato, asesor y pares)
   y las encuestas a niños, jóvenes y padres. El Curso 8 enseña las dos cosas y su relación; no la glosa del `.docx`
   («evaluación formal del asesor»).
4. **Atracción y Vinculación: cinco pasos en la PNAM, cuatro en el documento de 2020** con otro orden (y la *Integración* como
   apartado propio). El Curso 6 sigue los cinco de la PNAM —los mismos del Curso 3— y no mezcla las dos listas.
5. **Las encuestas de percepción (2020) nombran Manada, Tropa, Comunidad y Clan**; no traen formulario para la Familia de
   Cachorros. El Curso 8 lo dice y remite a la Comisión Regional de Adultos; no inventa el formulario.

### 4.2 Lo que el Nivel 2 NO dice

- Pasos de pantalla de Talento 360° que no estén en los tutoriales oficiales: la plataforma cambia, el curso enseña el
  **flujo** y remite al tutorial y a la mesa de ayuda.
- Que la Insignia de Madera se gana por asistir a cursos: se certifica por **desempeño demostrado** (PNAM §5.2.2).
- Procedimientos disciplinarios: el Curso 10 trata la terminación del acuerdo **como la trae el Acuerdo Mutuo** y no reemplaza
  al debido proceso ni a los reglamentos.
- Ninguna reflexión pide el nombre de una persona (decisión del dueño, 27-09-2026).

## 5. Nivel 3 — Especialización por cargo

**Replanteado el 28-09-2026 (ADR-107), con autonomía delegada por el dueño.** El `.docx` proponía siete cursos (11–17)
sin haberlos cotejado con el *Manual de cargos, perfiles y funciones por competencias* (DNAM, agosto de 2020). Al cotejarlos:

| Curso del `.docx` | Qué pasó | Por qué |
|---|---|---|
| 11 Cargos del Consejo (panorama) | **Se queda, reenfocado** | «Los 11 cargos oficiales del consejo» no tiene fuente: el Reglamento de Grupos (5.7) da al Consejo Presidente, Vicepresidente, Secretario, Tesorero e Intendente opcional; el *Manual* tiene **20 fichas** de Grupo. El curso enseña el mapa de las 20 y a **leer una ficha** |
| 12 Tesorero | **Se cae** | Lo cubre Desarrollo Institucional, Curso 10 (fichas 2.1.7 y 2.1.8, Cap. 10 del Reglamento de Grupos) |
| 13 Secretario | **Se integra al Curso 12** | Su ficha (2.1.4) es la del consejero más una Función 4 y una competencia; DI 9 ya trata actas y registro |
| 14 Asesor Personal a fondo | **Se cae** | Es el Curso 7 de esta línea. Y el asesor es un **rol**, no un cargo (§4.1.1) |
| 15 Canciller | **Se queda** | Ficha 2.1.6; ninguna otra línea lo trata. **No** es «garante del debido proceso» (esa es la competencia 8 del Jefe de Grupo) |
| 16 Consejero juvenil | **Se cae** | Lo cubre Programa de Jóvenes, Curso 19; no es un cargo de adulto y el *Manual* no tiene ficha |
| 17 Jefe de Grupo | **Se queda y cierra el nivel** | Ficha 2.1.10 |
| — | **Se añade: Comisionado Regional de Adultos** | Fichas 2.2.23 y 2.2.24 y PNAM §7: la Comisión Regional es a quien remiten los Cursos 7, 8 y 9. Precedente: Comisionado de Programa de Jóvenes (PJ 18) |

**Reparto con Desarrollo Institucional (decidido por el dueño, 28-09-2026).** El Nivel 3 de DI (planeado, sin construir)
proponía también un panorama de cargos, Jefe de Grupo y Consejero. Cada línea mira el cargo con su lente: **PA, desde las
competencias y el ciclo del adulto** (el *Manual de Cargos* es el documento 4 de la PNAM); **DI, desde los órganos, la
gestión y el Plan de Grupo** (Presidente y Vicepresidente, comisionado en general, órganos de control). DI remite a estos
cursos y no los duplica (su propio plan, §5.2, ya lo prevé).

| # | Curso | `courseId` | Fuentes angulares |
|---|---|---|---|
| 11 | 🗂️ Los cargos del Grupo: leer una ficha | `cargos-del-grupo` | *Manual* §2.1 (20 fichas); *Diccionario de Competencias*; PNAM §4 y §5.1.2 |
| 12 | 🏛️ Ser consejero de grupo | `consejero-de-grupo` | *Manual* 2.1.1–2.1.5; Reglamento de Grupos 5.1 (integración); *Desempeño* y *Guía de Acompañamiento y Evaluación* (los consejeros en el ciclo) |
| 13 | 🎖️ El Canciller y los reconocimientos | `canciller-de-grupo` | *Manual* 2.1.6; Reglamento de Grupos 4.3.7, 8.8; *Manual de Estímulos Nacionales* (2020); Estatuto 2025 Arts. 60–61 y Reglamento Nacional 2026 Arts. 176–179 y 246 (Cancillería Nacional) |
| 14 | 🧭 Comisionado Regional de Adultos | `comisionado-regional-adultos` | *Manual* 2.2.23 y 2.2.24; PNAM §7; *Guía de Acompañamiento y Evaluación*; Comunicado DNAM-2026-124 |
| 15 | 🦸 Jefe de Grupo: el que acompaña a los adultos | `jefe-de-grupo` | *Manual* 2.1.10 y 2.1.11; Estatuto 2025 Art. 19; documentos DNAM del ciclo (*Recomendaciones* de encuestas, circular, *Desempeño*) |

**Reglas del nivel** (además de las del Nivel 2):
- **En cargos manda el *Manual*** (Acuerdo CSN 558/2023). Donde el Reglamento de Grupos dice otra cosa (quién elige las
  dignidades del Consejo, edades, Insignia de Madera como requisito, periodos), el curso lo advierte y no lo enseña como vigente.
- **Las competencias específicas no tienen grados**; las esenciales sí, y **cada ficha fija el grado esperado** del cargo:
  es un nivel hacia el que se avanza («o demostrar interés para desarrollarlas»), no un filtro de entrada.
- **Se cita por nombre** la competencia específica, con el número del *Diccionario*: el *Manual* numera mal alguna (el «13»
  del Vicepresidente es la 12).
- **No se enseñan los defectos de plantilla del *Manual*** como jerarquía (p. ej., que al Contador «le responde» el Jefe de Grupo).
- **Si el Jefe de Grupo es o no miembro del Consejo**: discrepancia registrada en el Glosario y sin arbitrar; ningún curso
  lo afirma en ningún sentido.
- Duración: intro + 6 lecciones de 5–7 min → **35–45 min por curso**, como el Nivel 2.

## 6. Fuentes

Toda la línea se apoya en los documentos oficiales de la PNAM, en `DOCUMENTOS BASE/Información para CRAM/Información para
CRAM/Documentos Oficiales PNAM 2022/` (numeración de archivo **nuestra**, no oficial: citar por título) y en los tutoriales de
`Tutoriales Talento 360°/`.

---
_v1.2 — 28-09-2026 (Nivel 3). v1.1 — 27-09-2026. v1.0 = el `.docx` del 09-05-2026._
