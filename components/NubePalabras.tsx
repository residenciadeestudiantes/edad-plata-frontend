"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { contarPalabrasFiltradas, extraerPalabras } from "@/lib/stopwords";

// react-d3-cloud usa el DOM (d3-cloud) para calcular el layout, así que solo
// puede cargarse en el cliente.
const WordCloud = dynamic(() => import("react-d3-cloud"), { ssr: false });

const COLORES = ["#DA3C00", "#3838BD", "#008867", "#DD158B", "#FF7D45"];
const MIN_PALABRAS = 100;

interface NubePalabrasProps {
  textoHtml: string;
}

export function NubePalabras({ textoHtml }: NubePalabrasProps) {
  const [visible, setVisible] = useState(false);
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

  const palabras = useMemo(() => extraerPalabras(textoHtml), [textoHtml]);
  const totalFiltradas = useMemo(
    () => contarPalabrasFiltradas(textoHtml),
    [textoHtml]
  );

  const esMovil = anchoVentana < 640;
  const width = esMovil ? 340 : 700;
  const height = esMovil ? 250 : 350;

  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={() => setVisible((value) => !value)}
        className="inline-flex w-fit items-center gap-2 text-sm font-medium text-teja transition-colors hover:underline dark:text-teja-claro"
      >
        <span aria-hidden="true">☁</span>
        {visible ? "Ocultar nube de palabras" : "Mostrar nube de palabras"}
      </button>

      {visible && (
        <div className="flex animate-[fadeIn_0.3s_ease-out] flex-col items-center gap-2">
          {totalFiltradas < MIN_PALABRAS ? (
            <p className="text-zinc-500">
              El artículo no tiene suficiente texto para generar una nube de
              palabras.
            </p>
          ) : (
            <>
              {/* react-d3-cloud solo pone `viewBox` en el <svg>, sin
                  atributos width/height: sin un contenedor con tamaño
                  explícito el SVG se renderiza a 0×0. */}
              <div style={{ width, height }}>
                <WordCloud
                  data={palabras}
                  width={width}
                  height={height}
                  font="Inter"
                  fontWeight={(word) => (word.value > 5 ? "bold" : "normal")}
                  fontSize={(word) => Math.max(14, Math.min(60, word.value * 4))}
                  rotate={() => (Math.random() > 0.7 ? 90 : 0)}
                  padding={4}
                  fill={(_word: unknown, index: number) => COLORES[index % COLORES.length]}
                />
              </div>
              <p className="max-w-md text-center text-xs text-zinc-500 dark:text-zinc-400">
                Las palabras más frecuentes del artículo, excluidas las
                palabras vacías (artículos, preposiciones, pronombres y
                verbos auxiliares).
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
