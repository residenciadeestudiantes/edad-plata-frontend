"use client";

import { useState } from "react";
import { PlotlyChart } from "@/components/PlotlyChart";
import { getPublicidadTecnologia, type PublicidadTecnologiaResponse } from "@/lib/api";

type Status = "idle" | "loading" | "success" | "error";

const COLORES_CATEGORIA = ["#DA3C00", "#3838BD", "#008867", "#DD158B", "#CA8A04", "#6b7280"];

export function TecnologiaTab() {
  const [status, setStatus] = useState<Status>("idle");
  const [data, setData] = useState<PublicidadTecnologiaResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function cargar() {
    setStatus("loading");
    setErrorMessage(null);

    try {
      const res = await getPublicidadTecnologia();
      setData(res);
      setStatus("success");
    } catch (error) {
      console.error("Error al calcular la evolución tecnológica en la publicidad", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No se ha podido completar el análisis. Inténtalo de nuevo más tarde."
      );
      setStatus("error");
    }
  }

  if (status === "idle") {
    return (
      <button
        type="button"
        onClick={cargar}
        className="inline-flex w-fit items-center gap-2 text-sm font-medium text-azul transition-colors hover:underline dark:text-azul-claro"
      >
        <span aria-hidden="true">☁</span>
        Mostrar evolución tecnológica e industrial
      </button>
    );
  }

  const categoriasConDatos = data?.categorias.filter((c) => c.serie.length > 0) ?? [];

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
            Número de anuncios distintos (no menciones sueltas) que aluden a
            cada categoría tecnológica, por año, sobre un total de{" "}
            {data.total_anuncios} anuncios en español.
          </p>

          {categoriasConDatos.length === 0 ? (
            <p className="text-sm text-zinc-500">
              No se ha detectado ninguna de las categorías tecnológicas
              curadas en el corpus de anuncios disponible.
            </p>
          ) : (
            <div className="h-[28rem] w-full rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800">
              <PlotlyChart
                data={categoriasConDatos.map((categoria, index) => ({
                  type: "scatter" as const,
                  mode: "lines+markers" as const,
                  name: categoria.categoria,
                  x: categoria.serie.map((p) => p.año),
                  y: categoria.serie.map((p) => p.num_anuncios),
                  line: { color: COLORES_CATEGORIA[index % COLORES_CATEGORIA.length], width: 3 },
                  marker: { color: COLORES_CATEGORIA[index % COLORES_CATEGORIA.length], size: 8 },
                }))}
                layout={{
                  margin: { l: 50, r: 20, t: 20, b: 50 },
                  xaxis: { title: { text: "Año" }, dtick: 1, tickformat: "d" },
                  yaxis: { title: { text: "Anuncios" }, dtick: 1 },
                  legend: { orientation: "h", y: -0.2 },
                }}
              />
            </div>
          )}

          <details className="text-sm text-zinc-500 dark:text-zinc-400">
            <summary className="cursor-pointer font-medium">
              Concepto semántico de cada categoría
            </summary>
            <ul className="mt-2 flex flex-col gap-1">
              {data.categorias.map((categoria) => (
                <li key={categoria.categoria}>
                  <span className="font-medium text-negro dark:text-blanco">
                    {categoria.categoria}:
                  </span>{" "}
                  {categoria.palabras_clave[0]}
                </li>
              ))}
            </ul>
          </details>
        </>
      )}
    </div>
  );
}
