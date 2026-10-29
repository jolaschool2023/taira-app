# Registro de desarrollo asistido por IA

**Proyecto:** Lumen · Biblioteca inteligente  
**Fecha:** 22 de octubre de 2026  
**Flujo:** agente único con herramientas de exploración, edición, ejecución de terminal y navegador automatizado.

Este documento resume cómo se aplicó un agente de IA a todo el ciclo de desarrollo: planificación, diseño, implementación, pruebas, depuración y documentación. No es una transcripción literal, sino el registro de decisiones y evidencia verificable.

---

## 1. Planificación

### Contexto analizado

El espacio de trabajo ya contenía prototipos educativos y una API de videojuegos en Flask. Se optó por crear una aplicación nueva y autocontenida para no romper el material existente.

### Opciones evaluadas

| Opción | Atractivo | Riesgo |
| --- | --- | --- |
| Agenda inteligente | Alta familiaridad | Menos superficie para IA explicable |
| Asistente de programación | Buena demo técnica | Difícil de evaluar sin ejecutar código real |
| Biblioteca inteligente | Datos ricos, recomendaciones visibles | Requiere catálogo semilla |

### Decisión

Se eligió **biblioteca inteligente** porque permite demostrar las cinco capas solicitadas con una experiencia clara:

- Frontend: catálogo, perfil lector y chat.
- Backend/API: préstamos, recomendaciones e insights.
- Base de datos: relaciones entre libros y préstamos.
- IA: personalización basada en contenido, lenguaje natural y explicabilidad.
- Producto: el valor de la IA se ve inmediatamente al tomar un libro prestado.

### Criterios de éxito

1. Funcionar sin claves de API ni conexión a servicios de terceros.
2. Cubrir el ciclo completo del préstamo.
3. Generar recomendaciones que cambien tras el historial.
4. Ofrecer un asistente en español con respuestas basadas en datos reales.
5. Poder verificarse con pruebas automatizadas y en navegador.

---

## 2. Diseño

### Arquitectura

Se eligió una arquitectura monolítica modular:

```text
Flask → database.py (SQLite)
      → ai_engine.py (TF-IDF + intención)
      → static/ (SPA sin framework)
```

**Razones:**

- Flask y SQLite ya estaban disponibles en el entorno.
- Un único proceso simplifica la ejecución de la demo.
- El motor de IA separado se puede probar sin HTTP.
- El frontend sin build elimina dependencias y pasos de compilación.

### Modelo de datos

```text
books
  id, title, author, genre, year, pages, rating,
  description, tags, cover, created_at

loans
  id, book_id → books.id, borrower, borrowed_at, returned_at
```

La disponibilidad se deriva del préstamo activo, no se duplica en `books`. Un índice único parcial impide dos préstamos activos del mismo libro.

### Superficie de API

Se diseñaron endpoints para catálogo, estadísticas, préstamos, recomendaciones, insights y asistente. Se mantuvo una respuesta JSON uniforme y errores en español.

### Diseño de la IA

El agente comparó tres alternativas:

1. LLM externo: resultados ricos, pero requiere clave, red y coste.
2. Modelo local pesado: mayor capacidad semántica, pero sobredimensionado para 16 libros.
3. TF-IDF + reglas: explicable, rápido, determinista y sin dependencias.

Se eligió la tercera. El asistente detecta intención, género, autoría, título, extensión y nuevas peticiones. El recomendador combina similitud coseno, géneros preferidos, valoración, popularidad y novedad.

### Diseño visual

Se definió una identidad editorial:

- Fondo papel cálido, verde bosque profundo y detalles dorados.
- Tipografía serif para títulos y sans para interfaz.
- Portadas generadas con gradientes y clases por libro.
- Navegación lateral en escritorio y barra inferior en móvil.
- Estados vacíos, carga y errores visibles.

---

## 3. Implementación

### Base de datos y backend

- `database.py`: esquema, 16 libros semilla, consultas, préstamo/devolución y métricas.
- `app.py`: factory de Flask, validación de payloads, endpoints REST, errores JSON y servido del frontend.
- Validaciones: año, páginas, valoración, portada, etiquetas, nombre de lector/a y longitud de mensajes.
- Índice único parcial para evitar carreras de préstamo.

### Motor de IA

- Normalización Unicode y eliminación de acentos.
- Lista de palabras vacías en español.
- Vectorización TF-IDF de título, autoría, género, etiquetas y descripción.
- Perfil ponderado a partir de préstamos activos e históricos.
- Ranking con filtros de disponibilidad, páginas, género y novedad.
- Recomendaciones “similares a” un título.
- Inspección de intención para saludos, ayuda, disponibilidad, resumen, autoría, recomendación y búsqueda semántica.
- Insights narrativos con nombre, páginas, géneros, autor recurrente y libro favorito.

### Frontend

