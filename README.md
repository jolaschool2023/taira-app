# LitMatch AI — Book Recommendation System

Recomendador de libros por filtrado de contenido (similitud de Jaccard), en una única
página HTML autocontenida. Sin build, sin backend, sin variables de entorno.

## Contenido del repositorio

| Archivo | Descripción |
| --- | --- |
| `book_recommendation_system.html` | La app completa (HTML + CSS + JS) |
| `vercel.json` | Configuración de Vercel: la raíz `/` sirve la app |
| `README.md` | Este documento |
| `.gitignore` | Excluye los archivos locales que no forman parte del deploy |

## Publicación en Vercel (proyecto nuevo)

1. <https://vercel.com/new> → importar `jolaschool2023/taira-app`.
2. Framework Preset: **Other**.
3. Build Command: vacío · Output Directory: vacío · Root Directory: `./`.
4. **Deploy**.

Cada `git push` a `main` vuelve a desplegar automáticamente.

## Si el proyecto ya existe y falló el deploy

Settings → General → **Build & Development Settings**:

- Framework Preset: `Other`
- Build Command: **Override** + dejar vacío
- Output Directory: **Override** + dejar vacío
- Install Command: **Override** + dejar vacío

Luego Deployments → *Redeploy*.

## Desarrollo local

```bash
python -m http.server 8000
# http://localhost:8000/book_recommendation_system.html
```
