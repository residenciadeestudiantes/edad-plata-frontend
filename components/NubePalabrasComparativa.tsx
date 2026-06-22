"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import type { PalabraFrecuencia } from "@/lib/api";

// react-d3-cloud usa el DOM (d3-cloud) para calcular el layout, así que solo
// puede cargarse en el cliente.
const WordCloud = dynamic(() => import("react-d3-cloud"), { ssr: false });

const COLORES_AUTOR1 = ["#DA3C00", "#FF7D45", "#B82E00"];
const COLORES_AUTOR2 = ["#3838BD", "#6B6BE0", "#26268A"];

interface NubeIndividualProps {
  nombre: string;
  palabras: PalabraFrecuencia[];
  colores: string[];
  width: number;
  height: number;
}

function NubeIndividual({ nombre, palabras, colores, width, height }: NubeIndividualProps) {
  return (
    <div className="flex flex-1 flex-col items-center gap-2">
      <p className="font-medium text-negro dark:text-blanco">{nombre}</p>
      {palabras.length === 0 ? (
        <p className="text-sm text-zinc-500">
          Texto insuficiente para generar una nube de palabras.
        </p>
      ) : (
        // react-d3-cloud solo pone `viewBox` en el <svg>, sin atributos
        // width/height: sin un contenedor con tamaño explícito el SVG se
        // renderiza a 0×0.
        <div style={{ width, height }}>
          <WordCloud
            data={palabras}
            width={width}
            height={height}
            font="Inter"
            fontWeight={(word) => (word.value > 5 ? "bold" : "normal")}
            fontSize={(word) => Math.max(12, Math.min(50, word.value * 4))}
            rotate={() => (Math.random() > 0.7 ? 90 : 0)}
            padding={3}
            fill={(_word: unknown, index: number) => colores[index % colores.length]}
          />
        </div>
      )}
    </div>
  );
}

interface NubePalabrasComparativaProps {
  nombreAutor1: string;
  nombreAutor2: string;
  palabrasAutor1: PalabraFrecuencia[];
  palabrasAutor2: PalabraFrecuencia[];
}

export function NubePalabrasComparativa({
  nombreAutor1,
  nombreAutor2,
  palabrasAutor1,
  palabrasAutor2,
}: NubePalabrasComparativaProps) {
  const [anchoVentana, setAnchoVentana] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth : 1024
  );

  useEffect(() => {
    function handleResize() {
      setAnchoVentana(window.innerWidth);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const esMovil = anchoVentana < 640;
  const width = esMovil ? 320 : 420;
  const height = esMovil ? 240 : 320;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-center gap-6 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 sm:flex-row sm:items-start sm:justify-around">
        <NubeIndividual
          nombre={nombreAutor1}
          palabras={palabrasAutor1}
          colores={COLORES_AUTOR1}
          width={width}
          height={height}
        />
        <NubeIndividual
          nombre={nombreAutor2}
          palabras={palabrasAutor2}
          colores={COLORES_AUTOR2}
          width={width}
          height={height}
        />
      </div>
      <p className="max-w-3xl text-center text-xs text-zinc-500 dark:text-zinc-400">
        Las palabras más frecuentes en el corpus de cada autor (tamaño
        proporcional a su frecuencia), excluidas las palabras vacías salvo
        que se haya marcado &ldquo;Incluir palabras funcionales&rdquo;.
      </p>
    </div>
  );
}
