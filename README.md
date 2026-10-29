# LitMatch AI — Book Recommendation System

Sistema de recomendación de libros por filtrado de contenido (similitud de Jaccard),
implementado como una única página HTML autocontenida.

- **App:** [book_recommendation_system.html](book_recommendation_system.html)
- **Stack:** HTML5 + Tailwind CSS (CDN) + JavaScript vanilla (sin build, sin backend)
- **Deploy:** Vercel (sitio estático)

## Cómo se sirve

`vercel.json` reescribe la raíz `/` hacia `book_recommendation_system.html`, por lo que
el dominio publicado muestra directamente la app. El resto de archivos del repositorio
sigue accesible en su propia ruta (por ejemplo `/index.html`).

## Desarrollo local

Abre `book_recommendation_system.html` en el navegador, o sirve la carpeta:

```bash
python -m http.server 8000
```

## Publicación en Vercel

1. Importar el repositorio en <https://vercel.com/new>.
2. Framework Preset: **Other**. Build Command: vacío. Output Directory: vacío.
3. Deploy. Cada `git push` a `main` genera un deploy automático.

## Estructura relevante

| Ruta | Descripción |
| --- | --- |
| `book_recommendation_system.html` | App LitMatch AI (página principal publicada) |
| `vercel.json` | Configuración de Vercel (rewrite de la raíz + headers) |
| `biblioteca-ia/` | Proyecto Flask "Lumen" (no se publica en este deploy) |
| `index.html` | Landing del Club de Robótica Escolar |
