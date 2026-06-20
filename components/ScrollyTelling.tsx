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
  // Capítulos que ya han entrado en el viewport al menos una vez: una vez
  // revelado un gráfico con fade-in, se queda visible (no vuelve a
  // desaparecer si el usuario sube de nuevo con el scroll).
  const [revelados, setRevelados] = useState<Set<number>>(() => new Set([0]));
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
            setRevelados((previo) => {
              if (previo.has(response.index)) return previo;
              return new Set(previo).add(response.index);
            });
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

      <div className="flex flex-col">
        {capitulos.map((capitulo, index) => (
          <div
            key={capitulo.id}
            data-step={index}
            data-activo={index === capituloActivo}
            className="scrolly-step flex flex-col gap-6 border-t border-zinc-200 py-16 first:border-t-0 dark:border-zinc-800"
          >
            <div className="flex flex-col gap-2">
              <span className="font-titulo text-sm font-bold text-teja dark:text-teja-claro">
                {String(capitulo.numero).padStart(2, "0")}
              </span>
              <h2 className="font-playfair text-2xl font-bold text-teja sm:text-3xl dark:text-teja-claro">
                {capitulo.titulo}
              </h2>
            </div>

            <div
              className={`h-[340px] w-full rounded-lg border border-zinc-200 bg-white transition-opacity duration-[400ms] sm:h-[440px] lg:h-[560px] dark:border-zinc-800 ${
                revelados.has(index) ? "opacity-100" : "opacity-0"
              }`}
            >
              {capitulo.grafico}
            </div>

            <div className="flex flex-col gap-3">
              <p className="max-w-[70ch] text-[1.1rem] leading-[1.8] font-light text-zinc-700 dark:text-zinc-300">
                {capitulo.texto}
              </p>
              {capitulo.nota && (
                <p className="text-sm italic text-zinc-400 dark:text-zinc-500">
                  {capitulo.nota}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
