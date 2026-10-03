# CLAUDE.md — Línea Política de Adultos en el Movimiento

> Ancla local, no la fuente completa de reglas. El documento rector del proyecto vive en el repo raíz **`DOCS-MAESTRAS-ASC`** (`CLAUDE.md`, `ECOSISTEMA.md`, `DECISIONES.md`, `GLOSARIO-ASC.md`) — léelo primero si esta sesión se abrió aislada en este repo y esos archivos no aparecieron solos.

## Qué es

Una de las líneas de formación digital para adultos voluntarios de la Asociación Scouts de Colombia (junto a Desarrollo Institucional, Programa de Jóvenes y Políticas Transversales). Cursos cortos, certificables y autoservicio sobre el ciclo del adulto en el Movimiento: la fundamentación (Nivel 1) y la práctica de cada fase del ciclo (Nivel 2).

**En vivo:** https://maximoaluna-blip.github.io/INDUCCION-ADULTOS/

## Comparte con Desarrollo Institucional y Programa de Jóvenes

- Mismo motor, pero desde el 03-ago-2026 con **fuente única** (ADR-025): el núcleo `engine.core.js` vive en `_MOTOR/` del repo raíz `DOCS-MAESTRAS-ASC` y se propaga con `sincronizar-motor.py`. Lo que aquí hay en `05-Generador-Cursos/templates/engine.core.js` es una **copia: no editarla**. Lo propio de esta línea va en `engine.linea.js`. `build-course.js` y `styles.css` siguen copiados por línea (los vigila `verificar-motor.py`), pero el `plan-builder` ya no está en ellos: lo renderiza `templates/render.plan-builder.js`, copia sincronizada de `_MOTOR/`, **sin vocabulario** — los textos del componente van en `labels` dentro del JSON del curso (ADR-034 Fase 1).
- Mismo backend de Google Apps Script + Sheet, mismo token (`ADULTOS_ASC_2026`) durante el piloto compartido.
- Mismo pipeline de publicación — `CLAUDE.md` raíz §7-bis — y el mismo modelo de 3 auditorías antes de publicar un curso: doctrinal, pedagógica y funcional.
- Sin cursos habilitantes ni piloto humano obligatorio (ADR-019, `DECISIONES.md` raíz) — las 3 auditorías son la compuerta de calidad.

## Específico de esta línea

| Documento | Para qué |
|---|---|
| `CREAR-CURSO.md` | Manual operativo de creación de cursos de esta línea (incluye las 3 auditorías como compuerta antes de publicar) |
| `Recomendaciones-Cowork-Diseno-Cursos.md` | Guía de diseño pedagógico dirigida a Cowork |
| `INDICE-PROYECTO.md` | Estado, URLs, dependencias técnicas |
| `BACKEND.md` | Backend Apps Script propio de esta línea |
| `AUDITORIA.md` | Historial de auditoría doctrinal |
| `PRUEBAS-E2E/` | Suite de auditoría funcional — la primera del proyecto (ADR-012); patrón que se replicó en Programa de Jóvenes |

## Estado (ver `INDICE-PROYECTO.md` para el detalle vivo)

> **Diseño versionado desde el 27-sep-2026 (ADR-098).** Cada curso tiene su `.md` en `01-Diseno-Cursos/`, y **un cambio de contenido se hace ahí primero**. ⚠️ Los diseños de los Cursos 1–5 se **reconstruyeron desde el JSON**: dicen lo que quedó, no lo que se quiso. El Plan de Formación vigente es **`Plan-de-Formacion-Linea-Politica-de-Adultos.md`**; el `.docx` queda como histórico.
>
> **Ninguna reflexión pide el nombre de una persona ni invita a identificar a un tercero** (regla del dueño, 27-sep-2026): se escribe por el cargo o el rol. Al barrer el Nivel 1 se corrigieron cuatro que lo hacían.
>
> **La fuga de conjunto no la mide ninguna compuerta** (ADR-099): con la «regla ciega» —descartar opciones con absolutos y elegir la que más suena a la lección— el Nivel 2 aprobaba hasta 5 de 6 quizzes sin leer. Al tocar un quiz, volver a medirla (≤ 1 de 6).
>
> **Nivel 3 (ADR-107): en cargos manda el *Manual de Cargos*.** Quién nombra y a quién se responde, ficha por ficha; «le responden» no es «lo nombra»; las específicas no tienen grados; nada del Reglamento de Grupos sobre cargos se enseña como vigente; si el Jefe de Grupo es o no del Consejo, no se afirma; el jefe inmediato de un subjefe de rama no lo fija ninguna fuente. Y **una tesis de curso decide sola los quizzes** («vigilar no es conducir», «no lo decides solo»): en los cinco cursos la regla ciega aprobaba 3 a 6 de 6 hasta que las correctas pasaron a ser el cargo **actuando** y los distractores, la tesis leída **por exceso**.
>
> **El build admite `commitmentBox` por curso** (ADR-098): los cursos del Nivel 2 lo declaran para que el Compromiso Personal recoja la misión de su última lección. Sin él, el build imprime el texto genérico de siempre.

> **La página que verifica los certificados vive en la RAÍZ del repo** (`verificar-certificado.html`) y se enlaza desde el pie del `index.html` — **ADR-070, 20-sep-2026**. El certificado le dice al adulto *«verifica este certificado ingresando el código en la plataforma web»*, así que la página es la otra mitad de esa promesa. ⚠️ Hasta ese día **apuntaba al backend de Rover** (1 certificado) en vez de al de la plataforma (21), así que **ningún certificado real se podía validar**; y **nadie la enlazaba desde ningún sitio**. Al tocar esa página, comprobar las dos cosas: el `SCRIPT_URL` y que siga enlazada.

Estado vivo en `ESTADO.md` de la raíz (se genera con `python generar-estado.py`). **Niveles 1, 2 y 3** publicados (el 3, «Especialización por cargo», desde el ADR-107); la v1 monolítica `politica-adultos`, que nunca se publicó, está archivada en `05-Generador-Cursos/archivo/` y `01-Diseno-Cursos/archivo/` (ADR-119): no se mantiene ni se compila; el Nivel 4 del plan lo cubre la línea Políticas Transversales.
> **La landing agrupa por nivel desde el 17-sep-2026 (ADR-058).** Cada entrada de `cursos.json` lleva **`level`, `levelName` y `order`**, y el `index.html` los pinta en secciones plegables. **Hasta ese día esta línea no los emitía siquiera**: su `build-course.js` no los escribía y la landing era una lista plana. El `levelName` sale del **Plan de Formación** (tabla 0: «Ruta de Fundamentación»), no se inventa. ⚠️ Son **metadatos de catálogo** — no entran en el HTML del curso, así que añadirlos **no cambió ninguna página publicada**. Y nació `PRUEBAS-E2E/tests/landing.spec.js`, porque **ninguna prueba tocaba esta página**: las suites se parametrizan por el catálogo y lo que no es un curso quedaba fuera por construcción.

