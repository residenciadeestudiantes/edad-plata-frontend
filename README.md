# Edad de Plata — Hemeroteca digital (frontend)

Frontend en Next.js (App Router) de la hemeroteca digital de revistas culturales de la Edad de Plata española. Consume el backend Strapi del repo hermano [`edad-plata-backend`](https://github.com/residenciadeestudiantes/edad-plata-backend).

## Páginas

- `/revistas` — listado de publicaciones
- `/revistas/[slug]` y `/revistas/[slug]/numeros/[numero_orden]` — detalle de revista y número, con índice de artículos y visor de facsímil en PDF
- `/articulos/[slug]` — detalle de artículo
- `/autores` y `/autores/[slug]` — listado y detalle de autores, con filtro por revista
- `/buscar` — buscador avanzado de artículos (texto, revista, autor, rango de años)
- `/analisis` — análisis filológico: concordancias de una palabra en el corpus, acotable por autor, revista o año

## Desarrollo

```bash
npm install
npm run dev
```

Por defecto espera el backend Strapi en `http://localhost:1337` (configurable con `NEXT_PUBLIC_STRAPI_URL`).

Ver [GIT_FLOW.md](./GIT_FLOW.md) para el flujo de ramas del repo.
