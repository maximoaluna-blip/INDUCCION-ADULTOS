# Recomendaciones para Cowork — Diseño de los siguientes cursos

**Línea Política de Adultos en el Movimiento**
**Basado en:** retrospectiva de los 5 cursos del Nivel 1 (Bienvenida, Política Marco, Ciclo, Competencias, Plan Personal) ya implementados y desplegados.

---

## 1. Propósito de este documento

Esta es la guía operativa para que **Cowork** (Claude del chat/proyecto que diseña pedagógicamente los cursos) tenga claridad sobre qué entregar y qué no, al construir los próximos cursos de la línea (Tier 2 — Profundización, Tier 3 — Por cargo, Tier 4 — Transversales).

División de roles ya acordada:

- **Cowork** diseña pedagógicamente: hook, lecciones, ejemplos, reflexiones, quizzes, ideas centrales, tono.
- **Claude Code** traduce a JSON, mapea a section types del motor, hace build/preview, despliega, ajusta.

---

## 2. Patrones del Nivel 1 que funcionaron

### 2.1 Hook de una frase, repetible

Cada curso del Nivel 1 tiene una frase ancla que se enuncia en la intro y se referencia al final. Ejemplos del Nivel 1:

- **Curso 1 (Bienvenida):** *"Eres un superhéroe sin saberlo."*
- **Curso 4 (Competencias):** *"Saber + Hacer + Ser, no son tres cosas sino una."*

**Recomendación:** cada curso necesita un hook así. Es el ancla emocional.

### 2.2 Anti-definición antes de la definición técnica

Citar la PNAM 2022 en seco aleja. Lo que funciona:

1. **Anti-definición:** *"Si abres el documento te dice X. Es exacto pero pesado."*
2. **Ejemplos cotidianos** del grupo scout.
3. **Cita oficial textual** dentro de un `policy-quote` plegable.
4. **Reformulación accesible:** *"En simple, esto significa..."*

### 2.3 Estructura interna de cada lección

| Bloque | Contenido | Quién lo escribe |
|---|---|---|
| 1 — Anclaje | Tiempo estimado + idea central en 1 frase | Cowork |
| 2 — Desarrollo | 200–400 palabras, prosa práctica con ejemplos | Cowork |
| 3 — Cita oficial (cuando aplica) | Texto literal de PNAM | Cowork |
| 4 — Reformulación accesible | *"En simple, esto significa..."* | Cowork |
| 5 — Reflexión personal | Pregunta aterrizada al grupo o región del adulto | Cowork |
| 6 — Mini-quiz | 2 preguntas, 3 opciones cada una | Cowork |
| 7 — Logro al completar | Frase de 2-4 palabras | Cowork |

Lo que viene después (tipo de sección visual, colores, IDs, layout) lo monta Claude Code.

### 2.4 Reflexiones que aterrizan en realidad concreta

❌ *"Reflexiona sobre el liderazgo en tu grupo."*

✅ *"Describe a UN dirigente concreto de tu grupo que admiras. ¿Qué cualidad específica tiene? ¿Cuándo la has visto en acción?"*

### 2.5 Quizzes que enseñan, no que castigan

Cada distractor debería ser plausible: idealmente, **uno de los distractores debe ser la idea vieja que el curso está tratando de desarmar**.

Ejemplo del Curso 1:

> *"Una mamá del consejo dice: 'yo no soy scout de verdad, solo soy mamá'. ¿Qué le dirías?"*
> a) Que tiene razón, hasta que su hijo termine en el grupo
> b) **Que cuando aceptó el cargo en el consejo se volvió 'adulta del movimiento'** ✅
> c) Que debe primero hacer la promesa scout

---

## 3. Qué NO necesita pensar Cowork

Para evitar fricción, estas decisiones las toma Claude Code:

- Tipos de sección del motor (`info-box`, `method-grid`, `timeline`, `policy-quote`, `photo-upload`, `self-assessment`, `plan-builder`, etc.).
- Colores, bordes, layout visual.
- Estructura JSON, esquema, IDs de logros, `unlockOnModule`.
- Mecánica de los `photo-upload` y los `plan-builder` (Cowork solo dice *"aquí va una foto del dirigente ideal"* o *"aquí va un plan-builder con 3 metas"*).
- Encabezados de quiz, etiquetas de botones, copy de UI.
- Conexiones técnicas cross-course (qué clave de localStorage lee qué).

**Cowork escribe libre.** Markdown, prosa corrida, outline, viñetas — lo que sea más cómodo. Claude Code traduce.

---

## 4. Recomendaciones por Tier futuro

### 4.1 Tier 2 — Profundización por fase del ciclo

