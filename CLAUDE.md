# CLAUDE.md — Línea Política de Adultos en el Movimiento

> Ancla local, no la fuente completa de reglas. El documento rector del proyecto vive en el repo raíz **`DOCS-MAESTRAS-ASC`** (`CLAUDE.md`, `ECOSISTEMA.md`, `DECISIONES.md`, `GLOSARIO-ASC.md`) — léelo primero si esta sesión se abrió aislada en este repo y esos archivos no aparecieron solos.

## Qué es

Una de las 3 líneas activas de formación digital para adultos voluntarios de la Asociación Scouts de Colombia (junto a Desarrollo Institucional y Programa de Jóvenes). Cursos cortos, certificables y autoservicio sobre el ciclo del adulto en el Movimiento: marco filosófico, principios, las 7 competencias esenciales y el plan personal de desarrollo.

**En vivo:** https://maximoaluna-blip.github.io/INDUCCION-ADULTOS/

## Comparte con Desarrollo Institucional y Programa de Jóvenes

- Mismo motor (`engine.js` / `build-course.js` en `05-Generador-Cursos/`), copiado y adaptado por línea.
- Mismo backend de Google Apps Script + Sheet, mismo token (`ADULTOS_ASC_2026`) durante el piloto compartido.
- Mismo pipeline de publicación — `CLAUDE.md` raíz §7-bis — y el mismo modelo de 3 auditorías antes de publicar un curso: doctrinal, pedagógica y funcional.
- Sin cursos habilitantes ni piloto humano obligatorio (ADR-019, `DECISIONES.md` raíz) — las 3 auditorías son la compuerta de calidad.

## Específico de esta línea

| Documento | Para qué |
|---|---|
| `CREAR-CURSO.md` | Manual operativo de creación de cursos de esta línea |
| `Recomendaciones-Cowork-Diseno-Cursos.md` | Guía de diseño pedagógico dirigida a Cowork |
| `INDICE-PROYECTO.md` | Estado, URLs, dependencias técnicas |
| `BACKEND.md` | Backend Apps Script propio de esta línea |
| `AUDITORIA.md` | Historial de auditoría doctrinal |
| `PRUEBAS-E2E/` | Suite de auditoría funcional — la primera del proyecto (ADR-012); patrón que se replicó en Programa de Jóvenes |

## Estado (ver `INDICE-PROYECTO.md` para el detalle vivo)

5 cursos activos (Nivel 1: Bienvenida, Política Marco, Ciclo del Adulto, Competencias Esenciales, Plan Personal). Un borrador (`politica-adultos`) sin publicar. 17 cursos en el roadmap total.
