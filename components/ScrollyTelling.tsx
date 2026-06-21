"use client";

import { useEffect, useRef, useState } from "react";
import type { ScrollamaInstance } from "scrollama";

export interface Capitulo {
  id: string;
  numero: number;
  titulo: string;
  texto: string;
  nota?: string;
  grafico: React.ReactNode;
}

interface ScrollyTellingProps {
  titulo: string;
  subtitulo: string;
  capitulos: Capitulo[];
}

function Encabezado({ capitulo }: { capitulo: Capitulo }) {
  return (
    <>
      <span className="font-titulo text-sm font-bold text-azul dark:text-azul-claro">
        {String(capitulo.numero).padStart(2, "0")}
      </span>
      <h2 className="font-playfair text-2xl font-bold text-azul sm:text-3xl dark:text-azul-claro">
        {capitulo.titulo}
      </h2>
    </>
  );
}

function Texto({ capitulo }: { capitulo: Capitulo }) {
  return (
    <>
      <p className="text-[1.05rem] leading-[1.8] font-light text-zinc-700 dark:text-zinc-300">
        {capitulo.texto}
      </p>
      {capitulo.nota && (
        <p className="text-sm italic text-zinc-400 dark:text-zinc-500">{capitulo.nota}</p>
      )}
    </>
  );
}

export function ScrollyTelling({ titulo, subtitulo, capitulos }: ScrollyTellingProps) {
  const [capituloActivo, setCapituloActivo] = useState(0);
  const contenedorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let scroller: ScrollamaInstance | null = null;
    let cancelado = false;

    Promise.all([import("intersection-observer"), import("scrollama")]).then(
      ([, scrollamaModule]) => {
        if (cancelado || !contenedorRef.current) return;

        const scrollama = scrollamaModule.default;
        scroller = scrollama();
        scroller
          .setup({
            step: ".scrolly-step",
            offset: 0.5,
          })
          .onStepEnter((response) => {
            setCapituloActivo(response.index);
          });
      }
    );

    function handleResize() {
      scroller?.resize();
    }
    window.addEventListener("resize", handleResize);

    return () => {
      cancelado = true;
      window.removeEventListener("resize", handleResize);
      scroller?.destroy();
    };
  }, [capitulos.length]);

  return (
    <div ref={contenedorRef} className="flex flex-col gap-10">
      <header className="flex flex-col gap-3">
        <h1 className="font-playfair text-4xl font-bold text-azul sm:text-5xl">
          {titulo}
        </h1>
        <p className="max-w-2xl font-light text-zinc-500 dark:text-zinc-400">
          {subtitulo}
        </p>
      </header>

      {/* Escritorio: columna de texto estrecha (no tapa nada) y el
          gráfico sticky ocupando todo el resto del ancho disponible,
          cambiando con fade-in según el paso activo. */}
      <div className="hidden grid-cols-[360px_1fr] gap-12 lg:grid">
        <div className="flex flex-col">
          {capitulos.map((capitulo, index) => (
            <div
              key={capitulo.id}
              data-step={index}
              className="scrolly-step flex min-h-[80vh] flex-col justify-center gap-4 py-12"
            >
              <Encabezado capitulo={capitulo} />
              <Texto capitulo={capitulo} />
            </div>
          ))}
        </div>

        <div className="sticky top-[10vh] h-[78vh] w-full overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800">
          {capitulos.map((capitulo, index) => (
            <div
              key={capitulo.id}
              aria-hidden={index !== capituloActivo}
              className={`absolute inset-0 p-6 transition-opacity duration-[400ms] ${
                index === capituloActivo
                  ? "opacity-100"
                  : "pointer-events-none opacity-0"
              }`}
            >
              {capitulo.grafico}
            </div>
          ))}
        </div>
      </div>

      {/* Móvil: sin superposición ni sticky. Cada capítulo muestra su
          propio gráfico a ancho completo, con el texto debajo. */}
      <div className="flex flex-col lg:hidden">
        {capitulos.map((capitulo) => (
          <div
            key={capitulo.id}
            className="flex flex-col gap-6 border-t border-zinc-200 py-12 first:border-t-0 dark:border-zinc-800"
          >
            <div className="flex flex-col gap-2">
              <Encabezado capitulo={capitulo} />
            </div>
            <div className="h-[340px] w-full rounded-lg border border-zinc-200 bg-white dark:border-zinc-800">
              {capitulo.grafico}
            </div>
            <div className="flex flex-col gap-3">
              <Texto capitulo={capitulo} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
