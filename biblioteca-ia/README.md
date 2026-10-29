# Lumen · Biblioteca inteligente

Aplicación full-stack de biblioteca que aprende de los hábitos de lectura para recomendar libros y conversar en lenguaje natural. Incluye frontend, API REST, base de datos SQLite y un motor de IA local que funciona sin claves ni servicios externos.

## Características

- Catálogo de 16 títulos con búsqueda, filtros por género, disponibilidad y orden.
- Fichas de libro con descripción, etiquetas, valoración y estado del préstamo.
- Gestión de préstamos y devoluciones con historial por lector/a.
- Recomendaciones personalizadas por historial, género, autor, temas y extensión.
- Asistente conversacional con detección de intención en español.
- Perfil lector generado por IA: páginas, géneros favoritos y resumen narrativo.
- Alta de nuevos libros desde la interfaz.
- Diseño responsive con navegación móvil, estados vacíos y avisos accesibles.
- IA 100 % local y determinista: sin API keys, sin envío de datos a terceros.

## Stack

| Capa | Tecnología |
| --- | --- |
| Frontend | HTML5, CSS3 y JavaScript vanilla |
| Backend | Python 3 + Flask |
| API | REST/JSON |
| Base de datos | SQLite |
| IA | TF-IDF + similitud coseno + reglas de intención (Python estándar) |
| Testing | `unittest` + verificación E2E con Playwright/Edge |

## Arquitectura

```text
browser (HTML/CSS/JS)
        │  fetch / JSON
        ▼
Flask API (app.py)
        │
        ├── database.py ── SQLite (data/library.db)
        │      libros, préstamos, estadísticas
        │
        └── ai_engine.py ── recomendador + asistente
               TF-IDF, coseno, historial, intención
```

### Archivos principales

```text
biblioteca-ia/
├── app.py                  # Factory Flask, validación y endpoints REST
├── database.py             # Esquema, semillas, consultas y transacciones
├── ai_engine.py            # Recomendaciones, insights y chat
├── static/
│   ├── index.html          # Interfaz de una sola página
│   ├── styles.css          # Sistema visual responsive
│   ├── app.js              # Estado, renderizado y llamadas a la API
│   └── favicon.svg
├── tests/test_api.py       # 9 pruebas de integración con base de datos temporal
├── docs/AGENT_LOG.md       # Proceso de desarrollo asistido por IA
└── requirements.txt
```

## Cómo ejecutar

Requisitos: Python 3.10 o superior.

```powershell
cd biblioteca-ia
python -m pip install -r requirements.txt
python app.py
```

Abre <http://127.0.0.1:5050>. La base de datos y los 16 libros de ejemplo se crean automáticamente en `data/library.db` durante el primer arranque.

Para usar otro puerto:

```powershell
$env:PORT = "8080"
python app.py
```

## Pruebas

```powershell
python -m unittest discover -s tests -v
```

La suite cubre catálogo, filtros, validación, creación de libros, préstamo/devolución, conflictos de disponibilidad, recomendaciones, insights y el asistente.

## API REST

| Método | Ruta | Descripción |
| --- | --- | --- |
| `GET` | `/api/health` | Estado del servicio y del motor de IA |
| `GET` | `/api/books?q=&genre=&availability=&sort=` | Catálogo filtrado |
| `GET` | `/api/books/<id>` | Ficha completa de un libro |
| `POST` | `/api/books` | Añadir un libro |
| `GET` | `/api/genres` | Géneros disponibles |
| `GET` | `/api/stats` | Métricas de la biblioteca |
| `GET` | `/api/loans?borrower=&active=1` | Historial de préstamos |
| `POST` | `/api/books/<id>/borrow` | Prestar un libro a un lector/a |
| `POST` | `/api/books/<id>/return` | Devolver un libro |
| `GET` | `/api/recommendations?borrower=&q=&limit=` | Recomendaciones personalizadas |
| `GET` | `/api/insights?borrower=` | Perfil lector generado por IA |
| `POST` | `/api/assistant` | Conversación con el bibliotecario IA |
| `GET` | `/api/assistant/suggestions` | Sugerencias iniciales del chat |

Ejemplos:

```powershell
# Préstamo
Invoke-RestMethod -Method Post `
  -Uri http://127.0.0.1:5050/api/books/1/borrow `
  -ContentType "application/json" `
  -Body '{"borrower":"Clara Montes"}'

# Asistente
Invoke-RestMethod -Method Post `
  -Uri http://127.0.0.1:5050/api/assistant `
  -ContentType "application/json" `
  -Body '{"message":"Recomiéndame algo de ciencia ficción","borrower":"Clara Montes"}'
```

## Cómo funciona la IA

1. **Vectorización de contenido.** Cada libro se convierte en un vector TF-IDF a partir de título, autoría, género, etiquetas y descripción. Se normalizan acentos y se eliminan palabras vacías en español.
2. **Perfil lector.** Los préstamos del lector/a ponderan los vectores de las obras que ha explorado. Así se detectan temas, atmósferas y autores afines.
3. **Ranking.** La puntuación combina similitud coseno, preferencia de género, valoración media, popularidad y novedad. Solo se recomiendan títulos disponibles que el lector/a no haya tomado ya.
4. **Comprensión de la petición.** El chat extrae intención, género, autoría, título, extensión y filtros temporales. Con eso responde y adjunta fichas de libros.
5. **Insights.** El perfil narrativo resume páginas, géneros dominantes, autores recurrentes y la lectura mejor valorada.

El motor no usa modelos generativos ni llamadas de red. Es reproducible, auditable y funciona sin conexión.

## Decisiones y límites

- La identidad es un nombre guardado en `localStorage`; no hay autenticación. Es suficiente para una demo y evita fricción.
- SQLite mantiene el proyecto autocontenido y permite transacciones fiables con un índice único de préstamo activo.
- El frontend no usa frameworks para mantener el despliegue simple.
- La IA es local y basada en contenido, no semántica profunda. No “inventa” datos: solo reordena y explica el catálogo real.
- En producción se añadirían autenticación, hashing de datos personales, migraciones y un servidor WSGI.

## Desarrollo asistido por IA

El proyecto se construyó siguiendo un flujo de agente en cinco fases —planificación, diseño, implementación, prueba/depuración y documentación—. El registro completo de decisiones, hallazgos y verificaciones está en [`docs/AGENT_LOG.md`](docs/AGENT_LOG.md).
