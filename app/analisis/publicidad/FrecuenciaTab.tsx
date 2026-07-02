"use client";

import { useState } from "react";
import { PlotlyChart } from "@/components/PlotlyChart";
import { COLORES_NUBE_AZUL, NubeIndividual } from "@/components/NubePalabrasComparativa";
import { getPublicidadFrecuencia, type PublicidadFrecuenciaResponse } from "@/lib/api";

type Status = "idle" | "loading" | "success" | "error";

interface RevistaOpcion {
  slug: string;
  titulo: string;
}

export function FrecuenciaTab({ revistas }: { revistas: RevistaOpcion[] }) {
  const [status, setStatus] = useState<Status>("idle");
  const [data, setData] = useState<PublicidadFrecuenciaResponse | null>(null);
  const [revistaSlug, setRevistaSlug] = useState("");
  const [año, setAño] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [revistasConAnuncios, setRevistasConAnuncios] = useState<Set<string> | null>(null);

  async function cargar(revista: string, añoFiltro: string) {
    setStatus("loading");
    setErrorMessage(null);

    try {
      const res = await getPublicidadFrecuencia(
        revista || undefined,
        añoFiltro ? Number(añoFiltro) : undefined
      );
      setData(res);
      setStatus("success");
      // Captura la lista completa de revistas con anuncios en la primera carga sin filtro de año
      if (!añoFiltro) {
        setRevistasConAnuncios(new Set(res.por_revista.map((r) => r.slug)));
      }
    } catch (error) {
      console.error("Error al calcular el análisis de frecuencia publicitaria", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No se ha podido completar el análisis. Inténtalo de nuevo más tarde."
      );
      setStatus("error");
    }
  }

  function handleRevistaChange(value: string) {
    setRevistaSlug(value);
    cargar(value, año);
  }

  function handleAñoChange(value: string) {
    setAño(value);
    cargar(revistaSlug, value);
  }

  if (status === "idle") {
    return (
      <button
        type="button"
        onClick={() => cargar("", "")}
        className="inline-flex w-fit items-center gap-2 text-sm font-medium text-azul transition-colors hover:underline dark:text-azul-claro"
      >
        <span aria-hidden="true">☁</span>
        Mostrar análisis de frecuencia y distribución
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {status === "loading" && (
        <div className="flex flex-col items-center justify-center gap-3 py-6 text-center text-sm font-light text-zinc-500">
          <p>Calculando...</p>
          <div className="h-1.5 w-full max-w-md overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
            <div className="h-full w-1/3 animate-pulse rounded-full bg-azul dark:bg-azul-claro" />
          </div>
        </div>
      )}

      {status === "error" && errorMessage && (
        <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
      )}

      {status === "success" && data && (
        <>
          <p className="max-w-3xl text-sm font-light text-zinc-600 dark:text-zinc-400">
            {data.total_anuncios} anuncios en español detectados en todo el corpus.
            {(revistaSlug || año) && (
              <>
                {" "}Mostrando las palabras más frecuentes de{" "}
                {data.total_anuncios_filtrados} anuncio
                {data.total_anuncios_filtrados === 1 ? "" : "s"} con los filtros
                seleccionados.
              </>
            )}
          </p>

          <div className="flex flex-wrap gap-4">
            <div className="flex flex-col gap-1.5 sm:w-56">
              <label htmlFor="frecuencia-revista" className="text-sm font-medium">
                Acotar a una revista
              </label>
              <select
                id="frecuencia-revista"
                value={revistaSlug}
                onChange={(event) => handleRevistaChange(event.target.value)}
                className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              >
                <option value="">Todas las revistas</option>
                {revistas
                  .filter((r) => !revistasConAnuncios || revistasConAnuncios.has(r.slug))
                  .map((revista) => (
                    <option key={revista.slug} value={revista.slug}>
                      {revista.titulo}
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5 sm:w-40">
              <label htmlFor="frecuencia-año" className="text-sm font-medium">
                Acotar a un año
              </label>
              <select
                id="frecuencia-año"
                value={año}
                onChange={(event) => handleAñoChange(event.target.value)}
                className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              >
                <option value="">Todos los años</option>
                {data.por_año.map((entry) => (
                  <option key={entry.año} value={entry.año}>
                    {entry.año}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col items-center gap-2 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800">
            <NubeIndividual
              nombre="Palabras más frecuentes"
              palabras={data.palabras}
              colores={COLORES_NUBE_AZUL}
              width={640}
              height={340}
            />
          </div>

          {!año && (
            <section>
              <h3 className="mb-2 font-medium">Anuncios por año</h3>
              <div className="h-96 w-full rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800">
                <PlotlyChart
                  data={[
                    {
                      type: "bar",
                      x: data.por_año.map((a) => a.año),
                      y: data.por_año.map((a) => a.num_anuncios),
                      marker: { color: "#3838BD" },
                    },
                  ]}
                  layout={{
                    margin: { l: 50, r: 20, t: 10, b: 60 },
                    xaxis: { title: { text: "Año" }, dtick: 1, tickformat: "d" },
                    yaxis: { title: { text: "Anuncios" }, dtick: 5 },
                  }}
                />
              </div>
            </section>
          )}

          <section>
            <h3 className="mb-2 font-medium">
              Anuncios por revista{año ? ` (${año})` : ""}
            </h3>
            <div className="h-80 w-full rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800">
              <PlotlyChart
                data={[
                  {
                    type: "bar",
                    orientation: "h",
                    x: [...data.por_revista].reverse().map((r) => r.num_anuncios),
                    y: [...data.por_revista].reverse().map((r) => r.revista),
                    marker: { color: "#3838BD" },
                  },
                ]}
                layout={{
                  margin: { l: 180, r: 20, t: 10, b: 40 },
                  xaxis: { title: { text: "Anuncios" } },
                }}
              />
            </div>
          </section>
        </>
      )}
    </div>
  );
}
