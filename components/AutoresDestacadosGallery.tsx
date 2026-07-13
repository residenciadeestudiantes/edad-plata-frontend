"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Card } from "@/components/Card";
import { getStrapiMediaUrl, type Author } from "@/lib/api";

function IconoAnterior() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function IconoSiguiente() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

function AutorCard({ autor }: { autor: Author }) {
  const numArticulos = autor.articles?.length ?? 0;
  return (
    <Card
      href={`/autores/${autor.slug}`}
      imageUrl={getStrapiMediaUrl(autor.imagen?.url)}
      imageAlt={autor.nombre}
      title={autor.nombre}
      meta={`${numArticulos} artículo${numArticulos === 1 ? "" : "s"}`}
    />
  );
}

function enPares<T>(items: T[]): T[][] {
  const pares: T[][] = [];
  for (let i = 0; i < items.length; i += 2) pares.push(items.slice(i, i + 2));
  return pares;
}

// Galería de autores destacados: en móvil, slider con scroll-snap (dos
// autores por slide) con flechas superpuestas que indican que se puede
// desplazar; a partir de `sm`, rejilla fija sin scroll ni flechas.
export function AutoresDestacadosGallery({ autores }: { autores: Author[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const actualizarFlechas = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    actualizarFlechas();
  }, [actualizarFlechas, autores]);

  const desplazar = (direccion: 1 | -1) => {
    scrollRef.current?.scrollBy({ left: direccion * scrollRef.current.clientWidth, behavior: "smooth" });
  };

  if (autores.length === 0) return null;

  return (
    <>
      <div className="relative sm:hidden">
        <div
          ref={scrollRef}
          onScroll={actualizarFlechas}
          className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <div className="flex snap-x snap-mandatory gap-4 scroll-smooth">
            {enPares(autores).map((par, i) => (
              <div key={i} className="grid w-full flex-none snap-start grid-cols-2 gap-4">
                {par.map((autor) => (
                  <AutorCard key={autor.id} autor={autor} />
                ))}
              </div>
            ))}
          </div>
        </div>

        {canPrev && (
          <button
            type="button"
            onClick={() => desplazar(-1)}
            aria-label="Autores anteriores"
            className="absolute top-1/2 left-1 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-negro/60 text-white transition-colors hover:bg-negro"
          >
            <IconoAnterior />
          </button>
        )}
        {canNext && (
          <button
            type="button"
            onClick={() => desplazar(1)}
            aria-label="Más autores"
            className="absolute top-1/2 right-1 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-negro/60 text-white transition-colors hover:bg-negro"
          >
            <IconoSiguiente />
          </button>
        )}
      </div>

      <div className="hidden gap-7 sm:grid sm:grid-cols-4 xl:grid-cols-8">
        {autores.map((autor) => (
          <AutorCard key={autor.id} autor={autor} />
        ))}
      </div>
    </>
  );
}
