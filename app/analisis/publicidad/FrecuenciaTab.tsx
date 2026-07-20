"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { GuardarAnalisis } from "@/components/GuardarAnalisis";
import { LoaderAnalisis } from "@/components/LoaderAnalisis";
import { PlotlyChart } from "@/components/PlotlyChart";
import { COLORES_NUBE_AZUL, NubeIndividual } from "@/components/NubePalabrasComparativa";
import {
  getPublicidadFrecuencia,
  getPublicidadPublicaciones,
  type PublicidadFrecuenciaResponse,
  type PublicidadPublicacion,
} from "@/lib/api";
import { useProgresoSimulado } from "@/lib/useProgresoSimulado";

type Status = "idle" | "loading" | "success" | "error";

interface RevistaOpcion {
  slug: string;
  titulo: string;
}

export function FrecuenciaTab({ revistas: _revistas }: { revistas: RevistaOpcion[] }) {
  const [status, setStatus] = useState<Status>("idle");
  const progreso = useProgresoSimulado(status === "loading");
  const [data, setData] = useState<PublicidadFrecuenciaResponse | null>(null);
  const [revistaSlug, setRevistaSlug] = useState("");
  const [año, setAño] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // Revistas con anuncios, cargadas aparte (no dependen del propio análisis)
  // para poder mostrar el filtro de revista antes de calcular nada.
  const [revistasConAnuncios, setRevistasConAnuncios] = useState<PublicidadPublicacion[]>([]);

  useEffect(() => {
    getPublicidadPublicaciones()
      .then((r) => setRevistasConAnuncios(r.publicaciones))
      .catch(() => {});
  }, []);

  // Reabrir un análisis guardado desde Mis Proyectos: /analisis/publicidad?
  // tab=frecuencia&revista=...&año=... prefija los filtros y carga el
  // análisis automáticamente.
  const searchParams = useSearchParams();
  useEffect(() => {
    if (searchParams.get("tab") !== "frecuencia") return;
    const revistaUrl = searchParams.get("revista") ?? "";
    const añoUrl = searchParams.get("año") ?? "";
    if (!revistaUrl && !añoUrl) return;

    setRevistaSlug(revistaUrl);
    setAño(añoUrl);
    cargar(revistaUrl, añoUrl);
    // Solo al montar: es una prefijación desde la URL.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const filtros = (
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
          {revistasConAnuncios.map((revista) => (
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
        <input
          id="frecuencia-año"
          type="number"
          inputMode="numeric"
          value={año}
          placeholder="Todos los años"
          onChange={(event) => handleAñoChange(event.target.value)}
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>
    </div>
  );

  if (status === "idle") {
    return (
      <div className="flex flex-col gap-4">
        {filtros}
        <button
          type="button"
          onClick={() => cargar(revistaSlug, año)}
          className="inline-flex w-fit items-center gap-2 text-sm font-medium text-azul transition-colors hover:underline dark:text-azul-claro"
        >
          <span aria-hidden="true">☁</span>
          Mostrar análisis de frecuencia y distribución
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {status === "loading" && <LoaderAnalisis progreso={progreso} mensaje="Calculando…" />}

      {status === "error" && errorMessage && (
        <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
      )}

      {status === "success" && data && (
        <>
          <div className="flex justify-end">
            <GuardarAnalisis
              tipo="publicidad-frecuencia"
              parametros={{
                tab: "frecuencia",
                ...(revistaSlug ? { revista: revistaSlug } : {}),
                ...(año ? { año } : {}),
              }}
              titulo="Publicidad: frecuencia y distribución"
            />
          </div>

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

          {filtros}

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
                  yaxis: { ticksuffix: "   " },
                }}
              />
            </div>
          </section>
        </>
      )}
    </div>
  );
}
