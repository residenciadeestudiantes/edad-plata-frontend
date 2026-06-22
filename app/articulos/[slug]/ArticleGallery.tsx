"use client";

import { useState } from "react";
import Image from "next/image";
import { getStrapiMediaUrl, type StrapiMedia } from "@/lib/api";

function ImagenGaleria({ imagen, alt }: { imagen: StrapiMedia; alt: string }) {
  const imageUrl = getStrapiMediaUrl(imagen.url);
  if (!imageUrl) return null;

  if (imagen.width && imagen.height) {
    return (
      <Image
        src={imageUrl}
        alt={imagen.alternativeText ?? alt}
        width={imagen.width}
        height={imagen.height}
        sizes="(min-width: 1024px) 50vw, 100vw"
        className="h-auto w-full rounded-lg"
      />
    );
  }

  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg">
      <Image
        src={imageUrl}
        alt={imagen.alternativeText ?? alt}
        fill
        sizes="(min-width: 1024px) 50vw, 100vw"
        className="object-contain"
      />
    </div>
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
      <button
        type="button"
        onClick={() => setAmpliada(true)}
        className="w-full cursor-zoom-in text-left"
        aria-label="Ampliar imagen"
      >
        <ImagenGaleria imagen={actual} alt={alt} />
      </button>

      {hayVarias && (
        <div className="flex w-full items-center justify-between gap-3">
          <button
            type="button"
            onClick={anterior}
            aria-label="Imagen anterior"
            className="rounded-full border border-teja px-3 py-1.5 text-sm text-teja transition-colors hover:bg-teja hover:text-white dark:border-teja-claro dark:text-teja-claro dark:hover:bg-teja-claro dark:hover:text-negro"
          >
            ‹ Anterior
          </button>
          <span className="text-sm font-light text-zinc-500 dark:text-zinc-400">
            {indice + 1} / {valid.length}
          </span>
          <button
            type="button"
            onClick={siguiente}
            aria-label="Imagen siguiente"
            className="rounded-full border border-teja px-3 py-1.5 text-sm text-teja transition-colors hover:bg-teja hover:text-white dark:border-teja-claro dark:text-teja-claro dark:hover:bg-teja-claro dark:hover:text-negro"
          >
            Siguiente ›
          </button>
        </div>
      )}

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
