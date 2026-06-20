"use client";

import type { Data } from "plotly.js";
import { PlotlyChart } from "@/components/PlotlyChart";
import { REVISTAS_TIMELINE } from "@/lib/narrativa27";

export function GraficoTimeline() {
  const data: Data[] = REVISTAS_TIMELINE.map((revista) => ({
    type: "scatter",
    mode: "lines",
    x: [revista.inicio, revista.fin],
    y: [revista.revista, revista.revista],
    line: { color: revista.color, width: 20 },
    showlegend: false,
    hovertemplate: `Revista: ${revista.revista} · ${revista.inicio}-${revista.fin}<extra></extra>`,
  }));

  return (
    <PlotlyChart
      data={data}
      layout={{
        xaxis: { title: { text: "Año" }, range: [1915, 1940] },
        yaxis: {
          categoryorder: "array",
          categoryarray: [...REVISTAS_TIMELINE].reverse().map((r) => r.revista),
          automargin: true,
        },
        margin: { l: 170, r: 30, t: 20, b: 40 },
      }}
    />
  );
}
