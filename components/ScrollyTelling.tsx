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
        <h1 className="font-playfair text-4xl font-bold text-teja sm:text-5xl">
          {titulo}
        </h1>
        <p className="max-w-2xl font-light text-zinc-500 dark:text-zinc-400">
          {subtitulo}
        </p>
      </header>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
        <div className="flex flex-col">
          {capitulos.map((capitulo, index) => (
            <div
              key={capitulo.id}
              data-step={index}
              className="scrolly-step flex min-h-[80vh] flex-col justify-center gap-4 py-12"
            >
              <span className="font-titulo text-sm font-bold text-teja dark:text-teja-claro">
                {String(capitulo.numero).padStart(2, "0")}
              </span>
              <h2 className="font-playfair text-2xl font-bold text-teja sm:text-3xl dark:text-teja-claro">
                {capitulo.titulo}
              </h2>
              <p className="max-w-[60ch] text-[1.1rem] leading-[1.8] font-light text-zinc-700 dark:text-zinc-300">
                {capitulo.texto}
              </p>
              {capitulo.nota && (
                <p className="text-sm italic text-zinc-400 dark:text-zinc-500">
                  {capitulo.nota}
                </p>
              )}

              {/* En móvil no hay panel sticky: cada paso muestra su propio
                  gráfico justo debajo del texto. */}
              <div className="mt-2 h-[380px] w-full lg:hidden">
                {capitulo.grafico}
              </div>
            </div>
          ))}
        </div>

        <div className="hidden lg:block">
          <div className="lg:sticky lg:top-[20vh]">
            <div className="relative h-[60vh] w-full rounded-lg border border-zinc-200 bg-white dark:border-zinc-800">
              {capitulos.map((capitulo, index) => (
                <div
                  key={capitulo.id}
                  aria-hidden={index !== capituloActivo}
                  className={`absolute inset-0 p-4 transition-opacity duration-[400ms] ${
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
        </div>
      </div>
    </div>
  );
}
