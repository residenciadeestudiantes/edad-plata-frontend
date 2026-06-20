"use client";

import type { Data } from "plotly.js";
import { PlotlyChart } from "@/components/PlotlyChart";
import { AUTORES_BURBUJAS } from "@/lib/narrativa27";

// Posición vertical sin significado estadístico: solo separa visualmente
// las burbujas. Es determinista (depende del índice), no aleatoria en cada
// render, para que el gráfico no "salte" al recargar.
function posicionFija(indice: number) {
  const x = Math.sin(indice * 999) * 10000;
  return (x - Math.floor(x)) * 10;
}

const TAMAÑO_MAXIMO = Math.max(...AUTORES_BURBUJAS.map((a) => a.articulos));

export function GraficoBurbujas27() {
  const data: Data[] = [
    {
      type: "scatter",
      mode: "text+markers",
      x: AUTORES_BURBUJAS.map((a) => a.articulos),
      y: AUTORES_BURBUJAS.map((_, i) => posicionFija(i)),
      text: AUTORES_BURBUJAS.map((a) => a.autor),
      textposition: "top center",
      textfont: { size: 10 },
      marker: {
        size: AUTORES_BURBUJAS.map((a) => a.articulos),
        sizemode: "area",
        sizeref: (2 * TAMAÑO_MAXIMO) / 40 ** 2,
        color: AUTORES_BURBUJAS.map((a) => a.color),
      },
      hovertemplate: AUTORES_BURBUJAS.map(
        (a) => `${a.autor} · ${a.articulos} artículos · ${a.revista}<extra></extra>`
      ),
    },
  ];

  return (
    <PlotlyChart
      data={data}
      layout={{
        xaxis: { title: { text: "Número de artículos" } },
        yaxis: { visible: false },
        margin: { l: 30, r: 30, t: 40, b: 50 },
      }}
    />
  );
}
