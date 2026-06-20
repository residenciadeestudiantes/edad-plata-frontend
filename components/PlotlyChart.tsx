"use client";

import dynamic from "next/dynamic";
import type { Data, Layout } from "plotly.js";

// plotly.js no funciona en el servidor (depende del DOM), así que se carga
// solo en el cliente.
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export function PlotlyChart({
  data,
  layout,
}: {
  data: Data[];
  layout: Partial<Layout>;
}) {
  return (
    <Plot
      data={data}
      layout={{
        autosize: true,
        paper_bgcolor: "#FFFFFF",
        plot_bgcolor: "#FFFFFF",
        font: { family: "Inter, Arial, Helvetica, sans-serif", color: "#0A0A0A" },
        margin: { l: 50, r: 20, t: 20, b: 40 },
        ...layout,
      }}
      config={{ responsive: true, displayModeBar: false }}
      useResizeHandler
      style={{ width: "100%", height: "100%" }}
    />
  );
}