| Curso | Riesgo principal | Antídoto |
|---|---|---|
| **6 — Vinculación de nuevos adultos** | Sonar a manual de RRHH. | Plantilla de "primer mes" como `plan-builder`. Casos reales: dirigente que se queda vs el que se va. |
| **7 — Cómo ser asesor personal** | Confundir asesor con coach o psicólogo. | Distinguir bien los roles (asesor vs jefe vs consejero). Diálogos modelo cortos. |
| **8 — Acompañamiento y Evaluación 360°** | Quedar en lo teórico. | Plantilla de entrevista 360° como `self-assessment`. Casos: qué hacer si la 360° revela problema serio. |
| **9 — Talento 360° práctico** | Hacer un tutorial pesado de software. | Lecciones cortas con captura de pantalla + texto explicativo, no videos largos. |
| **10 — Cierre y reinicio de ciclo** | Cierre triste o burocratico. | Reformular el cierre como "graduación" emocional. Plantilla de "carta a tu sucesor". |

### 4.2 Tier 3 — Cursos por cargo específico

- Cada curso de cargo se basa en el **Manual de Cargos, Funciones y Perfiles** (PNAM Doc 4).
- **Patrón propuesto por curso de cargo:**
  - Lección 1: Tu cargo en una página (gobernanza/operación/control + funciones)
  - Lección 2: Las 3-5 competencias críticas (del Diccionario de Competencias)
  - Lección 3: Las herramientas que vas a usar (formatos, calendarios, plantillas)
  - Lección 4: Casos típicos del cargo
  - Lección 5: Errores comunes a evitar
  - Lección 6: Tu plan de los primeros 90 días

### 4.3 Tier 4 — Cursos transversales

- Safe from Harm (A Salvo del Peligro): usar el material oficial DNDI.
- Diversidad e Inclusión: cuidar mucho lenguaje y ejemplos.
- Gestión para la Motivación: aplicar el modelo de motivación scout oficial.

---

## 5. Hilos cross-course que deben quedar amarrados

Pídele a Cowork que cada curso cierre con un anuncio del siguiente (1-2 frases). En particular:

- El **autodiagnóstico del Curso 4 (Competencias)** ya está implementado. Cualquier curso del Tier 2 que dependa de él debe leer la clave global `competencyProfile`.
- El **Plan Personal del Curso 5** se puede ampliar en los cursos del Tier 2 con metas más específicas por fase del ciclo.

---

## 6. Cómo entregarme el contenido

Cuando un curso esté completo en Cowork, **tráelo todo de una vez** (las lecciones, intro, reflexiones, quizzes, achievements y descripción del certificado). No por lecciones sueltas.

**Formato libre.** Puede ser markdown, prosa corrida, outline, lista de bullets. Yo organizo.

Si falta algo (por ejemplo, una pregunta de quiz, una reflexión), lo señalo y te propongo opciones para validación.

---

## 7. Glosario rápido

| Término del proyecto | Qué significa |
|---|---|
| **Línea** | Una de las 4 líneas formativas: **Política de Adultos**, Programa de Jóvenes, Desarrollo Institucional, Políticas Transversales. |
| **Tier** | Cada línea tiene tiers (en Adultos: Tier 1 = Fundamentación, Tier 2 = Profundización, etc.). |
| **Curso** | Una unidad formativa de 20-35 min, 5-7 lecciones cortas. |
| **Lección** | Bloque de 3-8 minutos con una idea central, reflexión y mini-quiz. |
| **Hito pedagógico** | El "aha moment" que la lección busca producir en el adulto. |
| **Hook** | La frase clave que abre y cierra el curso. |
| **Plan-builder** | Componente interactivo donde el adulto arma su plan personal. |
| **Self-assessment** | Autodiagnóstico interactivo con dimensiones y grados. |
| **Policy-quote** | Cita textual de un documento oficial, plegable por defecto. |
| **Photo-upload** | Espacio para subir un dibujo o imagen del adulto. |
| **Achievement** | Logro que se desbloquea al completar una lección o un curso. |
| **Cross-course** | Conexión técnica entre cursos (el resultado de uno alimenta al siguiente). |

---

## 8. Resumen ejecutivo en 5 puntos

1. **Hook por curso.** Una frase. Repetible.
2. **Ejemplos antes que definiciones.** Cita oficial plegable, no enfrente.
3. **Reflexiones aterrizadas.** Forzar a pensar en un caso concreto.
4. **Quizzes que enseñan.** Distractores con la idea vieja.
5. **Entregar el curso completo, no por pedazos.** Yo lo traduzco una sola vez.

---

_Documento de coordinación entre Cowork y Claude Code para los siguientes cursos de la Línea Política de Adultos. Sujeto a iteración tras cada nueva entrega._
