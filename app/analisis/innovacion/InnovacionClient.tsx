"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/Button";
import { PlotlyChart } from "@/components/PlotlyChart";
import {
  getAuthors,
  getInnovacionEstilistica,
  type Author,
  type InnovacionEstilisticaResponse,
} from "@/lib/api";

type Status = "idle" | "loading" | "success" | "error";

type Tendencia = "Innovador" | "Estable" | "Convergente";

const COLOR_TENDENCIA: Record<Tendencia, string> = {
  Innovador: "#DA3C00",
  Estable: "#71717A",
  Convergente: "#3838BD",
};

const NUM_SELECTORES = 4;

function calcularTendencia(inicial: number, final: number): Tendencia {
  const diferencia = final - inicial;
  if (diferencia > 0.2) return "Innovador";
  if (Math.abs(diferencia) < 0.1) return "Estable";
  if (diferencia < 0) return "Convergente";
  return "Estable";
}

export function InnovacionClient() {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [slugsSeleccionados, setSlugsSeleccionados] = useState<string[]>(
    Array(NUM_SELECTORES).fill("")
  );
  const [status, setStatus] = useState<Status>("idle");
  const [data, setData] = useState<InnovacionEstilisticaResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    getAuthors(1, 100)
      .then((res) => setAuthors(res.data))
      .catch(() => {});
  }, []);

  const authorsOrdenados = useMemo(
    () => [...authors].sort((a, b) => a.nombre.localeCompare(b.nombre, "es")),
    [authors]
  );

  const seleccionados = slugsSeleccionados.filter(Boolean);
  const hayDuplicados = new Set(seleccionados).size !== seleccionados.length;
  const puedeAnalizar = seleccionados.length >= 1 && !hayDuplicados && status !== "loading";

  function handleSeleccion(indice: number, slug: string) {
    setSlugsSeleccionados((actual) => {
      const copia = [...actual];
      copia[indice] = slug;
      return copia;
    });
  }

  async function handleAnalizar() {
    if (!puedeAnalizar) return;

    setStatus("loading");
    setErrorMessage(null);

    try {
      const res = await getInnovacionEstilistica(seleccionados);
      setData(res);
      setStatus("success");
    } catch (error) {
      console.error("Error al calcular la innovación estilística", error);
      setErrorMessage(
        "No se ha podido completar el análisis. Inténtalo de nuevo más tarde."
      );
      setStatus("error");
    }
  }

  return (
    <div className="flex flex-col gap-8">
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

      <div className="flex flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-negro">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: NUM_SELECTORES }).map((_, indice) => (
            <div key={indice} className="flex flex-col gap-1.5">
              <label htmlFor={`autor-${indice}`} className="text-sm font-medium">
                Autor {indice + 1}
                {indice > 0 && " (opcional)"}
              </label>
              <select
                id={`autor-${indice}`}
                value={slugsSeleccionados[indice]}
                onChange={(event) => handleSeleccion(indice, event.target.value)}
                className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              >
                <option value="">{indice === 0 ? "Selecciona un autor…" : "Ninguno"}</option>
                {authorsOrdenados.map((author) => (
                  <option key={author.slug} value={author.slug}>
                    {author.nombre}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>

        {hayDuplicados && (
          <p className="text-sm text-red-600 dark:text-red-400">
            Selecciona autores distintos en cada campo.
          </p>
        )}

        <Button
          variant="azul"
          onClick={handleAnalizar}
          disabled={!puedeAnalizar}
          className="self-start"
        >
          Analizar
        </Button>

        {status === "loading" && (
          <div className="flex flex-col items-center justify-center gap-3 py-6 text-center text-sm font-light text-zinc-500">
            <p>Calculando la norma del corpus y las trayectorias...</p>
            <div className="h-1.5 w-full max-w-md overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
              <div className="h-full w-1/3 animate-pulse rounded-full bg-azul dark:bg-azul-claro" />
            </div>
          </div>
        )}
      </div>

      {status === "error" && errorMessage && (
        <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
      )}

      {status === "success" && data && (
        <>
          {data.norma.aviso_pocos_datos && (
            <p className="rounded-md border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm text-yellow-800 dark:border-yellow-700 dark:bg-yellow-950 dark:text-yellow-200">
              {data.norma.aviso_pocos_datos}
            </p>
          )}

          {data.autores.some((autor) => autor.aviso_pocos_datos) && (
            <ul className="flex flex-col gap-1">
              {data.autores
                .filter((autor) => autor.aviso_pocos_datos)
                .map((autor) => (
                  <li
                    key={autor.slug}
                    className="rounded-md border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm text-yellow-800 dark:border-yellow-700 dark:bg-yellow-950 dark:text-yellow-200"
                  >
                    {autor.aviso_pocos_datos}
                  </li>
                ))}
            </ul>
          )}

          {data.autores.every((autor) => autor.trayectoria.length === 0) ? (
            <p className="text-sm font-light text-zinc-500">
              No hay suficientes artículos con año conocido para calcular una
              trayectoria temporal.
            </p>
          ) : (
            <>
              <section>
                <div className="h-[36rem] w-full rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800">
                  <PlotlyChart
                    data={data.autores.map((autor) => ({
                      type: "scatter" as const,
                      mode: "lines+markers" as const,
                      name: autor.nombre,
                      x: autor.trayectoria.map((p) => p.año),
                      y: autor.trayectoria.map((p) => p.distancia),
                      line: { color: autor.color, width: 3 },
                      marker: { color: autor.color, size: 9 },
                      hovertemplate: `${autor.nombre} · %{x}: distancia %{y:.2f}<extra></extra>`,
                    }))}
                    layout={{
                      title: {
                        text: "Deriva estilística respecto a la norma del corpus",
                      },
                      margin: { l: 60, r: 30, t: 60, b: 50 },
                      xaxis: { title: { text: "Año de publicación" } },
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
                        <th className="px-4 py-2 font-medium">Artículos</th>
                        <th className="px-4 py-2 font-medium">
                          Distancia inicial
                        </th>
                        <th className="px-4 py-2 font-medium">Distancia final</th>
                        <th className="px-4 py-2 font-medium">Tendencia</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                      {data.autores.map((autor) => {
                        if (autor.trayectoria.length === 0) {
                          return (
                            <tr key={autor.slug}>
                              <td className="px-4 py-2 font-light">{autor.nombre}</td>
                              <td className="px-4 py-2 font-light">{autor.num_articulos}</td>
                              <td colSpan={3} className="px-4 py-2 font-light text-zinc-500">
                                Sin datos temporales suficientes
                              </td>
                            </tr>
                          );
                        }

                        const inicial = autor.trayectoria[0].distancia;
                        const final =
                          autor.trayectoria[autor.trayectoria.length - 1].distancia;
                        const tendencia = calcularTendencia(inicial, final);

                        return (
                          <tr key={autor.slug}>
                            <td className="px-4 py-2 font-light">{autor.nombre}</td>
                            <td className="px-4 py-2 font-light">{autor.num_articulos}</td>
                            <td className="px-4 py-2 font-light">{inicial.toFixed(2)}</td>
                            <td className="px-4 py-2 font-light">{final.toFixed(2)}</td>
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
        </>
      )}
    </div>
  );
}
