"use client";

import { useEffect, useState } from "react";
import { PlotlyChart } from "@/components/PlotlyChart";
import {
  getInnovacionEstilistica,
  type InnovacionEstilisticaResponse,
} from "@/lib/api";

type Status = "loading" | "success" | "error";

type Tendencia = "Innovador" | "Estable" | "Convergente";

const COLOR_TENDENCIA: Record<Tendencia, string> = {
  Innovador: "#DA3C00",
  Estable: "#71717A",
  Convergente: "#3838BD",
};

function calcularTendencia(inicial: number, final: number): Tendencia {
  const diferencia = final - inicial;
  if (diferencia > 0.2) return "Innovador";
  if (Math.abs(diferencia) < 0.1) return "Estable";
  if (diferencia < 0) return "Convergente";
  return "Estable";
}

export function InnovacionClient() {
  const [status, setStatus] = useState<Status>("loading");
  const [data, setData] = useState<InnovacionEstilisticaResponse | null>(null);

  useEffect(() => {
    getInnovacionEstilistica()
      .then((res) => {
        setData(res);
        setStatus("success");
      })
      .catch((error) => {
        console.error("Error al cargar innovación estilística", error);
        setStatus("error");
      });
  }, []);

  return (
    <div className="flex flex-col gap-8">
      <div className="rounded-md border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm text-yellow-800 dark:border-yellow-700 dark:bg-yellow-950 dark:text-yellow-200">
        Visualización de demostración con datos de ejemplo. En producción los
        datos se calcularán sobre el corpus real.
      </div>

      <div className="border-l-4 border-teja pl-4">
        <p className="max-w-3xl font-light text-zinc-600 dark:text-zinc-400">
          Este análisis mide la deriva estilística de cada autor a lo largo
          del tiempo respecto a la norma del corpus. La norma se calcula como
          el centroide TF-IDF del conjunto de todos los autores. La distancia
          al centroide indica cuánto se aleja el estilo de un autor de la
          media: valores cercanos a 0 indican alineación con la norma
          dominante; valores cercanos a 1 indican una voz singular y
          diferenciada. Siguiendo la evolución temporal se puede observar si
          un autor convergió hacia la norma o se alejó progresivamente de
          ella, lo que es un indicador de innovación estilística.
        </p>
      </div>

      {status === "loading" && (
        <p className="text-sm font-light text-zinc-500">Cargando…</p>
      )}

      {status === "error" && (
        <p className="text-sm text-red-600 dark:text-red-400">
          No se ha podido cargar la demostración. Inténtalo de nuevo más
          tarde.
        </p>
      )}

      {status === "success" && data && (
        <>
          <section>
            <div className="h-[36rem] w-full rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800">
              <PlotlyChart
                data={data.autores.map((autor) => ({
                  type: "scatter",
                  mode: "lines+markers",
                  name: autor.nombre,
                  x: autor.trayectoria.map((p) => p.año),
                  y: autor.trayectoria.map((p) => p.distancia),
                  line: { color: autor.color },
                  marker: { color: autor.color, size: 8 },
                  hovertemplate: `${autor.nombre} · %{x}: distancia %{y:.2f}<extra></extra>`,
                }))}
                layout={{
                  title: {
                    text: "Deriva estilística respecto a la norma del corpus (demostración)",
                  },
                  margin: { l: 60, r: 30, t: 60, b: 50 },
                  xaxis: {
                    title: { text: "Año de publicación" },
                    range: [1918, 1936],
                  },
                  yaxis: {
                    title: { text: "Distancia a la norma del corpus" },
                    range: [0, 1],
                  },
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
                      text: "Zona de norma",
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
            </div>
          </section>

          <section>
            <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
              <table className="w-full text-left text-sm">
                <thead className="bg-gris-claro text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
                  <tr>
                    <th className="px-4 py-2 font-medium">Autor</th>
                    <th className="px-4 py-2 font-medium">
                      Distancia inicial
                    </th>
                    <th className="px-4 py-2 font-medium">Distancia final</th>
                    <th className="px-4 py-2 font-medium">Tendencia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {data.autores.map((autor) => {
                    const inicial = autor.trayectoria[0]?.distancia ?? 0;
                    const final =
                      autor.trayectoria[autor.trayectoria.length - 1]
                        ?.distancia ?? 0;
                    const tendencia = calcularTendencia(inicial, final);

                    return (
                      <tr key={autor.nombre}>
                        <td className="px-4 py-2 font-light">
                          {autor.nombre}
                        </td>
                        <td className="px-4 py-2 font-light">
                          {inicial.toFixed(2)}
                        </td>
                        <td className="px-4 py-2 font-light">
                          {final.toFixed(2)}
                        </td>
                        <td
                          className="px-4 py-2 font-medium"
                          style={{ color: COLOR_TENDENCIA[tendencia] }}
                        >
                          {tendencia}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
