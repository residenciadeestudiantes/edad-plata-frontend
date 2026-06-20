"use client";

import type { Data } from "plotly.js";
import { PlotlyChart } from "@/components/PlotlyChart";
import { DERIVA_ESTILISTCA } from "@/lib/narrativa27";

export function GraficoDeriva27() {
  const data: Data[] = DERIVA_ESTILISTCA.map((autor) => ({
    type: "scatter",
    mode: "lines+markers",
    name: autor.autor,
    x: autor.trayectoria.map((p) => p.año),
    y: autor.trayectoria.map((p) => p.distancia),
    line: { color: autor.color, width: 3 },
    marker: { color: autor.color, size: 8 },
    hovertemplate: `${autor.autor} · %{x}: distancia %{y:.2f}<extra></extra>`,
  }));

  return (
    <PlotlyChart
      data={data}
      layout={{
        xaxis: { title: { text: "Año" }, range: [1918, 1937] },
        yaxis: { title: { text: "Distancia a la norma" }, range: [0, 1] },
        margin: { l: 60, r: 20, t: 20, b: 45 },
        shapes: [
          {
            type: "rect",
            xref: "paper",
            x0: 0,
            x1: 1,
            yref: "y",
            y0: 0,
            y1: 0.3,
            fillcolor: "#F5F5F0",
            line: { width: 0 },
            layer: "below",
          },
          {
            type: "line",
            xref: "paper",
            x0: 0,
            x1: 1,
            yref: "y",
            y0: 0.5,
            y1: 0.5,
            line: { color: "#A1A1AA", dash: "dash", width: 1.5 },
          },
        ],
        annotations: [
          {
            xref: "paper",
            x: 0.01,
            y: 0.3,
            xanchor: "left",
            yanchor: "bottom",
            text: "Norma del corpus",
            showarrow: false,
            font: { size: 11, color: "#71717A" },
          },
          {
            xref: "paper",
            x: 0.99,
            y: 0.5,
            xanchor: "right",
            yanchor: "bottom",
            text: "Umbral de singularidad",
            showarrow: false,
            font: { size: 11, color: "#71717A" },
          },
        ],
      }}
    />
  );
}