- SPA con tres vistas: Descubrir, Mi lectura y Asistente IA.
- Estado centralizado y renderizado con DOM seguro.
- Búsqueda con debounce y filtros combinables.
- Modal de ficha, préstamo, devolución y alta de libro.
- Perfil local con `localStorage` y préstamo pendiente tras configurar el nombre.
- Chat con sugerencias, indicador de escritura y fichas de libro interactivas.
- Responsive con barra de navegación inferior y layouts fluidos.

---

## 4. Pruebas y depuración

### Pruebas automatizadas

Se implementaron 9 pruebas de integración con base de datos temporal:

```text
python -m unittest discover -s tests -v
Ran 9 tests in 1.505s
OK
```

Cobertura funcional:

- Salud del servicio y catálogo semilla.
- Búsqueda y filtros.
- Validación y creación de libros.
- Préstamo, conflicto de disponibilidad y devolución.
- Devolución sin préstamo activo.
- Recomendaciones editoriales y personalizadas.
- Insights de lectura.
- Asistente: recomendación, resumen y similitud.
- Validación de mensajes del asistente.

### Verificación en navegador

Se automatizó Microsoft Edge con Playwright Core para ejecutar el flujo real:

1. Carga inicial: 20 tarjetas, 4 recomendaciones y 16 libros de catálogo.
2. Apertura de ficha de “El principito”.
3. Intento de préstamo sin perfil → apertura del formulario de identidad.
4. Alta del perfil “Ada Lovelace” → préstamo completado automáticamente.
5. Recomendaciones cambiadas a “Elegido para ti, Ada”.
6. Vista “Mi lectura”: 1 préstamo activo, 1 fila de historial, 96 páginas y género “Fábula”.
7. Chat: sugerencia “novela corta” → 3 fichas de libro y contexto actualizado.
8. Vista móvil 390×844: sin desbordamiento horizontal, barra inferior fija y catálogo a dos columnas.
9. Consola del navegador sin errores.

Evidencia de la última ejecución:

```text
INITIAL {"cards":20,"recommendations":4,"catalog":16,"overflowX":false}
AFTER_BORROW {"profile":"Ada Lovelace","loanBadge":"1","recommendationTitle":"Elegido para ti, Ada"}
READING {"activeItems":1,"historyRows":1,"insightBooks":"1","insightGenre":"Fábula"}
CHAT {"messages":3,"replyBooks":3,"contextLoans":"1"}
MOBILE {"overflowX":false,"sidebarPosition":"fixed","gridColumns":"174px 174px"}
ERRORS []
```

### Hallazgos y correcciones

| Hallazgo | Corrección |
| --- | --- |
| El historial de IA podía asociar un libro a un préstamo antiguo al usar un diccionario por libro. | Se agregaron conjuntos de libros leídos y préstamos activos para calcular el perfil correctamente. |
| La palabra genérica “historia” activaba el género “Historia” en frases como “una historia que me haga sentir bien”. | Se restringieron las palabras clave a “novela histórica”, “histórico” y “ensayo histórico”. |
| “Novela corta” no aplicaba el filtro de páginas porque solo se detectaba “corto”. | Se añadieron flexiones de género y número y se ajustó el umbral a 360 páginas. |
| Las peticiones por género podían mezclar otros géneros por la valoración alta. | Se añadió filtro explícito de género al recomendador. |
| La verificación E2E falló una vez por hacer clic antes de que terminara el renderizado asíncrono del catálogo. | Se añadió espera de acción y desplazamiento al elemento; no era un defecto de la aplicación. |
| La media de valoración no existía en las métricas. | Se amplió `get_stats` con `AVG(rating)` y se conectó a la interfaz. |

---

## 5. Documentación y cierre

- README con propósito, stack, arquitectura, endpoints, ejecución y pruebas.
- Este registro de agente con decisiones, evidencia y límites.
- Comentarios de código limitados a docstrings y nombres expresivos.
- Base de datos semilla reproducible y validación de datos.
- `.gitignore` para artefactos y base local.

### Limitaciones conocidas

- Sin autenticación real: el nombre de lector/a es local y no verificado.
- Sin reservas para libros prestados.
- El motor es de recuperación de contenido, no un LLM generativo.
- No hay migraciones formales de esquema.
- SQLite y el servidor de desarrollo son adecuados para demo, no para carga productiva.

### Próximos pasos posibles

1. Autenticación y perfiles persistentes.
2. Reservas y fechas de vencimiento.
3. Embeddings semánticos y búsqueda vectorial.
4. Panel de administración y mantenimiento del catálogo.
5. Docker, migraciones y despliegue WSGI.

---

## Resultado

La aplicación cumple los cinco componentes solicitados y añade una capa de IA explicable, local y verificable. El agente participó en todas las fases: comparó alternativas, diseñó el modelo de datos y la API, escribió el código, ejecutó pruebas, detectó y corrigió fallos, validó el flujo en un navegador real y documentó el proceso.
