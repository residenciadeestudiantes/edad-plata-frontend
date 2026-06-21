"use client";

import { useState } from "react";
import Image from "next/image";
import { getStrapiMediaUrl, type StrapiMedia } from "@/lib/api";

function MainImage({ imagen, alt }: { imagen: StrapiMedia; alt: string }) {
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
    <div className="relative aspect-[4/3] overflow-hidden rounded-lg">
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
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const valid = imagenes.filter((imagen) => getStrapiMediaUrl(imagen.url));
  if (valid.length === 0) return null;

  const [first, ...rest] = valid;
  const open = openIndex !== null ? valid[openIndex] : null;
  const openImageUrl = open ? getStrapiMediaUrl(open.url) : null;

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <button
        type="button"
        onClick={() => setOpenIndex(0)}
        className="w-full cursor-zoom-in text-left"
        aria-label="Ampliar imagen"
      >
        <MainImage imagen={first} alt={alt} />
      </button>

      {rest.length > 0 && (
        <div className="grid w-full grid-cols-3 gap-2">
          {rest.map((imagen, i) => {
            const thumbUrl = getStrapiMediaUrl(imagen.url);
            if (!thumbUrl) return null;

            return (
              <button
                key={imagen.id}
                type="button"
                onClick={() => setOpenIndex(i + 1)}
                aria-label="Ampliar imagen"
                className="relative aspect-square cursor-zoom-in overflow-hidden rounded-md border border-white/10"
              >
                <Image
                  src={thumbUrl}
                  alt={imagen.alternativeText ?? alt}
                  fill
                  sizes="120px"
                  className="object-cover"
                />
              </button>
            );
          })}
        </div>
      )}

      {open && openImageUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-negro/90 p-6"
          onClick={() => setOpenIndex(null)}
        >
          <button
            type="button"
            onClick={() => setOpenIndex(null)}
            aria-label="Cerrar"
            className="absolute right-4 top-4 text-3xl text-white transition-opacity hover:opacity-75"
          >
            ×
          </button>
          <Image
            src={openImageUrl}
            alt={open.alternativeText ?? alt}
            width={open.width ?? 1200}
            height={open.height ?? 900}
            className="max-h-[90vh] w-auto max-w-full rounded-lg object-contain"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
