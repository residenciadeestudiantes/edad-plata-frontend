"use client";

import { useState } from "react";
import Image from "next/image";
import { getStrapiMediaUrl, type StrapiMedia } from "@/lib/api";

// Caja de altura fija (al menos 3/4 de la pantalla): la imagen se ajusta
// dentro manteniendo su proporción (object-contain), así que el ancho
// efectivo siempre es proporcional a su aspecto real en vez de estirarse o
// recortarse. El fondo negro lo pone el panel contenedor (ver más abajo),
// para que la imagen y la barra de controles se vean como un único bloque.
function ImagenGaleria({ imagen, alt }: { imagen: StrapiMedia; alt: string }) {
  const imageUrl = getStrapiMediaUrl(imagen.url);
  if (!imageUrl) return null;

  return (
    <div className="relative h-[75vh] w-full">
      <Image
        src={imageUrl}
        alt={imagen.alternativeText ?? alt}
        fill
        sizes="(min-width: 1024px) 65vw, 100vw"
        className="object-contain"
      />
    </div>
  );
}

function IconoZoom() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className="h-4 w-4"
    >
      <circle cx="11" cy="11" r="7" />
      <path strokeLinecap="round" d="M21 21l-4.35-4.35M11 8v6M8 11h6" />
    </svg>
  );
}

export function ArticleGallery({
  imagenes,
  alt,
}: {
  imagenes: StrapiMedia[];
  alt: string;
}) {
  const valid = imagenes.filter((imagen) => getStrapiMediaUrl(imagen.url));
  const [indice, setIndice] = useState(0);
  const [ampliada, setAmpliada] = useState(false);

  if (valid.length === 0) return null;

  const actual = valid[indice];
  const actualUrl = getStrapiMediaUrl(actual.url);
  const hayVarias = valid.length > 1;

  function anterior() {
    setIndice((i) => (i - 1 + valid.length) % valid.length);
  }

  function siguiente() {
    setIndice((i) => (i + 1) % valid.length);
  }

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <div className="w-full overflow-hidden rounded-lg border border-teja bg-transparent">
        <button
          type="button"
          onClick={() => setAmpliada(true)}
          className="block w-full cursor-zoom-in"
          aria-label="Ampliar imagen"
        >
          <ImagenGaleria imagen={actual} alt={alt} />
        </button>

        <div className="flex items-center justify-between gap-3 bg-teja px-4 py-3">
          <button
            type="button"
            onClick={anterior}
            disabled={!hayVarias}
            aria-label="Imagen anterior"
            className="rounded-full border border-white px-3 py-1.5 text-sm text-white transition-colors hover:bg-white hover:text-negro disabled:pointer-events-none disabled:opacity-30"
          >
            ‹ Anterior
          </button>

          <div className="flex items-center gap-2">
            {hayVarias && (
              <span className="text-sm font-light text-white/70">
                {indice + 1} / {valid.length}
              </span>
            )}
            <button
              type="button"
              onClick={() => setAmpliada(true)}
              aria-label="Aumentar la página"
              title="Aumentar la página"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-white text-white transition-colors hover:bg-white hover:text-negro"
            >
              <IconoZoom />
            </button>
          </div>

          <button
            type="button"
            onClick={siguiente}
            disabled={!hayVarias}
            aria-label="Imagen siguiente"
            className="rounded-full border border-white px-3 py-1.5 text-sm text-white transition-colors hover:bg-white hover:text-negro disabled:pointer-events-none disabled:opacity-30"
          >
            Siguiente ›
          </button>
        </div>
      </div>

      {ampliada && actualUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-negro/90 p-6"
          onClick={() => setAmpliada(false)}
        >
          <button
            type="button"
            onClick={() => setAmpliada(false)}
            aria-label="Cerrar"
            className="absolute right-4 top-4 text-3xl text-white transition-opacity hover:opacity-75"
          >
            ×
          </button>

          {hayVarias && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                anterior();
              }}
              aria-label="Imagen anterior"
              className="absolute left-4 top-1/2 -translate-y-1/2 text-4xl text-white transition-opacity hover:opacity-75"
            >
              ‹
            </button>
          )}

          <Image
            src={actualUrl}
            alt={actual.alternativeText ?? alt}
            width={actual.width ?? 1200}
            height={actual.height ?? 900}
            className="max-h-[90vh] w-auto max-w-full rounded-lg object-contain"
            onClick={(event) => event.stopPropagation()}
          />

          {hayVarias && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                siguiente();
              }}
              aria-label="Imagen siguiente"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-4xl text-white transition-opacity hover:opacity-75"
            >
              ›
            </button>
          )}

          {hayVarias && (
            <span className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-white/80">
              {indice + 1} / {valid.length}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
