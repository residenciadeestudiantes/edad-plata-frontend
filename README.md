# Edad de Plata — Hemeroteca digital (frontend)

Frontend en Next.js (App Router) de la hemeroteca digital de revistas culturales de la Edad de Plata española. Consume el backend Strapi del repo hermano [`edad-plata-backend`](https://github.com/residenciadeestudiantes/edad-plata-backend).

## Páginas

- `/revistas` — listado de publicaciones
- `/revistas/[slug]` y `/revistas/[slug]/numeros/[numero_orden]` — detalle de revista y número, con índice de artículos y visor de facsímil en PDF
- `/articulos/[slug]` — detalle de artículo
- `/autores` y `/autores/[slug]` — listado y detalle de autores, con filtro por revista
- `/buscar` — buscador avanzado de artículos (texto, revista, autor, rango de años)
- `/analisis` — análisis filológico y estadístico (modo investigación, acceso restringido): concordancias, búsqueda morfológica, estilométrico, innovación estilística, cadenas léxicas, nubes de palabras y análisis de publicidad. Metodología completa en [`docs/analisis-cientifico.md`](https://github.com/residenciadeestudiantes/edad-plata-backend/blob/develop/docs/analisis-cientifico.md) del backend.

## Desarrollo

```bash
npm install
npm run dev
```

Por defecto espera el backend Strapi en `http://localhost:1337` (configurable con `NEXT_PUBLIC_STRAPI_URL`). Necesitas el [backend](https://github.com/residenciadeestudiantes/edad-plata-backend) arrancado en paralelo para tener datos.

## Contribuir

El repo es público: para proponer un cambio, haz un fork, trabaja en una rama `feature/<nombre>` a partir de `develop`, y abre un PR contra `develop` (no contra `main`). Ver [GIT_FLOW.md](./GIT_FLOW.md) para el flujo de ramas completo.
