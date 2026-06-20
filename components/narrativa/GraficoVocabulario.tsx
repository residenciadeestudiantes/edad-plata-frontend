"use client";

import { useState } from "react";
import type { Data } from "plotly.js";
import { PlotlyChart } from "@/components/PlotlyChart";
import { VOCABULARIO_QUINQUENIOS } from "@/lib/narrativa27";

const COLOR_QUINQUENIO = ["#DA3C00", "#3838BD", "#008867"];

export function GraficoVocabulario() {
  const [seleccionado, setSeleccionado] = useState(0);
  const grupo = VOCABULARIO_QUINQUENIOS[seleccionado];
  const color = COLOR_QUINQUENIO[seleccionado];

  const data: Data[] = [
    {
      type: "bar",
      x: grupo.terminos.map((t) => t.palabra),
      y: grupo.terminos.map((t) => t.frecuencia),
      marker: { color },
      hovertemplate: "%{x} · %{y} apariciones<extra></extra>",
    },
  ];

  return (
    <div className="flex h-full w-full flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {VOCABULARIO_QUINQUENIOS.map((q, i) => (
          <button
            key={q.periodo}
            type="button"
            onClick={() => setSeleccionado(i)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              i === seleccionado
                ? "border-transparent text-white"
                : "border-zinc-300 text-zinc-600 hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-400"
            }`}
            style={i === seleccionado ? { backgroundColor: COLOR_QUINQUENIO[i] } : undefined}
          >
            {q.periodo}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1">
        <PlotlyChart
          data={data}
          layout={{
            yaxis: { title: { text: "Frecuencia" } },
            margin: { l: 50, r: 20, t: 20, b: 60 },
            transition: { duration: 400, easing: "cubic-in-out" },
          }}
        />
      </div>
    </div>
  );
}
