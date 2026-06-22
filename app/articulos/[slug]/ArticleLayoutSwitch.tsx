"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import { getStrapiMediaUrl, type StrapiMedia } from "@/lib/api";
import { ArticleGallery } from "./ArticleGallery";

const TIPOGRAFIA_TEXTO =
  "flex flex-col gap-4 text-[1.05rem] leading-relaxed font-light text-zinc-700 dark:text-zinc-300";

// Alterna entre dos formas de leer el artículo:
// - Por defecto: el texto ocupa todo el ancho y una miniatura de la primera
//   imagen queda a la derecha, con un botón para pasar a la otra vista.
// - "Ver con original": la disposición previa (galería grande y fija a la
//   derecha, texto a la izquierda), con un botón para volver.
// El texto llega como `children` ya renderizado (Server Component), así que
// solo cambia el contenedor que lo envuelve, no el HTML del propio artículo.
export function ArticleLayoutSwitch({
  imagenes,
  alt,
  children,
}: {
  imagenes: StrapiMedia[];
  alt: string;
  children: ReactNode;
}) {
  const [vistaOriginal, setVistaOriginal] = useState(false);
  const valid = imagenes.filter((imagen) => getStrapiMediaUrl(imagen.url));

  if (valid.length === 0) {
    return <div className={`max-w-[680px] ${TIPOGRAFIA_TEXTO}`}>{children}</div>;
  }

  if (vistaOriginal) {
    return (
      <div className="flex flex-col gap-4">
        <button
          type="button"
          onClick={() => setVistaOriginal(false)}
          className="self-start text-sm font-medium text-teja hover:underline dark:text-teja-claro"
        >
          ‹ Ver con texto en pantalla completa
        </button>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] lg:gap-16">
          <div className="order-1 lg:order-2 lg:sticky lg:top-8 lg:self-start">
            <div className="flex flex-col items-center gap-4 rounded-lg border border-teja bg-teja p-6">
              <ArticleGallery imagenes={imagenes} alt={alt} />
            </div>
          </div>

          <div className={`order-2 max-w-[680px] lg:order-1 ${TIPOGRAFIA_TEXTO}`}>
            {children}
          </div>
        </div>
      </div>
    );
  }

  const primeraUrl = getStrapiMediaUrl(valid[0].url);

  return (
    <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
      <div className={`flex-1 ${TIPOGRAFIA_TEXTO}`}>{children}</div>

      <div className="flex flex-shrink-0 flex-col items-center gap-2 sm:w-44">
        {primeraUrl && (
          <button
            type="button"
            onClick={() => setVistaOriginal(true)}
            aria-label="Ver con original"
            className="relative aspect-[3/4] w-full overflow-hidden rounded-lg border border-teja"
          >
            <Image
              src={primeraUrl}
              alt={alt}
              fill
              sizes="180px"
              className="object-cover"
            />
          </button>
        )}
        <button
          type="button"
          onClick={() => setVistaOriginal(true)}
          className="text-sm font-medium text-teja hover:underline dark:text-teja-claro"
        >
          Ver con original
        </button>
      </div>
    </div>
  );
}
