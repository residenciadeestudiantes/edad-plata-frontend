"use client";

import { useState } from "react";
import { AuthorCombobox } from "@/components/AuthorCombobox";
import { Button } from "@/components/Button";
import { PlotlyChart } from "@/components/PlotlyChart";
import { getInnovacionEstilistica, type InnovacionEstilisticaResponse } from "@/lib/api";

type Status = "idle" | "loading" | "success" | "error";
type Modo = "prosa" | "poesia";

type Tendencia = "Innovador" | "Estable" | "Convergente";

const COLOR_TENDENCIA: Record<Tendencia, string> = {
  Innovador: "#DA3C00",
  Estable: "#71717A",
  Convergente: "#3838BD",
};

const NUM_SELECTORES = 4;

function calcularTendencia(inicial: number, final: number): Tendencia {
  const diferencia = final - inicial;
  if (diferencia > 0.5) return "Innovador";
  if (Math.abs(diferencia) <= 0.3) return "Estable";
  if (diferencia < -0.3) return "Convergente";
  return "Estable";
}

export function InnovacionClient() {
  const [slugsSeleccionados, setSlugsSeleccionados] = useState<string[]>(
    Array(NUM_SELECTORES).fill("")
  );
  const [modo, setModo] = useState<Modo>("prosa");
  const [status, setStatus] = useState<Status>("idle");
  const [data, setData] = useState<InnovacionEstilisticaResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  function handleLimpiar() {
    setSlugsSeleccionados(Array(NUM_SELECTORES).fill(""));
    setStatus("idle");
    setData(null);
    setErrorMessage(null);
  }

  function handleModo(nuevoModo: Modo) {
    setModo(nuevoModo);
    setStatus("idle");
    setData(null);
    setErrorMessage(null);
  }

  async function handleAnalizar() {
    if (!puedeAnalizar) return;

    setStatus("loading");
    setErrorMessage(null);

    try {
      const res = await getInnovacionEstilistica(seleccionados, modo);
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
      <div className="flex flex-col gap-4 border-l-4 border-azul pl-4">
        <p className="max-w-3xl font-light text-zinc-600 dark:text-zinc-400">
          Mide cómo evoluciona el estilo de un autor a lo largo del tiempo en
          relación con la norma del corpus. La norma se calcula como el
          centroide TF-IDF de todos los autores publicados; cada punto de la
          trayectoria es el texto de ese autor en un año concreto, expresado
          como z-score: cuántas desviaciones típicas se aleja del autor medio.
          Puedes analizar hasta cuatro autores simultáneamente y comparar sus
          trayectorias en prosa o en poesía por separado.
        </p>

        <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm">
          <div className="flex flex-col gap-2">
            <span className="font-medium text-zinc-500 dark:text-zinc-400">Gráfico</span>
            <div className="flex flex-col gap-1 font-light text-zinc-500 dark:text-zinc-400">
              <span>
                <span className="inline-block h-3 w-5 rounded-sm bg-zinc-200 align-middle dark:bg-zinc-700" />{" "}
                Zona de norma (μ ± σ): aquí se sitúa el 68 % de los autores del corpus
              </span>
              <span>
                <span className="mr-1 font-mono text-zinc-400">- -</span>
                Umbral de singularidad (μ + 2σ): por encima, el 2,5 % más distintivo
              </span>
              <span>
                <span className="mr-1 font-mono text-zinc-400">···</span>
                Línea de norma exacta (μ = 0 en z-score)
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="font-medium text-zinc-500 dark:text-zinc-400">Tendencia</span>
            <div className="flex flex-col gap-1 font-light">
              <span style={{ color: COLOR_TENDENCIA["Innovador"] }}>
                ↗ Innovador — el z-score sube más de 0,5σ entre el primer y el último año
              </span>
              <span style={{ color: COLOR_TENDENCIA["Estable"] }}>
                → Estable — variación inferior a 0,3σ
              </span>
              <span style={{ color: COLOR_TENDENCIA["Convergente"] }}>
                ↘ Convergente — el z-score baja más de 0,3σ (el autor se acerca a la norma)
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-negro">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Modo:</span>
          <div className="flex overflow-hidden rounded-md border border-zinc-300 dark:border-zinc-700">
            {(["prosa", "poesia"] as Modo[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => handleModo(m)}
                className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                  modo === m
                    ? "bg-azul text-white dark:bg-azul-claro dark:text-negro"
                    : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                }`}
              >
                {m === "prosa" ? "Prosa" : "Poesía"}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: NUM_SELECTORES }).map((_, indice) => (
            <div key={indice} className="flex flex-col gap-1.5">
              <label htmlFor={`autor-${indice}`} className="text-sm font-medium">
                Autor {indice + 1}
                {indice > 0 && " (opcional)"}
              </label>
              <AuthorCombobox
                id={`autor-${indice}`}
                value={slugsSeleccionados[indice]}
                onChange={(slug) => handleSeleccion(indice, slug)}
                placeholder={indice === 0 ? "Selecciona un autor…" : "Ninguno"}
              />
            </div>
          ))}
        </div>

        {hayDuplicados && (
          <p className="text-sm text-red-600 dark:text-red-400">
            Selecciona autores distintos en cada campo.
          </p>
        )}

        <div className="flex gap-3">
          <Button variant="azul" onClick={handleAnalizar} disabled={!puedeAnalizar}>
            Analizar
          </Button>
          <Button variant="secondary-azul" onClick={handleLimpiar}>
            Limpiar
          </Button>
        </div>

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
                        text: modo === "poesia"
                          ? "Deriva estilística en poesía (z-score respecto a la norma)"
                          : "Deriva estilística en prosa (z-score respecto a la norma)",
                      },
                      margin: { l: 60, r: 30, t: 60, b: 50 },
                      xaxis: {
                        title: { text: "Año de publicación" },
                        dtick: 1,
                        tickformat: "d",
                      },
                      yaxis: {
                        title: { text: "Desviaciones típicas respecto a la norma (z-score)" },
                        zeroline: true,
                        zerolinecolor: "#D4D4D8",
                      },
                      shapes: [
                        {
                          type: "rect",
                          xref: "paper",
                          x0: 0,
                          x1: 1,
                          yref: "y",
                          y0: -1,
                          y1: 1,
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
                          y0: 2,
                          y1: 2,
                          line: { color: "#A1A1AA", dash: "dash", width: 1.5 },
                        },
                      ],
                      annotations: [
                        {
                          xref: "paper",
                          x: 0.01,
                          y: 1,
                          xanchor: "left",
                          yanchor: "bottom",
                          text: "Zona de norma (μ ± σ)",
                          showarrow: false,
                          font: { size: 11, color: "#71717A" },
                        },
                        {
                          xref: "paper",
                          x: 0.99,
                          y: 2,
                          xanchor: "right",
                          yanchor: "bottom",
                          text: "Umbral de singularidad (μ + 2σ)",
                          showarrow: false,
                          font: { size: 11, color: "#71717A" },
                        },
                      ],
                    }}
                  />
                </div>
                <p className="mt-2 text-xs font-light text-zinc-400 dark:text-zinc-500">
                  Norma del corpus ({data.norma.num_autores} autores,{" "}
                  {data.norma.num_articulos} textos): distancia media{" "}
                  μ = {data.norma.media.toFixed(3)}, σ = {data.norma.std.toFixed(3)}
                </p>
              </section>

              <section>
                <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gris-claro text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
                      <tr>
                        <th className="px-4 py-2 font-medium">Autor</th>
                        <th className="px-4 py-2 font-medium">Artículos</th>
                        <th className="px-4 py-2 font-medium">
                          Z-score inicial
                        </th>
                        <th className="px-4 py-2 font-medium">Z-score final</th>
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
