"use client";

import type { Data } from "plotly.js";
import { PlotlyChart } from "@/components/PlotlyChart";
import { AUTORES_MULTIREVISTA } from "@/lib/narrativa27";

// Azul claro (2 revistas) -> teja oscuro (6 revistas).
const COLOR_MIN = { r: 0x45, g: 0xd2, b: 0xff };
const COLOR_MAX = { r: 0x9a, g: 0x2a, b: 0x00 };

function interpolarColor(valor: number, min: number, max: number) {
  const t = max === min ? 0 : (valor - min) / (max - min);
  const r = Math.round(COLOR_MIN.r + (COLOR_MAX.r - COLOR_MIN.r) * t);
  const g = Math.round(COLOR_MIN.g + (COLOR_MAX.g - COLOR_MIN.g) * t);
  const b = Math.round(COLOR_MIN.b + (COLOR_MAX.b - COLOR_MIN.b) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

const ORDENADO = [...AUTORES_MULTIREVISTA].sort((a, b) => b.revistas - a.revistas);
const VALORES = ORDENADO.map((a) => a.revistas);
const MIN = Math.min(...VALORES);
const MAX = Math.max(...VALORES);

export function GraficoMultirevista() {
  const data: Data[] = [
    {
      type: "bar",
      orientation: "h",
      x: ORDENADO.map((a) => a.revistas),
      y: ORDENADO.map((a) => a.autor),
      marker: { color: ORDENADO.map((a) => interpolarColor(a.revistas, MIN, MAX)) },
      hovertemplate: "%{y} · %{x} revistas<extra></extra>",
    },
  ];

  return (
    <PlotlyChart
      data={data}
      layout={{
        xaxis: { title: { text: "Número de revistas" } },
        yaxis: { autorange: "reversed", automargin: true },
        margin: { l: 180, r: 30, t: 20, b: 50 },
        shapes: [
          {
            type: "line",
            xref: "x",
            x0: 1,
            x1: 1,
            yref: "paper",
            y0: 0,
            y1: 1,
            line: { color: "#A1A1AA", dash: "dash", width: 1.5 },
          },
        ],
        annotations: [
          {
            x: 1,
            xref: "x",
            y: 1,
            yref: "paper",
            yanchor: "bottom",
            text: "Publicó en una sola revista",
            showarrow: false,
            font: { size: 11, color: "#71717A" },
          },
        ],
      }}
    />
  );
}
