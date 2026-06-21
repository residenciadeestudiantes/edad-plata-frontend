"use client";

import { useEffect, useMemo, useState } from "react";
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

const COLOR_MEDIA = "#0A0A0A";

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
  const [autorSeleccionado, setAutorSeleccionado] = useState("");

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

  // Media del corpus: para cada año, el promedio de la distancia de todos
  // los autores (todos comparten el mismo conjunto de años en este
  // prototipo). Sirve de referencia para comparar a un autor concreto.
  const mediaPorAño = useMemo(() => {
    if (!data) return [];

    const sumaPorAño = new Map<number, { suma: number; n: number }>();
    for (const autor of data.autores) {
      for (const punto of autor.trayectoria) {
        const entry = sumaPorAño.get(punto.año) ?? { suma: 0, n: 0 };
        entry.suma += punto.distancia;
        entry.n += 1;
        sumaPorAño.set(punto.año, entry);
      }
    }

    return [...sumaPorAño.entries()]
      .map(([año, { suma, n }]) => ({ año, distancia: suma / n }))
      .sort((a, b) => a.año - b.año);
  }, [data]);

  const autorActivo = data?.autores.find((a) => a.nombre === autorSeleccionado) ?? null;

  return (
    <div className="flex flex-col gap-8">
      <div className="rounded-md border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm text-yellow-800 dark:border-yellow-700 dark:bg-yellow-950 dark:text-yellow-200">
        Visualización de demostración con datos de ejemplo. En producción los
        datos se calcularán sobre el corpus real.
      </div>

      <div className="border-l-4 border-azul pl-4">
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
          <div className="flex flex-col gap-1.5 sm:max-w-xs">
            <label htmlFor="autor" className="text-sm font-medium">
              Analizar un autor respecto a la media
            </label>
            <select
              id="autor"
              value={autorSeleccionado}
              onChange={(event) => setAutorSeleccionado(event.target.value)}
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            >
              <option value="">Todos los autores</option>
              {data.autores.map((autor) => (
                <option key={autor.nombre} value={autor.nombre}>
                  {autor.nombre}
                </option>
              ))}
            </select>
          </div>

          {autorActivo && (
            <p className="text-sm font-light text-zinc-600 dark:text-zinc-400">
              {(() => {
                const finalAutor =
                  autorActivo.trayectoria[autorActivo.trayectoria.length - 1]?.distancia ?? 0;
                const finalMedia = mediaPorAño[mediaPorAño.length - 1]?.distancia ?? 0;
                const diferencia = finalAutor - finalMedia;
                const sentido = diferencia > 0 ? "por encima de" : "por debajo de";

                return (
                  <>
                    En el último año registrado,{" "}
                    <span className="font-medium text-negro dark:text-blanco">
                      {autorActivo.nombre}
                    </span>{" "}
                    está{" "}
                    <span className="font-medium" style={{ color: autorActivo.color }}>
                      {Math.abs(diferencia).toFixed(2)}
                    </span>{" "}
                    puntos {sentido} la media del corpus.
                  </>
                );
              })()}
            </p>
          )}

          <section>
            <div className="h-[36rem] w-full rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800">
              <PlotlyChart
                data={[
                  ...data.autores.map((autor) => {
                    const atenuado = autorActivo !== null && autor.nombre !== autorActivo.nombre;
                    return {
                      type: "scatter" as const,
                      mode: "lines+markers" as const,
                      name: autor.nombre,
                      x: autor.trayectoria.map((p) => p.año),
                      y: autor.trayectoria.map((p) => p.distancia),
                      line: { color: autor.color, width: atenuado ? 1 : 3 },
                      marker: { color: autor.color, size: atenuado ? 5 : 9 },
                      opacity: atenuado ? 0.25 : 1,
                      hovertemplate: `${autor.nombre} · %{x}: distancia %{y:.2f}<extra></extra>`,
                    };
                  }),
                  {
                    type: "scatter" as const,
                    mode: "lines" as const,
                    name: "Media del corpus",
                    x: mediaPorAño.map((p) => p.año),
                    y: mediaPorAño.map((p) => p.distancia),
                    line: { color: COLOR_MEDIA, width: 2, dash: "dot" as const },
                    hovertemplate: "Media del corpus · %{x}: distancia %{y:.2f}<extra></extra>",
                  },
                ]}
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
                      <tr
                        key={autor.nombre}
                        className={
                          autorActivo && autor.nombre === autorActivo.nombre
                            ? "bg-azul/5 dark:bg-azul-claro/10"
                            : undefined
                        }
                      >
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
